import * as z from "zod";
import { MdClose } from "react-icons/md";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createExchangeRateSchema } from "../validation/ExchangeRate";
import { useCreateExchangeRateMutation } from "../../../../slices/redux-slices/exchange-rate-api";
import { toast } from "react-toastify";
import { useCurrency } from "../../Currency/hook/useCurrency";

type FormInputs = z.infer<typeof createExchangeRateSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  isSuperAdmin: boolean;
}

const USD_ID = import.meta.env.VITE_USD_ID; // Fixed Base Currency

const AddExchangeRate = ({ open, onClose, isSuperAdmin }: Props) => {
  const [createExchangeRate, { isLoading }] = useCreateExchangeRateMutation();

  const { currency } = useCurrency({
    page: 1,
    limit: 100,
    skip: 0,
    sortBy: "code",
    order: "asc",
  });

  const activeCurrencies = currency?.filter((c) => c.isActive) || [];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormInputs>({
    resolver: zodResolver(createExchangeRateSchema),
    defaultValues: {
      fromCurrency: USD_ID,
    },
  });

  // force USD always
  useEffect(() => {
    setValue("fromCurrency", USD_ID);
  }, [setValue]);

  if (!open || !isSuperAdmin) return null;

  const onSubmit = async (data: FormInputs) => {
    try {
      await createExchangeRate(data).unwrap();
      toast.success("Exchange rate created");
      reset();
      setValue("fromCurrency", USD_ID);
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create exchange rate");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel border border-[#38476d]/30 p-8">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--surface-container)]"
        >
          <MdClose className="text-xl text-white" />
        </button>

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-black text-white">
            Add Exchange Rate
          </h2>

          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            USD is the base currency (fixed).
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Fixed USD */}
          <div>
            <div className="w-full rounded-2xl bg-[var(--surface-container)] border border-[#38476d]/20 px-4 py-3 text-white">
              USD (Base Currency)
            </div>

            <input
              type="hidden"
              {...register("fromCurrency")}
              value={USD_ID}
            />
          </div>

          {/* To */}
          <div>
            <select
              {...register("toCurrency")}
              className="w-full rounded-2xl bg-[var(--surface-container)] border border-[#38476d]/20 px-4 py-3 text-white outline-none"
            >
              <option value="">Select To Currency</option>

              {activeCurrencies
                .filter((c) => c._id !== USD_ID)
                .map((c: any) => (
                  <option key={c._id} value={c._id}>
                    {c.code} - {c.name}
                  </option>
                ))}
            </select>

            <p className="text-red-400 text-xs mt-1">
              {errors.toCurrency?.message}
            </p>
          </div>

          {/* Buy Rate */}
          <div>
            <input
              type="number"
              step="0.0001"
              {...register("buyRate", { valueAsNumber: true })}
              placeholder="Buy Rate"
              className="w-full rounded-2xl bg-[var(--surface-container)] border border-[#38476d]/20 px-4 py-3 text-white"
            />
            <p className="text-red-400 text-xs mt-1">
              {errors.buyRate?.message}
            </p>
          </div>

          {/* Sell Rate */}
          <div>
            <input
              type="number"
              step="0.0001"
              {...register("sellRate", { valueAsNumber: true })}
              placeholder="Sell Rate"
              className="w-full rounded-2xl bg-[var(--surface-container)] border border-[#38476d]/20 px-4 py-3 text-white"
            />
            <p className="text-red-400 text-xs mt-1">
              {errors.sellRate?.message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl border text-white border-[#38476d]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 rounded-2xl kinetic-gradient text-black font-bold"
            >
              {isLoading ? "Creating..." : "Add Exchange Rate"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddExchangeRate;