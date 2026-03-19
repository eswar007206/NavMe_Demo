/**
 * Floor Blueprint: PNG floor plan + clickable zone overlays loaded from Supabase.
 * Works for any floor — just pass the correct image URL.
 * Click a zone to block (red) / unblock (green).
 */

import { useMemo, memo, useState, useCallback, useRef } from "react";
import { arToImageOnPlan } from "@/lib/mapCoordinates";

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
  zone_type?: string;
  is_blocked?: boolean;
}

export interface NavPathPoint {
  x: number;
  y: number;
}

interface FloorBlueprintProps {
  /** Rasterized plan size (must match floorPlanImage pixels). */
  planWidth: number;
  planHeight: number;
  floorPlanImage: string;
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
  navPathPoints?: NavPathPoint[];
  isDrawingNavPath?: boolean;
  onNavPathClick?: (pt: NavPathPoint) => void;
}

function FloorBlueprintInner({
  planWidth,
  planHeight,
  floorPlanImage,
  invertImage = false,
  width = "100%",
  height = "100%",
  className = "",
  people = [],
  zones = [],
  blockedZones = new Set(),
  onZoneToggle,
  navPathPoints = [],
  isDrawingNavPath = false,
  onNavPathClick,
}: FloorBlueprintProps) {
  const [imgError, setImgError] = useState(false);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isDrawingNavPath || !onNavPathClick || !svgRef.current) return;
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const svgPt = pt.matrixTransform(ctm.inverse());
      onNavPathClick({ x: svgPt.x, y: svgPt.y });
    },
    [isDrawingNavPath, onNavPathClick],
  );

  const trafficPoints = useMemo(() => {
    return people.map((p) => ({
      id: p.id,
      ...arToImageOnPlan(p.x, p.y, planWidth, planHeight),
      label: p.userName,
    }));
  }, [people, planWidth, planHeight]);

  const handleZoneClick = useCallback(
    (e: React.MouseEvent, zoneId: string) => {
      if (isDrawingNavPath) return;
      e.stopPropagation();
      onZoneToggle?.(zoneId);
    },
    [onZoneToggle, isDrawingNavPath]
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
        ref={svgRef}
        viewBox={`0 0 ${planWidth} ${planHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          cursor: isDrawingNavPath ? "crosshair" : undefined,
        }}
        onClick={handleSvgClick}
      >
        {/* White background */}
        <rect x="0" y="0" width={planWidth} height={planHeight} fill="#fff" />

        {/* Embedded floor plan image */}
        {!imgError && (
          <image
            href={floorPlanImage}
            x="0"
            y="0"
            width={planWidth}
            height={planHeight}
            preserveAspectRatio="none"
            style={invertImage ? { filter: "invert(1)" } : undefined}
            onError={() => setImgError(true)}
          />
        )}

        <g pointerEvents="auto">
          {/* Clickable zones from DB */}
          {zones.map((zone) => {
            const isBlocked = blockedZones ? blockedZones.has(zone.zone_id) : zone.is_blocked;
            const isHovered = hoveredZone === zone.zone_id;

            let fillCol = "rgba(34, 197, 94, 0.3)";
            let strokeCol = "#22c55e";

            if (isBlocked) {
              fillCol = isHovered ? "rgba(239, 68, 68, 0.55)" : "rgba(239, 68, 68, 0.4)";
              strokeCol = "#ef4444";
            } else if (zone.zone_type === "fire_exit") {
              fillCol = isHovered ? "rgba(249, 115, 22, 0.5)" : "rgba(249, 115, 22, 0.3)";
              strokeCol = "#f97316";
            } else if (zone.zone_type === "vip") {
              fillCol = isHovered ? "rgba(168, 85, 247, 0.5)" : "rgba(168, 85, 247, 0.3)";
              strokeCol = "#a855f7";
            } else if (zone.zone_type === "restricted") { 
              fillCol = isHovered ? "rgba(239, 68, 68, 0.5)" : "rgba(239, 68, 68, 0.3)";
              strokeCol = "#ef4444";
            } else {
              fillCol = isHovered ? "rgba(34, 197, 94, 0.55)" : "rgba(34, 197, 94, 0.3)";
              strokeCol = "#22c55e";
            }

            return (
              <rect
                key={zone.zone_id}
                x={zone.x}
                y={zone.y}
                width={zone.w}
                height={zone.h}
                fill={fillCol}
                stroke={strokeCol}
                strokeWidth={isHovered ? 3 : 2}
                rx={3}
                style={{ cursor: "pointer", transition: "fill 0.15s, stroke-width 0.15s" }}
                onClick={(e) => handleZoneClick(e, zone.zone_id)}
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

          {/* Navigation path */}
          {navPathPoints.length >= 2 && (
            <polyline
              points={navPathPoints.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ pointerEvents: "none" }}
            />
          )}
          {navPathPoints.map((p, i) => (
            <circle
              key={`nav-${i}`}
              cx={p.x}
              cy={p.y}
              r="5"
              fill="#2563eb"
              stroke="#ffffff"
              strokeWidth="1.5"
              style={{ pointerEvents: "none" }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

export const FloorBlueprint = memo(FloorBlueprintInner);
export default FloorBlueprint;
