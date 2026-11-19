import { CASH_NOT_INVESTED } from "@/utils/calculations";

/** Id of the Developer Equity (cash) field in the Budget section. */
export const DEVELOPER_EQUITY_FIELD_ID = "developer-equity-field";

/** Opens Budget and focuses the Developer Equity input. */
export const goToDeveloperEquity = () => {
  window.dispatchEvent(new CustomEvent("navigate-section", { detail: "budget-capital" }));
  // Give the Budget section time to mount before focusing the field.
  setTimeout(() => {
    document.getElementById(DEVELOPER_EQUITY_FIELD_ID)?.querySelector("input")?.focus();
  }, 150);
};

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
