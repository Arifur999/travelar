/**
 * Money a customer handed over before there was an invoice for it.
 *
 * The API derives all of this from rows that already exist — collections in,
 * payments marked `fromWallet` out — so there is nothing here to create or
 * edit. Money goes in through a collection and out through a payment on the
 * sale it settles.
 */

export interface IWalletHolder {
  customerId: string;
  name: string;
  phone: string;
  /** Everything this customer has paid in through collections. */
  paidIn: number;
  /** How much of it invoices have consumed. */
  usedUp: number;
  balance: number;
}

export interface IWalletSummary {
  /** What the agency is holding for its customers — a liability, not income. */
  totalHeld: number;
  customersInCredit: number;
  paidIn: number;
  usedUp: number;
}

export type WalletMovementType = "PAID_IN" | "SPENT";

export interface IWalletMovement {
  id: string;
  date: string;
  type: WalletMovementType;
  description: string;
  amount: number;
  /** Balance after this movement, oldest first. */
  balance: number;
}

export interface IWalletStatement {
  customer: { id: string; name: string; phone: string };
  paidIn: number;
  usedUp: number;
  balance: number;
  movements: IWalletMovement[];
}
