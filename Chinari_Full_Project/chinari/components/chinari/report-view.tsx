"use client";
import { CheckCircle2, ArrowUpRight, MessageSquare, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { reportServices, type VisitorReport } from "@/lib/visitor-reports";
export function ReportView({ onSave, onInsights }: { onSave: (report: VisitorReport) => boolean; onInsights: () => void }) {
  const [kind, setKind] = useState<VisitorReport["kind"]>("Problem");
  const [service, setService] = useState<string>(reportServices[0]);
  const [ward, setWard] = useState("Unconfirmed");
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState<VisitorReport | null>(null);
  const [error, setError] = useState("");
  return <div className="upgrade-page"><span className="eyebrow">SMALL OBSERVATIONS. BETTER PLACES.</span><h1>Help shape a better visit.</h1><p className="intro-text">Something to improve, an idea worth sharing, or a moment that made your day. Add your voice to Chinari’s local feedback view.</p>
    <div className="notice flex items-center gap-3"><ShieldCheck size={22}/><span>Reports stay in this browser and appear in City insights. Nothing is sent to the municipality. Please leave out names, contact details, and other personal information.</span></div>
    {saved ? <div className="form-surface"><CheckCircle2 size={38} className="text-emerald-700"/><h2 className="mt-5 font-serif text-3xl">Your observation is saved.</h2><p className="small-note mt-3">Local reference: {saved.id.slice(0,8)} · {saved.kind} · {saved.service}</p><p className="mt-4">City insights now includes this report in its local feedback totals.</p><div className="mt-6 flex flex-wrap gap-3"><button className="action-green" onClick={onInsights}>View City insights<ArrowUpRight size={16}/></button><button className="text-action" onClick={()=>{setSaved(null);setMessage("");}}>Add another observation</button></div></div> : <form className="form-surface" onSubmit={e=>{e.preventDefault();if(message.trim().length<10){setError("Please describe your observation in at least 10 characters.");return;}const report: VisitorReport={id:crypto.randomUUID(),kind,service,ward,message:message.trim(),createdAt:new Date().toISOString()};if(onSave(report)){setSaved(report);setError("");}else{setError("Your browser could not save this report. Please allow local storage and try again.");}}}>
      <fieldset><legend className="field-label">What would you like to share?</legend><div className="interest-chips">{(["Problem","Suggestion","Appreciation"] as const).map(item=><button type="button" key={item} aria-pressed={kind===item} onClick={()=>setKind(item)} className={kind===item?"active":""}>{item}</button>)}</div></fieldset>
      <div className="form-grid"><label><span className="field-label">Which service?</span><select value={service} onChange={e=>setService(e.target.value)}>{reportServices.map(s=><option key={s}>{s}</option>)}</select></label><label><span className="field-label">Which ward?</span><select value={ward} onChange={e=>setWard(e.target.value)}><option value="Unconfirmed">I’m not sure</option>{Array.from({length:29},(_,i)=><option key={i} value={i+1}>Ward {i+1}</option>)}</select></label><label className="full-field"><span className="field-label">Tell us a little more</span><textarea required minLength={10} maxLength={1500} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Where was it? What did you notice? What could make the experience better?"/><span className="small-note">{message.length}/1500 · Please do not include personal details.</span></label></div>
      {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}<button type="submit" className="action-orange mt-6"><MessageSquare size={17}/>Save local report<ArrowUpRight size={17}/></button>
    </form>}
  </div>;
}
