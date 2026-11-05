import { LedgerType } from "@domain/enums/ledger-type.enum";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";

export interface UserLedgerSearchFilters {
  currency?: PaymentCurrency;
  type?: LedgerType;
  referenceId?: string;
  from?: Date;
  to?: Date;
}
