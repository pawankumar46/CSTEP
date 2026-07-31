"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  geoCentroid,
  geoDistance,
  geoGraticule10,
  geoOrthographic,
  geoPath,
  type GeoPermissibleObjects,
} from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import {
  buildCountryCountMap,
  countryFillColor,
  resolveWorldCountryName,
  setWorldGeoCountryNames,
} from "@/lib/country-map";
import type { DistributionDataPoint } from "@/types";

const GLOBE_SIZE = 360;
const GEOJSON_URL = "/maps/world-countries.geojson";
/** Default view centered on India mainland. */
const DEFAULT_ROTATION: [number, number, number] = [-79.5, -23, 0];
/** Stable label anchors when MultiPolygon centroids drift (islands). */
const LABEL_ANCHORS: Record<string, [number, number]> = {
  India: [78.96, 22.59],
  USA: [-98.35, 39.5],
};

interface CountryRegistrationsGlobeProps {
  data: DistributionDataPoint[];
}

type WorldFeature = Feature<Geometry, { name: string }>;

export function CountryRegistrationsGlobe({ data }: CountryRegistrationsGlobeProps) {
  const [geo, setGeo] = useState<FeatureCollection<Geometry, { name: string }> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rotation, setRotation] = useState<[number, number, number]>(DEFAULT_ROTATION);
  const [hovered, setHovered] = useState<{
    name: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  const dragRef = useRef<{
    active: boolean;
    x: number;
    y: number;
    rotation: [number, number, number];
  } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(GEOJSON_URL);
        if (!response.ok) throw new Error("Failed to load world map");
        const json = (await response.json()) as FeatureCollection<Geometry, { name: string }>;
        if (!cancelled) {
          setWorldGeoCountryNames(
            json.features.map((feature) => feature.properties?.name ?? "").filter(Boolean),
          );
          setGeo(json);
          setLoadError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load world map");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const geoNames = useMemo(
    () => (geo ? geo.features.map((feature) => feature.properties?.name ?? "").filter(Boolean) : []),
    [geo],
  );

  const counts = useMemo(() => buildCountryCountMap(data, geoNames), [data, geoNames]);
  const maxCount = useMemo(() => {
    let max = 0;
    for (const value of counts.values()) max = Math.max(max, value);
    return max;
  }, [counts]);

  const unmatched = useMemo(
    () =>
      data.filter(
        (row) => row.value > 0 && resolveWorldCountryName(row.name) == null,
      ),
    [data],
  );

  const projection = useMemo(() => {
    return geoOrthographic()
      .scale(GLOBE_SIZE / 2 - 8)
      .translate([GLOBE_SIZE / 2, GLOBE_SIZE / 2])
      .clipAngle(90)
      .rotate(rotation);
  }, [rotation]);

  const pathGenerator = useMemo(() => geoPath(projection), [projection]);

  const viewCenter = useMemo(
    (): [number, number] => [-rotation[0], -rotation[1]],
    [rotation],
  );

  const isVisible = useCallback(
    (feature: WorldFeature) => {
      try {
        const centroid = geoCentroid(feature);
        return geoDistance(viewCenter, centroid) < Math.PI / 2;
      } catch {
        return false;
      }
    },
    [viewCenter],
  );

  const labeledCountries = useMemo(() => {
    if (!geo) return [];
    return geo.features
      .map((feature) => {
        const name = feature.properties?.name ?? "";
        const count = counts.get(name) ?? 0;
        if (count <= 0) return null;
        if (!isVisible(feature as WorldFeature)) return null;

        const anchor = LABEL_ANCHORS[name];
        const projected = anchor
          ? projection(anchor)
          : pathGenerator.centroid(feature as GeoPermissibleObjects);
        if (!projected || !Number.isFinite(projected[0]) || !Number.isFinite(projected[1])) {
          return null;
        }
        return { name, count, x: projected[0], y: projected[1] };
      })
      .filter((item): item is { name: string; count: number; x: number; y: number } => Boolean(item));
  }, [geo, counts, isVisible, pathGenerator, projection]);

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      active: true,
      x: event.clientX,
      y: event.clientY,
      rotation: [...rotation] as [number, number, number],
    };
  };

  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag?.active) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    setRotation([
      drag.rotation[0] + dx * 0.45,
      Math.max(-80, Math.min(80, drag.rotation[1] - dy * 0.45)),
      drag.rotation[2],
    ]);
  };

  const endDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (dragRef.current?.active) {
      dragRef.current.active = false;
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    }
  };

  if (loadError) {
    return <p className="py-8 text-center text-sm text-destructive">{loadError}</p>;
  }

  if (!geo) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Loading globe…</p>;
  }

  const spherePath = pathGenerator({ type: "Sphere" } as GeoPermissibleObjects);
  const graticulePath = pathGenerator(geoGraticule10() as GeoPermissibleObjects);

  return (
    <div className="w-full">
      <div className="relative mx-auto w-full max-w-[320px]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${GLOBE_SIZE} ${GLOBE_SIZE}`}
          role="img"
          aria-label="Globe of registered users by country. Drag to rotate."
          className="h-auto w-full cursor-grab touch-none active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onMouseLeave={() => setHovered(null)}
        >
          {spherePath && (
            <path
              d={spherePath}
              fill="hsl(var(--muted) / 0.55)"
              stroke="hsl(var(--foreground) / 0.35)"
              strokeWidth={1.25}
            />
          )}
          {graticulePath && (
            <path
              d={graticulePath}
              fill="none"
              stroke="hsl(var(--foreground) / 0.12)"
              strokeWidth={0.5}
              pointerEvents="none"
            />
          )}

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
                  fill={countryFillColor(count, maxCount)}
                  stroke="hsl(var(--foreground) / 0.35)"
                  strokeWidth={0.6}
                  className="transition-opacity duration-150 hover:opacity-90"
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
            {labeledCountries.map((country) => (
              <g key={`label-${country.name}`} transform={`translate(${country.x}, ${country.y})`}>
                <circle
                  r={8}
                  fill="hsl(var(--background) / 0.92)"
                  stroke="hsl(var(--foreground) / 0.4)"
                  strokeWidth={1}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="hsl(var(--foreground))"
                  style={{ fontSize: 8, fontWeight: 650 }}
                >
                  {country.count}
                </text>
              </g>
            ))}
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

      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Drag to rotate · hover a country for details
      </p>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-foreground">
        <span>Fewer</span>
        <span className="h-2.5 w-8 rounded-sm" style={{ background: countryFillColor(1, 10) }} />
        <span className="h-2.5 w-8 rounded-sm" style={{ background: countryFillColor(5, 10) }} />
        <span className="h-2.5 w-8 rounded-sm" style={{ background: countryFillColor(10, 10) }} />
        <span>More</span>
        {maxCount > 0 && <span className="ml-2 tabular-nums">Max {maxCount}</span>}
      </div>

      {unmatched.length > 0 && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Not shown on globe:{" "}
          {unmatched.map((row) => `${row.name} (${row.value})`).join(", ")}
        </p>
      )}
    </div>
  );
}
