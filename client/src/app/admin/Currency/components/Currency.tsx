import type React from "react";
import { MdEdit, MdDelete, MdArchive, MdRestore } from "react-icons/md";

import { useState } from "react";

import WarningText from "../../../../constant/ui/WarningText";
import CurrencyUpdateModal from "./UpdateCurrency";
import type { ICreateAndUpdateCurrency } from "../../../../slices/interfaces/currency";

interface Props {
  currency: any[];
  headerAction?: React.ReactNode;
  showActions?: boolean;
  isSuperAdmin?: boolean;
  dashboardMode?: boolean;
  tab?: "active" | "archived";
  onEdit?: (id: string, data: ICreateAndUpdateCurrency) => Promise<void>;
  onDelete?: (id: string) => void;
  onToggle?: (id: string, isActive: boolean) => void;

  title?: string;
}

const Currency = ({
  currency,
  headerAction,
  showActions = false,
  isSuperAdmin = false,
  dashboardMode = false,
  tab = "active",
  onEdit,
  onDelete,
  onToggle,
  title,
}: Props) => {
  const [selectedCurrency, setSelectedCurrency] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [toggleTarget, setToggleTarget] = useState<{
    id: string;
    isActive: boolean;
  } | null>(null);

  const [loading] = useState(false);

  return (
    <>
      <div className="w-full max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8 px-1">
          <div>
            <h1
              className={`font-black tracking-tight text-[var(--primary)]
              ${dashboardMode ? "text-2xl" : "text-4xl"}`}
            >
              {title}
            </h1>
          </div>

          <div>{headerAction}</div>
        </div>

        {/* Empty */}
        {!currency?.length ? (
          <div className="glass-panel border border-[#38476d] rounded-3xl py-20 text-center text-[var(--text-secondary)]">
            No currencies found
          </div>
        ) : (
          <div
            className={`grid gap-6
            ${dashboardMode
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              }`}
          >
            {currency.map((c: any) => (
              <div
                key={c._id}
                className="group relative overflow-hidden rounded-3xl glass-panel border border-[#38476d]/40 p-6 transition-all duration-300 hover:border-[#c3c0ff]/60 hover:-translate-y-1"
              >
                {/* glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition">
                  <div className="absolute -top-20 -right-20 w-44 h-44 bg-[#645efb]/20 blur-3xl rounded-full" />
                </div>

                {/* status */}
                <div className="absolute top-5 right-5">
                  <div
                    className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px]
                    ${c.isActive
                        ? "border-[#8affec]/20 bg-[#8affec]/10 text-[#8affec]"
                        : "border-[#ff716c]/20 bg-[#ff716c]/10 text-[#ff716c]"
                      }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${c.isActive ? "bg-[#8affec]" : "bg-[#ff716c]"
                        }`}
                    />
                    {c.isActive ? "Active" : "Archived"}
                  </div>
                </div>

                {/* content */}
                <div className="relative z-10">
                  <div
                    className={`rounded-2xl bg-[var(--surface-bright)] border border-[#38476d] flex items-center justify-center mb-6
                    ${dashboardMode ? "w-12 h-12 text-xl" : "w-14 h-14 text-2xl"}`}
                  >
                    <span className="font-black text-[var(--secondary)]">
                      {c.symbol}
                    </span>
                  </div>

                  <h2
                    className={`font-black tracking-tight text-white
                    ${dashboardMode ? "text-3xl" : "text-4xl"}`}
                  >
                    {c.code}
                  </h2>

                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {c.name}
                  </p>

                  {/* Actions */}
                  {showActions && (
                    <div className="mt-6 grid grid-cols-2 gap-2">
                      {tab === "active" ? (
                        <>
                          {/* Edit */}
                          <button
                            disabled={!isSuperAdmin}
                            onClick={() => setSelectedCurrency(c)}
                            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#645efb]/30 text-[#c3c0ff] text-xs font-semibold"
                          >
                            <MdEdit size={14} /> Edit
                          </button>

                          {/* Archive */}
                          <button
                            disabled={!isSuperAdmin}
                            onClick={() => setToggleTarget({ id: c._id, isActive: true })}
                            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#8affec]/20 text-[#8affec] text-xs font-semibold"
                          >
                            <MdArchive size={14} /> Archive
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Restore */}
                          <button
                            disabled={!isSuperAdmin}
                            onClick={() => setToggleTarget({ id: c._id, isActive: false })}
                            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#8affec]/20 text-[#8affec] text-xs font-semibold"
                          >
                            <MdRestore size={14} /> Restore
                          </button>

                          {/* Permanent Delete */}
                          <button
                            disabled={!isSuperAdmin}
                            onClick={() => setDeleteTarget(c._id)}
                            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#ff716c]/20 text-[#ff716c] text-xs font-semibold"
                          >
                            <MdDelete size={14} /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Update */}
      {selectedCurrency && (
        <CurrencyUpdateModal
          open={!!selectedCurrency}
          currency={selectedCurrency}
          loading={loading}
          onClose={() => setSelectedCurrency(null)}
          onEdit={onEdit}
        />
      )}

      <WarningText
        open={!!deleteTarget}
        title="Delete Currency"
        message="Are you sure?"
        confirmText="Delete"
        confirmVariant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDelete?.(deleteTarget);
            setDeleteTarget(null);
          }
        }}
      />

      <WarningText
        open={!!toggleTarget}
        title={toggleTarget?.isActive ? "Archive Currency" : "Restore Currency"}
        message={toggleTarget?.isActive ? "Archive currency?" : "Restore currency?"}
        confirmText={toggleTarget?.isActive ? "Archive" : "Restore"}
        confirmVariant={toggleTarget?.isActive ? "danger" : "success"}
        onCancel={() => setToggleTarget(null)}
        onConfirm={() => {
          if (toggleTarget) {
            onToggle?.(toggleTarget.id, toggleTarget.isActive);
            setToggleTarget(null);
          }
        }}
      />
    </>
  );
};

export default Currency;