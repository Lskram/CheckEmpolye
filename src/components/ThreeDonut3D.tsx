'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeDonut3DProps {
  percent: number; // e.g. 88
}

export default function ThreeDonut3D({ percent }: ThreeDonut3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 180;
    const height = container.clientHeight || 180;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#ffffff');

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 3, 6);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const blueLight = new THREE.PointLight(0x0ea5e9, 1.5, 10);
    blueLight.position.set(-3, 2, 2);
    scene.add(blueLight);

    // 3D Torus Donut
    const donutGroup = new THREE.Group();
    scene.add(donutGroup);

    // Primary 3D Arc (Sky Blue)
    const arcLength = (percent / 100) * Math.PI * 2;
    const torusGeo = new THREE.TorusGeometry(1.6, 0.45, 32, 64, arcLength);
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      roughness: 0.15,
      metalness: 0.2,
      emissive: 0x0284c7,
      emissiveIntensity: 0.15,
    });
    const torusMesh = new THREE.Mesh(torusGeo, torusMat);
    torusMesh.castShadow = true;
    torusMesh.receiveShadow = true;
    donutGroup.add(torusMesh);

    // Background Inactive Arc (Soft Light Gray)
    const bgArcGeo = new THREE.TorusGeometry(1.6, 0.4, 24, 48, Math.PI * 2);
    const bgArcMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.4,
      metalness: 0.05,
    });
    const bgTorusMesh = new THREE.Mesh(bgArcGeo, bgArcMat);
    bgTorusMesh.position.z = -0.05;
    donutGroup.add(bgTorusMesh);

    // Interaction & Animation
    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth 3D tilt & wobble
      donutGroup.rotation.x = 0.4 + Math.sin(elapsed * 0.8) * 0.12;
      donutGroup.rotation.y = Math.cos(elapsed * 0.6) * 0.25;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
    };
  }, [percent]);

  return (
    <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full rounded-2xl overflow-hidden" />

      {/* Center 3D Percentage Display */}
      <div className="absolute text-center pointer-events-none drop-shadow-sm">
        <div className="text-3xl font-black text-slate-900 leading-none">{percent}%</div>
        <div className="text-[10px] font-bold text-sky-600 uppercase tracking-wide mt-1">ตรงเวลา</div>
      </div>
    </div>
  );
}
