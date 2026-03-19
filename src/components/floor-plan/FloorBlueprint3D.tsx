/**
 * 3D Floor Blueprint — interactive Three.js floor plan with extruded zones,
 * floating labels, animated point markers, and game-style navigation.
 *
 * Uses React Three Fiber + Drei.
 */

import { useMemo, useState, useRef, useCallback, useEffect, Suspense } from "react";
import { Canvas, useLoader, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text, RoundedBox, Line } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { arToImageOnPlan } from "@/lib/mapCoordinates";

/* ── Re-export shared types ──────────────────────────────────────── */

export interface PersonOnMap {
  id: string;
  x: number;
  y: number;
  userName?: string;
}

export interface MapZoneData {
  zone_id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface FloorBlueprint3DProps {
  floorPlanImage: string;
  planWidth: number;
  planHeight: number;
  width?: number | string;
  height?: number | string;
  className?: string;
  people?: PersonOnMap[];
  zones?: MapZoneData[];
  blockedZones?: Set<string>;
  onZoneToggle?: (zoneId: string) => void;
  /** Saved line path (image pixel coords), e.g. from Zone Editor */
  navPathPoints?: { x: number; y: number }[];
}

function imgToWorld(
  imgX: number,
  imgY: number,
  pw: number,
  ph: number,
  worldW: number,
  worldD: number,
): { wx: number; wz: number } {
  return {
    wx: (imgX / pw) * worldW,
    wz: (imgY / ph) * worldD,
  };
}

/* ── Floor plane ─────────────────────────────────────────────────── */

function FloorPlane({
  image,
  worldW,
  worldD,
}: {
  image: string;
  worldW: number;
  worldD: number;
}) {
  const texture = useLoader(THREE.TextureLoader, image);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[worldW / 2, 0, worldD / 2]} receiveShadow>
      <planeGeometry args={[worldW, worldD]} />
      <meshStandardMaterial map={texture} side={THREE.DoubleSide} roughness={0.9} metalness={0} />
    </mesh>
  );
}

/* ── Zone block ──────────────────────────────────────────────────── */

const ZONE_H = 0.6;
const GREEN = new THREE.Color("#22c55e");
const GREEN_HV = new THREE.Color("#4ade80");
const RED = new THREE.Color("#ef4444");
const RED_HV = new THREE.Color("#f87171");
const ORANGE = new THREE.Color("#f97316");
const ORANGE_HV = new THREE.Color("#fb923c");
const PURPLE = new THREE.Color("#a855f7");
const PURPLE_HV = new THREE.Color("#c084fc");

function ZoneBlock({
  zone,
  isBlocked,
  onToggle,
  pw,
  ph,
  worldW,
  worldD,
}: {
  zone: MapZoneData;
  isBlocked: boolean;
  onToggle: () => void;
  pw: number;
  ph: number;
  worldW: number;
  worldD: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { wx, wz } = imgToWorld(zone.x, zone.y, pw, ph, worldW, worldD);
  const w3 = (zone.w / pw) * worldW;
  const d3 = (zone.h / ph) * worldD;
  
  let targetColor = hovered ? GREEN_HV : GREEN;
  let dotColor = "#22c55e";

  if (isBlocked) {
    targetColor = hovered ? RED_HV : RED;
    dotColor = "#ef4444";
  } else if (zone.zone_type === "fire_exit") {
    targetColor = hovered ? ORANGE_HV : ORANGE;
    dotColor = "#f97316";
  } else if (zone.zone_type === "vip") {
    targetColor = hovered ? PURPLE_HV : PURPLE;
    dotColor = "#a855f7";
  } else if (zone.zone_type === "restricted") { 
    targetColor = hovered ? RED_HV : RED;
    dotColor = "#ef4444";
  }

  const color = targetColor;

  useFrame(() => {
    if (!ref.current) return;
    (ref.current.material as THREE.MeshStandardMaterial).color.lerp(color, 0.12);
  });

  return (
    <group>
      <RoundedBox
        ref={ref}
        args={[w3, ZONE_H, d3]}
        radius={0.06}
        smoothness={4}
        position={[wx + w3 / 2, ZONE_H / 2 + 0.01, wz + d3 / 2]}
        castShadow
        receiveShadow
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerLeave={() => { setHovered(false); document.body.style.cursor = "auto"; }}
      >
        <meshStandardMaterial transparent opacity={hovered ? 0.75 : 0.55} roughness={0.3} metalness={0.1} />
      </RoundedBox>

      <Text
        position={[wx + w3 / 2, ZONE_H + 0.25, wz + d3 / 2]}
        fontSize={Math.min(0.32, w3 * 0.28)}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.025}
        outlineColor="#000000"
        font={undefined}
      >
        {zone.label}
      </Text>

      <mesh position={[wx + w3 / 2, ZONE_H + 0.5, wz + d3 / 2]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color={dotColor}
          emissive={dotColor}
          emissiveIntensity={0.6}
        />
      </mesh>
    </group>
  );
}

/* ── Person pin ──────────────────────────────────────────────────── */

function PersonPin({ position, label }: { position: [number, number, number]; label: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<THREE.Group>(null);
  
  const off = useMemo(() => Math.random() * Math.PI * 2, []);
  
  // Create randomized wander path parameters
  const wanderRadius = useMemo(() => 0.5 + Math.random() * 1.5, []);
  const wanderSpeedX = useMemo(() => 0.2 + Math.random() * 0.3, []);
  const wanderSpeedZ = useMemo(() => 0.2 + Math.random() * 0.3, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    
    // Vertical bobbing (only the model)
    if (meshRef.current) meshRef.current.position.y = position[1] + Math.sin(t * 2 + off) * 0.05;

    // Horizontal wandering (the whole group)
    if (groupRef.current) {
      const offsetX = Math.sin(t * wanderSpeedX + off) * wanderRadius;
      const offsetZ = Math.cos(t * wanderSpeedZ + off * 2) * wanderRadius;
      groupRef.current.position.x = position[0] + offsetX;
      groupRef.current.position.z = position[2] + offsetZ;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} position={[0, position[1], 0]} castShadow>
        <sphereGeometry args={[0.08, 18, 18]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.4} roughness={0.2} metalness={0.3} />
      </mesh>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.06, 0.11, 20]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <group ref={textRef} position={[0, position[1] + 0.2, 0]}>
        <Text fontSize={0.11} color="white" anchorX="center" anchorY="middle" outlineWidth={0.012} outlineColor="#1e3a5f" font={undefined}>
          {label}
        </Text>
      </group>
    </group>
  );
}

/* ── Game-style camera controller (moves camera + target together) ─ */

const PAN_SPEED = 0.18;
const ZOOM_SPEED = 0.35;
const ROTATE_SPEED = 0.03;

function GameCameraController({
  pressedRef,
  controlsRef,
}: {
  pressedRef: React.RefObject<Set<string>>;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();

  useFrame(() => {
    const keys = pressedRef.current;
    if (!keys || keys.size === 0 || !controlsRef.current) return;

    const ctrl = controlsRef.current;
    const target = ctrl.target;

    // Camera forward/right projected onto XZ plane
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const delta = new THREE.Vector3();

    // WASD / Arrows → pan both camera AND target together
    if (keys.has("ArrowUp") || keys.has("w")) delta.addScaledVector(forward, PAN_SPEED);
    if (keys.has("ArrowDown") || keys.has("s")) delta.addScaledVector(forward, -PAN_SPEED);
    if (keys.has("ArrowLeft") || keys.has("a")) delta.addScaledVector(right, -PAN_SPEED);
    if (keys.has("ArrowRight") || keys.has("d")) delta.addScaledVector(right, PAN_SPEED);

    if (delta.lengthSq() > 0) {
      camera.position.add(delta);
      target.add(delta);
      ctrl.update();
    }

    // Zoom: move camera along camera→target direction
    if (keys.has("q") || keys.has("+") || keys.has("=")) {
      const dir = new THREE.Vector3().subVectors(target, camera.position).normalize();
      if (camera.position.distanceTo(target) > 2) {
        camera.position.addScaledVector(dir, ZOOM_SPEED);
        ctrl.update();
      }
    }
    if (keys.has("e") || keys.has("-")) {
      const dir = new THREE.Vector3().subVectors(target, camera.position).normalize();
      if (camera.position.distanceTo(target) < 30) {
        camera.position.addScaledVector(dir, -ZOOM_SPEED);
        ctrl.update();
      }
    }

    // Rotate: orbit camera around current target
    if (keys.has("r")) {
      const offset = camera.position.clone().sub(target);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), ROTATE_SPEED);
      camera.position.copy(target).add(offset);
      camera.lookAt(target);
      ctrl.update();
    }
    if (keys.has("f")) {
      const offset = camera.position.clone().sub(target);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -ROTATE_SPEED);
      camera.position.copy(target).add(offset);
      camera.lookAt(target);
      ctrl.update();
    }
  });

  return null;
}

/* ── Loading fallback ────────────────────────────────────────────── */

function LoadingPlane({ worldW, worldD }: { worldW: number; worldD: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[worldW / 2, 0, worldD / 2]}>
      <planeGeometry args={[worldW, worldD]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
  );
}

/* ── On-screen game controls ─────────────────────────────────────── */

const btn =
  "w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold select-none transition-all duration-100 active:scale-90 shadow-lg";
const btnDark = `${btn} bg-slate-800/80 hover:bg-slate-700 border border-white/10`;
const btnBlue = `${btn} bg-blue-600/80 hover:bg-blue-500 border border-white/10`;

function GameControls({ pressedRef }: { pressedRef: React.MutableRefObject<Set<string>> }) {
  const hold = (key: string) => {
    pressedRef.current.add(key);
    const up = () => {
      pressedRef.current.delete(key);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
  };

  const Arrow = ({ d }: { d: string }) => (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d={d} /></svg>
  );

  return (
    <div className="absolute bottom-4 right-4 z-10 flex flex-col items-center gap-2 pointer-events-auto">
      {/* D-pad */}
      <div className="grid grid-cols-3 gap-1.5">
        <div />
        <button className={btnDark} onMouseDown={() => hold("ArrowUp")} onTouchStart={() => hold("ArrowUp")} title="Forward (W)">
          <Arrow d="M8 2l5 8H3z" />
        </button>
        <div />
        <button className={btnDark} onMouseDown={() => hold("ArrowLeft")} onTouchStart={() => hold("ArrowLeft")} title="Left (A)">
          <Arrow d="M2 8l8-5v10z" />
        </button>
        <div className={`${btn} bg-slate-600/40 border border-white/5`}>
          <Arrow d="M8 2l2 4h-4zM8 14l-2-4h4zM2 8l4-2v4zM14 8l-4 2V6z" />
        </div>
        <button className={btnDark} onMouseDown={() => hold("ArrowRight")} onTouchStart={() => hold("ArrowRight")} title="Right (D)">
          <Arrow d="M14 8l-8 5V3z" />
        </button>
        <div />
        <button className={btnDark} onMouseDown={() => hold("ArrowDown")} onTouchStart={() => hold("ArrowDown")} title="Backward (S)">
          <Arrow d="M8 14l-5-8h10z" />
        </button>
        <div />
      </div>

      {/* Zoom + Rotate */}
      <div className="flex gap-1.5">
        <button className={btnBlue} onMouseDown={() => hold("q")} onTouchStart={() => hold("q")} title="Zoom In (Q)">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M7 3v4H3v2h4v4h2V9h4V7H9V3z" /></svg>
        </button>
        <button className={btnBlue} onMouseDown={() => hold("e")} onTouchStart={() => hold("e")} title="Zoom Out (E)">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M3 7h10v2H3z" /></svg>
        </button>
        <button className={btnDark} onMouseDown={() => hold("r")} onTouchStart={() => hold("r")} title="Rotate Left (R)">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M4 8a4 4 0 017-2.6V3l3 2.5L11 8V5.8A2.5 2.5 0 104.2 9L3 9.5A4 4 0 014 8z" /></svg>
        </button>
        <button className={btnDark} onMouseDown={() => hold("f")} onTouchStart={() => hold("f")} title="Rotate Right (F)">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" style={{ transform: "scaleX(-1)" }}><path d="M4 8a4 4 0 017-2.6V3l3 2.5L11 8V5.8A2.5 2.5 0 104.2 9L3 9.5A4 4 0 014 8z" /></svg>
        </button>
      </div>

      <span className="text-[9px] text-white/50 font-medium tracking-wide">
        WASD / Arrows
      </span>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────── */

export function FloorBlueprint3D({
  floorPlanImage,
  planWidth,
  planHeight,
  width = "100%",
  height = "100%",
  className = "",
  people = [],
  zones = [],
  blockedZones = new Set<string>(),
  onZoneToggle,
  navPathPoints = [],
}: FloorBlueprint3DProps) {
  const worldW = 32;
  const worldD = (planHeight / planWidth) * worldW;
  const pressedRef = useRef(new Set<string>());
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      pressedRef.current.add(k);
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      pressedRef.current.delete(k);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  const trafficPoints = useMemo(() => {
    return people.map((p) => {
      const img = arToImageOnPlan(p.x, p.y, planWidth, planHeight);
      const { wx, wz } = imgToWorld(img.x, img.y, planWidth, planHeight, worldW, worldD);
      return { id: p.id, wx, wz, label: p.userName ?? p.id };
    });
  }, [people, planWidth, planHeight, worldW, worldD]);

  const handleToggle = useCallback(
    (zoneId: string) => onZoneToggle?.(zoneId),
    [onZoneToggle]
  );

  return (
    <div className={`${className} relative`} style={{ width, height, minHeight: 400 }}>
      <Canvas
        shadows
        camera={{ position: [worldW / 2, 16, worldD + 14], fov: 48, near: 0.1, far: 400 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#ffffff", borderRadius: 12 }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight
          position={[worldW, 22, -8]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-worldW}
          shadow-camera-right={worldW}
          shadow-camera-top={worldD}
          shadow-camera-bottom={-worldD}
        />
        <directionalLight position={[-8, 14, worldD]} intensity={0.4} />
        <hemisphereLight args={["#ffffff", "#f0fdf4", 0.4]} />

        <Suspense fallback={<LoadingPlane worldW={worldW} worldD={worldD} />}>
          <FloorPlane image={floorPlanImage} worldW={worldW} worldD={worldD} />
        </Suspense>

        {zones.map((zone) => (
          <ZoneBlock
            key={zone.zone_id}
            zone={zone}
            isBlocked={blockedZones.has(zone.zone_id)}
            onToggle={() => handleToggle(zone.zone_id)}
            pw={planWidth}
            ph={planHeight}
            worldW={worldW}
            worldD={worldD}
          />
        ))}

        {trafficPoints.map((p) => (
          <PersonPin key={p.id} position={[p.wx, 0.45, p.wz]} label={p.label} />
        ))}

        <GameCameraController pressedRef={pressedRef} controlsRef={controlsRef} />

        <OrbitControls
          ref={controlsRef}
          makeDefault
          target={[worldW / 2, 0, worldD / 2]}
          minPolarAngle={0.1}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={3}
          maxDistance={55}
          enableDamping
          dampingFactor={0.08}
          enablePan
          panSpeed={0.8}
        />
      </Canvas>

      <GameControls pressedRef={pressedRef} />
    </div>
  );
}

export default FloorBlueprint3D;
