import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface VantaDotsBackgroundProps {
    className?: string;
    /** Warna titik utama (default: reddish-orange / merah keoranyean #E64A19) */
    color?: number;
    /** Warna garis konstelasi (default: warm orange #FF7A45) */
    color2?: number;
    /** Ukuran titik (default: 5) */
    size?: number;
    /** Jarak antar titik (default: 36) */
    spacing?: number;
    /** Tampilkan garis jaring konstelasi 3D (default: true) */
    showLines?: boolean;
    /** Kecepatan gelombang (default: 1) */
    speed?: number;
    /** Opasitas keseluruhan (default: 0.85) */
    opacity?: number;
}

export default function VantaDotsBackground({
    className = 'absolute inset-0 pointer-events-none z-0 overflow-hidden',
    color = 0xe64a19,
    color2 = 0xff7a45,
    size = 5,
    spacing = 38,
    showLines = true,
    speed = 1,
    opacity = 0.85,
}: VantaDotsBackgroundProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || typeof window === 'undefined') return;

        // 1. Scene & Renderer setup
        const scene = new THREE.Scene();

        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || 600;

        const camera = new THREE.PerspectiveCamera(
            50,
            width / height,
            0.1,
            5000,
        );
        camera.position.set(0, 240, 50);
        camera.lookAt(0, 0, 0);

        let targetCameraX = 0;
        let targetCameraY = 50;
        const targetCameraZ = 350;

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0); // Transparent background to retain Cekara cream

        const canvas = renderer.domElement;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';

        container.appendChild(canvas);

        // 2. Circle texture for smooth round dots
        const dotCanvas = document.createElement('canvas');
        dotCanvas.width = 32;
        dotCanvas.height = 32;
        const dotCtx = dotCanvas.getContext('2d');
        if (dotCtx) {
            dotCtx.beginPath();
            dotCtx.arc(16, 16, 14, 0, Math.PI * 2);
            dotCtx.fillStyle = '#ffffff';
            dotCtx.fill();
        }
        const circleTexture = new THREE.CanvasTexture(dotCanvas);

        // 3. Dots Grid (Wave Field)
        const gridRange = 26; // -26 to 26 creates 53x53 = 2,809 dots
        const totalPoints = (gridRange * 2 + 1) * (gridRange * 2 + 1);
        const positions = new Float32Array(totalPoints * 3);
        const baseY = new Float32Array(totalPoints);

        let pIdx = 0;
        for (let x = -gridRange; x <= gridRange; x++) {
            for (let z = -gridRange; z <= gridRange; z++) {
                const px = x * spacing + spacing / 2;
                const py = Math.random() * 8 - 145;
                const pz = z * spacing + spacing / 2;

                positions[pIdx * 3] = px;
                positions[pIdx * 3 + 1] = py;
                positions[pIdx * 3 + 2] = pz;
                baseY[pIdx] = py;
                pIdx++;
            }
        }

        const dotsGeometry = new THREE.BufferGeometry();
        dotsGeometry.setAttribute(
            'position',
            new THREE.BufferAttribute(positions, 3),
        );

        const dotsMaterial = new THREE.PointsMaterial({
            color,
            size,
            map: circleTexture,
            transparent: true,
            opacity: 0.95,
            depthWrite: false,
            blending: THREE.NormalBlending,
        });

        const starField = new THREE.Points(dotsGeometry, dotsMaterial);
        scene.add(starField);

        // 4. Constellation Lines Mesh
        let linesMesh: THREE.LineSegments | null = null;
        if (showLines) {
            const linePositions: number[] = [];
            for (let i = 0; i < 160; i++) {
                const r1 = 35 + Math.random() * 25;
                const r2 = r1 + 12 + Math.random() * 15;
                const z = (Math.random() - 0.5) * 2;
                const sinPhi = Math.sqrt(Math.max(0, 1 - z * z));
                const theta = Math.random() * Math.PI * 2;
                const x = Math.cos(theta) * sinPhi;
                const y = Math.sin(theta) * sinPhi;

                linePositions.push(x * r1, y * r1, z * r1);
                linePositions.push(x * r2, y * r2, z * r2);
            }

            const linesGeometry = new THREE.BufferGeometry();
            linesGeometry.setAttribute(
                'position',
                new THREE.Float32BufferAttribute(linePositions, 3),
            );

            const linesMaterial = new THREE.LineBasicMaterial({
                color: color2,
                transparent: true,
                opacity: 0.35,
                depthWrite: false,
            });

            linesMesh = new THREE.LineSegments(linesGeometry, linesMaterial);
            linesMesh.position.set(0, -60, 0);
            scene.add(linesMesh);
        }

        // 5. Mouse Interaction for Parallax
        const handleMouseMove = (e: MouseEvent) => {
            const nx = e.clientX / window.innerWidth;
            const ny = e.clientY / window.innerHeight;
            targetCameraX = 90 * (nx - 0.5);
            targetCameraY = 50 + 40 * ny;
        };

        window.addEventListener('mousemove', handleMouseMove, {
            passive: true,
        });

        // 6. Resize Observer
        const handleResize = () => {
            if (!container) return;
            const w = container.clientWidth || window.innerWidth;
            const h = container.clientHeight || 600;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        };

        const resizeObserver = new ResizeObserver(() => handleResize());
        resizeObserver.observe(container);

        // 7. Animation Loop
        let animId: number;
        let clock = 0;

        const animate = () => {
            animId = requestAnimationFrame(animate);

            clock += 0.015 * speed;

            // Wave undulation
            const posAttr = dotsGeometry.attributes.position;
            const posArray = posAttr.array as Float32Array;

            for (let i = 0; i < totalPoints; i++) {
                const px = posArray[i * 3];
                const pz = posArray[i * 3 + 2];
                posArray[i * 3 + 1] =
                    baseY[i] +
                    14 * Math.sin(0.018 * pz + 0.014 * px + clock) +
                    6 * Math.cos(0.022 * px - clock * 0.8);
            }
            posAttr.needsUpdate = true;

            // Smooth camera lerp
            camera.position.x += (targetCameraX - camera.position.x) * 0.035;
            camera.position.y += (targetCameraY - camera.position.y) * 0.035;
            camera.position.z += (targetCameraZ - camera.position.z) * 0.035;
            camera.lookAt(0, -40, 0);

            // Constellation rotation
            if (linesMesh) {
                linesMesh.rotation.z += 0.0018 * speed;
                linesMesh.rotation.x += 0.0007 * speed;
                linesMesh.rotation.y += 0.0005 * speed;
            }

            renderer.render(scene, camera);
        };

        animate();

        // 8. Cleanup
        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('mousemove', handleMouseMove);
            resizeObserver.disconnect();

            dotsGeometry.dispose();
            dotsMaterial.dispose();
            circleTexture.dispose();

            if (linesMesh) {
                linesMesh.geometry.dispose();
                (linesMesh.material as THREE.Material).dispose();
            }

            renderer.dispose();
            if (canvas.parentElement) {
                canvas.parentElement.removeChild(canvas);
            }
        };
    }, [color, color2, size, spacing, showLines, speed]);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{ opacity }}
            aria-hidden="true"
        />
    );
}
