import { Points, PointMaterial } from '@react-three/drei';

function BackgroundParticles() {
  const count = 500;
  const positions = Array.from({ length: count }, () => ([
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 10,
  ])).flat();

  return (
    <Points positions={positions} stride={3} frustumCulled>
      <PointMaterial
        transparent
        color="#00ffff"
        size={0.02}
        sizeAttenuation
        depthWrite={false}
      />
    </Points>
  );
}
export default BackgroundParticles;