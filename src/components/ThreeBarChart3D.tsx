'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface DataPoint {
  day: string;
  ontime: number;
  late: number;
  total: number;
  allowance: number;
}

interface ThreeBarChart3DProps {
  data: DataPoint[];
}

export default function ThreeBarChart3D({ data }: ThreeBarChart3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredData, setHoveredData] = useState<DataPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera Setup
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 280;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#ffffff');

    // Orthographic/Perspective Isometric Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 8, 14);
    camera.lookAt(0, 1.5, 0);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 20, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const blueRimLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    blueRimLight.position.set(-10, 10, -10);
    scene.add(blueRimLight);

    // 4. Base Grid / Floor
    const gridHelper = new THREE.GridHelper(16, 8, 0xe2e8f0, 0xf1f5f9);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // 5. Build 3D Pillars
    const barsGroup = new THREE.Group();
    scene.add(barsGroup);

    const barMeshes: THREE.Mesh[] = [];
    const spacing = 1.8;
    const startX = -((data.length - 1) * spacing) / 2;
    const maxOntime = Math.max(...data.map((d) => d.ontime), 1);
    const hasAnyData = data.some((d) => d.total > 0 || d.ontime > 0);

    data.forEach((item, index) => {
      // Dynamic height based on actual ontime count (flat resting pad if 0)
      const isActive = item.ontime > 0;
      const barHeight = isActive ? Math.max(0.6, (item.ontime / maxOntime) * 4.5) : 0.08;
      const barGeometry = new THREE.BoxGeometry(1.0, barHeight, 1.0);
      
      // Material: Shiny Sky Blue if active, clean neutral slate pad if 0
      const barColor = isActive
        ? (index === hoveredIndex ? 0x0284c7 : 0x0ea5e9)
        : 0xe2e8f0;

      const barMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(barColor),
        roughness: isActive ? 0.2 : 0.5,
        metalness: isActive ? 0.2 : 0.05,
      });

      const barMesh = new THREE.Mesh(barGeometry, barMaterial);
      barMesh.position.set(startX + index * spacing, barHeight / 2, 0);
      barMesh.castShadow = isActive;
      barMesh.receiveShadow = true;
      barMesh.userData = { index, data: item, isActive };

      if (isActive) {
        // Add small glowing top cap for active days
        const capGeo = new THREE.BoxGeometry(1.05, 0.08, 1.05);
        const capMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          roughness: 0.1,
          metalness: 0.4,
        });
        const capMesh = new THREE.Mesh(capGeo, capMat);
        capMesh.position.set(0, barHeight / 2 + 0.04, 0);
        barMesh.add(capMesh);
      }

      barsGroup.add(barMesh);
      barMeshes.push(barMesh);
    });

    // 6. Interactive Mouse Raycasting & Orbit
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
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth slow subtle float & damping rotation
      barsGroup.rotation.y += (targetRotationY - barsGroup.rotation.y) * 0.08;
      if (!isDragging) {
        targetRotationY = Math.sin(elapsedTime * 0.4) * 0.15;
      }

      // Raycasting for Hover
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(barMeshes, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const idx = hit.userData.index;
        setHoveredIndex(idx);
        setHoveredData(hit.userData.data);

        // Highlight selected bar
        barMeshes.forEach((mesh, i) => {
          const isMeshActive = mesh.userData.isActive;
          if (i === idx) {
            (mesh.material as THREE.MeshStandardMaterial).color.set(isMeshActive ? 0x0284c7 : 0xcbd5e1);
            if (isMeshActive) {
              (mesh.material as THREE.MeshStandardMaterial).emissive.set(0x0ea5e9);
              (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.35;
            }
            mesh.scale.set(1.1, 1.05, 1.1);
          } else {
            (mesh.material as THREE.MeshStandardMaterial).color.set(isMeshActive ? 0x0ea5e9 : 0xe2e8f0);
            (mesh.material as THREE.MeshStandardMaterial).emissive.set(0x000000);
            (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
            mesh.scale.set(1.0, 1.0, 1.0);
          }
        });
      } else {
        if (hoveredIndex !== null) {
          setHoveredIndex(null);
          setHoveredData(null);
          barMeshes.forEach((mesh) => {
            const isMeshActive = mesh.userData.isActive;
            (mesh.material as THREE.MeshStandardMaterial).color.set(isMeshActive ? 0x0ea5e9 : 0xe2e8f0);
            (mesh.material as THREE.MeshStandardMaterial).emissive.set(0x000000);
            (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
            mesh.scale.set(1.0, 1.0, 1.0);
          });
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!container) return;
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
      renderer.dispose();
    };
  }, [data]);

  return (
    <div className="relative w-full h-72 rounded-2xl overflow-hidden bg-white cursor-grab active:cursor-grabbing border border-slate-100 shadow-inner">
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Floating 3D Tooltip */}
      {hoveredData && (
        <div
          style={{
            left: `${Math.min(Math.max(tooltipPos.x, 70), 480)}px`,
            top: `${Math.max(tooltipPos.y - 65, 10)}px`,
          }}
          className="absolute -translate-x-1/2 pointer-events-none bg-slate-900/90 backdrop-blur-xs text-white text-[11px] py-1.5 px-3 rounded-xl shadow-xl border border-slate-700 z-20 whitespace-nowrap animate-fadeIn"
        >
          <div className="font-bold text-sky-300">
            {hoveredData.day} ({hoveredData.total} คน)
          </div>
          <div className="text-[10px] text-slate-200">
            ตรงเวลา: <strong className="text-emerald-400">{hoveredData.ontime} คน</strong> (+{hoveredData.allowance}฿)
          </div>
          <div className="text-[10px] text-amber-300">
            มาสาย: {hoveredData.late} คน
          </div>
        </div>
      )}

      {/* 3D Overlay Badge */}
      <div className="absolute top-2.5 right-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-bold text-sky-600 border border-sky-100 shadow-xs flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
        <span>Interactive 3D WebGL</span>
      </div>

      {/* 3D Drag Tip */}
      <div className="absolute bottom-2 left-3 text-[10px] text-slate-400 bg-white/80 px-2 py-0.5 rounded-md border border-slate-100">
        🖱️ คลิกแล้วลากเพื่อหมุนมุมมอง 3 มิติ
      </div>
    </div>
  );
}
