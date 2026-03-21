import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMission } from "@/contexts/MissionContext";

const agentPositions: Record<string, [number, number, number]> = {
  planner: [0, 1.6, 0],
  research: [-1.6, 0.4, 0.4],
  call: [1.6, 0.4, 0.4],
  negotiation: [-1.1, -1.1, 0.2],
  scheduler: [1.1, -1.1, 0.2],
};

const agentColors: Record<string, string> = {
  planner: "#a855f7",
  research: "#22d3ee",
  call: "#22c55e",
  negotiation: "#f59e0b",
  scheduler: "#3b82f6",
};

function AgentNode({ position, color, isActive }: {
  position: [number, number, number];
  color: string;
  isActive: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const s = isActive ? 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1 : 1;
      meshRef.current.scale.setScalar(s);
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * (isActive ? 2 : 0.8) + position[0]) * 0.05;
    }
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = isActive
        ? 0.15 + Math.sin(state.clock.elapsedTime * 2) * 0.08
        : 0.04;
    }
  });

  return (
    <group position={position}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.05} />
      </mesh>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.15, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isActive ? 0.8 : 0.15}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
    </group>
  );
}

function DataFlowLine({ from, to, active, color }: {
  from: [number, number, number];
  to: [number, number, number];
  active: boolean;
  color: string;
}) {
  const particleRef = useRef<THREE.Mesh>(null);

  const curve = useMemo(() => {
    const mid: [number, number, number] = [
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2 + 0.35,
      (from[2] + to[2]) / 2 + 0.25,
    ];
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...from),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...to)
    );
  }, [from, to]);

  const tubeGeo = useMemo(() => new THREE.TubeGeometry(curve, 16, 0.012, 6, false), [curve]);

  useFrame((state) => {
    if (particleRef.current && active) {
      const t = (state.clock.elapsedTime * 0.6) % 1;
      const point = curve.getPoint(t);
      particleRef.current.position.copy(point);
    }
  });

  return (
    <group>
      <mesh geometry={tubeGeo}>
        <meshBasicMaterial color={color} transparent opacity={active ? 0.45 : 0.08} />
      </mesh>
      {active && (
        <mesh ref={particleRef}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
}

function RotatingGroup({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.08;
    }
  });
  return <group ref={groupRef}>{children}</group>;
}

const allLinks = [
  { from: "planner", to: "research" },
  { from: "planner", to: "call" },
  { from: "planner", to: "negotiation" },
  { from: "planner", to: "scheduler" },
  { from: "research", to: "call" },
  { from: "call", to: "negotiation" },
  { from: "negotiation", to: "scheduler" },
  { from: "research", to: "negotiation" },
];

function NetworkScene() {
  const { agents } = useMission();

  const activeLinks = useMemo(() => {
    const links = new Set<string>();
    agents.forEach((agent) => {
      if (agent.listeningTo) {
        const src = agents.find((a) => a.id === agent.listeningTo);
        if (src) links.add(`${src.id}-${agent.id}`);
      }
      if (agent.status !== "idle") {
        links.add(`planner-${agent.id}`);
      }
    });
    return links;
  }, [agents]);

  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[4, 4, 4]} intensity={0.7} color="#a855f7" />
      <pointLight position={[-4, 2, 2]} intensity={0.35} color="#22d3ee" />

      <RotatingGroup>
        {allLinks.map((link) => {
          const isActive = activeLinks.has(`${link.from}-${link.to}`) || activeLinks.has(`${link.to}-${link.from}`);
          return (
            <DataFlowLine
              key={`${link.from}-${link.to}`}
              from={agentPositions[link.from]}
              to={agentPositions[link.to]}
              active={isActive}
              color={agentColors[link.from]}
            />
          );
        })}

        {agents.map((agent) => (
          <AgentNode
            key={agent.id}
            position={agentPositions[agent.id]}
            color={agentColors[agent.id] || "#a855f7"}
            isActive={agent.status !== "idle"}
          />
        ))}
      </RotatingGroup>
    </>
  );
}

export function AgentNetworkGraph() {
  return (
    <div className="w-full h-full min-h-[200px] rounded-lg overflow-hidden relative">
      <div className="absolute top-2 left-2 z-10">
        <h2 className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse-glow" />
          Agent Network
        </h2>
      </div>
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 50 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <NetworkScene />
      </Canvas>
    </div>
  );
}
