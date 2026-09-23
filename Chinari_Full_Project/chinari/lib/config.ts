export const appConfig = {
  appMode: process.env.NEXT_PUBLIC_APP_MODE ?? "demo",
  presentationMode: (process.env.NEXT_PUBLIC_PRESENTATION_MODE ?? "true") === "true",
  providers: {
    data: process.env.NEXT_PUBLIC_DATA_PROVIDER ?? "demo",
    ai: process.env.NEXT_PUBLIC_AI_PROVIDER ?? "demo",
    voice: process.env.NEXT_PUBLIC_VOICE_PROVIDER ?? "demo",
    rag: process.env.NEXT_PUBLIC_RAG_PROVIDER ?? "demo",
    route: process.env.NEXT_PUBLIC_ROUTE_PROVIDER ?? "demo",
    sentiment: process.env.NEXT_PUBLIC_SENTIMENT_PROVIDER ?? "demo",
    analytics: process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER ?? "demo",
    forecast: process.env.NEXT_PUBLIC_FORECAST_PROVIDER ?? "demo",
  },
} as const;
