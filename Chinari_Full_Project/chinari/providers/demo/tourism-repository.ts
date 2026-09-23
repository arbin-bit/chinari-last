import { demoDestinations } from "@/data/demo-tourism";
import type { TourismRepository } from "@/providers/interfaces";

const distance = (aLat: number, aLng: number, bLat: number, bLng: number) => Math.hypot(aLat - bLat, aLng - bLng);

export class DemoTourismRepository implements TourismRepository {
  getDestinations() { return [...demoDestinations]; }
  getDestination(id: string) { return demoDestinations.find((item) => item.id === id || item.slug === id); }
  searchDestinations(query: string) {
    const needle = query.trim().toLowerCase();
    if (!needle) return this.getDestinations();
    return demoDestinations.filter((item) => [item.name, item.name_ne, item.name_hi, item.category, ...item.tags].join(" ").toLowerCase().includes(needle));
  }
  getNearbyDestinations(latitude: number, longitude: number, limit = 3) {
    return [...demoDestinations].sort((a, b) => distance(latitude, longitude, a.latitude, a.longitude) - distance(latitude, longitude, b.latitude, b.longitude)).slice(0, limit);
  }
  getHiddenGems() { return demoDestinations.filter((item) => item.hidden_gem); }
}

export const demoTourismRepository = new DemoTourismRepository();
