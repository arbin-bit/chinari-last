# Chinari

**Explore · Learn · Preserve**

Chinari is a mobile-first AI tourism platform for Bharatpur Metropolitan City and the wider Chitwan visitor journey. It was built for the Bharatpur Hackathon 2026 theme, “Digital Agenda and Artificial Intelligence to Redesign Tourism.”

The demonstration connects destination discovery, journey planning, an interactive OpenStreetMap, text and in-browser voice experiences, multilingual UI, review sentiment, and a municipal tourism intelligence dashboard.

> Chinari is currently a demonstration. Tourism records, events, businesses, analytics, forecasts and AI responses are visibly labelled when simulated or unverified. The project does not claim municipal endorsement.

## Working demonstration flow

1. Discover curated Bharatpur and Chitwan-area places.
2. Add several places to a persistent journey.
3. Use the planner or Chinari AI to create a structured itinerary.
4. Reorder, remove or optimize stops while the map updates.
5. Run the scripted demo voice story to create and edit the same journey state.
6. Open a destination, submit a demo review and inspect structured sentiment.
7. Switch among English, नेपाली and हिन्दी UI labels.
8. Open the municipal dashboard to inspect clearly labelled demo intelligence.

## Architecture

The UI depends on provider interfaces rather than demo arrays:

```text
Tourist UI / Municipal UI
        ↓
Validated application actions + WebMCP tools
        ↓
TourismRepository · RouteProvider · SentimentProvider · RAGProvider
        ↓
Demo providers today → municipal / Gemini / GIS providers later
```

Important source areas:

- `components/chinari/` — product views, dialogs, map and assistant surfaces
- `data/demo-tourism.ts` — isolated curated demonstration records
- `providers/interfaces.ts` — replaceable provider contracts
- `providers/demo/` — deterministic demo tourism, routing and sentiment logic
- `lib/recommendations.ts` — configurable deterministic recommendation scoring
- `lib/translations.ts` — English, Nepali and Hindi UI dictionary
- `lib/config.ts` — centralized provider and app-mode selection

Client-side journey state is stored locally for the demonstration. No raw voice recordings are persisted.

## AI and tool calling

Chinari’s demo assistant is action-oriented. It can create an itinerary, add a hidden gem, remove the second stop, find grounded places and answer in context. App actions are validated before they touch journey state.

The page also exposes a small WebMCP registry for:

- `search_places`
- `create_itinerary`
- `add_itinerary_place`
- `remove_itinerary_place`
- `optimize_itinerary`

A production Gemini adapter should live behind the same application services. Permanent Gemini credentials must remain server-side.

## Voice architecture

The orange voice button launches an in-browser experience—not a telephone dialer. Demo mode asks for microphone permission, immediately releases the stream, shows the full voice state UI, and runs deterministic story turns that update the real journey and map.

Production direction:

```text
Browser audio → Chinari backend → ephemeral authorization → Gemini Live
                         ↕ validated Chinari tools
```

## Data and verification

Records support `DEMO`, `UNVERIFIED`, `VERIFIED`, and `ARCHIVED` states. Opening hours, official prices, emergency numbers and government approval are intentionally omitted until a verified source is available. Generated imagery is labelled as illustrative.

The production migration path is:

```text
Demo providers → verified pilot datasets and Gemini adapters → municipal deployment
```

The UI does not need to be rewritten when provider implementations change.

## Local development

Requirements: Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Build the Cloudflare-compatible Vinext output:

```bash
npm run build
```

Copy `.env.example` to `.env.local` and keep credentials out of Git.

## Environment variables

```text
NEXT_PUBLIC_APP_MODE=demo
NEXT_PUBLIC_PRESENTATION_MODE=true
NEXT_PUBLIC_DATA_PROVIDER=demo
NEXT_PUBLIC_AI_PROVIDER=demo
NEXT_PUBLIC_VOICE_PROVIDER=demo
NEXT_PUBLIC_RAG_PROVIDER=demo
NEXT_PUBLIC_ROUTE_PROVIDER=demo
NEXT_PUBLIC_SENTIMENT_PROVIDER=demo
NEXT_PUBLIC_ANALYTICS_PROVIDER=demo
NEXT_PUBLIC_FORECAST_PROVIDER=demo
NEXT_PUBLIC_MAP_PROVIDER=osm
GEMINI_API_KEY=
```

`GEMINI_API_KEY` is a server secret and must never use the `NEXT_PUBLIC_` prefix.

## Deploy to Netlify

Use a Git-connected Netlify project because Chinari includes server API routes.
Do not use Netlify's static drag-and-drop deploy for the full application.

1. Push this folder to a GitHub, GitLab, or Bitbucket repository.
2. In Netlify, choose **Add new project** and **Import an existing project**.
3. Select the repository. Netlify reads `netlify.toml` automatically.
4. Confirm the build command is `npm run build:netlify` and the publish directory is `.next`.
5. Under **Project configuration > Environment variables**, add `GEMINI_API_KEY` if live Gemini text and voice are required.
6. Deploy the project. After deployment, test `/`, the Chinari AI drawer, and the voice flow.

The demo still works without `GEMINI_API_KEY` through the deterministic local text fallback. Live Gemini voice requires the key.

## Production checklist

- Replace demo tourism records with verified municipal/provider data.
- Add migrations for PostgreSQL/PostGIS or a supported production store.
- Place Gemini and Gemini Live calls behind authenticated server adapters.
- Add rate limiting, structured audit logs and municipal role authorization.
- Verify every emergency contact and create a review cadence.
- Add consent, retention and deletion controls for production analytics.
- Run accessibility, mobile, security and content-verification audits.

## Security and privacy

The demo collects only trip preferences and local journey state. It does not request identity documents, exact personal profiles or voice recording storage. AI output cannot directly mutate arbitrary frontend state; only registered actions can change the journey.

## Team

Add the Bharatpur Hackathon 2026 team name, members and contact details here before submission.


## September 2026 local upgrade

The discovery page now uses credited Wikimedia Commons photographs with a CSS colour treatment, featured destination controls, search, category filters, sorting, and an embedded map. See `/photo-credits.html` for source links, licenses, and regional-image context.

The planner retains date, daily budget tier, pace, transport, group and access preferences. It creates separate days within the requested planning windows and supports downloading an itinerary. Transfers remain straight-line demo estimates; meals, lodging, opening hours, actual prices and return transfers are not verified.

Visitor reports are validated and stored only in this browser. They feed City insights counts by service and can be removed locally. No report is sent to a municipality. City insights includes a scenario-adjustable, clearly modelled forecast with a table view and CSV exports. Near me is user-triggered and keeps coordinates in page memory.

Run `npm test` for provider, multi-day planning, transport, access-preference and report-validation checks. Start locally with `npm run dev`, then open http://localhost:5173.
