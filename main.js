// ED Elektro und Klimasysteme — immersive scrollytelling background
// Three.js house fixed full-viewport behind the page; GSAP ScrollTrigger drives
// a lerped/damped camera through three narrative beats (PV / Smart Home / Klima).
// No bloom pass — all glow comes from emissive materials, kept cheap for 60fps.

import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import anime from "animejs";

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Renderer / Scene ----------

const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// ACES tonemapping + sRGB output — the single cheapest upgrade from "flat 3D" to "rendered"
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
// Real soft shadow maps (three.js docs: PCFSoftShadowMap is the recommended
// balance of quality/perf for PBR scenes) — replaces the old fake shadow blob.
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0b0d10, 9, 24);

// Studio HDRI environment (generated, no external file) — gives glass and
// metal real reflections instead of flat PBR colors.
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

// Dark studio lighting with a warm copper key — no bloom pass, glow comes from emissive materials
scene.add(new THREE.HemisphereLight(0x3a4550, 0x0b0d10, 0.9));
const key = new THREE.DirectionalLight(0xd97a3f, 1.0);
key.position.set(5, 8, 4);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.left = -6;
key.shadow.camera.right = 6;
key.shadow.camera.top = 6;
key.shadow.camera.bottom = -6;
key.shadow.camera.near = 1;
key.shadow.camera.far = 20;
key.shadow.radius = 3;
key.shadow.bias = -0.0015;
scene.add(key);
const fill = new THREE.DirectionalLight(0x5fa8bd, 0.4);
fill.position.set(-5, 3, -3);
scene.add(fill);

// ---------- Materials (PBR / ArchViz-grade) ----------

// Procedural PV grid texture — fine cell lines + metallic frame look without an asset file.
function makePvTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#0a1420";
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = "rgba(200, 220, 235, 0.3)";
  ctx.lineWidth = 2;
  for (let i = 1; i < 6; i++) {
    ctx.beginPath(); ctx.moveTo((i * 128) / 6, 0); ctx.lineTo((i * 128) / 6, 128); ctx.stroke();
  }
  for (let i = 1; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(0, (i * 128) / 3); ctx.lineTo(128, (i * 128) / 3); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// matFacade (Sichtbeton) and matTrim (dunkles Metall/Holz) are transparent from
// the start (opacity animated down for the "Röntgen-Blick" x-ray effect during
// the Smart-Home beat — see FX STATES below). matGlass fades with them.
const matFacade = new THREE.MeshPhysicalMaterial({
  color: 0x8d8b85, roughness: 0.55, metalness: 0.04,
  clearcoat: 0.25, clearcoatRoughness: 0.4,
  transparent: true, opacity: 1,
});
const matTrim = new THREE.MeshPhysicalMaterial({
  color: 0x201c19, roughness: 0.35, metalness: 0.8,
  clearcoat: 0.3, clearcoatRoughness: 0.25,
  transparent: true, opacity: 1,
});
const matEdge = new THREE.LineBasicMaterial({ color: 0x3a4148, transparent: true, opacity: 0.8 });
const matKupfer = new THREE.MeshStandardMaterial({
  color: 0xd97a3f, emissive: 0xd97a3f, emissiveIntensity: 0.55, roughness: 0.4, metalness: 0.5,
});
const matClimate = new THREE.MeshStandardMaterial({
  color: 0x5fa8bd, emissive: 0x5fa8bd, emissiveIntensity: 0.3, roughness: 0.4, metalness: 0.4,
});
// matPanel (PV cells) emissive intensity is ramped up during the PV beat.
const matPanel = new THREE.MeshPhysicalMaterial({
  map: makePvTexture(), color: 0x0d1a26, roughness: 0.22, metalness: 0.75,
  clearcoat: 0.6, clearcoatRoughness: 0.15,
  emissive: 0xd97a3f, emissiveIntensity: 0.06,
});
// Real glass: near-zero roughness + transmission, lit by the generated env map.
const matGlass = new THREE.MeshPhysicalMaterial({
  color: 0xbfd7e0, roughness: 0.04, metalness: 0, transmission: 1, thickness: 0.15, ior: 1.45,
  emissive: 0xd97a3f, emissiveIntensity: 0.04,
  transparent: true, opacity: 1,
});
const matKnxNode = new THREE.MeshBasicMaterial({ color: 0x5fa8bd, transparent: true, opacity: 0.15 });

function withEdges(geo, mat) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), matEdge));
  return mesh;
}

// ---------- House ----------

const house = new THREE.Group();

const base = withEdges(new THREE.BoxGeometry(4, 2.4, 3), matFacade);
base.position.y = 1.2;
base.castShadow = true;
base.receiveShadow = true;
house.add(base);

const roofShape = new THREE.Shape();
roofShape.moveTo(-2.15, 0);
roofShape.lineTo(0, 1.3);
roofShape.lineTo(2.15, 0);
roofShape.lineTo(-2.15, 0);
const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: 3.2, bevelEnabled: false });
const roof = withEdges(roofGeo, matTrim);
roof.position.set(0, 2.4, -1.6);
roof.castShadow = true;
house.add(roof);

// PV panels on the south roof slope
const nx = -1.3 / 2.513, ny = 2.15 / 2.513;
const slopeAngle = Math.atan2(1.3, 2.15);
const panelGeo = new THREE.BoxGeometry(0.62, 0.02, 0.68);
const pvPanels = [];
for (const u of [0.28, 0.64]) {
  for (let col = 0; col < 4; col++) {
    const p = new THREE.Mesh(panelGeo, matPanel);
    p.position.set(
      -2.15 + 2.15 * u + nx * 0.05,
      2.4 + 1.3 * u + ny * 0.05,
      -1.2 + col * 0.8
    );
    p.rotation.z = slopeAngle;
    house.add(p);
    pvPanels.push(p);
  }
}

// Windows
const winGeo = new THREE.PlaneGeometry(0.55, 0.7);
const winPositions = [
  [-1.2, 1.3, 1.51], [-0.3, 1.3, 1.51], [0.6, 1.3, 1.51], [1.4, 1.3, 1.51],
];
for (const [x, y, z] of winPositions) {
  const w = new THREE.Mesh(winGeo, matGlass);
  w.position.set(x, y, z);
  house.add(w);
}
for (const z of [-0.7, 0.5]) {
  const w = new THREE.Mesh(winGeo, matGlass);
  w.position.set(2.01, 1.3, z);
  w.rotation.y = Math.PI / 2;
  house.add(w);
}

// Outdoor climate unit (Wärmepumpe / AC) — the Klima beat focuses here
const acUnit = new THREE.Group();
const acBody = withEdges(new THREE.BoxGeometry(0.9, 0.6, 0.35), matTrim);
acBody.castShadow = true;
acUnit.add(acBody);
const fanRing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 10, 40), matClimate);
fanRing.position.z = 0.18;
acUnit.add(fanRing);
acUnit.position.set(2.5, 0.35, 0.9);
acUnit.rotation.y = Math.PI / 2;
house.add(acUnit);

// KNX bus line — the copper "nervous system" of the building
const busPoints = [
  new THREE.Vector3(-1.8, 0.15, 1.4),
  new THREE.Vector3(-1.8, 2.2, 1.4),
  new THREE.Vector3(1.8, 2.2, 1.4),
  new THREE.Vector3(1.8, 0.4, 1.4),
  new THREE.Vector3(1.8, 0.4, -1.3),
  new THREE.Vector3(-1.6, 0.4, -1.3),
];
const busCurve = new THREE.CatmullRomCurve3(busPoints);
const busTube = new THREE.Mesh(new THREE.TubeGeometry(busCurve, 80, 0.018, 8), matKupfer);
house.add(busTube);

// KNX nodes — glowing markers at each bus point, dim by default, lit up
// during the Smart-Home beat alongside the x-ray wall effect.
const knxNodes = busPoints.map((p) => {
  const node = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), matKnxNode.clone());
  node.position.copy(p);
  house.add(node);
  return node;
});

// Distribution box (Zählerschrank)
const dbox = withEdges(new THREE.BoxGeometry(0.5, 0.7, 0.12), matTrim);
dbox.position.set(-1.8, 0.5, 1.45);
house.add(dbox);

scene.add(house);

// Soft copper glow pooling beneath the house — reads as ambient occlusion on dark
const shadow = new THREE.Mesh(
  new THREE.CircleGeometry(2.6, 48),
  new THREE.MeshBasicMaterial({ color: 0xd97a3f, transparent: true, opacity: 0.05 })
);
shadow.rotation.x = -Math.PI / 2;
shadow.position.y = 0.001;
house.add(shadow);

// Real contact shadow catcher — renders only the shadow cast by the key light,
// stacked on top of the stylistic copper glow above for a grounded, ArchViz feel.
const shadowCatcher = new THREE.Mesh(
  new THREE.CircleGeometry(6, 48),
  new THREE.ShadowMaterial({ opacity: 0.4 })
);
shadowCatcher.rotation.x = -Math.PI / 2;
shadowCatcher.position.y = 0.0005;
shadowCatcher.receiveShadow = true;
house.add(shadowCatcher);

// ---------- Klima beat: air/heat particle stream around the outdoor unit ----------

const CLIMATE_PARTICLE_COUNT = 90;
const climateGeo = new THREE.BufferGeometry();
const climatePos = new Float32Array(CLIMATE_PARTICLE_COUNT * 3);
const climateSeed = new Float32Array(CLIMATE_PARTICLE_COUNT);
for (let i = 0; i < CLIMATE_PARTICLE_COUNT; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 0.3 + Math.random() * 0.9;
  climatePos[i * 3] = Math.cos(a) * r;
  climatePos[i * 3 + 1] = Math.random() * 1.4 - 0.2;
  climatePos[i * 3 + 2] = Math.sin(a) * r;
  climateSeed[i] = Math.random() * Math.PI * 2;
}
climateGeo.setAttribute("position", new THREE.BufferAttribute(climatePos, 3));
const climateParticles = new THREE.Points(
  climateGeo,
  new THREE.PointsMaterial({ color: 0x5fa8bd, size: 0.045, transparent: true, opacity: 0 })
);
climateParticles.position.copy(acUnit.position);
house.add(climateParticles);

// ---------- Idle rotation ----------
// A slow constant spin keeps the background alive even when nothing else is happening.

let idleAngle = reducedMotion ? 0 : -0.35;

// ---------- Layout: house/camera framing adapts to full-viewport aspect ----------

const baseY = 1.1;
let houseX = 0; // updated by layout(), read by the camera states below

function layout() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const narrow = w < 800;

  houseX = narrow ? 0 : Math.min(w * 0.007, 7.5);
  house.position.x = houseX;
  house.scale.setScalar(narrow ? 0.55 : 0.62);

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

// ============================================================================
// CAMERA STATES — tweak these coordinates to adjust the scroll choreography.
// pos = camera position [x, y, z], look = look-at target [x, y, z].
// houseX is added automatically so framing stays correct at every screen width.
// ============================================================================

function CAM_HERO() {
  // Hero: calm establishing shot, house rotates gently, camera never moves.
  // Position is fixed (not houseX-relative) so the house — offset further
  // right on wide screens — sits clear of the text column on the left.
  return { pos: [6.4, 3.2, 11.5], look: [1.6, baseY, 0] };
}

function CAM_PV() {
  // Beat 1 — Photovoltaik: swoop up and in toward the roof, looking down at the panels.
  return { pos: [houseX + 3.0, 5.4, 4.6], look: [houseX + 0.4, 2.6, -0.8] };
}

function CAM_SMART() {
  // Beat 2 — Smart Home/Elektro: pull back onto the opposite side, house yaws ~45°
  // (see ROTATION STATES below), walls go x-ray to reveal the KNX bus.
  return { pos: [houseX - 3.6, 2.1, 5.6], look: [houseX - 0.3, 1.2, 0.2] };
}

function CAM_KLIMA() {
  // Beat 3 — Klima/Sanitär: low angle, focused on the outdoor unit at (2.5, 0.35, 0.9).
  return { pos: [houseX + 6.8, 1.7, 5.2], look: [houseX + 1.8, 0.5, 0.9] };
}

// ---------- ROTATION STATES ----------
// Extra house rotation/tilt per beat, layered on top of the idle spin.

const ROT_HERO = { y: 0, z: 0 };
const ROT_PV = { y: 0.3, z: 0 };
const ROT_SMART = { y: Math.PI / 4, z: 0 }; // "dreht das Haus um 45 Grad"
const ROT_KLIMA = { y: Math.PI / 4, z: 0.06 }; // "Das Haus neigt sich leicht"

// ---------- Camera + rotation targets, updated by scroll, applied via lerp ----------

const camTarget = CAM_HERO();
const rotTarget = { ...ROT_HERO };
const camPos = new THREE.Vector3(...camTarget.pos);
const camLook = new THREE.Vector3(...camTarget.look);

function lerp3(target, a, b, t) {
  target[0] = a[0] + (b[0] - a[0]) * t;
  target[1] = a[1] + (b[1] - a[1]) * t;
  target[2] = a[2] + (b[2] - a[2]) * t;
}

if (!reducedMotion) {
  ScrollTrigger.create({
    trigger: "#story",
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate(self) {
      const p = self.progress; // 0 → 1 across all three beats
      const seg = 1 / 3;
      let a, b, t, ra, rb;

      if (p < seg) {
        a = CAM_HERO(); b = CAM_PV(); t = p / seg;
        ra = ROT_HERO; rb = ROT_PV;
      } else if (p < seg * 2) {
        a = CAM_PV(); b = CAM_SMART(); t = (p - seg) / seg;
        ra = ROT_PV; rb = ROT_SMART;
      } else {
        a = CAM_SMART(); b = CAM_KLIMA(); t = (p - seg * 2) / seg;
        ra = ROT_SMART; rb = ROT_KLIMA;
      }

      lerp3(camTarget.pos, a.pos, b.pos, t);
      lerp3(camTarget.look, a.look, b.look, t);
      rotTarget.y = ra.y + (rb.y - ra.y) * t;
      rotTarget.z = ra.z + (rb.z - ra.z) * t;
    },
    onLeaveBack() {
      const hero = CAM_HERO();
      camTarget.pos = hero.pos;
      camTarget.look = hero.look;
      rotTarget.y = ROT_HERO.y;
      rotTarget.z = ROT_HERO.z;
    },
  });
}

// ---------- Exit: house fades out once the story ends and #leistungen begins ----------
// Keeps the 3D model from lingering behind the UI grid below — the lower half
// of the page is pure glass-card UI, no background object competing for focus.

const exitTrigger = document.querySelector("#leistungen");
if (exitTrigger && !reducedMotion) {
  ScrollTrigger.create({
    trigger: exitTrigger,
    start: "top 75%",
    onEnter: () => {
      canvas.classList.add("scene-exit");
      gsap.to(camTarget.pos, { 0: houseX + 14, 1: 9, 2: 20, duration: 1.2, ease: "power2.inOut" });
    },
    onLeaveBack: () => {
      canvas.classList.remove("scene-exit");
      const k = CAM_KLIMA();
      gsap.to(camTarget.pos, { 0: k.pos[0], 1: k.pos[1], 2: k.pos[2], duration: 1, ease: "power2.inOut" });
    },
  });
}

// ---------- FX STATES per beat: PV glow / x-ray walls + KNX glow / climate particles ----------
// Each beat's local "focus" is a 0→1→0 triangle as it passes through the viewport,
// so the effect peaks while its text card is centered and fades on either side.

const beatTriggers = {};
["pv", "smart", "klima"].forEach((name) => {
  const el = document.querySelector(`[data-beat="${name}"]`);
  if (!el) return;
  beatTriggers[name] = ScrollTrigger.create({ trigger: el, start: "top bottom", end: "bottom top" });
});

function triangle(p) {
  return Math.max(0, 1 - Math.abs(p * 2 - 1));
}

const fx = { pv: 0, smart: 0, klima: 0 };

// ---------- Render loop ----------

const clock = new THREE.Clock();

function render() {
  const t = clock.getElapsedTime();

  if (!reducedMotion) idleAngle += 0.0018;

  // FX targets from scroll position, smoothed toward current fx values
  const pvT = beatTriggers.pv ? triangle(beatTriggers.pv.progress) : 0;
  const smartT = beatTriggers.smart ? triangle(beatTriggers.smart.progress) : 0;
  const klimaT = beatTriggers.klima ? triangle(beatTriggers.klima.progress) : 0;
  fx.pv += (pvT - fx.pv) * 0.08;
  fx.smart += (smartT - fx.smart) * 0.08;
  fx.klima += (klimaT - fx.klima) * 0.08;

  // PV panels light up
  matPanel.emissiveIntensity = 0.06 + fx.pv * 1.3;

  // Walls go x-ray, KNX nodes + bus light up
  const wallOpacity = 1 - fx.smart * 0.85;
  matFacade.opacity = wallOpacity;
  matTrim.opacity = wallOpacity;
  matGlass.opacity = Math.max(wallOpacity, 0.25); // glass never goes fully invisible
  matKupfer.emissiveIntensity = 0.55 + fx.smart * 1.4;
  knxNodes.forEach((node) => { node.material.opacity = 0.15 + fx.smart * 0.85; });

  // Climate particles drift upward in a loose spiral around the outdoor unit
  climateParticles.material.opacity = fx.klima * 0.85;
  if (fx.klima > 0.01) {
    const pos = climateGeo.attributes.position;
    for (let i = 0; i < CLIMATE_PARTICLE_COUNT; i++) {
      const seed = climateSeed[i];
      const rise = (t * 0.3 + seed) % 1.4;
      const a = seed + t * 0.4;
      const r = 0.3 + ((i % 9) / 9) * 0.9;
      pos.setXYZ(i, Math.cos(a) * r, rise - 0.2, Math.sin(a) * r);
    }
    pos.needsUpdate = true;
  }

  // Camera + house: double-smoothed (GSAP scrub already eases, this adds a
  // per-frame damping pass so fast scrolling never snaps or jitters).
  camPos.set(...camTarget.pos);
  camLook.set(...camTarget.look);
  camera.position.lerp(camPos, reducedMotion ? 1 : 0.07);
  const lookVec = new THREE.Vector3();
  camera.getWorldDirection(lookVec);
  const currentLook = camera.position.clone().add(lookVec);
  currentLook.lerp(camLook, reducedMotion ? 1 : 0.07);
  camera.lookAt(currentLook);

  house.rotation.y += (idleAngle + rotTarget.y - house.rotation.y) * (reducedMotion ? 1 : 0.06);
  house.rotation.z += (rotTarget.z - house.rotation.z) * (reducedMotion ? 1 : 0.06);
  house.position.y = reducedMotion ? 0 : Math.sin(t * 0.6) * 0.02;

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

window.addEventListener("resize", layout);
layout();
camera.position.copy(camPos);
camera.lookAt(camLook);
render();

requestAnimationFrame(() => {
  requestAnimationFrame(() => canvas.classList.add("ready"));
});

document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Content reveals ----------

if (!reducedMotion) {
  gsap.utils.toArray(".leistung-flip, .zahl, .ablauf-steps li, .region-body, .beat-card").forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 28,
      duration: 0.7,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 85%" },
    });
  });
}

// ---------- Anime.js: tactile button press + touch flip-cards ----------

document.querySelectorAll(".btn, .cta-tel, .header-cta").forEach((btn) => {
  btn.addEventListener("pointerdown", () => {
    anime({ targets: btn, scale: 0.96, duration: 120, easing: "easeOutQuad" });
  });
  btn.addEventListener("pointerup", () => {
    anime({ targets: btn, scale: 1, duration: 260, easing: "easeOutElastic(1, 0.5)" });
  });
  btn.addEventListener("pointerleave", () => {
    anime({ targets: btn, scale: 1, duration: 260, easing: "easeOutElastic(1, 0.5)" });
  });
});

// Touch devices don't have hover — tap toggles the flip state with a spring bounce
const isTouch = window.matchMedia("(hover: none)").matches;
if (isTouch) {
  document.querySelectorAll(".leistung-flip").forEach((card) => {
    card.addEventListener("click", () => {
      card.classList.toggle("flipped");
      anime({
        targets: card.querySelector(".leistung-card"),
        scale: [1, 1.03, 1],
        duration: 500,
        easing: "easeOutElastic(1, 0.6)",
      });
    });
  });
}

// ---------- Count-up numbers ----------

document.querySelectorAll(".zahl-value").forEach((el) => {
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || "";
  const isYear = el.dataset.format === "year";
  const counter = { v: isYear ? target : 0 };

  const format = (v) => (isYear ? String(v) : v.toLocaleString("de-DE")) + suffix;

  if (reducedMotion) {
    el.textContent = format(target);
    return;
  }

  ScrollTrigger.create({
    trigger: el,
    start: "top 90%",
    once: true,
    onEnter: () => {
      gsap.to(counter, {
        v: target,
        duration: 1.4,
        ease: "power1.out",
        onUpdate: () => {
          el.textContent = format(Math.round(counter.v));
        },
      });
    },
  });
});
