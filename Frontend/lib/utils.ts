export function cn(...inputs: (string | undefined | null | false | Record<string, boolean>)[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === "string") {
      classes.push(input);
    } else if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }

  return classes.join(" ");
}

export const formatHash = (hash: string, size = 6) => {
  if (!hash) return "";
  return `${hash.slice(0, size)}…${hash.slice(-size)}`;
};

export const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
  Intl.NumberFormat("en-US", options).format(value);

export const formatCurrency = (value: number, options?: Intl.NumberFormatOptions) =>
  Intl.NumberFormat("en-US", { 
    style: "currency", 
    currency: "USD", 
    maximumFractionDigits: 2, 
    ...options 
  }).format(value);

export const formatDate = (value: string | number | Date) =>
  new Intl.DateTimeFormat("en-US", { 
    dateStyle: "medium", 
    timeStyle: "short" 
  }).format(new Date(value));
