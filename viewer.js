import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
const cena = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5);
const renderizador = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderizador.setSize(window.innerWidth, window.innerHeight);
renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderizador.toneMapping = THREE.ACESFilmicToneMapping;
renderizador.toneMappingExposure = 1.0;
renderizador.setClearColor(0x000000, 0);
document.body.appendChild(renderizador.domElement);
const controles = new OrbitControls(camera, renderizador.domElement);
controles.enableDamping = true;
const alvoRenderizacao = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, { format: THREE.RGBAFormat, type: THREE.HalfFloatType });
const compositor = new EffectComposer(renderizador, alvoRenderizacao);
const passagemCena = new RenderPass(cena, camera);
compositor.addPass(passagemCena);
const passagemBrilho = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.8, 0.4, 0.85);
compositor.addPass(passagemBrilho);
compositor.addPass(new OutputPass());
const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.4);
cena.add(luzAmbiente);
const luzDirecional = new THREE.DirectionalLight(0xffffff, 1.5);
luzDirecional.position.set(5, 5, 5);
cena.add(luzDirecional);
let misturador;
let modelo;
let partesSabre = [];
const carregador = new GLTFLoader();
carregador.load('galaxys_edge_savis_workshop_custom_lightsaber.glb', (gltf) => {
    modelo = gltf.scene;
    const caixa = new THREE.Box3().setFromObject(modelo);
    const centro = caixa.getCenter(new THREE.Vector3());
    modelo.position.sub(centro);
    cena.add(modelo);
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
        acao.clampWhenFinished = true;
        misturador.setTime(gltf.animations[0].duration * 0.95);
    }
});
const mudarCor = (corHex) => {
    const intensidades = { 0x00ff00: 1.5, 0x0000ff: 7, 0xff0000: 6 };
    const intensidade = intensidades[corHex] || 1.5;
    partesSabre.forEach(parte => {
        parte.malha.material.emissive.setHex(corHex);
        parte.malha.material.color.setHex(0xffffff);
        parte.malha.material.emissiveIntensity = parte.ehCristal ? (intensity * 0.5) : intensidade;
        parte.malha.material.needsUpdate = true;
    });
};
document.getElementById('verde').addEventListener('click', () => mudarCor(0x00ff00));
document.getElementById('azul').addEventListener('click', () => mudarCor(0x0000ff));
document.getElementById('vermelho').addEventListener('click', () => mudarCor(0xff0000));
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderizador.setSize(window.innerWidth, window.innerHeight);
    compositor.setSize(window.innerWidth, window.innerHeight);
});
function animar() {
    requestAnimationFrame(animar);
    controles.update();
    compositor.render();
}
animar();
