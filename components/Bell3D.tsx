import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Environment, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Fix for missing JSX intrinsic elements definitions for React Three Fiber
declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      group: any;
      latheGeometry: any;
      meshStandardMaterial: any;
      sphereGeometry: any;
      torusGeometry: any;
      cylinderGeometry: any;
      boxGeometry: any;
      pointLight: any;
      planeGeometry: any;
      bufferGeometry: any;
      bufferAttribute: any;
      pointsMaterial: any;
      points: any;
      coneGeometry: any;
      color: any;
      fog: any;
      ambientLight: any;
      hemisphereLight: any;
      directionalLight: any;
      spotLight: any;
    }
  }
}

const Bonsho: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  const points = useMemo(() => {
    const p = [];
    p.push(new THREE.Vector2(1.8, -1.5));
    p.push(new THREE.Vector2(1.85, -1.3));
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const x = 1.8 - (t * 0.6);
      const y = -1.3 + (t * 2.8);
      p.push(new THREE.Vector2(x, y));
    }
    p.push(new THREE.Vector2(0.8, 1.6));
    p.push(new THREE.Vector2(0, 1.6));
    return p;
  }, []);

  const nubs = useMemo(() => {
    const items = [];
    const rows = 4;
    const cols = 27; 
    const radiusStart = 1.2;
    const heightStart = 0.5;
    const heightStep = 0.25;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const angle = (c / cols) * Math.PI * 2;
        const h = heightStart + (r * heightStep);
        const currentRad = 1.6 - (h * 0.2); 
        items.push(
          <mesh key={`${r}-${c}`} position={[
            Math.cos(angle) * currentRad,
            h,
            Math.sin(angle) * currentRad
          ]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#5d4037" metalness={0.8} roughness={0.4} />
          </mesh>
        );
      }
    }
    return items;
  }, []);
  
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    
    // Gentle Sway Animation
    // We rotate the parent group which is positioned at the hanging point (pivot)
    if (groupRef.current) {
      // Compound sine waves for organic, non-repetitive feeling sway
      groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.015 + Math.sin(t * 1.1) * 0.005;
      groupRef.current.rotation.x = Math.sin(t * 0.3) * 0.01 + Math.cos(t * 0.7) * 0.003;
    }

    // Subtle Shimmer Effect
    // Pulse the emissive intensity to give a "breathing" life-like metallic sheen
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 0.05 + Math.sin(t * 2.5) * 0.03;
    }
  });
  
  // Adjusted structure for proper pivoting:
  // The outer group is positioned at the pivot point (Ryuzu location in world space ~ y=2.7).
  // The inner group is offset downwards so the bell geometry sits correctly relative to the pivot.
  return (
    <group ref={groupRef} position={[0, 2.7, 0]}>
      <group position={[0, -1.7, 0]}>
        <mesh castShadow receiveShadow>
          <latheGeometry args={[points, 64]} />
          <meshStandardMaterial 
            ref={materialRef}
            color="#6d5440" 
            metalness={0.7} 
            roughness={0.4}
            envMapIntensity={1.5}
            emissive="#4a3b2a"
            emissiveIntensity={0.05}
          />
        </mesh>
        
        <group>{nubs}</group>

        {/* Ryuzu */}
        <group position={[0, 1.7, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.3, 0.1, 16, 32]} />
            <meshStandardMaterial color="#3e2723" metalness={0.8} roughness={0.4} />
          </mesh>
        </group>
        
        {/* Decorative Bands */}
        <mesh position={[0, -0.5, 0]}>
          <cylinderGeometry args={[1.56, 1.6, 0.1, 64, 1, true]} />
          <meshStandardMaterial color="#3e2723" metalness={0.7} roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.8, 0]}>
          <cylinderGeometry args={[1.35, 1.38, 0.1, 64, 1, true]} />
          <meshStandardMaterial color="#3e2723" metalness={0.7} roughness={0.5} side={THREE.DoubleSide} />
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
  const { viewport, mouse } = useThree();
  const pullRef = useRef(0); 
  const velocityRef = useRef(0);
  const stateRef = useRef<'idle' | 'dragging' | 'swinging'>('idle');

  const REST_X = 5.0;
  const STRIKE_X = 1.8;
  const MAX_PULL = 8.5;

  const onPointerDown = (e: any) => {
    e.stopPropagation();
    stateRef.current = 'dragging';
    controlsEnabled(false);
  };

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (stateRef.current === 'dragging') {
      const x = (mouse.x * viewport.width) / 2 + 5;
      pullRef.current = THREE.MathUtils.clamp(x, REST_X, MAX_PULL);
      meshRef.current.position.x = pullRef.current;
    } else if (stateRef.current === 'swinging') {
      const force = (STRIKE_X - meshRef.current.position.x) * 45;
      velocityRef.current += force * delta;
      velocityRef.current *= 0.96; 
      meshRef.current.position.x += velocityRef.current * delta;

      if (meshRef.current.position.x <= STRIKE_X && velocityRef.current < 0) {
        onStrike();
        velocityRef.current *= -0.3; 
        stateRef.current = 'idle';
      }
    } else {
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, REST_X, 0.05);
      velocityRef.current = 0;
    }
  });

  useEffect(() => {
    const handlePointerUp = () => {
      if (stateRef.current === 'dragging') {
        stateRef.current = 'swinging';
        controlsEnabled(true);
      }
    };
    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, [controlsEnabled]);

  return (
    <group 
      ref={meshRef} 
      position={[REST_X, 1.0, 0]} 
      onPointerDown={onPointerDown}
    >
      {/* The Beam */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.25, 0.3, 4.5, 16]} />
        <meshStandardMaterial color="#8d6e63" roughness={0.7} />
      </mesh>
      {/* End caps */}
      <mesh position={[2.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.32, 0.32, 0.1, 16]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      
      {/* Ropes hanging from ceiling */}
      <group position={[0, 2, 0]}>
         <mesh position={[-1.5, 0, 0]}>
           <cylinderGeometry args={[0.03, 0.03, 4]} />
           <meshStandardMaterial color="#d7ccc8" />
         </mesh>
         <mesh position={[1.5, 0, 0]}>
           <cylinderGeometry args={[0.03, 0.03, 4]} />
           <meshStandardMaterial color="#d7ccc8" />
         </mesh>
      </group>
    </group>
  );
};

const Lantern: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* Cord */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.5]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* Frame Top */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.7, 0.1, 0.7]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Light Body */}
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[0.5, 0.8, 0.5]} />
        <meshStandardMaterial color="#ffcc80" emissive="#ff9800" emissiveIntensity={1.0} toneMapped={false} />
      </mesh>
      {/* Frame Bottom */}
      <mesh position={[0, -0.8, 0]}>
        <boxGeometry args={[0.6, 0.1, 0.6]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Strong point light for local illumination */}
      <pointLight position={[0, -0.4, 0]} intensity={15} distance={15} color="#ffaa33" decay={2} />
    </group>
  );
};

const TempleStructure: React.FC = () => {
  return (
    <group position={[0, 0, 0]}>
      {/* Floor - Stone Pavement */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#555" roughness={0.8} />
      </mesh>
      
      {/* Pillars - Slightly lighter wood */}
      {/* Front Left */}
      <mesh position={[-4, 2, 4]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 10, 0.8]} />
        <meshStandardMaterial color="#5d4037" roughness={0.7} />
      </mesh>
      {/* Front Right */}
      <mesh position={[4, 2, 4]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 10, 0.8]} />
        <meshStandardMaterial color="#5d4037" roughness={0.7} />
      </mesh>
      {/* Back Left */}
      <mesh position={[-4, 2, -4]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 10, 0.8]} />
        <meshStandardMaterial color="#4e342e" roughness={0.7} />
      </mesh>
      {/* Back Right */}
      <mesh position={[4, 2, -4]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 10, 0.8]} />
        <meshStandardMaterial color="#4e342e" roughness={0.7} />
      </mesh>

      {/* Cross Beams */}
      <mesh position={[0, 6, 4]} castShadow>
        <boxGeometry args={[10, 0.6, 0.6]} />
        <meshStandardMaterial color="#6d4c41" />
      </mesh>
      <mesh position={[0, 6, -4]} castShadow>
        <boxGeometry args={[10, 0.6, 0.6]} />
        <meshStandardMaterial color="#6d4c41" />
      </mesh>
      <mesh position={[-4, 6, 0]} rotation={[0, Math.PI/2, 0]} castShadow>
        <boxGeometry args={[10, 0.6, 0.6]} />
        <meshStandardMaterial color="#6d4c41" />
      </mesh>
      <mesh position={[4, 6, 0]} rotation={[0, Math.PI/2, 0]} castShadow>
        <boxGeometry args={[10, 0.6, 0.6]} />
        <meshStandardMaterial color="#6d4c41" />
      </mesh>

      {/* Roof Rafters (Simplified) */}
      <group position={[0, 6.5, 0]}>
         {[...Array(9)].map((_, i) => (
            <mesh key={i} position={[0, 0, (i - 4) * 1.5]} rotation={[0, 0, 0]} castShadow>
              <boxGeometry args={[12, 0.3, 0.3]} />
              <meshStandardMaterial color="#5d4037" />
            </mesh>
         ))}
         <mesh position={[0, 0.5, 0]} castShadow>
             <boxGeometry args={[0.8, 1, 12]} />
             <meshStandardMaterial color="#4e342e" />
         </mesh>
      </group>

      {/* Lanterns */}
      <Lantern position={[-3.2, 4.5, 3.2]} />
      <Lantern position={[3.2, 4.5, 3.2]} />
      <Lantern position={[-3.2, 4.5, -3.2]} />
      <Lantern position={[3.2, 4.5, -3.2]} />
    </group>
  );
};

const Snow: React.FC = () => {
  const count = 400;
  const mesh = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const temp = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      temp[i * 3] = (Math.random() - 0.5) * 20;
      temp[i * 3 + 1] = Math.random() * 10;
      temp[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (!mesh.current) return;
    const positions = mesh.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] -= 0.03; 
      if (positions[i * 3 + 1] < -2) {
        positions[i * 3 + 1] = 8;
      }
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#fff" transparent opacity={0.6} />
    </points>
  );
};

const Tree: React.FC<{ position: [number, number, number], scale?: number }> = ({ position, scale = 1 }) => {
    return (
        <group position={position} scale={scale}>
            <mesh position={[0, 2, 0]}>
                <coneGeometry args={[1, 4, 8]} />
                <meshStandardMaterial color="#2a3a30" roughness={1} />
            </mesh>
            <mesh position={[0, 4, 0]}>
                <coneGeometry args={[0.8, 3, 8]} />
                <meshStandardMaterial color="#2a3a30" roughness={1} />
            </mesh>
            <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.2, 0.3, 1]} />
                <meshStandardMaterial color="#2a1a10" />
            </mesh>
        </group>
    )
}

const BackgroundTrees: React.FC = () => {
    return (
        <group>
            <Tree position={[-8, -2.5, -8]} scale={1.5} />
            <Tree position={[8, -2.5, -10]} scale={1.8} />
            <Tree position={[-12, -2.5, -5]} scale={2} />
            <Tree position={[10, -2.5, -4]} scale={1.2} />
            <Tree position={[0, -2.5, -15]} scale={2.5} />
            <Tree position={[-5, -2.5, -12]} scale={1.8} />
            <Tree position={[5, -2.5, -12]} scale={2.0} />
        </group>
    )
}

const BellScene: React.FC<{ onStrike: () => void }> = ({ onStrike }) => {
  const [orbitEnabled, setOrbitEnabled] = useState(true);

  return (
    <>
      {/* Background & Fog */}
      <color attach="background" args={['#0a0a1a']} />
      <fog attach="fog" args={['#0a0a1a', 5, 30]} />
      
      {/* 1. Global Ambient Light - Raised base brightness */}
      <ambientLight intensity={0.4} color="#333344" />

      {/* 2. Hemisphere Light - Simulates Sky/Ground reflection (Fill) */}
      <hemisphereLight args={['#6666aa', '#332222', 0.6]} />

      {/* 3. Key Light (Moon) - Strong cold light from left */}
      <directionalLight 
        position={[-5, 8, 5]} 
        intensity={2.5} 
        color="#ddeeff" 
        castShadow
        shadow-bias={-0.001}
      />

      {/* 4. Fill Light (Warm) - Strong warm light from front-right (simulating temple lighting) */}
      <spotLight
        position={[4, 4, 8]}
        angle={0.8}
        penumbra={0.5}
        intensity={8.0}
        color="#ffaa77"
        castShadow
        distance={25}
      />
      
      {/* 5. Rim Light (Back) - Defines silhouette */}
      <spotLight
        position={[-5, 5, -5]}
        angle={0.5}
        penumbra={0.5}
        intensity={4.0}
        color="#5566ff"
        distance={20}
      />
      
      <TempleStructure />
      <Bonsho />
      <Shumoku onStrike={onStrike} controlsEnabled={setOrbitEnabled} />
      <Snow />
      <BackgroundTrees />

      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
      <OrbitControls 
        enabled={orbitEnabled} 
        enableZoom={true} 
        enablePan={false} 
        maxPolarAngle={Math.PI / 1.9} 
        minPolarAngle={Math.PI / 4}
        minDistance={5}
        maxDistance={15}
      />
      <PerspectiveCamera makeDefault position={[0, 2, 9]} fov={50} />
    </>
  );
};

const Bell3D: React.FC<{ onStrike: () => void }> = ({ onStrike }) => {
  return (
    <div className="w-full h-full bg-black relative">
      <Canvas shadows dpr={[1, 2]}>
        <BellScene onStrike={onStrike} />
      </Canvas>
      <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none text-white/80 text-xs md:text-sm font-bold uppercase tracking-widest bg-black/40 px-6 py-2 rounded-full backdrop-blur-sm border border-white/20">
        突き棒を後ろに引いて離してください
      </div>
    </div>
  );
};

export default Bell3D;