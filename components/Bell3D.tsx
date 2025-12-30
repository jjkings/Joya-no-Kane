
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

const Bonsho: React.FC = () => {
  // Creating a more realistic bell profile
  const points = useMemo(() => {
    const p = [];
    // Lower lip (flared)
    p.push(new THREE.Vector2(1.8, -1.5));
    p.push(new THREE.Vector2(1.85, -1.3));
    // Main body (upside down cup tapering upwards)
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const x = 1.8 - (t * 0.6);
      const y = -1.3 + (t * 2.8);
      p.push(new THREE.Vector2(x, y));
    }
    // Top crown
    p.push(new THREE.Vector2(0.8, 1.6));
    p.push(new THREE.Vector2(0, 1.6));
    return p;
  }, []);

  // Chi (108 nubs) decoration
  const nubs = useMemo(() => {
    const items = [];
    const rows = 4;
    const cols = 27; // 4 rows * 27 = 108
    const radiusStart = 1.2;
    const heightStart = 0.5;
    const heightStep = 0.25;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const angle = (c / cols) * Math.PI * 2;
        const h = heightStart + (r * heightStep);
        // Approximate radius at this height based on tapering profile
        const currentRad = 1.6 - (h * 0.2); 
        items.push(
          <mesh key={`${r}-${c}`} position={[
            Math.cos(angle) * currentRad,
            h,
            Math.sin(angle) * currentRad
          ]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#3a2b1a" metalness={0.9} roughness={0.1} />
          </mesh>
        );
      }
    }
    return items;
  }, []);
  
  return (
    <group position={[0, 1.5, 0]}>
      {/* Main body of the bell */}
      <mesh castShadow receiveShadow>
        <latheGeometry args={[points, 64]} />
        <meshStandardMaterial 
          color="#3d2f21" 
          metalness={0.8} 
          roughness={0.4}
          envMapIntensity={1}
        />
      </mesh>
      
      {/* Nubs (Chi) */}
      <group>{nubs}</group>

      {/* Ryuzu (Dragon hanger - simplified) */}
      <group position={[0, 1.7, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.3, 0.1, 16, 32]} />
          <meshStandardMaterial color="#2a1b0a" metalness={1} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.4, 0.2, 0.2]} />
          <meshStandardMaterial color="#2a1b0a" metalness={1} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
};

const Shumoku: React.FC<{ 
  onStrike: () => void; 
  controlsEnabled: (val: boolean) => void;
}> = ({ onStrike, controlsEnabled }) => {
  const meshRef = useRef<THREE.Group>(null);
  const { viewport, mouse, size } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const pullRef = useRef(0); // Current pull distance (positive is away from bell)
  const velocityRef = useRef(0);
  const stateRef = useRef<'idle' | 'dragging' | 'swinging'>('idle');

  const REST_X = 5.5;
  const STRIKE_X = 1.8;
  const MAX_PULL = 8.5;

  const onPointerDown = (e: any) => {
    e.stopPropagation();
    setIsDragging(true);
    stateRef.current = 'dragging';
    controlsEnabled(false);
  };

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (stateRef.current === 'dragging') {
      // Calculate world units for dragging
      const x = (mouse.x * viewport.width) / 2 + 5; // offset to align with start pos
      pullRef.current = THREE.MathUtils.clamp(x, REST_X, MAX_PULL);
      meshRef.current.position.x = pullRef.current;
    } else if (stateRef.current === 'swinging') {
      // Spring physics toward STRIKE_X
      const force = (STRIKE_X - meshRef.current.position.x) * 45;
      velocityRef.current += force * delta;
      velocityRef.current *= 0.96; // damping
      meshRef.current.position.x += velocityRef.current * delta;

      // Detect collision
      if (meshRef.current.position.x <= STRIKE_X && velocityRef.current < 0) {
        onStrike();
        // Bounce back slightly
        velocityRef.current *= -0.3; 
        stateRef.current = 'idle';
      }
    } else {
      // Slowly return to REST_X if not at it
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, REST_X, 0.05);
      velocityRef.current = 0;
    }
  });

  useEffect(() => {
    const handlePointerUp = () => {
      if (stateRef.current === 'dragging') {
        stateRef.current = 'swinging';
        setIsDragging(false);
        controlsEnabled(true);
      }
    };
    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, [controlsEnabled]);

  return (
    <group 
      ref={meshRef} 
      position={[REST_X, 1.5, 0]} 
      onPointerDown={onPointerDown}
    >
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.25, 4.5, 32]} />
        <meshStandardMaterial color="#5d4037" roughness={0.8} />
      </mesh>
      {/* Ropes (simplified) */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 3, 8]} />
        <meshStandardMaterial color="#8d6e63" />
      </mesh>
      <mesh position={[0, 3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.1, 8, 0.1]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
};

interface BellSceneProps {
  onStrike: () => void;
}

const BellScene: React.FC<BellSceneProps> = ({ onStrike }) => {
  const [orbitEnabled, setOrbitEnabled] = useState(true);

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={2} castShadow />
      <spotLight position={[-10, 10, 0]} angle={0.3} penumbra={1} intensity={3} castShadow />
      <pointLight position={[2, 0, 5]} intensity={1} color="#ffaa55" />
      
      <Bonsho />
      <Shumoku onStrike={onStrike} controlsEnabled={setOrbitEnabled} />
      
      {/* Traditional Wooden Temple Structure (Simplified) */}
      <group position={[0, -2.5, 0]}>
        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color="#111" roughness={1} />
        </mesh>
        {/* Pillars */}
        <mesh position={[-4, 4, -4]}><boxGeometry args={[0.5, 8, 0.5]} /><meshStandardMaterial color="#221100" /></mesh>
        <mesh position={[4, 4, -4]}><boxGeometry args={[0.5, 8, 0.5]} /><meshStandardMaterial color="#221100" /></mesh>
        <mesh position={[-4, 4, 4]}><boxGeometry args={[0.5, 8, 0.5]} /><meshStandardMaterial color="#221100" /></mesh>
        <mesh position={[4, 4, 4]}><boxGeometry args={[0.5, 8, 0.5]} /><meshStandardMaterial color="#221100" /></mesh>
      </group>

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Environment preset="night" />
      <OrbitControls enabled={orbitEnabled} enableZoom={true} enablePan={false} maxPolarAngle={Math.PI / 1.8} />
      <PerspectiveCamera makeDefault position={[0, 3, 10]} fov={45} />
    </>
  );
};

const Bell3D: React.FC<BellSceneProps> = (props) => {
  return (
    <div className="w-full h-full bg-black">
      <Canvas shadows>
        <BellScene {...props} />
      </Canvas>
      <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none text-white/40 text-sm font-bold uppercase tracking-widest bg-black/30 px-4 py-1 rounded-full backdrop-blur-sm">
        突き棒を後ろに引いて離してください
      </div>
    </div>
  );
};

export default Bell3D;
