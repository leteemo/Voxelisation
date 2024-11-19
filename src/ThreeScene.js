import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { getImageByColor } from './utils';
import { getTagByColor } from './utils'; 

function ThreeScene({ onColorSelected, onColorsUpdated, colorImages, colorTags }) {
  const mountRef = useRef(null);
  const [currentModel, setCurrentModel] = useState(null);
  const sceneRef = useRef(null);
  const mixerRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const actionRef = useRef(null);
  const [blockSize, setBlockSize] = useState(10);
  const [modelSize, setModelSize] = useState([10, 10, 10]);

  const ppoints = useState([]);
  ppoints.points = [];

  const [coors, setCoors] = useState([]);

  const [blocs, setBlocs] = useState([]);
  const valRef = useRef(null);
  const [colorsPoints, setColorsPoints] = useState([]);
  const keep_run = useRef(null);
  
  const [x_zone, setXZone] = useState(30);
  const [y_zone, setYZone] = useState(30);
  const [z_zone, setZZone] = useState(30);

  const [maxDuration, setMaxDuration] = useState(0);


  
  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth * 0.7 / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth * 0.7, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    sceneRef.current = scene;

    camera.position.z = 120;
    camera.position.y = 50;
    camera.position.x = 50;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const controls = new OrbitControls(camera, renderer.domElement);

    const rgbeLoader = new RGBELoader();

    rgbeLoader.load('/models/moonless_golf_1k.hdr', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.background = texture;
      scene.environment = texture;
    });

    const animate = () => {
      requestAnimationFrame(animate);

      const delta = clockRef.current.getDelta();
      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth * 0.7 / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth * 0.7, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    const handleKeyPress = (event) => {
      if (event.key === 'j' && actionRef.current) {
        actionRef.current.reset();
        actionRef.current.play();
      }
    };
    window.addEventListener('keypress', handleKeyPress);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keypress', handleKeyPress);
      mountRef.current.removeChild(renderer.domElement);
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
      }
    };
  }, []);

  useEffect(() => {
    const uniqueColors = [...new Set(colorsPoints.flat())];
    onColorsUpdated(uniqueColors);
  }, [colorsPoints, onColorsUpdated]);


  const generateFile = () => {

    keep_run.e = false;
    let data = "";

    coors.forEach(line_pt => {
      line_pt.forEach(pt => {
        data += `${pt[0]}___${pt[1]}___${pt[2]}___` + getTagByColor(pt[3], colorTags) + " ";
      });
      data += "\n";
    });

    const fileName = "file.json";
    const blob = new Blob([data], { type: "text/plain" });
    const file = new File([blob], fileName, { type: "text/plain" });
    const el = document.getElementById("telecharger");
    el.innerHTML = `<br><a href=${URL.createObjectURL(file)} download=${fileName}>Download ${fileName}</a>`;

  }

  const handleModelUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const loader = new GLTFLoader();
      const url = URL.createObjectURL(file);
      loader.load(url, (gltf) => {
        if (currentModel) {
          sceneRef.current.remove(currentModel);
        }
        const model = gltf.scene;
        setCurrentModel(model);
        sceneRef.current.add(model);
  
        const boundingBox = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        setModelSize(size);
  
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          
          const action = mixer.clipAction(gltf.animations[0]);
          action.setLoop(THREE.LoopOnce);
          action.clampWhenFinished = true;
          actionRef.current = action;
          mixerRef.current = mixer;

          const animationClip = gltf.animations[0];
          setMaxDuration(animationClip.duration);
  
  
          goToAnimationTime(1.0);
  
          mixer.addEventListener('finished', () => {
            keep_run.e = false;
          });
  
          action.play(); // Start the animation
        }
  
        URL.revokeObjectURL(url);
      }, undefined, (error) => {
        console.error('An error occurred loading the GLB model:', error);
      });
    }
  };
  

  const addCubeAtIntersection = (x, y, z, coef, directionX, directionY, directionZ) => {
    const position = new THREE.Vector3((x * coef) + (coef / 2), (y * coef) + (coef / 2), (z * coef) + (coef / 2));
    const direction = new THREE.Vector3(directionX, directionY, directionZ);
    raycaster.set(position, direction);

    if (currentModel) {
      const intersects = raycaster.intersectObject(currentModel, true);

      if (intersects.length > 0) {
        for (let i = 0; i < intersects.length; i++) {
          const pt = convertionPoint(intersects[i].point, coef);

          if (!ppoints.points.some(p => p.every((value, index) => value === pt[index]))) {
            const mat = intersects[i].object.material;
            const face = intersects[i].face;
            const vertexColors = intersects[i].object.geometry.attributes.color;
            const color = new THREE.Color();

            color.r = vertexColors.getX(face.a);
            color.g = vertexColors.getY(face.a);
            color.b = vertexColors.getZ(face.a);

            const colorHex = `#${color.getHexString()}`;

            const imageSrc = getImageByColor(colorHex, colorImages);
            const tag = getTagByColor(colorHex, colorTags);

            const geometry = new THREE.BoxGeometry(coef, coef, coef);
            const material = new THREE.MeshBasicMaterial({ color: color });

            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(pt[0], pt[1], pt[2]);
            sceneRef.current.add(cube);


            setBlocs(prevBlocs => [...prevBlocs, cube]);
            setColorsPoints(prevColorsPoints => [...prevColorsPoints, [colorHex]]);
            ppoints.points.push([pt, colorHex]);

            // Use the colorImages data to set image textures on the cubes
            if (colorImages[colorHex]) {
              const textureLoader = new THREE.TextureLoader();
              textureLoader.load(colorImages[colorHex], (texture) => {
                material.map = texture;
                material.needsUpdate = true;
              });
            }
          }
        }
      }
    }
  };

  const clearPoints = () => {
    setBlocs((prevBlocs) => {
      prevBlocs.forEach(cube => {
        sceneRef.current.remove(cube);
      });
      return [];
    });

    ppoints.points = [];
  };

  const convertionPoint = (point, ratio) => {
    return [parseInt(point.x / ratio) * ratio, parseInt(point.y / ratio) * ratio, parseInt(point.z / ratio) * ratio];
  };

  const genererPeriodique = () => {

    valRef.current = '';
    keep_run.e = true;
    actionRef.current.reset();
    actionRef.current.play();


    setXZone(Math.ceil(modelSize.x/blockSize));
    setYZone(Math.ceil(modelSize.y/blockSize));
    setZZone(Math.ceil(modelSize.z/blockSize));

    setCoors([]);

    generer(0, maxDuration, maxDuration/5);

  }

  const generer = (iteration, max_iteration, iteration_inc) => {

    goToAnimationTime(iteration);

    let coordonnees = '';

    let points = [];

    if (keep_run.e) {
      
      clearPoints();

      if (currentModel) {
        for (let y = -y_zone; y < y_zone; y++) {
          for (let x = -x_zone; x <= x_zone; x++) {
            addCubeAtIntersection(x, y, 100, blockSize, 0, 0, -1);
          }
        }
        for (let y = -y_zone; y < y_zone; y++) {
          for (let z = -z_zone; z <= z_zone; z++) {
            addCubeAtIntersection(100, y, z, blockSize, -1, 0, 0);
          }
        }
        for (let x = -x_zone; x < x_zone; x++) {
          for (let z = -z_zone; z <= z_zone; z++) {
            addCubeAtIntersection(x, 100, z, blockSize, 0, -1, 0);
          }
        }

        ppoints.points.forEach(pt => {
          points.push([(pt[0][0] / blockSize), (pt[0][1] / blockSize), (pt[0][2] / blockSize), pt[1]]);
        });

        setCoors(prevCoors => [...prevCoors, points]);

        valRef.current += coordonnees.trim() + "\n";
      }
    }

    if(iteration <= max_iteration){
      
      if(iteration < max_iteration){
        const delay = 1;
        const timer = setTimeout(() => {
          generer(iteration+iteration_inc, max_iteration, iteration_inc);
        }, delay);
      }

    }
  };


  const goToAnimationTime = (time) => {
    actionRef.current.paused = true;
    actionRef.current.time = time;
    actionRef.current.play();
  };


  const getTotalFrames = (action) => {
    if (!action) {
      console.error('No animation action provided');
      return 0;
    }
  
    const clip = action.getClip(); // Obtenir l'objet AnimationClip
    const duration = clip.duration; // Durée totale de l'animation
    const fps = 30; // Frames per second, ajustez selon vos besoins
    
    return Math.floor(duration * fps); // Calculer le nombre total de frames
  };
  


  const handleRangeChange = (event) => {
    setXZone(Math.ceil(modelSize.x/blockSize));
    setYZone(Math.ceil(modelSize.y/blockSize));
    setZZone(Math.ceil(modelSize.z/blockSize));

    setBlockSize(event.target.value);

  };


  return (
    <div style={{ position: 'relative' }}>
      
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      <input 
        type="file" 
        accept=".glb,.gltf" 
        onChange={handleModelUpload} 
        style={{ 
          position: 'absolute', 
          top: '10px', 
          left: '10px', 
          zIndex: 1, 
          padding: '5px', 
          background: '#4CAF50', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer'
        }} 
      />

      <button 
        onClick={genererPeriodique}
        style={{ 
          position: 'absolute', 
          top: '50px', 
          left: '10px', 
          zIndex: 1, 
          padding: '5px', 
          background: '#2196F3', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
        Generate Model
      </button>

      <button 
        onClick={generateFile}
        style={{ 
          position: 'absolute', 
          top: '80px', 
          left: '10px', 
          zIndex: 1, 
          padding: '5px', 
          background: '#2196F3', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
        Generate File
      </button>


      <div style={{
        position: 'absolute', 
        top: '10px', 
        left: '300px', 
        zIndex: 1,
      }}>
        Bloc size:
          <input 
            type="number" 
            value={blockSize} 
            onChange={handleRangeChange} 
          />
        </div>



      <div 
        id="telecharger" 
        style={{ 
          position: 'absolute', 
          bottom: '50px', 
          left: '10px', 
          zIndex: 1, 
          padding: '10px', 
          background: 'rgba(0,0,0,0.7)', 
          color: 'white',
          borderRadius: '5px'
        }}>
      </div>
    </div>
  );
}


export default ThreeScene;
