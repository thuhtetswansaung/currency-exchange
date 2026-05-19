import { getVersion } from "../utils/cache-version";
import { Currency } from "../models/currency";
import { ExchangeRateSnapshot } from "../models/exchange-rate-snapshot";
import { getCache, setCache } from "../utils/cache";

class ExchangeRateSnapshotService {
  async getHistory(from: string, to: string, days?: number) {


    const version:any = await getVersion("exchange-rates:version");
    const cacheKey = `exchange-snapshot:v${version}:${from}:${to}:${days || "all"}`;
    const cached = await getCache(cacheKey);

    if (cached) {
      console.log("Cache hit ExchangeSnapshot");
      return cached;
    }

    console.log("Cache miss ExchangeSnapshot");

    const [fromCurrency, toCurrency] = await Promise.all([
      Currency.findOne({ code: from }),
      Currency.findOne({ code: to }),
    ]);

    if (!fromCurrency || !toCurrency) {
      throw new Error("Invalid currency code");
    }

    const baseFilter: any = {};

    if (days) {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      baseFilter.timestamp = { $gte: fromDate };
    }

    //  Try DIRECT pair
    let data = await ExchangeRateSnapshot.find({
      ...baseFilter,
      fromCurrency: fromCurrency._id,
      toCurrency: toCurrency._id,
    })
      .sort({ timestamp: 1 })
      .lean();

    if (data.length) {
      return data.map(this.format);
    }

    // Try REVERSE pair
    const reverse = await ExchangeRateSnapshot.find({
      ...baseFilter,
      fromCurrency: toCurrency._id,
      toCurrency: fromCurrency._id,
    })
      .sort({ timestamp: 1 })
      .lean();

    if (reverse.length) {
      return reverse.map((d:any) => ({
        ...this.format(d),
        buyRate: 1 / d.buyRate,
        sellRate: 1 / d.sellRate,
      }));
    }

    // Try BRIDGE (cross currency)
    const bridgeCurrencies = await Currency.find({
      _id: { $nin: [fromCurrency._id, toCurrency._id] },
    });

    for (const bridge of bridgeCurrencies) {
      const leg1 = await ExchangeRateSnapshot.find({
        ...baseFilter,
        fromCurrency: fromCurrency._id,
        toCurrency: bridge._id,
      }).lean();

      const leg2 = await ExchangeRateSnapshot.find({
        ...baseFilter,
        fromCurrency: bridge._id,
        toCurrency: toCurrency._id,
      }).lean();

      if (leg1.length && leg2.length) {
        const map2 = new Map(
          leg2.map((d) => [new Date(d.timestamp).getTime(), d])
        );

        const merged = leg1
          .map((d1: any) => {
            const t = new Date(d1.timestamp).getTime();
            const d2: any = map2.get(t);
            if (!d2) return null;

            return {
              timestamp: d1.timestamp,
              buyRate: d1.buyRate * d2.buyRate,
              sellRate: d1.sellRate * d2.sellRate,
            };
          })
          .filter(Boolean);

        if (merged.length) {
          await setCache(cacheKey, merged, 60)
          return merged
        };
      }
    }

    await setCache(cacheKey, [], 60)

    // Nothing found
    return [];
  }

  private format(d: any) {
    return {
      _id: d._id,
      buyRate: d.buyRate,
      sellRate: d.sellRate,
      timestamp: d.timestamp,
    };
  }
}

export default ExchangeRateSnapshotService;