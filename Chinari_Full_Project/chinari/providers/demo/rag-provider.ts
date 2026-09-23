import type { RAGDocument, RAGProvider } from "@/providers/interfaces";
import { searchTourismKnowledge } from "@/lib/tourism-knowledge";

const emergencyDocument: RAGDocument = { id: "rag-emergency", text: "Chinari does not provide emergency contact numbers until an authorized source verifies them.", source: "Chinari safety policy", source_type: "emergency_guidance", verification_status: "VERIFIED", last_updated: "2026-09-23", language: "en" };

export class DemoRAGProvider implements RAGProvider {
  search(query: string) {
    if (/emergency|police|hospital|ambulance/i.test(query)) return [emergencyDocument];
    return searchTourismKnowledge(query).map((record) => ({
      id: `rag-${record.id}`,
      text: `${record.name}. ${record.description} Activities: ${record.activities.join(", ") || "not recorded"}. Best season: ${record.best_season ?? "not confirmed"}. Opening hours: ${record.opening_hours ?? "not confirmed"}.`,
      source: record.source_basis,
      source_type: "destination",
      verification_status: record.verification_status === "researched" ? "RESEARCHED_NOT_LIVE_VERIFIED" : "USER_SUPPLIED",
      last_updated: "2026-09-23",
      language: "en",
    }));
  }
}

export const demoRAGProvider = new DemoRAGProvider();
