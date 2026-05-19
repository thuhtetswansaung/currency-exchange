import * as z from "zod";
import { createUserSchema } from "../validation/user";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import WarningText from "../../../../constant/ui/WarningText";
import { MdClose } from "react-icons/md";

type FormInputs = z.infer<typeof createUserSchema>;

interface Props {
    open: boolean;
    loading?: boolean;
    onClose: () => void;
    onSubmit?: (data: FormInputs) => Promise<void>;
}

const AddUser = ({
    open,
    loading,
    onClose,
    onSubmit,
}: Props) => {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingData, setPendingData] = useState<FormInputs | null>(null);

    const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<FormInputs>({
        resolver: zodResolver(createUserSchema),
    });

    const submitHandler = (data: FormInputs) => {
        setPendingData(data);
        setConfirmOpen(true);
    };

    const handleConfirm = async () => {
        if (!pendingData || !onSubmit) return;

        await onSubmit(pendingData);

        reset();

        setPendingData(null);
        setConfirmOpen(false);
        onClose();
    };

    if (!open) return null;

    return (
        <>
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
                            Add User
                        </h2>

                        <p className="mt-2 text-sm text-[var(--text-secondary)]">
                            Create a new user account.
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit(submitHandler)}
                        className="space-y-5"
                    >
                        {/* Name */}
                        <div>
                            <input
                                {...register("name")}
                                placeholder="User Name"
                                className="w-full rounded-2xl bg-[var(--surface-container)] border border-[#38476d]/20 px-4 py-3 text-white outline-none"
                            />

                            {errors.name && (
                                <p className="text-red-400 text-xs mt-1">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <input
                                {...register("email")}
                                placeholder="User Email"
                                className="w-full rounded-2xl bg-[var(--surface-container)] border border-[#38476d]/20 px-4 py-3 text-white outline-none"
                            />

                            {errors.email && (
                                <p className="text-red-400 text-xs mt-1">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <input
                                type="password"
                                {...register("password")}
                                placeholder="Password"
                                className="w-full rounded-2xl bg-[var(--surface-container)] border border-[#38476d]/20 px-4 py-3 text-white outline-none"
                            />

                            {errors.password && (
                                <p className="text-red-400 text-xs mt-1">
                                    {errors.password.message}
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
                                disabled={
                                    !isDirty ||
                                    isSubmitting ||
                                    loading
                                }
                                className="px-6 py-3 rounded-2xl kinetic-gradient text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Create User
                            </button>

                        </div>
                    </form>
                </div>
            </div>

            <WarningText
                open={confirmOpen}
                title="Add User"
                message="Are you sure you want to create this user?"
                confirmText="Create"
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

export default AddUser;