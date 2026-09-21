"use client";

import { useQuery } from "@tanstack/react-query";
import { getWalletStatement } from "@/services/wallet.services";

/**
 * What a customer has left of what they paid in.
 *
 * Shares its key with the wallet statement sheet, so opening a payment form
 * and then the statement is one request, not two. Only fetched while `active`
 * — a closed dialog has no reason to ask.
 */
export const useWalletBalance = (customerId: string | undefined, active: boolean) => {
  const { data, isLoading } = useQuery({
    queryKey: ["wallet-statement", customerId],
    queryFn: () => getWalletStatement(customerId!),
    enabled: active && Boolean(customerId),
  });

  return { balance: data?.data.balance ?? 0, isLoading };
};
