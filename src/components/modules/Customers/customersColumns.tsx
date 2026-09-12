import MoneyCell from "@/components/shared/cell/MoneyCell";
import PersonCell from "@/components/shared/cell/PersonCell";
import { type AppColumnDef } from "@/lib/table/features";
import { type ICustomer } from "@/types/customer.types";

export const customersColumns: AppColumnDef<ICustomer>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Customer",
    cell: ({ row }) => (
      <PersonCell name={row.original.name} secondary={row.original.phone} />
    ),
  },
  {
    id: "passportNo",
    accessorKey: "passportNo",
    header: "Passport",
    cell: ({ row }) => (
      <span className="font-mono text-sm whitespace-nowrap">
        {row.original.passportNo || "—"}
      </span>
    ),
  },
  {
    id: "openingDue",
    header: "Opening",
    // Derived in the service, so there is no SQL column to sort on.
    enableSorting: false,
    cell: ({ row }) => (
      <MoneyCell value={row.original.openingDue} className="text-muted-foreground" />
    ),
  },
  {
    id: "totalPurchase",
    header: "Billed",
    enableSorting: false,
    cell: ({ row }) => <MoneyCell value={row.original.totalPurchase} />,
  },
  {
    id: "collectionsAmount",
    header: "Collected",
    enableSorting: false,
    cell: ({ row }) => (
      <MoneyCell value={row.original.collectionsAmount} className="text-success" />
    ),
  },
  {
    id: "totalDiscount",
    header: "Discount",
    enableSorting: false,
    cell: ({ row }) => (
      <MoneyCell value={row.original.totalDiscount} className="text-muted-foreground" />
    ),
  },
  {
    id: "currentDue",
    header: "Due",
    enableSorting: false,
    // `invert` because a rising due is bad news: it paints an outstanding
    // balance red and a credit (negative — the customer has overpaid) green.
    cell: ({ row }) => <MoneyCell value={row.original.currentDue} signed invert />,
  },
];
