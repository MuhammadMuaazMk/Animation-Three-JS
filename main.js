import "./style.css";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { RGBShiftShader } from "three/examples/jsm/shaders/RGBShiftShader";
import gsap from "gsap";
import LocomotiveScroll from "locomotive-scroll";

const locomotiveScrolls = new LocomotiveScroll({
  smooth:true,
  lerp:0.1}
);

//scene
const scene = new THREE.Scene();
// camera
const camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.z = 3.5;

//renderer
const canvas = document.querySelector("#canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true,alpha:true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// to get great performance without sacrificing resources
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

// Post processing setup
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.0015;
composer.addPass(rgbShiftPass);

// HDRI Environment
let model;
const rgbeLoader = new RGBELoader();
rgbeLoader.load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/pond_bridge_night_1k.hdr",
  function (texture) {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        //scene.background = envMap;
    scene.environment = envMap;
    texture.dispose();
    pmremGenerator.dispose();

    const loader = new GLTFLoader();

    loader.load(
      "./DamagedHelmet.gltf",
      function (gltf) {
        model = gltf.scene;
        scene.add(model);
      },
      function (xhr) {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      function (error) {
        console.error("An error happened:", error);
      });
  });

//Add OrbitControls
// const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true

window.addEventListener("resize",()=>{
  renderer.setSize(window.innerWidth,window.innerHeight)
  composer.setSize(window.innerWidth,window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
})

window.addEventListener("mousemove",(e)=>{
  if(model){
    const rotationX = (e.clientX / window.innerWidth - .5) *   Math.PI * .12;
    const rotationY = (e.clientY / window.innerHeight - .5) *   Math.PI * .12;
    gsap.to(model.rotation, {
      x: rotationY,
      y: rotationX,
      duration: 0.7,
      ease: "power2.out"
    });

  }
  
})
function animate() {
  window.requestAnimationFrame(animate);
  
  composer.render();
}
animate();
//request animation frame
