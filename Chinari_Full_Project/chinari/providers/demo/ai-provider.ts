import type { AIContext, AIProvider } from "@/providers/interfaces";
import { answerFromTourismKnowledge, tourismKnowledgeSummary } from "@/lib/tourism-knowledge";

export class DemoAIProvider implements AIProvider {
  readonly mode = "demo";
  async respond(message: string, context: AIContext) {
    const lower = message.toLowerCase();
    if (lower.includes("hidden gem")) return { text: "I can add a demo hidden gem to the current journey.", suggestedTool: "find_hidden_gems" };
    if (lower.includes("plan")) return { text: "I can create a structured one-day demo itinerary.", suggestedTool: "create_itinerary" };
    if (lower.includes("here") && context.currentDestinationId) return { text: `I will answer using the current destination context: ${context.currentDestinationId}.` };
    if (lower.includes("database") || lower.includes("directory")) return { text: `I use ${tourismKnowledgeSummary.totalUniqueRecords} unique supplied tourism records and flag details that still need local confirmation.` };
    const groundedAnswer = answerFromTourismKnowledge(message);
    if (groundedAnswer) return { text: groundedAnswer };
    return { text: "That detail is not in the supplied Chitwan tourism directory, so I will not guess. I can help with one of its researched or user-supplied places." };
  }
}

export const demoAIProvider = new DemoAIProvider();
