import type { Destination, PlannerPreferences } from "@/types/tourism";

export const recommendationWeights = { interest: 0.30, distance: 0.20, budget: 0.15, time: 0.15, popularity: 0.10, accessibility: 0.05, rating: 0.05 };

export function scoreDestination(destination: Destination, preferences: PlannerPreferences) {
  const matched = preferences.interests.filter((interest) => destination.tags.includes(interest.toLowerCase())).length;
  const interest = preferences.interests.length ? matched / preferences.interests.length : 0.5;
  const budgetTarget = preferences.budget === "budget" ? 1 : preferences.budget === "moderate" ? 2 : 3;
  const budget = 1 - Math.abs(destination.budget_level - budgetTarget) / 2;
  const timeLimit = preferences.duration === "half-day" ? 240 : preferences.duration === "1-day" ? 480 : 960;
  const time = Math.max(0, 1 - destination.duration_minutes / timeLimit);
  const groupFit = preferences.group === "family" ? destination.family_friendly : preferences.group === "senior" ? destination.senior_friendly : true;
  const accessible = (!preferences.accessible || destination.difficulty === "Easy") && groupFit ? 1 : 0.1;
  const rating = (destination.rating ?? 4) / 5;
  return interest * recommendationWeights.interest + 0.75 * recommendationWeights.distance + budget * recommendationWeights.budget + time * recommendationWeights.time + destination.popularity / 100 * recommendationWeights.popularity + accessible * recommendationWeights.accessibility + rating * recommendationWeights.rating;
}

export function recommend(destinations: Destination[], preferences: PlannerPreferences, count = 4) {
  return destinations.filter(d => (!preferences.accessible || d.difficulty === "Easy") && (preferences.group !== "family" || d.family_friendly) && (preferences.group !== "senior" || d.senior_friendly)).sort((a, b) => scoreDestination(b, preferences) - scoreDestination(a, preferences)).slice(0, count);
}
