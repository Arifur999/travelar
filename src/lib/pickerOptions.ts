import { type SearchableSelectOption } from "@/components/shared/form/SearchableSelect";
import { formatCurrency } from "@/lib/format";

/**
 * What each searchable picker shows and matches, defined once so every form
 * that picks a customer finds them the same way.
 *
 * Plain functions over plain rows — no React — so they have unit tests.
 */

const present = (value: string | null | undefined): value is string =>
  typeof value === "string" && value.trim() !== "";

const sortByLabel = (options: SearchableSelectOption[]) =>
  [...options].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

const dueText = (due: number) => {
  if (due > 0) return `owes ${formatCurrency(due, { whole: true })}`;
  if (due < 0) return `credit ${formatCurrency(-due, { whole: true })}`;
  return null;
};

/**
 * Name, with the phone beside it; the passport number finds them too.
 *
 * With `showDue`, the second line is what they owe instead — what matters when
 * taking a payment — and the phone stays searchable.
 */
export const customerOptions = (
  customers: { id: string; name: string; phone: string; passportNo?: string | null; currentDue?: number }[],
  { showDue = false }: { showDue?: boolean } = {},
): SearchableSelectOption[] =>
  sortByLabel(
    customers.map((customer) => {
      const due = showDue && typeof customer.currentDue === "number" ? dueText(customer.currentDue) : null;
      const keywords = [present(customer.passportNo) ? customer.passportNo : null, due ? customer.phone : null].filter(
        (keyword): keyword is string => keyword !== null,
      );
      return {
        value: customer.id,
        label: customer.name,
        description: due ?? customer.phone,
        keywords: keywords.length ? keywords : undefined,
      };
    }),
  );

const payableText = (payable: number) => {
  if (payable > 0) return `owed ${formatCurrency(payable, { whole: true })}`;
  if (payable < 0) return `advance ${formatCurrency(-payable, { whole: true })}`;
  return null;
};

/**
 * Name, with the phone when there is one; the contact person finds them too.
 *
 * With `showPayable`, the second line is what is owed to them instead — what
 * matters when paying one — and the phone stays searchable.
 */
export const supplierOptions = (
  suppliers: {
    id: string;
    name: string;
    phone?: string | null;
    contactName?: string | null;
    currentPayable?: number;
  }[],
  { showPayable = false }: { showPayable?: boolean } = {},
): SearchableSelectOption[] =>
  sortByLabel(
    suppliers.map((supplier) => {
      const payable =
        showPayable && typeof supplier.currentPayable === "number" ? payableText(supplier.currentPayable) : null;
      const phone = present(supplier.phone) ? supplier.phone : null;
      const keywords = [present(supplier.contactName) ? supplier.contactName : null, payable ? phone : null].filter(
        (keyword): keyword is string => keyword !== null,
      );
      return {
        value: supplier.id,
        label: supplier.name,
        description: payable ?? phone ?? undefined,
        keywords: keywords.length ? keywords : undefined,
      };
    }),
  );

export const employeeOptions = (employees: { id: string; name: string; phone: string }[]): SearchableSelectOption[] =>
  sortByLabel(employees.map((employee) => ({ value: employee.id, label: employee.name, description: employee.phone })));

/** Name, with the agent type; the contact finds them too. */
export const visaAgentOptions = (
  agents: { id: string; name: string; type?: string | null; contact?: string | null }[],
): SearchableSelectOption[] =>
  sortByLabel(
    agents.map((agent) => ({
      value: agent.id,
      label: agent.name,
      description: present(agent.type) ? agent.type : undefined,
      keywords: present(agent.contact) ? [agent.contact] : undefined,
    })),
  );
