import assert from "node:assert/strict";
import { recommend } from "../lib/recommendations";
import { answerFromTourismKnowledge, searchTourismKnowledge, tourismKnowledge, tourismKnowledgeSummary } from "../lib/tourism-knowledge";
import { demoRouteProvider } from "../providers/demo/route-provider";
import { demoSentimentProvider } from "../providers/demo/sentiment-provider";
import { demoRAGProvider } from "../providers/demo/rag-provider";
import { demoAIProvider } from "../providers/demo/ai-provider";
import { demoTourismRepository } from "../providers/demo/tourism-repository";
import type { PlannerPreferences } from "../types/tourism";
import { float32ToPcm16, mergeTranscript, pcm16ToFloat32, sampleRateFromMimeType, StreamingPcm16Resampler } from "../lib/live-audio";

const destinations = demoTourismRepository.getDestinations();
assert.equal(destinations.length, 8, "demo destination catalogue should be stable");
assert.equal(demoTourismRepository.searchDestinations("religious")[0]?.id, "devghat");
assert.ok(demoTourismRepository.getHiddenGems().every((item) => item.hidden_gem));
assert.equal(tourismKnowledgeSummary.directoryRecords, 63, "supplied directory should retain every record");
assert.equal(tourismKnowledgeSummary.totalUniqueRecords, 66, "directory and user highlights should merge without duplicates");
assert.equal(new Set(tourismKnowledge.map((item) => item.id)).size, tourismKnowledge.length);
assert.equal(searchTourismKnowledge("canyoning")[0]?.id, "jalbire-waterfall");
assert.match(answerFromTourismKnowledge("Tell me about Shashwat Dham") ?? "", /opening hours are not confirmed/i);

const preferences: PlannerPreferences = { duration: "1-day", group: "friends", budget: "moderate", interests: ["Nature", "Adventure", "Religious"], transport: "taxi", accessible: false };
const recommendations = recommend(destinations, preferences, 4);
assert.equal(recommendations.length, 4);

const route = demoRouteProvider.optimize(recommendations, preferences);
assert.equal(route.length, 4);
assert.equal(new Set(route.map((item) => item.destination.id)).size, route.length);
assert.ok(route.every((item) => /^\d{2}:\d{2}$/.test(item.arrival)));

const sentiment = demoSentimentProvider.analyze("The place was beautiful but the area was dirty.");
assert.equal(sentiment.overall, "Mixed");
assert.deepEqual(sentiment.positive, ["Scenery"]);
assert.deepEqual(sentiment.negative, ["Cleanliness"]);

assert.equal(demoRAGProvider.search("Devghat")[0]?.verification_status, "RESEARCHED_NOT_LIVE_VERIFIED");
assert.equal((await demoAIProvider.respond("Add a hidden gem", { currentPage: "home", selectedDestinationIds: [], language: "en" })).suggestedTool, "find_hidden_gems");

const clipped = pcm16ToFloat32(float32ToPcm16(new Float32Array([-2, -0.5, 0, 0.5, 2])));
assert.ok(clipped[0] <= -0.999 && clipped[4] >= 0.999, "PCM conversion should clip without wrapping");
assert.ok(Math.abs(clipped[1] + 0.5) < 0.001 && Math.abs(clipped[3] - 0.5) < 0.001);
const resampler = new StreamingPcm16Resampler(48_000, 16_000);
let resampledBytes = 0;
for (let offset = 0; offset < 48_000; offset += 4096) {
  const length = Math.min(4096, 48_000 - offset);
  const tone = new Float32Array(length);
  for (let index = 0; index < length; index += 1) tone[index] = Math.sin(2 * Math.PI * 440 * (offset + index) / 48_000) * 0.2;
  resampledBytes += resampler.process(tone).byteLength;
}
assert.ok(Math.abs(resampledBytes / 2 - 16_000) <= 1, "streaming resampler should preserve one second of audio");
assert.equal(sampleRateFromMimeType("audio/pcm;rate=24000"), 24_000);
assert.equal(mergeTranscript("Tell me about", "Jalbire Waterfall."), "Tell me about Jalbire Waterfall.");

console.log("Chinari provider tests passed");
import { buildDemoItinerary, dailyMinutes, fitJourney } from "../providers/demo/route-provider";
import { isVisitorReport, reportServices } from "../lib/visitor-reports";
const relaxed: PlannerPreferences = {...preferences,duration:"3-days",pace:"relaxed",transport:"taxi"};
const fitted = fitJourney(recommend(destinations,relaxed,8),relaxed);
const multiDay = buildDemoItinerary(fitted,relaxed);
assert.ok(multiDay.some(item=>item.day>1),"multi-day planning must produce distinct days");
assert.ok(multiDay.every(item=>item.day<=3 && item.end_minutes<=480+dailyMinutes(relaxed)),"visits must fit requested daily windows");
const halfDay: PlannerPreferences = {...preferences,duration:"half-day",transport:"walking"};
assert.ok(buildDemoItinerary(fitJourney(recommend(destinations,halfDay,8),halfDay),halfDay).every(item=>item.day===1 && item.end_minutes<=720),"walking transfers must fit a half day");
assert.ok(recommend(destinations,{...preferences,accessible:true},8).every(d=>d.difficulty==='Easy'),"accessibility preferences must affect results");
const walked=buildDemoItinerary(destinations.slice(0,2),{transport:'walking'});
const driven=buildDemoItinerary(destinations.slice(0,2),{transport:'taxi'});
assert.ok(walked[0].travel_minutes>driven[0].travel_minutes,"initial transfer must use selected transport");
const report={id:'test-local',kind:'Problem',service:reportServices[0],ward:'10',message:'A missing waste bin near the river.',createdAt:new Date().toISOString()};
assert.ok(isVisitorReport(report));
assert.ok(!isVisitorReport({...report,ward:'99'}));
assert.ok(!isVisitorReport({...report,message:' '}));
assert.ok(!isVisitorReport({...report,service:'Unknown'}));
console.log('Planner and local report checks passed');
