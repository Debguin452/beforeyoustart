import { useState, useEffect, useRef, useCallback } from "react";

const CSS = `
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
:root{
  --bg:#080810;--bg2:#0f0f1a;--bg3:#16162a;
  --text:#ffffff;--muted:#a0a0b8;--faint:#52526a;
  --accent:#7c6af7;--accent-light:#a99eff;--accent-dim:rgba(124,106,247,0.1);--accent-border:rgba(124,106,247,0.25);
  --border:#1e1e30;--border2:#2a2a40;
  --high:#f87171;--med:#fbbf24;--low:#34d399;
  --high-bg:rgba(248,113,113,0.08);--med-bg:rgba(251,191,36,0.08);--low-bg:rgba(52,211,153,0.08);
}
html,body{height:100%;background:var(--bg);}
body{font-family:'DM Sans',sans-serif;color:var(--text);overflow-x:hidden;-webkit-font-smoothing:antialiased;}
#root{min-height:100vh;}
::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px;}

.skip-link{position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;background:var(--accent);color:#fff;padding:8px 16px;font-family:'DM Sans',sans-serif;font-size:14px;z-index:9999;}
.skip-link:focus{position:fixed;left:0;top:0;width:auto;height:auto;overflow:visible;}

@media(prefers-reduced-motion:no-preference){
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes pulse{0%,100%{opacity:0.2;transform:scale(0.7)}50%{opacity:1;transform:scale(1)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
  @keyframes orb1{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,-20px)}}
  @keyframes orb2{0%,100%{transform:translate(0,0)}50%{transform:translate(-20px,30px)}}
  @keyframes cursorBlink{0%,49%{opacity:1}50%,99%{opacity:0}100%{opacity:1}}
  @keyframes badgeFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
}

button:focus-visible,a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:6px;}
textarea:focus{outline:2px solid var(--accent-border);}

.section{animation:fadeUp 0.4s ease both;}
.section:nth-child(2){animation-delay:0.05s;}
.section:nth-child(3){animation-delay:0.1s;}
.section:nth-child(4){animation-delay:0.15s;}
.section:nth-child(5){animation-delay:0.2s;}
.section:nth-child(6){animation-delay:0.25s;}
.section:nth-child(7){animation-delay:0.3s;}
`;

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

function useReducedMotion() {
  const [r, setR] = useState(() => typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion:reduce)").matches : false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion:reduce)");
    const h = (e) => setR(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return r;
}

const sc = (s) => s >= 70 ? "var(--low)" : s >= 45 ? "var(--med)" : "var(--high)";
const svc = (s) => s === "high" ? "var(--high)" : s === "medium" ? "var(--med)" : "var(--low)";
const svbg = (s) => s === "high" ? "var(--high-bg)" : s === "medium" ? "var(--med-bg)" : "var(--low-bg)";
const svl = (s) => s === "high" ? "High Risk" : s === "medium" ? "Medium" : "Low Risk";

const Icons = {
  back: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  copy: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="5" y="5" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M11 5V3a2 2 0 00-2-2H3a2 2 0 00-2 2v6a2 2 0 002 2h2" stroke="currentColor" strokeWidth="1.5"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  challenge: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 2L16 15H2L9 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M9 8v3M9 13v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  upside: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 15V3M3 9l6-6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  needs: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="2" y="2" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.4"/><path d="M6 9h6M9 6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  plan: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="2" y="2" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.4"/><path d="M6 6h6M6 9h4M6 12h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  mindset: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="8" r="5" stroke="currentColor" strokeWidth="1.4"/><path d="M6.5 11.5C6.5 13.5 11.5 13.5 11.5 11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M7 8a1 1 0 011-1M11 8a1 1 0 00-1-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  tools: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M14 4l-4 4M3 15l5-5M10 4a3 3 0 104 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="5" cy="13" r="2" stroke="currentColor" strokeWidth="1.3"/></svg>,
  tips: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 2a5 5 0 014 8l-1 1v2H6v-2L5 10a5 5 0 014-8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M7 15h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  time: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  money: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="1" y="4" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8.5" r="2" stroke="currentColor" strokeWidth="1.2"/></svg>,
  skill: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2L10 6H14L11 9L12 13L8 11L4 13L5 9L2 6H6L8 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
  free: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 1a6 6 0 100 12A6 6 0 007 1z" stroke="currentColor" strokeWidth="1.2"/><path d="M5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  premium: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 1l1.5 4H13L9.5 8l1.5 4L7 10l-4 2 1.5-4L1 5h4.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
  bolt: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M8 1L3 8h4l-1 5 6-7H8l1-5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor"/></svg>,
  flag: <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 2l10 4-10 4V2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M2 13V2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  external: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M8 1h3v3M11 1L6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

function ScoreRing({ score }) {
  const reduced = useReducedMotion();
  const [anim, setAnim] = useState(reduced ? score : 0);
  const raf = useRef(null);
  const to = useRef(null);
  useEffect(() => {
    if (reduced) { setAnim(score); return; }
    const start = Date.now(), dur = 1600;
    const step = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setAnim(Math.round(e * score));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    to.current = setTimeout(() => { raf.current = requestAnimationFrame(step); }, 200);
    return () => { clearTimeout(to.current); cancelAnimationFrame(raf.current); };
  }, [score, reduced]);
  const r = 52, circ = 2 * Math.PI * r, arc = circ * 0.75;
  const filled = arc * (anim / 100);
  const color = sc(score);
  const label = score >= 70 ? "Achievable" : score >= 45 ? "Challenging" : "Very Hard";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}
      role="img" aria-label={`Reality score: ${score}/100 — ${label}`}>
      <svg width="140" height="100" viewBox="0 0 140 100" aria-hidden="true">
        <circle cx="70" cy="75" r={r} fill="none" stroke="var(--border2)" strokeWidth="6"
          strokeDasharray={`${arc} ${circ - arc}`} strokeLinecap="round" transform="rotate(135 70 75)"/>
        <circle cx="70" cy="75" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round"
          transform="rotate(135 70 75)"
          style={{ transition: reduced ? "none" : "stroke-dasharray 0.03s linear", filter: `drop-shadow(0 0 8px ${color === "var(--low)" ? "#34d399" : color === "var(--med)" ? "#fbbf24" : "#f87171"}55)` }}/>
        <text x="70" y="72" textAnchor="middle" fill={color} fontSize="32" fontFamily="'DM Sans',sans-serif" fontWeight="600">{anim}</text>
        <text x="70" y="88" textAnchor="middle" fill="var(--faint)" fontSize="8" fontFamily="'DM Sans',sans-serif" letterSpacing="2">REALITY SCORE</text>
      </svg>
      <span style={{ fontSize: "12px", color, fontWeight: "600", letterSpacing: "0.5px" }}>{label}</span>
    </div>
  );
}

function Dots() {
  const reduced = useReducedMotion();
  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center" }} role="status" aria-label="Loading">
      {[0,1,2].map(i => (
        <span key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)",
          display: "block", animation: reduced ? "none" : `pulse 1.2s ${i*0.2}s ease-in-out infinite` }}/>
      ))}
    </div>
  );
}

const PHASES = ["Analyzing your idea…","Cutting through the hype…","Finding real obstacles…","Weighing the risks…","Calculating reality score…","Building your 30-day plan…","Compiling tools & resources…","Almost done…"];

function LoadingPage({ question }) {
  const [ph, setPh] = useState(0);
  const [prog, setProg] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    const pi = setInterval(() => setPh(p => (p+1) % PHASES.length), 1700);
    const pgi = setInterval(() => setProg(p => Math.min(p + Math.random() * 2.5, 91)), 180);
    return () => { clearInterval(pi); clearInterval(pgi); };
  }, []);
  return (
    <main id="main-content" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column", gap: "24px", alignItems: "center" }}>
        <div style={{ padding: "20px 24px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px", width: "100%", animation: reduced ? "none" : "fadeUp 0.4s ease" }}>
          <div style={{ fontSize: "10px", letterSpacing: "3px", color: "var(--accent)", textTransform: "uppercase", marginBottom: "10px" }}>Analyzing</div>
          <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "17px", fontStyle: "italic", color: "var(--text)", lineHeight: 1.5, opacity: 0.9 }}>
            "{question.length > 85 ? question.slice(0, 85) + "…" : question}"
          </div>
        </div>
        <Dots />
        <div aria-live="polite" aria-atomic="true" key={ph} style={{ fontSize: "13px", color: "var(--muted)", animation: reduced ? "none" : "fadeIn 0.4s ease" }}>{PHASES[ph]}</div>
        <div style={{ width: "100%", height: "1px", background: "var(--border)", borderRadius: "1px", overflow: "hidden" }}
          role="progressbar" aria-valuenow={Math.round(prog)} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ height: "100%", width: `${prog}%`, background: "var(--accent)", transition: "width 0.3s ease" }}/>
        </div>
      </div>
    </main>
  );
}

const DEPTHS = [
  { id: "quick", label: "Quick", desc: "3–4 challenges" },
  { id: "standard", label: "Standard", desc: "5–6 challenges" },
  { id: "deep", label: "Deep Dive", desc: "7–8 challenges" },
];

function InputPage({ question, setQuestion, depth, setDepth, onSubmit, onBack, error }) {
  const ref = useRef(null);
  const errRef = useRef(null);
  const reduced = useReducedMotion();
  useEffect(() => { ref.current?.focus(); }, []);
  useEffect(() => { if (error) errRef.current?.focus(); }, [error]);
  const can = !!question.trim();
  const hint = isMac ? "Cmd+Enter" : "Ctrl+Enter";
  return (
    <main id="main-content" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 20px" }}>
      <div style={{ width: "100%", maxWidth: "540px", display: "flex", flexDirection: "column", gap: "28px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontFamily: "'DM Sans',sans-serif", padding: "0", alignSelf: "flex-start", minHeight: "44px" }}>
          {Icons.back} Back
        </button>

        <div>
          <div style={{ fontSize: "10px", letterSpacing: "3px", color: "var(--accent)", textTransform: "uppercase", marginBottom: "12px" }}>Reality Check</div>
          <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(26px,6vw,36px)", fontWeight: 400, lineHeight: 1.2, letterSpacing: "-0.5px" }}>
            What are you thinking of <em style={{ color: "var(--accent-light)", fontStyle: "italic" }}>starting?</em>
          </h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label htmlFor="q" style={{ fontSize: "13px", color: "var(--muted)" }}>Describe your idea</label>
          <textarea id="q" ref={ref} value={question} onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (isMac ? e.metaKey : e.ctrlKey) && can) onSubmit(); }}
            maxLength={600}
            aria-describedby={error ? "q-err" : "q-hint"}
            aria-invalid={!!error}
            placeholder="e.g. Start a YouTube channel about AI and make it my full-time income"
            style={{ width: "100%", minHeight: "130px", background: "var(--bg2)", border: `1px solid ${error ? "var(--high)" : "var(--border)"}`, borderRadius: "10px", color: "var(--text)", fontSize: "15px", fontFamily: "'DM Sans',sans-serif", fontWeight: 300, padding: "16px 18px", resize: "vertical", lineHeight: 1.6, transition: "border-color 0.2s" }}
            onFocus={e => { e.target.style.borderColor = "var(--accent-border)"; }}
            onBlur={e => { e.target.style.borderColor = error ? "var(--high)" : "var(--border)"; }}/>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {error
              ? <span id="q-err" ref={errRef} role="alert" tabIndex={-1} style={{ fontSize: "12px", color: "var(--high)" }}>{error}</span>
              : <span id="q-hint" style={{ fontSize: "12px", color: "var(--faint)" }}>{hint} to submit</span>
            }
            <span style={{ fontSize: "12px", color: "var(--faint)" }} aria-live="polite">{question.length} / 600</span>
          </div>
        </div>

        <fieldset style={{ border: "none", padding: 0 }}>
          <legend style={{ fontSize: "10px", letterSpacing: "3px", color: "var(--faint)", textTransform: "uppercase", marginBottom: "12px" }}>Analysis depth</legend>
          <div style={{ display: "flex", gap: "8px" }}>
            {DEPTHS.map(d => (
              <button key={d.id} onClick={() => setDepth(d.id)} aria-pressed={depth === d.id}
                style={{ flex: 1, padding: "14px 8px", cursor: "pointer", background: depth === d.id ? "var(--accent-dim)" : "transparent", border: `1px solid ${depth === d.id ? "var(--accent-border)" : "var(--border)"}`, borderRadius: "10px", color: depth === d.id ? "var(--accent-light)" : "var(--muted)", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s", textAlign: "center", minHeight: "72px" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "3px" }}>{d.label}</div>
                <div style={{ fontSize: "11px", opacity: 0.65 }}>{d.desc}</div>
              </button>
            ))}
          </div>
        </fieldset>

        <button onClick={can ? onSubmit : undefined} disabled={!can} aria-disabled={!can}
          style={{ padding: "16px", cursor: can ? "pointer" : "not-allowed", background: can ? "var(--accent)" : "var(--bg2)", border: `1px solid ${can ? "var(--accent)" : "var(--border)"}`, color: can ? "#fff" : "var(--faint)", fontSize: "14px", fontWeight: 600, fontFamily: "'DM Sans',sans-serif", borderRadius: "10px", transition: "all 0.2s", opacity: can ? 1 : 0.5, minHeight: "52px" }}>
          {can ? "Get my reality check →" : "Type something above first"}
        </button>
      </div>
    </main>
  );
}

function Divider() {
  return <div style={{ height: "1px", background: "var(--border)", margin: "4px 0" }}/>;
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "20px" }}>
      <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: "var(--bg3)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-light)", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>{title}</h2>
        {subtitle && <p style={{ fontSize: "12px", color: "var(--faint)", marginTop: "2px" }}>{subtitle}</p>}
      </div>
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px", ...style }}>
      {children}
    </div>
  );
}

function ScoreSection({ r }) {
  return (
    <div className="section">
      <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", textAlign: "center" }}>
        <ScoreRing score={r.realityScore} />
        <div style={{ maxWidth: "420px" }}>
          <div style={{ fontSize: "10px", letterSpacing: "3px", color: "var(--faint)", textTransform: "uppercase", marginBottom: "10px" }}>Verdict</div>
          <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(15px,3vw,18px)", fontStyle: "italic", lineHeight: 1.6, color: "var(--text)" }}>{r.verdict}</p>
        </div>
        {(r.successFactors?.length > 0 || r.redFlags?.length > 0) && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
            {r.successFactors?.slice(0,3).map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.12)", borderRadius: "8px", textAlign: "left" }}>
                <span style={{ color: "var(--low)", flexShrink: 0 }}>{Icons.check}</span>
                <span style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
            {r.redFlags?.slice(0,2).map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "var(--high-bg)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: "8px", textAlign: "left" }}>
                <span style={{ color: "var(--high)", flexShrink: 0 }}>{Icons.flag}</span>
                <span style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ChallengesSection({ challenges }) {
  const sorted = [...challenges].sort((a,b) => ({high:0,medium:1,low:2}[a.severity]??1) - ({high:0,medium:1,low:2}[b.severity]??1));
  return (
    <div className="section">
      <SectionHeader icon={Icons.challenge} title="Key Challenges" subtitle={`${challenges.length} obstacles to expect`} />
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {sorted.map((c, i) => (
          <Card key={i} style={{ borderLeft: `3px solid ${svc(c.severity)}`, borderRadius: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", gap: "10px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>{c.title}</span>
              <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.8px", color: svc(c.severity), background: svbg(c.severity), padding: "3px 8px", borderRadius: "4px", whiteSpace: "nowrap", flexShrink: 0 }}>{svl(c.severity)}</span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.65 }}>{c.detail}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function UpsideSection({ opportunities }) {
  if (!opportunities?.length) return null;
  return (
    <div className="section">
      <SectionHeader icon={Icons.upside} title="Real Opportunities" subtitle="Genuine upside if you execute well" />
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {opportunities.map((o, i) => (
          <Card key={i}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--low)", marginBottom: "7px" }}>{o.title}</div>
            <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.65 }}>{o.detail}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function NeedsSection({ req }) {
  if (!req) return null;
  return (
    <div className="section">
      <SectionHeader icon={Icons.needs} title="What You'll Need" />
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <Card style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <span style={{ color: "var(--accent-light)" }}>{Icons.time}</span>
          <div>
            <div style={{ fontSize: "11px", color: "var(--faint)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "3px" }}>Time</div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{req.time}</div>
          </div>
        </Card>
        <Card style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <span style={{ color: "var(--med)" }}>{Icons.money}</span>
          <div>
            <div style={{ fontSize: "11px", color: "var(--faint)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "3px" }}>Investment</div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{req.money}</div>
          </div>
        </Card>
        {req.skills?.length > 0 && (
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ color: "var(--low)" }}>{Icons.skill}</span>
              <span style={{ fontSize: "11px", color: "var(--faint)", textTransform: "uppercase", letterSpacing: "1.5px" }}>Skills needed</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
              {req.skills.map((s, i) => (
                <span key={i} style={{ padding: "5px 12px", borderRadius: "6px", background: "var(--accent-dim)", border: "1px solid var(--accent-border)", color: "var(--accent-light)", fontSize: "12px", fontWeight: 500 }}>{s}</span>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function PlanSection({ plan }) {
  if (!plan?.length) return null;
  return (
    <div className="section">
      <SectionHeader icon={Icons.plan} title="30-Day Action Plan" subtitle="Your concrete first steps" />
      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {plan.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--accent-dim)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "var(--accent-light)", marginTop: "2px" }}>{i+1}</div>
              {i < plan.length - 1 && <div style={{ width: "1px", flex: 1, background: "var(--border)", margin: "4px 0" }}/>}
            </div>
            <div style={{ paddingBottom: i < plan.length - 1 ? "20px" : "0", paddingTop: "2px", flex: 1 }}>
              <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1.5px", color: "var(--accent)", textTransform: "uppercase", marginBottom: "3px" }}>{p.phase}</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "5px" }}>{p.focus}</div>
              <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>{p.action}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MindsetSection({ mindset }) {
  if (!mindset) return null;
  return (
    <div className="section">
      <SectionHeader icon={Icons.mindset} title="The Mindset Shift" />
      <Card style={{ borderLeft: "3px solid var(--accent-border)" }}>
        <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(15px,3vw,18px)", fontStyle: "italic", lineHeight: 1.75, color: "rgba(240,238,252,0.85)" }}>{mindset}</p>
      </Card>
    </div>
  );
}

function ToolItem({ name, desc, url, badge, badgeColor }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{name}</span>
          {badge && <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.8px", color: badgeColor || "var(--low)", background: "rgba(52,211,153,0.1)", padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase" }}>{badge}</span>}
        </div>
        <p style={{ fontSize: "12px", color: "var(--faint)", lineHeight: 1.5 }}>{desc}</p>
      </div>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${name}`}
          style={{ color: "var(--faint)", flexShrink: 0, display: "flex", alignItems: "center", padding: "8px" }}>
          {Icons.external}
        </a>
      )}
    </div>
  );
}

const TOOL_BANKS = {
  business: {
    free: [
      { name: "Canva", desc: "Design logos, posts, and brand materials", url: "https://canva.com", badge: "Free" },
      { name: "Notion", desc: "Business planning, docs, and databases", url: "https://notion.so", badge: "Free" },
      { name: "Wave", desc: "Free accounting and invoicing", url: "https://waveapps.com", badge: "Free" },
      { name: "Mailchimp", desc: "Email marketing up to 500 contacts free", url: "https://mailchimp.com", badge: "Free" },
    ],
    premium: [
      { name: "Shopify", desc: "Best-in-class ecommerce platform", url: "https://shopify.com", badge: "Paid" },
      { name: "Ahrefs", desc: "SEO research and competitor analysis", url: "https://ahrefs.com", badge: "Paid" },
    ],
    best: [
      { name: "Canva Pro", desc: "Full design suite — most users get by on free tier", url: "https://canva.com" },
      { name: "Notion", desc: "Replace 5 tools with one — start with their free templates", url: "https://notion.so" },
    ],
  },
  tech: {
    free: [
      { name: "VS Code", desc: "Free, powerful code editor by Microsoft", url: "https://code.visualstudio.com", badge: "Free" },
      { name: "GitHub", desc: "Version control and free public hosting", url: "https://github.com", badge: "Free" },
      { name: "Vercel", desc: "Deploy web apps for free instantly", url: "https://vercel.com", badge: "Free" },
      { name: "Supabase", desc: "Free Postgres database + auth backend", url: "https://supabase.com", badge: "Free" },
    ],
    premium: [
      { name: "Cursor", desc: "AI-powered IDE — 10x faster coding", url: "https://cursor.sh", badge: "Paid" },
      { name: "Linear", desc: "Best project management for dev teams", url: "https://linear.app", badge: "Paid" },
    ],
    best: [
      { name: "Vercel + Supabase", desc: "The fastest free stack to ship products — no DevOps needed", url: "https://vercel.com" },
    ],
  },
  creative: {
    free: [
      { name: "Canva", desc: "Design anything — social, thumbnails, decks", url: "https://canva.com", badge: "Free" },
      { name: "DaVinci Resolve", desc: "Professional video editing, fully free", url: "https://blackmagicdesign.com", badge: "Free" },
      { name: "Audacity", desc: "Free audio recording and editing", url: "https://audacityteam.org", badge: "Free" },
      { name: "GIMP", desc: "Free Photoshop alternative", url: "https://gimp.org", badge: "Free" },
    ],
    premium: [
      { name: "Adobe Creative Cloud", desc: "Industry standard design and video suite", url: "https://adobe.com", badge: "Paid" },
      { name: "Final Cut Pro", desc: "Best video editor for Mac creators", url: "https://apple.com/final-cut-pro", badge: "Paid" },
    ],
    best: [
      { name: "DaVinci Resolve", desc: "Free tier is better than most paid editors — no reason to pay early on", url: "https://blackmagicdesign.com" },
      { name: "Canva", desc: "Free tier covers 90% of creator needs", url: "https://canva.com" },
    ],
  },
  health: {
    free: [
      { name: "MyFitnessPal", desc: "Free calorie and nutrition tracker", url: "https://myfitnesspal.com", badge: "Free" },
      { name: "Strong App", desc: "Workout logging with free core features", url: "https://www.strong.app", badge: "Free" },
      { name: "YouTube", desc: "Thousands of free workout programs", url: "https://youtube.com", badge: "Free" },
    ],
    premium: [
      { name: "Whoop", desc: "Advanced recovery and strain tracking", url: "https://whoop.com", badge: "Paid" },
      { name: "Noom", desc: "Psychology-based weight loss program", url: "https://noom.com", badge: "Paid" },
    ],
    best: [
      { name: "MyFitnessPal Free", desc: "Start here — most people never need the paid tier", url: "https://myfitnesspal.com" },
      { name: "YouTube", desc: "Jeff Nippard, AthleanX — world-class free coaching", url: "https://youtube.com" },
    ],
  },
  social: {
    free: [
      { name: "Buffer", desc: "Schedule posts across platforms free", url: "https://buffer.com", badge: "Free" },
      { name: "Canva", desc: "Create all social graphics for free", url: "https://canva.com", badge: "Free" },
      { name: "Later", desc: "Visual Instagram planner, free tier", url: "https://later.com", badge: "Free" },
    ],
    premium: [
      { name: "Hootsuite", desc: "Full social media management suite", url: "https://hootsuite.com", badge: "Paid" },
    ],
    best: [
      { name: "Buffer + Canva", desc: "The free combo that runs most solo creator accounts", url: "https://buffer.com" },
    ],
  },
  learning: {
    free: [
      { name: "Coursera Audit", desc: "Audit top university courses for free", url: "https://coursera.org", badge: "Free" },
      { name: "Khan Academy", desc: "Math, science, and business fundamentals", url: "https://khanacademy.org", badge: "Free" },
      { name: "YouTube", desc: "MIT, Harvard, Stanford — all free", url: "https://youtube.com", badge: "Free" },
      { name: "Anki", desc: "Spaced repetition flashcards for retention", url: "https://apps.ankiweb.net", badge: "Free" },
    ],
    premium: [
      { name: "Brilliant", desc: "Interactive STEM learning, excellent quality", url: "https://brilliant.org", badge: "Paid" },
      { name: "MasterClass", desc: "Learn from the world's best practitioners", url: "https://masterclass.com", badge: "Paid" },
    ],
    best: [
      { name: "YouTube + Anki", desc: "Watch, take notes, make flashcards — beats any paid course for most topics", url: "https://youtube.com" },
    ],
  },
  other: {
    free: [
      { name: "Notion", desc: "Plan, track, and manage anything", url: "https://notion.so", badge: "Free" },
      { name: "Trello", desc: "Visual task and project management", url: "https://trello.com", badge: "Free" },
      { name: "Google Workspace", desc: "Docs, Sheets, Drive — powerful and free", url: "https://workspace.google.com", badge: "Free" },
    ],
    premium: [
      { name: "Airtable", desc: "Database meets spreadsheet for complex workflows", url: "https://airtable.com", badge: "Paid" },
    ],
    best: [
      { name: "Notion", desc: "One workspace to replace everything — 90% of users never need paid", url: "https://notion.so" },
    ],
  },
};

function ToolsSection({ category }) {
  const cat = category?.toLowerCase();
  const tools = TOOL_BANKS[cat] || TOOL_BANKS.other;
  return (
    <div className="section">
      <SectionHeader icon={Icons.tools} title="Best Tools to Use" subtitle="Curated for this exact goal" />
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ color: "var(--low)" }}>{Icons.bolt}</span>
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "2px", color: "var(--low)", textTransform: "uppercase" }}>Best Choice — Start Here</span>
          </div>
          {tools.best.map((t, i) => <ToolItem key={i} {...t} badge="Recommended" badgeColor="var(--low)" />)}
        </Card>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ color: "var(--accent-light)" }}>{Icons.free}</span>
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "2px", color: "var(--accent-light)", textTransform: "uppercase" }}>Free Tier</span>
          </div>
          {tools.free.map((t, i) => <ToolItem key={i} {...t} badge="Free" badgeColor="var(--accent-light)" />)}
        </Card>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ color: "var(--med)" }}>{Icons.premium}</span>
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "2px", color: "var(--med)", textTransform: "uppercase" }}>Premium (when you're ready)</span>
          </div>
          {tools.premium.map((t, i) => <ToolItem key={i} {...t} badge="Paid" badgeColor="var(--med)" />)}
        </Card>
      </div>
    </div>
  );
}

const TIPS_BANK = {
  business: [
    { title: "Validate before you build", body: "Talk to 10 potential customers before spending a dollar. Most businesses fail because no one wants what they built." },
    { title: "Charge more than feels comfortable", body: "95% of first-time founders underprice. Raise prices until you start losing deals, then back off 10%." },
    { title: "One channel first", body: "Pick one marketing channel, master it completely, then add another. Spreading thin kills traction." },
    { title: "Build in public", body: "Share your journey on X/Twitter or LinkedIn. Free marketing, accountability, and early customers — all at once." },
    { title: "Recurring revenue beats one-time", body: "Subscription or retainer models are worth 3–5x the valuation of one-off sales businesses at the same revenue." },
  ],
  tech: [
    { title: "Ship the ugly version first", body: "Your v1 should embarrass you slightly. If you're proud of v1, you shipped too late. Speed of learning beats perfection." },
    { title: "Talk to users weekly", body: "The biggest technical mistake is building features nobody asked for. Schedule 30-min calls with users every week." },
    { title: "Use managed services", body: "Don't manage your own servers in 2025. Vercel, Supabase, Railway — pay a little, save months of DevOps time." },
    { title: "One metric to rule them all", body: "Pick one north-star metric (DAU, MRR, activations) and make every team decision against it. Avoid vanity metrics." },
    { title: "Copy the best UX", body: "Inspiration from successful apps isn't theft — it's research. Users love familiarity. Original UI often confuses." },
  ],
  creative: [
    { title: "Post consistently over posting perfectly", body: "An account that posts 3x a week mediocrely will beat a once-a-week perfectionist within 6 months, every time." },
    { title: "Study your own analytics ruthlessly", body: "Your best-performing 20% of content shows exactly what your audience wants. Double down on that, kill the rest." },
    { title: "Repurpose everything", body: "One video = 5 clips = 10 tweets = 1 newsletter. Maximal output from minimal input is the creator leverage game." },
    { title: "Batch create", body: "Record 4 videos in one session, not one video four times. Context switching kills creative momentum." },
    { title: "Collaborate early", body: "Even small collaborations expose you to new audiences. A 1,000-subscriber collab partner can move the needle more than a viral post." },
  ],
  health: [
    { title: "Consistency beats intensity", body: "Three 40-minute workouts a week for two years beats a brutal 6-day program you quit after three weeks." },
    { title: "Sleep is the multiplier", body: "Sub-7-hour sleep wipes out 50%+ of workout gains and kills willpower for nutrition. Fix sleep before anything else." },
    { title: "Track for 4 weeks, then automate", body: "Log everything at first to build awareness, then let habits run on autopilot. Tracking long-term becomes obsessive." },
    { title: "Progress photos over scales", body: "The scale lies — water, muscle, and food weight fluctuate 2–4 lbs daily. Photos and measurements tell the real story." },
    { title: "Find your identity lever", body: "Say 'I am someone who trains' not 'I'm trying to work out.' Identity-based habits stick 3x longer than goal-based ones." },
  ],
  social: [
    { title: "Hook in the first 3 seconds", body: "On every platform, the algorithm judges content in the first seconds. If you don't grab attention instantly, nothing else matters." },
    { title: "Engage before you post", body: "Spend 20 minutes commenting meaningfully on others' content before your own. Platforms reward engaged accounts." },
    { title: "Niche down aggressively", body: "'Marketing tips' fails. 'Email marketing for Shopify store owners' wins. The riches are in the niches." },
    { title: "Stories convert, posts grow", body: "Stories/close-contact formats build trust and drive DMs. Feed posts drive discovery. Use both with different goals." },
  ],
  learning: [
    { title: "Active recall over passive review", body: "Testing yourself is 3x more effective for retention than rereading notes. Use Anki or write practice questions." },
    { title: "Teach what you learn immediately", body: "The Feynman Technique — explain the concept simply to someone else within 24h of learning it. Gaps become obvious fast." },
    { title: "Time-box and protect your sessions", body: "90-minute focused sessions beat 4 hours of distracted study. Treat learning time like a meeting you can't cancel." },
    { title: "Build while you learn", body: "For any skill — code, design, writing — do a real project from week one, not week twelve. Theory without practice evaporates." },
  ],
  other: [
    { title: "Define what success looks like first", body: "Before starting, write down what 'done' or 'succeeded' looks like in 1 year. Without a target, you'll drift." },
    { title: "Find one person who has done it", body: "Study their path obsessively. Most mistakes are predictable and documented by those who came before you." },
    { title: "Small bets, then double down", body: "Run low-cost experiments before major commitments. Validate assumptions cheaply, scale what works." },
    { title: "Accountability beats motivation", body: "Motivation fades. Tell someone your commitment publicly, or pay money with a forfeit clause. Systems outlast feelings." },
  ],
};

function TipsSection({ category }) {
  const cat = category?.toLowerCase();
  const tips = TIPS_BANK[cat] || TIPS_BANK.other;
  return (
    <div className="section">
      <SectionHeader icon={Icons.tips} title="Insider Tips" subtitle="What experienced people know that you don't yet" />
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {tips.map((t, i) => (
          <Card key={i}>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span style={{ color: "var(--accent-light)", marginTop: "1px", flexShrink: 0 }}>{Icons.tips}</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "5px" }}>{t.title}</div>
                <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.65 }}>{t.body}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ResultsPage({ results: r, question, onAgain }) {
  const [copied, setCopied] = useState(false);
  const reduced = useReducedMotion();

  const copyAll = async () => {
    const t = `BeforeUstart Reality Check\n"${question}"\n\nScore: ${r.realityScore}/100\nVerdict: ${r.verdict}\n\nChallenges:\n${(r.challenges||[]).map((c,i)=>`${i+1}. [${c.severity?.toUpperCase()}] ${c.title}: ${c.detail}`).join("\n")}\n\nOpportunities:\n${(r.opportunities||[]).map((o,i)=>`${i+1}. ${o.title}: ${o.detail}`).join("\n")}\n\nTime: ${r.requirements?.time}\nMoney: ${r.requirements?.money}\nSkills: ${(r.requirements?.skills||[]).join(", ")}\n\nMindset:\n${r.mindset}`;
    try {
      await navigator.clipboard.writeText(t);
    } catch {
      const el = document.createElement("textarea");
      el.value = t; el.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(8,8,16,0.95)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <button onClick={onAgain} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontFamily: "'DM Sans',sans-serif", minHeight: "44px", minWidth: "44px" }}>
          {Icons.back} New check
        </button>
        <span style={{ fontSize: "13px", color: "var(--faint)", flex: 1, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.category}</span>
        <button onClick={copyAll} aria-label={copied ? "Copied" : "Copy results"}
          style={{ background: "none", border: "1px solid var(--border)", borderRadius: "7px", padding: "7px 13px", color: copied ? "var(--low)" : "var(--faint)", fontSize: "12px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: "6px", minHeight: "36px", transition: "color 0.2s" }}>
          {copied ? Icons.check : Icons.copy}
          {copied ? "Copied" : "Copy"}
        </button>
      </header>

      <main id="main-content" style={{ maxWidth: "620px", margin: "0 auto", padding: "28px 20px 60px", display: "flex", flexDirection: "column", gap: "28px" }}>
        <ScoreSection r={r} />
        <Divider />
        <ChallengesSection challenges={r.challenges || []} />
        <Divider />
        <UpsideSection opportunities={r.opportunities} />
        <Divider />
        <NeedsSection req={r.requirements} />
        <Divider />
        <PlanSection plan={r.plan} />
        <Divider />
        <MindsetSection mindset={r.mindset} />
        <Divider />
        <ToolsSection category={r.category} />
        <Divider />
        <TipsSection category={r.category} />
      </main>
    </div>
  );
}

function HistoryPanel({ history, onClose }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    closeRef.current?.focus();
    const h = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const els = panelRef.current?.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!els?.length) return;
        const first = els[0], last = els[els.length-1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", h);
    return () => { document.removeEventListener("keydown", h); prev?.focus(); };
  }, [onClose]);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={onClose} aria-hidden="true" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}/>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Past checks"
        style={{ position: "relative", width: "300px", maxWidth: "90vw", height: "100%", background: "var(--bg2)", borderLeft: "1px solid var(--border)", padding: "24px", overflowY: "auto", animation: "slideIn 0.25s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Past checks</span>
          <button ref={closeRef} onClick={onClose} aria-label="Close panel"
            style={{ background: "none", border: "none", color: "var(--faint)", cursor: "pointer", fontSize: "20px", lineHeight: 1, minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>x</button>
        </div>
        {history.length === 0
          ? <p style={{ color: "var(--faint)", fontSize: "13px" }}>No checks yet.</p>
          : <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {history.map(h => (
                <div key={h.id} style={{ padding: "12px 14px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.4, flex: 1 }}>{h.question}</span>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: sc(h.score), flexShrink: 0 }}>{h.score}</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--faint)" }}>{h.date}</span>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}

function HomePage({ onStart, history, onHist }) {
  const reduced = useReducedMotion();
  const TITLE = "BeforeUstart";
  const [typed, setTyped] = useState(reduced ? TITLE.length : 0);
  const [showCursor, setShowCursor] = useState(!reduced);
  const [showLabel, setShowLabel] = useState(reduced);
  const [showSub, setShowSub] = useState(reduced);
  const [showBadges, setShowBadges] = useState(reduced);
  const [showBtn, setShowBtn] = useState(reduced);

  useEffect(() => {
    if (reduced) return;
    const timers = [];
    timers.push(setTimeout(() => setShowLabel(true), 200));
    TITLE.split("").forEach((_, i) => {
      timers.push(setTimeout(() => setTyped(i + 1), 480 + i * 62));
    });
    const doneAt = 480 + (TITLE.length - 1) * 62;
    timers.push(setTimeout(() => setShowSub(true), doneAt + 280));
    timers.push(setTimeout(() => setShowBadges(true), doneAt + 520));
    timers.push(setTimeout(() => setShowCursor(false), doneAt + 700));
    timers.push(setTimeout(() => setShowBtn(true), doneAt + 820));
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  const BADGES = ["No sugarcoating", "Honest by design"];

  const tr = (show, delay = "0s") => ({
    opacity: show ? 1 : 0,
    transform: show ? "translateY(0)" : "translateY(14px)",
    transition: reduced ? "none" : `opacity 0.55s ${delay} ease, transform 0.55s ${delay} ease`,
  });

  return (
    <main id="main-content" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", padding: "40px 24px" }}>
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "20%", left: "15%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle,rgba(124,106,247,0.12) 0%,transparent 70%)", filter: "blur(60px)", animation: reduced ? "none" : "orb1 10s ease-in-out infinite" }}/>
        <div style={{ position: "absolute", bottom: "20%", right: "15%", width: "350px", height: "350px", borderRadius: "50%", background: "radial-gradient(circle,rgba(124,106,247,0.07) 0%,transparent 70%)", filter: "blur(60px)", animation: reduced ? "none" : "orb2 13s ease-in-out infinite" }}/>
      </div>

      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: "560px" }}>
        <div style={{ marginBottom: "20px", ...tr(showLabel) }}>
          <span style={{ fontSize: "10px", letterSpacing: "5px", color: "var(--faint)", textTransform: "uppercase", fontFamily: "'DM Sans',sans-serif" }}>
            A Reality Check Tool
          </span>
        </div>

        <h1 aria-label="BeforeUstart" style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(52px,14vw,88px)", fontWeight: 400, letterSpacing: "-2px", lineHeight: 1, marginBottom: "28px", display: "flex", alignItems: "baseline" }}>
          <span>{TITLE.slice(0, typed)}</span>
          {showCursor && (
            <span aria-hidden="true" style={{ display: "inline-block", width: "3px", height: "0.82em", background: "var(--accent-light)", marginLeft: "4px", verticalAlign: "baseline", borderRadius: "1px", animation: reduced ? "none" : "cursorBlink 0.85s step-start infinite" }} />
          )}
        </h1>

        <p style={{ fontSize: "16px", color: "var(--muted)", fontWeight: 300, lineHeight: 1.75, maxWidth: "400px", marginBottom: "32px", ...tr(showSub) }}>
          Before you leap — know what you're actually jumping into. No fluff. No motivation. Just reality.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "40px" }}>
          {BADGES.map((b, i) => (
            <span key={b} style={{
              padding: "9px 18px",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.03)",
              fontSize: "13px",
              color: "var(--muted)",
              fontWeight: 400,
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              opacity: showBadges ? 1 : 0,
              transform: showBadges ? "translateY(0)" : "translateY(10px)",
              transition: reduced ? "none" : `opacity 0.5s ${i * 0.1}s ease, transform 0.5s ${i * 0.1}s ease`,
            }}>
              {b}
              <span aria-hidden="true" style={{ color: "var(--accent)", fontSize: "7px" }}>&#9670;</span>
            </span>
          ))}
        </div>

        <div style={{ ...tr(showBtn) }}>
          <button onClick={onStart}
            style={{ width: "100%", padding: "18px 40px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "14px", color: "var(--accent-light)", fontSize: "15px", fontWeight: 500, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", transition: "border-color 0.2s, background 0.2s", minHeight: "56px", letterSpacing: "0.2px" }}
            onMouseOver={e => { e.currentTarget.style.borderColor = "var(--accent-border)"; e.currentTarget.style.background = "var(--accent-dim)"; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.background = "transparent"; }}>
            Ask the real question &rarr;
          </button>
          {history.length > 0 && (
            <button onClick={onHist} style={{ display: "block", margin: "14px auto 0", background: "none", border: "none", color: "var(--faint)", fontSize: "12px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", letterSpacing: "1px", textTransform: "uppercase", minHeight: "44px" }}>
              {history.length} past check{history.length !== 1 ? "s" : ""} &rarr;
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

export default function App() {
  const [page, setPage] = useState("home");
  const [question, setQuestion] = useState("");
  const [depth, setDepth] = useState("standard");
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState(() => {
    try { const s = localStorage.getItem("bys_h"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [showHist, setShowHist] = useState(false);

  useEffect(() => {
    try { localStorage.setItem("bys_h", JSON.stringify(history)); } catch {}
  }, [history]);

  const runCheck = useCallback(async () => {
    if (!question.trim()) return;
    setPage("loading"); setError(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), depth }),
      });
      let errData;
      if (!res.ok) {
        try { errData = await res.json(); } catch {}
        throw new Error(errData?.error || `Error ${res.status}`);
      }
      const parsed = await res.json();
      const entry = {
        id: crypto.randomUUID(),
        question: question.length > 70 ? question.slice(0, 70) + "…" : question,
        score: parsed.realityScore,
        category: parsed.category,
        date: new Date().toLocaleDateString(),
      };
      setHistory(h => [entry, ...h].slice(0, 10));
      setResults(parsed); setPage("results");
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
      setPage("input");
    }
  }, [question, depth]);

  useEffect(() => {
    const titles = { home: "BeforeUstart — Know Before You Begin", input: "Reality Check — BeforeUstart", loading: "Analyzing… — BeforeUstart", results: results ? `${results.realityScore}/100 — BeforeUstart` : "Results — BeforeUstart" };
    document.title = titles[page] || titles.home;
  }, [page, results]);

  return (
    <>
      <style>{CSS}</style>
      {showHist && <HistoryPanel history={history} onClose={() => setShowHist(false)} />}
      {page === "home" && <HomePage onStart={() => setPage("input")} history={history} onHist={() => setShowHist(true)} />}
      {page === "input" && <InputPage question={question} setQuestion={setQuestion} depth={depth} setDepth={setDepth} onSubmit={runCheck} onBack={() => setPage("home")} error={error} />}
      {page === "loading" && <LoadingPage question={question} />}
      {page === "results" && results && <ResultsPage results={results} question={question} onAgain={() => { setQuestion(""); setResults(null); setPage("input"); }} />}
    </>
  );
}
