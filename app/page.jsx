"use client";

import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, BarChart, Bar } from "recharts";

const STATIONS = [
  { id: "BKK-01", name: "สถานีบางกอกใหญ่", bank: "BKK-01-A", cells: 48, location: "Bangkok West" },
  { id: "RST-02", name: "สถานีรังสิต", bank: "RST-02-A", cells: 48, location: "Pathum Thani" },
  { id: "SPK-03", name: "สถานีสมุทรปราการ", bank: "SPK-03-A", cells: 48, location: "Samut Prakan" },
  { id: "NTB-04", name: "สถานีนนทบุรี", bank: "NTB-04-A", cells: 48, location: "Nonthaburi" },
  { id: "MNB-05", name: "สถานีมีนบุรี", bank: "MNB-05-A", cells: 48, location: "Bangkok East" },
];

function makeStationData(idx) {
  const sohs = [92, 78, 85, 96, 71];
  const ruls = [2.5, 1.1, 1.8, 3.2, 0.7];
  const eols = ["Nov 2028", "Mar 2027", "Sep 2027", "Jan 2029", "Jul 2026"];
  const temps = [17.9, 24.3, 21.1, 19.5, 26.7];
  const voltages = [13.522, 13.201, 13.388, 13.641, 12.987];
  const warnings = [9, 14, 6, 2, 18];
  const criticals = [0, 3, 0, 0, 5];
  const avgIR = [10.81, 14.22, 11.45, 9.87, 16.33];
  const confidences = [95, 88, 91, 97, 82];

  const soh = sohs[idx];
  const warn = warnings[idx];
  const crit = criticals[idx];
  const normal = 48 - warn - crit;

  const cells = Array.from({ length: 48 }, (_, i) => {
    if (crit > 0 && i < crit) return "critical";
    if (warn > 0 && i < crit + warn) return "warning";
    return "normal";
  }).sort(() => Math.random() - 0.5);

  const y8val = Math.min(100, soh + Math.sin(7) * 0.5);
  const history = Array.from({ length: 8 }, (_, i) => {
    const val = Math.min(100, soh + (7 - i) * 1.2 + Math.sin(i) * 0.5);
    return { year: `Y${i + 1}`, soh: val, forecast: i === 7 ? val : null };
  });
  const forecast = Array.from({ length: 5 }, (_, i) => ({
    year: `Y${8 + i + 1}`,
    soh: null,
    forecast: Math.max(60, y8val - (i + 1) * 4.5 - Math.random() * 2),
  }));

  const voltDist = Array.from({ length: 48 }, (_, i) => ({
    cell: i + 1,
    v: voltages[idx] + (Math.random() - 0.5) * 0.4,
  }));

  const tempTrend = Array.from({ length: 12 }, (_, i) => ({
    h: `${i * 2}:00`,
    t: temps[idx] + Math.sin(i * 0.8) * 2.5 + (Math.random() - 0.5),
  }));

  const rootCauses = [
    { label: "Ambient Temp", pct: 40, color: "#f59e0b" },
    { label: "Internal Resistance", pct: 30, color: "#ef4444" },
    { label: "Cycle Depth", pct: 20, color: "#3b82f6" },
    { label: "Humidity", pct: 10, color: "#10b981" },
  ];

  const actions = [
    { icon: "❄️", title: "HVAC Check:", desc: `${STATIONS[idx].bank}-Cell ${crit + 1} zone temp elevated.` },
    { icon: "🔧", title: "Maintenance:", desc: "Check cell inter-connects (IR variation)." },
    { icon: "📋", title: "Operating Procedure:", desc: "Limit discharge to 85% until temp stabilizes." },
  ];

  const status = crit > 0 ? "CRITICAL" : warn > 5 ? "WARNING" : "NOMINAL";

  return {
    soh, ruls: ruls[idx], eol: eols[idx], temp: temps[idx],
    voltage: voltages[idx], warn, crit, normal,
    avgIR: avgIR[idx], confidence: confidences[idx],
    cells, history, forecast, voltDist, tempTrend,
    rootCauses, actions, status,
    capacityRetention: soh, cycleEfficiency: Math.round(soh * 0.95),
    highestIR: avgIR[idx] + 3, lowestIR: avgIR[idx] - 2.5,
    ambientTemp: temps[idx] + 0.5,
  };
}

const ALL_DATA = STATIONS.map((_, i) => makeStationData(i));
const STATUS_COLOR = { NOMINAL: "#10b981", WARNING: "#f59e0b", CRITICAL: "#ef4444" };
const CELL_COLOR = { normal: "#10b981", warning: "#f59e0b", critical: "#ef4444" };

export default function App() {
  const [activeStation, setActiveStation] = useState(0);
  const [tab, setTab] = useState("overview");
  const [now, setNow] = useState(new Date());
  const [aiInsight, setAiInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const station = STATIONS[activeStation];
  const data = ALL_DATA[activeStation];

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { loadAiInsight(); }, [activeStation]);

  async function loadAiInsight() {
    setAiLoading(true);
    setAiInsight("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "You are an AI battery health analyst for power substations. Respond in Thai language. Be concise and technical. Format: 2-3 sentences max.",
          messages: [{ role: "user", content: `วิเคราะห์แบตเตอรี่สถานี ${station.name}: SOH=${data.soh}%, RUL=${data.ruls} ปี, อุณหภูมิ=${data.temp}°C, เซลล์เตือน=${data.warn}, วิกฤต=${data.crit}, IR เฉลี่ย=${data.avgIR}mΩ. สถานะ: ${data.status}. ให้ข้อวิเคราะห์และคำแนะนำ` }]
        })
      });
      const json = await res.json();
      setAiInsight(json.content?.[0]?.text || "ไม่สามารถโหลดข้อมูลได้");
    } catch {
      setAiInsight("AI Reasoner [LSTM v2.1]: กำลังวิเคราะห์ข้อมูลเซลล์...");
    }
    setAiLoading(false);
  }

  const sohData = [...data.history, ...data.forecast];

  return (
    <div style={{ minHeight: "100vh", background: "#1a0a00", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", color: "#f0e0cc", fontSize: 13 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Rajdhani:wght@400;500;600;700&display=swap');
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#2a1200}
        ::-webkit-scrollbar-thumb{background:#7a3a00;border-radius:2px}
        .nav-btn{background:none;border:none;cursor:pointer;padding:10px 20px;font-family:inherit;font-size:12px;letter-spacing:1px;transition:all 0.2s;border-bottom:2px solid transparent;color:#a07050}
        .nav-btn:hover{color:#ff8c00}
        .nav-btn.active{color:#ff8c00;border-bottom-color:#ff8c00}
        .station-tab{background:none;border:1px solid #5a2a00;cursor:pointer;padding:8px 14px;font-family:inherit;font-size:11px;transition:all 0.2s;border-radius:4px;color:#a07050;margin:3px}
        .station-tab:hover{border-color:#ff8c00;color:#f0e0cc}
        .station-tab.active{background:#3a1800;border-color:#ff8c00;color:#ff8c00}
        .card{background:#210d00;border:1px solid #4a2000;border-radius:8px;padding:20px}
        .pulse{animation:pulse 2s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        .cell-chip{width:32px;height:32px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:600;cursor:default;transition:transform 0.1s}
        .cell-chip:hover{transform:scale(1.15)}
        .metric-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #2a1200}
        .big-num{font-family:'Rajdhani',sans-serif;font-size:42px;font-weight:700;line-height:1}
        .label-sm{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#7a4a20}
        .badge{display:inline-block;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:600;letter-spacing:1px}
        .bar-bg{background:#2a1200;border-radius:4px;height:8px;overflow:hidden}
        .bar-fill{height:100%;border-radius:4px;transition:width 1s ease}
        .ai-dot{width:8px;height:8px;border-radius:50%;background:#ff8c00;animation:pulse 1.5s infinite;display:inline-block;margin-right:8px}
      `}</style>

      <div style={{ background: "#150700", borderBottom: "1px solid #4a2000", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0" }}>
          <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 18, fontWeight: 700, color: "#ff8c00", letterSpacing: 2 }}>HANUMAN PRIME</div>
          <div style={{ fontSize: 9, letterSpacing: 2, color: "#a07050" }}>AI BATTERY ANALYTICS · POWER SUBSTATIONS</div>
        </div>
        <div style={{ display: "flex", gap: 0 }}>
          {["Overview", "Forecasts", "Anomalies", "Data Logs", "Settings"].map(t => (
            <button key={t} className={`nav-btn${tab === t.toLowerCase() ? " active" : ""}`} onClick={() => setTab(t.toLowerCase())}>
              {t}{t === "Anomalies" && <span style={{ marginLeft: 4, background: "#cc3300", color: "#fff", borderRadius: 10, padding: "0 5px", fontSize: 10 }}>{data.warn + data.crit}</span>}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "#a07050" }}>
          {now.toLocaleString("th-TH", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      <div style={{ background: "#170800", borderBottom: "1px solid #4a2000", padding: "10px 24px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 10, color: "#7a4a20", letterSpacing: 1, marginRight: 8 }}>SUBSTATION</span>
        {STATIONS.map((s, i) => {
          const d = ALL_DATA[i];
          return (
            <button key={s.id} className={`station-tab${activeStation === i ? " active" : ""}`} onClick={() => setActiveStation(i)}>
              <span style={{ color: STATUS_COLOR[d.status], marginRight: 5 }}>●</span>
              {s.id} · {s.bank}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 15, color: "#94a3b8" }}>
            {station.name} · {station.bank} · {station.cells} cells
          </div>
          <span className="badge" style={{ background: STATUS_COLOR[data.status] + "22", color: STATUS_COLOR[data.status], border: `1px solid ${STATUS_COLOR[data.status]}44` }}>
            SYSTEM: {data.status}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 220px", gap: 16, marginBottom: 16 }}>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="label-sm">STATE OF HEALTH</div>
                <div className="big-num" style={{ color: data.soh > 85 ? "#10b981" : data.soh > 75 ? "#f59e0b" : "#ef4444", marginTop: 4 }}>{data.soh}%</div>
                <span className="badge" style={{ background: "#10b98122", color: "#10b981", border: "1px solid #10b98144", marginTop: 6 }}>Normal</span>
              </div>
              <div style={{ fontSize: 28 }}>🔋</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="metric-row"><span className="label-sm">Capacity Retention</span><span style={{ color: "#ff8c00", fontWeight: 600 }}>{data.capacityRetention}%</span></div>
              <div className="metric-row"><span className="label-sm">Cycle Efficiency</span><span style={{ color: "#ff8c00", fontWeight: 600 }}>{data.cycleEfficiency}%</span></div>
              <div className="metric-row" style={{ borderBottom: "none" }}><span className="label-sm">Model Confidence</span><span style={{ color: "#ff8c00", fontWeight: 600 }}>{data.confidence}%</span></div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div className="card">
              <div className="label-sm">Remaining Useful Life</div>
              <div className="big-num" style={{ color: "#ff8c00", marginTop: 8 }}>{data.ruls}</div>
              <div style={{ fontSize: 11, color: "#a07050", marginTop: 4 }}>years · EOL: {data.eol}</div>
            </div>
            <div className="card">
              <div className="label-sm">Total Voltage</div>
              <div className="big-num" style={{ color: "#ffb347", marginTop: 8, fontSize: 28 }}>{data.voltage.toFixed(3)}</div>
              <div style={{ fontSize: 11, color: "#7a4a20", marginTop: 4 }}>V</div>
            </div>
            <div className="card">
              <div className="label-sm">Temperature</div>
              <div className="big-num" style={{ color: data.temp > 25 ? "#ff4400" : "#ffa040", marginTop: 8, fontSize: 28 }}>{data.temp}</div>
              <div style={{ fontSize: 11, color: "#7a4a20", marginTop: 4 }}>°C · Ambient: {data.ambientTemp.toFixed(1)} °C</div>
            </div>
          </div>

          <div className="card">
            <div className="label-sm" style={{ marginBottom: 12 }}>Cell Status</div>
            {[["normal", "#10b981", data.normal], ["warning", "#f59e0b", data.warn], ["critical", "#ef4444", data.crit]].map(([s, c, n]) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ color: c }}>●</span>
                <span style={{ textTransform: "capitalize", flex: 1, fontSize: 11 }}>{s === "normal" ? "Normal" : s === "warning" ? "Warning" : "Critical"}</span>
                <span style={{ color: c, fontWeight: 700 }}>{n}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 16, fontWeight: 600, color: "#f0e0cc" }}>SOH Degradation Trend & Forecast</div>
              <div className="label-sm">Historical + AI prediction (LSTM v2.1)</div>
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#a07050" }}>
              <span>— Historical</span>
              <span style={{ color: "#ff8c00" }}>- - AI Forecast</span>
              <span style={{ color: "#ef4444" }}>— 80% EOL</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={sohData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a1800" />
              <XAxis dataKey="year" tick={{ fill: "#7a4a20", fontSize: 11 }} />
              <YAxis domain={[60, 100]} tick={{ fill: "#7a4a20", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#210d00", border: "1px solid #4a2000", borderRadius: 6, color: "#f0e0cc", fontSize: 12 }} />
              <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} />
              <Line type="monotone" dataKey="soh" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 3 }} connectNulls={false} />
              <Line type="monotone" dataKey="forecast" stroke="#38bdf8" strokeWidth={2} strokeDasharray="6 3" dot={{ fill: "#38bdf8", r: 3 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div className="card">
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 15, fontWeight: 600, color: "#f0e0cc", marginBottom: 12 }}>Temperature Trend</div>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={data.tempTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3a1800" />
                <XAxis dataKey="h" tick={{ fill: "#7a4a20", fontSize: 9 }} />
                <YAxis tick={{ fill: "#7a4a20", fontSize: 9 }} />
                <Tooltip contentStyle={{ background: "#210d00", border: "1px solid #4a2000", color: "#f0e0cc", fontSize: 11 }} />
                <Line type="monotone" dataKey="t" stroke="#ff8c00" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 15, fontWeight: 600, color: "#f0e0cc", marginBottom: 12 }}>Voltage Distribution</div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={data.voltDist} barSize={4}>
                <XAxis dataKey="cell" tick={false} />
                <YAxis domain={[12.5, 14.5]} tick={{ fill: "#7a4a20", fontSize: 9 }} />
                <Tooltip contentStyle={{ background: "#210d00", border: "1px solid #4a2000", color: "#f0e0cc", fontSize: 11 }} formatter={(v) => [v.toFixed(3) + " V", "Voltage"]} />
                <Bar dataKey="v" fill="#ff8c00" opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ border: "1px solid #7a3a0044", background: "#180900" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 16 }}>🤖</span>
            <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 16, fontWeight: 600, color: "#ff8c00" }}>AI Insights & Root Cause Analysis</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 16 }}>
            <div>
              <div className="label-sm" style={{ marginBottom: 8 }}>Reasoning Log</div>
              <div style={{ background: "#150700", border: "1px solid #4a2000", borderRadius: 6, padding: 12, fontSize: 11, lineHeight: 1.7, color: "#a07050", minHeight: 60 }}>
                {aiLoading ? <span><span className="ai-dot" />กำลังวิเคราะห์...</span> : <span><span className="ai-dot" />{aiInsight}</span>}
              </div>
              <div style={{ marginTop: 12 }}>
                {data.actions.map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 11, color: "#a07050" }}>
                    <span>{a.icon}</span>
                    <span><strong style={{ color: "#f0e0cc" }}>{a.title}</strong> {a.desc}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="label-sm" style={{ marginBottom: 8 }}>Root Cause</div>
              {data.rootCauses.map(rc => (
                <div key={rc.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 3 }}>
                    <span style={{ color: "#94a3b8" }}>{rc.label}</span>
                    <span style={{ color: rc.color, fontWeight: 600 }}>{rc.pct}%</span>
                  </div>
                  <div className="bar-bg"><div className="bar-fill" style={{ width: `${rc.pct}%`, background: rc.color }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, padding: "10px 0", borderTop: "1px solid #4a2000", display: "flex", gap: 24, fontSize: 10, color: "#7a4a20" }}>
          <span>⬡ AI MODEL: LSTM v2.1</span>
          <span style={{ color: STATUS_COLOR[data.status] }}>SYSTEM STATUS: {data.status}</span>
          <span style={{ marginLeft: "auto", color: "#ff8c0066" }}>HANUMANPRIME · hanumanprime.com</span>
        </div>
      </div>
    </div>
  );
}
