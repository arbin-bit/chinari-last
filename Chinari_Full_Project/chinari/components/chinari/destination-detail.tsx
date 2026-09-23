"use client";

import { Accessibility, Check, Clock3, Headphones, MapPin, MessageCircle, Navigation, Plus, Send, ShieldCheck, Star, Volume2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { demoSentimentProvider } from "@/providers/demo/sentiment-provider";
import type { Destination, ReviewSentiment } from "@/types/tourism";

type PlaceReview = { id: string; author: string; rating: number; message: string; createdAt: string };

const communityReviews: Record<string, PlaceReview[]> = {
  sauraha: [
    { id: "sauraha-1", author: "Maya T.", rating: 5, message: "A peaceful base for exploring Chitwan. The early morning wildlife walk was the highlight of our visit.", createdAt: "2026-08-18T08:00:00.000Z" },
    { id: "sauraha-2", author: "Rohan K.", rating: 4, message: "Friendly local guides and plenty of places to eat. Start early to avoid the afternoon heat.", createdAt: "2026-07-29T08:00:00.000Z" },
  ],
  "bishazari-tal": [
    { id: "bishazari-1", author: "Anita S.", rating: 5, message: "Quiet water, beautiful birds and a very calm morning. Take drinking water and binoculars.", createdAt: "2026-08-06T08:00:00.000Z" },
  ],
};

function readSavedReviews(): Record<string, PlaceReview[]> {
  if (typeof window === "undefined") return {};
  try {
    const stored = JSON.parse(window.localStorage.getItem("chinari-place-reviews") ?? "{}");
    return stored && typeof stored === "object" ? stored : {};
  } catch {
    return {};
  }
}

export function DestinationDetail({ destination, selected, onOpenChange, onToggle, onAsk }: { destination: Destination | null; selected: boolean; onOpenChange: (open: boolean) => void; onToggle: () => void; onAsk: () => void }) {
  const [savedReviews, setSavedReviews] = useState<Record<string, PlaceReview[]>>(readSavedReviews);
  const handleOpenChange = (open: boolean) => onOpenChange(open);
  const playGuide = () => {
    if (!destination || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(`${destination.name}. ${destination.short_description} ${destination.safety_information}`));
  };
  const saveReview = (destinationId: string, review: PlaceReview) => {
    const next = { ...savedReviews, [destinationId]: [review, ...(savedReviews[destinationId] ?? [])] };
    setSavedReviews(next);
    try { window.localStorage.setItem("chinari-place-reviews", JSON.stringify(next)); } catch {}
  };

  return <Dialog open={Boolean(destination)} onOpenChange={handleOpenChange}>
    <DialogContent className="destination-dialog max-h-[92vh] overflow-y-auto rounded-[22px] border border-[#cbd5ca] bg-white p-0 shadow-[0_28px_90px_rgba(13,42,31,.28)] sm:max-w-4xl [&>[data-slot=dialog-close]]:right-4 [&>[data-slot=dialog-close]]:top-4 [&>[data-slot=dialog-close]]:z-20 [&>[data-slot=dialog-close]]:rounded-full [&>[data-slot=dialog-close]]:bg-white [&>[data-slot=dialog-close]]:p-2 [&>[data-slot=dialog-close]]:opacity-100 [&>[data-slot=dialog-close]]:shadow-md">
      <DialogHeader className="sr-only"><DialogTitle>{destination?.name ?? "Destination"}</DialogTitle><DialogDescription>Destination details and visitor planning information.</DialogDescription></DialogHeader>
      {destination && <>
        <div className="relative min-h-[300px] overflow-hidden">
          <img src={destination.image} alt={destination.image_alt} className="absolute inset-0 h-full w-full object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-t from-[#102f24]/90 via-[#102f24]/10 to-transparent"/>
          <div className="absolute inset-x-7 bottom-7 text-white"><div className="flex flex-wrap items-end justify-between gap-4"><div><span className="rounded-full bg-white/18 px-3 py-1.5 text-xs font-bold backdrop-blur">{destination.category}</span><p className="mt-4 text-sm text-white/75">{destination.name_ne} · {destination.name_hi}</p><h2 className="mt-1 text-5xl font-extrabold tracking-[-.05em]">{destination.name}</h2></div>{destination.rating && <span className="flex items-center gap-1 rounded-full bg-white px-4 py-2 font-bold text-[#15382a] shadow"><Star size={16} className="fill-[#d99145] text-[#d99145]"/>{destination.rating}</span>}</div></div>
        </div>
        <div className="bg-[#fffefa] p-6 sm:p-8">
          <div className="flex flex-wrap gap-3"><button onClick={onToggle} className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 font-bold ${selected ? "bg-[#15382a] text-white" : "bg-[#c45b2f] text-white"}`}><Plus size={17}/>{selected ? "Added to journey" : "Add to journey"}</button><button onClick={onAsk} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#1f4d3a]/15 bg-white px-5 font-bold"><MessageCircle size={17}/>Ask Chinari about this place</button><button onClick={playGuide} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#1f4d3a]/15 bg-white px-5 font-bold"><Headphones size={17}/>Audio guide</button></div>
          <div className="mt-7 grid gap-3 sm:grid-cols-3"><Info icon={<Clock3/>} label="Visit time" value={destination.estimated_duration}/><Info icon={<MapPin/>} label="Best time" value={destination.best_time}/><Info icon={<Accessibility/>} label="Access" value={destination.difficulty}/></div>
          <p className="mt-5 text-xs text-[#68776d]">Real photography · <a className="underline" href="/photo-credits.html" target="_blank" rel="noreferrer">Photographer credits & image context</a></p>
          <Tabs defaultValue="about" className="mt-8"><TabsList variant="line" className="w-full justify-start overflow-x-auto border-b border-[#dfe5dc]"><TabsTrigger value="about">About</TabsTrigger><TabsTrigger value="visit">Plan your visit</TabsTrigger><TabsTrigger value="reviews">Reviews</TabsTrigger></TabsList>
            <TabsContent value="about" className="pt-5"><p className="text-base leading-8 text-[#4f6256]">{destination.description}</p><div className="mt-5 rounded-[16px] bg-[#eaf0e7] p-5"><h3 className="font-bold">Why it matters</h3><p className="mt-2 leading-7 text-[#58695e]">{destination.significance}</p></div></TabsContent>
            <TabsContent value="visit" className="pt-5"><div className="grid gap-4 sm:grid-cols-2"><Info icon={<Navigation/>} label="Transport" value={destination.transport_options.join(", ")}/><Info icon={<ShieldCheck/>} label="Safety note" value={destination.safety_information}/><Info icon={<Volume2/>} label="Facilities" value={destination.facilities.join(", ")}/><Info icon={<MapPin/>} label="Location" value={destination.address}/></div><p className="mt-5 rounded-xl bg-amber-100 p-4 text-sm font-semibold text-amber-900">Opening hours, fees and official status are not shown unless verified by a named source.</p></TabsContent>
            <TabsContent value="reviews" className="pt-6"><ReviewSection destination={destination} reviews={[...(savedReviews[destination.id] ?? []), ...(communityReviews[destination.id] ?? [])]} onPost={(review)=>saveReview(destination.id, review)}/></TabsContent>
          </Tabs>
        </div>
      </>}
    </DialogContent>
  </Dialog>;
}

function ReviewSection({ destination, reviews, onPost }: { destination: Destination; reviews: PlaceReview[]; onPost: (review: PlaceReview) => void }) {
  const [message, setMessage] = useState("");
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [sentiment, setSentiment] = useState<ReviewSentiment | null>(null);
  const [error, setError] = useState("");
  const [posted, setPosted] = useState(false);

  const post = () => {
    if (message.trim().length < 10) { setError("Please write at least 10 characters before posting."); return; }
    onPost({ id: crypto.randomUUID(), author: author.trim() || "Guest traveller", rating, message: message.trim(), createdAt: new Date().toISOString() });
    setSentiment(demoSentimentProvider.analyze(message));
    setMessage(""); setAuthor(""); setRating(5); setError(""); setPosted(true);
  };

  return <div className="grid gap-7 lg:grid-cols-[.9fr_1.1fr]">
    <section className="rounded-[16px] border border-[#dfe5dc] bg-white p-5">
      <h3 className="text-xl font-extrabold tracking-[-.035em]">Share your experience</h3>
      <p className="mt-2 text-sm text-[#68776d]">Help future visitors know what to expect at {destination.name}.</p>
      <label className="mt-5 block text-sm font-bold">Your rating</label>
      <div className="mt-2 flex gap-1" aria-label="Choose a rating">{[1,2,3,4,5].map(value=><button key={value} type="button" onClick={()=>setRating(value)} aria-label={`${value} star${value===1?"":"s"}`} className="p-1"><Star size={25} className={value<=rating?"fill-[#d99145] text-[#d99145]":"text-[#bdc7be]"}/></button>)}</div>
      <label className="mt-4 block text-sm font-bold" htmlFor="review-name">Display name <span className="font-normal text-[#7a877f]">(optional)</span></label>
      <input id="review-name" value={author} onChange={event=>setAuthor(event.target.value)} maxLength={50} placeholder="Guest traveller" className="mt-2 h-11 w-full rounded-xl border border-[#cfd8cf] bg-white px-4 outline-none focus:ring-2 focus:ring-[#c45b2f]/25"/>
      <label className="mt-4 block text-sm font-bold" htmlFor="review">Your review</label>
      <textarea id="review" value={message} onChange={event=>{setMessage(event.target.value);setPosted(false);}} maxLength={1000} placeholder="What did you enjoy? What should another visitor know?" className="mt-2 min-h-32 w-full rounded-xl border border-[#cfd8cf] bg-white p-4 text-sm outline-none focus:ring-2 focus:ring-[#c45b2f]/25"/>
      <div className="mt-2 flex justify-between text-xs text-[#7a877f]"><span>{message.length}/1000</span><span>Be respectful and avoid personal details.</span></div>
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
      {posted && <p role="status" className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-700"><Check size={16}/>Your review is posted below.</p>}
      <button type="button" onClick={post} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#cb4d0f] px-6 font-extrabold text-white"><Send size={17}/>Post review</button>
      {sentiment && <p className="mt-3 text-center text-xs text-[#68776d]">Tone check: <strong>{sentiment.overall}</strong></p>}
    </section>
    <section>
      <div className="flex items-center justify-between"><div><h3 className="text-xl font-extrabold tracking-[-.035em]">Visitor reviews</h3><p className="mt-1 text-sm text-[#68776d]">{reviews.length ? `${reviews.length} shared experience${reviews.length===1?"":"s"}` : "Be the first to review this place."}</p></div>{reviews.length>0 && <span className="flex items-center gap-1 rounded-full bg-[#edf1e9] px-3 py-2 text-sm font-bold"><Star size={14} className="fill-[#d99145] text-[#d99145]"/>{(reviews.reduce((sum,item)=>sum+item.rating,0)/reviews.length).toFixed(1)}</span>}</div>
      <div className="mt-4 space-y-3">{reviews.map(item=><article key={item.id} className="rounded-[16px] border border-[#dfe5dc] bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{item.author}</p><div className="mt-1 flex gap-0.5" aria-label={`${item.rating} out of 5 stars`}>{[1,2,3,4,5].map(value=><Star key={value} size={13} className={value<=item.rating?"fill-[#d99145] text-[#d99145]":"text-[#d6ddd6]"}/>)}</div></div><time className="text-xs text-[#7a877f]">{new Date(item.createdAt).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}</time></div><p className="mt-3 text-sm leading-6 text-[#53665a]">{item.message}</p></article>)}</div>
    </section>
  </div>;
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-[16px] border border-[#dfe5dc] bg-white p-4"><span className="text-[#c45b2f] [&>svg]:h-5 [&>svg]:w-5">{icon}</span><p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#7a877f]">{label}</p><p className="mt-1 text-sm font-semibold leading-6">{value}</p></div>;
}
