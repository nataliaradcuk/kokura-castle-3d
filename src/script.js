import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Water } from 'three/addons/objects/Water.js'
import { Sky } from 'three/addons/objects/Sky.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { Timer } from 'three/addons/misc/Timer.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

const camera = new THREE.PerspectiveCamera(
    55,
    sizes.width / sizes.height,
    1,
    2000
)
camera.position.set(40, 25, 55);  
scene.add(camera)

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.5
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

controls.minDistance = 20      
controls.maxDistance = 100

controls.maxPolarAngle = Math.PI / 2.2;  
controls.minPolarAngle = 0.2;            


const waterGeometry = new THREE.PlaneGeometry(1000, 1000)

const water = new Water(
    waterGeometry,
    {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new THREE.TextureLoader().load(
            './water/waternormals.jpg',
            (texture) =>
            {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping
            }
        ),
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: false
    }
)

water.rotation.x = -Math.PI / 2
water.position.y = 0  
scene.add(water)


const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
directionalLight.position.set(50, 80, -30)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.near = 1
directionalLight.shadow.camera.far = 200
directionalLight.shadow.camera.left = -80
directionalLight.shadow.camera.right = 80
directionalLight.shadow.camera.top = 80
directionalLight.shadow.camera.bottom = -80

scene.add(directionalLight)

const pmremGenerator = new THREE.PMREMGenerator(renderer)

new RGBELoader()
    .setPath('./hdr/')
    .load('plains_sunset_4k.hdr', (hdrTexture) =>
    {
        const envMap = pmremGenerator.fromEquirectangular(hdrTexture).texture

        scene.environment = envMap        
        hdrTexture.dispose()
        pmremGenerator.dispose()
    })


const sky = new Sky()
sky.scale.set(1000, 1000, 1000)
scene.add(sky)

sky.material.uniforms['turbidity'].value = 2;    
sky.material.uniforms['rayleigh'].value = 1.5;   
sky.material.uniforms['mieCoefficient'].value = 0.003;
sky.material.uniforms['mieDirectionalG'].value = 0.7;
sky.material.uniforms['sunPosition'].value.set(0.2, 0.9, -0.3);


scene.fog = new THREE.FogExp2('#02131a', 0.015)

const extraAmbient = new THREE.AmbientLight('#86cdff', 0.275)
scene.add(extraAmbient)

const moonLight = new THREE.DirectionalLight('#86cdff', 1)
moonLight.position.set(3, 2, -8)
moonLight.castShadow = true
moonLight.shadow.mapSize.set(256, 256)
moonLight.shadow.camera.top = 8
moonLight.shadow.camera.bottom = -8
moonLight.shadow.camera.left = -8
moonLight.shadow.camera.right = 8
moonLight.shadow.camera.near = 1
moonLight.shadow.camera.far = 20

scene.add(moonLight)


const doorLight = new THREE.PointLight('#ff7d46', 5)
doorLight.position.set(0, 6, 5)  
doorLight.castShadow = true
doorLight.shadow.mapSize.set(256, 256)
doorLight.shadow.camera.far = 20
scene.add(doorLight)

const ghost1 = new THREE.PointLight('#8800ff', 6)
const ghost2 = new THREE.PointLight('#ff0088', 6)
const ghost3 = new THREE.PointLight('#ff0000', 6)

ghost1.castShadow = true
ghost2.castShadow = true
ghost3.castShadow = true

ghost1.shadow.mapSize.set(256, 256)
ghost2.shadow.mapSize.set(256, 256)
ghost3.shadow.mapSize.set(256, 256)

ghost1.shadow.camera.far = 10
ghost2.shadow.camera.far = 10
ghost3.shadow.camera.far = 10

scene.add(ghost1, ghost2, ghost3)

const gltfLoader = new GLTFLoader()

let monument = null
let fireflies = null

gltfLoader.load(
    './models/kokura_castle.glb',
    (gltf) =>
    {
        monument = gltf.scene

        const box = new THREE.Box3().setFromObject(monument)
        const size = new THREE.Vector3()
        box.getSize(size)

        const maxDim = Math.max(size.x, size.z)
        const scaleFactor = 40 / maxDim   
        monument.scale.setScalar(scaleFactor)
        box.setFromObject(monument)

        const center = new THREE.Vector3()
        box.getCenter(center)

        monument.position.x -= center.x
        monument.position.z -= center.z

        box.setFromObject(monument)
        monument.position.y -= box.min.y  

        monument.traverse((child) =>
        {
            if (child.isMesh) {
                child.castShadow = true
                child.receiveShadow = true
            }
        })

        scene.add(monument)

const textureLoader = new THREE.TextureLoader()

const floorColorTexture = textureLoader.load('./floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_diff_1k.webp')
const floorARMTexture = textureLoader.load('./floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_arm_1k.webp')
const floorNormalTexture = textureLoader.load('./floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_nor_gl_1k.webp')
const floorDisplacementTexture = textureLoader.load('./floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_disp_1k.webp')

floorColorTexture.colorSpace = THREE.SRGBColorSpace
floorColorTexture.wrapS = floorColorTexture.wrapT = THREE.RepeatWrapping
floorARMTexture.wrapS = floorARMTexture.wrapT = THREE.RepeatWrapping
floorNormalTexture.wrapS = floorNormalTexture.wrapT = THREE.RepeatWrapping
floorDisplacementTexture.wrapS = floorDisplacementTexture.wrapT = THREE.RepeatWrapping


const fenceMaterial = new THREE.MeshStandardMaterial({
    map: floorColorTexture,          
    aoMap: floorARMTexture,          
    roughnessMap: floorARMTexture,  
    metalnessMap: floorARMTexture,   
    normalMap: floorNormalTexture,   
    displacementMap: floorDisplacementTexture,  
    displacementScale: 0.15,        
    displacementBias: -0.05         
})


    const fenceSpacing = 0.8
    const fenceHeight = 6
    const fenceRadius = 0.22

    const islandBox = new THREE.Box3().setFromObject(monument);

    const minX = islandBox.min.x + 0.2;
    const maxX = islandBox.max.x - 0.2;
    const minZ = islandBox.min.z + 0.2;
    const maxZ = islandBox.max.z - 0.2;

    for (let x = minX; x <= maxX; x += fenceSpacing)
    {
        const front = new THREE.Mesh(
            new THREE.CylinderGeometry(fenceRadius, fenceRadius, fenceHeight, 16),
            fenceMaterial
    )
front.geometry.setAttribute(
    'uv2',
    new THREE.Float32BufferAttribute(front.geometry.attributes.uv.array, 2)
)

        front.position.set(x, fenceHeight / 2 - 2, minZ)
        front.castShadow = true
        scene.add(front)

        const back = front.clone()
        back.position.set(x, fenceHeight / 2 - 2, maxZ)
        scene.add(back)
    }

    for (let z = minZ; z <= maxZ; z += fenceSpacing)
    {
        const left = new THREE.Mesh(
            new THREE.CylinderGeometry(fenceRadius, fenceRadius, fenceHeight, 16),
            fenceMaterial
        )
        left.geometry.setAttribute(
'uv2',
new THREE.Float32BufferAttribute(left.geometry.attributes.uv.array, 2)
)

        left.position.set(minX, fenceHeight / 2 - 2, z)
        left.castShadow = true
        scene.add(left)

        const right = left.clone()
        right.position.set(maxX, fenceHeight / 2 - 2, z)
        scene.add(right)
    }


    const firefliesCount = 120
    const firefliesGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(firefliesCount * 3)

    const fxMinX = minX - 5
    const fxMaxX = maxX + 5
    const fxMinZ = minZ - 5
    const fxMaxZ = maxZ + 5

    for (let i = 0; i < firefliesCount; i++)
    {
        const i3 = i * 3

        positions[i3 + 0] = THREE.MathUtils.lerp(fxMinX, fxMaxX, Math.random())
        positions[i3 + 1] = Math.random() * 15 + 5
        positions[i3 + 2] = THREE.MathUtils.lerp(fxMinZ, fxMaxZ, Math.random())
    }

    firefliesGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
    )

    const particleCanvas = document.createElement('canvas')
    particleCanvas.width = 64
    particleCanvas.height = 64
    const ctx = particleCanvas.getContext('2d')

    ctx.beginPath()
    ctx.arc(32, 32, 24, 0, Math.PI * 2)
    ctx.fillStyle = 'white'
    ctx.fill()

    const circleTexture = new THREE.CanvasTexture(particleCanvas)

    const firefliesMaterial = new THREE.PointsMaterial({
        color: 0xffffcc,
        size: 1.4,
        transparent: true,
        opacity: 1,
        alphaMap: circleTexture,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    })

    fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial)
        scene.add(fireflies)
    }
)
const sparkVertex = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;
const sparkFragment = `
    uniform float uTime;
    varying vec2 vUv;

    void main() {
        // Відстань від центру (будує коло)
        float dist = distance(vUv, vec2(0.5));

        // М’який край кулі
        float glow = smoothstep(0.4, 0.0, dist);

        // Пульсація від слабкого до сильної
        float pulse = sin(uTime * 2.0) * 0.5 + 0.5;

        gl_FragColor = vec4(1.0, 1.0, 1.0, glow * pulse);
    }
`;

const sparkGeometry = new THREE.PlaneGeometry(7, 7);
const sparkMaterial = new THREE.ShaderMaterial({
    vertexShader: sparkVertex,
    fragmentShader: sparkFragment,
    uniforms: {
        uTime: { value: 0 }
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});

const sparkMesh = new THREE.Mesh(sparkGeometry, sparkMaterial);

sparkMesh.lookAt(camera.position);
sparkMesh.position.set(0, 30, 0);

scene.add(sparkMesh);


window.addEventListener('resize', () =>
{
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

const timer = new Timer()

const tick = () =>
{
    timer.update()
    const elapsedTime = timer.getElapsed()

    water.material.uniforms['time'].value = elapsedTime

    if (fireflies)
    {
        fireflies.rotation.y = elapsedTime * 0.05
    }

const g1 = elapsedTime * 0.5
ghost1.position.x = Math.cos(g1) * 40
ghost1.position.z = Math.sin(g1) * 40
ghost1.position.y = Math.sin(g1 * 2.0) * 10 + 5

const g2 = -elapsedTime * 0.32
ghost2.position.x = Math.cos(g2) * 55
ghost2.position.z = Math.sin(g2) * 55
ghost2.position.y = Math.sin(g2 * 3.0) * 12 + 5

const g3 = elapsedTime * 0.21
ghost3.position.x = Math.cos(g3) * 70
ghost3.position.z = Math.sin(g3) * 70
ghost3.position.y = Math.sin(g3 * 4.0) * 15 + 6

sparkMaterial.uniforms.uTime.value = elapsedTime;

    controls.update()
    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}

tick()
