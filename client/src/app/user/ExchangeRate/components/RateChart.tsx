import { useState, useMemo } from "react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";
import { VscArrowSwap } from "react-icons/vsc";
import { CustomTooltip } from "./CustomToolTip";
import { useRateChart } from "../hook/userChart";

interface CurrencyOption {
  code: string;
  symbol: string;
}

interface Props {
  from: string;
  to: string;
  fromSymbol: string;
  toSymbol: string;
  rate: number;
  currencyOptions: CurrencyOption[];
  exchangeRates: any[];
  rates: Record<string, Record<string, { buy: number; sell: number }>>;
  bridge: string | null;
  onPairChange: (from: string, to: string, fromSymbol: string, toSymbol: string) => void;
}

const PERIODS = [
  { label: "1D", days: 1 },
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "1Y", days: 365 },
];

export const RateChart = ({
  from,
  to,
  fromSymbol,
  toSymbol,
  rate,
  currencyOptions,
  // exchangeRates,
  rates,
  bridge,
  onPairChange,
}: Props) => {
  const [activePeriod, setActivePeriod] = useState("1W");
  const activeDays = PERIODS.find((p) => p.label === activePeriod)?.days ?? 7;

  // Always fetch the direct/base pair data.
  // For cross-currency (e.g. JPY→THB via USD):
  //   fetch JPY→USD and USD→THB separately, then multiply.
  const isDirectPair = !bridge;

  // For bridge: fetch from→bridge and bridge→to
  const { chartData: directData, isLoading: loadingDirect } = useRateChart({
    from,
    to: isDirectPair ? to : bridge ?? to,
    days: activeDays,
  });

  const { chartData: bridgeData, isLoading: loadingBridge } = useRateChart({
    from: bridge ?? from,
    to: bridge ? to : from, // only used when bridge exists
    days: activeDays,
    enabled: !!bridge,
  });

  const isLoading = loadingDirect || (!!bridge && loadingBridge);

  // Compute final chart data — multiply rates for cross-currency
  const chartData = useMemo(() => {
    if (!directData?.length) return [];

    if (isDirectPair || !bridge || !bridgeData?.length) {
      return directData;
    }

    // Align by timestamp and multiply buyRate
    const bridgeMap = new Map(
      bridgeData.map((d: any) => [d.timestamp, d.buyRate])
    );

    return directData.map((d: any) => {
      const leg2 = bridgeMap.get(d.timestamp) ?? rates[bridge]?.[to]?.buy ?? 1;
      return {
        ...d,
        buyRate: d.buyRate * leg2,
      };
    });
  }, [directData, bridgeData, isDirectPair, bridge, to, rates]);

  // Compute stats
  const values = chartData?.map((d: any) => d.buyRate).filter(Boolean) ?? [];
  const dayHigh = values.length ? Math.max(...values) : null;
  const dayLow = values.length ? Math.min(...values) : null;
  const prevClose = values.length > 1 ? values[0] : null;
  const latestVal = values.length ? values[values.length - 1] : rate;
  const changePercent =
    prevClose && prevClose !== 0
      ? ((latestVal - prevClose) / prevClose) * 100
      : 0;
  const isPositive = changePercent >= 0;

  const handleFromChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFrom = e.target.value;
    const found = currencyOptions.find((c) => c.code === newFrom);
    const newFromSymbol = found?.symbol ?? newFrom;

    // Keep `to` if a valid path exists, otherwise pick first available
    if (newFrom !== to) {
      onPairChange(newFrom, to, newFromSymbol, toSymbol);
    } else {
      const other = currencyOptions.find((c) => c.code !== newFrom);
      if (other) onPairChange(newFrom, other.code, newFromSymbol, other.symbol);
    }
  };

  const handleToChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTo = e.target.value;
    const found = currencyOptions.find((c) => c.code === newTo);
    const newToSymbol = found?.symbol ?? newTo;
    onPairChange(from, newTo, fromSymbol, newToSymbol);
  };

  const selectClass =
    "bg-transparent text-white text-xl font-bold font-display appearance-none cursor-pointer focus:outline-none w-full";

  return (
    <div className="glass-panel rounded-[2.5rem] p-6 md:p-10 shadow-2xl overflow-hidden relative">

      {/* Ambient glows */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#c3c0ff]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[#8affec]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-10">

        <div className="lg:col-span-8 flex flex-col md:flex-row items-center gap-4">

          <div className="w-full bg-[#081329] rounded-2xl p-4 border border-[#38476d]/10 focus-within:ring-1 focus-within:ring-[#8affec] transition-all">
            <label className="text-xs text-[#9baad6] font-bold uppercase tracking-widest mb-2 block">
              From
            </label>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c3c0ff] to-[#645efb] flex items-center justify-center flex-shrink-0">
                <span className="text-[#2b15c6] font-bold text-sm">{fromSymbol}</span>
              </div>
              <div className="flex-grow">
                <select value={from} onChange={handleFromChange} className={selectClass}>
                  {currencyOptions.map((c) => (
                    <option key={c.code} value={c.code} className="bg-[#081329]">
                      {c.code}
                    </option>
                  ))}
                </select>
                <div className="text-sm text-[#9baad6]">{from} — {fromSymbol}</div>
              </div>
            </div>
          </div>

          {/* Swap */}
          <button
            onClick={() => onPairChange(to, from, toSymbol, fromSymbol)}
            className="w-14 h-14 flex-shrink-0 rounded-full bg-[#172b54] flex items-center justify-center border border-[#38476d]/20 shadow-lg active:scale-90 transition-transform group"
          >
            <span className="material-symbols-outlined text-[#8affec] group-hover:rotate-180 transition-transform duration-500">
              <VscArrowSwap />
            </span>
          </button>

          {/* TO — loops ALL currencies except from */}
          <div className="w-full bg-[#081329] rounded-2xl p-4 border border-[#38476d]/10 focus-within:ring-1 focus-within:ring-[#8affec] transition-all">
            <label className="text-xs text-[#9baad6] font-bold uppercase tracking-widest mb-2 block">
              To
            </label>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8affec] to-[#48e5d0] flex items-center justify-center flex-shrink-0">
                <span className="text-[#006257] font-bold text-sm">{toSymbol}</span>
              </div>
              <div className="flex-grow">
                <select value={to} onChange={handleToChange} className={selectClass}>
                  {currencyOptions
                    .filter((c) => c.code !== from)
                    .map((c) => (
                      <option key={c.code} value={c.code} className="bg-[#081329]">
                        {c.code}
                      </option>
                    ))}
                </select>
                <div className="text-sm text-[#9baad6]">{to} — {toSymbol}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Live rate + bridge badge */}
        <div className="lg:col-span-4 bg-[#142449]/50 rounded-2xl p-6 border-l-4 border-tertiary relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-tertiary/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-tertiary" />
              </span>
              <span className="text-xs font-bold text-tertiary uppercase tracking-tighter">
                Live Market Rate
              </span>
            </div>

            {/* Cross-currency badge */}
            {bridge && (
              <div className="flex items-center gap-1.5 bg-yellow-400/10 rounded-full px-2.5 py-1 border border-yellow-400/20">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-[10px] text-yellow-400 font-bold tracking-wide">
                  via {bridge}
                </span>
              </div>
            )}
          </div>

          <div className="text-2xl font-display font-bold text-white mb-1">
            1 {from} = {toSymbol}{rate.toFixed(4)}
          </div>

          {/* Route for cross-currency */}
          {bridge && (
            <div className="flex items-center gap-1 text-xs text-[#9baad6] mb-2">
              <span>{from}</span>
              <span className="text-[#38476d]">›</span>
              <span className="text-yellow-400 font-bold">{bridge}</span>
              <span className="text-[#38476d]">›</span>
              <span>{to}</span>
            </div>
          )}

          {changePercent !== 0 && (
            <div className={`flex items-center gap-1 text-sm font-bold mb-1 ${isPositive ? "text-green-400" : "text-red-400"}`}>
              {isPositive ? "+" : ""}{changePercent.toFixed(2)}%
            </div>
          )}

          <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
            We use midmarket rates for all transfers.{" "}
          </p>
        </div>
      </div>

      {/* ── CHART AREA ── */}
      <div className="relative bg-surface-container-lowest/30 rounded-[2rem] p-6 border border-outline-variant/5">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h3 className="text-xl font-display font-bold text-white">Market Momentum</h3>
            <p className="text-sm text-on-surface-variant">
              {from}/{to} currency pair performance
              {bridge && (
                <span className="ml-2 text-yellow-400/70 text-xs">(cross-rate via {bridge})</span>
              )}
            </p>
          </div>

          {/* period selector */}
          <div className="flex bg-surface-container-high rounded-xl p-1">
            {PERIODS.map((p) => {
              const selected = activePeriod === p.label;

              return (
                <button
                  key={p.label}
                  onClick={() => setActivePeriod(p.label)}
                  className="relative px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300"
                  style={{
                    background: selected
                      ? "rgba(138,255,236,.14)"
                      : "transparent",

                    color: selected
                      ? "var(--tertiary)"
                      : "var(--text-secondary)",

                    border: selected
                      ? "1px solid rgba(138,255,236,.35)"
                      : "1px solid transparent",

                    boxShadow: selected
                      ? "0 0 18px rgba(138,255,236,.18)"
                      : "none",

                    transform: selected ? "scale(1.03)" : "scale(1)",
                  }}
                >
                  {p.label}

                  {selected && (
                    <>
                      {/* bottom active indicator */}
                      <span
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full"
                        style={{
                          background: "var(--tertiary)",
                        }}
                      />

                      {/* active glow */}
                      <span
                        className="absolute inset-0 rounded-lg pointer-events-none"
                        style={{
                          boxShadow:
                            "inset 0 0 12px rgba(138,255,236,.12)",
                        }}
                      />
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-[320px] w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-tertiary border-t-transparent animate-spin" />
                <p className="text-[#9baad6] text-sm">Loading chart data...</p>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[#9baad6] text-sm">No historical data available for this period.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8affec" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#8affec" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid stroke="#ffffff08" vertical={false} />

                <XAxis
                  dataKey="timestamp"
                  tick={{ fill: "#9baad6", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickCount={6}
                />

                <YAxis
                  tick={{ fill: "#9baad6", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                  tickFormatter={(v) => `${toSymbol}${Number(v).toFixed(2)}`}
                  domain={["auto", "auto"]}
                />

                <Tooltip
                  content={<CustomTooltip toSymbol={toSymbol} />}
                  cursor={{ stroke: "#8affec30", strokeWidth: 1 }}
                />

                <Area
                  type="monotone"
                  dataKey="buyRate"
                  stroke="#8affec"
                  strokeWidth={2.5}
                  fill="url(#chartGradient)"
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: "#8affec",
                    stroke: "#060e20",
                    strokeWidth: 2,
                    style: { filter: "drop-shadow(0 0 8px rgba(138,255,236,0.8))" },
                  }}
                  style={{ filter: "drop-shadow(0 0 6px rgba(138,255,236,0.4))" }}
                />

                <Area
                  type="monotone"
                  dataKey="sellRate"
                  stroke="#ffb020"
                  strokeWidth={2}
                  fill="none"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: "#ffb020",
                    stroke: "#060e20",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Footer stats */}
        <div className="mt-8 grid grid-cols-3 gap-4 border-t border-outline-variant/10 pt-6">
          <div>
            <div className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-1">
              Previous Close
            </div>
            <div className="text-base font-bold text-white font-display">
              {prevClose ? `${toSymbol}${prevClose.toFixed(4)}` : "—"}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-1">
              Period High
            </div>
            <div className="text-base font-bold text-green-400 font-display">
              {dayHigh ? `${toSymbol}${dayHigh.toFixed(4)}` : "—"}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-1">
              Period Low
            </div>
            <div className="text-base font-bold text-red-400 font-display">
              {dayLow ? `${toSymbol}${dayLow.toFixed(4)}` : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};