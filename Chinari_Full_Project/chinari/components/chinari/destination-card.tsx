"use client";

import { ArrowUpRight, Clock3, Gem, MapPin, Plus, Star } from "lucide-react";
import type { Destination } from "@/types/tourism";

export function DestinationCard({ destination, selected, onToggle, onOpen, compact = false }: { destination: Destination; selected: boolean; onToggle: () => void; onOpen: () => void; compact?: boolean }) {
  return (
    <article className="group overflow-hidden rounded-[16px] border border-[#1f4d3a]/12 bg-white shadow-[0_3px_12px_rgba(39,64,48,.05)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(39,64,48,.11)]">
      <button onClick={onOpen} className={`relative block w-full overflow-hidden text-left ${compact ? "aspect-[16/9]" : "aspect-[3/2]"}`} aria-label={`View ${destination.name}`}>
        <img src={destination.image} alt={destination.image_alt} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c2b20]/55 via-transparent to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1.5 text-xs font-bold text-[#15382a] shadow-sm">{destination.category}</span>
        {destination.hidden_gem && <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-[#c45b2f] px-3 py-1.5 text-xs font-bold text-white"><Gem size={13}/> Hidden gem</span>}
        <span className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-white text-[#15382a] shadow"><ArrowUpRight size={18}/></span>
      </button>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs text-[#68776d]">{destination.name_ne}</p><h3 className="mt-1 text-[1.05rem] font-bold leading-tight tracking-[-.025em]">{destination.name}</h3></div>{destination.rating && <span className="flex items-center gap-1 text-xs font-bold"><Star size={13} className="fill-[#d99145] text-[#d99145]" />{destination.rating}</span>}</div>
        {!compact && <p className="mt-3 min-h-12 text-xs leading-5 text-[#617066]">{destination.short_description}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-[#68776d]"><span className="inline-flex items-center gap-1"><Clock3 size={14}/>{destination.estimated_duration}</span><span className="inline-flex items-center gap-1"><MapPin size={14}/>{destination.municipality}</span></div>
        <p className="mt-3 text-xs text-[#68776d]">{destination.best_time} · {destination.difficulty} terrain</p><div className="mt-5 flex justify-end border-t border-[#1f4d3a]/10 pt-4"><button onClick={onToggle} className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-bold transition ${selected ? "bg-[#15382a] text-white" : "bg-[#edf1e9] text-[#15382a]"}`}><Plus size={16}/>{selected ? "Added" : "Add"}</button></div>
      </div>
    </article>
  );
}
