import { Link } from "react-router-dom";
import StatCard from "./components/StatsCard";
import ExchangeRates from "../ExchangeRate/components/ExchangeRate";
import StatusBreakdown from "./components/StatusBreakdown";
import TopPairs from "./components/TopPairs";
import TransactionsTable, { STATUS_STYLES } from "../Transaction/components/TransactionTable";
import { useDashboardStats } from "./hook/useDashboardStats";
import { MdOutlineVisibility } from "react-icons/md";
import Currency from "../Currency/components/Currency";


const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700 ${className}`} />
);

const Dashboard = () => {
  const stats = useDashboardStats();

  if (stats.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-72 lg:col-span-2" />
          <Skeleton className="h-72" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      </div>
    );
  }

  const {
    totalUsers,
    totalTransactions,
    totalCurrency,
    totalVolume,
    pendingCount = 0,
    completeCount = 0,
    cancelCount = 0,
    processingCount = 0,
    receiveCount = 0,
    statusBreakdown,
    recentTransactions,
    topPairs,
    exchangeRates,
    currency
  } = stats;

  

  return (
    <div className="flex flex-col gap-6 p-10">

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        <StatCard
          title="Currencies"
          value={totalCurrency}
        />

        <StatCard
          title="Users"
          value={totalUsers}
        />

        <StatCard
          title="Transactions"
          value={totalTransactions}
        />

        <StatCard
          title="Volume (USD)"
          value={`$${totalVolume.toLocaleString()}`}
        />

        <StatCard
          title="Pending Transaction"
          value={pendingCount}
          highlight={pendingCount > 0}
        />

        <StatCard
          title="Received Transaction"
          value={receiveCount}
          highlight={receiveCount > 0}
        />

        <StatCard
          title="Processing Transaction"
          value={processingCount}
          highlight={processingCount > 0}
        />

        <StatCard
          title="Completed approval"
          value={completeCount}
          highlight={completeCount > 0}
        />

        <StatCard
          title="Cancelled approval"
          value={cancelCount}
          highlight={cancelCount > 0}
        />

      </div>

      {/* Main dashboard section */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* left side */}
        <div className="xl:col-span-8 flex flex-col gap-6">

          <TransactionsTable
            title="Recent Transactions"
            data={recentTransactions.slice(0, 5)}
            headerAction={
              <Link
                to="/admin/transactions"
                className="text-xs text-[var(--tertiary)] flex items-center gap-1 hover:underline"
              >
                View All
              </Link>
            }
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
                    className={`inline-block px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[t.status as keyof typeof STATUS_STYLES]
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
                    <span className="material-symbols-outlined text-sm">
                      <MdOutlineVisibility />
                    </span>
                  </Link>
                ),
              },
            ]}
          />

          {/* Bottom section */}
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">

            <TopPairs 
              topPairs={topPairs} 
            />

            <ExchangeRates 
              exchangeRates={exchangeRates.slice(0,4)} 
              dashboardMode
               headerAction={
              <Link
                to="/admin/rates"
                className="text-xs text-[var(--tertiary)] flex items-center gap-1 hover:underline"
              >
                View All
              </Link>
            }
            />

          </div>

        </div>

        {/* right side */}
        <div className="xl:col-span-4">

          <StatusBreakdown
            statusBreakdown={statusBreakdown}
          />

          <div className="pt-6">
            <Currency
            title="Currency"
            dashboardMode
            currency={currency.slice(0,4)}
            headerAction={
              <Link
                to="/admin/currencies"
                className="text-xs text-[var(--tertiary)] flex items-center gap-1 hover:underline"
              >
                View All
              </Link>
            }
          />
          </div>


        </div>

      </div>

    </div>
  );
};

export default Dashboard;