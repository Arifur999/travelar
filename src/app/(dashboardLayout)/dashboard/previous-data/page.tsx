import type { Metadata } from "next";
import PreviousDataView from "@/components/modules/Import/PreviousDataView";
import PageHeader from "@/components/shared/PageHeader";

export const metadata: Metadata = { title: "Previous data" };

/**
 * Moving in from the spreadsheet the agency kept before this.
 *
 * Reading and importing are two steps on purpose: the file is the agency's
 * whole book of business, and a report they can check beats an import they
 * cannot undo.
 */
const PreviousDataPage = () => (
  <div className="space-y-6">
    <PageHeader
      title="Previous data"
      description="Already running on a spreadsheet? Upload it and bring your customers, suppliers, accounts and history across."
    />

    <PreviousDataView />
  </div>
);

export default PreviousDataPage;
