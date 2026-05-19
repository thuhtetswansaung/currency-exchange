import type React from "react";
import { MdEdit, MdArrowForward } from "react-icons/md";
import { useState } from "react";
import UpdateExchangeRate from "../../ExchangeRate/components/UpdateExchangeRate";
import type { ExchangeRate } from "../../../../slices/interfaces/exchange-rate";

interface Props {
  exchangeRates: ExchangeRate[];
  headerAction?: React.ReactNode;
  dashboardMode?: boolean;
  showActions?: boolean;
  isSuperAdmin?: boolean;
  onEdit?: (id: string, data: any) => Promise<void>;
  isArchive?: boolean
}

const ExchangeRates = ({
  exchangeRates,
  headerAction,
  dashboardMode = false,
  showActions = false,
  isSuperAdmin = false,
  onEdit,
  isArchive
}: Props) => {

  const [selectedExchangeRate, setSelectedExchangeRate] = useState<any>(null);

  const [loading] = useState(false);

  return (
    <>
      <div className="w-full max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8 px-1">

          <div>
            <h1
              className={`font-black tracking-tight text-[var(--primary)] ${dashboardMode ? "text-2xl" : "text-4xl"
                }`}
            >
              Live Exchange Rates
            </h1>

            {!dashboardMode && (
              <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-xl">
                Monitor and manage all active currency pairs in real time.
              </p>
            )}
          </div>

          <div>{headerAction}</div>

        </div>

        {!exchangeRates?.length ? (

          <div className="glass-panel border border-[#38476d] rounded-3xl py-20 text-center text-[var(--text-secondary)]">
            No exchange rates found
          </div>

        ) : (

          <div
            className={`grid gap-6 ${dashboardMode
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              }`}
          >

            {exchangeRates.map((r: any) => (

              <div
                key={r._id}
                className="group relative overflow-hidden rounded-3xl glass-panel border border-[#38476d]/40 p-6 transition-all duration-300 hover:border-[#c3c0ff]/60 hover:-translate-y-1"
              >

                <div className="relative z-10">

                  <div className="mb-6">

                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-3">
                      Currency Pair
                    </p>

                    <div className="flex items-center gap-3">

                      <h2 className="font-black text-4xl text-white">
                        {r.fromCurrency?.code}
                      </h2>

                      <MdArrowForward color="var(--secondary)" />

                      <h2 className="font-black text-4xl text-white">
                        {r.toCurrency?.code}
                      </h2>

                    </div>



                  </div>

                  <div className="grid grid-cols-2 gap-4">

                    <div className="rounded-2xl bg-[var(--surface-bright)] border border-[#38476d] p-4">
                      <p className="text-[10px] uppercase text-[#8affec] font-bold">
                        Buy
                      </p>

                      <h3 className="mt-2 text-xl font-black text-white">
                        {r.buyRate}
                      </h3>
                    </div>

                    <div className="rounded-2xl bg-[var(--surface-bright)] border border-[#38476d] p-4">
                      <p className="text-[10px] uppercase text-[#ff716c] font-bold">
                        Sell
                      </p>

                      <h3 className="mt-2 text-xl font-black text-white">
                        {r.sellRate}
                      </h3>
                    </div>

                    <span className="col-span-2 text-sm text-[var(--text-secondary)]">
                      Updated:{" "}
                      {new Date(r.updatedAt).toLocaleString("en-TH", {
                        timeZone: "Asia/Bangkok",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>

                  </div>

                  {showActions && (

                    <div className="mt-6">

                      {
                        !isArchive && (
                          <button
                            disabled={!isSuperAdmin}
                            onClick={() =>
                              setSelectedExchangeRate(r)
                            }
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#645efb]/30 text-[#c3c0ff] bg-[#645efb]/5 hover:bg-[#645efb]/15 transition disabled:opacity-40"
                          >
                            <MdEdit size={16} />
                            Edit
                          </button>
                        )
                      }

                    </div>

                  )}

                </div>

              </div>

            ))}

          </div>

        )}
      </div>

      <UpdateExchangeRate
        open={!!selectedExchangeRate}
        exchangeRate={selectedExchangeRate}
        loading={loading}
        onClose={() =>
          setSelectedExchangeRate(null)
        }
        onEdit={onEdit}
      />
    </>
  );
};

export default ExchangeRates;