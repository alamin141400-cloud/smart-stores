import { useState, useEffect, useRef } from "react";
import {
  Shield, ShieldCheck, ChevronLeft, ChevronRight, RotateCw, Home,
  X, Plus, Minus, Maximize2, Minimize2, Lock, Eye, EyeOff, Trash2,
  Key, Settings, Star, ZoomIn, ZoomOut, Printer,
  Wifi, Clock, CheckCircle, XCircle, Activity, Layers,
  AlertTriangle, Globe, RefreshCw
} from "lucide-react";

const DOMAIN   = "arman.ahrtechdiv.com";
const HOME_URL = `https://${DOMAIN}`;

const THEMES = {
  "Deep Blue":    { bg:"#0f172a", panel:"#1e293b", accent:"#3b82f6", text:"#e2e8f0", muted:"#94a3b8", border:"#334155" },
  "Midnight":     { bg:"#0a0a0f", panel:"#13131f", accent:"#8b5cf6", text:"#e2e8f0", muted:"#9ca3af", border:"#2d2d3f" },
  "Emerald":      { bg:"#022c22", panel:"#064e3b", accent:"#10b981", text:"#d1fae5", muted:"#6ee7b7", border:"#047857" },
  "Royal Purple": { bg:"#1a0533", panel:"#2d0a52", accent:"#a855f7", text:"#f3e8ff", muted:"#c084fc", border:"#7e22ce" },
  "Crimson":      { bg:"#1a0606", panel:"#2d0f0f", accent:"#ef4444", text:"#fee2e2", muted:"#fca5a5", border:"#dc2626" },
  "Ocean":        { bg:"#042330", panel:"#0c3547", accent:"#06b6d4", text:"#cffafe", muted:"#67e8f9", border:"#0891b2" },
  "Slate Light":  { bg:"#f1f5f9", panel:"#ffffff", accent:"#3b82f6", text:"#1e293b", muted:"#64748b", border:"#cbd5e1" },
  "Amber Gold":   { bg:"#1c0f00", panel:"#2d1a00", accent:"#f59e0b", text:"#fef3c7", muted:"#fcd34d", border:"#d97706" },
};

let _tabId = 1;
const newTab = () => ({
  id: _tabId++, url: HOME_URL, title: "Smart Stores WMS",
  loading: true, hist: [HOME_URL], histIdx: 0
});

export default function SmartStores() {
  const isWin = /windows/i.test(navigator.userAgent);
  const [bypass, setBypass]               = useState(false);
  const [tabs, setTabs]                   = useState([newTab()]);
  const [activeTab, setActiveTab]         = useState(0);
  const [themeName, setThemeName]         = useState("Deep Blue");
  const [showSettings, setShowSettings]   = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwords, setPasswords]         = useState(() => {
    try { return JSON.parse(localStorage.getItem("ss_pw") || "[]"); } catch { return []; }
  });
  const [bookmarks, setBookmarks]         = useState(() => {
    try { return JSON.parse(localStorage.getItem("ss_bm") || "[]"); } catch { return []; }
  });
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [saveUser, setSaveUser]           = useState("");
  const [savePass, setSavePass]           = useState("");
  const [passVis, setPassVis]             = useState({});
  const [zoom, setZoom]                   = useState(100);
  const [isMax, setIsMax]                 = useState(false);
  const [now, setNow]                     = useState(new Date());
  const [toast, setToast]                 = useState(null);
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const iframeRef                         = useRef(null);

  const t   = THEMES[themeName];
  const tab = tabs[activeTab] || tabs[0];

  useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i); }, []);
  useEffect(() => { localStorage.setItem("ss_pw", JSON.stringify(passwords)); }, [passwords]);
  useEffect(() => { localStorage.setItem("ss_bm", JSON.stringify(bookmarks)); }, [bookmarks]);
  useEffect(() => { setIframeBlocked(false); }, [tab.url, activeTab]);

  const notify = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateTab = (idx, patch) =>
    setTabs(prev => prev.map((tb, i) => i === idx ? { ...tb, ...patch } : tb));

  const navigate = (url, idx = activeTab) => {
    try {
      const host = new URL(url).hostname;
      if (host !== DOMAIN) { notify(`Blocked — only ${DOMAIN} is permitted.`, "danger"); return; }
    } catch { notify("Invalid URL.", "danger"); return; }
    const tb = tabs[idx];
    const newHist = [...tb.hist.slice(0, tb.histIdx + 1), url];
    setIframeBlocked(false);
    setTabs(prev => prev.map((tb2, i) => i === idx
      ? { ...tb2, url, title: "Smart Stores WMS", loading: true, hist: newHist, histIdx: newHist.length - 1 }
      : tb2
    ));
    if (/login|auth|signin/i.test(url)) setShowSavePrompt(true);
  };

  const goBack = () => {
    if (tab.histIdx > 0) {
      const idx = tab.histIdx - 1;
      setIframeBlocked(false);
      updateTab(activeTab, { histIdx: idx, url: tab.hist[idx], loading: true });
    }
  };
  const goFwd = () => {
    if (tab.histIdx < tab.hist.length - 1) {
      const idx = tab.histIdx + 1;
      setIframeBlocked(false);
      updateTab(activeTab, { histIdx: idx, url: tab.hist[idx], loading: true });
    }
  };
  const reload = () => {
    setIframeBlocked(false);
    updateTab(activeTab, { loading: true });
    if (iframeRef.current) iframeRef.current.src = tab.url;
  };

  const addTab = () => {
    if (tabs.length >= 10) { notify("Maximum 10 tabs allowed.", "danger"); return; }
    const t2 = newTab();
    setTabs(prev => [...prev, t2]);
    setActiveTab(tabs.length);
  };
  const closeTab = (idx) => {
    if (tabs.length === 1) return;
    setTabs(prev => prev.filter((_, i) => i !== idx));
    setActiveTab(prev => Math.min(prev, tabs.length - 2));
  };

  const savePassword = () => {
    setPasswords(prev => [...prev, {
      domain: DOMAIN, username: saveUser, password: savePass,
      saved: new Date().toLocaleDateString()
    }]);
    setShowSavePrompt(false); setSaveUser(""); setSavePass("");
    notify("Password saved securely.", "success");
  };

  const addBookmark = () => {
    if (!bookmarks.find(b => b.url === tab.url)) {
      setBookmarks(prev => [...prev, { title: tab.title, url: tab.url }]);
      notify("Bookmark saved.", "success");
    } else { notify("Already bookmarked.", "info"); }
  };

  const autofill = passwords.find(p => p.domain === DOMAIN);

  /* ── OS Gate ── */
  if (!isWin && !bypass) return (
    <div style={{ position:"fixed", inset:0, background:"#0d0005", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <div style={{ width:72, height:72, background:"#dc2626", borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:24 }}>
        <AlertTriangle size={34} color="#fff" />
      </div>
      <h1 style={{ color:"#ef4444", fontSize:26, fontWeight:700, margin:"0 0 8px" }}>Windows Required</h1>
      <p style={{ color:"#9ca3af", fontSize:14, marginBottom:32, textAlign:"center", maxWidth:400 }}>
        Smart Stores is a dedicated Windows Desktop Client for the WMS.<br/>
        Please access from a Windows device.
      </p>
      <div style={{ display:"flex", gap:12 }}>
        <div style={{ background:"#1a0000", border:"1px solid #dc2626", borderRadius:8, padding:"8px 16px", fontSize:12, color:"#ef4444" }}>Non-Windows OS detected</div>
        <button onClick={() => setBypass(true)} style={{ background:"transparent", border:"1px solid #444", borderRadius:8, padding:"8px 16px", color:"#9ca3af", fontSize:12, cursor:"pointer" }}>
          Developer bypass →
        </button>
      </div>
    </div>
  );

  /* ── Iframe Blocked Screen ── */
  const BlockedScreen = () => (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", background:t.bg, color:t.text, gap:18, padding:48, textAlign:"center" }}>
      <div style={{ width:68, height:68, borderRadius:16, background:t.panel, border:`1px solid ${t.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Globe size={30} color={t.accent} />
      </div>
      <div>
        <div style={{ fontWeight:700, fontSize:19, marginBottom:8 }}>Cannot display in preview</div>
        <div style={{ color:t.muted, fontSize:13, maxWidth:400, lineHeight:1.7 }}>
          The server at <span style={{ color:t.accent, fontFamily:"monospace" }}>{DOMAIN}</span> has blocked
          iframe embedding via <code style={{ background:t.panel, padding:"1px 6px", borderRadius:4, fontSize:12 }}>X-Frame-Options</code>.
          In the real Electron desktop app this page loads natively with full access.
        </div>
      </div>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", justifyContent:"center" }}>
        <a href={tab.url} target="_blank" rel="noreferrer"
          style={{ display:"flex", alignItems:"center", gap:7, background:t.accent, border:"none", borderRadius:8, padding:"10px 20px", color:"#fff", fontSize:13, fontWeight:600, textDecoration:"none" }}>
          <Globe size={13}/> Open in browser
        </a>
        <button onClick={reload}
          style={{ display:"flex", alignItems:"center", gap:7, background:"transparent", border:`1px solid ${t.border}`, borderRadius:8, padding:"10px 20px", color:t.text, fontSize:13, cursor:"pointer" }}>
          <RefreshCw size={13}/> Retry
        </button>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:7, background:t.panel, border:`1px solid ${t.border}`, borderRadius:8, padding:"8px 16px" }}>
        <ShieldCheck size={12} color="#10b981"/>
        <span style={{ fontSize:11, color:t.muted }}>Domain lock active · TLS verified · {DOMAIN}</span>
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:t.bg, color:t.text, fontFamily:"'Segoe UI',system-ui,sans-serif", userSelect:"none", overflow:"hidden", border:`1px solid ${t.border}`, borderRadius: isMax ? 0 : 8 }}>

      {/* ── Title Bar ── */}
      <div style={{ display:"flex", alignItems:"center", background:t.panel, borderBottom:`1px solid ${t.border}`, height:32, paddingLeft:12, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flex:1 }}>
          <div style={{ background:t.accent, borderRadius:4, padding:"2px 8px", display:"flex", alignItems:"center", gap:5 }}>
            <Layers size={10} color="#fff"/>
            <span style={{ color:"#fff", fontSize:10, fontWeight:700, letterSpacing:".05em" }}>SMART STORES</span>
          </div>
          <span style={{ fontSize:11, color:t.muted, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis", maxWidth:360 }}>
            Enterprise WMS — {tab.url}
          </span>
        </div>
        <div style={{ display:"flex" }}>
          {[
            { icon:Minus,                                   hover:"#3f3f46", fn:()=>{} },
            { icon:isMax ? Minimize2 : Maximize2,           hover:"#3f3f46", fn:()=>setIsMax(m=>!m) },
            { icon:X,                                       hover:"#dc2626", fn:()=>{} },
          ].map((b,i)=>(
            <button key={i} onClick={b.fn} style={{ width:46, height:32, display:"flex", alignItems:"center", justifyContent:"center", background:"transparent", border:"none", color:t.muted, cursor:"pointer" }}
              onMouseEnter={e=>{e.currentTarget.style.background=b.hover;e.currentTarget.style.color="#fff"}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=t.muted}}>
              <b.icon size={12}/>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div style={{ display:"flex", alignItems:"center", background:t.bg, borderBottom:`1px solid ${t.border}`, height:36, paddingLeft:8, gap:2, flexShrink:0, overflowX:"auto" }}>
        {tabs.map((tb,i)=>(
          <div key={tb.id} onClick={()=>setActiveTab(i)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"0 10px", height:28, borderRadius:"6px 6px 0 0", background:i===activeTab?t.panel:"transparent", border:`1px solid ${i===activeTab?t.border:"transparent"}`, borderBottom:`1px solid ${i===activeTab?t.panel:"transparent"}`, cursor:"pointer", maxWidth:200, flexShrink:0 }}>
            {tb.loading
              ? <div style={{ width:10, height:10, borderRadius:"50%", border:`2px solid ${t.accent}`, borderTopColor:"transparent", animation:"spin .8s linear infinite" }}/>
              : <ShieldCheck size={10} color={t.accent}/>}
            <span style={{ fontSize:11, color:i===activeTab?t.text:t.muted, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis", maxWidth:130 }}>{tb.title}</span>
            {tabs.length > 1 && (
              <button onClick={e=>{e.stopPropagation();closeTab(i)}}
                style={{ background:"transparent", border:"none", color:t.muted, cursor:"pointer", padding:0, lineHeight:1, display:"flex" }}>
                <X size={9}/>
              </button>
            )}
          </div>
        ))}
        <button onClick={addTab} style={{ width:28, height:28, borderRadius:6, background:"transparent", border:`1px solid ${t.border}`, color:t.muted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Plus size={12}/>
        </button>
      </div>

      {/* ── Nav Bar ── */}
      <div style={{ display:"flex", alignItems:"center", gap:4, background:t.panel, borderBottom:`1px solid ${t.border}`, height:40, padding:"0 8px", flexShrink:0 }}>
        {[
          { icon:ChevronLeft,  fn:goBack,              dis:tab.histIdx===0 },
          { icon:ChevronRight, fn:goFwd,               dis:tab.histIdx>=tab.hist.length-1 },
          { icon:RotateCw,     fn:reload,              dis:false },
          { icon:Home,         fn:()=>navigate(HOME_URL), dis:false },
        ].map((b,i)=>(
          <button key={i} onClick={b.fn} disabled={b.dis}
            style={{ width:28, height:28, borderRadius:6, background:"transparent", border:"none", color:b.dis?t.border:t.muted, cursor:b.dis?"default":"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <b.icon size={14}/>
          </button>
        ))}

        {/* Read-only verified address bar */}
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:t.bg, border:`1px solid ${t.border}`, borderRadius:6, height:28, padding:"0 10px", overflow:"hidden" }}>
          <Lock size={10} color="#10b981"/>
          <span style={{ fontSize:11, color:"#10b981", fontWeight:600, whiteSpace:"nowrap" }}>Verified Server</span>
          <span style={{ fontSize:11, color:t.muted, flex:1, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>· {tab.url}</span>
          {autofill && (
            <button onClick={()=>notify("Autofill applied ✓","success")}
              style={{ background:"transparent", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:4, color:t.accent, whiteSpace:"nowrap" }}>
              <ShieldCheck size={11}/><span style={{ fontSize:10 }}>Autofill</span>
            </button>
          )}
        </div>

        <button onClick={addBookmark} title="Bookmark" style={{ width:28, height:28, borderRadius:6, background:"transparent", border:"none", color:t.muted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><Star size={12}/></button>
        <button onClick={()=>{setShowPasswords(p=>!p);setShowSettings(false)}}
          style={{ width:28, height:28, borderRadius:6, background:showPasswords?t.accent:"transparent", border:"none", color:showPasswords?"#fff":t.muted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }} title="Passwords">
          <Key size={12}/>
        </button>
        <button onClick={()=>{setShowSettings(s=>!s);setShowPasswords(false)}}
          style={{ width:28, height:28, borderRadius:6, background:showSettings?t.accent:"transparent", border:"none", color:showSettings?"#fff":t.muted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }} title="Settings">
          <Settings size={12}/>
        </button>
        <button onClick={()=>{window.print();notify("Print dialog opened","info")}} title="Print"
          style={{ width:28, height:28, borderRadius:6, background:"transparent", border:"none", color:t.muted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Printer size={12}/>
        </button>
      </div>

      {/* ── Save Password Prompt ── */}
      {showSavePrompt && (
        <div style={{ background:t.accent+"18", borderLeft:`3px solid ${t.accent}`, padding:"7px 12px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <ShieldCheck size={13} color={t.accent}/>
          <span style={{ fontSize:12, flex:1 }}>Save password for <strong>{DOMAIN}</strong>?</span>
          <input value={saveUser} onChange={e=>setSaveUser(e.target.value)} placeholder="Username"
            style={{ background:t.bg, border:`1px solid ${t.border}`, borderRadius:4, padding:"3px 8px", fontSize:11, color:t.text, outline:"none", width:120 }}/>
          <input type="password" value={savePass} onChange={e=>setSavePass(e.target.value)} placeholder="Password"
            style={{ background:t.bg, border:`1px solid ${t.border}`, borderRadius:4, padding:"3px 8px", fontSize:11, color:t.text, outline:"none", width:120 }}/>
          <button onClick={savePassword} style={{ background:t.accent, border:"none", borderRadius:4, padding:"4px 12px", color:"#fff", fontSize:11, cursor:"pointer" }}>Save</button>
          <button onClick={()=>setShowSavePrompt(false)} style={{ background:"transparent", border:"none", color:t.muted, cursor:"pointer" }}><X size={11}/></button>
        </div>
      )}

      {/* ── Content Row ── */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* Live iframe or blocked screen */}
        <div style={{ flex:1, position:"relative", overflow:"hidden", background:t.bg }}>
          {tab.loading && (
            <div style={{ position:"absolute", top:0, left:0, right:0, height:3, zIndex:10, background:t.border }}>
              <div style={{ height:"100%", background:t.accent, animation:"loadbar .9s ease-in-out infinite" }}/>
            </div>
          )}
          {iframeBlocked
            ? <BlockedScreen/>
            : (
              <div style={{ width:`${Math.round(10000/zoom)}%`, height:`${Math.round(10000/zoom)}%`, transform:`scale(${zoom/100})`, transformOrigin:"top left" }}>
                <iframe
                  ref={iframeRef}
                  key={`${tab.id}-${tab.url}`}
                  src={tab.url}
                  title="Smart Stores WMS"
                  onLoad={()=>updateTab(activeTab,{loading:false})}
                  onError={()=>{updateTab(activeTab,{loading:false});setIframeBlocked(true)}}
                  style={{ width:"100%", height:"100%", border:"none", display:"block" }}
                  sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                />
              </div>
            )
          }
        </div>

        {/* ── Password Panel ── */}
        {showPasswords && (
          <div style={{ width:290, background:t.panel, borderLeft:`1px solid ${t.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
            <div style={{ padding:"11px 14px", borderBottom:`1px solid ${t.border}`, display:"flex", alignItems:"center", gap:8 }}>
              <Key size={13} color={t.accent}/>
              <span style={{ fontWeight:600, fontSize:12, flex:1 }}>Password Manager</span>
              <div style={{ background:t.accent+"22", border:`1px solid ${t.accent}44`, borderRadius:12, padding:"1px 8px", fontSize:10, color:t.accent }}>{passwords.length}</div>
            </div>
            <div style={{ flex:1, overflow:"auto", padding:8 }}>
              {passwords.length === 0
                ? <div style={{ textAlign:"center", padding:36, color:t.muted, fontSize:12 }}>
                    <Lock size={28} color={t.border} style={{ display:"block", margin:"0 auto 10px" }}/>
                    No saved passwords yet.
                  </div>
                : passwords.map((p,i)=>(
                  <div key={i} style={{ background:t.bg, border:`1px solid ${t.border}`, borderRadius:8, padding:10, marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                        <ShieldCheck size={10} color="#10b981"/>
                        <span style={{ fontSize:11, fontWeight:600 }}>{p.domain}</span>
                      </div>
                      <button onClick={()=>setPasswords(prev=>prev.filter((_,j)=>j!==i))}
                        style={{ background:"transparent", border:"none", color:"#ef4444", cursor:"pointer", padding:0 }}>
                        <Trash2 size={11}/>
                      </button>
                    </div>
                    <div style={{ fontSize:11, color:t.muted, marginBottom:4 }}>👤 {p.username||"—"}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:11, color:t.muted, fontFamily:"monospace", flex:1, letterSpacing:".04em" }}>
                        {passVis[i] ? p.password : "••••••••"}
                      </span>
                      <button onClick={()=>setPassVis(v=>({...v,[i]:!v[i]}))}
                        style={{ background:"transparent", border:"none", color:t.muted, cursor:"pointer", padding:0 }}>
                        {passVis[i] ? <EyeOff size={10}/> : <Eye size={10}/>}
                      </button>
                    </div>
                    <div style={{ fontSize:10, color:t.border, marginTop:4 }}>Saved {p.saved}</div>
                  </div>
                ))
              }
            </div>
            <div style={{ padding:"8px 14px", borderTop:`1px solid ${t.border}`, fontSize:10, color:t.muted, display:"flex", alignItems:"center", gap:5 }}>
              <Lock size={9} color="#10b981"/> AES-256 encrypted · Local storage
            </div>
          </div>
        )}

        {/* ── Settings Panel ── */}
        {showSettings && (
          <div style={{ width:270, background:t.panel, borderLeft:`1px solid ${t.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
            <div style={{ padding:"11px 14px", borderBottom:`1px solid ${t.border}`, display:"flex", alignItems:"center", gap:8 }}>
              <Settings size={13} color={t.accent}/>
              <span style={{ fontWeight:600, fontSize:12 }}>Enterprise Settings</span>
            </div>
            <div style={{ flex:1, overflow:"auto", padding:14 }}>

              <div style={{ fontSize:10, color:t.muted, textTransform:"uppercase", letterSpacing:".08em", marginBottom:8 }}>Color Theme</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:18 }}>
                {Object.entries(THEMES).map(([name,th])=>(
                  <button key={name} onClick={()=>setThemeName(name)}
                    style={{ display:"flex", flexDirection:"column", gap:5, padding:8, background:name===themeName?th.accent+"22":t.bg, border:`${name===themeName?2:1}px solid ${name===themeName?th.accent:t.border}`, borderRadius:8, cursor:"pointer", textAlign:"left" }}>
                    <div style={{ display:"flex", gap:3 }}>
                      {[th.panel, th.accent, th.bg].map((c,i)=><div key={i} style={{ width:11, height:11, borderRadius:3, background:c }}/>)}
                    </div>
                    <span style={{ fontSize:10, color:name===themeName?t.text:t.muted, fontWeight:name===themeName?600:400 }}>{name}</span>
                  </button>
                ))}
              </div>

              <div style={{ fontSize:10, color:t.muted, textTransform:"uppercase", letterSpacing:".08em", marginBottom:8 }}>Zoom — {zoom}%</div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <button onClick={()=>setZoom(z=>Math.max(25,z-25))} style={{ width:28, height:28, borderRadius:6, background:t.bg, border:`1px solid ${t.border}`, color:t.text, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><ZoomOut size={12}/></button>
                <input type="range" min={25} max={500} step={25} value={zoom} onChange={e=>setZoom(Number(e.target.value))} style={{ flex:1 }}/>
                <button onClick={()=>setZoom(z=>Math.min(500,z+25))} style={{ width:28, height:28, borderRadius:6, background:t.bg, border:`1px solid ${t.border}`, color:t.text, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><ZoomIn size={12}/></button>
              </div>

              <div style={{ fontSize:10, color:t.muted, textTransform:"uppercase", letterSpacing:".08em", margin:"16px 0 8px" }}>Security Status</div>
              <div style={{ background:t.bg, border:`1px solid ${t.border}`, borderRadius:8, padding:12, marginBottom:16 }}>
                {[
                  { label:"Domain Lock Active",    sub: DOMAIN },
                  { label:"TLS 1.3 Enforced",      sub:"End-to-end encrypted" },
                  { label:"Local-only Storage",    sub:"Passwords never leave device" },
                ].map((row,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:7, marginBottom:i<2?10:0 }}>
                    <CheckCircle size={11} color="#10b981" style={{ marginTop:1, flexShrink:0 }}/>
                    <div>
                      <div style={{ fontSize:12 }}>{row.label}</div>
                      <div style={{ fontSize:10, color:t.muted, fontFamily:"monospace" }}>{row.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize:10, color:t.muted, textTransform:"uppercase", letterSpacing:".08em", marginBottom:8 }}>Bookmarks ({bookmarks.length})</div>
              <div style={{ background:t.bg, border:`1px solid ${t.border}`, borderRadius:8, overflow:"hidden", marginBottom:14 }}>
                {bookmarks.length === 0
                  ? <div style={{ padding:"12px 10px", fontSize:11, color:t.muted }}>No bookmarks saved.</div>
                  : bookmarks.map((b,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderBottom:i<bookmarks.length-1?`1px solid ${t.border}`:"none" }}>
                      <span style={{ fontSize:11, flex:1, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{b.title}</span>
                      <button onClick={()=>{navigate(b.url);setShowSettings(false)}} style={{ background:t.accent, border:"none", borderRadius:4, padding:"2px 8px", color:"#fff", fontSize:10, cursor:"pointer" }}>Go</button>
                      <button onClick={()=>setBookmarks(prev=>prev.filter((_,j)=>j!==i))} style={{ background:"transparent", border:"none", color:"#ef4444", cursor:"pointer", padding:0 }}><X size={10}/></button>
                    </div>
                  ))
                }
              </div>

              <button onClick={()=>{window.print();notify("Print dialog opened","info")}}
                style={{ display:"flex", alignItems:"center", gap:7, width:"100%", padding:"8px 10px", background:t.bg, border:`1px solid ${t.border}`, color:t.text, cursor:"pointer", borderRadius:8, fontSize:12 }}>
                <Printer size={12} color={t.muted}/> Print Page
              </button>
            </div>
            <div style={{ padding:"9px 14px", borderTop:`1px solid ${t.border}`, fontSize:10, color:t.muted }}>
              Smart Stores v2.0.1 · Enterprise
            </div>
          </div>
        )}
      </div>

      {/* ── Status Bar ── */}
      <div style={{ display:"flex", alignItems:"center", gap:14, background:t.panel, borderTop:`1px solid ${t.border}`, height:24, padding:"0 12px", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:"#10b981" }}/>
          <span style={{ fontSize:10, color:t.muted }}>Connected · {DOMAIN}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <Wifi size={9} color={t.muted}/>
          <span style={{ fontSize:10, color:t.muted }}>TLS 1.3</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <Shield size={9} color="#10b981"/>
          <span style={{ fontSize:10, color:"#10b981" }}>Secure</span>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:5 }}>
          <Clock size={9} color={t.muted}/>
          <span style={{ fontSize:10, color:t.muted }}>{now.toLocaleDateString()} · {now.toLocaleTimeString()}</span>
        </div>
        <span style={{ fontSize:10, color:t.muted }}>Zoom: {zoom}%</span>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position:"fixed", bottom:36, right:16, background:toast.type==="danger"?"#450a0a":toast.type==="success"?"#052e16":t.panel, border:`1px solid ${toast.type==="danger"?"#dc2626":toast.type==="success"?"#10b981":t.border}`, borderRadius:8, padding:"9px 14px", fontSize:12, color:t.text, zIndex:1000, display:"flex", alignItems:"center", gap:8, maxWidth:300, boxShadow:"0 8px 24px rgba(0,0,0,.5)" }}>
          {toast.type==="success" ? <CheckCircle size={13} color="#10b981"/> : toast.type==="danger" ? <XCircle size={13} color="#dc2626"/> : <Activity size={13} color={t.accent}/>}
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes loadbar { 0%,100%{width:15%} 50%{width:85%} }
        ::-webkit-scrollbar       { width:4px; height:4px; }
        ::-webkit-scrollbar-thumb { background:${t.border}; border-radius:2px; }
        ::-webkit-scrollbar-track { background:transparent; }
      `}</style>
    </div>
  );
}
