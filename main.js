// ED Elektro und Klimasysteme — hero 3D piece
// Light clay/blueprint rendering of the procedural house, gently scroll-coupled.
// No camera fly-through, no bloom, no particles — a calm, still object.

import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Renderer / Scene ----------

const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(4.6, 2.6, 6.4);
camera.lookAt(0, 1.1, 0);

// Soft, flat lighting — paper tones, no glow
scene.add(new THREE.AmbientLight(0xffffff, 1.4));
const key = new THREE.DirectionalLight(0xffffff, 0.9);
key.position.set(5, 8, 4);
scene.add(key);
const fill = new THREE.DirectionalLight(0xdfe6ea, 0.4);
fill.position.set(-5, 3, -3);
scene.add(fill);

// ---------- Materials ----------

const matWall = new THREE.MeshStandardMaterial({
  color: 0xece9e2, roughness: 0.95, metalness: 0.02,
});
const matEdge = new THREE.LineBasicMaterial({ color: 0x14181c, transparent: true, opacity: 0.65 });
const matKupfer = new THREE.MeshStandardMaterial({
  color: 0xb4551f, roughness: 0.5, metalness: 0.4,
});
const matClimate = new THREE.MeshStandardMaterial({
  color: 0x41798a, roughness: 0.5, metalness: 0.3,
});
const matPanel = new THREE.MeshStandardMaterial({
  color: 0x3a3f44, roughness: 0.4, metalness: 0.3,
});
const matWindow = new THREE.MeshStandardMaterial({
  color: 0xdad6cd, roughness: 0.3, metalness: 0.1,
});

function withEdges(geo, mat) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), matEdge));
  return mesh;
}

// ---------- House ----------

const house = new THREE.Group();

const base = withEdges(new THREE.BoxGeometry(4, 2.4, 3), matWall);
base.position.y = 1.2;
house.add(base);

const roofShape = new THREE.Shape();
roofShape.moveTo(-2.15, 0);
roofShape.lineTo(0, 1.3);
roofShape.lineTo(2.15, 0);
roofShape.lineTo(-2.15, 0);
const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: 3.2, bevelEnabled: false });
const roof = withEdges(roofGeo, matWall);
roof.position.set(0, 2.4, -1.6);
house.add(roof);

// PV panels on the south roof slope
const nx = -1.3 / 2.513, ny = 2.15 / 2.513;
const slopeAngle = Math.atan2(1.3, 2.15);
const panelGeo = new THREE.BoxGeometry(0.62, 0.02, 0.68);
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
  }
}

// Windows
const winGeo = new THREE.PlaneGeometry(0.55, 0.7);
const winPositions = [
  [-1.2, 1.3, 1.51], [-0.3, 1.3, 1.51], [0.6, 1.3, 1.51], [1.4, 1.3, 1.51],
];
for (const [x, y, z] of winPositions) {
  const w = new THREE.Mesh(winGeo, matWindow);
  w.position.set(x, y, z);
  house.add(w);
}
for (const z of [-0.7, 0.5]) {
  const w = new THREE.Mesh(winGeo, matWindow);
  w.position.set(2.01, 1.3, z);
  w.rotation.y = Math.PI / 2;
  house.add(w);
}

// Outdoor climate unit
const acUnit = new THREE.Group();
acUnit.add(withEdges(new THREE.BoxGeometry(0.9, 0.6, 0.35), matWall));
const fanRing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 10, 40), matClimate);
fanRing.position.z = 0.18;
acUnit.add(fanRing);
acUnit.position.set(2.5, 0.35, 0.9);
acUnit.rotation.y = Math.PI / 2;
house.add(acUnit);

// KNX bus line — the one copper accent
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

// Distribution box
const dbox = withEdges(new THREE.BoxGeometry(0.5, 0.7, 0.12), matWall);
dbox.position.set(-1.8, 0.5, 1.45);
house.add(dbox);

scene.add(house);

// Fake soft shadow — a flat dark ellipse beneath the house
const shadow = new THREE.Mesh(
  new THREE.CircleGeometry(2.6, 48),
  new THREE.MeshBasicMaterial({ color: 0x14181c, transparent: true, opacity: 0.06 })
);
shadow.rotation.x = -Math.PI / 2;
shadow.position.y = 0.001;
scene.add(shadow);

// ---------- Scroll-coupled rotation ----------
// House turns ~120° total over the full page scroll — no camera moves.

const state = { rotY: -0.35 };
gsap.set(house.rotation, { y: state.rotY });

if (!reducedMotion) {
  gsap.to(house.rotation, {
    y: state.rotY + Math.PI * (120 / 180),
    ease: "none",
    scrollTrigger: {
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.6,
    },
  });
}

// ---------- Render loop ----------

const clock = new THREE.Clock();

function resize() {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(rect.width, 1);
  const h = Math.max(rect.height, 1);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function render() {
  const t = clock.getElapsedTime();
  const idle = reducedMotion ? 0 : Math.sin(t * 0.6) * 0.02;
  house.position.y = idle;

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

window.addEventListener("resize", resize);
resize();
render();

requestAnimationFrame(() => {
  requestAnimationFrame(() => canvas.classList.add("ready"));
});

document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Content reveals ----------

if (!reducedMotion) {
  gsap.utils.toArray(".leistung, .zahl, .ablauf-steps li, .region-body").forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 28,
      duration: 0.7,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 85%" },
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
