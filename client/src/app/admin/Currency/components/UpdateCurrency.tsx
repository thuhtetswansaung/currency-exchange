import { MdClose } from "react-icons/md";
import { useEffect, useState } from "react";
import WarningText from "../../../../constant/ui/WarningText";
import * as z from "zod";
import { updateCurrencySchema } from "../validation/currency";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Currency } from "../../../../slices/interfaces/currency";

interface Props {
  open: boolean;
  currency: Currency;
  loading?: boolean;
  onClose: () => void;
  onEdit?: (id: string, data: any) => Promise<void>;
}

type FormInputs = z.infer<typeof updateCurrencySchema>;

const CurrencyUpdateModal = ({
  open,
  currency,
  loading = false,
  onClose,
  onEdit,
}: Props) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<FormInputs | null>(null);

  const { register, handleSubmit, formState: { errors, isDirty, isSubmitting }, reset } = useForm<FormInputs>({
    resolver: zodResolver(updateCurrencySchema),
    defaultValues: {
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
    },
  });

  useEffect(() => {
    if (currency) {
      reset({
        code: currency.code || "",
        name: currency.name || "",
        symbol: currency.symbol || "",
      });
    }
  }, [currency, reset]);

  if (!open || !currency) return null;

  const onSubmit = (data: FormInputs) => {
    setPendingData(data);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!pendingData || !onEdit) return;

    await onEdit(currency._id, pendingData);

    setConfirmOpen(false);
    setPendingData(null);
    onClose();
  };

  return (
    <>
      {/* Modal */}
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
              Update Currency
            </h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Edit currency information.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            <div>
              <input
                {...register("code")}
                placeholder="Currency Code"
                className="w-full rounded-2xl bg-[var(--surface-container)] border border-[#38476d]/20 px-4 py-3 text-white outline-none"
              />
              {errors.code && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.code.message}
                </p>
              )}
            </div>

            <div>
              <input
                {...register("name")}
                placeholder="Currency Name"
                className="w-full rounded-2xl bg-[var(--surface-container)] border border-[#38476d]/20 px-4 py-3 text-white outline-none"
              />
              {errors.name && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <input
                {...register("symbol")}
                placeholder="Symbol"
                className="w-full rounded-2xl bg-[var(--surface-container)] border border-[#38476d]/20 px-4 py-3 text-white outline-none"
              />
              {errors.symbol && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.symbol.message}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-2xl border border-[#38476d] text-[var(--text-secondary)]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!isDirty || isSubmitting || loading}
                className="px-6 py-3 rounded-2xl kinetic-gradient text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Currency
              </button>

            </div>
          </form>
        </div>
      </div>

      {/* CONFIRMATION */}
      <WarningText
        open={confirmOpen}
        title="Update Currency"
        message="Are you sure you want to update this currency?"
        confirmText="Yes"
        confirmVariant="success"
        onCancel={() => {
          setConfirmOpen(false);
          setPendingData(null);
        }}
        onConfirm={handleConfirm}
      />
    </>
  );
};

export default CurrencyUpdateModal;