import { QueryOptions } from "utils/pagination";
import { RateHistory } from "../models/rate-history";
import { AppError } from "../utils/app-error";
import { Currency } from "../models/currency";
import { ExchangeRate } from "../models/exchange-rate";
import { getVersion } from "../utils/cache-version";
import { getCache, setCache } from "../utils/cache";

class RateHistoryService {
    async getRateHistoryByExchangeRate(exchangeRateId: string) {

        const version: any = await getVersion('rate-histories:version')
        const cacheKey = `rate-histories:v${version}:${exchangeRateId}`
        const cached = await getCache(cacheKey)

        if (cached) {
            console.log("Cache hit getRateHistoryByExcahngeRate");
            return cached;
        }

        console.log("Cache miss getRateHistoryByExcahngeRate");

        const history = await RateHistory.find({ exchangeRateId })
            .populate({
                path: "exchangeRateId",
                populate: [
                    { path: "fromCurrency", select: "code name" },
                    { path: "toCurrency", select: "code name" },
                ],
            })
            .populate("changedBy", "name email")
            .sort({ createdAt: -1 }); // newest first

        if (!history || history.length === 0) {
            throw new AppError("No rate history found", 404);
        }

        return history;
    }

    async getAllExchangeRateHistories(query: QueryOptions) {

        const version: any = await getVersion('rate-histories:version')
        const cacheKey = `rate-histories:v${version}:${JSON.stringify(query)}`
        const cached = await getCache(cacheKey)

        if (cached) {
            console.log("Cache hit getAllExchangeRateHistories");
            return cached;
        }

        console.log("Cache miss getAllExchangeRateHistories");

        const { page, limit, skip, sortBy, order, fromCurrency, toCurrency } = query;

        const filter: any = {};

        let fromIds: any[] = [];
        let toIds: any[] = [];

        if (fromCurrency) {
            const fromCurrencies = await Currency.find({
                code: { $regex: fromCurrency, $options: "i" },
                isActive: true,
            }).select("_id");

            fromIds = fromCurrencies.map(c => c._id);
        }

        if (toCurrency) {
            const toCurrencies = await Currency.find({
                code: { $regex: toCurrency, $options: "i" },
                isActive: true,
            }).select("_id");

            toIds = toCurrencies.map(c => c._id);
        }

        if (fromCurrency || toCurrency) {
            const exchangeRates = await ExchangeRate.find({
                ...(fromIds.length && { fromCurrency: { $in: fromIds } }),
                ...(toIds.length && { toCurrency: { $in: toIds } }),
                isActive: true,
            }).select("_id");

            const exchangeRateIds = exchangeRates.map(e => e._id);

            filter.exchangeRateId = { $in: exchangeRateIds };
        }

        const [data, total] = await Promise.all([
            RateHistory.find(filter)
                .populate({
                    path: "exchangeRateId",
                    populate: [
                        {
                            path: "fromCurrency",
                            select: "code name symbol isActive",
                            match: { isActive: true },
                        },
                        {
                            path: "toCurrency",
                            select: "code name symbol isActive",
                            match: { isActive: true },
                        },
                    ],
                })
                .populate("changedBy", "name email")
                .sort({ [sortBy]: order === "desc" ? 1 : -1 })
                .skip(skip)
                .limit(limit),

            RateHistory.countDocuments(filter),
        ]);

        const filteredData = data.filter((h: any) =>
            h.exchangeRateId &&
            h.exchangeRateId.fromCurrency &&
            h.exchangeRateId.toCurrency
        );

        const result = {
            data: filteredData,
            total: filteredData.length,
            page,
            totalPages: limit > 0 ? Math.ceil(filteredData.length / limit) : 1,
        }

        await setCache(cacheKey, result, 60)

        return result;
    }
}

export default RateHistoryService