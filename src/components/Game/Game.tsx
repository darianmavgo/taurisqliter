import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense } from 'react';
import { Environment, OrbitControls } from '@react-three/drei';
import Scene from './Scene';
import './Game.css';

export default function Game({ onExit }: { onExit: () => void }) {
  return (
    <div className="game-container">
      <div className="game-ui">
        <button className="exit-btn" onClick={onExit}>Exit Game</button>
      </div>
      <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
        <Suspense fallback={null}>
          <Environment preset="sunset" />
          <ambientLight intensity={0.5} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={1.5} 
            castShadow 
          />
          <Physics gravity={[0, -9.81, 0]}>
            <Scene />
          </Physics>
          <OrbitControls />
        </Suspense>
      </Canvas>
    </div>
  );
}
