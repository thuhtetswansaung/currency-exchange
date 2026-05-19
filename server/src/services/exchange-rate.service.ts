import mongoose from "mongoose";
import { ExchangeRate } from "../models/exchange-rate";
import { Currency } from "../models/currency";
import { RateHistory } from "../models/rate-history";
import { ExchangeRateSnapshot } from "../models/exchange-rate-snapshot";
import { IExchangeRate, IUpdateExchangeRate } from "../interface/IExchangeRate";
import { QueryOptions } from "utils/pagination";
import { AppError } from "../utils/app-error";
import { bumpVersion, getVersion } from "../utils/cache-version";
import { getCache, setCache } from "../utils/cache";

class ExchangeRateService {
    async create(data: IExchangeRate & { changedBy: string }) {
        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            const from = await Currency.findById(data.fromCurrency).session(session);

            const to = await Currency.findById(data.toCurrency).session(session);

            if (!from || !to || !from.isActive || !to.isActive) {
                throw new AppError("Cannot create rate with inactive currency", 400);
            }

            const existing = await ExchangeRate.findOne({
                fromCurrency: data.fromCurrency,
                toCurrency: data.toCurrency,
                isActive: true,
            }).session(session);


            if (existing) {
                throw new AppError("Exchange rate already exists", 409);
            }

            const invalidRate = await ExchangeRate.findOne({
                $or: [
                    {
                        fromCurrency: data.fromCurrency,
                        toCurrency: data.toCurrency,
                    },
                    {
                        fromCurrency: data.toCurrency,
                        toCurrency: data.fromCurrency,
                    },
                ],
                isActive: true,
            }).session(session);

            if (invalidRate) {
                throw new AppError(
                    "Exchange rate pair already exists",
                    409
                );
            }

            if (data.fromCurrency === data.toCurrency) {
                throw new AppError("From and To currency cannot be the same", 400);
            }

            const rate = new ExchangeRate({
                fromCurrency: data.fromCurrency,
                toCurrency: data.toCurrency,
                buyRate: data.buyRate,
                sellRate: data.sellRate,
            });

            await rate.save({ session });

            const history = new RateHistory({
                exchangeRateId: rate._id,
                buyOldRate: 0,
                buyNewRate: data.buyRate,
                sellOldRate: 0,
                sellNewRate: data.sellRate,
                changedBy: data.changedBy,
            });

            await history.save({ session });

            const snapshot1 = new ExchangeRateSnapshot({
                fromCurrency: data.fromCurrency,
                toCurrency: data.toCurrency,
                buyRate: data.buyRate,
                sellRate: data.sellRate,
            });

            const snapshot2 = new ExchangeRateSnapshot({
                fromCurrency: data.toCurrency,
                toCurrency: data.fromCurrency,
                buyRate: 1 / data.sellRate,
                sellRate: 1 / data.buyRate,
            });

            await snapshot1.save({ session });
            await snapshot2.save({ session });

            await session.commitTransaction();

            await bumpVersion('exchange-rates:version')
            await bumpVersion('rate-histories:version')

            return rate;

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }

    async update(exchangeId: string, data: IUpdateExchangeRate, changedBy: string) {
        const rate = await ExchangeRate.findById(exchangeId);

        if (!rate || !rate.isActive) {
            throw new AppError(
                "Exchange rate not found",
                404
            );
        }

        if (data.fromCurrency) {
            const c = await Currency.findById(
                data.fromCurrency
            );

            if (!c || !c.isActive) {
                throw new AppError(
                    "Invalid fromCurrency",
                    400
                );
            }
        }

        if (data.toCurrency) {
            const c = await Currency.findById(
                data.toCurrency
            );

            if (!c || !c.isActive) {
                throw new AppError(
                    "Invalid toCurrency",
                    400
                );
            }
        }

        const oldBuy = rate.buyRate;
        const oldSell = rate.sellRate;

        Object.assign(rate, data);

        await rate.save();

        if (
            data.buyRate !== undefined ||
            data.sellRate !== undefined
        ) {
            await RateHistory.create({
                exchangeRateId: rate._id,
                buyOldRate: oldBuy,
                buyNewRate: rate.buyRate,
                sellOldRate: oldSell,
                sellNewRate: rate.sellRate,
                changedBy,
            });

            await ExchangeRateSnapshot.create([
                {
                    fromCurrency: rate.fromCurrency,
                    toCurrency: rate.toCurrency,
                    buyRate: rate.buyRate,
                    sellRate: rate.sellRate,
                },
                {
                    fromCurrency: rate.toCurrency,
                    toCurrency: rate.fromCurrency,
                    buyRate: 1 / rate.sellRate,
                    sellRate: 1 / rate.buyRate,
                },
            ]);
        }

        await bumpVersion('exchange-rates:version')
        await bumpVersion('rate-histories:version')

        return rate;
    }

    async getAll(query: QueryOptions) {

        const version: any = await getVersion("exchange-rates:version")
        const cacheKey = `exchange-rates:v${version}:${JSON.stringify(query)}`
        const cached = await getCache(cacheKey)

        if (cached) {
            console.log("Cache hit getAllExchangeRate");
            return cached;
        }

        console.log("Cache miss getAllExchangeRate");

        const { page, limit, skip, search, sortBy, order, isActive } = query;

        let currencyFilter = {};

        // For active tab:
        if (isActive === true) {
            const activeCurrencies = await Currency.find({
                isActive: true
            }).select("_id");

            const ids = activeCurrencies.map(c => c._id);

            currencyFilter = {
                fromCurrency: { $in: ids },
                toCurrency: { $in: ids },
            };
        }

        // For archive tab:
        if (isActive === false) {
            const archivedCurrencies = await Currency.find({
                isActive: false
            }).select("_id");

            const ids = archivedCurrencies.map(c => c._id);

            currencyFilter = {
                $or: [
                    { fromCurrency: { $in: ids } },
                    { toCurrency: { $in: ids } }
                ]
            };
        }

        if (search) {
            const currencies = await Currency.find({
                code: {
                    $regex: search,
                    $options: "i",
                }
            }).select("_id");

            const currencyIds =
                currencies.map(c => c._id);

            currencyFilter = {
                ...currencyFilter,
                $or: [
                    { fromCurrency: { $in: currencyIds } },
                    { toCurrency: { $in: currencyIds } },
                ]
            };
        }

        const total = await ExchangeRate.countDocuments(currencyFilter);

        const data = await ExchangeRate.find(currencyFilter)
            .populate(
                "fromCurrency",
                "name code symbol isActive"
            )
            .populate(
                "toCurrency",
                "name code symbol isActive"
            )
            .sort({
                [sortBy]:
                    order === "asc" ? 1 : -1
            })
            .skip(skip)
            .limit(limit);

        const result = {
            data,
            total,
            page,
            totalPages:limit > 0 ? Math.ceil(total / limit) : 1
        }

        await setCache(cacheKey, result, 60)

        return result;
    }

    async getById(exchangeId: string) {

        const version:any = await getVersion('exchange-rates:version')
        const cacheKey = `exchange-rates:v${version}:${exchangeId}`
        const cached = await getCache(cacheKey)

        if (cached) {
            console.log("Cache hit getAllExchangeRateById");
            return cached;
        }

        console.log("Cache miss getAllExchangeRateById");

        const rate = await ExchangeRate.findById(exchangeId)
            .populate(
                "fromCurrency",
                "name code"
            )
            .populate(
                "toCurrency",
                "name code"
            );

        if (!rate || !rate.isActive) {
            throw new AppError(
                "Exchange rate not found",
                404
            );
        }

        await setCache(cacheKey, rate, 60)

        return rate;
    }


}

export default ExchangeRateService;