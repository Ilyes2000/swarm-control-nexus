import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Text, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useMission } from "@/contexts/MissionContext";

const agentPositions: Record<string, [number, number, number]> = {
  planner: [0, 1.8, 0],
  research: [-1.8, 0.5, 0.5],
  call: [1.8, 0.5, 0.5],
  negotiation: [-1.2, -1.2, 0.3],
  scheduler: [1.2, -1.2, 0.3],
};

const agentColors: Record<string, string> = {
  planner: "#a855f7",
  research: "#22d3ee",
  call: "#22c55e",
  negotiation: "#f59e0b",
  scheduler: "#3b82f6",
};

function AgentNode({ id, position, isActive, emoji }: {
  id: string;
  position: [number, number, number];
  isActive: boolean;
  emoji: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const color = agentColors[id] || "#a855f7";

  useFrame((state) => {
    if (meshRef.current) {
      const scale = isActive ? 1 + Math.sin(state.clock.elapsedTime * 3) * 0.08 : 1;
      meshRef.current.scale.setScalar(scale);
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(isActive ? 1.6 + Math.sin(state.clock.elapsedTime * 2) * 0.2 : 1.3);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = isActive ? 0.15 + Math.sin(state.clock.elapsedTime * 2) * 0.08 : 0.05;
    }
  });

  return (
    <Float speed={isActive ? 3 : 1} rotationIntensity={0.1} floatIntensity={isActive ? 0.3 : 0.1}>
      <group position={position}>
        {/* Glow sphere */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.1} />
        </mesh>
        {/* Main node */}
        <mesh ref={meshRef}>
          <sphereGeometry args={[0.2, 32, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={isActive ? 0.8 : 0.2}
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>
        {/* Label */}
        <Text
          position={[0, -0.35, 0]}
          fontSize={0.12}
          color="white"
          anchorX="center"
          anchorY="top"
          font="https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxTOlOTk6OThhvA.woff"
        >
          {emoji} {id}
        </Text>
      </group>
    </Float>
  );
}

function DataFlowLine({ from, to, active, color }: {
  from: [number, number, number];
  to: [number, number, number];
  active: boolean;
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const particleRef = useRef<THREE.Mesh>(null);

  const curve = useMemo(() => {
    const mid: [number, number, number] = [
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2 + 0.4,
      (from[2] + to[2]) / 2 + 0.3,
    ];
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...from),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...to)
    );
  }, [from, to]);

  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 20, 0.015, 8, false);
  }, [curve]);

  useFrame((state) => {
    if (particleRef.current && active) {
      const t = (state.clock.elapsedTime * 0.5) % 1;
      const point = curve.getPoint(t);
      particleRef.current.position.copy(point);
    }
  });

  return (
    <group>
      <mesh geometry={tubeGeometry}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={active ? 0.5 : 0.1}
        />
      </mesh>
      {active && (
        <mesh ref={particleRef}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
}

function NetworkScene() {
  const { agents } = useMission();

  const connections = useMemo(() => {
    const activeAgents = agents.filter((a) => a.status !== "idle");
    const links: { from: string; to: string }[] = [];

    // Create links based on listening relationships
    agents.forEach((agent) => {
      if (agent.listeningTo) {
        const sourceAgent = agents.find((a) => a.name === agent.listeningTo);
        if (sourceAgent) links.push({ from: sourceAgent.id, to: agent.id });
      }
    });

    // Active agents connect to planner
    activeAgents.forEach((a) => {
      if (a.id !== "planner" && !links.some((l) => (l.from === a.id && l.to === "planner") || (l.from === "planner" && l.to === a.id))) {
        links.push({ from: "planner", to: a.id });
      }
    });

    return links;
  }, [agents]);

  const allPossibleLinks = useMemo(() => [
    { from: "planner", to: "research" },
    { from: "planner", to: "call" },
    { from: "planner", to: "negotiation" },
    { from: "planner", to: "scheduler" },
    { from: "research", to: "call" },
    { from: "call", to: "negotiation" },
    { from: "negotiation", to: "scheduler" },
    { from: "research", to: "negotiation" },
  ], []);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.8} color="#a855f7" />
      <pointLight position={[-5, 3, 3]} intensity={0.4} color="#22d3ee" />

      {/* All possible connection lines */}
      {allPossibleLinks.map((link) => {
        const isActive = connections.some(
          (c) => (c.from === link.from && c.to === link.to) || (c.from === link.to && c.to === link.from)
        );
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

      {/* Agent nodes */}
      {agents.map((agent) => (
        <AgentNode
          key={agent.id}
          id={agent.id}
          position={agentPositions[agent.id]}
          isActive={agent.status !== "idle"}
          emoji={agent.emoji}
        />
      ))}

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 1.5}
        minPolarAngle={Math.PI / 3}
      />
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
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <NetworkScene />
      </Canvas>
    </div>
  );
}
