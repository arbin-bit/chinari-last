import type { Destination, ItineraryItem, PlannerPreferences, ReviewSentiment } from "@/types/tourism";

export interface TourismRepository {
  getDestinations(): Destination[];
  getDestination(id: string): Destination | undefined;
  searchDestinations(query: string): Destination[];
  getNearbyDestinations(latitude: number, longitude: number, limit?: number): Destination[];
  getHiddenGems(): Destination[];
}

export interface RouteProvider {
  optimize(destinations: Destination[], preferences?: Partial<PlannerPreferences>): ItineraryItem[];
}

export interface SentimentProvider { analyze(review: string): ReviewSentiment; }

export interface RAGDocument { id: string; text: string; source: string; source_type: string; verification_status: string; last_updated: string; language: string; }
export interface RAGProvider { search(query: string): RAGDocument[]; }

export interface AIContext { currentPage: string; currentDestinationId?: string; selectedDestinationIds: string[]; language: string; }
export interface AIProvider { readonly mode: string; respond(message: string, context: AIContext): Promise<{ text: string; suggestedTool?: string }>; }
export interface VoiceProvider { readonly mode: string; requestPermission(): Promise<"granted" | "unavailable">; }
export interface AnalyticsEvent { name: string; occurredAt: string; properties: Record<string, string | number | boolean>; }
export interface AnalyticsProvider { track(name: string, properties?: AnalyticsEvent["properties"]): void; list(): AnalyticsEvent[]; }
export interface ForecastPoint { destinationId: string; changePercent: number; label: string; }
export interface ForecastProvider { nextSevenDays(): ForecastPoint[]; }
