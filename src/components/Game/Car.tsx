import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, CuboidCollider, vec3 } from '@react-three/rapier';
import { Box } from '@react-three/drei';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import * as THREE from 'three';

export default function Car({ position = [0, 2, 0] }: { position?: [number, number, number] }) {
  const rigidBody = useRef<RapierRigidBody>(null);
  const controls = useKeyboardControls();
  
  // Tuning
  const speed = 50;
  const turnSpeed = 4;
  const drag = 0.98;

  useFrame((_, delta) => {
    if (!rigidBody.current) return;

    const body = rigidBody.current;
    const velocity = body.linvel();
    const rotation = body.rotation();
    
    // Quaternion magic to get forward/right vectors
    const quat = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);

    // Controls
    let driveImpulse = 0;
    if (controls.forward) driveImpulse += speed * delta;
    if (controls.backward) driveImpulse -= speed * delta;
    if (controls.boost) driveImpulse *= 2;

    let turnTorque = 0;
    // Only turn if moving (arcade mechanic)
    const movingSpeed = vec3(velocity).length();
    if (movingSpeed > 1) {
       if (controls.left) turnTorque += turnSpeed * delta;
       if (controls.right) turnTorque -= turnSpeed * delta;
       
       // Reverse steering when going backwards for intuitive controls
       const dot = forward.dot(new THREE.Vector3(velocity.x, velocity.y, velocity.z));
       if (dot < 0) turnTorque *= -1;
    }

    // Apply forces
    // 1. Engine force (Forward)
    const impulseVector = forward.multiplyScalar(driveImpulse);
    body.applyImpulse({ x: impulseVector.x, y: 0, z: impulseVector.z }, true);

    // 2. Steering (Torque)
    body.applyTorqueImpulse({ x: 0, y: turnTorque, z: 0 }, true);

    // 3. Fake friction / drag
    body.setLinvel({ x: velocity.x * drag, y: velocity.y, z: velocity.z * drag }, true);
    
    // 4. Stabilize/Upright (Keep car upright-ish)
    // Simple spring to push rotation.x/z to 0? For now just rely on physics
  });

  useFrame((state) => {
    if (!rigidBody.current) return;
    
    // Smooth Camera Follow
    const bodyPosition = rigidBody.current.translation();
    const cameraPosition = new THREE.Vector3();
    cameraPosition.copy(new THREE.Vector3(bodyPosition.x, bodyPosition.y + 10, bodyPosition.z + 15));
    
    state.camera.position.lerp(cameraPosition, 0.1);
    state.camera.lookAt(bodyPosition.x, bodyPosition.y, bodyPosition.z);
  });

  return (
    <RigidBody 
      ref={rigidBody} 
      position={position} 
      colliders={false} 
      mass={150} 
      linearDamping={0.5} 
      angularDamping={0.5}
    >
      <CuboidCollider args={[1, 0.5, 2]} position={[0, 0.5, 0]} />
      {/* Visual Car */}
      <group>
        <Box args={[2, 0.8, 4]} position={[0, 0.5, 0]} castShadow>
          <meshStandardMaterial color={controls.boost ? "orange" : "cyan"} />
        </Box>
        {/* Wheels */}
        <Box args={[0.5, 0.5, 0.5]} position={[1, 0, 1.2]}> <meshStandardMaterial color="black" /> </Box>
        <Box args={[0.5, 0.5, 0.5]} position={[-1, 0, 1.2]}> <meshStandardMaterial color="black" /> </Box>
        <Box args={[0.5, 0.5, 0.5]} position={[1, 0, -1.2]}> <meshStandardMaterial color="black" /> </Box>
        <Box args={[0.5, 0.5, 0.5]} position={[-1, 0, -1.2]}> <meshStandardMaterial color="black" /> </Box>
      </group>
    </RigidBody>
  );
}
