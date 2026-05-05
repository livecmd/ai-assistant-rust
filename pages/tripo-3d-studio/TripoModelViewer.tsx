import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

interface TripoModelViewerProps {
  src: string;
  poster?: string | null;
  alt?: string;
}

const API_BASE =
  (typeof process !== "undefined" && process.env?.AI_ASSISTANT_GO_BASE_URL) ||
  "https://api.yuzhengdesign.com";

/** Convert a remote Tripo model URL to a local proxy URL to avoid CORS. */
function proxyUrl(url: string): string {
  if (!url) return url;
  if (
    url.startsWith("blob:") ||
    url.startsWith("data:") ||
    url.startsWith("/") ||
    url.startsWith("asset:") ||
    url.includes("asset.localhost")
  ) {
    return url;
  }
  return `${API_BASE}/api/ai/3d/model-proxy?url=${encodeURIComponent(url)}`;
}

const TripoModelViewer: React.FC<TripoModelViewerProps> = ({
  src,
  poster,
  alt = "3D model",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameRef = useRef<number>(0);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clockRef = useRef(new THREE.Clock());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- Init scene once ----
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    const w = container.clientWidth || 400;
    const h = container.clientHeight || 400;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 1000);
    camera.position.set(0, 1, 3);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2;
    controls.minDistance = 0.1;
    controls.maxDistance = 100;
    controlsRef.current = controls;

    const grid = new THREE.GridHelper(10, 20, 0x444444, 0x222222);
    scene.add(grid);

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      if (mixerRef.current) mixerRef.current.update(delta);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      if (cw === 0 || ch === 0) return;
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      renderer.setSize(cw, ch);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      mixerRef.current = null;
    };
  }, []);

  // ---- Load model when src changes ----
  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!scene || !camera || !controls || !src) return;

    setLoading(true);
    setError(null);

    // Remove previously loaded model objects
    const toRemove: THREE.Object3D[] = [];
    scene.traverse((child) => {
      if ((child as any).__isLoadedModel) toRemove.push(child);
    });
    toRemove.forEach((obj) => scene.remove(obj));
    mixerRef.current = null;

    const loader = new GLTFLoader();
    const url = proxyUrl(src);

    // Attach Bearer token for authenticated proxy requests
    const token = localStorage.getItem("token");
    if (token) {
      loader.setRequestHeader({ Authorization: `Bearer ${token}` });
    }

    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;
        (model as any).__isLoadedModel = true;

        // Auto-fit the model in view
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = maxDim > 0 ? 2 / maxDim : 1;

        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        const newBox = new THREE.Box3().setFromObject(model);
        model.position.y -= newBox.min.y;

        scene.add(model);

        // Frame camera
        const finalBox = new THREE.Box3().setFromObject(model);
        const fc = finalBox.getCenter(new THREE.Vector3());
        const fs = finalBox.getSize(new THREE.Vector3());
        const d = Math.max(fs.x, fs.y, fs.z) / (2 * Math.tan((Math.PI * camera.fov) / 360));

        camera.position.set(fc.x + d * 0.8, fc.y + d * 0.5, fc.z + d * 0.8);
        controls.target.copy(fc);
        controls.update();

        // Play animations
        if (gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
          mixerRef.current = mixer;
        }

        setLoading(false);
      },
      undefined,
      (err) => {
        console.error("Failed to load 3D model:", err);
        setError("模型加载失败");
        setLoading(false);
      }
    );
  }, [src]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", position: "relative", background: "transparent" }}
    >
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#aaa",
            fontSize: 14,
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          {poster ? (
            <img
              src={poster}
              alt={alt}
              style={{ maxWidth: "80%", maxHeight: "80%", objectFit: "contain", opacity: 0.6 }}
            />
          ) : (
            "加载 3D 模型中..."
          )}
        </div>
      )}
      {error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ff6b6b",
            fontSize: 14,
            zIndex: 10,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default TripoModelViewer;