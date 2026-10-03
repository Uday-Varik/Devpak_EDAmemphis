export const formatCurrency = (value: number): string =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

export const formatCompact = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return formatCurrency(value);
};

export const formatPercent = (value: number): string => `${value.toFixed(1)}%`;
