import type { Language } from "@/types/tourism";

export const translations = {
  en: { home: "Home", explore: "Explore", journey: "Journey", map: "Map", ai: "Chinari AI", discover: "Discover Bharatpur your way.", plan: "Plan my trip", ask: "Ask Chinari", hidden: "Hidden gems", search: "Search places", add: "Add to journey", details: "View details" },
  ne: { home: "गृहपृष्ठ", explore: "घुम्नुहोस्", journey: "यात्रा", map: "नक्सा", ai: "चिनारी AI", discover: "आफ्नै तरिकाले भरतपुर चिन्नुहोस्।", plan: "मेरो यात्रा बनाउनुहोस्", ask: "चिनारीलाई सोध्नुहोस्", hidden: "लुकेका रत्न", search: "स्थान खोज्नुहोस्", add: "यात्रामा थप्नुहोस्", details: "विवरण हेर्नुहोस्" },
  hi: { home: "होम", explore: "खोजें", journey: "यात्रा", map: "मानचित्र", ai: "चिनारी AI", discover: "भरतपुर को अपने तरीके से जानें।", plan: "मेरी यात्रा बनाएँ", ask: "चिनारी से पूछें", hidden: "छिपे हुए रत्न", search: "स्थान खोजें", add: "यात्रा में जोड़ें", details: "विवरण देखें" },
} satisfies Record<Language, Record<string, string>>;
