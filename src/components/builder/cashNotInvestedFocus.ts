/** Id of the Developer Equity (cash) field in the Budget section. */
export const DEVELOPER_EQUITY_FIELD_ID = "developer-equity-field";

/** Sent to Budget when it is already mounted. */
export const FOCUS_DEVELOPER_EQUITY_EVENT = "devpack:focus-developer-equity";

// Budget may not be mounted yet when the link is clicked, so the request is also kept here
// until the Budget form mounts and picks it up.
let focusRequested = false;

/** Returns true once per request. Budget calls this on mount and when the event fires. */
export const consumeDeveloperEquityFocus = (): boolean => {
  const requested = focusRequested;
  focusRequested = false;
  return requested;
};

/** Opens Budget with the Developer Equity field open and focused. */
export const goToDeveloperEquity = () => {
  focusRequested = true;
  window.dispatchEvent(new CustomEvent("navigate-section", { detail: "budget-capital" }));
  window.dispatchEvent(new Event(FOCUS_DEVELOPER_EQUITY_EVENT));
};
