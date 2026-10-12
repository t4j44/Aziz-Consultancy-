/* 3D route globe · Abdul Aziz Tours & Consultancy
 * One WebGL canvas holding several 3D assets:
 *   - a navy globe with a soft atmosphere rim and dotted land (real Natural Earth data)
 *   - gold route arcs from Shaistagonj to seven destinations, drawn in sequence
 *   - a model plane (built in code) that flies the arc being drawn
 *   - beacons at Shaistagonj (pulsing) and at each destination
 * setProgress(0..1) is driven by scroll. Rendering runs only while the stage is on screen.
 * Loaded on demand by motion.js on desktop; the page keeps its flat map if this fails. */
import {
  AdditiveBlending, AmbientLight, BackSide, BoxGeometry, BufferGeometry, CatmullRomCurve3,
  CylinderGeometry, DirectionalLight, DoubleSide, Float32BufferAttribute, Group, Mesh,
  MeshBasicMaterial, MeshStandardMaterial, MathUtils, PerspectiveCamera, Points, PointsMaterial,
  RingGeometry, Scene, SphereGeometry, TubeGeometry, Vector3, WebGLRenderer
} from './vendor/three.lite.module.js';

const HUB = { lat: 24.2676, lon: 91.4643 };

const DESTINATIONS = [
  { id: 'portugal', lat: 38.7223, lon: -9.1393 },
  { id: 'lithuania', lat: 54.6872, lon: 25.2797 },
  { id: 'finland', lat: 60.1699, lon: 24.9384 },
  { id: 'moldova', lat: 47.0105, lon: 28.8638 },
  { id: 'greece', lat: 37.9838, lon: 23.7275 },
  { id: 'italy', lat: 41.9028, lon: 12.4964 },
  { id: 'malaysia', lat: 3.139, lon: 101.6869 }
];

const COLORS = { navy: 0x062665, royal: 0x0b50a3, gold: 0xcb8711, goldHi: 0xfad158, ivory: 0xf5f3ec };

// Radians the globe turns through while the route is drawn.
const TURN = -0.35;

// Unit-sphere point for latitude/longitude, using the same convention as three.js SphereGeometry.
function surface(lat, lon, radius) {
  const phi = MathUtils.degToRad(90 - lat);
  const theta = MathUtils.degToRad(lon + 180);
  return new Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Great-circle path between two unit directions, lifted above the surface in a smooth arch.
function arcPoints(a, b, steps, lift) {
  const ua = a.clone().normalize();
  const ub = b.clone().normalize();
  const omega = Math.acos(MathUtils.clamp(ua.dot(ub), -1, 1));
  const sinOmega = Math.sin(omega);
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = ua.clone().multiplyScalar(Math.sin((1 - t) * omega) / sinOmega)
      .add(ub.clone().multiplyScalar(Math.sin(t * omega) / sinOmega));
    points.push(p.multiplyScalar(1 + lift * Math.sin(Math.PI * t)));
  }
  return points;
}

// A small model plane built from primitives: gold fuselage and fin, navy wings and tail. Nose points +Z.
function buildPlane() {
  const group = new Group();
  const ivory = new MeshStandardMaterial({ color: COLORS.ivory, metalness: 0.4, roughness: 0.35 });
  const gold = new MeshStandardMaterial({ color: COLORS.goldHi, metalness: 0.6, roughness: 0.3 });

  const fuselage = new Mesh(new CylinderGeometry(0.0055, 0.0085, 0.09, 14), ivory);
  fuselage.rotation.x = Math.PI / 2;

  const wings = new Mesh(new BoxGeometry(0.11, 0.0022, 0.022), gold);
  wings.position.z = 0.004;

  const tail = new Mesh(new BoxGeometry(0.036, 0.0022, 0.012), gold);
  tail.position.z = -0.038;

  const fin = new Mesh(new BoxGeometry(0.0022, 0.02, 0.014), gold);
  fin.position.set(0, 0.01, -0.038);

  group.add(fuselage, wings, tail, fin);
  group.scale.setScalar(2.1);
  return group;
}

/**
 * Mounts the globe into `container` (a positioned element).
 * options.dots: URL of the [lat, lon] land-dot list.
 * Resolves with { setProgress(p), destroy() }. Rejects when WebGL is unavailable.
 */
export async function mountGlobe(container, options = {}) {
  const probe = document.createElement('canvas');
  if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) {
    throw new Error('WebGL unavailable');
  }

  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  container.appendChild(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0, 4.8);

  scene.add(new AmbientLight(0xffffff, 0.9));
  const sun = new DirectionalLight(0xffffff, 1.4);
  sun.position.set(2, 3, 4);
  scene.add(sun);

  // `align` centres the view between the hub and the middle of the destinations, so the
  // whole route stays in frame. `spin` turns the globe a little with scroll.
  const align = new Group();
  const spin = new Group();
  align.add(spin);
  scene.add(align);

  const hubDir = surface(HUB.lat, HUB.lon, 1).normalize();
  const centre = new Vector3();
  DESTINATIONS.forEach((d) => centre.add(surface(d.lat, d.lon, 1).normalize()));
  const focus = hubDir.clone().add(centre.normalize()).normalize();
  align.quaternion.setFromUnitVectors(focus, new Vector3(0, 0, 1));

  // Body and atmosphere rim
  const body = new Mesh(
    new SphereGeometry(0.99, 96, 64),
    new MeshStandardMaterial({ color: COLORS.navy, roughness: 0.85, metalness: 0 })
  );
  spin.add(body);

  const rim = new Mesh(
    new SphereGeometry(1.1, 96, 64),
    new MeshBasicMaterial({
      color: COLORS.royal, side: BackSide, transparent: true, opacity: 0.4,
      blending: AdditiveBlending, depthWrite: false
    })
  );
  spin.add(rim);

  // Dotted land from the Natural Earth grid
  const dots = await fetch(options.dots).then((r) => {
    if (!r.ok) throw new Error('land dots missing');
    return r.json();
  });
  const positions = new Float32Array(dots.length * 3);
  dots.forEach(([lat, lon], i) => {
    const v = surface(lat, lon, 1.004);
    positions[i * 3] = v.x;
    positions[i * 3 + 1] = v.y;
    positions[i * 3 + 2] = v.z;
  });
  const dotGeometry = new BufferGeometry();
  dotGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  spin.add(new Points(dotGeometry, new PointsMaterial({
    color: COLORS.ivory, size: 0.022, sizeAttenuation: true,
    transparent: true, opacity: 0.75, depthWrite: false
  })));

  // Beacon at Shaistagonj: core dot plus a pulsing ring
  const hubPos = surface(HUB.lat, HUB.lon, 1.006);
  const hubCore = new Mesh(new SphereGeometry(0.024, 24, 16), new MeshBasicMaterial({ color: COLORS.goldHi }));
  hubCore.position.copy(hubPos);
  spin.add(hubCore);

  const pulse = new Mesh(
    new RingGeometry(0.03, 0.04, 48),
    new MeshBasicMaterial({ color: COLORS.goldHi, side: DoubleSide, transparent: true, opacity: 0.8, depthWrite: false })
  );
  pulse.position.copy(surface(HUB.lat, HUB.lon, 1.007));
  pulse.lookAt(hubPos.clone().multiplyScalar(2));
  spin.add(pulse);

  // Routes: a faint track and a drawn glow for each destination
  const routes = DESTINATIONS.map((d) => {
    const end = surface(d.lat, d.lon, 1).normalize();
    const angle = Math.acos(MathUtils.clamp(hubDir.dot(end), -1, 1));
    const lift = 0.08 + 0.22 * (angle / Math.PI);
    const curve = new CatmullRomCurve3(arcPoints(hubDir, end, 90, lift), false, 'catmullrom', 0.5);

    const track = new Mesh(
      new TubeGeometry(curve, 180, 0.0048, 8, false),
      new MeshBasicMaterial({ color: COLORS.goldHi, transparent: true, opacity: 0.24, depthWrite: false })
    );
    const drawn = new TubeGeometry(curve, 180, 0.0095, 8, false);
    const path = new Mesh(
      drawn,
      new MeshBasicMaterial({ color: COLORS.goldHi, transparent: true, opacity: 0.95, depthWrite: false })
    );
    drawn.setDrawRange(0, 0);
    spin.add(track, path);

    const beacon = new Mesh(new SphereGeometry(0.02, 20, 14), new MeshBasicMaterial({ color: COLORS.goldHi }));
    beacon.position.copy(end.clone().multiplyScalar(1.006));
    spin.add(beacon);

    return { curve, path, indexCount: drawn.index.count };
  });

  const plane = buildPlane();
  plane.visible = false;
  spin.add(plane);

  // Sizing
  function resize() {
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  // State and frame
  let progress = 0;
  let clock = 0;
  let running = false;
  let onScreen = false;
  let raf = 0;
  let last = 0;

  const forward = new Vector3(0, 0, 1);

  function update(dt) {
    clock += dt;
    spin.rotation.y = TURN * progress + Math.sin(clock * 0.4) * 0.12;

    // Each arc gets its own slot in the scroll range; the plane flies the arc being drawn.
    const n = routes.length;
    let tip = null;
    routes.forEach((route, i) => {
      const local = MathUtils.clamp((progress * n - i) / 1.2, 0, 1);
      route.path.geometry.setDrawRange(0, Math.floor((route.indexCount * local) / 6) * 6);
      if (local > 0 && local < 1) tip = { route, t: local };
    });

    if (tip) {
      const at = tip.route.curve.getPointAt(tip.t);
      const ahead = tip.route.curve.getPointAt(Math.min(1, tip.t + 0.01));
      plane.position.copy(at);
      plane.quaternion.setFromUnitVectors(forward, ahead.clone().sub(at).normalize());
      plane.visible = true;
    } else {
      plane.visible = false;
    }

    const k = clock * 0.6 % 1;
    pulse.scale.setScalar(1 + k * 1.6);
    pulse.material.opacity = 0.8 * (1 - k);
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    update(dt);
    renderer.render(scene, camera);
  }

  function start() {
    if (running || !onScreen || document.hidden) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  const observer = new IntersectionObserver((entries) => {
    onScreen = entries[0].isIntersecting;
    if (onScreen) start();
    else stop();
  }, { threshold: 0.01 });
  observer.observe(container);

  function onVisibility() {
    if (document.hidden) stop();
    else start();
  }
  document.addEventListener('visibilitychange', onVisibility);

  update(0);
  renderer.render(scene, camera);

  return {
    setProgress(value) {
      progress = MathUtils.clamp(value, 0, 1);
      if (!running) {
        update(0);
        renderer.render(scene, camera);
      }
    },
    destroy() {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) object.material.dispose();
      });
      renderer.dispose();
      canvas.remove();
    }
  };
}
