import { getActionErrorMessage } from "@/lib/actionError";
import { getInvoicePdf } from "@/services/invoice.services";
import { type InvoiceKind } from "@/types/invoice.types";

/**
 * GET /dashboard/invoices/:kind/:id — the PDF invoice for a ticket, visa case
 * or Hajj booking.
 *
 * A route handler rather than a page because the answer is a file. The browser
 * never talks to the API, so this streams the API's PDF through with the
 * user's session. It sits under /dashboard on purpose: proxy.ts already guards
 * that prefix, so a signed-out visitor is sent to /login and a platform admin
 * to their own console before this runs. Which agency may see which invoice,
 * and whether the plan includes the module, is still decided by the API.
 */

const KINDS: readonly InvoiceKind[] = ["ticket", "visa", "hajj"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const textResponse = (status: number, message: string) =>
  new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });

export async function GET(_request: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;

  // Both segments end up in the API path, so only known values pass.
  if (!KINDS.includes(kind as InvoiceKind) || !UUID.test(id)) {
    return textResponse(404, "Invoice not found.");
  }

  try {
    const file = await getInvoicePdf(kind as InvoiceKind, id);

    return new Response(file.data, {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": file.contentDisposition ?? `inline; filename="invoice-${id}.pdf"`,
        // Balances change the moment a payment is recorded.
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error: unknown) {
    const status =
      typeof error === "object" && error !== null && "response" in error
        ? Number((error as { response?: { status?: number } }).response?.status) || 502
        : 502;

    return textResponse(status, getActionErrorMessage(error, "The invoice could not be generated. Please try again."));
  }
}
