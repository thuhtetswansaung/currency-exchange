import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdArrowBack, MdOutlineVisibility, MdSearch } from "react-icons/md";
import TransactionsTable, { STATUS_STYLES } from "./components/TransactionTable";
import { useTransaction } from "./hook/useTransaction";
import useDebounce from "../../../hooks/useDebounce";

const Transaction = () => {

  const [page, setPage] = useState(1);
  const navigate = useNavigate()
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("");

  const [fromCurrency, _setFromCurrency] = useState("");

  const debounce = useDebounce(search)

  const limit = 10;

  const { transaction, transactionPagination, isLoading } = useTransaction({
    page,
    limit,
    skip: (page - 1) * limit,

    sortBy: "createdAt",
    order: "desc",

    search: debounce,
    status: status || undefined,
    fromCurrency: fromCurrency || undefined,
  });

  if (isLoading) {
    return (
      <div className="text-[var(--text-primary)]">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-10">

      <button
        onClick={() => navigate('/admin/dashboard')}
        className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
      >
        <MdArrowBack className="text-lg" />
        Back
      </button>

      <div className="glass-panel rounded-xl p-5 border border-[var(--outline-variant)]/10">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Search */}
          <div className="relative">

            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-lg" />

            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--surface-container)] border border-[var(--outline-variant)]/10 text-[var(--text-primary)] outline-none"
            />

          </div>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="px-4 py-3 rounded-xl bg-[var(--surface-container)] border border-[var(--outline-variant)]/10 text-[var(--text-primary)] outline-none"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="received">Received</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

        </div>

      </div>

      {/* Table */}
      <TransactionsTable
        title="All Transactions"
        data={transaction}
        columns={[
          {
            header: "Pair",
            render: (t) => (
              <span className="font-medium text-[var(--text-primary)]">
                {t.fromCurrency?.code} → {t.toCurrency?.code}
              </span>
            ),
          },
          {
            header: "Amount",
            render: (t) => (
              <span className="text-[var(--text-secondary)]">
                {t.fromCurrency?.symbol}
                {t.amount?.toLocaleString()}
              </span>
            ),
          },
          {
            header: "Converted",
            render: (t) => (
              <span className="text-[var(--text-secondary)]">
                {t.toCurrency?.symbol}
                {t.convertedAmount?.toLocaleString()}
              </span>
            ),
          },
          {
            header: "Status",
            render: (t) => (
              <span
                className={`inline-block px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[t.status]
                  }`}
              >
                {t.status}
              </span>
            ),
          },
          {
            header: "User IP",
            render: (t) => (
              <span className="text-xs text-[var(--text-secondary)]">
                {t.userIP || "-"}
              </span>
            ),
          },
          {
            header: "Approved By",
            render: (t) => (
              <span className="text-xs text-[var(--text-secondary)]">
                {t.approvedBy?.name || "-"}
              </span>
            ),
          },
          {
            header: "Action",
            render: (t) => (
              <Link
                to={`/admin/transactions/${t._id}`}
                className="w-8 h-8 rounded-lg bg-[var(--surface-bright)] flex items-center justify-center text-[var(--secondary)] hover:bg-[var(--secondary)] hover:text-black transition-all"
              >
                <MdOutlineVisibility size={18} />
              </Link>
            ),
          },
        ]}
      />

      {/* pagination */}
      <div className="flex items-center justify-between">

        <p className="text-sm text-[var(--text-secondary)]">
          Page {transactionPagination?.page} of{" "}
          {transactionPagination?.totalPages}
        </p>

        <div className="flex gap-3">

          <button
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
            className="px-4 py-2 rounded-lg bg-[var(--surface-container)] text-[var(--text-primary)] disabled:opacity-40"
          >
            Previous
          </button>

          <button
            disabled={
              page === transactionPagination?.totalPages
            }
            onClick={() => setPage((prev) => prev + 1)}
            className="px-4 py-2 rounded-lg bg-[var(--secondary)] text-black font-medium disabled:opacity-40"
          >
            Next
          </button>

        </div>

      </div>

    </div>
  );
};

export default Transaction;