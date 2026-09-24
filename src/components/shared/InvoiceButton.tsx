import { RiFileTextLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { type InvoiceKind } from "@/types/invoice.types";

interface InvoiceButtonProps {
  kind: InvoiceKind;
  id: string;
}

/**
 * Opens the record's PDF invoice in a new tab, where the browser's viewer can
 * print or save it. A plain link to the route handler, not a fetch-and-blob
 * download: the session cookies ride along on their own, and nothing has to be
 * held in memory on the page.
 */
const InvoiceButton = ({ kind, id }: InvoiceButtonProps) => (
  <Button asChild size="sm" variant="outline">
    <a href={`/dashboard/invoices/${kind}/${id}`} target="_blank" rel="noopener noreferrer">
      <RiFileTextLine className="size-4" aria-hidden="true" />
      Invoice
    </a>
  </Button>
);

export default InvoiceButton;
