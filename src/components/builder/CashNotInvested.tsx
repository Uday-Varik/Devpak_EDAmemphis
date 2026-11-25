import { CASH_NOT_INVESTED } from "@/utils/calculations";
import { goToDeveloperEquity } from "@/components/builder/cashNotInvestedFocus";

/**
 * Developer view: shown in place of ROI / cash-on-cash when no cash is invested.
 * The value is plain text (not focusable); only the link is interactive.
 */
export const CashNotInvestedNote = () => (
  <span className="text-xs text-muted-foreground">
    {CASH_NOT_INVESTED}.{" "}
    <button
      type="button"
      onClick={goToDeveloperEquity}
      className="underline text-primary hover:text-primary/80"
    >
      Enter your cash in Budget
    </button>
  </span>
);
