import { Currency } from "../models/currency";
import { ITransaction } from "../interface/ITransaction";
import { AppError } from "../utils/app-error";
import { PaymentMethod } from "../models/payment-method";
import { Transaction } from "../models/transaction";
import { Types } from "mongoose";
import { QueryOptions } from "../utils/pagination";
import { User } from "../models/user";
import { emailQueue } from "../queues/email.queue";
import { TxStatus } from "../template/email-status";
import { ExchangeRate } from "../models/exchange-rate";
import { bumpVersion, getVersion } from "../utils/cache-version";
import { getCache, setCache } from "../utils/cache";

class TransactionService {

  private async getRateToUSD(fromCurrencyId: string): Promise<number> {
    const usd = await Currency.findOne({ code: "USD" });
    if (!usd) throw new AppError("USD not found", 500);

    if (fromCurrencyId.toString() === usd._id.toString()) {
      return 1;
    }

    // Try direct: FROM → USD
    let rate = await ExchangeRate.findOne({
      fromCurrency: fromCurrencyId,
      toCurrency: usd._id,
      isActive: true,
    });

    if (rate) return rate.sellRate;

    // Try reverse: USD → FROM
    rate = await ExchangeRate.findOne({
      fromCurrency: usd._id,
      toCurrency: fromCurrencyId,
      isActive: true,
    });

    if (rate) return 1 / rate.buyRate;

    throw new AppError("Exchange rate to USD not found", 400);
  }

  async createTransaction(data: ITransaction) {

    const fromCurrency = await Currency.findById(data.fromCurrency);
    const toCurrency = await Currency.findById(data.toCurrency);

    if (!fromCurrency || !fromCurrency.isActive) {
      throw new AppError("Invalid from currency", 400);
    }

    if (!toCurrency || !toCurrency.isActive) {
      throw new AppError("Invalid to currency", 400);
    }

    const payment = await PaymentMethod.findById(data.paymentMethod);

    if (!payment || !payment.isActive) {
      throw new AppError("Invalid payment method", 400);
    }

    if (payment.currencyId.toString() !== data.fromCurrency.toString()) {
      throw new AppError("Payment method does not match currency", 400);
    }

    // assume USD is base
    const BASE = "USD";

    let baseAmount = 0;

    // already USD
    if (fromCurrency.code === BASE) {
      baseAmount = Number((data.amount).toFixed(2));
    }

    // converting TO USD
    else if (toCurrency.code === BASE) {
      baseAmount = Number((data.convertedAmount).toFixed(2))
    }

    // neither is USD, need conversion
    else {
      // IMPORTANT need USD rate here
      const usdRate = await Currency.findOne({ code: BASE });

      if (!usdRate) {
        throw new AppError("USD base currency not found", 500);
      }

      // USD rate is necessary
      const rateToUSD = await this.getRateToUSD(fromCurrency._id.toString());// important

      baseAmount = Number((data.amount * rateToUSD).toFixed(2))
    }

    const transaction = await Transaction.create({
      ...data,
      baseCurrency: BASE,
      baseAmount,
      status: "pending",
    });

    await emailQueue.add("send-email", {
      to: transaction.receiverEmail,
      transactionId: transaction._id,
      status: transaction.status as TxStatus
    });

    await bumpVersion('transaction:version')
    await bumpVersion('transactions:version')

    return transaction;
  }

  async updateStatus(transactionId: string, status: ITransaction["status"], adminId: string) {

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      throw new AppError("Transaction not found", 404);
    }

    if (transaction.status === "completed") {
      throw new AppError("Transaction already completed", 400);
    }

    if (transaction.status === "cancelled") {
      throw new AppError("Transaction already cancelled", 400);
    }

    transaction.status = status;
    transaction.approvedBy = new Types.ObjectId(adminId);

    await transaction.save();

    await emailQueue.add("send-email", {
      to: transaction.receiverEmail,
      transactionId: transaction._id.toString(),
      status: transaction.status as TxStatus,
    });

    await bumpVersion('transaction:version')
    await bumpVersion('transactions:version')

    return transaction;
  }

  async getTransactionById(transactionId: string) {

    const version:any = await getVersion('transaction:version')
    const cacheKey = `transaction:v${version}:${transactionId}`
    const cached = await getCache(cacheKey)
    if (cached) {
      console.log("Cache hit transactionById");
      return cached;
    }

    console.log("Cache miss transactionById");

    const transaction = await Transaction.findById(transactionId).populate("fromCurrency toCurrency paymentMethod approvedBy")

    if (!transaction) {
      throw new AppError("Transaction not found", 404);
    }

    await setCache(cacheKey, transaction, 60)
    
    return transaction
  }

  async getTransactions(query: QueryOptions) {

    const version:any = await getVersion("transactions:version")
    const cacheKey = `transactions:v${version}:${JSON.stringify(query)}`
    const cached = await getCache(cacheKey)

    if (cached) {
      console.log("Cache hit transaction");
      return cached;
    }

    console.log("Cache miss transaction");

    const { page, limit, skip, search, sortBy, order, status, fromCurrency, toCurrency, paymentMethod } = query;

    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (paymentMethod) {
      const methods = await PaymentMethod.find({
        type: { $regex: paymentMethod, $options: "i" }
      }).select("_id");

      const methodIds = methods.map(m => m._id);
      filter.paymentMethod = { $in: methodIds };
    }

    if (fromCurrency) {
      const fromCurrencies = await Currency.find({
        code: { $regex: fromCurrency, $options: "i" }
      }).select("_id");

      filter.fromCurrency = { $in: fromCurrencies.map(c => c._id) };
    }

    if (toCurrency) {
      const toCurrencies = await Currency.find({
        code: { $regex: toCurrency, $options: "i" }
      }).select("_id");

      filter.toCurrency = { $in: toCurrencies.map(c => c._id) };
    }

    if (search) {
      const keyword = search;

      const currencies = await Currency.find({
        $or: [
          { code: { $regex: keyword, $options: "i" } },
          { name: { $regex: keyword, $options: "i" } }
        ]
      }).select("_id");

      const currencyIds = currencies.map(c => c._id);

      const methods = await PaymentMethod.find({
        type: { $regex: keyword, $options: "i" }
      }).select("_id");

      const methodIds = methods.map(m => m._id);

      const users = await User.find({
        name: { $regex: keyword, $options: "i" }
      }).select("_id")

      const approvedPerson = users.map(u => u._id)


      filter.$or = [
        { receiverName: { $regex: keyword, $options: "i" } },
        { fromCurrency: { $in: currencyIds } },
        { toCurrency: { $in: currencyIds } },
        { paymentMethod: { $in: methodIds } },
        { approvedBy: { $in: approvedPerson } }

      ];
    }

    const [data, total] = await Promise.all([
      Transaction.find(filter)
        .populate("fromCurrency toCurrency paymentMethod approvedBy")
        .sort({ [sortBy]: order === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(limit),

      Transaction.countDocuments(filter),
    ]);

    const result = {
      data,
      total,
      page,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 1
    }

    await setCache(cacheKey, result, 60)

    return result;
  }
}

export default TransactionService