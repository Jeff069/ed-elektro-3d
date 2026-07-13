// House geometry + PBR materials. No suitable free-licensed .glb modern-house
// model was found (Poly Haven has no complete buildings, only props/facade
// fragments; three.js's official example models have no fitting house; Sketchfab
// downloads require OAuth not available here) — see AGENTIC_NOTES in the PR/commit
// for the search trail. Upgraded procedural massing instead: two volumes, flat
// cantilevered roof, articulated vertical facade fins, full glazing band —
// reads as real architecture instead of a single low-poly box+gable.
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
  const facadeMeshes = []; // collected for x-ray fade (main volumes only, not fins/trim details)

  // ---------- Volume A: main living block ----------
  const volA = withEdges(new THREE.BoxGeometry(5.0, 2.3, 3.0), matFacade);
  volA.position.set(-0.3, 1.15, 0);
  volA.castShadow = true;
  volA.receiveShadow = true;
  house.add(volA);
  facadeMeshes.push(volA);

  // Flat cantilevered roof slab — overhangs the walls, the single biggest
  // "reads as architecture" move vs. a gabled box.
  const roofA = withEdges(new THREE.BoxGeometry(5.6, 0.14, 3.6), matTrim);
  roofA.position.set(-0.3, 2.37, 0);
  roofA.castShadow = true;
  house.add(roofA);

  // ---------- Volume B: taller side volume (stairwell/study) for massing ----------
  const volB = withEdges(new THREE.BoxGeometry(1.7, 3.1, 1.9), matFacade);
  volB.position.set(2.55, 1.55, -0.35);
  volB.castShadow = true;
  volB.receiveShadow = true;
  house.add(volB);
  facadeMeshes.push(volB);

  const roofB = withEdges(new THREE.BoxGeometry(2.0, 0.12, 2.2), matTrim);
  roofB.position.set(2.55, 3.16, -0.35);
  roofB.castShadow = true;
  house.add(roofB);

  // ---------- Glazing: full-width front band instead of punched windows ----------
  const glassA = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.7), matGlass);
  glassA.position.set(-0.3, 1.2, 1.51);
  house.add(glassA);

  const glassB = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.6), matGlass);
  glassB.position.set(2.55, 1.55, 0.61);
  house.add(glassB);

  // Side glazing on volume A
  const glassSide = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.4), matGlass);
  glassSide.position.set(-2.81, 1.2, 0);
  glassSide.rotation.y = Math.PI / 2;
  house.add(glassSide);

  // ---------- Vertical facade fins (Sichtbeton/Metall-Mix, moderner Sonnenschutz) ----------
  const finGeo = new THREE.BoxGeometry(0.06, 1.75, 0.14);
  for (let i = 0; i < 7; i++) {
    const fin = new THREE.Mesh(finGeo, matTrim);
    fin.position.set(-2.35 + i * 0.75, 1.2, 1.58);
    fin.castShadow = true;
    house.add(fin);
  }

  // ---------- PV panels on the flat roof, slightly tilted toward the camera ----------
  const panelGeo = new THREE.BoxGeometry(0.7, 0.03, 0.9);
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      const p = new THREE.Mesh(panelGeo, matPanel);
      p.position.set(-2.1 + col * 0.95, 2.48 + row * 0.09, -1.0 + row * 1.0);
      p.rotation.x = -0.12;
      p.castShadow = true;
      house.add(p);
    }
  }

  // ---------- Outdoor climate unit (Wärmepumpe / AC) — the Klima beat focuses here ----------
  const acUnit = new THREE.Group();
  const acBody = withEdges(new THREE.BoxGeometry(0.9, 0.6, 0.35), matTrim);
  acBody.castShadow = true;
  acUnit.add(acBody);
  const fanRing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 10, 40), matClimate);
  fanRing.position.z = 0.18;
  acUnit.add(fanRing);
  acUnit.position.set(3.35, 0.35, -1.15);
  acUnit.rotation.y = Math.PI * 0.15;
  house.add(acUnit);

  // ---------- KNX bus line — the copper "nervous system", routed along both volumes ----------
  const busPoints = [
    new THREE.Vector3(-2.7, 0.15, 1.35),
    new THREE.Vector3(-2.7, 2.15, 1.35),
    new THREE.Vector3(1.9, 2.15, 1.35),
    new THREE.Vector3(1.9, 0.4, 1.35),
    new THREE.Vector3(2.9, 0.4, 0.5),
    new THREE.Vector3(2.9, 0.4, -1.0),
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
  dbox.position.set(-2.7, 0.5, 1.4);
  house.add(dbox);

  // Soft copper glow pooling beneath the house — reads as ambient occlusion on dark
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(3.4, 48),
    new THREE.MeshBasicMaterial({ color: 0xd97a3f, transparent: true, opacity: 0.05 })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.set(0.3, 0.001, 0);
  house.add(glow);

  // Real contact shadow catcher — renders only the shadow cast by the key light.
  const shadowCatcher = new THREE.Mesh(
    new THREE.CircleGeometry(7, 48),
    new THREE.ShadowMaterial({ opacity: 0.4 })
  );
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.set(0.3, 0.0005, 0);
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
