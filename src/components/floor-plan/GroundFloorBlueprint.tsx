/**
 * Ground Floor: thin wrapper around FloorBlueprint with the ground floor image.
 * Kept for backward compatibility — existing imports still work.
 */

import { memo } from "react";
import { FloorBlueprint } from "./FloorBlueprint";
import type { PersonOnMap, RoomDensity, MapZoneData } from "./FloorBlueprint";

export type { PersonOnMap, RoomDensity, MapZoneData };

interface GroundFloorBlueprintProps {
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

function GroundFloorBlueprintInner(props: GroundFloorBlueprintProps) {
  return <FloorBlueprint floorPlanImage="/GroundFloor.png" {...props} />;
}

export const GroundFloorBlueprint = memo(GroundFloorBlueprintInner);
export default GroundFloorBlueprint;
