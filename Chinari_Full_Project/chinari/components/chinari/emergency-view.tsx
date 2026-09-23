"use client";

import { Ambulance, Building2, Check, Copy, LocateFixed, Navigation, ShieldAlert, Stethoscope } from "lucide-react";
import { useState } from "react";
import { LeafletMap } from "./leaflet-map";

type UserLocation = { latitude: number; longitude: number; accuracy?: number };

const services = [
  { name: "Police assistance", icon: ShieldAlert, advice: "Ask your accommodation or a nearby official for the closest verified police contact.", urgent: true },
  { name: "Hospital information", icon: Building2, advice: "Share your coordinates and ask for the nearest open hospital or clinic.", urgent: true },
  { name: "Ambulance services", icon: Ambulance, advice: "Ask a local official or your accommodation to arrange urgent medical transport.", urgent: false },
  { name: "Tourist assistance", icon: Stethoscope, advice: "Keep your route, accommodation name and current coordinates ready.", urgent: false },
];

export function EmergencyView() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);

  const locate = () => {
    if (!navigator.geolocation) { setStatus("Location is unavailable in this browser."); return; }
    setStatus("Waiting for location permission…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy });
        setStatus("Your current location is shown below. Share these coordinates with someone you trust.");
      },
      (error) => setStatus(error.code === error.PERMISSION_DENIED ? "Location permission was declined. Enable it in your browser settings and try again." : "We could not get your location. Move to an open area and try again."),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const coordinates = location ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : "";
  const mapLink = location ? `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=17/${location.latitude}/${location.longitude}` : "";

  return <div className="mx-auto max-w-[1180px] px-5 pb-32 pt-10 lg:px-6 lg:pt-12">
    <p className="text-sm font-semibold text-[#617066]">← Back to discover</p>
    <h1 className="mt-7 text-[2.6rem] font-extrabold leading-none tracking-[-.055em]">Help and safety</h1>
    <p className="mt-3 text-base text-[#68776d]">Find your location and get the details you need when asking someone for help.</p>

    <section className="mt-7 rounded-[18px] border border-[#c45b2f]/25 bg-white p-5 shadow-[0_5px_16px_rgba(31,77,58,.05)] sm:p-6">
      <h2 className="text-xl font-extrabold tracking-[-.035em]">I am lost</h2>
      <p className="mt-2 text-sm text-[#68776d]">One tap shows exactly where you are, in coordinates you can read aloud or share.</p>
      <button onClick={locate} className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#cb4d0f] px-6 text-base font-extrabold text-white shadow-sm"><LocateFixed size={19}/>Show me where I am</button>
      <p className="mt-4 text-xs text-[#68776d]">If you are in danger, contact a verified emergency service first. This screen can wait.</p>
      {status && <p role="status" className="mt-4 rounded-xl bg-[#f1f3ec] p-3 text-sm font-semibold text-[#4f6256]">{status}</p>}
      {location && <div className="mt-5 grid gap-4 border-t border-[#1f4d3a]/10 pt-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-xs font-bold uppercase tracking-[.12em] text-[#68776d]">Your coordinates</p><p className="mt-1 font-mono text-lg font-bold">{coordinates}</p><p className="mt-1 text-xs text-[#68776d]">Accurate to about {Math.round(location.accuracy ?? 0)} metres</p></div><div className="flex flex-wrap gap-2"><button onClick={async()=>{await navigator.clipboard.writeText(coordinates);setCopied(true);}} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#1f4d3a]/15 px-4 text-sm font-bold">{copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? "Copied" : "Copy"}</button><a href={mapLink} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#15382a] px-4 text-sm font-bold text-white"><Navigation size={16}/>Open map</a></div></div>}
      {location && <LeafletMap destinations={[]} userLocation={location} className="mt-5 min-h-[330px] rounded-[14px] shadow-none"/>}
    </section>

    <h2 className="mt-9 text-2xl font-extrabold tracking-[-.04em]">Get local help</h2>
    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{services.map(({ name, icon: Icon, advice, urgent }) => <article key={name} className={`rounded-[18px] border p-5 ${urgent ? "border-red-200 bg-[#fff5f4]" : "border-[#1f4d3a]/12 bg-white"}`}><div className="flex items-start gap-4"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${urgent ? "bg-red-100 text-red-700" : "bg-[#e8ede5] text-[#15382a]"}`}><Icon size={20}/></span><div><h3 className="text-base font-extrabold tracking-[-.025em]">{name}</h3><p className="mt-2 text-xs leading-5 text-[#68776d]">{advice}</p></div></div></article>)}</div>
    <p className="mt-5 rounded-[14px] border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">Chinari does not send your location automatically. It stays on this page until you choose to copy or share it.</p>
  </div>;
}
