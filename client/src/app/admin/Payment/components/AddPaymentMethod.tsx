import * as z from "zod";
import { MdClose } from "react-icons/md";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { useEffect } from "react";

import { createPaymentMethodSchema } from "../../Payment/validation/payment";
import { useAdminUploadMutation } from "../../../../slices/redux-slices/upload-photo-api";
import { useDashboardStats } from "../../Dashboard/hook/useDashboardStats";
import { usePaymentControl } from "../hook/usePyamentControl";

type FormInputs = z.infer<typeof createPaymentMethodSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  isSuperAdmin: boolean;
}

const AddPaymentMethod = ({
  open,
  onClose,
  isSuperAdmin,
}: Props) => {

  const { createPayment } = usePaymentControl();

  const [uploadImage, { isLoading: uploading }] =
    useAdminUploadMutation();

  const stats = useDashboardStats();

  const { currency } = stats;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormInputs>({
    resolver: zodResolver(createPaymentMethodSchema),
    defaultValues: {
      currencyId: "",
      accountName: "",
      accountNumber: "",
      bankProvider: "",
      qrImage: "",
    },
  });

  const currencyId = watch("currencyId");

  useEffect(() => {
    reset({
      currencyId: "",
      accountName: "",
      accountNumber: "",
      bankProvider: "",
      qrImage: "",
    });
  }, [reset]);

  if (!open || !isSuperAdmin) return null;

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file = e.target.files?.[0];

    if (!file) return;

    try {

      const formData = new FormData();

      formData.append("file", file);

      const res =
        await uploadImage(formData).unwrap();

      setValue(
        "qrImage",
        res.data
      );

      toast.success(
        "QR uploaded"
      );

    } catch {

      toast.error(
        "Failed to upload QR"
      );

    }
  };

  const onSubmit = async (
    data: FormInputs
  ) => {

    await createPayment(data);

    reset();

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">

      <div className="relative w-full max-w-lg rounded-3xl glass-panel border border-[#38476d]/30 p-8">

        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--surface-container)]"
        >
          <MdClose className="text-xl text-white" />
        </button>

        <div className="mb-8">
          <h2 className="text-3xl font-black text-white">
            Add Payment Method
          </h2>

          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Select currency and add payment details
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >

          <select
            {...register("currencyId")}
            className="w-full p-3 rounded bg-[#101e3e] text-white"
          >
            <option value="">
              Select Currency
            </option>

            {currency?.map((c: any) => (
              <option
                key={c._id}
                value={c._id}
              >
                {c.code} - {c.name}
              </option>
            ))}
          </select>

          <p className="text-red-400 text-xs">
            {errors.currencyId?.message}
          </p>

          <input
            {...register("accountName")}
            placeholder="Account Name"
            className="w-full rounded-2xl bg-[var(--surface-container)] px-4 py-3 text-white"
          />

          <input
            {...register("accountNumber")}
            placeholder="Account Number"
            className="w-full rounded-2xl bg-[var(--surface-container)] px-4 py-3 text-white"
          />

          <input
            {...register("bankProvider")}
            placeholder="Bank Provider"
            className="w-full rounded-2xl bg-[var(--surface-container)] px-4 py-3 text-white"
          />

          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full rounded-2xl bg-[var(--surface-container)] px-4 py-3 text-white"
          />

          <div className="flex justify-end gap-3 pt-4">

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl border text-white border-[#38476d]"
            >
              Cancel
            </button>

            <button
              data-testid="submit-add-payment"
              type="submit"
              disabled={
                isSubmitting ||
                uploading ||
                !currencyId
              }
              className="px-6 py-3 rounded-2xl kinetic-gradient text-black font-bold"
            >
              {uploading
                ? "Uploading..."
                : isSubmitting
                ? "Creating..."
                : "Add Payment"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default AddPaymentMethod;