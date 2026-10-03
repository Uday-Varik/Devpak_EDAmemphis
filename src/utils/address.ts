// Address values sometimes arrive with the field label pasted in front of them
// ("Street Address: 1847 Rozelle St"). Strip those labels everywhere an address
// is composed or saved so they never reach the UI or the PDF.

const LABEL_PREFIX = /^\s*(street\s*address|address|city|state|zip(?:\s*code)?)\s*[:\-]\s*/i;

export const cleanAddressPart = (value: unknown): string => {
  let s = String(value ?? "").trim();
  // Handle repeated prefixes, e.g. "Address: Street Address: 123 Main"
  let prev = "";
  while (s !== prev) {
    prev = s;
    s = s.replace(LABEL_PREFIX, "").trim();
  }
  return s;
};

export const composeAddress = (...parts: unknown[]): string =>
  parts.map(cleanAddressPart).filter(Boolean).join(", ");
