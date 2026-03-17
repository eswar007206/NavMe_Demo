/**
 * Floor Blueprint: PNG floor plan + clickable zone overlays loaded from Supabase.
 * Works for any floor — just pass the correct image URL.
 * Click a zone to block (red) / unblock (green).
 */

import { useMemo, memo, useState, useCallback } from "react";
import { arToImage } from "@/lib/mapCoordinates";
import {
  FLOOR_IMG_WIDTH,
  FLOOR_IMG_HEIGHT,
  FLOOR_CROP_Y,
  FLOOR_CROP_W,
  FLOOR_CROP_H,
} from "@/lib/mapCoordinates";

const IMG_WIDTH = FLOOR_IMG_WIDTH;
const IMG_HEIGHT = FLOOR_IMG_HEIGHT;

export interface PersonOnMap {
  id: string;
  x: number;
  y: number;
  userName?: string;
}

export interface RoomDensity {
  roomId: string;
  count: number;
}

export interface MapZoneData {
  zone_id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface FloorBlueprintProps {
  floorPlanImage: string;
  /** Invert the floor plan image colors (white bg → black bg). */
  invertImage?: boolean;
  width?: number | string;
  height?: number | string;
  className?: string;
  onLiftClick?: (lift: { id: string; label: string }) => void;
  selectedLiftId?: string | null;
  people?: PersonOnMap[];
  roomDensities?: RoomDensity[];
  useFloorPlanImage?: boolean;
  highlightPolygon?: { label: string; points: { x: number; y: number }[] } | null;
  zones?: MapZoneData[];
  blockedZones?: Set<string>;
  onZoneToggle?: (zoneId: string) => void;
}

function FloorBlueprintInner({
  floorPlanImage,
  invertImage = false,
  width = "100%",
  height = "100%",
  className = "",
  people = [],
  zones = [],
  blockedZones = new Set(),
  onZoneToggle,
}: FloorBlueprintProps) {
  const [imgError, setImgError] = useState(false);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  const trafficPoints = useMemo(() => {
    return people.map((p) => ({
      id: p.id,
      ...arToImage(p.x, p.y),
      label: p.userName,
    }));
  }, [people]);

  const handleZoneClick = useCallback(
    (zoneId: string) => {
      onZoneToggle?.(zoneId);
    },
    [onZoneToggle]
  );

  return (
    <div
      className={className}
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <svg
        viewBox={`0 ${FLOOR_CROP_Y} ${FLOOR_CROP_W} ${FLOOR_CROP_H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
      >
        {/* White background */}
        <rect x="0" y={FLOOR_CROP_Y} width={FLOOR_CROP_W} height={FLOOR_CROP_H} fill="#fff" />

        {/* Embedded floor plan image */}
        {!imgError && (
          <image
            href={floorPlanImage}
            x="0"
            y="0"
            width={IMG_WIDTH}
            height={IMG_HEIGHT}
            preserveAspectRatio="none"
            style={invertImage ? { filter: "invert(1)" } : undefined}
            onError={() => setImgError(true)}
          />
        )}

        <g pointerEvents="auto">
          {/* Clickable zones from DB */}
          {zones.map((zone) => {
            const isBlocked = blockedZones.has(zone.zone_id);
            const isHovered = hoveredZone === zone.zone_id;
            return (
              <rect
                key={zone.zone_id}
                x={zone.x}
                y={zone.y}
                width={zone.w}
                height={zone.h}
                fill={
                  isBlocked
                    ? isHovered ? "rgba(239, 68, 68, 0.55)" : "rgba(239, 68, 68, 0.4)"
                    : isHovered ? "rgba(34, 197, 94, 0.55)" : "rgba(34, 197, 94, 0.3)"
                }
                stroke={isBlocked ? "#ef4444" : "#22c55e"}
                strokeWidth={isHovered ? 3 : 2}
                rx={3}
                style={{ cursor: "pointer", transition: "fill 0.15s, stroke-width 0.15s" }}
                onClick={() => handleZoneClick(zone.zone_id)}
                onMouseEnter={() => setHoveredZone(zone.zone_id)}
                onMouseLeave={() => setHoveredZone(null)}
                aria-label={`${zone.label} — ${isBlocked ? "Blocked" : "Unblocked"}`}
              >
                <title>{zone.label} — {isBlocked ? "Blocked (click to unblock)" : "Unblocked (click to block)"}</title>
              </rect>
            );
          })}

          {/* Zone labels */}
          {zones.map((zone) => (
            <text
              key={`label-${zone.zone_id}`}
              x={zone.x + zone.w / 2}
              y={zone.y + zone.h / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize={Math.min(11, zone.w / 6)}
              fontWeight={600}
              style={{ pointerEvents: "none", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
            >
              {zone.label}
            </text>
          ))}

          {/* Traffic dots */}
          {trafficPoints.map((p) => (
            <circle
              key={p.id}
              cx={p.x}
              cy={p.y}
              r="12"
              fill="#3b82f6"
              stroke="#fff"
              strokeWidth="3"
              style={{ pointerEvents: "none" }}
            >
              <title>{p.label ?? p.id}</title>
            </circle>
          ))}
        </g>
      </svg>
    </div>
  );
}

export const FloorBlueprint = memo(FloorBlueprintInner);
export default FloorBlueprint;
