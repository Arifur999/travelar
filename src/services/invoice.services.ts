"use server";

import { httpClient } from "@/lib/axios/httpClient";
import { type InvoiceKind } from "@/types/invoice.types";

/** Where each module serves its invoice on the API. */
const INVOICE_PATHS: Record<InvoiceKind, (id: string) => string> = {
  ticket: (id) => `/ticketing/${id}/invoice`,
  visa: (id) => `/visa/${id}/invoice`,
  hajj: (id) => `/hajj/bookings/${id}/invoice`,
};

export const getInvoicePdf = async (kind: InvoiceKind, id: string) => {
  return await httpClient.getFile(INVOICE_PATHS[kind](id));
};
