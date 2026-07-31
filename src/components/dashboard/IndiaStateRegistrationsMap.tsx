"use client";

import { useEffect, useMemo, useState } from "react";
import { geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import {
  buildIndiaStateCountMap,
  indiaStateFillColor,
  resolveIndiaMapStateName,
} from "@/lib/india-state-map";
import type { DistributionDataPoint } from "@/types";

const MAP_WIDTH = 390;
const MAP_HEIGHT = 435;
const GEOJSON_URL = "/maps/india-states.geojson";

interface IndiaStateRegistrationsMapProps {
  data: DistributionDataPoint[];
}

export function IndiaStateRegistrationsMap({ data }: IndiaStateRegistrationsMapProps) {
  const [geo, setGeo] = useState<FeatureCollection<Geometry, { name: string }> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<{
    name: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(GEOJSON_URL);
        if (!response.ok) throw new Error("Failed to load India map");
        const json = (await response.json()) as FeatureCollection<Geometry, { name: string }>;
        if (!cancelled) {
          setGeo(json);
          setLoadError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load India map");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => buildIndiaStateCountMap(data), [data]);
  const maxCount = useMemo(() => {
    let max = 0;
    for (const value of counts.values()) max = Math.max(max, value);
    return max;
  }, [counts]);

  const unmatched = useMemo(
    () =>
      data.filter(
        (row) => row.value > 0 && resolveIndiaMapStateName(row.name) == null,
      ),
    [data],
  );

  const projection = useMemo(() => {
    if (!geo) return null;
    return geoMercator().fitSize([MAP_WIDTH, MAP_HEIGHT], geo as GeoPermissibleObjects);
  }, [geo]);

  const pathGenerator = useMemo(() => {
    if (!projection) return null;
    return geoPath(projection);
  }, [projection]);

  const labeledStates = useMemo(() => {
    if (!geo || !pathGenerator) return [];
    return geo.features
      .map((feature) => {
        const name = feature.properties?.name ?? "";
        const count = counts.get(name) ?? 0;
        if (count <= 0) return null;
        const centroid = pathGenerator.centroid(feature as GeoPermissibleObjects);
        if (!Number.isFinite(centroid[0]) || !Number.isFinite(centroid[1])) return null;
        return { name, count, x: centroid[0], y: centroid[1] };
      })
      .filter((item): item is { name: string; count: number; x: number; y: number } => Boolean(item));
  }, [geo, pathGenerator, counts]);

  if (loadError) {
    return <p className="py-8 text-center text-sm text-destructive">{loadError}</p>;
  }

  if (!geo || !pathGenerator) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Loading India map…</p>;
  }

  return (
    <div className="w-full">
      <div className="relative mx-auto w-full max-w-[320px]">
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          role="img"
          aria-label="India map of registered users by state"
          className="h-auto w-full"
          onMouseLeave={() => setHovered(null)}
        >
          <g>
            {geo.features.map((feature) => {
              const name = feature.properties?.name ?? "Unknown";
              const count = counts.get(name) ?? 0;
              const d = pathGenerator(feature as GeoPermissibleObjects);
              if (!d) return null;
              return (
                <path
                  key={name}
                  d={d}
                  fill={indiaStateFillColor(count, maxCount)}
                  stroke="hsl(var(--foreground) / 0.45)"
                  strokeWidth={1.25}
                  className="cursor-pointer transition-opacity duration-150 hover:opacity-90"
                  onMouseEnter={(event) => {
                    const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
                    if (!bounds) return;
                    setHovered({
                      name,
                      count,
                      x: event.clientX - bounds.left,
                      y: event.clientY - bounds.top,
                    });
                  }}
                  onMouseMove={(event) => {
                    const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
                    if (!bounds) return;
                    setHovered({
                      name,
                      count,
                      x: event.clientX - bounds.left,
                      y: event.clientY - bounds.top,
                    });
                  }}
                >
                  <title>
                    {name}: {count} registration{count === 1 ? "" : "s"}
                  </title>
                </path>
              );
            })}
          </g>

          <g pointerEvents="none">
            {labeledStates.map((state) => {
              const showName = state.count >= Math.max(2, maxCount * 0.15);
              return (
                <g key={`label-${state.name}`} transform={`translate(${state.x}, ${state.y})`}>
                  <circle
                    r={showName ? 9 : 7}
                    fill="hsl(var(--background) / 0.92)"
                    stroke="hsl(var(--foreground) / 0.4)"
                    strokeWidth={1}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="hsl(var(--foreground))"
                    style={{ fontSize: showName ? 9 : 8, fontWeight: 650 }}
                  >
                    {state.count}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute z-10 rounded-md border bg-card px-2.5 py-1.5 text-xs shadow-md"
            style={{
              left: Math.min(hovered.x + 12, 240),
              top: Math.max(hovered.y - 40, 8),
            }}
          >
            <p className="font-medium text-foreground">{hovered.name}</p>
            <p className="text-muted-foreground">
              {hovered.count} registration{hovered.count === 1 ? "" : "s"}
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-foreground">
        <span>Fewer</span>
        <span className="h-2.5 w-8 rounded-sm" style={{ background: indiaStateFillColor(1, 10) }} />
        <span className="h-2.5 w-8 rounded-sm" style={{ background: indiaStateFillColor(5, 10) }} />
        <span className="h-2.5 w-8 rounded-sm" style={{ background: indiaStateFillColor(10, 10) }} />
        <span>More</span>
        {maxCount > 0 && <span className="ml-2 tabular-nums">Max {maxCount}</span>}
      </div>

      {unmatched.length > 0 && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Not shown on map:{" "}
          {unmatched.map((row) => `${row.name} (${row.value})`).join(", ")}
        </p>
      )}
    </div>
  );
}
