import React, { useState, useEffect } from "react";
import {
  Globe,
  MapPin,
  TrendingUp,
  Users,
  Filter,
  RefreshCw,
  Download,
  ShieldCheck,
  Zap,
  Activity,
  ArrowUpRight,
} from "lucide-react";

export interface RegionTrafficData {
  id: string;
  country: string;
  code: string;
  region: "North America" | "Europe" | "Asia-Pacific" | "Latin America" | "Middle East & Africa";
  activeSessions: number;
  sharePct: number;
  avgLatencyMs: number;
  coordinates: { x: number; y: number }; // SVG percentage coordinates on map canvas
  flag: string;
}

export interface GlobalTrafficHeatmapProps {
  className?: string;
}

export const GlobalTrafficHeatmap: React.FC<GlobalTrafficHeatmapProps> = ({
  className = "",
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedCountry, setSelectedCountry] = useState<RegionTrafficData | null>(null);
  const [isLiveStream, setIsLiveStream] = useState<boolean>(true);

  // Country Traffic Dataset with geographic SVG plot percentage coordinates
  const [countryData, setCountryData] = useState<RegionTrafficData[]>([
    {
      id: "us",
      country: "United States",
      code: "US",
      region: "North America",
      activeSessions: 1420,
      sharePct: 38.5,
      avgLatencyMs: 12,
      coordinates: { x: 22, y: 38 },
      flag: "🇺🇸",
    },
    {
      id: "de",
      country: "Germany",
      code: "DE",
      region: "Europe",
      activeSessions: 680,
      sharePct: 18.4,
      avgLatencyMs: 18,
      coordinates: { x: 49, y: 28 },
      flag: "🇩🇪",
    },
    {
      id: "gb",
      country: "United Kingdom",
      code: "UK",
      region: "Europe",
      activeSessions: 520,
      sharePct: 14.1,
      avgLatencyMs: 15,
      coordinates: { x: 46, y: 26 },
      flag: "🇬🇧",
    },
    {
      id: "jp",
      country: "Japan",
      code: "JP",
      region: "Asia-Pacific",
      activeSessions: 410,
      sharePct: 11.1,
      avgLatencyMs: 42,
      coordinates: { x: 84, y: 38 },
      flag: "🇯🇵",
    },
    {
      id: "br",
      country: "Brazil",
      code: "BR",
      region: "Latin America",
      activeSessions: 310,
      sharePct: 8.4,
      avgLatencyMs: 65,
      coordinates: { x: 34, y: 72 },
      flag: "🇧🇷",
    },
    {
      id: "in",
      country: "India",
      code: "IN",
      region: "Asia-Pacific",
      activeSessions: 240,
      sharePct: 6.5,
      avgLatencyMs: 58,
      coordinates: { x: 69, y: 48 },
      flag: "🇮🇳",
    },
    {
      id: "au",
      country: "Australia",
      code: "AU",
      region: "Asia-Pacific",
      activeSessions: 110,
      sharePct: 3.0,
      avgLatencyMs: 82,
      coordinates: { x: 86, y: 78 },
      flag: "🇦🇺",
    },
  ]);

  // Live traffic session fluctuation simulation
  useEffect(() => {
    if (!isLiveStream) return;

    const interval = setInterval(() => {
      setCountryData((prev) =>
        prev.map((c) => ({
          ...c,
          activeSessions: Math.max(20, c.activeSessions + Math.floor((Math.random() - 0.48) * 12)),
        }))
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [isLiveStream]);

  // Filter countries by region
  const filteredCountries = countryData.filter(
    (c) => selectedRegion === "all" || c.region === selectedRegion
  );

  const totalActiveGlobalUsers = countryData.reduce((acc, c) => acc + c.activeSessions, 0);

  const exportGeographicCsv = () => {
    let csv = "Country,Code,Region,Active Sessions,Share %,Avg Latency (ms)\n";
    countryData.forEach((c) => {
      csv += `"${c.country}","${c.code}","${c.region}",${c.activeSessions},${c.sharePct}%,${c.avgLatencyMs}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PDFSun_Global_Traffic_Heatmap_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <Globe className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Global Real-Time Traffic Heatmap
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase">
                {totalActiveGlobalUsers.toLocaleString()} Live Users
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Interactive geographic distribution of active sessions across edge CDN nodes.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsLiveStream(!isLiveStream)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              isLiveStream
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            {isLiveStream ? "Live Telemetry" : "Stream Paused"}
          </button>

          <button
            onClick={exportGeographicCsv}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Region Selector Filter */}
      <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between overflow-x-auto gap-2">
        <div className="flex items-center space-x-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
            Filter Region:
          </span>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          {[
            { key: "all", label: "Global (All)" },
            { key: "North America", label: "North America" },
            { key: "Europe", label: "Europe" },
            { key: "Asia-Pacific", label: "Asia-Pacific" },
            { key: "Latin America", label: "Latin America" },
          ].map((reg) => (
            <button
              key={reg.key}
              onClick={() => setSelectedRegion(reg.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedRegion === reg.key
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {reg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive World Map Canvas Container */}
      <div className="relative w-full h-80 sm:h-96 rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl p-4 flex flex-col justify-between">
        {/* World Map SVG Background Silhouette */}
        <svg
          viewBox="0 0 1000 500"
          className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none"
        >
          {/* Simplified Continental Outlines */}
          {/* North America */}
          <path
            d="M 120,80 Q 220,60 300,120 Q 250,220 180,240 Q 100,180 120,80 Z"
            fill="#475569"
          />
          {/* South America */}
          <path
            d="M 280,260 Q 350,270 380,360 Q 320,440 260,380 Q 250,300 280,260 Z"
            fill="#475569"
          />
          {/* Europe */}
          <path
            d="M 450,100 Q 550,80 580,150 Q 520,200 460,160 Z"
            fill="#475569"
          />
          {/* Africa */}
          <path
            d="M 460,200 Q 580,210 590,320 Q 520,400 450,320 Z"
            fill="#475569"
          />
          {/* Asia */}
          <path
            d="M 580,80 Q 820,70 880,180 Q 750,260 620,220 Z"
            fill="#475569"
          />
          {/* Australia */}
          <path
            d="M 780,330 Q 880,330 890,410 Q 800,430 780,330 Z"
            fill="#475569"
          />
        </svg>

        {/* Real-time Heatmap Nodes with Pulse Animation */}
        <div className="relative w-full h-full">
          {filteredCountries.map((country) => {
            const isSelected = selectedCountry?.id === country.id;
            return (
              <div
                key={country.id}
                style={{
                  left: `${country.coordinates.x}%`,
                  top: `${country.coordinates.y}%`,
                }}
                onClick={() => setSelectedCountry(country)}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
              >
                {/* Outer Ping Ring */}
                <span className="absolute -inset-2 rounded-full bg-indigo-500/40 animate-ping" />
                {/* Inner Glow Dot */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shadow-lg transition-transform transform group-hover:scale-125 ${
                    isSelected
                      ? "bg-amber-400 text-slate-900 ring-4 ring-amber-300/50"
                      : "bg-indigo-500 text-white ring-2 ring-indigo-300"
                  }`}
                >
                  {country.flag}
                </div>

                {/* Hover Tooltip Card */}
                <div className="absolute bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 bg-slate-900/95 text-white p-2.5 rounded-xl border border-slate-700 shadow-xl whitespace-nowrap z-30 text-xs space-y-1">
                  <div className="font-extrabold flex items-center space-x-1.5">
                    <span>{country.flag}</span>
                    <span>{country.country}</span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono">
                    Sessions: <strong>{country.activeSessions.toLocaleString()}</strong> ({country.sharePct}%)
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono">
                    Edge Ping: {country.avgLatencyMs}ms
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Country Telemetry Card Overlay */}
        {selectedCountry && (
          <div className="relative z-20 p-3 rounded-2xl bg-slate-900/90 border border-indigo-500/40 backdrop-blur-md text-white flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <span className="text-xl">{selectedCountry.flag}</span>
              <div>
                <h5 className="font-black text-sm text-white">{selectedCountry.country}</h5>
                <span className="text-[10px] text-slate-400 uppercase font-mono">
                  {selectedCountry.region} Region
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4 font-mono">
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block">Live Sessions</span>
                <span className="font-black text-indigo-400 text-sm">
                  {selectedCountry.activeSessions.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block">Edge Latency</span>
                <span className="font-black text-emerald-400 text-sm">
                  {selectedCountry.avgLatencyMs}ms
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Country Traffic Breakdown Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-indigo-500" />
            <span>Country Traffic Rankings</span>
          </h4>
          <span className="text-xs text-slate-400 font-mono">
            {filteredCountries.length} Regions Listed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-black">
                <th className="py-2.5 px-3">Country</th>
                <th className="py-2.5 px-3">Region</th>
                <th className="py-2.5 px-3">Active Sessions</th>
                <th className="py-2.5 px-3">Traffic Share</th>
                <th className="py-2.5 px-3">Avg Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {filteredCountries.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelectedCountry(c)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition"
                >
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white font-sans flex items-center space-x-2">
                    <span>{c.flag}</span>
                    <span>{c.country}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-sans">
                    {c.region}
                  </td>
                  <td className="py-3 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                    {c.activeSessions.toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-bold">
                      {c.sharePct}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-emerald-500 font-bold">
                    {c.avgLatencyMs} ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
