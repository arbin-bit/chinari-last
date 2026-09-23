"use client";

import { useEffect, useRef, useState } from "react";
import type { Destination } from "@/types/tourism";

interface LeafletMapProps {
  destinations: Destination[];
  selectedIds?: string[];
  activeId?: string | null;
  userLocation?: { latitude: number; longitude: number; accuracy?: number } | null;
  onSelect?: (destination: Destination) => void;
  numbered?: boolean;
  className?: string;
}

export function LeafletMap({ destinations, selectedIds = [], activeId, userLocation, onSelect, numbered = false, className = "" }: LeafletMapProps) {
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: false,
        touchZoom: false,
        dragging: false,
        doubleClickZoom: false,
        boxZoom: false,
      }).setView([27.66, 84.41], 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setReady(true);
      window.setTimeout(() => map.invalidateSize(), 80);
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !layerRef.current) {
      const timer = window.setTimeout(() => window.dispatchEvent(new Event("resize")), 120);
      return () => window.clearTimeout(timer);
    }
    const render = async () => {
      const L = await import("leaflet");
      if (!mapRef.current || !layerRef.current) return;
      layerRef.current.clearLayers();
      const selected = selectedIds.map(id => destinations.find(d => d.id === id)).filter((d): d is Destination => Boolean(d));
      destinations.forEach((destination) => {
        const index = selectedIds.indexOf(destination.id);
        const isActive = activeId === destination.id;
        const marker = L.marker([destination.latitude, destination.longitude], {
          title: destination.name, alt: destination.name,
          icon: L.divIcon({
            className: "chinari-marker-shell",
            html: `<span class="chinari-marker${isActive ? " is-active" : ""}${index >= 0 ? " is-selected" : ""}">${numbered && index >= 0 ? index + 1 : ""}</span>`,
            iconSize: [34, 42], iconAnchor: [17, 39],
          }),
        });
        marker.bindTooltip(destination.name, { direction: "top", offset: [0, -30] });
        if (onSelect) marker.on("click", () => onSelect(destination));
        marker.addTo(layerRef.current!);
      });
      if (selected.length > 1) {
        L.polyline(selected.map((item) => [item.latitude, item.longitude] as [number, number]), { color: "#c45b2f", weight: 4, opacity: 0.86, dashArray: "8 8" }).addTo(layerRef.current);
      }
      if (userLocation) {
        const point: [number, number] = [userLocation.latitude, userLocation.longitude];
        if (userLocation.accuracy) L.circle(point, { radius: userLocation.accuracy, color: "#167c73", fillColor: "#24a79a", fillOpacity: .12, weight: 2 }).addTo(layerRef.current);
        L.circleMarker(point, { radius: 10, color: "#fff", fillColor: "#167c73", fillOpacity: 1, weight: 4 }).bindTooltip("You are here", { permanent: true, direction: "top", offset: [0, -12] }).addTo(layerRef.current);
      }
      const visible = selected.length ? selected : destinations;
      if (userLocation && !visible.length) {
        mapRef.current.setView([userLocation.latitude, userLocation.longitude], 16);
      } else if (visible.length) {
        const bounds = L.latLngBounds(visible.map((item) => [item.latitude, item.longitude] as [number, number]));
        mapRef.current.fitBounds(bounds, { padding: [45, 45], maxZoom: selected.length === 1 ? 13 : 12 });
      }
    };
    void render();
  }, [ready, destinations, selectedIds, activeId, userLocation, numbered, onSelect]);

  return <div ref={containerRef} className={`relative isolate z-0 h-full min-h-[360px] w-full overflow-hidden rounded-[22px] border-2 border-[#244d3a]/20 bg-[#dbe6d7] shadow-inner ${className}`} aria-label="Interactive tourism map. Page scrolling remains enabled; use the map zoom buttons to change scale." />;
}
