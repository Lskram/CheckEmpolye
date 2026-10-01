'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface DataPoint {
  day: string;
  ontime: number;
  late: number;
  total: number;
  allowance: number;
}

interface ThreeBarChart3DProps {
  data?: DataPoint[];
}

const DEFAULT_DAYS: DataPoint[] = [
  { day: 'จ.', ontime: 0, late: 0, total: 0, allowance: 0 },
  { day: 'อ.', ontime: 0, late: 0, total: 0, allowance: 0 },
  { day: 'พ.', ontime: 0, late: 0, total: 0, allowance: 0 },
  { day: 'พฤ.', ontime: 0, late: 0, total: 0, allowance: 0 },
  { day: 'ศ.', ontime: 0, late: 0, total: 0, allowance: 0 },
  { day: 'ส.', ontime: 0, late: 0, total: 0, allowance: 0 },
  { day: 'อา.', ontime: 0, late: 0, total: 0, allowance: 0 },
];

export default function ThreeBarChart3D({ data }: ThreeBarChart3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredData, setHoveredData] = useState<DataPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [webGlError, setWebGlError] = useState(false);

  // Guard: Ensure safeData is ALWAYS an array
  const safeData: DataPoint[] = Array.isArray(data) && data.length > 0 ? data : DEFAULT_DAYS;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let animationFrameId: number;

    try {
      // 1. Scene & Camera Setup
      const width = container.clientWidth || 600;
      const height = container.clientHeight || 280;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#090d16');

      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
      camera.position.set(0, 8, 14);
      camera.lookAt(0, 1.5, 0);

      // 2. Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      // 3. Studio Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
      dirLight.position.set(10, 20, 15);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      scene.add(dirLight);

      const blueRimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
      blueRimLight.position.set(-10, 10, -10);
      scene.add(blueRimLight);

      // 4. Base Grid / Floor
      const gridHelper = new THREE.GridHelper(16, 8, 0x1e293b, 0x0f172a);
      gridHelper.position.y = 0;
      scene.add(gridHelper);

      // 5. Build 3D Pillars
      const barsGroup = new THREE.Group();
      scene.add(barsGroup);

      const barMeshes: THREE.Mesh[] = [];
      const spacing = 1.8;
      const startX = -((safeData.length - 1) * spacing) / 2;
      const maxOntime = Math.max(...safeData.map((d) => d.ontime || 0), 1);

      safeData.forEach((item, index) => {
        const ontimeCount = item.ontime || 0;
        const isActive = ontimeCount > 0;
        const barHeight = isActive ? Math.max(0.6, (ontimeCount / maxOntime) * 4.5) : 0.08;
        const barGeometry = new THREE.BoxGeometry(1.0, barHeight, 1.0);

        const barColor = isActive ? 0x0ea5e9 : 0x1e293b;

        const barMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(barColor),
          roughness: isActive ? 0.2 : 0.6,
          metalness: isActive ? 0.3 : 0.1,
          emissive: isActive ? 0x0284c7 : 0x000000,
          emissiveIntensity: isActive ? 0.2 : 0,
        });

        const barMesh = new THREE.Mesh(barGeometry, barMaterial);
        barMesh.position.set(startX + index * spacing, barHeight / 2, 0);
        barMesh.castShadow = isActive;
        barMesh.receiveShadow = true;
        barMesh.userData = { index, data: item, isActive };

        if (isActive) {
          const capGeo = new THREE.BoxGeometry(1.05, 0.08, 1.05);
          const capMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            roughness: 0.1,
            metalness: 0.5,
            emissive: 0x38bdf8,
            emissiveIntensity: 0.4,
          });
          const capMesh = new THREE.Mesh(capGeo, capMat);
          capMesh.position.set(0, barHeight / 2 + 0.04, 0);
          barMesh.add(capMesh);
        }

        barsGroup.add(barMesh);
        barMeshes.push(barMesh);
      });

      // 6. Interactive Raycaster
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(-100, -100);
      let targetRotationY = 0;
      let isDragging = false;
      let prevMouseX = 0;

      const onPointerMove = (event: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / height) * 2 + 1;
        setTooltipPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });

        if (isDragging) {
          const deltaX = event.clientX - prevMouseX;
          targetRotationY += deltaX * 0.005;
          prevMouseX = event.clientX;
        }
      };

      const onMouseDown = (event: MouseEvent) => {
        isDragging = true;
        prevMouseX = event.clientX;
      };

      const onMouseUp = () => {
        isDragging = false;
      };

      const onMouseLeave = () => {
        isDragging = false;
        setHoveredIndex(null);
        setHoveredData(null);
      };

      container.addEventListener('mousemove', onPointerMove);
      container.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);
      container.addEventListener('mouseleave', onMouseLeave);

      // 7. Animation Loop
      const clock = new THREE.Clock();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        barsGroup.rotation.y += (targetRotationY - barsGroup.rotation.y) * 0.08;
        if (!isDragging) {
          targetRotationY = Math.sin(elapsedTime * 0.4) * 0.15;
        }

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(barMeshes, false);

        if (intersects.length > 0) {
          const hit = intersects[0].object as THREE.Mesh;
          const idx = hit.userData.index;
          setHoveredIndex(idx);
          setHoveredData(hit.userData.data);
        } else {
          setHoveredIndex(null);
          setHoveredData(null);
        }

        if (renderer) renderer.render(scene, camera);
      };

      animate();

      const handleResize = () => {
        if (!container || !renderer) return;
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight || 280;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        cancelAnimationFrame(animationFrameId);
        container.removeEventListener('mousemove', onPointerMove);
        container.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mouseup', onMouseUp);
        container.removeEventListener('mouseleave', onMouseLeave);
        window.removeEventListener('resize', handleResize);
        if (renderer) renderer.dispose();
      };
    } catch (err) {
      console.warn('[ThreeBarChart3D] WebGL not supported or failed, using fallback:', err);
      setWebGlError(true);
    }
  }, [safeData]);

  if (webGlError) {
    return (
      <div className="w-full h-72 rounded-2xl bg-slate-950 p-6 flex flex-col justify-between border border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
          <span>สถิติเข้างานตรงเวลา (2D Fallback Mode)</span>
          <span className="text-blue-400">สัปดาห์นี้</span>
        </div>
        <div className="flex items-end justify-between gap-2 h-44 pt-4">
          {safeData.map((item, idx) => {
            const ontimeCount = item.ontime || 0;
            const maxVal = Math.max(...safeData.map((d) => d.ontime || 0), 1);
            const heightPct = Math.max(10, (ontimeCount / maxVal) * 100);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-mono text-emerald-400 font-bold">{ontimeCount}</span>
                <div
                  style={{ height: `${heightPct}%` }}
                  className="w-full rounded-xl bg-gradient-to-t from-blue-600 to-cyan-400 shadow-md transition-all"
                />
                <span className="text-[11px] font-bold text-slate-400">{item.day}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-72 rounded-2xl overflow-hidden bg-[#090d16] cursor-grab active:cursor-grabbing border border-slate-800 shadow-inner">
      <div ref={mountRef} className="w-full h-full" />

      {hoveredData && (
        <div
          style={{
            left: `${Math.min(Math.max(tooltipPos.x, 70), 480)}px`,
            top: `${Math.max(tooltipPos.y - 65, 10)}px`,
          }}
          className="absolute -translate-x-1/2 pointer-events-none bg-slate-900/95 backdrop-blur-md text-white text-[11px] py-2 px-3.5 rounded-xl shadow-2xl border border-slate-700 z-20 whitespace-nowrap animate-fadeIn"
        >
          <div className="font-bold text-sky-400">
            {hoveredData.day} (รวม {hoveredData.total || 0} คน)
          </div>
          <div className="text-[10px] text-slate-300">
            ตรงเวลา: <strong className="text-emerald-400">{hoveredData.ontime || 0} คน</strong> (+{hoveredData.allowance || 0}฿)
          </div>
          <div className="text-[10px] text-amber-300">
            มาสาย: {hoveredData.late || 0} คน
          </div>
        </div>
      )}

      <div className="absolute top-2.5 right-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-cyan-400 border border-slate-800 shadow-sm flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
        <span>Interactive 3D WebGL</span>
      </div>

      <div className="absolute bottom-2 left-3 text-[10px] text-slate-400 bg-slate-900/80 backdrop-blur-xs px-2 py-0.5 rounded-md border border-slate-800">
        🖱️ คลิกแล้วลากเพื่อหมุนมุมมอง 3 มิติ
      </div>
    </div>
  );
}
