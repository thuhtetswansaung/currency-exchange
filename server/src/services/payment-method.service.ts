import { PaymentMethod } from "../models/payment-method";
import { IPaymentMethod, IUpdatePaymentMethod } from "../interface/IPaymentMethod";
import { Currency } from "../models/currency";
import { AppError } from "../utils/app-error";
import { QueryOptions } from "../utils/pagination";
import { bumpVersion, getVersion } from "../utils/cache-version";
import { getCache, setCache } from "../utils/cache";

class PaymentService {
  // CREATE
  async create(data: IPaymentMethod) {
    const existing = await PaymentMethod.findOne({
      currencyId: data.currencyId,
    });

    if (existing) {
      throw new AppError("Payment method already exists for this currency", 409);
    }

    const paymentMethod = await PaymentMethod.create(data);

    await bumpVersion('payments:version')
    await bumpVersion("currencies:version")
    return paymentMethod;
  }

  // GET BY CURRENCY
  async getPaymentByCurrency(currencyId: string) {

    const version:any = await getVersion('currencies:version')
    const cacheKey = `currencies:v${version}:${currencyId}`
    const cached = await getCache(cacheKey)
    if (cached) {
      console.log("Cache hit getPaymentByCurrency");
      return cached;
    }

    console.log("Cache miss getPaymentByCurrency");


    const existingCurrency = await Currency.findById(currencyId);

    if (!existingCurrency) {
      throw new AppError("No Currency found", 404);
    }

    const payment = await PaymentMethod.find({ currencyId: currencyId }).populate(
      "currencyId",
      "code name"
    );

    await setCache(cacheKey, payment, 60)

    return payment;
  }

  // GET BY ID
  async getPaymentById(paymentId: string) {

    const version:any = await getVersion('payments:version')
    const cacheKey = `payments:v${version}:${paymentId}`
    const cached = await getCache(cacheKey)

    if (cached) {
      console.log("Cache hit getPaymentById");
      return cached;
    }

    console.log("Cache miss getPaymentById");

    const payment = await PaymentMethod.findById(paymentId).populate(
      "currencyId",
      "code name"
    );

    if (!payment) {
      throw new AppError("No Payment Method found", 404);
    }

    await setCache(cacheKey, payment, 60)

    return payment;
  }

  // UPDATE
  async updatePaymentById(paymentId: string, data: IUpdatePaymentMethod) {
    const existingPayment = await PaymentMethod.findById(paymentId);

    if (!existingPayment) {
      throw new AppError("No Payment Method found", 404);
    }

    const updatedPayment = await PaymentMethod.findByIdAndUpdate(
      paymentId,
      { $set: data },
      { new: true }
    ).populate("currencyId", "code name");

    await bumpVersion('payments:version')
    await bumpVersion("currencies:version")

    return updatedPayment;
  }

  // GET ALL WITH PAGINATION + SEARCH
  async getAll(query: QueryOptions) {

    const version:any = await getVersion('payments:version')
    const cacheKey = `payments:v${version}:${JSON.stringify(query)}`
    const cached = await getCache(cacheKey)

    if (cached) {
      console.log("Cache hit getAllPayment");
      return cached;
    }

    console.log("Cache miss getAllPayment");

    const { page, limit, skip, search, sortBy, order, isActive } = query;

    const filter: any = {isActive: isActive ?? true};

    if (search) {
      const currencies = await Currency.find({
        code: { $regex: search, $options: "i" },
      }).select("_id");

      filter.currencyId = {
        $in: currencies.map((c) => c._id),
      };
    }

    const total = await PaymentMethod.countDocuments(filter);

    const data = await PaymentMethod.find(filter)
      .populate("currencyId", "code name")
      .sort({ [sortBy]: order === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limit);

    const result = {
      data,
      total,
      page,
      totalPages: limit === 0 ? 1 : Math.ceil(total / limit),
    }

    await setCache(cacheKey, result, 60)

    return result;
  }
}

export default PaymentService;