"use client";
import { ArrowDown, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Compass, Leaf, MapPin, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import type { Destination } from "@/types/tourism";
import { DestinationCard } from "./destination-card";
import { LeafletMap } from "./leaflet-map";
interface HomeViewProps {
  destinations: Destination[]; selectedIds: string[]; t: Record<string, string>;
  onToggle: (id: string) => void; onOpen: (destination: Destination) => void;
  onNavigate: (view: "explore" | "journey" | "map") => void;
  onPlanner: () => void; onAI: () => void; onSurprise: () => void;
}
const stories = [
  { image: "chitwan-rhinos", label: "THE WILD SIDE OF CHITWAN", title: <>A little closer<br/>to the <em>wild.</em></>, description: "Quiet wetlands. Living traditions. Unexpected encounters. Find a side of Bharatpur that stays with you.", location: "Chitwan National Park", id: "sauraha", credit: "Aditya Pal" },
  { image: "beeshazari", label: "SLOW MORNINGS, LASTING MEMORIES", title: <>Take the<br/><em>scenic way.</em></>, description: "Follow the forest to Bishazari Tal. Make room for birdsong, still water, and a morning without a rush.", location: "Bishazari Tal · Bharatpur", id: "bishazari-tal", credit: "Sabina Bajracharya" },
  { image: "devghat", label: "WHERE RIVERS AND STORIES MEET", title: <>More than<br/>a <em>destination.</em></>, description: "Discover Devghat through its riverside paths and living traditions. Build a journey with space to explore.", location: "Devghat · Chitwan region", id: "devghat", credit: "Ricky Partel" },
];
const interests = ["All places", "Nature", "Wildlife", "Culture", "Religious", "Adventure", "Food", "Local Life", "Hidden gems"];
export function HomeView({ destinations, selectedIds, t, onToggle, onOpen, onNavigate, onPlanner, onAI, onSurprise }: HomeViewProps) {
  const [storyIndex, setStoryIndex] = useState(0);
  const [interest, setInterest] = useState("All places");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recommended");
  const story = stories[storyIndex];
  const filtered = destinations.filter(d => (interest === "All places" || (interest === "Hidden gems" ? d.hidden_gem : d.category === interest || d.tags.includes(interest.toLowerCase()))) && `${d.name} ${d.name_ne} ${d.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => sort === "duration" ? a.duration_minutes-b.duration_minutes : sort === "quiet" ? a.popularity-b.popularity : b.popularity-a.popularity);
  return <div className="discovery-page">
    <div className="discovery-intro"><span><span className="status-dot"/> YOUR LOCAL COMPANION IN BHARATPUR</span><span>नेपाल, a little more personally.</span></div>
    <section className="discovery-hero" aria-label="Featured destinations">
      <img key={story.image} className="hero-photo" src={`/images/photos/${story.image}.jpg`} alt={story.location} fetchPriority="high"/>
      <div className="hero-shade"/>
      <div className="hero-copy"><span className="hero-eyebrow"><Leaf size={14}/>{story.label}</span><h1>{story.title}</h1><p>{story.description}</p><div className="hero-actions"><button className="action-orange" onClick={onPlanner}>{t.plan}<ArrowUpRight size={18}/></button><button className="hero-secondary" onClick={() => onNavigate("map")}><MapPin size={17}/>Explore the map</button></div><div className="hero-footnote"><span>Thoughtfully planned.</span><span>Locally inspired.</span><span>Always your journey.</span></div></div>
      <button className="hero-location" onClick={() => { const d = destinations.find(d => d.id === story.id); if(d) onOpen(d); }}><MapPin size={16}/><span>{story.location}<small>Discover this place</small></span><ArrowUpRight size={19}/></button>
      <div className="hero-pagination"><button aria-label="Previous featured destination" onClick={() => setStoryIndex((storyIndex+stories.length-1)%stories.length)}><ChevronLeft size={17}/></button><span>0{storyIndex+1} <i>/ 0{stories.length}</i></span><button aria-label="Next featured destination" onClick={() => setStoryIndex((storyIndex+1)%stories.length)}><ChevronRight size={17}/></button></div>
      <a className="hero-credit" href="/photo-credits.html" target="_blank" rel="noreferrer">Photo: {story.credit} · credits</a>
    </section>
    <section className="discovery-search" aria-label="Find experiences"><div><Compass size={23}/><span><strong>Your next story starts here</strong><small>Find somewhere that feels like you.</small></span></div><label><Search size={19}/><input aria-label="Search destinations" placeholder="Try wildlife, rivers, local food…" value={query} onChange={e=>setQuery(e.target.value)}/></label><button className="action-green" onClick={() => document.getElementById("discover-places")?.scrollIntoView({behavior:"smooth",block:"start"})}>Find my place<ArrowDown size={16}/></button></section>
    <section id="discover-places" className="discovery-section">
      <div className="section-heading"><div><span className="eyebrow">A PLACE FOR EVERY KIND OF YOU</span><h2>Follow your curiosity.</h2><p>From a quiet riverbank to a completely different kind of day.</p></div><label className="sort-control">Sort by<select aria-label="Sort discovery places" value={sort} onChange={e=>setSort(e.target.value)}><option value="recommended">Recommended</option><option value="duration">Short visits first</option><option value="quiet">Less discovered</option></select></label></div>
      <div className="interest-chips">{interests.map(item=><button key={item} aria-pressed={interest===item} className={interest===item?"active":""} onClick={()=>setInterest(item)}>{item==="All places" && <Compass size={15}/>} {item}</button>)}</div>
      <div className="discovery-grid">{filtered.slice(0,4).map(d=><DestinationCard key={d.id} destination={d} selected={selectedIds.includes(d.id)} onToggle={()=>onToggle(d.id)} onOpen={()=>onOpen(d)}/>)}</div>
      {!filtered.length && <div className="empty-state"><h3>No places match just yet.</h3><p>Try another interest or a broader search.</p><button className="action-green" onClick={()=>{setQuery("");setInterest("All places");}}>Clear filters</button></div>}
      <div className="section-bottom"><span>{Math.min(filtered.length,4)} of {filtered.length} matching places</span><button onClick={()=>onNavigate("explore")}>Explore all destinations<ArrowRight size={16}/></button></div>
    </section>
    <section className="journey-banner"><div className="journey-banner-icon"><Sparkles size={28}/></div><div><span className="eyebrow">LESS PLANNING. MORE BEING THERE.</span><h2>A trip that fits your kind of day.</h2><p>Your interests, your pace, your budget. One connected journey.</p></div><button className="action-green" onClick={onPlanner}>Build my itinerary<ArrowUpRight size={18}/></button></section>
    <section className="discovery-section"><div className="section-heading"><div><span className="eyebrow">GET YOUR BEARINGS</span><h2>See how it all connects.</h2><p>The page keeps scrolling normally; use the + and − controls when you want to zoom.</p></div><button className="text-action" onClick={()=>onNavigate("map")}>Open full map<ArrowUpRight size={18}/></button></div><div className="home-map"><LeafletMap destinations={destinations} selectedIds={[]} onSelect={onOpen}/></div></section>
    <section className="slow-travel"><div className="slow-photo"><img src="/images/photos/tharu-village.jpg" alt="Tharu village in Sauraha" loading="lazy"/><a href="/photo-credits.html">Sauraha · photo credits</a></div><div><span className="eyebrow">TAKE A DIFFERENT TURN</span><h2>The best memories<br/>aren’t always<br/><em>on the itinerary.</em></h2><p>Make time for village lanes, shared meals, and stories you wouldn’t find in a guidebook. Let Chinari introduce you to somewhere less discovered.</p><div className="flex flex-wrap gap-3"><button className="action-green" onClick={onSurprise}>Surprise me<Compass size={18}/></button><button className="text-action" onClick={onAI}>Ask a local question<ArrowUpRight size={18}/></button></div></div></section>
  </div>;
}
