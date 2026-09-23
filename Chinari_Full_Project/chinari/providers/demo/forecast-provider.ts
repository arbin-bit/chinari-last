import type { ForecastProvider } from "@/providers/interfaces";

export class DemoForecastProvider implements ForecastProvider {
  nextSevenDays() { return [{ destinationId: "bishazari-tal", changePercent: 18, label: "Prototype forecast" }, { destinationId: "narayani-riverside", changePercent: 12, label: "Prototype forecast" }, { destinationId: "sauraha", changePercent: -4, label: "Prototype forecast" }]; }
}

export const demoForecastProvider = new DemoForecastProvider();
