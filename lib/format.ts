export function formatCurrency(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

export function formatCurrencyFull(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatEin(ein: string | number): string {
  const s = String(ein).replace(/-/g, "");
  if (s.length !== 9) return s;
  return `${s.slice(0, 2)}-${s.slice(2)}`;
}

export function formatTaxPeriod(period: number | string): string {
  const s = String(period);
  if (s.length !== 6) return s;
  const year = s.slice(0, 4);
  const month = s.slice(4, 6);
  const months = [
    "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[parseInt(month, 10)] || month} ${year}`;
}

export function getFormTypeName(formtype: number): string {
  switch (formtype) {
    case 0: return "990";
    case 1: return "990-EZ";
    case 2: return "990-PF";
    default: return "Unknown";
  }
}
