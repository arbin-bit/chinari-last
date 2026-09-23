"use client";

import { ArrowUp, Bot, LoaderCircle, MapPinned, Mic2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { ChatMessage, Destination } from "@/types/tourism";

type AIAssistantProps = {
  initialQuestion?: { id:string; text:string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: Destination | null;
  onCommand: (message: string) => string | Promise<string>;
  onVoice: () => void;
};

export function AIAssistant({ open, onOpenChange, context, onCommand, onVoice, initialQuestion }: AIAssistantProps) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: "welcome",
    role: "assistant",
    text: "Namaste! I answer from the supplied Chitwan tourism directory, and I will tell you when fees, hours, access or other details are not confirmed.",
    meta: "Gemini · grounded in 66 supplied tourism records",
  }]);

  const send = async (text = input) => {
    const value = text.trim();
    if (!value || sending) return;

    setInput("");
    setSending(true);
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", text: value },
    ]);

    try {
      const answer = await onCommand(value);
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", text: answer, meta: "Chinari grounded response" },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", text: "I could not reach the assistant just now. Please try again.", meta: "Connection error" },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handledQuestion = useRef<string | null>(null);
  useEffect(() => {
    if(open && initialQuestion && handledQuestion.current !== initialQuestion.id) {
      handledQuestion.current = initialQuestion.id;
      void send(initialQuestion.text);
    }
    // The request ID, not changing chat state, triggers one send.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialQuestion]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-[#1f4d3a]/10 bg-[#f8f4e9] p-0 sm:max-w-[460px]">
        <SheetHeader className="border-b border-[#1f4d3a]/10 p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#15382a] text-white">
              <Bot size={20}/>
            </span>
            <div>
              <SheetTitle className="font-serif text-2xl">Chinari AI</SheetTitle>
              <SheetDescription>{context ? `Ask about ${context.name}` : "Trip-aware tourism assistant"}</SheetDescription>
            </div>
          </div>
          <span className="mt-3 w-fit rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
            Gemini · supplied tourism knowledge
          </span>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-5" aria-live="polite">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[88%] rounded-[22px] p-4 ${message.role === "assistant" ? "bg-white text-[#15382a] shadow-sm" : "ml-auto bg-[#15382a] text-white"}`}
            >
              <p className="text-sm leading-6">{message.text}</p>
              {message.meta && <p className="mt-2 text-[10px] font-bold uppercase tracking-wider opacity-55">{message.meta}</p>}
            </div>
          ))}
          {sending && (
            <div className="flex w-fit items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold shadow-sm">
              <LoaderCircle size={16} className="animate-spin"/>
              Checking the directory…
            </div>
          )}
        </div>

        <div className="border-t border-[#1f4d3a]/10 p-4">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {["Tell me about Jalbire Waterfall", "Which wildlife places are in the directory?", "What is in your directory?"].map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void send(prompt)}
                disabled={sending}
                className="whitespace-nowrap rounded-full bg-[#e7ebdf] px-3 py-2 text-xs font-bold disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2 rounded-[22px] border border-[#1f4d3a]/12 bg-white p-2">
            <button
              type="button"
              onClick={onVoice}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f2e1d5] text-[#c45b2f]"
              aria-label="Open voice conversation"
            >
              <Mic2 size={18}/>
            </button>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void send();
                }
              }}
              disabled={sending}
              placeholder="Ask about Chitwan…"
              className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-base outline-none disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending || !input.trim()}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#c45b2f] text-white disabled:opacity-45"
              aria-label="Send message"
            >
              {sending ? <LoaderCircle size={18} className="animate-spin"/> : <ArrowUp size={18}/>}
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-[#77837b]">
            <span className="inline-flex items-center gap-1"><Sparkles size={12}/>Server-side Gemini</span>
            <span className="inline-flex items-center gap-1"><MapPinned size={12}/>Directory-grounded</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
