"use client";

import { LocateFixed, Grid2X2, Map as MapIcon, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Destination, DestinationCategory } from "@/types/tourism";
import { DestinationCard } from "./destination-card";
import { LeafletMap } from "./leaflet-map";

const categories: Array<"All" | DestinationCategory | "Hidden Gems"> = ["All", "Nature", "Wildlife", "Culture", "Religious", "Adventure", "Food", "Local Life", "Hidden Gems"];

export function ExploreView({ destinations, selectedIds, initialHidden = false, onToggle, onOpen }: { destinations: Destination[]; selectedIds: string[]; initialHidden?: boolean; onToggle: (id: string) => void; onOpen: (destination: Destination) => void }) {
  const [position, setPosition] = useState<{latitude:number;longitude:number}|null>(null);
  const [locationMessage, setLocationMessage] = useState("");

  const locate = () => { if(!navigator.geolocation){setLocationMessage("Location is unavailable in this browser.");return;}setLocationMessage("Waiting for your location permission…");navigator.geolocation.getCurrentPosition(p=>{setPosition({latitude:p.coords.latitude,longitude:p.coords.longitude});setSort("near");setLocationMessage("Sorted by approximate straight-line distance. Location stays in this page.");},()=>setLocationMessage("Location is unavailable or permission was declined. You can still browse every place."),{timeout:10000,maximumAge:60000}); };
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>(initialHidden ? "Hidden Gems" : "All");
  const [sort, setSort] = useState("recommended");
  const filtered = useMemo(() => {
  const distance = (d:Destination) => position ? Math.hypot((d.longitude-position.longitude)*Math.cos(position.latitude*Math.PI/180),d.latitude-position.latitude)*111.2 : 0;
    const needle = query.toLowerCase();
    const result = destinations.filter((item) => {
      const matchCategory = category === "All" || (category === "Hidden Gems" ? item.hidden_gem : item.category === category);
      const matchQuery = !needle || [item.name, item.name_ne, item.category, ...item.tags].join(" ").toLowerCase().includes(needle);
      return matchCategory && matchQuery;
    });
    return result.sort((a, b) => sort === "near" ? distance(a)-distance(b) : sort === "rating" ? (b.rating ?? 0) - (a.rating ?? 0) : sort === "quiet" ? a.popularity - b.popularity : b.popularity - a.popularity);
  }, [destinations, query, category, sort, position]);

  return (
    <div className="mx-auto max-w-[1500px] px-5 pb-28 pt-8 lg:px-10 lg:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#c45b2f]">Explore Bharatpur</p><h1 className="mt-2 font-serif text-5xl tracking-tight">Find your kind of place.</h1><p className="mt-3 max-w-2xl text-[#617066]">Browse nature, culture, food and quieter experiences across Bharatpur and nearby Chitwan.</p></div></div>
      <div className="mt-8 rounded-[28px] border border-[#1f4d3a]/10 bg-white/70 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row"><label className="relative flex min-h-12 flex-1 items-center"><Search className="absolute left-4 text-[#6d7b72]" size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search places, interests or experiences" className="h-12 w-full rounded-2xl border border-[#1f4d3a]/12 bg-[#f7f3e8] pl-11 pr-4 text-base outline-none focus:ring-2 focus:ring-[#c45b2f]/30"/></label><label className="flex min-h-12 items-center gap-2 rounded-2xl border border-[#1f4d3a]/12 bg-[#f7f3e8] px-4"><SlidersHorizontal size={17}/><span className="sr-only">Sort places</span><select value={sort} onChange={(event) => setSort(event.target.value)} className="bg-transparent text-sm font-bold outline-none"><option value="recommended">Recommended</option>{position && <option value="near">Nearest to me</option>}<option value="rating">Highest rated</option><option value="quiet">Less crowded</option></select></label></div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-bold transition ${category === item ? "bg-[#15382a] text-white" : "bg-[#edf1e9] text-[#15382a] hover:bg-[#dfe7db]"}`}>{item}</button>)}</div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4"><button className="text-action" onClick={locate}><LocateFixed size={17}/>Near me</button><p className="small-note" role="status">{locationMessage}</p></div>
      <Tabs defaultValue="grid" className="mt-8">
        <div className="flex items-center justify-between"><p className="text-sm font-semibold text-[#68776d]">{filtered.length} places</p><TabsList className="rounded-full bg-[#e6eadf] p-1"><TabsTrigger value="grid" className="rounded-full px-4"><Grid2X2/>Grid</TabsTrigger><TabsTrigger value="map" className="rounded-full px-4"><MapIcon/>Map</TabsTrigger></TabsList></div>
        <TabsContent value="grid" className="mt-6"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{filtered.map((destination) => <DestinationCard key={destination.id} destination={destination} selected={selectedIds.includes(destination.id)} onToggle={() => onToggle(destination.id)} onOpen={() => onOpen(destination)}/>)}</div>{filtered.length === 0 && <div className="mt-6 rounded-[20px] border border-dashed border-[#1f4d3a]/20 p-12 text-center"><h2 className="font-serif text-3xl">No place matches that yet.</h2><p className="mt-2 text-[#68776d]">Try a broader interest or clear the search.</p></div>}</TabsContent>
        <TabsContent value="map" className="mt-6 overflow-hidden rounded-[30px] border border-[#1f4d3a]/10"><LeafletMap destinations={filtered} selectedIds={selectedIds} onSelect={onOpen} className="min-h-[620px]"/></TabsContent>
      </Tabs>
    </div>
  );
}
