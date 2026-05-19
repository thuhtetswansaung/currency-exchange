import { useMemo } from "react";
import { useAllExchangeRate } from "../../ExchangeRate/hooks/useExchangeRate";
import { useTransaction } from "../../Transaction/hook/useTransaction";
import { useUser } from "../../User/hook/useUser";
import { useCurrency } from "../../Currency/hook/useCurrency";

export type StatusKey = "pending" | "received" | "processing" | "completed" | "cancelled";

export function useDashboardStats() {
  const { usersTotal, isLoading: usrLoading, error: usrError } = useUser();
  const { transaction = [], transactionTotal, isLoading: txLoading, error: txError } = useTransaction({
    page: 1,
    limit:0,
    skip: 0,
    sortBy: "createdAt",
    order: "desc"
  });
  const { exchangeRates = [], isLoading: exLoading } = useAllExchangeRate();
  const { currency = [], currencyTotal, isLoading: cyLoading, error: cyError } = useCurrency()

  const isLoading = usrLoading || txLoading || exLoading || cyLoading;
  const error = usrError || txError || cyError;

  const defaultStatusBreakdown: Record<StatusKey, number> = {
    pending: 0,
    received: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
  };

  return useMemo(() => {
    if (isLoading) {
      return {
        isLoading: true,
        totalUsers: 0,
        totalTransactions: 0,
        totalCurrency: 0,
        totalVolume: 0,
        statusBreakdown: defaultStatusBreakdown,
        recentTransactions: [],
        topPairs: [],
        exchangeRates: [],
        currency: []
      };
    }

    const totalVolume = Number(
      transaction.reduce((acc, t) => acc + (t?.baseAmount || 0), 0).toFixed(2)
    );

    const statusBreakdown = transaction.reduce<Record<StatusKey, number>>(
      (acc, t) => {
        const s = t.status as StatusKey;
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      },
      { ...defaultStatusBreakdown }
    );

    const recentTransactions = [...transaction]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);

    const pairVolume: Record<string, number> = {};
    for (const t of transaction) {
      const key = `${(t.fromCurrency as any)?.code ?? "?"} → ${(t.toCurrency as any)?.code ?? "?"}`;
      pairVolume[key] = (pairVolume[key] || 0) + (t.baseAmount || 0);
    }
    const topPairs = Object.entries(pairVolume)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pair, volume]) => ({ pair, volume: Number(volume.toFixed(2)) }));

    const pendingCount = statusBreakdown.pending;
    const completeCount = statusBreakdown.completed;
    const cancelCount = statusBreakdown.cancelled;
    const processingCount = statusBreakdown.processing;
    const receiveCount = statusBreakdown.received;

    return {
      isLoading: false,
      totalUsers: usersTotal,
      totalTransactions: transactionTotal,
      totalCurrency: currencyTotal,
      totalVolume,
      statusBreakdown,
      recentTransactions,
      topPairs,
      exchangeRates,
      currency,
      pendingCount,
      error,
      completeCount,
      cancelCount,
      processingCount,
      receiveCount
    };
  }, [transaction, currency, currencyTotal, usersTotal, transactionTotal, exchangeRates, isLoading, error]);
}