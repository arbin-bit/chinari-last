import type { RouteProvider } from "@/providers/interfaces";
import type { Destination, ItineraryItem, PlannerPreferences } from "@/types/tourism";

const START = { latitude: 27.6805, longitude: 84.4358 };
const km = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
  const x = (b.longitude - a.longitude) * Math.cos(((a.latitude + b.latitude) / 2) * Math.PI / 180);
  const y = b.latitude - a.latitude;
  return Math.sqrt(x * x + y * y) * 111.2;
};

export class DemoRouteProvider implements RouteProvider {
  optimize(destinations: Destination[], preferences: Partial<PlannerPreferences> = {}): ItineraryItem[] {
    const remaining = [...destinations];
    const ordered: Destination[] = [];
    let cursor = START;
    while (remaining.length) {
      remaining.sort((a, b) => km(cursor, a) - km(cursor, b));
      const next = remaining.shift()!;
      ordered.push(next);
      cursor = next;
    }
    return buildDemoItinerary(ordered, preferences);
  }
}

export function buildDemoItinerary(ordered: Destination[], preferences: Partial<PlannerPreferences> = {}): ItineraryItem[] {
    let minutes = 8 * 60;
    let day = 1;
    const end = 8 * 60 + dailyMinutes(preferences);
    return ordered.map((destination, index) => {
      let previous = index === 0 ? START : ordered[index - 1];
      let distance_km = Number(km(previous, destination).toFixed(1));
      const speed = preferences.transport === "walking" ? 4 : preferences.transport === "public" ? 22 : 32;
      let travel_minutes = Math.max(10, Math.round((distance_km / speed) * 60));
      if (index > 0 && minutes + travel_minutes + destination.duration_minutes > end) {
        day++; minutes = 8 * 60; previous = START;
        distance_km = Number(km(previous, destination).toFixed(1));
        travel_minutes = Math.max(10, Math.round((distance_km / speed) * 60));
      }
      minutes += travel_minutes;
      const arrival = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
      minutes += destination.duration_minutes;
      const end_minutes = minutes;
      minutes += preferences.pace === "relaxed" ? 35 : preferences.pace === "full" ? 10 : 20;
      return { destination, day, end_minutes, arrival, travel_minutes, distance_km, reason: `Time for ${destination.tags.slice(0, 2).join(" and ")}, with a ${preferences.pace ?? "balanced"} pace.` };
    });
}

export function dailyMinutes(preferences: Partial<PlannerPreferences>) {
  return preferences.duration === "half-day" ? 240 : preferences.pace === "relaxed" ? 360 : preferences.pace === "full" ? 600 : 480;
}

export function fitJourney(ranked: Destination[], preferences: PlannerPreferences) {
  const days = preferences.duration === "3-days" ? 3 : preferences.duration === "2-days" ? 2 : 1;
  let accepted: Destination[] = [];
  for (const destination of ranked) {
    const route = demoRouteProvider.optimize([...accepted, destination], preferences);
    if (route.every(item => item.day <= days && item.end_minutes <= 480 + dailyMinutes(preferences))) accepted = route.map(item => item.destination);
  }
  return accepted;
}

export const demoRouteProvider = new DemoRouteProvider();
