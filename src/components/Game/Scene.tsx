import { RigidBody } from '@react-three/rapier';
import { Box, Sphere } from '@react-three/drei';
import Car from './Car';

export default function Scene() {
  return (
    <>
      {/* Ground */}
      <RigidBody type="fixed" friction={2}>
        <Box args={[100, 1, 100]} position={[0, -0.5, 0]} receiveShadow>
          <meshStandardMaterial color="#1e293b" />
        </Box>
      </RigidBody>

      {/* Walls */}
      <RigidBody type="fixed">
         <Box args={[100, 10, 1]} position={[0, 4.5, -50]} receiveShadow>
            <meshStandardMaterial color="#334155" />
         </Box>
         <Box args={[100, 10, 1]} position={[0, 4.5, 50]} receiveShadow>
            <meshStandardMaterial color="#334155" />
         </Box>
         <Box args={[1, 10, 100]} position={[-50, 4.5, 0]} receiveShadow>
            <meshStandardMaterial color="#334155" />
         </Box>
         <Box args={[1, 10, 100]} position={[50, 4.5, 0]} receiveShadow>
            <meshStandardMaterial color="#334155" />
         </Box>
      </RigidBody>

      {/* Ball */}
      <RigidBody colliders="ball" restitution={1.2} position={[0, 5, 0]}>
        <Sphere args={[2]} castShadow>
          <meshStandardMaterial color="hotpink" emissive="hotpink" emissiveIntensity={0.5} />
        </Sphere>
      </RigidBody>

      {/* Player Car */}
      <Car position={[0, 2, 10]} />
    </>
  );
}
