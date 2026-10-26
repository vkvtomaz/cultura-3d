import * as THREE from "../assets/vendor/three.module.min.js";
import { loadDragonModel } from "./dragon-model.js";

export async function createHeroScene({
  canvas,
  stage,
  hero,
  image,
  color = "#bb8b67",
  reducedMotion,
}) {
  const data = await loadDragonModel();
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
  camera.position.set(0, 0.12, 7.25);
  camera.lookAt(0, 0, 0);

  // Gera reflexos de estúdio sem carregar imagens externas.
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0x9c9d98);
  const panelGeometry = new THREE.PlaneGeometry(3, 5);
  const panelMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color().setRGB(3, 3, 3),
    side: THREE.DoubleSide,
  });
  for (const [x, y, z] of [
    [-4, 2, 2],
    [4, 1, 1],
    [0, 5, -2],
  ]) {
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(x, y, z);
    panel.lookAt(0, 0, 0);
    studio.add(panel);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio, 0.01);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.35;
  pmrem.dispose();
  panelGeometry.dispose();
  panelMaterial.dispose();

  scene.add(new THREE.HemisphereLight(0xe7edff, 0x736655, 1.1));
  const key = new THREE.DirectionalLight(0xffefdf, 3.4);
  key.position.set(-3, 5, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, {
    left: -3,
    right: 3,
    top: 3,
    bottom: -3,
    near: 0.5,
    far: 15,
  });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.015;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xc8ddff, 1.5);
  fill.position.set(4, 2, 3);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffd5b3, 2.5);
  rim.position.set(2, 4, -4);
  scene.add(rim);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(data.positions, 3),
  );
  geometry.setAttribute("normal", new THREE.BufferAttribute(data.normals, 3));
  geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));
  geometry.computeBoundingSphere();
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.65,
    metalness: 0,
    envMapIntensity: 1,
  });
  const model = new THREE.Mesh(geometry, material);
  model.castShadow = true;
  model.receiveShadow = true;
  scene.add(model);
  const floorGeometry = new THREE.PlaneGeometry(7, 7);
  const floorMaterial = new THREE.ShadowMaterial({ opacity: 0.1 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.68;
  floor.receiveShadow = true;
  scene.add(floor);

  const initialYaw = -0.2;
  let yawOffset = 0,
    targetX = -0.06,
    targetY = initialYaw;
  model.rotation.set(targetX, targetY, 0);
  let frame = 0,
    last = 0,
    visible = false,
    disposed = false,
    lost = false,
    drag = null;
  const abort = new AbortController();
  const listen = (element, name, callback, options = {}) =>
    element.addEventListener(name, callback, {
      ...options,
      signal: abort.signal,
    });
  const draw = () => {
    if (!disposed && !lost) renderer.render(scene, camera);
  };
  // Anima apenas enquanto a orientação muda, evitando renderização contínua.
  function tick(time) {
    frame = 0;
    if (disposed || lost || !visible || document.hidden) return;
    const delta = Math.min((time - last) / 1000 || 1 / 60, 0.05);
    last = time;
    const factor = reducedMotion.matches ? 1 : 1 - Math.exp(-6 * delta);
    model.rotation.x += (targetX - model.rotation.x) * factor;
    model.rotation.y += (targetY - model.rotation.y) * factor;
    draw();
    if (
      Math.abs(targetX - model.rotation.x) +
        Math.abs(targetY - model.rotation.y) >
      0.0003
    )
      frame = requestAnimationFrame(tick);
  }
  function wake() {
    if (!frame && visible && !document.hidden && !disposed && !lost) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }
  function resize() {
    const width = canvas.clientWidth,
      height = canvas.clientHeight;
    if (!width || !height || disposed) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    draw();
  }
  function setColor(value) {
    material.color.set(value);
    material.metalness = 0.76;
    material.roughness = 0.3;
    draw();
  }
  function resetView() {
    yawOffset = 0;
    targetX = -0.06;
    targetY = initialYaw;
    wake();
  }
  listen(hero, "pointermove", (event) => {
    if (drag || reducedMotion.matches || event.pointerType === "touch") return;
    const rect = hero.getBoundingClientRect();
    const x = THREE.MathUtils.clamp(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -1,
      1,
    );
    const y = THREE.MathUtils.clamp(
      1 - ((event.clientY - rect.top) / rect.height) * 2,
      -1,
      1,
    );
    targetY = initialYaw + yawOffset + x * 0.45;
    targetX = -0.06 - y * 0.1;
    wake();
  });
  listen(hero, "pointerleave", () => {
    if (!drag) {
      targetY = initialYaw + yawOffset;
      targetX = -0.06;
      wake();
    }
  });
  // Captura o ponteiro para manter o giro mesmo fora da área do modelo.
  listen(canvas, "pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      yaw: targetY,
      pitch: targetX,
    };
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add("is-dragging");
  });
  listen(canvas, "pointermove", (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    targetY = drag.yaw + (event.clientX - drag.x) * 0.012;
    yawOffset = targetY - initialYaw;
    if (event.pointerType !== "touch")
      targetX = THREE.MathUtils.clamp(
        drag.pitch + (event.clientY - drag.y) * 0.003,
        -0.4,
        0.35,
      );
    wake();
  });
  const endDrag = (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    drag = null;
    canvas.classList.remove("is-dragging");
    if (canvas.hasPointerCapture(event.pointerId))
      canvas.releasePointerCapture(event.pointerId);
  };
  listen(canvas, "pointerup", endDrag);
  listen(canvas, "pointercancel", endDrag);
  listen(canvas, "keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Home") resetView();
    else {
      yawOffset += event.key === "ArrowRight" ? 0.25 : -0.25;
      targetY = initialYaw + yawOffset;
      wake();
    }
  });
  listen(document, "visibilitychange", () => {
    if (!document.hidden) wake();
  });
  listen(reducedMotion, "change", () => {
    if (reducedMotion.matches) resetView();
  });
  listen(canvas, "webglcontextlost", (event) => {
    event.preventDefault();
    lost = true;
    image.hidden = false;
    canvas.hidden = true;
  });
  listen(canvas, "webglcontextrestored", () => {
    lost = false;
    canvas.hidden = false;
    resize();
    image.hidden = true;
    wake();
  });
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    },
    { threshold: 0.01 },
  );
  observer.observe(stage);
  canvas.hidden = false;
  resize();
  setColor(color);
  image.hidden = true;
  return {
    setColor,
    resetView,
    dispose() {
      disposed = true;
      abort.abort();
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      observer.disconnect();
      geometry.dispose();
      material.dispose();
      floorGeometry.dispose();
      floorMaterial.dispose();
      environment.dispose();
      key.shadow.map?.dispose();
      renderer.dispose();
    },
  };
}
