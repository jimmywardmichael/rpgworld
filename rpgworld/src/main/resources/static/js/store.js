(function(){
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x444466);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);
  const spot = new THREE.SpotLight(0xffffff, 0.9);
  spot.position.set(10,15,10);
  scene.add(spot);

  // Floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60,60), new THREE.MeshPhongMaterial({color:0x888888}));
  floor.rotation.x = -Math.PI/2; scene.add(floor);

  // Shelves
  const shelfMat = new THREE.MeshPhongMaterial({color:0x553311});
  function shelf(x,z){ const m=new THREE.Mesh(new THREE.BoxGeometry(20,2,4), shelfMat); m.position.set(x,1,z); scene.add(m); return m; }
  shelf(-15,-10); shelf(15,-10); shelf(-15,10); shelf(15,10);

  // Items
  const items = [];
  function addItem(name, color, x, z){
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.5,1.5,1.5), new THREE.MeshPhongMaterial({color}));
    m.position.set(x, 2, z); m.userData = {name}; scene.add(m); items.push(m);
  }
  addItem('Sword', 0xcccccc, -15, -10);
  addItem('Shield', 0x3366ff, -12, -10);
  addItem('Potion', 0xff3366, -9, -10);
  addItem('Armor', 0x996633, 15, -10);
  addItem('Boots', 0x663399, 12, -10);
  addItem('Ring', 0xffd700, 9, -10);

  camera.position.set(0, 12, 24);
  camera.lookAt(0,0,0);

  // Raycast click to buy
  const ray = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  window.addEventListener('click', (e)=>{
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
    const hits = ray.intersectObjects(items);
    if(hits.length){
      const item = hits[0].object.userData.name;
      alert('Bought: ' + item + ' (demo only)');
    }
  });

  // Keyboard M to return map
  window.addEventListener('keydown', (e)=>{ if(e.key.toLowerCase()==='m'){ window.location.href='/play/map'; }});

  window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function animate(){
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
})();