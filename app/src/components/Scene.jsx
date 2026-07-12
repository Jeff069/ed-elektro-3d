import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { buildHouse } from "../three/house";
import { createSceneState, setupChoreography } from "../three/choreography";

const baseY = 1.1;

function HouseRig({ state }) {
  const { scene, camera, gl } = useThree();
  const built = useMemo(() => buildHouse(), []);
  const { house, materials, knxNodes, climate } = built;
  const clock = useRef(new THREE.Clock());
  const camPos = useRef(new THREE.Vector3(...state.camTarget.pos));
  const camLook = useRef(new THREE.Vector3(...state.camTarget.look));
  const lookVec = useRef(new THREE.Vector3());

  // One-time renderer/scene setup — ACES tonemapping + sRGB + soft shadows +
  // a generated studio HDRI environment (no external file needed).
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;

    scene.fog = new THREE.Fog(0x0b0d10, 9, 24);

    const pmrem = new THREE.PMREMGenerator(gl);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    scene.add(house);
    return () => {
      scene.remove(house);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Layout: house/camera framing adapts to full-viewport aspect (responsive
  // houseX offset + scale), mirrors the vanilla build's layout().
  useEffect(() => {
    function layout() {
      const w = window.innerWidth;
      const narrow = w < 800;
      state.houseX = narrow ? 0 : Math.min(w * 0.007, 7.5);
      house.position.x = state.houseX;
      house.scale.setScalar(narrow ? 0.55 : 0.62);
    }
    layout();
    window.addEventListener("resize", layout);
    return () => window.removeEventListener("resize", layout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(() => {
    const t = clock.current.getElapsedTime();
    const { reducedMotion } = state;

    if (!reducedMotion) state.idleAngle += 0.0018;

    // FX targets from scroll position, smoothed toward current fx values
    const { pv, smart, klima } = state.beatTriggers;
    const pvT = pv ? Math.max(0, 1 - Math.abs(pv.progress * 2 - 1)) : 0;
    const smartT = smart ? Math.max(0, 1 - Math.abs(smart.progress * 2 - 1)) : 0;
    const klimaT = klima ? Math.max(0, 1 - Math.abs(klima.progress * 2 - 1)) : 0;
    state.fx.pv += (pvT - state.fx.pv) * 0.08;
    state.fx.smart += (smartT - state.fx.smart) * 0.08;
    state.fx.klima += (klimaT - state.fx.klima) * 0.08;

    // PV panels light up
    materials.matPanel.emissiveIntensity = 0.06 + state.fx.pv * 1.3;

    // Walls go x-ray, KNX nodes + bus light up
    const wallOpacity = 1 - state.fx.smart * 0.85;
    materials.matFacade.opacity = wallOpacity;
    materials.matTrim.opacity = wallOpacity;
    materials.matGlass.opacity = Math.max(wallOpacity, 0.25);
    materials.matKupfer.emissiveIntensity = 0.55 + state.fx.smart * 1.4;
    knxNodes.forEach((node) => { node.material.opacity = 0.15 + state.fx.smart * 0.85; });

    // Climate particles drift upward in a loose spiral around the outdoor unit
    climate.particles.material.opacity = state.fx.klima * 0.85;
    if (state.fx.klima > 0.01) {
      const pos = climate.geo.attributes.position;
      for (let i = 0; i < climate.count; i++) {
        const seed = climate.seed[i];
        const rise = (t * 0.3 + seed) % 1.4;
        const a = seed + t * 0.4;
        const r = 0.3 + ((i % 9) / 9) * 0.9;
        pos.setXYZ(i, Math.cos(a) * r, rise - 0.2, Math.sin(a) * r);
      }
      pos.needsUpdate = true;
    }

    // Camera + house: double-smoothed (GSAP scrub already eases, this adds a
    // per-frame damping pass so fast scrolling never snaps or jitters).
    camPos.current.set(...state.camTarget.pos);
    camLook.current.set(...state.camTarget.look);
    camera.position.lerp(camPos.current, reducedMotion ? 1 : 0.07);
    camera.getWorldDirection(lookVec.current);
    const currentLook = camera.position.clone().add(lookVec.current);
    currentLook.lerp(camLook.current, reducedMotion ? 1 : 0.07);
    camera.lookAt(currentLook);

    house.rotation.y += (state.idleAngle + state.rotTarget.y - house.rotation.y) * (reducedMotion ? 1 : 0.06);
    house.rotation.z += (state.rotTarget.z - house.rotation.z) * (reducedMotion ? 1 : 0.06);
    house.position.y = reducedMotion ? 0 : Math.sin(t * 0.6) * 0.02;
  });

  return (
    <>
      <hemisphereLight args={[0x3a4550, 0x0b0d10, 0.9]} />
      <directionalLight
        color={0xd97a3f}
        intensity={1.0}
        position={[5, 8, 4]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={1}
        shadow-camera-far={20}
        shadow-radius={3}
        shadow-bias={-0.0015}
      />
      <directionalLight color={0x5fa8bd} intensity={0.4} position={[-5, 3, -3]} />
    </>
  );
}

// Fixed full-viewport R3F canvas behind the whole page. Wraps the canvas in
// a plain div so CSS (.scene-layer / .ready / .scene-exit) can control fixed
// positioning and opacity fades the same way the vanilla <canvas id="scene">
// did — R3F owns the actual <canvas> element internally.
export default function Scene() {
  const wrapperRef = useRef(null);
  const stateRef = useRef(null);
  if (!stateRef.current) stateRef.current = createSceneState();

  useEffect(() => {
    const cleanup = setupChoreography(stateRef.current, wrapperRef.current);
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => wrapperRef.current?.classList.add("ready"));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cleanup();
    };
  }, []);

  const hero = stateRef.current.camTarget;

  return (
    <div ref={wrapperRef} className="scene-layer" aria-hidden="true">
      <Canvas
        shadows
        camera={{ fov: 38, near: 0.1, far: 100, position: hero.pos }}
        gl={{ antialias: true, alpha: true }}
      >
        <HouseRig state={stateRef.current} />
      </Canvas>
    </div>
  );
}
