"use client";

import { LoaderCircle, MessageCircle, Mic, MicOff, PhoneOff, Sparkles, Volume2, Waves } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  base64ToBytes,
  bytesToBase64,
  GEMINI_INPUT_SAMPLE_RATE,
  mergeTranscript,
  pcm16ToFloat32,
  sampleRateFromMimeType,
  StreamingPcm16Resampler,
} from "@/lib/live-audio";

type VoiceState = "READY" | "CONNECTING" | "LISTENING" | "USER SPEAKING" | "AI THINKING" | "AI SPEAKING" | "MUTED" | "ENDED" | "ERROR";
type TokenResponse = { token?: string; model?: string; error?: string };
type LiveMessage = {
  setupComplete?: Record<string, never>;
  serverContent?: {
    inputTranscription?: { text?: string };
    interimInputTranscription?: { text?: string };
    outputTranscription?: { text?: string };
    modelTurn?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> };
    generationComplete?: boolean;
    turnComplete?: boolean;
    interrupted?: boolean;
    waitingForInput?: boolean;
  };
};

const LIVE_ENDPOINT = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained";

function microphoneErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === "NotAllowedError") return "Microphone access was blocked. Allow microphone access for this site, then try again.";
  if (error instanceof DOMException && error.name === "NotFoundError") return "No microphone was found on this device.";
  if (error instanceof DOMException && error.name === "NotReadableError") return "The microphone is already in use by another app.";
  return error instanceof Error ? error.message : "The live voice call could not start.";
}

export function VoiceDialog({ open, onOpenChange, onSwitchText }: { open: boolean; onOpenChange: (open: boolean) => void; onSwitchText: () => void }) {
  const [state, setState] = useState<VoiceState>("READY");
  const [userTranscript, setUserTranscript] = useState("");
  const [assistantTranscript, setAssistantTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [inputLevel, setInputLevel] = useState(0);
  const [audioSeconds, setAudioSeconds] = useState(0);
  const websocketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const captureNodeRef = useRef<AudioNode | null>(null);
  const silentGainRef = useRef<GainNode | null>(null);
  const playbackSourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const playbackEndRef = useRef(0);
  const turnCompleteRef = useRef(false);
  const setupCompleteRef = useRef(false);
  const mutedRef = useRef(false);
  const closingRef = useRef(false);
  const captureSamplesRef = useRef(0);
  const levelUpdateRef = useRef(0);
  const speechTimerRef = useRef<number | null>(null);

  const stopPlayback = useCallback(() => {
    playbackSourcesRef.current.forEach((source) => {
      try { source.stop(); } catch {}
    });
    playbackSourcesRef.current.clear();
    playbackEndRef.current = audioContextRef.current?.currentTime ?? 0;
  }, []);

  const closeSession = useCallback((notifyServer = true) => {
    closingRef.current = true;
    if (speechTimerRef.current != null) window.clearTimeout(speechTimerRef.current);
    speechTimerRef.current = null;
    const socket = websocketRef.current;
    if (notifyServer && socket?.readyState === WebSocket.OPEN && setupCompleteRef.current) {
      try { socket.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } })); } catch {}
    }
    try { socket?.close(1000, "Call ended"); } catch {}
    websocketRef.current = null;
    captureNodeRef.current?.disconnect();
    sourceNodeRef.current?.disconnect();
    silentGainRef.current?.disconnect();
    captureNodeRef.current = null;
    sourceNodeRef.current = null;
    silentGainRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    stopPlayback();
    const context = audioContextRef.current;
    audioContextRef.current = null;
    if (context && context.state !== "closed") void context.close();
    setupCompleteRef.current = false;
  }, [stopPlayback]);

  const playAudio = useCallback((data: string, mimeType?: string) => {
    const context = audioContextRef.current;
    if (!context || context.state === "closed") return;
    const samples = pcm16ToFloat32(base64ToBytes(data));
    if (!samples.length) return;
    const sampleRate = sampleRateFromMimeType(mimeType);
    const buffer = context.createBuffer(1, samples.length, sampleRate);
    buffer.copyToChannel(samples, 0);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    const startAt = Math.max(context.currentTime + 0.025, playbackEndRef.current);
    playbackEndRef.current = startAt + buffer.duration;
    playbackSourcesRef.current.add(source);
    turnCompleteRef.current = false;
    setState("AI SPEAKING");
    setAudioSeconds((seconds) => seconds + buffer.duration);
    source.onended = () => {
      playbackSourcesRef.current.delete(source);
      if (!playbackSourcesRef.current.size && turnCompleteRef.current && !mutedRef.current && !closingRef.current) setState("LISTENING");
    };
    source.start(startAt);
  }, []);

  const startCapture = useCallback(async (context: AudioContext, stream: MediaStream, socket: WebSocket) => {
    const source = context.createMediaStreamSource(stream);
    const silentGain = context.createGain();
    silentGain.gain.value = 0;
    const resampler = new StreamingPcm16Resampler(context.sampleRate, GEMINI_INPUT_SAMPLE_RATE);
    const processChannel = (channel: Float32Array) => {
      if (mutedRef.current || socket.readyState !== WebSocket.OPEN || !setupCompleteRef.current) return;
      let power = 0;
      for (let index = 0; index < channel.length; index += 1) power += channel[index] * channel[index];
      const rms = Math.sqrt(power / channel.length);
      const now = performance.now();
      if (now - levelUpdateRef.current > 90) {
        setInputLevel(Math.min(1, rms * 8));
        levelUpdateRef.current = now;
      }
      if (rms > 0.018) {
        if (speechTimerRef.current != null) window.clearTimeout(speechTimerRef.current);
        if (!playbackSourcesRef.current.size) setState("USER SPEAKING");
        speechTimerRef.current = window.setTimeout(() => {
          if (!playbackSourcesRef.current.size && !mutedRef.current && !closingRef.current) setState("AI THINKING");
        }, 520);
      }
      const pcm = resampler.process(channel);
      if (!pcm.length) return;
      captureSamplesRef.current += pcm.length / 2;
      socket.send(JSON.stringify({ realtimeInput: { audio: { data: bytesToBase64(pcm), mimeType: `audio/pcm;rate=${GEMINI_INPUT_SAMPLE_RATE}` } } }));
    };

    let captureNode: AudioNode;
    try {
      await context.audioWorklet.addModule("/audio/chinari-mic-processor.js");
      const worklet = new AudioWorkletNode(context, "chinari-mic-processor", { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] });
      worklet.port.onmessage = (event: MessageEvent<ArrayBuffer>) => processChannel(new Float32Array(event.data));
      captureNode = worklet;
    } catch {
      const processor = context.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (event) => processChannel(event.inputBuffer.getChannelData(0));
      captureNode = processor;
    }
    if (closingRef.current) {
      source.disconnect();
      captureNode.disconnect();
      return;
    }
    source.connect(captureNode);
    captureNode.connect(silentGain);
    silentGain.connect(context.destination);
    sourceNodeRef.current = source;
    captureNodeRef.current = captureNode;
    silentGainRef.current = silentGain;
  }, []);

  const startConversation = useCallback(async () => {
    closeSession(false);
    closingRef.current = false;
    mutedRef.current = false;
    captureSamplesRef.current = 0;
    playbackEndRef.current = 0;
    turnCompleteRef.current = false;
    setState("CONNECTING");
    setErrorMessage("");
    setUserTranscript("");
    setAssistantTranscript("");
    setAudioSeconds(0);
    setInputLevel(0);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("This browser does not support microphone capture.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
      if (closingRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      let context: AudioContext;
      try {
        context = new AudioContext({ latencyHint: "interactive", sampleRate: GEMINI_INPUT_SAMPLE_RATE });
      } catch {
        context = new AudioContext({ latencyHint: "interactive" });
      }
      audioContextRef.current = context;
      await context.resume();
      const response = await fetch("/api/voice/token", { method: "POST", cache: "no-store" });
      const credentials = await response.json() as TokenResponse;
      if (!response.ok || !credentials.token || !credentials.model) throw new Error(credentials.error ?? "Could not create a live voice session.");
      if (closingRef.current) return;
      const socket = new WebSocket(`${LIVE_ENDPOINT}?access_token=${encodeURIComponent(credentials.token)}`);
      websocketRef.current = socket;
      socket.onopen = () => socket.send(JSON.stringify({ setup: { model: `models/${credentials.model}` } }));
      socket.onmessage = async (event) => {
        const raw = typeof event.data === "string" ? event.data : await event.data.text();
        const message = JSON.parse(raw) as LiveMessage;
        if (message.setupComplete) {
          setupCompleteRef.current = true;
          void startCapture(context, stream, socket).then(() => {
            if (!closingRef.current) setState("LISTENING");
          }).catch((error: unknown) => {
            if (!closingRef.current) {
              setErrorMessage(microphoneErrorMessage(error));
              setState("ERROR");
            }
          });
        }
        const content = message.serverContent;
        if (!content) return;
        if (content.interimInputTranscription?.text) setUserTranscript(content.interimInputTranscription.text.trim());
        if (content.inputTranscription?.text) setUserTranscript((text) => mergeTranscript(text, content.inputTranscription?.text ?? ""));
        if (content.outputTranscription?.text) setAssistantTranscript((text) => mergeTranscript(text, content.outputTranscription?.text ?? ""));
        for (const part of content.modelTurn?.parts ?? []) if (part.inlineData?.data) playAudio(part.inlineData.data, part.inlineData.mimeType);
        if (content.generationComplete) turnCompleteRef.current = true;
        if (content.interrupted) {
          stopPlayback();
          turnCompleteRef.current = true;
          if (!mutedRef.current) setState("USER SPEAKING");
        }
        if (content.waitingForInput && !mutedRef.current && !playbackSourcesRef.current.size) setState("LISTENING");
        if (content.turnComplete) {
          turnCompleteRef.current = true;
          if (!playbackSourcesRef.current.size && !mutedRef.current) setState("LISTENING");
        }
      };
      socket.onerror = () => {
        if (!closingRef.current) {
          setErrorMessage("The secure Gemini Live connection failed. Check the network and try again.");
          setState("ERROR");
        }
      };
      socket.onclose = (event) => {
        if (!closingRef.current && event.code !== 1000) {
          setErrorMessage(`The live call ended unexpectedly${event.reason ? `: ${event.reason}` : "."}`);
          setState("ERROR");
        }
      };
    } catch (error) {
      closeSession(false);
      closingRef.current = false;
      setErrorMessage(microphoneErrorMessage(error));
      setState("ERROR");
    }
  }, [closeSession, playAudio, startCapture, stopPlayback]);

  const toggleMute = () => {
    const nextMuted = !mutedRef.current;
    mutedRef.current = nextMuted;
    streamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !nextMuted; });
    if (nextMuted) {
      const socket = websocketRef.current;
      if (socket?.readyState === WebSocket.OPEN && setupCompleteRef.current) socket.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
      setInputLevel(0);
      setState("MUTED");
    } else setState("LISTENING");
  };

  const endConversation = () => {
    closeSession();
    setState("ENDED");
    onOpenChange(false);
  };

  useEffect(() => {
    if (open) {
      closingRef.current = false;
      const reset = window.setTimeout(() => {
        setState("READY");
        setErrorMessage("");
        setUserTranscript("");
        setAssistantTranscript("");
      }, 0);
      return () => window.clearTimeout(reset);
    }
    closeSession();
  }, [closeSession, open]);

  const active = !["READY", "ERROR", "ENDED"].includes(state);
  const title = state === "READY" ? "Start a live conversation" : state === "CONNECTING" ? "Connecting securely…" : state === "AI THINKING" ? "Thinking…" : state === "AI SPEAKING" ? "Chinari is speaking" : state === "USER SPEAKING" ? "I can hear you" : state === "MUTED" ? "Microphone muted" : state === "ERROR" ? "Voice call unavailable" : "I’m listening";
  const microphoneStatus = state === "MUTED" ? "Microphone paused" : active && state !== "CONNECTING" ? "Microphone streaming" : "Mic starts on tap";

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="overflow-hidden rounded-[32px] border-0 bg-[#102f24] p-0 text-white sm:max-w-lg"><DialogHeader className="sr-only"><DialogTitle>Chinari live voice assistant</DialogTitle><DialogDescription>Real-time microphone conversation powered by Gemini Live.</DialogDescription></DialogHeader><div className="relative min-h-[650px] p-6 text-center"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(196,91,47,.22),transparent_30%),radial-gradient(circle_at_15%_15%,rgba(255,255,255,.08),transparent_22%)]"/><div className="relative flex min-h-[598px] flex-col items-center"><div className="flex w-full items-center justify-between"><span className="rounded-full bg-emerald-300/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-200">Gemini Live · real audio</span><span className="text-xs font-bold text-white/55">Auto language</span></div><div className="mt-10"><div className={`voice-orb mx-auto grid h-36 w-36 place-items-center rounded-full border border-white/20 ${state === "USER SPEAKING" || state === "AI SPEAKING" ? "is-speaking" : ""}`} style={{ transform: `scale(${1 + inputLevel * 0.055})` }}><div className="grid h-22 w-22 place-items-center rounded-full bg-[#c45b2f] shadow-[0_0_70px_rgba(196,91,47,.55)]">{state === "CONNECTING" ? <LoaderCircle className="animate-spin" size={32}/> : state === "USER SPEAKING" ? <Waves size={34}/> : <Sparkles size={34}/>}</div></div><p className="mt-7 text-xs font-bold uppercase tracking-[.22em] text-[#f2b192]">{state}</p><h2 className="mt-3 font-serif text-4xl">{title}</h2></div><div className="mt-7 grid min-h-[150px] w-full max-w-md gap-3 text-left"><div className="rounded-[18px] bg-white/8 px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-wider text-white/45">You</p><p className="mt-1 min-h-6 text-sm leading-6 text-white/85">{userTranscript || (state === "READY" ? "Your words will appear here as they arrive." : "Listening for your voice…")}</p></div><div className="rounded-[18px] bg-[#f2b192]/10 px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-wider text-[#f2b192]">Chinari</p><p className="mt-1 min-h-6 text-sm leading-6 text-white/85">{errorMessage || assistantTranscript || "I’ll answer aloud in real time."}</p></div></div><div className="mt-auto w-full">{!active && <button onClick={() => void startConversation()} className="mb-5 min-h-11 rounded-full bg-white px-6 text-sm font-bold text-[#15382a]">{state === "ERROR" ? "Try voice again" : "Start live conversation"}</button>}<div className="flex items-center justify-center gap-4"><button onClick={toggleMute} disabled={!active || state === "CONNECTING"} className="grid h-13 w-13 place-items-center rounded-full bg-white/10 disabled:opacity-35" aria-label={state === "MUTED" ? "Unmute microphone" : "Mute microphone"}>{state === "MUTED" ? <MicOff/> : <Mic/>}</button><button onClick={endConversation} className="grid h-16 w-16 place-items-center rounded-full bg-[#c84a3d]" aria-label="End conversation"><PhoneOff/></button><button onClick={() => { closeSession(); onSwitchText(); }} className="grid h-13 w-13 place-items-center rounded-full bg-white/10" aria-label="Switch to text"><MessageCircle/></button></div><div className="mt-5 flex items-center justify-center gap-5 text-xs text-white/45"><span className="inline-flex items-center gap-1"><Volume2 size={13}/>{audioSeconds > 0 ? `${audioSeconds.toFixed(1)}s received` : "Speaker ready"}</span><span className="inline-flex items-center gap-1"><Mic size={13}/>{microphoneStatus}</span></div></div></div></div></DialogContent></Dialog>;
}
