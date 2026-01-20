import React, { useRef, useEffect } from "react";
import * as THREE from "three";

/**
 * FinancialChart3D - A beautiful Three.js 3D bar chart visualization
 * Shows expenses as 3D bars with goal progress indicator
 */
export default function FinancialChart3D({ data }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !data) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 300;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827);
    sceneRef.current = scene;

    // Camera setup - isometric-like perspective
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(8, 6, 8);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Clear previous canvas if exists
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Point light for accent
    const pointLight = new THREE.PointLight(0x14b8a6, 0.5, 20);
    pointLight.position.set(-3, 5, 3);
    scene.add(pointLight);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(15, 15);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid helper
    const gridHelper = new THREE.GridHelper(10, 10, 0x374151, 0x374151);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Color palette for bars
    const colors = [
      0xef4444, // red
      0xf97316, // orange
      0xeab308, // yellow
      0x22c55e, // green
      0x06b6d4, // cyan
      0x8b5cf6, // purple
      0xec4899, // pink
      0x6366f1, // indigo
    ];

    // Calculate max value for scaling
    const maxExpense = Math.max(
      ...data.expenses.map((e) => e.amount),
      data.income || 0
    );
    const maxHeight = 5;

    // Create expense bars
    const bars = [];
    const barWidth = 0.6;
    const spacing = 1.2;
    const totalWidth = data.expenses.length * spacing;
    const startX = -totalWidth / 2 + spacing / 2;

    data.expenses.forEach((expense, index) => {
      const normalizedHeight = (expense.amount / maxExpense) * maxHeight;
      const targetHeight = Math.max(0.1, normalizedHeight);

      // Create bar geometry - start with zero height for animation
      const geometry = new THREE.BoxGeometry(barWidth, 0.01, barWidth);
      const material = new THREE.MeshStandardMaterial({
        color: colors[index % colors.length],
        roughness: 0.3,
        metalness: 0.2,
      });

      const bar = new THREE.Mesh(geometry, material);
      bar.position.x = startX + index * spacing;
      bar.position.y = 0;
      bar.position.z = 0;
      bar.castShadow = true;
      bar.receiveShadow = true;

      // Store target height for animation
      bar.userData = {
        targetHeight,
        currentHeight: 0.01,
        category: expense.category,
        amount: expense.amount,
      };

      scene.add(bar);
      bars.push(bar);
    });

    // Create income bar (taller, different color, at the back)
    let incomeBar = null;
    if (data.income) {
      const incomeHeight = (data.income / maxExpense) * maxHeight;
      const geometry = new THREE.BoxGeometry(1, 0.01, 0.4);
      const material = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        roughness: 0.3,
        metalness: 0.3,
        emissive: 0x10b981,
        emissiveIntensity: 0.1,
      });

      incomeBar = new THREE.Mesh(geometry, material);
      incomeBar.position.x = 0;
      incomeBar.position.y = 0;
      incomeBar.position.z = -3;
      incomeBar.castShadow = true;

      incomeBar.userData = {
        targetHeight: incomeHeight,
        currentHeight: 0.01,
      };

      scene.add(incomeBar);
    }

    // Create goal indicator (floating ring)
    let goalRing = null;
    if (data.goal && data.income) {
      const goalHeight =
        ((data.income - data.goal) / maxExpense) * maxHeight + 0.5;
      const ringGeometry = new THREE.TorusGeometry(0.3, 0.05, 16, 32);
      const ringMaterial = new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0xa855f7,
        emissiveIntensity: 0.3,
      });

      goalRing = new THREE.Mesh(ringGeometry, ringMaterial);
      goalRing.position.x = 0;
      goalRing.position.y = goalHeight;
      goalRing.position.z = -3;
      goalRing.rotation.x = Math.PI / 2;

      scene.add(goalRing);
    }

    // Animation variables
    let time = 0;
    const animationSpeed = 0.03;

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      time += 0.016;

      // Animate bars growing
      bars.forEach((bar) => {
        if (bar.userData.currentHeight < bar.userData.targetHeight) {
          bar.userData.currentHeight = Math.min(
            bar.userData.currentHeight +
              bar.userData.targetHeight * animationSpeed,
            bar.userData.targetHeight
          );

          // Update geometry
          bar.geometry.dispose();
          bar.geometry = new THREE.BoxGeometry(
            barWidth,
            bar.userData.currentHeight,
            barWidth
          );
          bar.position.y = bar.userData.currentHeight / 2;
        }

        // Subtle floating animation
        bar.position.y =
          bar.userData.currentHeight / 2 + Math.sin(time * 2 + bar.position.x) * 0.02;
      });

      // Animate income bar
      if (incomeBar) {
        if (incomeBar.userData.currentHeight < incomeBar.userData.targetHeight) {
          incomeBar.userData.currentHeight = Math.min(
            incomeBar.userData.currentHeight +
              incomeBar.userData.targetHeight * animationSpeed,
            incomeBar.userData.targetHeight
          );

          incomeBar.geometry.dispose();
          incomeBar.geometry = new THREE.BoxGeometry(
            1,
            incomeBar.userData.currentHeight,
            0.4
          );
          incomeBar.position.y = incomeBar.userData.currentHeight / 2;
        }
      }

      // Animate goal ring rotation and pulse
      if (goalRing) {
        goalRing.rotation.z = time * 0.5;
        const pulse = 1 + Math.sin(time * 3) * 0.1;
        goalRing.scale.set(pulse, pulse, pulse);
      }

      // Slow camera orbit
      camera.position.x = 8 * Math.cos(time * 0.1);
      camera.position.z = 8 * Math.sin(time * 0.1);
      camera.lookAt(0, 1, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      const newWidth = container.clientWidth;
      camera.aspect = newWidth / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, height);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      // Dispose geometries and materials
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((m) => m.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, [data]);

  if (!data || data.expenses.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "300px",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    />
  );
}
