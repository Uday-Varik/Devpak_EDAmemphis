// Format a US phone number string progressively as the user types.
// 3 digits  -> "(901) "
// 6 digits  -> "(901) 555-"
// 10 digits -> "(901) 555-0123"
// Extra digits beyond 10 are truncated.
export const formatPhone = (input: string): string => {
  const digits = (input || "").replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};
