import directory from "@/data/chitwan-tourism-directory.json";

export type TourismKnowledgeRecord = {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  activities: string[];
  best_season: string | null;
  entry_fee_npr: number | null;
  entry_fee_note: string | null;
  visit_duration_hours: number | null;
  difficulty: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  opening_hours: string | null;
  facilities: string[];
  google_maps_search: string;
  image_search_queries: string[];
  image_usage_status: string;
  verification_status: string;
  source_basis: string;
  key_highlights?: string[];
  distance_from_bharatpur?: string;
  user_supplied?: boolean;
};

type CoreHighlight = {
  aliases: string[];
  name: string;
  category: string;
  highlights: string[];
  distance: string;
  imageSearchTerm: string;
};

const coreHighlights: CoreHighlight[] = [
  {
    aliases: ["chitwan-national-park"],
    name: "Chitwan National Park",
    category: "Wildlife & Safari",
    highlights: ["Jungle safaris", "one-horned rhinos", "Bengal tigers", "canoeing"],
    distance: "approximately 20 km",
    imageSearchTerm: "Chitwan National Park wildlife",
  },
  {
    aliases: ["devghat"],
    name: "Devghat Dham",
    category: "Pilgrimage & Heritage",
    highlights: ["Sacred river confluence", "temples", "meditation ashrams"],
    distance: "approximately 7 km",
    imageSearchTerm: "Devghat Dham Chitwan",
  },
  {
    aliases: ["beeshazar-associated-lakes"],
    name: "Bishazari Tal",
    category: "Nature & Wildlife",
    highlights: ["Wetland", "birdwatching", "crocodiles", "forest trails"],
    distance: "approximately 10 km",
    imageSearchTerm: "Bishazari Tal lake",
  },
  {
    aliases: ["jalbire-waterfall"],
    name: "Jalbire Waterfall",
    category: "Nature & Adventure",
    highlights: ["60-meter waterfall", "canyoning", "natural swimming pools"],
    distance: "approximately 30 km",
    imageSearchTerm: "Jalbire Waterfall Chitwan",
  },
  {
    aliases: ["tharu-cultural-museum"],
    name: "Tharu Cultural Museum",
    category: "Culture & History",
    highlights: ["Indigenous Tharu tools", "traditional dance performances"],
    distance: "approximately 18 km",
    imageSearchTerm: "Tharu Cultural Museum Sauraha",
  },
  {
    aliases: ["elephant-breeding-centre"],
    name: "Elephant Breeding Center",
    category: "Wildlife Conservation",
    highlights: ["Baby elephants", "education on elephant behavior"],
    distance: "approximately 22 km",
    imageSearchTerm: "Chitwan Elephant Breeding Center",
  },
  {
    aliases: ["siraichuli"],
    name: "Siraichuli Hill",
    category: "Trekking & Viewpoint",
    highlights: ["Panoramic Himalayan sunrise views", "highest point"],
    distance: "approximately 40 km",
    imageSearchTerm: "Siraichuli Hill Chitwan",
  },
  {
    aliases: ["ranipokhari"],
    name: "Ranipokhari",
    category: "Local Recreation",
    highlights: ["Historical pond with religious value", "evening walks"],
    distance: "central Bharatpur",
    imageSearchTerm: "Ranipokhari Bharatpur",
  },
  {
    aliases: ["shashwat-dham"],
    name: "Shashwat Dham",
    category: "Spiritual Center",
    highlights: ["Modern Hindu spiritual center", "Shiva temple", "gardens"],
    distance: "approximately 25 km",
    imageSearchTerm: "Shashwat Dham Nawalpur",
  },
];

const sourcePlaces = directory.places as TourismKnowledgeRecord[];

const supplementalPlaces: TourismKnowledgeRecord[] = coreHighlights
  .filter((highlight) => !sourcePlaces.some((place) => highlight.aliases.includes(place.id)))
  .map((highlight) => ({
    id: highlight.aliases[0],
    name: highlight.name,
    category: highlight.category,
    subcategory: highlight.category,
    description: highlight.highlights.join(", ") + ".",
    activities: highlight.highlights,
    best_season: null,
    entry_fee_npr: null,
    entry_fee_note: null,
    visit_duration_hours: null,
    difficulty: null,
    latitude: null,
    longitude: null,
    address: null,
    opening_hours: null,
    facilities: [],
    google_maps_search: `${highlight.name}, Nepal`,
    image_search_queries: [highlight.imageSearchTerm],
    image_usage_status: "Search term supplied by the user; image licensing must be checked before reuse",
    verification_status: "user-supplied",
    source_basis: "User-provided core destination table",
    key_highlights: highlight.highlights,
    distance_from_bharatpur: highlight.distance,
    user_supplied: true,
  }));

export const tourismKnowledge: TourismKnowledgeRecord[] = [
  ...sourcePlaces.map((place) => {
    const highlight = coreHighlights.find((item) => item.aliases.includes(place.id));
    if (!highlight) return place;
    return {
      ...place,
      key_highlights: highlight.highlights,
      distance_from_bharatpur: highlight.distance,
      user_supplied: true,
    };
  }),
  ...supplementalPlaces,
];

export const tourismKnowledgePolicy = [
  "Use the supplied Chitwan directory and core destination table before answering tourism questions.",
  "Describe records as researched or user-supplied unless a current named authority has verified the claim.",
  "Treat approximate distances as approximate and never invent missing fees, hours, coordinates, facilities, or access details.",
  "Recommend local confirmation for safety, seasonal access, ticketing, opening hours, and wildlife activities.",
  "Do not reuse researched image links without checking copyright or licensing.",
  "Identify nearby places outside Chitwan, including Maula Kalika Temple in Gaindakot/Nawalpur, as nearby rather than in-district.",
] as const;

const stopWords = new Set([
  "a", "about", "and", "are", "at", "best", "can", "could", "do", "for", "from", "give", "i",
  "in", "is", "me", "near", "of", "on", "place", "places", "please", "tell", "the", "there", "to",
  "tourism", "visit", "what", "when", "where", "which", "with", "you",
]);

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9\u0900-\u097f]+/g, " ").trim();

export function searchTourismKnowledge(query: string, limit = 4) {
  const normalizedQuery = normalize(query);
  const terms = normalizedQuery.split(/\s+/).filter((term) => term.length > 1 && !stopWords.has(term));
  if (!terms.length) return [];

  return tourismKnowledge
    .map((record) => {
      const name = normalize(record.name);
      const searchable = normalize([
        record.name,
        record.category,
        record.subcategory,
        record.description,
        record.activities.join(" "),
        record.key_highlights?.join(" ") ?? "",
        record.address ?? "",
      ].join(" "));
      let score = name === normalizedQuery ? 100 : normalizedQuery.includes(name) ? 70 : 0;
      for (const term of terms) {
        if (name.includes(term)) score += 12;
        else if (searchable.includes(term)) score += 3;
      }
      return { record, score };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.record.name.localeCompare(b.record.name))
    .slice(0, limit)
    .map((result) => result.record);
}

export function answerFromTourismKnowledge(query: string) {
  const matches = searchTourismKnowledge(query, 3);
  if (!matches.length) return null;

  const [primary, ...related] = matches;
  const details = primary.key_highlights?.length
    ? primary.key_highlights.join(", ")
    : primary.description.replace(/\.$/, "");
  const distance = primary.distance_from_bharatpur
    ? ` It is listed as ${primary.distance_from_bharatpur} from Bharatpur.`
    : "";
  const season = primary.best_season ? ` Best season in the directory: ${primary.best_season}.` : "";
  const fee = primary.entry_fee_npr != null
    ? ` The recorded entry fee is NPR ${primary.entry_fee_npr}, but confirm the current price locally.`
    : " Entry fee and opening hours are not confirmed in the supplied data.";
  const relatedText = related.length
    ? ` Related records: ${related.map((record) => record.name).join(", ")}.`
    : "";

  return `${primary.name} (${primary.category}): ${details}.${distance}${season}${fee}${relatedText} Source status: ${primary.verification_status}; ${primary.source_basis}.`;
}

export const tourismKnowledgeSummary = {
  directoryRecords: sourcePlaces.length,
  coreHighlights: coreHighlights.length,
  totalUniqueRecords: tourismKnowledge.length,
};
