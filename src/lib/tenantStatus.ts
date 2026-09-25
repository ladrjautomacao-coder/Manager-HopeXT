export type TenantStatus = "trial" | "active" | "past_due" | "blocked" | "canceled";

export const STATUS_LABELS: Record<TenantStatus, string> = {
  trial: "Trial",
  active: "Ativo",
  past_due: "Inadimplente",
  blocked: "Bloqueado",
  canceled: "Cancelado",
};

export const STATUS_BADGE_VARIANT: Record<TenantStatus, "success" | "secondary" | "warning" | "destructive"> = {
  trial: "secondary",
  active: "success",
  past_due: "warning",
  blocked: "destructive",
  canceled: "destructive",
};

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
