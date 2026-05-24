import { useEffect, useState, useRef } from "react";
import {
  AlertTriangle, Thermometer, Leaf, Bot,
  X, Send, Minimize2, Maximize2, Wind,
  ShieldAlert, ShieldCheck, ShieldQuestion,
} from "lucide-react";

type Zone = {
  name: string;
  temperature: number;
  latitude: number;
  longitude: number;
  cluster: number;
  vegetation?: number;
};

type Message = {
  role: "user" | "assistant";
  content: string;
};

const CLUSTER = {
  2: { label: "Critical", color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30",    icon: ShieldAlert    },
  1: { label: "Moderate", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: ShieldQuestion },
  0: { label: "Safe",     color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/30",   icon: ShieldCheck    },
};
const getCluster = (c: number) => CLUSTER[c as keyof typeof CLUSTER] ?? CLUSTER[0];

const getReco = (zone: Zone): string => {
  if (zone.cluster === 2)
    return "Immediate cooling intervention required. Deploy water sprinklers, restrict outdoor activity, issue public heat advisory.";
  if (zone.cluster === 1)
    return "Monitor closely. Increase green cover, reduce vehicle density, consider shading infrastructure.";
  return "Zone is stable. Maintain current vegetation levels and continue passive monitoring.";
};

const getRuleBasedReply = (input: string, zones: Zone[]): string => {
  const q = input.toLowerCase();

  const critical = zones.filter((z) => z.cluster === 2);
  const moderate = zones.filter((z) => z.cluster === 1);
  const safe     = zones.filter((z) => z.cluster === 0);
  const hottest  = zones.length ? zones.reduce((a, b) => a.temperature > b.temperature ? a : b) : null;
  const coolest  = zones.length ? zones.reduce((a, b) => a.temperature < b.temperature ? a : b) : null;
  const avgTemp  = zones.length ? zones.reduce((s, z) => s + z.temperature, 0) / zones.length : 0;

  const mentionedZone = zones.find((z) => q.includes(z.name.toLowerCase()));
  if (mentionedZone) {
    const cfg = getCluster(mentionedZone.cluster);
    return `📍 ${mentionedZone.name}
- Temperature: ${mentionedZone.temperature.toFixed(1)}°C
- Risk Level: ${cfg.label}
- NDVI: ${mentionedZone.vegetation?.toFixed(2) ?? "N/A"}

💡 Recommendation: ${getReco(mentionedZone)}`;
  }

  if (q.includes("critical") || q.includes("danger") || q.includes("worst")) {
    if (!critical.length) return "✅ Great news — no critical zones right now!";
    return `🔴 Critical Zones (${critical.length}):\n${critical.map((z) => `• ${z.name} — ${z.temperature.toFixed(1)}°C`).join("\n")}\n\n⚠️ Immediate action needed in these areas.`;
  }

  if (q.includes("moderate") || q.includes("warning") || q.includes("medium")) {
    if (!moderate.length) return "No moderate zones currently.";
    return `🟡 Moderate Zones (${moderate.length}):\n${moderate.map((z) => `• ${z.name} — ${z.temperature.toFixed(1)}°C`).join("\n")}`;
  }

  if (q.includes("safe") || q.includes("good")) {
    if (!safe.length) return "No safe zones currently.";
    return `🟢 Safe Zones (${safe.length}):\n${safe.map((z) => `• ${z.name} — ${z.temperature.toFixed(1)}°C`).join("\n")}`;
  }

  if (q.includes("hottest") || q.includes("highest") || q.includes("maximum")) {
    if (!hottest) return "No data available.";
    return `🌡️ Hottest zone is ${hottest.name} at ${hottest.temperature.toFixed(1)}°C (${getCluster(hottest.cluster).label}).\n\n💡 ${getReco(hottest)}`;
  }

  if (q.includes("coolest") || q.includes("lowest") || q.includes("minimum")) {
    if (!coolest) return "No data available.";
    return `❄️ Coolest zone is ${coolest.name} at ${coolest.temperature.toFixed(1)}°C (${getCluster(coolest.cluster).label}).`;
  }

  if (q.includes("average") || q.includes("avg") || q.includes("mean")) {
    return `📊 Average temperature across all ${zones.length} zones: ${avgTemp.toFixed(1)}°C`;
  }

  if (q.includes("recommend") || q.includes("action") || q.includes("what should") || q.includes("suggest")) {
    if (!zones.length) return "No data available yet.";
    return `💡 Recommendations:\n\n${zones.map((z) => `• ${z.name}: ${getReco(z)}`).join("\n\n")}`;
  }

  if (q.includes("summar") || q.includes("overview") || q.includes("all zones") || q.includes("report")) {
    return `📋 Zone Summary:
🔴 Critical: ${critical.length} — ${critical.map(z => z.name).join(", ") || "None"}
🟡 Moderate: ${moderate.length} — ${moderate.map(z => z.name).join(", ") || "None"}
🟢 Safe:     ${safe.length} — ${safe.map(z => z.name).join(", ") || "None"}
🌡️ Avg Temp: ${avgTemp.toFixed(1)}°C
🔥 Hottest:  ${hottest?.name ?? "—"} (${hottest?.temperature.toFixed(1)}°C)`;
  }

  if (q.includes("how many") || q.includes("count") || q.includes("total")) {
    return `📊 Zone counts:\n• Total: ${zones.length}\n• Critical: ${critical.length}\n• Moderate: ${moderate.length}\n• Safe: ${safe.length}`;
  }

  if (q.includes("vegetation") || q.includes("ndvi") || q.includes("green")) {
    const sorted = [...zones].sort((a, b) => (b.vegetation ?? 0) - (a.vegetation ?? 0));
    return `🌿 Vegetation Index (NDVI):\n${sorted.map((z) => `• ${z.name}: ${z.vegetation?.toFixed(2) ?? "N/A"}`).join("\n")}`;
  }

  if (q.includes("hello") || q.includes("hi") || q.includes("hey")) {
    return `Hi! 👋 I can help you with:\n• Critical / moderate / safe zones\n• Hottest or coolest zone\n• Recommendations for any zone\n• Full summary & report\n\nJust ask!`;
  }

  if (q.includes("help") || q.includes("what can you")) {
    return `🤖 I can answer:\n• "Which zones are critical?"\n• "What's the hottest zone?"\n• "Tell me about Kothrud"\n• "Give recommendations"\n• "Summarize all zones"\n• "What's the average temperature?"\n• "Show vegetation index"`;
  }

  return `I'm not sure about that. Try asking:\n• "Which zones are critical?"\n• "What's the hottest zone?"\n• "Summarize all risks"\n• Or mention a zone name like "Kothrud"`;
};

// ── Chatbot ───────────────────────────────────────────────────
const Chatbot = ({ zones }: { zones: Zone[] }) => {
  const [open,     setOpen    ] = useState(false);
  const [mini,     setMini    ] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hi! I'm your Urban Heat Risk Assistant 🔥 Ask me about zone risks, temperatures, or recommendations.",
  }]);
  const [input,   setInput  ] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      const reply = getRuleBasedReply(userMsg.content, zones);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      setLoading(false);
    }, 600);
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold shadow-2xl shadow-orange-500/30 hover:scale-105 transition-all"
        >
          <Bot className="w-5 h-5" />
          Heat Assistant
        </button>
      )}

      {open && (
        <div className={`fixed bottom-6 right-6 z-50 flex flex-col bg-[#0f172a] border border-[#1f2937] rounded-2xl shadow-2xl transition-all ${mini ? "h-14 w-72" : "w-96 h-[540px]"}`}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f2937] rounded-t-2xl bg-gradient-to-r from-orange-500/10 to-red-500/10">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-white text-sm font-semibold">Heat Assistant</div>
                {!mini && (
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                    <span className="text-green-400 text-xs">{zones.length} zones loaded</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setMini((v) => !v)} className="text-gray-400 hover:text-white p-1">
                {mini ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!mini && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mr-2 mt-1 shrink-0">
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[78%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap leading-relaxed ${
                      msg.role === "user"
                        ? "bg-orange-500/20 text-orange-100 rounded-br-none"
                        : "bg-[#1e293b] text-gray-200 rounded-bl-none"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mr-2 mt-1 shrink-0">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                    <div className="bg-[#1e293b] px-4 py-3 rounded-xl rounded-bl-none">
                      <div className="flex gap-1 items-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick prompts */}
              {messages.length === 1 && (
                <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                  {["Which zones are critical?", "What's the hottest zone?", "Give recommendations", "Summarize all zones"].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="text-xs px-2.5 py-1 rounded-full bg-[#1e293b] text-gray-300 hover:text-white hover:bg-[#334155] border border-[#1f2937] transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="px-3 pb-3">
                <div className="flex items-center gap-2 bg-[#1e293b] rounded-xl px-3 py-2 border border-[#334155] focus-within:border-orange-500/50 transition-all">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Ask about zones, risks, actions..."
                    className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
                  />
                  <button
                    onClick={send}
                    disabled={!input.trim()}
                    className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center disabled:opacity-40 hover:scale-105 transition-all"
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

// ── Main Page ─────────────────────────────────────────────────
const Analytics = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res  = await fetch("http://127.0.0.1:8000/api/clusters/");
        const data = await res.json();
        if (Array.isArray(data)) {
          setZones(data);
          setLastUpdated(new Date().toLocaleTimeString());
        }
      } catch (err) { console.error(err); }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const critical = zones.filter((z) => z.cluster === 2);
  const moderate = zones.filter((z) => z.cluster === 1);
  const safe     = zones.filter((z) => z.cluster === 0);
  const avgTemp  = zones.length
    ? zones.reduce((s, z) => s + z.temperature, 0) / zones.length
    : 0;

  return (
    <div className="min-h-screen w-full bg-[#0b0f19] text-gray-100 px-6 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Alert & Risk Report</h1>
          <p className="text-gray-400 text-sm font-mono mt-0.5">
            PUNE, MAHARASHTRA • {lastUpdated ? `Updated ${lastUpdated}` : "Connecting..."}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Wind className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-400">{zones.length} zones monitored</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Critical Zones", value: critical.length,          color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20",    icon: ShieldAlert    },
          { label: "Moderate Zones", value: moderate.length,          color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: ShieldQuestion },
          { label: "Safe Zones",     value: safe.length,              color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/20",   icon: ShieldCheck    },
          { label: "Avg Temp",       value: `${avgTemp.toFixed(1)}°C`, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", icon: Thermometer    },
        ].map(({ label, value, color, bg, border, icon: Icon }) => (
          <div key={label} className={`${bg} ${border} border rounded-xl p-4`}>
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
              <Icon className="w-4 h-4" />
              {label}
            </div>
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Alert Sections */}
      {[
        { zones: critical, cluster: 2, title: "🔴 Critical Alerts",   empty: "No critical zones detected." },
        { zones: moderate, cluster: 1, title: "🟡 Moderate Warnings", empty: "No moderate zones detected." },
        { zones: safe,     cluster: 0, title: "🟢 Safe Zones",        empty: "No safe zones detected."     },
      ].map(({ zones: zlist, cluster, title, empty }) => {
        const cfg = getCluster(cluster);
        return (
          <div key={title}>
            <h2 className="text-white font-semibold text-base mb-3">{title}</h2>
            {zlist.length === 0 ? (
              <p className="text-gray-500 text-sm">{empty}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {zlist.map((zone) => (
                  <div key={zone.name} className={`${cfg.bg} ${cfg.border} border rounded-xl p-4 space-y-3`}>
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-white text-base">{zone.name}</div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                        <span className="font-semibold text-white">{zone.temperature.toFixed(1)}°C</span>
                      </div>
                      {zone.vegetation !== undefined && (
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <Leaf className="w-3.5 h-3.5 text-green-400" />
                          <span>NDVI {zone.vegetation.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 leading-relaxed border-t border-white/5 pt-2">
                      <AlertTriangle className="w-3 h-3 inline mr-1 text-yellow-500" />
                      {getReco(zone)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Floating chatbot */}
      <Chatbot zones={zones} />
    </div>
  );
};

export default Analytics;