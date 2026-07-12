// Procedural house geometry + PBR materials — ported 1:1 from the vanilla
// Three.js build (main.js). Builds one THREE.Group; consumed by Scene.jsx
// via <primitive object={house} />.
import * as THREE from "three";

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

export function buildHouse() {
  // matFacade (Sichtbeton) and matTrim (dunkles Metall/Holz) are transparent from
  // the start (opacity animated down for the "Röntgen-Blick" x-ray effect during
  // the Smart-Home beat). matGlass fades with them.
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
  // Real glass: near-zero roughness + transmission, lit by the scene env map.
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

  // Soft copper glow pooling beneath the house — reads as ambient occlusion on dark
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(2.6, 48),
    new THREE.MeshBasicMaterial({ color: 0xd97a3f, transparent: true, opacity: 0.05 })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.001;
  house.add(glow);

  // Real contact shadow catcher — renders only the shadow cast by the key light.
  const shadowCatcher = new THREE.Mesh(
    new THREE.CircleGeometry(6, 48),
    new THREE.ShadowMaterial({ opacity: 0.4 })
  );
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = 0.0005;
  shadowCatcher.receiveShadow = true;
  house.add(shadowCatcher);

  // Klima beat: air/heat particle stream around the outdoor unit
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

  return {
    house,
    materials: { matFacade, matTrim, matGlass, matPanel, matKupfer, matClimate },
    knxNodes,
    climate: { particles: climateParticles, geo: climateGeo, seed: climateSeed, count: CLIMATE_PARTICLE_COUNT },
  };
}
