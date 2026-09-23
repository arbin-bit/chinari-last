export const reportServices = ["Cleanliness & waste", "Transport & signage", "Access & facilities", "Visitor information", "Food & hospitality", "Nature & conservation"] as const;
export type VisitorReport = { id: string; kind: "Problem" | "Suggestion" | "Appreciation"; service: string; ward: string; message: string; createdAt: string };
export function isVisitorReport(value: unknown): value is VisitorReport {
  if (!value || typeof value !== "object") return false;
  const r = value as VisitorReport;
  return typeof r.id === "string" && ["Problem", "Suggestion", "Appreciation"].includes(r.kind) && reportServices.includes(r.service as typeof reportServices[number]) && typeof r.ward === "string" && /^(Unconfirmed|[1-9]|1[0-9]|2[0-9])$/.test(r.ward) && typeof r.message === "string" && r.message.trim().length >= 10 && r.message.length <= 1500 && typeof r.createdAt === "string" && Number.isFinite(Date.parse(r.createdAt));
}
