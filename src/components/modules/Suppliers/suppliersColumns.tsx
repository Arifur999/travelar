import MoneyCell from "@/components/shared/cell/MoneyCell";
import PersonCell from "@/components/shared/cell/PersonCell";
import { type AppColumnDef } from "@/lib/table/features";
import { type ISupplier } from "@/types/supplier.types";

export const suppliersColumns: AppColumnDef<ISupplier>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Supplier",
    cell: ({ row }) => (
      <PersonCell
        name={row.original.name}
        secondary={row.original.contactName ?? row.original.phone}
        showAvatar={false}
      />
    ),
  },
  {
    id: "phone",
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <span className="text-sm whitespace-nowrap">{row.original.phone || "—"}</span>
    ),
  },
  {
    id: "openingPayable",
    header: "Opening",
    // Derived in the service, not a sortable column — QueryBuilder sorts in SQL
    // and this figure does not exist there.
    enableSorting: false,
    cell: ({ row }) => (
      <MoneyCell value={row.original.openingPayable} className="text-muted-foreground" />
    ),
  },
  {
    id: "totalPurchase",
    header: "Purchased",
    enableSorting: false,
    cell: ({ row }) => <MoneyCell value={row.original.totalPurchase} />,
  },
  {
    id: "totalPaid",
    header: "Paid",
    enableSorting: false,
    cell: ({ row }) => <MoneyCell value={row.original.totalPaid} className="text-success" />,
  },
  {
    id: "currentPayable",
    header: "Owed",
    enableSorting: false,
    // Higher is worse here, so `invert` paints a rising payable red and an
    // advance (negative — money sitting with the supplier) green.
    cell: ({ row }) => <MoneyCell value={row.original.currentPayable} signed invert />,
  },
];
