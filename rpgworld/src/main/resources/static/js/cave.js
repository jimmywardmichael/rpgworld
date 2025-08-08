(function(){
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0x223344, 0.6);
  scene.add(ambient);
  const torch = new THREE.PointLight(0xffaa66, 1.2, 20);
  torch.position.set(0, 3, 0);
  scene.add(torch);

  // Floor
  const floorGeo = new THREE.PlaneGeometry(120, 120);
  const floorMat = new THREE.MeshLambertMaterial({color: 0x222222});
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI/2;
  scene.add(floor);

  // Walls (simple boxes around)
  const wallMat = new THREE.MeshLambertMaterial({color: 0x111111});
  function wall(w,h,d,x,y,z){
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), wallMat);
    m.position.set(x,y,z); scene.add(m); return m;
  }
  wall(120,10,2, 0,5,-60);
  wall(120,10,2, 0,5, 60);
  wall(2,10,120, -60,5,0);
  wall(2,10,120, 60,5,0);

  // Monsters (green cubes)
  const monsters = [];
  const monsterMat = new THREE.MeshLambertMaterial({color: 0x00ff66});
  for(let i=0;i<6;i++){
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.5,1.5,1.5), monsterMat);
    m.position.set((Math.random()*80-40), 0.75, (Math.random()*80-20));
    scene.add(m); monsters.push(m);
  }

  // Dragon (big red)
  const dragonMat = new THREE.MeshLambertMaterial({color: 0xff0000});
  const dragon = new THREE.Mesh(new THREE.BoxGeometry(5,3,8), dragonMat);
  dragon.position.set(0, 1.5, 40);
  scene.add(dragon);

  // Player capsule
  const player = new THREE.Mesh(new THREE.CapsuleGeometry(0.4,1.0,4,8), new THREE.MeshStandardMaterial({color:0xcccccc}));
  player.position.set(0,1, -40);
  scene.add(player);

  camera.position.set(0, 1.6, -37);
  let yaw = 0, pitch = 0;
  const keys = {};
  window.addEventListener('keydown', (e)=>{
    keys[e.key.toLowerCase()] = true;
    if(e.key.toLowerCase()==='m'){ window.location.href = '/play/map'; }
  });
  window.addEventListener('keyup',   (e)=> keys[e.key.toLowerCase()] = false);

  // Mouse drag to look
  let dragging=false, lx=0, ly=0;
  window.addEventListener('mousedown', (e)=>{ dragging=true; lx=e.clientX; ly=e.clientY; });
  window.addEventListener('mouseup', ()=> dragging=false);
  window.addEventListener('mousemove', (e)=>{
    if(!dragging) return;
    const dx=e.clientX-lx, dy=e.clientY-ly; lx=e.clientX; ly=e.clientY;
    yaw -= dx*0.003; pitch -= dy*0.003; const c=Math.PI/2-0.05; if(pitch>c)pitch=c; if(pitch<-c)pitch=-c;
  });

  // Pointer Lock (click canvas), controls config, and jump physics
  const canvas = renderer.domElement;
  canvas.addEventListener('click', ()=>{
    if(document.pointerLockElement !== canvas){ canvas.requestPointerLock(); }
  });
  window.addEventListener('mousemove', (e)=>{
    if(document.pointerLockElement === canvas){
      yaw   -= (e.movementX||0) * 0.0025;
      pitch -= (e.movementY||0) * 0.0025;
      const c = Math.PI/2 - 0.05; if(pitch>c)pitch=c; if(pitch<-c)pitch=-c;
    }
  });
  window.addEventListener('keydown', (e)=>{ if(e.code==='Space') e.preventDefault(); }, {passive:false});

  const controls = {
    forward:['w','arrowup'], back:['s','arrowdown'], left:['a','arrowleft'], right:['d','arrowright'], jump:[' '], sprint:['shift']
  };
  const keyDown = k=> !!keys[k];
  const anyDown = list => list.some(k=> keyDown(k));
  const isDown = action => anyDown(controls[action]||[]);

  let vy = 0; const gravity = 20; const jumpStrength = 8; let grounded = true; const groundY = 1;

  function move(dt){
    const speed = isDown('sprint') ? 7 : 3.5;
    const fw = isDown('forward') ? 1 : isDown('back') ? -1 : 0;
    const st = isDown('right') ? 1 : isDown('left') ? -1 : 0;
    const dirX = Math.sin(yaw), dirZ = Math.cos(yaw);
    const rightX = Math.cos(yaw), rightZ = -Math.sin(yaw);
    const vx = (dirX*fw + rightX*st)*speed*dt;
    const vz = (dirZ*fw + rightZ*st)*speed*dt;
    player.position.x += vx; player.position.z += vz;

    // Jumping physics
    if(isDown('jump') && grounded){ vy = jumpStrength; grounded = false; }
    vy -= gravity*dt;
    player.position.y += vy*dt;
    if(player.position.y <= groundY){ player.position.y = groundY; vy = 0; grounded = true; }

    // Keep inside walls
    player.position.x = Math.max(-55, Math.min(55, player.position.x));
    player.position.z = Math.max(-55, Math.min(55, player.position.z));

    camera.position.set(player.position.x - Math.sin(yaw)*2.5, player.position.y + 0.6, player.position.z - Math.cos(yaw)*2.5);
    camera.lookAt(player.position.x, player.position.y+0.5, player.position.z);

    // Interactions
    if(distance(player.position, dragon.position) < 5){
      alert('You stand before the DRAGON! (Demo: visual only).');
    }
  }

  function distance(a, b){ return Math.hypot(a.x-b.x, a.z-b.z); }

  window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  let last=performance.now();
  function animate(){
    const now=performance.now(); const dt=Math.min(0.05,(now-last)/1000); last=now;
    // simple monster bob
    monsters.forEach((m,i)=>{ m.position.y = 0.75 + Math.sin(now*0.002 + i)*0.1; });
    move(dt);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
})();