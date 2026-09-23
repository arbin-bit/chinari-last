import type { SentimentProvider } from "@/providers/interfaces";
import type { ReviewSentiment } from "@/types/tourism";

const positiveTerms: Record<string, string[]> = { Scenery: ["beautiful", "scenic", "lovely", "view", "peaceful"], Hospitality: ["friendly", "helpful", "welcoming"], Food: ["delicious", "tasty", "food"] };
const negativeTerms: Record<string, string[]> = { Cleanliness: ["dirty", "toilet", "litter", "trash"], Transportation: ["traffic", "transport", "road"], Pricing: ["expensive", "overpriced", "costly"], Safety: ["unsafe", "dangerous"], Accessibility: ["stairs", "wheelchair", "accessible"] };

export class DemoSentimentProvider implements SentimentProvider {
  analyze(review: string): ReviewSentiment {
    const text = review.toLowerCase();
    const positive = Object.entries(positiveTerms).filter(([, words]) => words.some((word) => text.includes(word))).map(([category]) => category);
    const negative = Object.entries(negativeTerms).filter(([, words]) => words.some((word) => text.includes(word))).map(([category]) => category);
    const overall = positive.length && negative.length ? "Mixed" : positive.length ? "Positive" : negative.length ? "Negative" : "Neutral";
    return { overall, positive, negative };
  }
}

export const demoSentimentProvider = new DemoSentimentProvider();
