import type { VoiceProvider } from "@/providers/interfaces";

export class DemoVoiceProvider implements VoiceProvider {
  readonly mode = "demo";
  async requestPermission() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return "unavailable" as const;
    try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); stream.getTracks().forEach((track) => track.stop()); return "granted" as const; }
    catch { return "unavailable" as const; }
  }
}

export const demoVoiceProvider = new DemoVoiceProvider();
