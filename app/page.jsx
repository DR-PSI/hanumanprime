"use client";

import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
} from "recharts";

const STATUS_COLOR = { NOMINAL: "#10b981", WARNING: "#f59e0b", CRITICAL: "#ef4444" };

function getStatus(data) {
  if (!data) return "NOMINAL";
  const diff = data.extreme_diff_mv;
  const temp = data.temperature;
  if (diff > 300 || temp > 35) return "CRITICAL";
  if (diff > 150 || temp > 28) return "WARNING";
  return "NOMINAL";
}

export default function App() {
  const [liveData, setLiveData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 30000);
    const clock = setInterval(() => setNow(new Date()), 60000);
    return () => { clearInterval(t); clearInterval(clock); };
  }, []);

  useEffect(() => {
    if (liveData) loadAiInsight();
  }, [liveData?.id]);

  async function fetchData() {
    try {
      const res = await fetch("/api/ingest");
      const json = await res.json();
      if (json.success) {
        const bkk = json.latest.find(d => d.station_id === "BKK-01");
        setLiveData(bkk || null);
        setHistory(json.history || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadAiInsight() {
    if (!liveData) return;
    setAiLoading(true);
    setAiInsight("");
    try {
      const res = await fetch("/api/ai-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: liveData }),
      });
      const json = await res.json();
      setAiInsight(json.insight || "ไม่สามารถโหลดได้");
    } catch {
      setAiInsight("ไม่สามารถเชื่อมต่อ AI ได้");
    }
    setAiLoading(false);
  }

  const status = getStatus(liveData);
  const statusColor = STATUS_COLOR[status];

  const voltageHistory = history.map((h, i) => ({
    t: i,
    v: h.string_voltage,
    temp: h.temperature,
  }));

  return (
    <div style={{ minHeight: "100vh", background: "#1a0a00", fontFamily: "'JetBrains Mono', monospace", color: "#f0e0cc", fontSize: 13 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Rajdhani:wght@400;500;600;700&display=swap');
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#2a1200} ::-webkit-scrollbar-thumb{background:#7a3a00;border-radius:2px}
        .card{background:#210d00;border:1px solid #4a2000;border-radius:8px;padding:20px}
        .pulse{animation:pulse 2s infinite} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        .metric-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #2a1200}
        .big-num{font-family:'Rajdhani',sans-serif;font-size:42px;font-weight:700;line-height:1}
        .label-sm{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#7a4a20}
        .badge{display:inline-block;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:600;letter-spacing:1px}
        .ai-dot{width:8px;height:8px;border-radius:50%;background:#ff8c00;animation:pulse 1.5s infinite;display:inline-block;margin-right:8px}
      `}</style>

      {/* Header */}
      <div style={{ background: "#150700", borderBottom: "1px solid #4a2000", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0" }}>
          <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 18, fontWeight: 700, color: "#ff8c00", letterSpacing: 2 }}>HANUMAN PRIME</div>
          <div style={{ fontSize: 9, letterSpacing: 2, color: "#a07050" }}>AI BATTERY ANALYTICS · POWER SUBSTATIONS</div>
        </div>
        <div style={{ fontSize: 11, color: "#a07050" }}>
          {now.toLocaleString("th-TH", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {/* Station bar */}
      <div style={{ background: "#170800", borderBottom: "1px solid #4a2000", padding: "10px 24px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 10, color: "#7a4a20", letterSpacing: 1, marginRight: 8 }}>SUBSTATION</span>
        <button style={{ background: "#3a1800", border: `1px solid ${statusColor}`, borderRadius: 4, padding: "8px 14px", fontFamily: "inherit", fontSize: 11, color: "#ff8c00", cursor: "default" }}>
          <span style={{ color: statusColor, marginRight: 5 }}>●</span>BKK-01 · BKK-01-A
        </button>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 80, color: "#a07050" }}>
            <span className="ai-dot" />กำลังโหลดข้อมูล...
          </div>
        ) : (
          <>
            {/* Station title */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 15, color: "#94a3b8" }}>
                สถานีบางกอกใหญ่ · BKK-01-A · 48 cells
              </div>
              <span className="badge" style={{ background: statusColor + "22", color: statusColor, border: `1px solid ${statusColor}44` }}>
                SYSTEM: {status}
              </span>
              {liveData && (
                <span style={{ fontSize: 10, color: "#7a4a20" }}>
                  อัพเดต: {new Date(liveData.created_at).toLocaleTimeString("th-TH")}
                </span>
              )}
            </div>

            {/* Metric cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
              {[
                { label: "String Voltage", value: liveData?.string_voltage?.toFixed(2) ?? "—", unit: "V", color: "#ff8c00" },
                { label: "Temperature", value: liveData?.temperature?.toFixed(1) ?? "—", unit: "°C", color: liveData?.temperature > 28 ? "#ef4444" : "#ffa040" },
                { label: "Highest Cell V", value: liveData?.highest_cell_voltage?.toFixed(3) ?? "—", unit: "V", color: "#10b981" },
                { label: "Extreme Diff", value: liveData?.extreme_diff_mv ?? "—", unit: "mV", color: liveData?.extreme_diff_mv > 200 ? "#ef4444" : "#f59e0b" },
              ].map(({ label, value, unit, color }) => (
                <div key={label} className="card">
                  <div className="label-sm">{label}</div>
                  <div className="big-num" style={{ color, marginTop: 8, fontSize: 36 }}>{value}</div>
                  <div style={{ fontSize: 11, color: "#7a4a20", marginTop: 4 }}>{unit}</div>
                </div>
              ))}
            </div>

            {/* Detail + Voltage chart */}
            <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16, marginBottom: 16 }}>
              <div className="card">
                <div className="label-sm" style={{ marginBottom: 12 }}>Battery Details</div>
                {[
                  ["Lowest Cell V", liveData?.lowest_cell_voltage?.toFixed(3) + " V"],
                  ["Avg Diff", (liveData?.avg_diff_mv ?? "—") + " mV"],
                  ["Current", (liveData?.current ?? "—") + " A"],
                  ["SOC", liveData?.soc ? liveData.soc + "%" : "—"],
                  ["Latest DT", liveData?.latest_voltage_dt || "—"],
                ].map(([label, val]) => (
                  <div key={label} className="metric-row">
                    <span className="label-sm">{label}</span>
                    <span style={{ color: "#ff8c00", fontWeight: 600, fontSize: 11 }}>{val}</span>
                  </div>
                ))}
              </div>

              <div className="card">
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>String Voltage History</div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={voltageHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3a1800" />
                    <XAxis dataKey="t" tick={false} />
                    <YAxis domain={["auto", "auto"]} tick={{ fill: "#7a4a20", fontSize: 9 }} />
                    <Tooltip contentStyle={{ background: "#210d00", border: "1px solid #4a2000", color: "#f0e0cc", fontSize: 11 }}
                      formatter={(v) => [v?.toFixed(2) + " V", "Voltage"]} />
                    <Line type="monotone" dataKey="v" stroke="#ff8c00" strokeWidth={2} dot={false} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Temp chart */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Temperature History</div>
              <ResponsiveContainer width="100%" height={130}>
                <LineChart data={voltageHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a1800" />
                  <XAxis dataKey="t" tick={false} />
                  <YAxis tick={{ fill: "#7a4a20", fontSize: 9 }} />
                  <Tooltip contentStyle={{ background: "#210d00", border: "1px solid #4a2000", color: "#f0e0cc", fontSize: 11 }}
                    formatter={(v) => [v?.toFixed(1) + " °C", "Temp"]} />
                  <ReferenceLine y={28} stroke="#f59e0b" strokeDasharray="4 4" />
                  <ReferenceLine y={35} stroke="#ef4444" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="temp" stroke="#38bdf8" strokeWidth={2} dot={false} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* AI Insight */}
            <div className="card" style={{ border: "1px solid #7a3a0044", background: "#180900" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 16 }}>🤖</span>
                <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 16, fontWeight: 600, color: "#ff8c00" }}>AI Insights</span>
              </div>
              <div style={{ background: "#150700", border: "1px solid #4a2000", borderRadius: 6, padding: 12, fontSize: 11, lineHeight: 1.7, color: "#a07050", minHeight: 60 }}>
                {aiLoading
                  ? <span><span className="ai-dot" />กำลังวิเคราะห์...</span>
                  : <span><span className="ai-dot" />{aiInsight || "รอข้อมูล..."}</span>}
              </div>
            </div>

            <div style={{ marginTop: 16, padding: "10px 0", borderTop: "1px solid #4a2000", display: "flex", gap: 24, fontSize: 10, color: "#7a4a20" }}>
              <span>⬡ LIVE DATA · Supabase</span>
              <span style={{ color: statusColor }}>SYSTEM STATUS: {status}</span>
              <span style={{ marginLeft: "auto", color: "#ff8c0066" }}>HANUMANPRIME · hanumanprime.com</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
