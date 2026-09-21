"use server";

import { httpClient } from "@/lib/axios/httpClient";
import {
  type IWalletHolder,
  type IWalletStatement,
  type IWalletSummary,
} from "@/types/wallet.types";

/** Read-only by design: see wallet.types.ts for why there is nothing to write. */

export const getWalletSummary = async () => {
  return await httpClient.get<IWalletSummary>("/wallet/summary");
};

/** Every customer in credit, largest balance first. Unpaginated. */
export const getWalletHolders = async () => {
  return await httpClient.get<IWalletHolder[]>("/wallet");
};

export const getWalletStatement = async (customerId: string) => {
  return await httpClient.get<IWalletStatement>(`/wallet/${customerId}`);
};
