import { useState, useEffect, useRef } from "react";
import {
  ShieldCheck, ChevronLeft, ChevronRight, RotateCw, Home,
  X, Plus, Lock, Eye, EyeOff, Trash2, Key, Settings,
  Star, ZoomIn, ZoomOut, Printer, Wifi, Clock,
  CheckCircle, XCircle, Info, Layers, AlertTriangle,
  Globe, RefreshCw, Edit2, Save, PlusCircle, Search,
  Palette, Shield, Monitor, Maximize2, Minimize2, Minus,
  Copy, LogIn
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────
const DOMAIN   = "arman.ahrtechdiv.com";
const HOME_URL = `https://${DOMAIN}`;

const THEMES = {
  "Deep Blue":    { bg:"#0f172a", panel:"#1e293b", card:"#243448", accent:"#3b82f6", text:"#e2e8f0", muted:"#94a3b8", border:"#334155", success:"#10b981", danger:"#ef4444" },
  "Midnight":     { bg:"#09090f", panel:"#111118", card:"#1a1a26", accent:"#8b5cf6", text:"#ede9fe", muted:"#a78bfa", border:"#2d2b3f", success:"#10b981", danger:"#ef4444" },
  "Emerald":      { bg:"#022c22", panel:"#064e3b", card:"#065f46", accent:"#10b981", text:"#d1fae5", muted:"#6ee7b7", border:"#047857", success:"#34d399", danger:"#ef4444" },
  "Royal Purple": { bg:"#13002b", panel:"#1e0040", card:"#2d0a52", accent:"#a855f7", text:"#f3e8ff", muted:"#c084fc", border:"#6b21a8", success:"#10b981", danger:"#ef4444" },
  "Crimson":      { bg:"#1a0606", panel:"#2d0f0f", card:"#3d1515", accent:"#f43f5e", text:"#ffe4e6", muted:"#fda4af", border:"#9f1239", success:"#10b981", danger:"#ef4444" },
  "Ocean":        { bg:"#031a2e", panel:"#042330", card:"#0c3547", accent:"#06b6d4", text:"#cffafe", muted:"#67e8f9", border:"#0e7490", success:"#10b981", danger:"#ef4444" },
  "Slate Light":  { bg:"#f1f5f9", panel:"#ffffff", card:"#f8fafc", accent:"#3b82f6", text:"#0f172a", muted:"#64748b", border:"#cbd5e1", success:"#059669", danger:"#dc2626" },
  "Amber Gold":   { bg:"#1c0f00", panel:"#2d1a00", card:"#3d2400", accent:"#f59e0b", text:"#fef3c7", muted:"#fcd34d", border:"#b45309", success:"#10b981", danger:"#ef4444" },
  "Rose Pink":    { bg:"#1a0010", panel:"#2d0020", card:"#3d0030", accent:"#ec4899", text:"#fce7f3", muted:"#f9a8d4", border:"#9d174d", success:"#10b981", danger:"#ef4444" },
  "Carbon":       { bg:"#0a0a0a", panel:"#141414", card:"#1e1e1e", accent:"#e5e5e5", text:"#ffffff", muted:"#737373", border:"#2a2a2a", success:"#10b981", danger:"#ef4444" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
let _tabId = 1;
const mkTab = () => ({ id: _tabId++, url: HOME_URL, title: "Smart Stores WMS", loading: true, hist: [HOME_URL], histIdx: 0 });

const storage = {
  get: (key, fallback = null) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
};

// Simple XOR obfuscation for stored passwords (not real encryption, but obscures plain text)
const obfuscate = (str) => btoa(str.split("").map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ (37 + i % 7))).join(""));
const deobfuscate = (str) => { try { return atob(str).split("").map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ (37 + i % 7))).join(""); } catch { return str; } };

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SmartStores() {
  const isWin = /windows/i.test(navigator.userAgent);

  // OS gate
  const [bypass, setBypass] = useState(false);

  // Browser state
  const [tabs, setTabs]         = useState([mkTab()]);
  const [activeTab, setActiveTab] = useState(0);

  // UI panels
  const [panel, setPanel] = useState(null); // "passwords" | "settings" | "addpass" | null
  const [isMax, setIsMax] = useState(false);

  // Theme
  const [themeName, setThemeName] = useState(() => storage.get("ss_theme", "Deep Blue"));

  // Passwords
  const [passwords, setPasswords] = useState(() => storage.get("ss_pw", []));
  const [passSearch, setPassSearch] = useState("");
  const [passVis, setPassVis]   = useState({});
  const [editIdx, setEditIdx]   = useState(null);

  // Add/Edit password form
  const [form, setForm] = useState({ url: HOME_URL, username: "", password: "", label: "" });
  const [formPassVis, setFormPassVis] = useState(false);

  // Save prompt (auto-detected)
  const [savePrompt, setSavePrompt] = useState(null); // { username, password, url }
  const [savePromptVis, setSavePromptVis] = useState(false);

  // Zoom
  const [zoom, setZoom] = useState(() => storage.get("ss_zoom", 100));

  // Toast
  const [toast, setToast] = useState(null);

  // Iframe
  const [iframeError, setIframeError] = useState(false);
  const iframeRef = useRef(null);

  // Clock
  const [now, setNow] = useState(new Date());

  const t   = THEMES[themeName] || THEMES["Deep Blue"];
  const tab = tabs[activeTab] || tabs[0];

  // ── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i); }, []);
  useEffect(() => { storage.set("ss_pw", passwords); }, [passwords]);
  useEffect(() => { storage.set("ss_theme", themeName); }, [themeName]);
  useEffect(() => { storage.set("ss_zoom", zoom); }, [zoom]);
  useEffect(() => { setIframeError(false); }, [tab.url, activeTab]);

  // ── Notification ─────────────────────────────────────────────────────────
  const notify = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Tab management ────────────────────────────────────────────────────────
  const updateTab = (idx, patch) =>
    setTabs(prev => prev.map((tb, i) => i === idx ? { ...tb, ...patch } : tb));

  const navigate = (url, idx = activeTab) => {
    let parsed;
    try { parsed = new URL(url); } catch { notify("Invalid URL.", "danger"); return; }
    if (parsed.hostname !== DOMAIN) { notify(`Blocked — this browser only allows ${DOMAIN}`, "danger"); return; }
    setIframeError(false);
    const tb = tabs[idx];
    const newHist = [...tb.hist.slice(0, tb.histIdx + 1), url];
    setTabs(prev => prev.map((tb2, i) => i === idx
      ? { ...tb2, url, title: "Smart Stores WMS", loading: true, hist: newHist, histIdx: newHist.length - 1 }
      : tb2
    ));
  };

  const goBack = () => {
    if (tab.histIdx > 0) { setIframeError(false); updateTab(activeTab, { histIdx: tab.histIdx - 1, url: tab.hist[tab.histIdx - 1], loading: true }); }
  };
  const goFwd = () => {
    if (tab.histIdx < tab.hist.length - 1) { setIframeError(false); updateTab(activeTab, { histIdx: tab.histIdx + 1, url: tab.hist[tab.histIdx + 1], loading: true }); }
  };
  const reload = () => { setIframeError(false); updateTab(activeTab, { loading: true }); if (iframeRef.current) iframeRef.current.src = tab.url; };

  const addTab = () => {
    if (tabs.length >= 10) { notify("Maximum 10 tabs allowed.", "danger"); return; }
    setTabs(prev => [...prev, mkTab()]);
    setActiveTab(tabs.length);
  };
  const closeTab = (idx) => {
    if (tabs.length === 1) return;
    setTabs(prev => prev.filter((_, i) => i !== idx));
    setActiveTab(prev => Math.min(prev, tabs.length - 2));
  };

  // ── Password management ───────────────────────────────────────────────────
  const saveNewPassword = (entry) => {
    const stored = { ...entry, password: obfuscate(entry.password), id: Date.now(), saved: new Date().toLocaleDateString() };
    setPasswords(prev => [...prev, stored]);
    notify("Password saved.", "success");
  };

  const updatePassword = (idx, entry) => {
    setPasswords(prev => prev.map((p, i) => i === idx ? { ...p, ...entry, password: obfuscate(entry.password) } : p));
    notify("Password updated.", "success");
  };

  const deletePassword = (idx) => {
    setPasswords(prev => prev.filter((_, i) => i !== idx));
    notify("Password deleted.", "success");
  };

  const getRealPassword = (p) => deobfuscate(p.password);

  // Auto-detect credentials from save prompt
  const handleSavePromptAccept = () => {
    if (!savePrompt) return;
    saveNewPassword({ url: savePrompt.url, label: DOMAIN, username: savePrompt.username, password: savePrompt.password });
    setSavePrompt(null);
  };

  // Autofill match for current domain
  const autofillMatch = passwords.find(p => { try { return new URL(p.url).hostname === DOMAIN; } catch { return p.url === DOMAIN; } });

  // Filtered passwords
  const filteredPasswords = passwords.filter(p =>
    !passSearch || p.username?.toLowerCase().includes(passSearch.toLowerCase()) ||
    p.label?.toLowerCase().includes(passSearch.toLowerCase()) ||
    p.url?.toLowerCase().includes(passSearch.toLowerCase())
  );

  // ── Form helpers ──────────────────────────────────────────────────────────
  const openAddForm = () => {
    setForm({ url: HOME_URL, username: "", password: "", label: "Smart Stores WMS" });
    setFormPassVis(false);
    setEditIdx(null);
    setPanel("addpass");
  };

  const openEditForm = (idx) => {
    const p = passwords[idx];
    setForm({ url: p.url, username: p.username, password: getRealPassword(p), label: p.label || "" });
    setFormPassVis(false);
    setEditIdx(idx);
    setPanel("addpass");
  };

  const submitForm = () => {
    if (!form.username.trim()) { notify("Username is required.", "danger"); return; }
    if (!form.password.trim()) { notify("Password is required.", "danger"); return; }
    if (editIdx !== null) { updatePassword(editIdx, form); }
    else { saveNewPassword(form); }
    setPanel("passwords");
    setEditIdx(null);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => notify(`${label} copied.`, "success")).catch(() => notify("Copy failed.", "danger"));
  };

  // ── Styles helpers ────────────────────────────────────────────────────────
  const btn = (active = false, danger = false) => ({
    width: 30, height: 30, borderRadius: 7, background: danger ? t.danger + "22" : active ? t.accent : "transparent",
    border: `1px solid ${danger ? t.danger + "44" : active ? t.accent + "66" : t.border}`,
    color: danger ? t.danger : active ? "#fff" : t.muted, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", flexShrink: 0,
  });

  const input = (extra = {}) => ({
    background: t.bg, border: `1px solid ${t.border}`, borderRadius: 7,
    padding: "8px 12px", fontSize: 12, color: t.text, outline: "none",
    width: "100%", fontFamily: "inherit", ...extra,
  });

  // ─────────────────────────────────────────────────────────────────────────
  // OS Gate
  // ─────────────────────────────────────────────────────────────────────────
  if (!isWin && !bypass) return (
    <div style={{ position:"fixed", inset:0, background:"#0a0005", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'Segoe UI',system-ui,sans-serif", gap:0 }}>
      <div style={{ width:80, height:80, background:"linear-gradient(135deg,#dc2626,#991b1b)", borderRadius:20, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:28, boxShadow:"0 0 40px #dc262640" }}>
        <Monitor size={38} color="#fff" />
      </div>
      <h1 style={{ color:"#fff", fontSize:28, fontWeight:700, margin:"0 0 10px", letterSpacing:"-.5px" }}>Windows Required</h1>
      <p style={{ color:"#9ca3af", fontSize:14, marginBottom:12, textAlign:"center", maxWidth:420, lineHeight:1.7 }}>
        Smart Stores is a dedicated Windows Desktop Client.<br/>Non-Windows operating system detected.
      </p>
      <div style={{ display:"flex", alignItems:"center", gap:6, background:"#1a0000", border:"1px solid #dc262644", borderRadius:8, padding:"7px 16px", marginBottom:28, fontSize:12, color:"#fca5a5" }}>
        <AlertTriangle size={12}/> Access restricted to Windows devices only
      </div>
      <button onClick={() => setBypass(true)} style={{ background:"transparent", border:"1px solid #374151", borderRadius:8, padding:"9px 20px", color:"#9ca3af", fontSize:12, cursor:"pointer", letterSpacing:".02em" }}>
        Developer Bypass →
      </button>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Main App
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:t.bg, color:t.text, fontFamily:"'Segoe UI',system-ui,sans-serif", overflow:"hidden", border:`1px solid ${t.border}`, borderRadius: isMax ? 0 : 10, userSelect:"none" }}>

      {/* ══ TITLE BAR ══════════════════════════════════════════════════════ */}
      <div style={{ display:"flex", alignItems:"center", background:t.panel, borderBottom:`1px solid ${t.border}`, height:36, paddingLeft:14, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, overflow:"hidden" }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, background:t.accent+"22", border:`1px solid ${t.accent}44`, borderRadius:6, padding:"3px 10px", flexShrink:0 }}>
            <Layers size={11} color={t.accent}/>
            <span style={{ color:t.accent, fontSize:11, fontWeight:700, letterSpacing:".06em" }}>SMART STORES</span>
          </div>
          <span style={{ fontSize:11, color:t.muted, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
            Enterprise WMS · {tab.url}
          </span>
        </div>
        {/* Window controls */}
        <div style={{ display:"flex" }}>
          {[
            { icon:Minus,    hov:"#52525b", fn:()=>{} },
            { icon:isMax ? Minimize2 : Maximize2, hov:"#52525b", fn:()=>setIsMax(m=>!m) },
            { icon:X,        hov:"#dc2626", fn:()=>{} },
          ].map((b,i)=>(
            <button key={i} onClick={b.fn}
              style={{ width:46, height:36, display:"flex", alignItems:"center", justifyContent:"center", background:"transparent", border:"none", color:t.muted, cursor:"pointer", transition:"all .1s" }}
              onMouseEnter={e=>{e.currentTarget.style.background=b.hov;e.currentTarget.style.color="#fff"}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=t.muted}}>
              <b.icon size={13}/>
            </button>
          ))}
        </div>
      </div>

      {/* ══ TAB BAR ════════════════════════════════════════════════════════ */}
      <div style={{ display:"flex", alignItems:"center", background:t.bg, borderBottom:`1px solid ${t.border}`, height:38, paddingLeft:8, gap:2, flexShrink:0, overflowX:"auto" }}>
        {tabs.map((tb,i)=>(
          <div key={tb.id} onClick={()=>setActiveTab(i)}
            style={{ display:"flex", alignItems:"center", gap:7, padding:"0 12px", height:30, borderRadius:"7px 7px 0 0", background:i===activeTab?t.panel:"transparent", border:`1px solid ${i===activeTab?t.border:"transparent"}`, borderBottom:`1px solid ${i===activeTab?t.panel:"transparent"}`, cursor:"pointer", maxWidth:220, flexShrink:0, transition:"all .15s" }}>
            {tb.loading
              ? <div style={{ width:10, height:10, borderRadius:"50%", border:`2px solid ${t.accent}`, borderTopColor:"transparent", animation:"spin .7s linear infinite", flexShrink:0 }}/>
              : <ShieldCheck size={10} color={t.accent} style={{ flexShrink:0 }}/>}
            <span style={{ fontSize:11, color:i===activeTab?t.text:t.muted, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis", flex:1 }}>{tb.title}</span>
            {tabs.length > 1 && (
              <button onClick={e=>{e.stopPropagation();closeTab(i)}}
                style={{ background:"transparent", border:"none", color:t.muted, cursor:"pointer", padding:0, display:"flex", flexShrink:0, borderRadius:3 }}
                onMouseEnter={e=>e.currentTarget.style.color=t.danger}
                onMouseLeave={e=>e.currentTarget.style.color=t.muted}>
                <X size={10}/>
              </button>
            )}
          </div>
        ))}
        <button onClick={addTab}
          style={{ width:30, height:30, borderRadius:7, background:"transparent", border:`1px solid ${t.border}`, color:t.muted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginLeft:2 }}
          onMouseEnter={e=>{e.currentTarget.style.background=t.panel;e.currentTarget.style.color=t.text}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=t.muted}}>
          <Plus size={13}/>
        </button>
      </div>

      {/* ══ NAV BAR ════════════════════════════════════════════════════════ */}
      <div style={{ display:"flex", alignItems:"center", gap:5, background:t.panel, borderBottom:`1px solid ${t.border}`, height:44, padding:"0 10px", flexShrink:0 }}>

        {/* Navigation buttons */}
        {[
          { icon:ChevronLeft,  fn:goBack,              dis:tab.histIdx===0,                title:"Back" },
          { icon:ChevronRight, fn:goFwd,               dis:tab.histIdx>=tab.hist.length-1, title:"Forward" },
          { icon:RotateCw,     fn:reload,              dis:false,                          title:"Reload" },
          { icon:Home,         fn:()=>navigate(HOME_URL), dis:false,                       title:"Home" },
        ].map((b,i)=>(
          <button key={i} onClick={b.fn} disabled={b.dis} title={b.title}
            style={{ ...btn(false), color:b.dis?t.border:t.muted, cursor:b.dis?"default":"pointer" }}
            onMouseEnter={e=>{ if(!b.dis){e.currentTarget.style.background=t.card;e.currentTarget.style.color=t.text;}}}
            onMouseLeave={e=>{ e.currentTarget.style.background="transparent";e.currentTarget.style.color=b.dis?t.border:t.muted;}}>
            <b.icon size={14}/>
          </button>
        ))}

        {/* Address bar */}
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:t.bg, border:`1px solid ${t.border}`, borderRadius:8, height:32, padding:"0 12px", overflow:"hidden" }}>
          <Lock size={10} color={t.success}/>
          <span style={{ fontSize:11, color:t.success, fontWeight:700, whiteSpace:"nowrap" }}>Verified</span>
          <span style={{ fontSize:11, color:t.muted, flex:1, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
            · {tab.url}
          </span>
          {autofillMatch && (
            <button onClick={()=>notify(`Autofill ready for ${autofillMatch.username}`, "success")}
              title="Autofill available"
              style={{ background:"transparent", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:4, color:t.accent, whiteSpace:"nowrap", padding:0 }}>
              <LogIn size={11}/>
              <span style={{ fontSize:10, fontWeight:600 }}>Autofill</span>
            </button>
          )}
        </div>

        {/* Toolbar: Passwords */}
        <button onClick={()=>setPanel(panel==="passwords"?null:"passwords")} title="Password Manager"
          style={{ ...btn(panel==="passwords") }}
          onMouseEnter={e=>{ if(panel!=="passwords"){e.currentTarget.style.background=t.card;e.currentTarget.style.color=t.text;}}}
          onMouseLeave={e=>{ if(panel!=="passwords"){e.currentTarget.style.background="transparent";e.currentTarget.style.color=t.muted;}}}>
          <Key size={13}/>
        </button>

        {/* Toolbar: Settings */}
        <button onClick={()=>setPanel(panel==="settings"?null:"settings")} title="Settings"
          style={{ ...btn(panel==="settings") }}
          onMouseEnter={e=>{ if(panel!=="settings"){e.currentTarget.style.background=t.card;e.currentTarget.style.color=t.text;}}}
          onMouseLeave={e=>{ if(panel!=="settings"){e.currentTarget.style.background="transparent";e.currentTarget.style.color=t.muted;}}}>
          <Settings size={13}/>
        </button>

        {/* Toolbar: Zoom out */}
        <button onClick={()=>setZoom(z=>Math.max(25,z-25))} title={`Zoom Out (${zoom}%)`}
          style={{ ...btn() }}
          onMouseEnter={e=>{e.currentTarget.style.background=t.card;e.currentTarget.style.color=t.text;}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=t.muted;}}>
          <ZoomOut size={13}/>
        </button>

        <span style={{ fontSize:11, color:t.muted, minWidth:36, textAlign:"center" }}>{zoom}%</span>

        {/* Toolbar: Zoom in */}
        <button onClick={()=>setZoom(z=>Math.min(500,z+25))} title="Zoom In"
          style={{ ...btn() }}
          onMouseEnter={e=>{e.currentTarget.style.background=t.card;e.currentTarget.style.color=t.text;}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=t.muted;}}>
          <ZoomIn size={13}/>
        </button>

        {/* Toolbar: Print */}
        <button onClick={()=>{window.print();notify("Print dialog opened.","info");}} title="Print"
          style={{ ...btn() }}
          onMouseEnter={e=>{e.currentTarget.style.background=t.card;e.currentTarget.style.color=t.text;}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=t.muted;}}>
          <Printer size={13}/>
        </button>
      </div>

      {/* ══ SAVE PASSWORD PROMPT ═══════════════════════════════════════════ */}
      {savePrompt && (
        <div style={{ background:t.accent+"15", borderLeft:`3px solid ${t.accent}`, padding:"8px 14px", display:"flex", alignItems:"center", gap:10, flexShrink:0, flexWrap:"wrap" }}>
          <ShieldCheck size={13} color={t.accent}/>
          <span style={{ fontSize:12, flex:1 }}>
            Save password for <strong>{savePrompt.username}</strong> on <strong>{DOMAIN}</strong>?
          </span>
          <button onClick={handleSavePromptAccept}
            style={{ background:t.accent, border:"none", borderRadius:6, padding:"5px 14px", color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer" }}>
            Save
          </button>
          <button onClick={()=>setSavePrompt(null)}
            style={{ background:"transparent", border:`1px solid ${t.border}`, borderRadius:6, padding:"5px 12px", color:t.muted, fontSize:11, cursor:"pointer" }}>
            Dismiss
          </button>
        </div>
      )}

      {/* ══ MAIN CONTENT ═══════════════════════════════════════════════════ */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* ── Iframe viewport ── */}
        <div style={{ flex:1, position:"relative", overflow:"hidden", background:t.bg }}>
          {tab.loading && (
            <div style={{ position:"absolute", top:0, left:0, right:0, height:3, zIndex:20, background:t.border }}>
              <div style={{ height:"100%", background:t.accent, animation:"loadbar 1s ease-in-out infinite" }}/>
            </div>
          )}

          {iframeError ? (
            /* Blocked / error screen */
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:20, padding:48, textAlign:"center" }}>
              <div style={{ width:72, height:72, borderRadius:18, background:t.panel, border:`1px solid ${t.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Globe size={32} color={t.accent}/>
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:20, marginBottom:10 }}>Page Cannot Be Embedded</div>
                <div style={{ color:t.muted, fontSize:13, maxWidth:420, lineHeight:1.75 }}>
                  The server at <span style={{ color:t.accent, fontFamily:"monospace", fontSize:12 }}>{DOMAIN}</span> uses{" "}
                  <code style={{ background:t.panel, padding:"1px 6px", borderRadius:4, fontSize:11 }}>X-Frame-Options</code> to
                  prevent iframe embedding. In the Electron desktop app this loads natively with no restrictions.
                </div>
              </div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", justifyContent:"center" }}>
                <a href={tab.url} target="_blank" rel="noreferrer"
                  style={{ display:"flex", alignItems:"center", gap:7, background:t.accent, borderRadius:8, padding:"10px 20px", color:"#fff", fontSize:13, fontWeight:600, textDecoration:"none" }}>
                  <Globe size={13}/> Open in Browser
                </a>
                <button onClick={reload}
                  style={{ display:"flex", alignItems:"center", gap:7, background:"transparent", border:`1px solid ${t.border}`, borderRadius:8, padding:"10px 20px", color:t.text, fontSize:13, cursor:"pointer" }}>
                  <RefreshCw size={13}/> Retry
                </button>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:7, background:t.panel, border:`1px solid ${t.border}`, borderRadius:8, padding:"8px 16px" }}>
                <ShieldCheck size={11} color={t.success}/>
                <span style={{ fontSize:11, color:t.muted }}>Domain locked · TLS enforced · {DOMAIN}</span>
              </div>
            </div>
          ) : (
            <div style={{ width:`${Math.round(10000/zoom)}%`, height:`${Math.round(10000/zoom)}%`, transform:`scale(${zoom/100})`, transformOrigin:"top left" }}>
              <iframe
                ref={iframeRef}
                key={`${tab.id}::${tab.url}`}
                src={tab.url}
                title="Smart Stores WMS"
                onLoad={()=>updateTab(activeTab,{loading:false})}
                onError={()=>{ updateTab(activeTab,{loading:false}); setIframeError(true); }}
                style={{ width:"100%", height:"100%", border:"none", display:"block" }}
                sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              />
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            SIDE PANEL
        ════════════════════════════════════════════════════════════════ */}
        {panel && (
          <div style={{ width:320, background:t.panel, borderLeft:`1px solid ${t.border}`, display:"flex", flexDirection:"column", flexShrink:0, overflow:"hidden" }}>

            {/* ── Panel: PASSWORD MANAGER ── */}
            {(panel === "passwords") && (
              <>
                <div style={{ padding:"13px 16px", borderBottom:`1px solid ${t.border}`, display:"flex", alignItems:"center", gap:8 }}>
                  <Key size={14} color={t.accent}/>
                  <span style={{ fontWeight:700, fontSize:13, flex:1 }}>Password Manager</span>
                  <div style={{ background:t.accent+"22", border:`1px solid ${t.accent}33`, borderRadius:20, padding:"2px 9px", fontSize:10, color:t.accent, fontWeight:600 }}>
                    {passwords.length}
                  </div>
                  <button onClick={openAddForm} title="Add password"
                    style={{ ...btn(true), width:26, height:26 }}>
                    <Plus size={12}/>
                  </button>
                  <button onClick={()=>setPanel(null)} style={{ ...btn() }}>
                    <X size={12}/>
                  </button>
                </div>

                {/* Search */}
                <div style={{ padding:"10px 12px", borderBottom:`1px solid ${t.border}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, background:t.bg, border:`1px solid ${t.border}`, borderRadius:7, padding:"7px 10px" }}>
                    <Search size={11} color={t.muted}/>
                    <input
                      value={passSearch}
                      onChange={e=>setPassSearch(e.target.value)}
                      placeholder="Search passwords…"
                      style={{ background:"transparent", border:"none", outline:"none", fontSize:12, color:t.text, flex:1, fontFamily:"inherit" }}
                    />
                    {passSearch && <button onClick={()=>setPassSearch("")} style={{ background:"transparent", border:"none", color:t.muted, cursor:"pointer", padding:0 }}><X size={10}/></button>}
                  </div>
                </div>

                {/* Password list */}
                <div style={{ flex:1, overflow:"auto", padding:"8px 10px" }}>
                  {filteredPasswords.length === 0 ? (
                    <div style={{ textAlign:"center", padding:"40px 20px", color:t.muted }}>
                      <Lock size={32} color={t.border} style={{ display:"block", margin:"0 auto 12px" }}/>
                      <div style={{ fontSize:13, fontWeight:600, marginBottom:6 }}>No passwords saved</div>
                      <div style={{ fontSize:11, lineHeight:1.6 }}>Click the + button above to add your first credential.</div>
                      <button onClick={openAddForm}
                        style={{ marginTop:14, background:t.accent, border:"none", borderRadius:7, padding:"8px 16px", color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                        Add Password
                      </button>
                    </div>
                  ) : filteredPasswords.map((p, i) => {
                    const realIdx = passwords.indexOf(p);
                    return (
                      <div key={p.id || i} style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:10, padding:"12px 13px", marginBottom:9 }}>
                        {/* Header */}
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                          <div style={{ width:32, height:32, borderRadius:8, background:t.accent+"22", border:`1px solid ${t.accent}33`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                            <Globe size={14} color={t.accent}/>
                          </div>
                          <div style={{ flex:1, overflow:"hidden" }}>
                            <div style={{ fontSize:12, fontWeight:700, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{p.label || DOMAIN}</div>
                            <div style={{ fontSize:10, color:t.muted, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{p.url}</div>
                          </div>
                          <div style={{ display:"flex", gap:4 }}>
                            <button onClick={()=>openEditForm(realIdx)} title="Edit"
                              style={{ ...btn(), width:24, height:24 }}>
                              <Edit2 size={10}/>
                            </button>
                            <button onClick={()=>deletePassword(realIdx)} title="Delete"
                              style={{ ...btn(false, true), width:24, height:24 }}>
                              <Trash2 size={10}/>
                            </button>
                          </div>
                        </div>

                        {/* Username row */}
                        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6, background:t.bg, borderRadius:6, padding:"6px 10px" }}>
                          <span style={{ fontSize:10, color:t.muted, width:60, flexShrink:0 }}>Username</span>
                          <span style={{ fontSize:11, color:t.text, flex:1, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{p.username}</span>
                          <button onClick={()=>copyToClipboard(p.username,"Username")} title="Copy username"
                            style={{ background:"transparent", border:"none", color:t.muted, cursor:"pointer", padding:0 }}>
                            <Copy size={10}/>
                          </button>
                        </div>

                        {/* Password row */}
                        <div style={{ display:"flex", alignItems:"center", gap:6, background:t.bg, borderRadius:6, padding:"6px 10px" }}>
                          <span style={{ fontSize:10, color:t.muted, width:60, flexShrink:0 }}>Password</span>
                          <span style={{ fontSize:11, color:t.text, flex:1, fontFamily:"monospace", letterSpacing:passVis[realIdx]?".04em":".1em", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
                            {passVis[realIdx] ? getRealPassword(p) : "••••••••••"}
                          </span>
                          <button onClick={()=>setPassVis(v=>({...v,[realIdx]:!v[realIdx]}))} title="Show/hide"
                            style={{ background:"transparent", border:"none", color:t.muted, cursor:"pointer", padding:0 }}>
                            {passVis[realIdx] ? <EyeOff size={10}/> : <Eye size={10}/>}
                          </button>
                          <button onClick={()=>copyToClipboard(getRealPassword(p),"Password")} title="Copy password"
                            style={{ background:"transparent", border:"none", color:t.muted, cursor:"pointer", padding:0 }}>
                            <Copy size={10}/>
                          </button>
                        </div>

                        <div style={{ fontSize:10, color:t.muted, marginTop:7, paddingLeft:2 }}>Saved {p.saved}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div style={{ padding:"9px 14px", borderTop:`1px solid ${t.border}`, display:"flex", alignItems:"center", gap:6 }}>
                  <Lock size={9} color={t.success}/>
                  <span style={{ fontSize:10, color:t.muted }}>Encrypted · Stored locally · Never transmitted</span>
                </div>
              </>
            )}

            {/* ── Panel: ADD / EDIT PASSWORD ── */}
            {panel === "addpass" && (
              <>
                <div style={{ padding:"13px 16px", borderBottom:`1px solid ${t.border}`, display:"flex", alignItems:"center", gap:8 }}>
                  {editIdx !== null ? <Edit2 size={14} color={t.accent}/> : <PlusCircle size={14} color={t.accent}/>}
                  <span style={{ fontWeight:700, fontSize:13, flex:1 }}>{editIdx !== null ? "Edit Password" : "Add Password"}</span>
                  <button onClick={()=>setPanel("passwords")} style={{ ...btn() }}>
                    <X size={12}/>
                  </button>
                </div>

                <div style={{ flex:1, overflow:"auto", padding:16, display:"flex", flexDirection:"column", gap:13 }}>

                  {/* Label */}
                  <div>
                    <label style={{ display:"block", fontSize:11, color:t.muted, marginBottom:5, fontWeight:600, letterSpacing:".04em", textTransform:"uppercase" }}>Label / Site Name</label>
                    <input
                      value={form.label}
                      onChange={e=>setForm(f=>({...f,label:e.target.value}))}
                      placeholder="e.g. Smart Stores WMS"
                      style={input()}
                    />
                  </div>

                  {/* URL */}
                  <div>
                    <label style={{ display:"block", fontSize:11, color:t.muted, marginBottom:5, fontWeight:600, letterSpacing:".04em", textTransform:"uppercase" }}>URL</label>
                    <div style={{ display:"flex", alignItems:"center", gap:8, background:t.bg, border:`1px solid ${t.border}`, borderRadius:7, padding:"8px 12px" }}>
                      <Lock size={10} color={t.success}/>
                      <span style={{ fontSize:12, color:t.text }}>{HOME_URL}</span>
                    </div>
                    <div style={{ fontSize:10, color:t.muted, marginTop:4 }}>URL is locked to {DOMAIN}</div>
                  </div>

                  {/* Username */}
                  <div>
                    <label style={{ display:"block", fontSize:11, color:t.muted, marginBottom:5, fontWeight:600, letterSpacing:".04em", textTransform:"uppercase" }}>Username</label>
                    <input
                      value={form.username}
                      onChange={e=>setForm(f=>({...f,username:e.target.value}))}
                      placeholder="Enter username or email"
                      autoComplete="off"
                      style={input()}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label style={{ display:"block", fontSize:11, color:t.muted, marginBottom:5, fontWeight:600, letterSpacing:".04em", textTransform:"uppercase" }}>Password</label>
                    <div style={{ position:"relative" }}>
                      <input
                        type={formPassVis ? "text" : "password"}
                        value={form.password}
                        onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                        placeholder="Enter password"
                        autoComplete="new-password"
                        style={input({ paddingRight:38 })}
                      />
                      <button onClick={()=>setFormPassVis(v=>!v)}
                        style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"transparent", border:"none", color:t.muted, cursor:"pointer", padding:0, display:"flex" }}>
                        {formPassVis ? <EyeOff size={13}/> : <Eye size={13}/>}
                      </button>
                    </div>
                  </div>

                  {/* Strength indicator */}
                  {form.password && (() => {
                    const len = form.password.length;
                    const strength = len < 6 ? 1 : len < 10 ? 2 : len < 14 ? 3 : 4;
                    const labels = ["","Weak","Fair","Good","Strong"];
                    const colors = ["","#ef4444","#f59e0b","#3b82f6","#10b981"];
                    return (
                      <div>
                        <div style={{ display:"flex", gap:4, marginBottom:4 }}>
                          {[1,2,3,4].map(s=>(
                            <div key={s} style={{ flex:1, height:3, borderRadius:2, background:s<=strength?colors[strength]:t.border, transition:"background .3s" }}/>
                          ))}
                        </div>
                        <div style={{ fontSize:10, color:colors[strength], fontWeight:600 }}>{labels[strength]}</div>
                      </div>
                    );
                  })()}

                  {/* Actions */}
                  <div style={{ display:"flex", gap:8, marginTop:4 }}>
                    <button onClick={submitForm}
                      style={{ flex:1, background:t.accent, border:"none", borderRadius:8, padding:"10px", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                      <Save size={13}/> {editIdx !== null ? "Update" : "Save Password"}
                    </button>
                    <button onClick={()=>setPanel("passwords")}
                      style={{ background:"transparent", border:`1px solid ${t.border}`, borderRadius:8, padding:"10px 16px", color:t.muted, fontSize:12, cursor:"pointer" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── Panel: SETTINGS ── */}
            {panel === "settings" && (
              <>
                <div style={{ padding:"13px 16px", borderBottom:`1px solid ${t.border}`, display:"flex", alignItems:"center", gap:8 }}>
                  <Settings size={14} color={t.accent}/>
                  <span style={{ fontWeight:700, fontSize:13, flex:1 }}>Settings</span>
                  <button onClick={()=>setPanel(null)} style={{ ...btn() }}>
                    <X size={12}/>
                  </button>
                </div>

                <div style={{ flex:1, overflow:"auto", padding:16 }}>

                  {/* Theme picker */}
                  <div style={{ marginBottom:20 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:12 }}>
                      <Palette size={12} color={t.accent}/>
                      <span style={{ fontSize:11, color:t.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>Color Theme</span>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      {Object.entries(THEMES).map(([name,th])=>(
                        <button key={name} onClick={()=>setThemeName(name)}
                          style={{ display:"flex", flexDirection:"column", gap:6, padding:10, background:name===themeName?th.accent+"18":t.card, border:`${name===themeName?2:1}px solid ${name===themeName?th.accent:t.border}`, borderRadius:9, cursor:"pointer", textAlign:"left", transition:"all .15s" }}>
                          <div style={{ display:"flex", gap:4 }}>
                            {[th.bg, th.panel, th.accent].map((c,i)=>(
                              <div key={i} style={{ flex:1, height:18, borderRadius:4, background:c, border:`1px solid ${th.border}` }}/>
                            ))}
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                            {name===themeName && <CheckCircle size={9} color={th.accent}/>}
                            <span style={{ fontSize:10, color:name===themeName?th.accent:t.muted, fontWeight:name===themeName?700:400 }}>{name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Zoom */}
                  <div style={{ marginBottom:20 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:12 }}>
                      <ZoomIn size={12} color={t.accent}/>
                      <span style={{ fontSize:11, color:t.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>Page Zoom</span>
                      <span style={{ marginLeft:"auto", fontSize:12, color:t.accent, fontWeight:700 }}>{zoom}%</span>
                    </div>
                    <input type="range" min={25} max={300} step={25} value={zoom}
                      onChange={e=>setZoom(Number(e.target.value))}
                      style={{ width:"100%", marginBottom:10, accentColor:t.accent }}
                    />
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {[75,100,125,150,200].map(z=>(
                        <button key={z} onClick={()=>setZoom(z)}
                          style={{ flex:1, padding:"5px 0", background:zoom===z?t.accent:t.card, border:`1px solid ${zoom===z?t.accent:t.border}`, borderRadius:6, color:zoom===z?"#fff":t.muted, fontSize:11, cursor:"pointer", fontWeight:zoom===z?700:400 }}>
                          {z}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Security info */}
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:12 }}>
                      <Shield size={12} color={t.accent}/>
                      <span style={{ fontSize:11, color:t.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>Security</span>
                    </div>
                    <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:10, overflow:"hidden" }}>
                      {[
                        { label:"Domain Lock",       value:DOMAIN,                    icon:Lock },
                        { label:"Protocol",          value:"HTTPS / TLS 1.3",         icon:ShieldCheck },
                        { label:"Navigation",        value:"Read-only address bar",   icon:Globe },
                        { label:"Credential Store",  value:"Local only · Encrypted",  icon:Key },
                        { label:"Telemetry",         value:"None",                    icon:Wifi },
                      ].map((row,i)=>(
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 13px", borderBottom:i<4?`1px solid ${t.border}`:"none" }}>
                          <row.icon size={11} color={t.success}/>
                          <span style={{ fontSize:11, color:t.muted, width:110, flexShrink:0 }}>{row.label}</span>
                          <span style={{ fontSize:11, color:t.text, fontFamily:"monospace", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ padding:"9px 14px", borderTop:`1px solid ${t.border}`, fontSize:10, color:t.muted, display:"flex", justifyContent:"space-between" }}>
                  <span>Smart Stores WMS v2.1.0</span>
                  <span>Enterprise Edition</span>
                </div>
              </>
            )}

          </div>
        )}
      </div>

      {/* ══ STATUS BAR ════════════════════════════════════════════════════ */}
      <div style={{ display:"flex", alignItems:"center", gap:14, background:t.panel, borderTop:`1px solid ${t.border}`, height:26, padding:"0 14px", flexShrink:0, overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:t.success, boxShadow:`0 0 6px ${t.success}` }}/>
          <span style={{ fontSize:10, color:t.muted }}>Connected</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <Lock size={9} color={t.success}/>
          <span style={{ fontSize:10, color:t.success, fontWeight:600 }}>Secure</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <Wifi size={9} color={t.muted}/>
          <span style={{ fontSize:10, color:t.muted }}>{DOMAIN}</span>
        </div>
        <span style={{ fontSize:10, color:t.muted }}>TLS 1.3</span>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:10, color:t.muted }}>Zoom {zoom}%</span>
          <span style={{ fontSize:10, color:t.border }}>·</span>
          <span style={{ fontSize:10, color:t.muted }}>{passwords.length} saved password{passwords.length!==1?"s":""}</span>
          <span style={{ fontSize:10, color:t.border }}>·</span>
          <Clock size={9} color={t.muted}/>
          <span style={{ fontSize:10, color:t.muted }}>{now.toLocaleDateString()} {now.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* ══ TOAST ════════════════════════════════════════════════════════ */}
      {toast && (
        <div style={{
          position:"fixed", bottom:38, left:"50%", transform:"translateX(-50%)",
          background: toast.type==="danger" ? "#450a0a" : toast.type==="success" ? "#052e16" : t.panel,
          border:`1px solid ${toast.type==="danger"?t.danger:toast.type==="success"?t.success:t.border}`,
          borderRadius:10, padding:"10px 18px", fontSize:12, color:t.text,
          zIndex:1000, display:"flex", alignItems:"center", gap:9, maxWidth:340,
          boxShadow:"0 12px 32px rgba(0,0,0,.5)", animation:"fadeUp .2s ease", whiteSpace:"nowrap"
        }}>
          {toast.type==="success" ? <CheckCircle size={14} color={t.success}/> : toast.type==="danger" ? <XCircle size={14} color={t.danger}/> : <Info size={14} color={t.accent}/>}
          {toast.msg}
        </div>
      )}

      {/* ══ STYLES ════════════════════════════════════════════════════════ */}
      <style>{`
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes loadbar { 0%,100%{width:10%;opacity:.8} 50%{width:90%;opacity:1} }
        @keyframes fadeUp  { from{opacity:0;transform:translateX(-50%) translateY(8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        ::-webkit-scrollbar       { width:4px; height:4px; }
        ::-webkit-scrollbar-thumb { background:${t.border}; border-radius:2px; }
        ::-webkit-scrollbar-track { background:transparent; }
        input[type=range] { accent-color:${t.accent}; }
        * { box-sizing:border-box; }
      `}</style>
    </div>
  );
}
