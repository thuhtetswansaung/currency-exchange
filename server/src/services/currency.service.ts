import { Currency } from "../models/currency";
import { AppError } from "../utils/app-error";
import { QueryOptions } from "../utils/pagination";
import { ICurrency, IUpdateCurrency } from "../interface/ICurrency";
import { PaymentMethod } from "../models/payment-method";
import { ExchangeRate } from "../models/exchange-rate";
import { Transaction } from "../models/transaction";
import { bumpVersion, getVersion } from "../utils/cache-version";
import { getCache, setCache } from "../utils/cache";

class CurrencyService {

  async createCurrency(data: ICurrency) {

    const existing = await Currency.findOne({ code: data.code });

    if (existing) {
      throw new AppError("Currency code already exists", 400);
    }

    const currency = await Currency.create({
      code: data.code.toUpperCase(),
      name: data.name,
      symbol: data.symbol
    });

    await bumpVersion("currencies:version")

    return currency;
  }

  async updateCurrency(currencyId: string, data: IUpdateCurrency) {

    const currency = await Currency.findById(currencyId);

    if (!currency) {
      throw new AppError("Currency not found", 404);
    }

    // prevent duplicate code
    if (data.code) {
      const exists = await Currency.findOne({
        code: data.code,
        _id: { $ne: currencyId }
      });

      if (exists) {
        throw new AppError("Currency code already exists", 400);
      }
    }

    const updated = await Currency.findByIdAndUpdate(
      currencyId,
      {
        $set: {
          ...data,
          code: data.code ? data.code.toUpperCase() : currency.code
        }
      },
      { new: true }
    );

    await bumpVersion("currencies:version")

    return updated;
  }

  async getAllCurrencies(query: QueryOptions) {

    const version:any = await getVersion("currencies:version")
    const cacheKey = `currencies:v${version}:${JSON.stringify(query)}`
    const cached = await getCache(cacheKey)
    if (cached) {
      console.log("Cache hit currency");
      return cached;
    }

    console.log("Cache miss currency");

    const { page, limit, skip, search, sortBy, order, isActive } = query;

    const filter: any = { isActive: isActive ?? true };

    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } }
      ];
    }

    const [currencies, total] = await Promise.all([
      Currency.find(filter)
        .sort({ [sortBy]: order === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(limit),

      Currency.countDocuments(filter)
    ]);

    const result = {
      data: currencies,
      total,
      page,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 1
    }

    await setCache(cacheKey, result, 60)

    return result;
  }

  // async getCurrencyById(currencyId: string) {

  //   const currency = await Currency.findById(currencyId);

  //   if (!currency) {
  //     throw new AppError("Currency not found", 404);
  //   }

  //   return currency;
  // }

  async softDeleteCurrency(currencyId: string) {

    const currency = await Currency.findById(currencyId);

    if (!currency) {
      throw new AppError("Currency not found", 404);
    }

    if (!currency.isActive) {
      throw new AppError("Currency already deleted", 400);
    }

    await Currency.updateOne(
      { _id: currencyId },
      { $set: { isActive: false } }
    );

    await PaymentMethod.updateMany(
      { currencyId },
      { $set: { isActive: false } }
    );

    await bumpVersion("currencies:version")

    return true;
  }

  async restoreCurrency(currencyId: string) {

    const currency = await Currency.findById(currencyId);

    if (!currency) {
      throw new AppError("Currency not found", 404);
    }

    if (currency.isActive === true) {
      throw new AppError("User is not archived", 400);
    }

    await Currency.updateOne(
      { _id: currencyId },
      { $set: { isActive: true } }
    );

    await PaymentMethod.updateMany(
      { currencyId },
      { $set: { isActive: true } }
    );

    await bumpVersion("currencies:version")

    return true;
  }

  async deleteCurrency(currencyId: string) {

  const currency = await Currency.findById(currencyId);

  if (!currency) {
    throw new AppError("Currency not found", 404);
  }

  // Check transactions
  const transactionExists = await Transaction.exists({
    $or: [
      { fromCurrencyId: currencyId },
      { toCurrencyId: currencyId }
    ]
  });

  if (transactionExists) {
    throw new AppError(
      "Cannot delete currency because it is used in transactions",
      400
    );
  }

  // Check exchange rates
  const exchangeRateExists = await ExchangeRate.exists({
    $or: [
      { fromCurrencyId: currencyId },
      { toCurrencyId: currencyId }
    ]
  });

  if (exchangeRateExists) {
    throw new AppError(
      "Cannot delete currency because it is used in exchange rates",
      400
    );
  }

  await PaymentMethod.deleteMany({ currencyId });

  await Currency.findByIdAndDelete(currencyId);

  await bumpVersion("currencies:version")

  return true;
}
}

export default CurrencyService;