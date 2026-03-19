/**
 * Ground floor – schematic like reference: two horizontal blocks,
 * two vertical pathways with circle + rounded rectangle each (black on white).
 */

import { AR_BOUNDS } from "./arCoordinates";

const xL = 24;
const xR = 55;
const zTop = AR_BOUNDS.zMax;   // -49
const zBottom = AR_BOUNDS.zMin; // -81

/** Top horizontal block (thick outline). */
export function topBlockPath(): string {
  return `M ${xL} ${zTop} L ${xR} ${zTop} L ${xR} ${zTop - 2} L ${xL} ${zTop - 2} Z`;
}

/** Bottom horizontal block. */
export function bottomBlockPath(): string {
  return `M ${xL} ${zBottom + 2} L ${xR} ${zBottom + 2} L ${xR} ${zBottom} L ${xL} ${zBottom} Z`;
}

/** Left pathway: vertical line from top block to circle. */
export function leftPathTopPath(): string {
  const x = 28;
  return `M ${x} ${zTop - 2} L ${x} ${zTop - 10}`;
}

/** Left pathway: vertical double line from rounded rect to bottom block. */
export function leftPathBottomPath(): string {
  const x1 = 26.8, x2 = 29.2;
  const zFrom = 63; // bottom of left rounded rect
  return `M ${x1} ${-zFrom} L ${x1} ${zBottom + 2} M ${x2} ${-zFrom} L ${x2} ${zBottom + 2}`;
}

/** Left circle (open). */
export function leftCirclePath(): string {
  const cx = 28, cz = -61, r = 2.2;
  return `M ${cx + r} ${cz} A ${r} ${r} 0 0 1 ${cx - r} ${cz} A ${r} ${r} 0 0 1 ${cx + r} ${cz}`;
}

/** Left rounded rectangle (with two dots drawn in component). */
export function leftRoundedRectPath(): string {
  const x = 26.2, z = -67.5, w = 3.6, h = 4.5, r = 0.8;
  return `M ${x + r} ${z} L ${x + w - r} ${z} Q ${x + w} ${z} ${x + w} ${z + r} L ${x + w} ${z + h - r} Q ${x + w} ${z + h} ${x + w - r} ${z + h} L ${x + r} ${z + h} Q ${x} ${z + h} ${x} ${z + h - r} L ${x} ${z + r} Q ${x} ${z} ${x + r} ${z} Z`;
}

/** Left curve from circle to rounded rect. */
export function leftCurvePath(): string {
  return `M 28 -62.8 Q 26 -65 27 -67.5`;
}

/** Right pathway: vertical line from top block to top of rounded rect. */
export function rightPathTopPath(): string {
  const x = 51;
  const zRoundedRectTop = -62.5;
  return `M ${x} ${zTop - 2} L ${x} ${zRoundedRectTop}`;
}

/** Right pathway: vertical line from bottom of circle to bottom block. */
export function rightPathBottomPath(): string {
  const x = 51;
  const circleBottom = -68 - 2.2;
  return `M ${x} ${circleBottom} L ${x} ${zBottom + 2}`;
}

/** Right rounded rectangle (with two dots). */
export function rightRoundedRectPath(): string {
  const x = 49.4, z = -62.5, w = 3.6, h = 4.5, r = 0.8;
  return `M ${x + r} ${z} L ${x + w - r} ${z} Q ${x + w} ${z} ${x + w} ${z + r} L ${x + w} ${z + h - r} Q ${x + w} ${z + h} ${x + w - r} ${z + h} L ${x + r} ${z + h} Q ${x} ${z + h} ${x} ${z + h - r} L ${x} ${z + r} Q ${x} ${z} ${x + r} ${z} Z`;
}

/** Right circle (open). */
export function rightCirclePath(): string {
  const cx = 51, cz = -68, r = 2.2;
  return `M ${cx + r} ${cz} A ${r} ${r} 0 0 1 ${cx - r} ${cz} A ${r} ${r} 0 0 1 ${cx + r} ${cz}`;
}

/** Right curve from bottom of rounded rect to top of circle. */
export function rightCurvePath(): string {
  const rectBottom = -62.5 + 4.5;
  const circleTop = -68 + 2.2;
  return `M 51 ${rectBottom} Q 53 -62 51 ${circleTop}`;
}

/** Dot positions for left rounded rect [x, z] (two dots stacked). */
export function leftRoundedRectDots(): [number, number][] {
  const cx = 28, z1 = -66, z2 = -69;
  return [[cx, z1], [cx, z2]];
}

/** Dot positions for right rounded rect. */
export function rightRoundedRectDots(): [number, number][] {
  const cx = 51, z1 = -64.5, z2 = -66.5;
  return [[cx, z1], [cx, z2]];
}
