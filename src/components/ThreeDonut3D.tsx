'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ThreeDonut3DProps {
  percent: number; // e.g. 88
}

export default function ThreeDonut3D({ percent }: ThreeDonut3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webGlError, setWebGlError] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let animationId: number;

    try {
      const width = container.clientWidth || 180;
      const height = container.clientHeight || 180;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#090d16');

      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.set(0, 3, 6);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2));
      renderer.shadowMap.enabled = true;

      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
      dirLight.position.set(5, 10, 7);
      dirLight.castShadow = true;
      scene.add(dirLight);

      const blueLight = new THREE.PointLight(0x0ea5e9, 2, 10);
      blueLight.position.set(-3, 2, 2);
      scene.add(blueLight);

      const donutGroup = new THREE.Group();
      scene.add(donutGroup);

      const arcLength = Math.max(0.01, (percent / 100) * Math.PI * 2);
      const torusGeo = new THREE.TorusGeometry(1.6, 0.45, 32, 64, arcLength);
      const torusMat = new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        roughness: 0.15,
        metalness: 0.3,
        emissive: 0x0284c7,
        emissiveIntensity: 0.25,
      });
      const torusMesh = new THREE.Mesh(torusGeo, torusMat);
      torusMesh.castShadow = true;
      torusMesh.receiveShadow = true;
      donutGroup.add(torusMesh);

      const bgArcGeo = new THREE.TorusGeometry(1.6, 0.4, 24, 48, Math.PI * 2);
      const bgArcMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.6,
        metalness: 0.1,
      });
      const bgTorusMesh = new THREE.Mesh(bgArcGeo, bgArcMat);
      bgTorusMesh.position.z = -0.05;
      donutGroup.add(bgTorusMesh);

      const clock = new THREE.Clock();

      const animate = () => {
        animationId = requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        donutGroup.rotation.x = 0.4 + Math.sin(elapsed * 0.8) * 0.12;
        donutGroup.rotation.y = Math.cos(elapsed * 0.6) * 0.25;

        if (renderer) renderer.render(scene, camera);
      };

      animate();

      return () => {
        cancelAnimationFrame(animationId);
        if (renderer) renderer.dispose();
      };
    } catch (err) {
      console.warn('[ThreeDonut3D] WebGL not supported, fallback:', err);
      setWebGlError(true);
    }
  }, [percent]);

  if (webGlError) {
    return (
      <div className="relative w-44 h-44 mx-auto flex items-center justify-center rounded-2xl bg-slate-900 border border-slate-800">
        <div className="text-center">
          <div className="text-3xl font-black text-cyan-400">{percent}%</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">ตรงเวลา</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
      <div ref={mountRef} className="w-full h-full rounded-2xl overflow-hidden bg-[#090d16]" />
      <div className="absolute text-center pointer-events-none drop-shadow-md">
        <div className="text-3xl font-black text-white leading-none">{percent}%</div>
        <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wide mt-1">ตรงเวลา</div>
      </div>
    </div>
  );
}
