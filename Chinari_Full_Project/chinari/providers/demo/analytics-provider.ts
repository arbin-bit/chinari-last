import type { AnalyticsEvent, AnalyticsProvider } from "@/providers/interfaces";

export class DemoAnalyticsProvider implements AnalyticsProvider {
  private events: AnalyticsEvent[] = [];
  track(name: string, properties: AnalyticsEvent["properties"] = {}) { this.events.push({ name, properties, occurredAt: new Date().toISOString() }); }
  list() { return [...this.events]; }
}

export const demoAnalyticsProvider = new DemoAnalyticsProvider();
