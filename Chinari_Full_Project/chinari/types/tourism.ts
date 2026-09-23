export type Language = "en" | "ne" | "hi";
export type VerificationStatus = "DEMO" | "UNVERIFIED" | "VERIFIED" | "ARCHIVED";
export type DestinationCategory = "Nature" | "Wildlife" | "Culture" | "Religious" | "Adventure" | "Food" | "Local Life";

export interface Destination {
  id: string;
  slug: string;
  name: string;
  name_ne: string;
  name_hi: string;
  short_description: string;
  description: string;
  significance: string;
  category: DestinationCategory;
  subcategories: string[];
  image: string;
  image_alt: string;
  latitude: number;
  longitude: number;
  municipality: string;
  ward?: string;
  address: string;
  opening_hours?: string;
  entry_fee?: string;
  estimated_duration: string;
  duration_minutes: number;
  best_time: string;
  best_season: string;
  difficulty: "Easy" | "Moderate" | "Challenging";
  accessibility: string;
  family_friendly: boolean;
  senior_friendly: boolean;
  tags: string[];
  rating?: number;
  review_count?: number;
  popularity: number;
  hidden_gem: boolean;
  verification_status: VerificationStatus;
  verification_source?: string;
  source_url?: string;
  last_verified?: string;
  facilities: string[];
  transport_options: string[];
  safety_information: string;
  budget_level: 1 | 2 | 3;
}

export interface LocalBusiness {
  id: string;
  name: string;
  category: "Food" | "Stay" | "Guide" | "Craft" | "Transport";
  location: string;
  price_range: string;
  verification_status: VerificationStatus;
}

export interface TourismEvent {
  id: string;
  name: string;
  date_label: string;
  location: string;
  verification_status: VerificationStatus;
}

export interface PlannerPreferences {
  startDate?: string;
  dailyBudget?: number;
  pace?: "relaxed" | "balanced" | "full";
  duration: "half-day" | "1-day" | "2-days" | "3-days";
  group: "solo" | "couple" | "family" | "friends" | "senior";
  budget: "budget" | "moderate" | "premium";
  interests: string[];
  transport: "walking" | "public" | "taxi" | "rental" | "own";
  accessible: boolean;
}

export interface ItineraryItem {
  day: number;
  end_minutes: number;
  destination: Destination;
  arrival: string;
  travel_minutes: number;
  distance_km: number;
  reason: string;
}

export interface ReviewSentiment {
  overall: "Positive" | "Neutral" | "Negative" | "Mixed";
  positive: string[];
  negative: string[];
}

export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
  meta?: string;
}
