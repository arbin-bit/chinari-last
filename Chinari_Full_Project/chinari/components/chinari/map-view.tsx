"use client";

import { ArrowLeft, ListFilter, MapPinned } from "lucide-react";
import type { Destination } from "@/types/tourism";
import { LeafletMap } from "./leaflet-map";

type MapViewProps = {
  destinations: Destination[];
  selectedIds: string[];
  onBack: () => void;
  onOpen: (destination: Destination) => void;
  onToggle: (id: string) => void;
};

export function MapView({
  destinations,
  selectedIds,
  onBack,
  onOpen,
  onToggle,
}: MapViewProps) {
  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-24 pt-6 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#1f4d3a]/14 bg-white px-4 text-sm font-bold shadow-sm transition hover:bg-[#15382a] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c45b2f] focus-visible:ring-offset-2"
        aria-label="Back to Explore"
      >
        <ArrowLeft size={17} />
        Back to Explore
      </button>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#c45b2f]">
            Tourism map
          </p>
          <h1 className="mt-2 font-serif text-5xl">See the journey take shape.</h1>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm">
          <MapPinned size={17} />
          {selectedIds.length} selected
        </span>
      </div>

      <div className="grid min-h-[720px] overflow-hidden rounded-[34px] border border-[#1f4d3a]/10 bg-white shadow-[0_24px_60px_rgba(33,63,45,.12)] lg:grid-cols-[360px_1fr]">
        <aside className="order-2 max-h-[720px] overflow-y-auto p-4 lg:order-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-2xl">Places</h2>
            <ListFilter size={18} />
          </div>
          {destinations.map((destination) => (
            <div
              key={destination.id}
              className="mb-2 flex items-center gap-3 rounded-[20px] border border-[#1f4d3a]/8 p-3"
            >
              <img
                src={destination.image}
                alt=""
                className="h-14 w-14 rounded-2xl object-cover"
              />
              <button
                type="button"
                onClick={() => onOpen(destination)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate font-bold">{destination.name}</p>
                <p className="text-xs text-[#68776d]">{destination.category}</p>
              </button>
              <button
                type="button"
                onClick={() => onToggle(destination.id)}
                className={`grid h-9 w-9 place-items-center rounded-full text-lg font-bold ${
                  selectedIds.includes(destination.id)
                    ? "bg-[#15382a] text-white"
                    : "bg-[#edf1e9]"
                }`}
                aria-label={`${selectedIds.includes(destination.id) ? "Remove" : "Add"} ${
                  destination.name
                }`}
              >
                {selectedIds.includes(destination.id) ? "✓" : "+"}
              </button>
            </div>
          ))}
        </aside>
        <div className="order-1 min-h-[480px] border-b-2 border-[#244d3a]/15 p-2 lg:order-2 lg:border-b-0 lg:border-l-2">
          <LeafletMap
            destinations={destinations}
            selectedIds={selectedIds}
            numbered
            onSelect={onOpen}
            className="min-h-[480px] lg:min-h-[720px]"
          />
        </div>
      </div>
    </div>
  );
}
