import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Box, Text } from "@chakra-ui/react";

export function AnimatedLogo({ showWordmark = true, size = 60 }) {
  const containerRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = size;
    const height = size;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const particleCount = 100;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 0.8 + Math.random() * 0.4;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      colors[i * 3] = 0.4 + Math.random() * 0.3;
      colors[i * 3 + 1] = 0.6 + Math.random() * 0.4;
      colors[i * 3 + 2] = 1.0;

      sizes[i] = Math.random() * 3 + 1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const ringGeometry = new THREE.TorusGeometry(1, 0.02, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x4a9eff,
      transparent: true,
      opacity: 0.6,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    scene.add(ring);

    const ring2Geometry = new THREE.TorusGeometry(0.7, 0.015, 16, 100);
    const ring2Material = new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.4,
    });
    const ring2 = new THREE.Mesh(ring2Geometry, ring2Material);
    ring2.rotation.x = Math.PI / 3;
    scene.add(ring2);

    const coreGeometry = new THREE.IcosahedronGeometry(0.3, 1);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    let time = 0;
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      time += 0.01;

      particles.rotation.y += 0.002;
      particles.rotation.x += 0.001;

      ring.rotation.z += 0.005;
      ring2.rotation.z -= 0.003;
      ring2.rotation.y += 0.002;

      core.rotation.x += 0.01;
      core.rotation.y += 0.015;
      core.scale.setScalar(1 + Math.sin(time * 2) * 0.1);

      const positionAttr = geometry.attributes.position;
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const originalRadius = Math.sqrt(
          positionAttr.array[idx] ** 2 +
            positionAttr.array[idx + 1] ** 2 +
            positionAttr.array[idx + 2] ** 2,
        );
        const pulse = 1 + Math.sin(time * 3 + i * 0.1) * 0.05;
        const scale = pulse / originalRadius;
        positionAttr.array[idx] *= 1 + (scale - 1) * 0.01;
        positionAttr.array[idx + 1] *= 1 + (scale - 1) * 0.01;
        positionAttr.array[idx + 2] *= 1 + (scale - 1) * 0.01;
      }
      positionAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
      ring2Geometry.dispose();
      ring2Material.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      renderer.dispose();
    };
  }, [size]);

  return (
    <Box display="flex" alignItems="center">
      <Box
        ref={containerRef}
        width={`${size}px`}
        height={`${size}px`}
        borderRadius="full"
        overflow="hidden"
      />
      {showWordmark ? (
        <Text
          fontSize="xl"
          fontWeight="bold"
          bgGradient="to-r"
          gradientFrom="blue.400"
          gradientTo="purple.500"
          bgClip="text"
          letterSpacing="tight"
        >
          roadmap.cash
        </Text>
      ) : null}
    </Box>
  );
}

export default AnimatedLogo;
