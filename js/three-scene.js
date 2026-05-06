import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const canvas = document.getElementById('three-canvas');

let scene, camera, renderer, controls;
let spheresGroup = new THREE.Group();

let mouseX = 0;
let mouseY = 0;

const clock = new THREE.Clock();
const particlesData = [];

init();
animate();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  camera.position.z = 3.5;

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.enabled = false;


  scene.add(spheresGroup);

  const light = new THREE.AmbientLight(0xffffff, 1);
  scene.add(light);

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('resize', onResize);

  loadModel();
}

function onMouseMove(event) {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function loadModel() {
  const loader = new GLTFLoader();

  loader.load(
    '/assets/scene.gltf',
    (gltf) => {
      const model = gltf.scene;
      model.visible = false;

      scene.add(model);
      createSpheresFromModel(model);
    },
    undefined,
    (error) => {
      console.error(error);
    }
  );
}

function createSpheresFromModel(model) {
  let yMin = Infinity;
  let yMax = -Infinity;

  const allVertices = [];

  model.traverse((child) => {
    if (child.isMesh) {
      const position = child.geometry.attributes.position;

      for (let i = 0; i < position.count; i++) {
        const vertex = new THREE.Vector3().fromBufferAttribute(position, i);
        child.localToWorld(vertex);

        allVertices.push(vertex.clone());

        if (vertex.y < yMin) yMin = vertex.y;
        if (vertex.y > yMax) yMax = vertex.y;
      }
    }
  });

  const totalHeight = yMax - yMin;
  const NUM_SECTIONS = 100;
  const SPHERE_RADIUS = 0.005;
  const SPHERE_DIAMETER = SPHERE_RADIUS * 2;
  const MIN_DISTANCE = 0.035;

  const sectionYValues = [];
  for (let s = 0; s < NUM_SECTIONS; s++) {
    sectionYValues.push(yMin + (s / (NUM_SECTIONS - 1)) * totalHeight);
  }

  const sphereGeometry = new THREE.SphereGeometry(SPHERE_RADIUS, 8, 8);
  const placedPositions = [];

  for (const vertex of allVertices) {
    const isOnSection = sectionYValues.some(
      (sectionY) => Math.abs(vertex.y - sectionY) <= SPHERE_DIAMETER
    );
    if (!isOnSection) continue;

    const tooClose = placedPositions.some(
      (placed) => placed.distanceTo(vertex) < MIN_DISTANCE
    );
    if (tooClose) continue;

    const material = new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0
    });

    const sphere = new THREE.Mesh(sphereGeometry, material);

    const targetPosition = vertex.clone();
    const startPosition = getRandomStartPosition(targetPosition);

    sphere.position.copy(startPosition);
    sphere.scale.setScalar(0.2);

    spheresGroup.add(sphere);
    placedPositions.push(vertex.clone());

    particlesData.push({
      mesh: sphere,
      start: startPosition,
      target: targetPosition,
      delay: Math.random() * 1.2,
      duration: 1.8 + Math.random() * 0.8,
      progress: 0,
      arrived: false
    });
  }
}

function getRandomStartPosition(target) {
  const dir = new THREE.Vector3(
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() * 2 - 1
  ).normalize();

  const distance = 2.5 + Math.random() * 2.5;

  return target.clone().add(dir.multiplyScalar(distance));
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function animateParticles(elapsedTime) {
  for (const particle of particlesData) {
    const localTime = elapsedTime - particle.delay;

    if (localTime <= 0) continue;

    let t = localTime / particle.duration;
    if (t >= 1) {
      t = 1;
      particle.arrived = true;
    }

    const eased = easeOutCubic(t);

    particle.mesh.position.lerpVectors(
      particle.start,
      particle.target,
      eased
    );

    const scaleValue = 0.2 + eased * 0.8;
    particle.mesh.scale.setScalar(scaleValue);

    particle.mesh.material.opacity = Math.min(eased, 1);
  }
}

function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();

  animateParticles(elapsedTime);

  const targetX = -mouseY * 0.3;
  const targetY = mouseX * 0.5;

  spheresGroup.rotation.x += (targetX - spheresGroup.rotation.x) * 0.05;
  spheresGroup.rotation.y += (targetY - spheresGroup.rotation.y) * 0.05;

  controls.update();
  renderer.render(scene, camera);
}