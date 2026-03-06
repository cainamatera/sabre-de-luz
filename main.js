import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
const cena = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 8);
const renderizador = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderizador.setSize(window.innerWidth, window.innerHeight);
renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderizador.toneMapping = THREE.ACESFilmicToneMapping;
renderizador.toneMappingExposure = 1.2;
renderizador.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderizador.domElement);
const passagemCena = new RenderPass(cena, camera);
passagemCena.clearColor = new THREE.Color(0, 0, 0);
passagemCena.clearAlpha = 0;
const passagemBrilho = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
const compositor = new EffectComposer(renderizador);
compositor.addPass(passagemCena);
compositor.addPass(passagemBrilho);
const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.4);
cena.add(luzAmbiente);
const luzDirecional = new THREE.DirectionalLight(0xffffff, 2);
luzDirecional.position.set(5, 5, 5);
cena.add(luzDirecional);
let misturador;
let modelo;
let scrollY = window.scrollY;
let scrollAtual = 0;
let duracaoAnimacao = 0;
let partesSabre = [];
const carregador = new GLTFLoader();
carregador.load('galaxys_edge_savis_workshop_custom_lightsaber.glb', (gltf) => {
  modelo = gltf.scene;
  const caixa = new THREE.Box3().setFromObject(modelo);
  const centro = caixa.getCenter(new THREE.Vector3());
  modelo.position.sub(centro);
  const agrupador = new THREE.Group();
  agrupador.add(modelo);
  cena.add(agrupador);
  modelo = agrupador;
  modelo.traverse((filho) => {
    if (filho.isMesh && filho.material) {
      const nomeMat = filho.material.name ? filho.material.name.toLowerCase() : '';
      const nomeNo = filho.name ? filho.name.toLowerCase() : '';
      const ehCristal = nomeNo.includes('crystal') || nomeNo.includes('kyber') || nomeMat.includes('crystal');
      const ehLamina = nomeMat.includes('blade') || nomeMat.includes('laser') || nomeMat.includes('neon');
      if (ehCristal || ehLamina) {
        filho.material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0x00ff00,
          emissiveIntensity: ehCristal ? 1 : 1.5
        });
        partesSabre.push({ malha: filho, ehCristal });
      } else {
        if (filho.material.emissive) {
          filho.material.emissiveIntensity = 0;
        }
      }
    }
  });
  if (gltf.animations && gltf.animations.length > 0) {
    misturador = new THREE.AnimationMixer(gltf.scene);
    const acao = misturador.clipAction(gltf.animations[0]);
    acao.play();
    duracaoAnimacao = gltf.animations[0].duration;
  }
});
const mudarCor = (corHex) => {
  const intensidades = { 0x00ff00: 1.5, 0x0000ff: 7, 0xff0000: 6 };
  const intensidade = intensidades[corHex] || 1.5;
  partesSabre.forEach(parte => {
    parte.malha.material.emissive.setHex(corHex);
    parte.malha.material.color.setHex(0xffffff);
    parte.malha.material.emissiveIntensity = parte.ehCristal ? (intensidade * 0.5) : intensidade;
    parte.malha.material.needsUpdate = true;
  });
};
document.getElementById('verde').addEventListener('click', () => mudarCor(0x00ff00));
document.getElementById('azul').addEventListener('click', () => mudarCor(0x0000ff));
document.getElementById('vermelho').addEventListener('click', () => mudarCor(0xff0000));
window.addEventListener('scroll', () => {
  scrollY = window.scrollY;
});
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderizador.setSize(window.innerWidth, window.innerHeight);
  compositor.setSize(window.innerWidth, window.innerHeight);
});
function animar() {
  requestAnimationFrame(animar);
  scrollAtual += (scrollY - scrollAtual) * 0.1;
  const scrollMax = document.body.scrollHeight - window.innerHeight;
  const porcentagemScroll = scrollMax > 0 ? scrollAtual / scrollMax : 0;
  if (modelo) {
    modelo.rotation.y = porcentagemScroll * Math.PI * 4;
    modelo.rotation.x = porcentagemScroll * Math.PI - (Math.PI / 4);
    camera.position.z = 12 - (porcentagemScroll * 4);
  }
  if (misturador && duracaoAnimacao > 0) {
    misturador.setTime(porcentagemScroll * duracaoAnimacao * 0.95);
  }
  compositor.render();
}
animar();
