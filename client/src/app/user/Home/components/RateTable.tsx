import { useMemo } from "react";

interface MarketRatesTableProps {
  exchangeRates: any[];
  rateHistory: any[];
}

const formatBangkokTime = (date: string) =>
  new Date(date).toLocaleString("en-TH", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

const MarketRatesTable = ({
  exchangeRates,
  rateHistory,
}: MarketRatesTableProps) => {

  const historyMap = useMemo(() => {
    const map = new Map<string, any>();

    rateHistory.forEach((r: any) => {
      if (!r?.exchangeRateId?.fromCurrency || !r?.exchangeRateId?.toCurrency)
        return;

      const from = r.exchangeRateId.fromCurrency.code;
      const to = r.exchangeRateId.toCurrency.code;

      const key = `${from}-${to}`;

      if (
        !map.has(key) ||
        new Date(r.createdAt) > new Date(map.get(key).createdAt)
      ) {
        map.set(key, r);
      }
    });

    return map;
  }, [rateHistory]);

  const mergedRates = useMemo(() => {
    return exchangeRates.map((r: any) => {
      const key = `${r.fromCurrency.code}-${r.toCurrency.code}`;
      const history = historyMap.get(key);

      return {
        ...r,
        buyOldRate: history?.buyOldRate ?? r.buyRate,
        buyNewRate: history?.buyNewRate ?? r.buyRate,
        sellOldRate: history?.sellOldRate ?? r.sellRate,
        sellNewRate: history?.sellNewRate ?? r.sellRate,
      };
    });
  }, [exchangeRates, historyMap]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left border-b border-outline-variant/10">
            <th className="pb-6 text-xs text-[#9baad6]">Pair</th>
            <th className="pb-6 text-xs text-[#9baad6]">Buy Rate</th>
            <th className="pb-6 text-xs text-[#9baad6]">Change</th>
            <th className="pb-6 text-xs text-[#9baad6]">Sell Rate</th>
            <th className="pb-6 text-xs text-[#9baad6]">Change</th>
            <th className="pb-6 text-xs text-[#9baad6]">Updated</th>
          </tr>
        </thead>

        <tbody>
          {mergedRates.map((r: any) => {
            const from = r.fromCurrency;
            const to = r.toCurrency;

            return (
              <tr key={r._id} className="border-b border-[#38476d]/5">

                <td className="py-4 text-white font-semibold">
                  {from.code} / {to.code}
                </td>

                <td className="py-4 text-tertiary">
                  {r.buyNewRate} {to.symbol}
                </td>

                <td className="py-4">
                  {(() => {
                    const diff = r.buyNewRate - r.buyOldRate;

                    if (diff > 0)
                      return (
                        <span className="text-green-400">
                          ▲ {diff.toFixed(2)}
                        </span>
                      );

                    if (diff < 0)
                      return (
                        <span className="text-red-400">
                          ▼ {Math.abs(diff).toFixed(2)}
                        </span>
                      );

                    return <span className="text-gray-400">—</span>;
                  })()}
                </td>

                <td className="py-4 text-tertiary">
                  {r.sellNewRate} {to.symbol}
                </td>

                <td className="py-4">
                  {(() => {
                    const diff = r.sellNewRate - r.sellOldRate;

                    if (diff > 0)
                      return (
                        <span className="text-green-400">
                          ▲ {diff.toFixed(2)}
                        </span>
                      );

                    if (diff < 0)
                      return (
                        <span className="text-red-400">
                          ▼ {Math.abs(diff).toFixed(2)}
                        </span>
                      );

                    return <span className="text-gray-400">—</span>;
                  })()}
                </td>

                <td className="py-4 text-sm text-gray-300">
                  {formatBangkokTime(r.updatedAt)}
                </td>

              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MarketRatesTable;