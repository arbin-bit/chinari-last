"use client";

import { ArrowUp, CircleHelp, Compass, Home, Languages, Leaf, Map, Mic2, Route, Sparkles, WifiOff } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { recommend } from "@/lib/recommendations";
import { answerFromTourismKnowledge, searchTourismKnowledge, tourismKnowledgeSummary } from "@/lib/tourism-knowledge";
import { translations } from "@/lib/translations";
import { buildDemoItinerary, demoRouteProvider, fitJourney } from "@/providers/demo/route-provider";
import { demoTourismRepository } from "@/providers/demo/tourism-repository";
import type { Destination, Language, PlannerPreferences } from "@/types/tourism";
import { AIAssistant } from "./ai-assistant";
import { ReportView } from "./report-view";
import { isVisitorReport, type VisitorReport } from "@/lib/visitor-reports";
import { DashboardView } from "./dashboard-view";
import { DestinationDetail } from "./destination-detail";
import { EmergencyView } from "./emergency-view";
import { ExploreView } from "./explore-view";
import { HomeView } from "./home-view";
import { JourneyView } from "./journey-view";
import { MapView } from "./map-view";
import { PlannerDialog } from "./planner-dialog";
import { VoiceDialog } from "./voice-dialog";

type View = "home" | "explore" | "journey" | "map" | "dashboard" | "emergency" | "report";

const allDestinations = demoTourismRepository.getDestinations();

export function ChinariApp() {
  const [reports, setReports] = useState<VisitorReport[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [preferences, setPreferences] = useState<PlannerPreferences>({ duration: "1-day", group: "friends", budget: "moderate", interests: ["Nature", "Wildlife"], transport: "taxi", accessible: false, pace: "balanced", dailyBudget: 4000 });
  const preferencesRef = useRef(preferences);
  const [dockInput, setDockInput] = useState("");
  const [initialQuestion, setInitialQuestion] = useState<{id:string;text:string}|null>(null);
  const [view, setView] = useState<View>("home");
  const [language, setLanguage] = useState<Language>("en");
  const [selectedIds, setSelectedIds] = useState<string[]>(["bishazari-tal"]);
  const itineraryIds = selectedIds;
  const [detail, setDetail] = useState<Destination | null>(null);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [aiContext, setAiContext] = useState<Destination | null>(null);
  const [offline, setOffline] = useState(false);
  const [hiddenOnly, setHiddenOnly] = useState(false);
  const selectedIdsRef = useRef(selectedIds);
  const t = translations[language];

  useEffect(() => {
    let saved: string | null = null;
    let savedLanguage: Language | null = null;
    try {
      saved = window.localStorage.getItem("chinari-journey");
      savedLanguage = window.localStorage.getItem("chinari-language") as Language | null;
      const storedReports = JSON.parse(window.localStorage.getItem("chinari-reports") ?? "[]");
      // Restore browser-owned data after hydration; the server cannot access local storage.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if(Array.isArray(storedReports)) setReports(storedReports.filter(isVisitorReport));
      const p = JSON.parse(window.localStorage.getItem("chinari-preferences") ?? "null");
      if(p && ["half-day","1-day","2-days","3-days"].includes(p.duration) && ["solo","couple","family","friends","senior"].includes(p.group) && ["budget","moderate","premium"].includes(p.budget) && ["walking","public","taxi","rental","own"].includes(p.transport) && Array.isArray(p.interests) && p.interests.every((i:unknown)=>typeof i === "string") && typeof p.accessible === "boolean") setPreferences(p);
    } catch { /* A fresh session remains usable if storage is unavailable. */ }
    setHydrated(true);
    if (saved) { try { const ids = JSON.parse(saved) as string[]; if (Array.isArray(ids)) { const validIds = ids.filter(id => allDestinations.some(d => d.id === id)); setSelectedIds(validIds); } } catch {} }
    if (savedLanguage && savedLanguage in translations) setLanguage(savedLanguage);
    const updateOnline = () => setOffline(!navigator.onLine);
    updateOnline(); window.addEventListener("online", updateOnline); window.addEventListener("offline", updateOnline);
    return () => { window.removeEventListener("online", updateOnline); window.removeEventListener("offline", updateOnline); };
  }, []);

  useEffect(() => { if(hydrated) { try { window.localStorage.setItem("chinari-journey", JSON.stringify(itineraryIds)); window.localStorage.setItem("chinari-preferences", JSON.stringify(preferences)); } catch {} } }, [itineraryIds, preferences, hydrated]);
  useEffect(() => { preferencesRef.current = preferences; }, [preferences]);
  useEffect(() => { selectedIdsRef.current = selectedIds; }, [selectedIds]);
  useEffect(() => { if(hydrated) { try { window.localStorage.setItem("chinari-language", language); } catch {} } document.documentElement.lang = language; }, [language, hydrated]);

  const selected = useMemo(() => selectedIds.map((id) => allDestinations.find((item) => item.id === id)).filter(Boolean) as Destination[], [selectedIds]);
  const itineraryOrdered = useMemo(() => itineraryIds.map((id) => allDestinations.find((item) => item.id === id)).filter(Boolean) as Destination[], [itineraryIds]);
  const itinerary = useMemo(() => buildDemoItinerary(itineraryOrdered, preferences), [itineraryOrdered, preferences]);

  const togglePlace = useCallback((id: string) => {
    setSelectedIds((current) => {
      const exists = current.includes(id);
      const next = exists ? current.filter((item) => item !== id) : [...current, id];
      const place = allDestinations.find((item) => item.id === id);
      toast.success(exists ? `${place?.name ?? "Place"} removed` : `${place?.name ?? "Place"} added to your journey`);
      return next;
    });
  }, []);

  const addPlace = useCallback((id: string) => { setSelectedIds((current) => current.includes(id) ? current : [...current, id]); }, []);
  const removePlace = useCallback((id: string) => { setSelectedIds((current) => current.filter((item) => item !== id)); }, []);
  const optimize = useCallback(() => {
    const current = selectedIdsRef.current.map((id) => allDestinations.find((item) => item.id === id)).filter(Boolean) as Destination[];
    setSelectedIds(demoRouteProvider.optimize(current, preferencesRef.current).map((item) => item.destination.id));
    toast.success("Route optimized");
  }, []);
  const move = (index: number, direction: -1 | 1) => setSelectedIds((current) => { const target = index + direction; if (target < 0 || target >= current.length) return current; const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; });
  const navigate = (next: View) => { setView(next); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const generateJourney = useCallback((preferences: PlannerPreferences) => {
    const picks = fitJourney(recommend(allDestinations, preferences, allDestinations.length), preferences);
    if(!picks.length) { toast.error("No places fit that travel time. Try another transport option or a longer trip."); return; }
    setPreferences(preferences);
    const ids = demoRouteProvider.optimize(picks, preferences).map((item) => item.destination.id);
    setSelectedIds(ids); setView("journey"); window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success("Your personalized journey is ready");
  }, []);

  const createStoryJourney = useCallback(() => {
    setPreferences(current => ({...current, duration:"1-day", transport:"taxi", pace:"balanced"}));
    const ids = ["bishazari-tal", "narayani-boating", "devghat"];
    setSelectedIds(ids); setSelectedIds(demoRouteProvider.optimize(ids.map((id) => allDestinations.find((item) => item.id === id)!)).map((item) => item.destination.id)); setView("journey"); window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  const addHiddenGem = useCallback(() => { addPlace("patihani-village"); setSelectedIds((current) => current.includes("patihani-village") ? current : [...current, "patihani-village"]); toast.success("Hidden gem added and route updated"); }, [addPlace]);
  const removeSecond = useCallback(() => { setSelectedIds(current => current.filter((_, index) => index !== 1)); toast.success("Second stop removed"); }, []);

  const runAICommand = useCallback(async (message: string) => {
    const lower = message.toLowerCase();
    if (lower.includes("remove") && (lower.includes("second") || lower.includes("2"))) { removeSecond(); return "Done — I removed the second stop and updated the journey. Your route and map now use the new order."; }
    if (lower.includes("hidden gem") || lower.includes("tourists usually miss")) { addHiddenGem(); return "I added Patihani Village Trail, a hidden gem that fits local-life and nature interests. Confirm access details locally before visiting."; }
    if (lower.includes("plan") || lower.includes("one-day") || lower.includes("one day")) { createStoryJourney(); return "I created a one-day journey with Bishazari Tal, a Narayani boating experience and Devghat. It balances nature, boating and a religious stop within your NPR 5,000 budget."; }
    if (lower.includes("here") && aiContext) return `${aiContext.name} is best treated as a ${aiContext.estimated_duration} stop. ${aiContext.safety_information}`;
    if (lower.includes("database") || lower.includes("directory") || lower.includes("how many places")) return `The Chinari knowledge base contains ${tourismKnowledgeSummary.totalUniqueRecords} unique Chitwan and nearby tourism records: ${tourismKnowledgeSummary.directoryRecords} researched directory records, enriched by ${tourismKnowledgeSummary.coreHighlights} user-supplied priority highlights. I will flag missing or unconfirmed operational details instead of guessing.`;
    if (lower.includes("religious")) { addPlace("devghat"); return "Devghat matches your religious and cultural interest, so I added it to the journey. Access details remain marked for verification."; }

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, currentDestination: aiContext?.name ?? null }),
      });
      const result = await response.json() as { answer?: string; error?: string };
      if (!response.ok || !result.answer) throw new Error(result.error ?? "AI response unavailable");
      return result.answer;
    } catch {
      const groundedAnswer = answerFromTourismKnowledge(message);
      if (groundedAnswer) return groundedAnswer;
    }

    if (/[ऀ-ॿ]/.test(message)) return "तपाईंको प्रश्नका लागि धन्यवाद। उपलब्ध तथ्य निर्देशिकामा नभए म अनुमान गर्दिनँ। भरतपुरको प्रकृति, देवघाट वा नारायणीबारे सोध्न सक्नुहुन्छ।";
    const matches = demoTourismRepository.searchDestinations(message);
    if (matches.length) return `${matches[0].name} is the closest grounded match in the Chinari directory. ${matches[0].short_description}`;
    return "That information is not in the supplied Chitwan tourism directory, so I will not guess.";
  }, [addHiddenGem, addPlace, aiContext, createStoryJourney, removeSecond]);

  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: unknown) => { try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined); } catch {} };
    register({ name: "search_places", title: "Search Chinari places", description: "Search the supplied 66-record Chitwan tourism knowledge base by place, category, activity, or interest.", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"], additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute: (input: unknown) => { const query = typeof input === "object" && input && "query" in input ? String((input as { query: unknown }).query) : ""; if (!query.trim()) throw new Error("query is required"); return searchTourismKnowledge(query).map((item) => ({ id: item.id, name: item.name, category: item.category, verification_status: item.verification_status, source_basis: item.source_basis })); } });
    register({ name: "create_itinerary", title: "Create a Chinari itinerary", description: "Create the working one-day Chinari demo journey and update the visible map.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: () => { createStoryJourney(); return { status: "created", place_ids: ["bishazari-tal", "narayani-boating", "devghat"] }; } });
    register({ name: "add_itinerary_place", title: "Add a journey place", description: "Add one known place ID to the visible journey.", inputSchema: { type: "object", properties: { place_id: { type: "string" } }, required: ["place_id"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: (input: unknown) => { const id = typeof input === "object" && input && "place_id" in input ? String((input as { place_id: unknown }).place_id) : ""; if (!demoTourismRepository.getDestination(id)) throw new Error("Unknown place_id"); addPlace(id); return { status: "added", place_id: id }; } });
    register({ name: "remove_itinerary_place", title: "Remove a journey place", description: "Remove one known place ID from the visible journey.", inputSchema: { type: "object", properties: { place_id: { type: "string" } }, required: ["place_id"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: (input: unknown) => { const id = typeof input === "object" && input && "place_id" in input ? String((input as { place_id: unknown }).place_id) : ""; if (!id) throw new Error("place_id is required"); removePlace(id); return { status: "removed", place_id: id }; } });
    register({ name: "optimize_itinerary", title: "Optimize the current journey", description: "Apply deterministic demo routing to the currently selected places.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: () => { optimize(); return { status: "optimized", place_count: selectedIdsRef.current.length }; } });
    return () => lifecycle.abort("Chinari tools refreshed");
  }, [addPlace, createStoryJourney, optimize, removePlace]);

  const openDestination = (destination: Destination) => { setDetail(destination); setAiContext(destination); };
  const showSurprise = () => { const gem = allDestinations.find((item) => item.hidden_gem && !selectedIds.includes(item.id)) ?? allDestinations.find((item) => item.hidden_gem)!; setDetail(gem); toast.info(`Surprise: ${gem.name}`); };

  return <main className="min-h-screen bg-[#f8f7f2] text-[#15382a]">
    {offline && <div className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-sm font-bold text-amber-950"><WifiOff size={15}/>You’re offline. Saved journey details remain available.</div>}
    <header className="sticky top-0 z-40 border-b border-[#244d3a]/10 bg-[#f8f7f2]/95 backdrop-blur-xl"><div className="mx-auto flex h-[64px] max-w-[1240px] items-center justify-between gap-4 px-5 lg:px-10"><button onClick={() => navigate("home")} className="flex items-center gap-3" aria-label="Chinari home"><span className="grid h-10 w-10 place-items-center rounded-[11px] bg-[#244d3a] text-white"><Leaf size={21}/></span><span className="text-left"><strong className="block text-xl font-bold tracking-tight">Chinari<span className="text-[#bc633b]">.</span></strong><small className="block text-[9px] tracking-[.16em] text-[#7a8679]">BHARATPUR & BEYOND</small></span></button><nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation"><NavButton active={view === "home" || view === "explore"} onClick={() => navigate("home")}>{language === "en" ? "Discover" : t.explore}</NavButton><NavButton active={plannerOpen} onClick={() => setPlannerOpen(true)}>{t.plan}</NavButton><NavButton active={view === "journey"} onClick={() => navigate("journey")}>{language === "en" ? "My journey" : t.journey} <span className="ml-1 text-xs opacity-60">{selectedIds.length}</span></NavButton><NavButton active={view === "report"} onClick={() => navigate("report")}>Report</NavButton><NavButton active={view === "dashboard"} onClick={() => navigate("dashboard")}>City insights</NavButton></nav><div className="flex items-center gap-2"><label className="flex items-center gap-2 rounded-full bg-[#eeeee5] px-3 py-2"><Languages size={14}/><span className="sr-only">Language</span><select value={language} onChange={e=>setLanguage(e.target.value as Language)} className="bg-transparent text-xs font-bold"><option value="en">EN</option><option value="ne">नेपाली</option><option value="hi">हिन्दी</option></select></label><button className="inline-flex items-center gap-2 rounded-full border border-[#d5dcd0] px-3 py-2 text-xs font-semibold" onClick={()=>navigate("emergency")}><CircleHelp size={15}/><span className="hidden sm:inline">Help</span></button></div></div><div className="flex justify-center gap-6 border-t border-[#244d3a]/5 py-2 text-[11px] font-semibold lg:hidden"><button onClick={()=>setPlannerOpen(true)}>Plan a trip</button><button onClick={()=>navigate("report")}>Report</button><button onClick={()=>navigate("dashboard")}>City insights</button></div></header>
    {view === "home" && <HomeView destinations={allDestinations} selectedIds={selectedIds} t={t} onToggle={togglePlace} onOpen={openDestination} onNavigate={navigate} onPlanner={() => setPlannerOpen(true)} onAI={() => setAiOpen(true)} onSurprise={showSurprise}/>} 
    {view === "explore" && <ExploreView destinations={allDestinations} selectedIds={selectedIds} initialHidden={hiddenOnly} onToggle={togglePlace} onOpen={openDestination}/>} 
    {view === "journey" && <JourneyView preferences={preferences} itinerary={itinerary} selected={selected} onOptimize={optimize} onMove={move} onRemove={removePlace} onPlanner={() => setPlannerOpen(true)} onOpen={openDestination}/>} 
    {view === "map" && <MapView destinations={allDestinations} selectedIds={selectedIds} onBack={() => navigate("explore")} onOpen={openDestination} onToggle={togglePlace}/>}
    {view === "dashboard" && <DashboardView reports={reports} onRemoveReport={id=>{const next=reports.filter(r=>r.id!==id);try{window.localStorage.setItem("chinari-reports",JSON.stringify(next));setReports(next);}catch{toast.error("Could not update local reports.");}}}/>}
    {view === "report" && <ReportView onInsights={()=>navigate("dashboard")} onSave={report=>{if(!isVisitorReport(report)) return false;const next=[...reports,report];try{window.localStorage.setItem("chinari-reports",JSON.stringify(next));setReports(next);return true;}catch{return false;}}}/>}
    {view === "emergency" && <EmergencyView/>}
    <footer className="border-t border-[#1f4d3a]/10 bg-[#f0ecdf] px-5 pb-28 pt-12 lg:px-10 lg:pb-12"><div className="mx-auto grid max-w-[1500px] gap-8 md:grid-cols-[1fr_auto_auto]"><div><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#15382a] text-white"><Leaf size={18}/></span><span className="font-serif text-2xl">Chinari</span></div><p className="mt-3 max-w-md text-sm leading-6 text-[#68776d]">A thoughtful tourism companion for Bharatpur and the wider Chitwan journey.</p></div><div><p className="font-bold">Explore</p><button onClick={() => navigate("explore")} className="mt-3 block text-sm text-[#68776d]">Destinations</button><button onClick={() => { setHiddenOnly(true); navigate("explore"); }} className="mt-2 block text-sm text-[#68776d]">Hidden gems</button></div><div><p className="font-bold">Safety & governance</p><button onClick={() => navigate("emergency")} className="mt-3 block text-sm text-[#68776d]">Emergency information</button><button onClick={() => navigate("dashboard")} className="mt-2 block text-sm text-[#68776d]">City insights</button><button onClick={()=>navigate("report")} className="mt-2 block text-sm text-[#68776d]">Report an observation</button><a href="/photo-credits.html" target="_blank" rel="noreferrer" className="mt-2 block text-sm text-[#68776d]">Photography credits</a></div></div></footer>
    <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-[24px] border border-white/50 bg-[#15382a]/96 p-2 text-white shadow-2xl backdrop-blur-lg lg:hidden" aria-label="Mobile navigation"><MobileNav icon={<Home/>} label={t.home} active={view === "home"} onClick={() => navigate("home")}/><MobileNav icon={<Compass/>} label={t.explore} active={view === "explore"} onClick={() => navigate("explore")}/><MobileNav icon={<Route/>} label={t.journey} active={view === "journey"} onClick={() => navigate("journey")}/><MobileNav icon={<Map/>} label={t.map} active={view === "map"} onClick={() => navigate("map")}/><MobileNav icon={<Sparkles/>} label="AI" active={aiOpen} onClick={() => setAiOpen(true)}/></nav>
    <DestinationDetail destination={detail} selected={detail ? selectedIds.includes(detail.id) : false} onOpenChange={(open) => !open && setDetail(null)} onToggle={() => detail && togglePlace(detail.id)} onAsk={() => { setDetail(null); setAiOpen(true); }}/>
    <PlannerDialog key={String(plannerOpen)} initialPreferences={preferences} open={plannerOpen} onOpenChange={setPlannerOpen} onGenerate={generateJourney}/>
    <AIAssistant initialQuestion={initialQuestion} open={aiOpen} onOpenChange={setAiOpen} context={aiContext} onCommand={runAICommand} onVoice={() => { setAiOpen(false); setVoiceOpen(true); }}/>
    <VoiceDialog open={voiceOpen} onOpenChange={setVoiceOpen} onSwitchText={() => { setVoiceOpen(false); setAiOpen(true); }}/>
    <button onClick={() => setVoiceOpen(true)} className="fixed bottom-24 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-[#c45b2f] text-white shadow-[0_12px_35px_rgba(196,91,47,.38)] transition hover:scale-105 lg:hidden" aria-label="Start Chinari voice conversation"><Mic2/></button>
    <form className="ai-dock" onSubmit={e=>{e.preventDefault();if(dockInput.trim()){setInitialQuestion({id:crypto.randomUUID(),text:dockInput.trim()});setAiContext(null);setAiOpen(true);setDockInput("");}}}><strong><Sparkles size={17}/>Ask Chinari</strong><input aria-label="Ask Chinari a question" placeholder="A wildlife day? A quiet sunset? Ask away…" value={dockInput} onChange={e=>setDockInput(e.target.value)}/><button type="button" onClick={()=>setVoiceOpen(true)} aria-label="Start voice conversation"><Mic2 size={18}/></button><button type="submit" aria-label="Send question"><ArrowUp size={19}/></button></form>
    <Toaster position="top-center" richColors/>
  </main>;
}

function NavButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button onClick={onClick} className={`min-h-10 rounded-full px-4 text-sm font-bold transition ${active ? "bg-[#15382a] text-white" : "text-[#4f6256] hover:bg-[#e7ebe2]"}`}>{children}</button>; }
function MobileNav({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) { return <button onClick={onClick} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-bold ${active ? "bg-white text-[#15382a]" : "text-white/65"}`}><span className="[&>svg]:h-[18px] [&>svg]:w-[18px]">{icon}</span>{label}</button>; }

