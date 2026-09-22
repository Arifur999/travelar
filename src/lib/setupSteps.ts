import { type ISetupProgress } from "@/types/dashboard.types";
import { type PlanFeature } from "@/types/enums.types";

/**
 * The first three things a new agency has to do, and where each one is done.
 *
 * A signed-up agency lands on a dashboard of zeros, and nothing there says that
 * a sale needs a customer, or that a payment needs somewhere to land. This
 * turns that into a short list that disappears once the work is done.
 *
 * A step whose module the plan does not include is dropped, never shown locked:
 * telling someone to do something their plan forbids is worse than silence.
 */

export interface SetupStep {
  key: "cashAccount" | "customer" | "sale";
  title: string;
  description: string;
  href: string;
  action: string;
  done: boolean;
}

/** The sales modules, in the order the step offers them. */
const SALE_MODULES: { feature: PlanFeature; href: string; action: string; description: string }[] = [
  {
    feature: "TICKETING",
    href: "/dashboard/tickets",
    action: "Issue a ticket",
    description: "Issue a ticket and the fare, the supplier cost and the profit are all recorded.",
  },
  {
    feature: "VISA",
    href: "/dashboard/visa",
    action: "Open a visa case",
    description: "Open a visa case and track its documents, status and payments.",
  },
  {
    feature: "HAJJ_UMRAH",
    href: "/dashboard/hajj",
    action: "Take a booking",
    description: "Take a Hajj or Umrah booking against a package and a batch.",
  },
];

export const buildSetupSteps = (setup: ISetupProgress, features: PlanFeature[]): SetupStep[] => {
  const steps: SetupStep[] = [];

  // Cash accounts sit behind the EXPENSE feature, like the rest of the money side.
  if (features.includes("EXPENSE")) {
    steps.push({
      key: "cashAccount",
      title: "Add a cash account",
      description: "Cash in hand, a bank account, bKash — every payment has to land somewhere.",
      href: "/dashboard/accounts",
      action: "Add an account",
      done: setup.hasCashAccount,
    });
  }

  // Customers are a base feature: every plan can do this one.
  steps.push({
    key: "customer",
    title: "Add your first customer",
    description: "Every sale, invoice and due is tracked against a customer.",
    // The list, not the section's dashboard: this is where the Add button is.
    href: "/dashboard/customers/list",
    action: "Add a customer",
    done: setup.hasCustomer,
  });

  const saleModule = SALE_MODULES.find((module) => features.includes(module.feature));
  if (saleModule) {
    steps.push({
      key: "sale",
      title: "Record your first sale",
      description: saleModule.description,
      href: saleModule.href,
      action: saleModule.action,
      done: setup.hasSale,
    });
  }

  return steps;
};

/** Nothing left to nag about — the card hides itself. */
export const isSetupComplete = (steps: SetupStep[]) => steps.every((step) => step.done);

/** The step to point at next: the first unfinished one. */
export const nextSetupStep = (steps: SetupStep[]) => steps.find((step) => !step.done) ?? null;
