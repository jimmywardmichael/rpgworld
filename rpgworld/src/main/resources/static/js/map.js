(function(){
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(6,12,8);
  scene.add(dir);

  // Textures (pixelated, Minecraft-like)
  function makeCheckerTexture(c1='#6ab04c', c2='#4caf50', size=8){
    const canvas = document.createElement('canvas'); canvas.width=size; canvas.height=size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = c1; ctx.fillRect(0,0,size,size);
    ctx.fillStyle = c2;
    for(let y=0;y<size;y++){
      for(let x=0;x<size;x++){
        if(((x&1)^(y&1))===1) ctx.fillRect(x, y, 1, 1);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestMipMapNearestFilter;
    return tex;
  }
  const grassTex = makeCheckerTexture('#5fb64a','#4a9e3c',8);
  grassTex.repeat.set(64,64);

  // Ground
  const groundGeo = new THREE.PlaneGeometry(200, 200);
  const groundMat = new THREE.MeshLambertMaterial({map: grassTex});
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI/2;
  scene.add(ground);

  // World points of interest are now integrated in-map (no external gates)

  // Build a simple humanoid from parts
  function buildHumanoid(opts){
    const skin = new THREE.Color(opts.skin||'#ffddaa');
    const shirt = new THREE.Color(opts.shirt||'#6699ff');
    const pants = new THREE.Color(opts.pants||'#333333');

    const group = new THREE.Group();

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9,1.1,0.5), new THREE.MeshStandardMaterial({color: shirt, roughness:0.8}));
    torso.position.y = 1.2; group.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), new THREE.MeshStandardMaterial({color: skin}));
    head.position.y = 1.95; group.add(head);

    // Face (eyes/mouth)
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), new THREE.MeshBasicMaterial({color:0x000000}));
    const eyeR = eyeL.clone(); eyeL.position.set(-0.1, 2.02, 0.31); eyeR.position.set(0.1, 2.02, 0.31);
    group.add(eyeL); group.add(eyeR);
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.20,0.03,0.02), new THREE.MeshBasicMaterial({color:0x000000}));
    mouth.position.set(0, 1.90, 0.33); group.add(mouth);

    const armMat = new THREE.MeshStandardMaterial({color: shirt});
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.25,0.9,0.25), armMat); armL.position.set(-0.6, 1.2, 0);
    const armR = armL.clone(); armR.position.x = 0.6; group.add(armL); group.add(armR);
    // Shield (attached to left arm), hidden by default
    const shield = new THREE.Mesh(new THREE.CircleGeometry(0.45, 24), new THREE.MeshStandardMaterial({color:0x4477ff, metalness:0.2, roughness:0.6}));
    shield.rotation.y = Math.PI/2; shield.position.set(-0.85, 1.2, 0);
    shield.visible = false; group.add(shield);

    const legMat = new THREE.MeshStandardMaterial({color: pants});
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.3,1.0,0.3), legMat); legL.position.set(-0.22, 0.5, 0);
    const legR = legL.clone(); legR.position.x = 0.22; group.add(legL); group.add(legR);

    function buildWeapon(type){
      const t = (type||'').toLowerCase();
      let mesh;
      if(t==='mace'){
        // handle + sphere head
        const groupW = new THREE.Group();
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.8,8), new THREE.MeshStandardMaterial({color:0x8b5a2b}));
        handle.rotation.z = Math.PI/2; handle.position.set(0.75,0.9,0);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.18,12,12), new THREE.MeshStandardMaterial({color:0xcccccc}));
        head.position.set(1.05,0.9,0);
        groupW.add(handle); groupW.add(head); mesh = groupW;
      } else if(t==='axe'){
        const groupW = new THREE.Group();
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.8,8), new THREE.MeshStandardMaterial({color:0x8b5a2b}));
        handle.rotation.z = Math.PI/2; handle.position.set(0.75,0.9,0);
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.5,0.3), new THREE.MeshStandardMaterial({color:0xcccccc}));
        blade.position.set(1.0,0.9,0);
        groupW.add(handle); groupW.add(blade); mesh = groupW;
      } else if(t==='scythe'){
        const groupW = new THREE.Group();
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,1.2,8), new THREE.MeshStandardMaterial({color:0x8b5a2b}));
        handle.rotation.z = Math.PI/2; handle.position.set(0.9,0.9,0);
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02,0.7,0.25), new THREE.MeshStandardMaterial({color:0xcccccc}));
        blade.position.set(1.3,1.1,0);
        groupW.add(handle); groupW.add(blade); mesh = groupW;
      } else if(t==='bow'){
        const groupW = new THREE.Group();
        const bow = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.03, 8, 16, Math.PI*1.8), new THREE.MeshStandardMaterial({color:0x8b5a2b}));
        bow.rotation.y = Math.PI/2; bow.position.set(0.9, 1.0, 0);
        const string = new THREE.Mesh(new THREE.CylinderGeometry(0.005,0.005,0.85,6), new THREE.MeshStandardMaterial({color:0xdddddd}));
        string.rotation.z = Math.PI/2; string.position.set(0.9,1.0,0);
        groupW.add(bow); groupW.add(string); mesh = groupW;
      } else if(t==='staff'){
        const groupW = new THREE.Group();
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,1.2,8), new THREE.MeshStandardMaterial({color:0x6b4b2b}));
        handle.rotation.z = Math.PI/2; handle.position.set(0.95,1.0,0);
        const gem = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), new THREE.MeshStandardMaterial({color:0x77ddff, emissive:0x224488}));
        gem.position.set(1.3,1.05,0);
        groupW.add(handle); groupW.add(gem); mesh = groupW;
      } else { // sword
        const groupW = new THREE.Group();
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.8,0.08), new THREE.MeshStandardMaterial({color:0xdddddd}));
        blade.rotation.z = Math.PI/2; blade.position.set(0.9,0.9,0);
        const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.05,0.05), new THREE.MeshStandardMaterial({color:0x555555}));
        hilt.position.set(0.75,0.9,0);
        groupW.add(blade); groupW.add(hilt); mesh = groupW;
      }
      return mesh;
    }
    const weapon = buildWeapon(opts.weapon||'Sword');
    group.add(weapon);

    group.userData = { torso, head, legL, legR, armL, armR, weapon, buildWeapon, shield };
    return group;
  }

  // Player entity
  const player = new THREE.Group();
  scene.add(player);
  const playerMesh = buildHumanoid({});
  player.add(playerMesh);
  player.position.set(0,0,0);

  // World: trees and monsters
  // Additional pixel textures
  const barkTex = makeCheckerTexture('#5a3b1e','#3e2a17',8); barkTex.repeat.set(8,8);
  const leafTex = makeCheckerTexture('#2e8b57','#246e45',8); leafTex.repeat.set(8,8);
  const stoneTex = makeCheckerTexture('#777777','#9a9a9a',8); stoneTex.repeat.set(6,6);
  const woodTex = makeCheckerTexture('#8b5a2b','#704621',8); woodTex.repeat.set(6,6);
  const roofTex = makeCheckerTexture('#553322','#3c2418',8); roofTex.repeat.set(6,6);

  // Collision colliders
  const worldCircles = []; // {x,z,r}
  const worldAabbs = [];   // {cx,cz,hx,hz}
  const storeAabbs = [];   // active when in store interior

  function addTree(x,z){
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.3,2,8), new THREE.MeshLambertMaterial({map: barkTex}));
    trunk.position.set(x,1,z);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 12), new THREE.MeshLambertMaterial({map: leafTex}));
    crown.position.set(x,2.4,z);
    scene.add(trunk); scene.add(crown);
    worldCircles.push({x, z, r: 0.8});
  }
  for(let i=0;i<40;i++) addTree(Math.random()*180-90, Math.random()*180-90);

  // Extra terrain: gentle hills, rocks, and a small water pond
  const hillMat = new THREE.MeshLambertMaterial({color:0x2c7a2c});
  function addHill(x,z,r=6,h=1.5){ const m=new THREE.Mesh(new THREE.SphereGeometry(r,24,24), hillMat); m.scale.y=0.4; m.position.set(x,h*0.5,z); scene.add(m); }
  addHill(25,25,8,2); addHill(-30,-10,7,1.6); addHill(-40,35,6,1.2);
  const rockMat = new THREE.MeshLambertMaterial({map: stoneTex});
  function addRock(x,z,s=1.2){ const m=new THREE.Mesh(new THREE.DodecahedronGeometry(s), rockMat); m.position.set(x, s*0.7, z); scene.add(m); }
  for(let i=0;i<10;i++){ addRock(Math.random()*180-90, Math.random()*180-90, 0.7+Math.random()*1.2); }
  // Pond
  const pond = new THREE.Mesh(new THREE.CircleGeometry(6, 32), new THREE.MeshPhongMaterial({color:0x3366aa, transparent:true, opacity:0.8}));
  pond.rotation.x = -Math.PI/2; pond.position.set(-20, 0.01, 30); scene.add(pond);

  // In-map Store (simple hut) and Cave entrances
  const storeGroup = new THREE.Group();
  const hut = new THREE.Mesh(new THREE.BoxGeometry(6,3,6), new THREE.MeshLambertMaterial({map: woodTex}));
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.5,2.5,4), new THREE.MeshLambertMaterial({map: roofTex}));
  roof.position.y = 2.75; roof.rotation.y = Math.PI/4; storeGroup.add(hut); storeGroup.add(roof);
  const storeSign = new THREE.Mesh(new THREE.PlaneGeometry(2.5,1), new THREE.MeshBasicMaterial({color:0xffff00}));
  storeSign.position.set(0, 2, 3.1); storeGroup.add(storeSign);
  // Simple exterior door visual
  const extDoor = new THREE.Mesh(new THREE.PlaneGeometry(1.6,2.2), new THREE.MeshLambertMaterial({color:0x333333}));
  extDoor.position.set(0, 1.1, 3.01); storeGroup.add(extDoor);
  storeGroup.position.set(25, 1.5, 5); scene.add(storeGroup);
  // Add a simple AABB collider around the hut exterior
  worldAabbs.push({cx: storeGroup.position.x, cz: storeGroup.position.z, hx: 3.2, hz: 3.2});
  // Interaction hotspot placed slightly in front of the hut so E can trigger despite the collider
  const storeZone = new THREE.Vector3(25,0,8.2);

  // Cave entrances (stone arches)
  function addCaveEntrance(x,z){
    const g = new THREE.Group();
    const arch = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.4, 8, 16, Math.PI), new THREE.MeshLambertMaterial({color:0x444444}));
    arch.rotation.x = Math.PI/2; arch.position.set(x, 2.2, z); g.add(arch);
    const side1 = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,2.5,8), new THREE.MeshLambertMaterial({color:0x555555})); side1.position.set(x-1.8,1.25,z); g.add(side1);
    const side2 = side1.clone(); side2.position.x = x+1.8; g.add(side2);
    scene.add(g);
    return new THREE.Vector3(x,0,z);
  }
  const caveEntrances = [ addCaveEntrance(-30, 20), addCaveEntrance(45, -35) ];
  // Cave exit zones will be inside cave areas (virtual), we define their centers after we teleport in
  let caveExitCenters = []; // filled when entering a cave
  let inCave = false;
  const caveLights = [];

  // Enter/Leave cave: we use a far-away dark zone as the cave interior
  function enterCave(entrance){
    inCave = true;
    // Slightly darken, but keep visibility
    scene.background = new THREE.Color(0x0b0b0b);
    ambient.intensity = 0.45; dir.intensity = 0.35;
    scene.fog = new THREE.Fog(0x0b0b0b, 22, 60);
    // Teleport player to a cave interior spot based on entrance index
    const idx = caveEntrances.findIndex(v=> v===entrance || (v.x===entrance.x && v.z===entrance.z));
    const base = idx===1 ? new THREE.Vector3(-80,0,160) : new THREE.Vector3(0,0,140);
    player.position.set(base.x, player.position.y, base.z);
    // Torch lights near base
    const torch1 = new THREE.PointLight(0xffaa66, 1.2, 18); torch1.position.set(base.x+3, 2.4, base.z-2); scene.add(torch1); caveLights.push(torch1);
    const torch2 = new THREE.PointLight(0x99aaff, 0.8, 16); torch2.position.set(base.x-3, 2.2, base.z+3); scene.add(torch2); caveLights.push(torch2);
    // Define exit centers near spawn
    caveExitCenters = [ new THREE.Vector3(base.x, 0, base.z - 5) ];
    // Spawn a few extra monsters inside cave near base
    for(let i=0;i<5;i++){
      spawnMonster(base.x + (Math.random()*20-10), base.z + (Math.random()*20-10), Math.floor(Math.random()*100)+i);
    }
  }
  function leaveCave(){
    inCave = false;
    scene.background = new THREE.Color(0x87ceeb);
    ambient.intensity = 0.7; dir.intensity = 0.9;
    scene.fog = null;
    // Remove cave lights
    while(caveLights.length){ const l = caveLights.pop(); scene.remove(l); }
    // Bring player back near the first entrance for simplicity
    const e = caveEntrances[0];
    player.position.set(e.x+2, player.position.y, e.z+2);
    caveExitCenters = [];
  }

  // Store interior
  let inStore = false;
  let storeBuilt = false;
  let storeExitCenters = [];
  const storeBase = new THREE.Vector3(140, 0, -140);
  const storeItems = [];
  let storeClerkPos = null;
  function buildStoreInterior(){
    if(storeBuilt) return;
    // Floor and walls
    const floorTex = makeCheckerTexture('#7a5a3a','#61462c',8); floorTex.repeat.set(10,10);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30,30), new THREE.MeshLambertMaterial({map: floorTex}));
    floor.rotation.x = -Math.PI/2; floor.position.set(storeBase.x, 0.01, storeBase.z); scene.add(floor);
    const wallTex = makeCheckerTexture('#c8c8c8','#b0b0b0',8); wallTex.repeat.set(10,3);
    function wall(w,h,d,ox,oy,oz){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshLambertMaterial({map: wallTex})); m.position.set(storeBase.x+ox, oy, storeBase.z+oz); scene.add(m); return m; }
    wall(30,6,1, 0,3,-15); wall(30,6,1, 0,3,15); wall(1,6,30, -15,3,0); wall(1,6,30, 15,3,0);
    // Add interior wall colliders
    storeAabbs.push({cx: storeBase.x, cz: storeBase.z-15, hx: 15, hz: 0.6});
    storeAabbs.push({cx: storeBase.x, cz: storeBase.z+15, hx: 15, hz: 0.6});
    storeAabbs.push({cx: storeBase.x-15, cz: storeBase.z, hx: 0.6, hz: 15});
    storeAabbs.push({cx: storeBase.x+15, cz: storeBase.z, hx: 0.6, hz: 15});
    // Counter
    const counter = new THREE.Mesh(new THREE.BoxGeometry(10,2,2), new THREE.MeshLambertMaterial({map: woodTex}));
    counter.position.set(storeBase.x, 1, storeBase.z - 8); scene.add(counter);
    storeAabbs.push({cx: storeBase.x, cz: storeBase.z - 8, hx: 5, hz: 1});
    // Clerk
    const clerk = buildHumanoid({ skin:'#ffe0bd', shirt:'#8844ff', pants:'#222222', weapon:null });
    clerk.position.set(storeBase.x, 0, storeBase.z - 9.5); scene.add(clerk);
    storeClerkPos = new THREE.Vector3(storeBase.x, 0, storeBase.z - 9.5);
    // Shelves with items
    function shelf(x,z){ const m=new THREE.Mesh(new THREE.BoxGeometry(8,2,1.2), new THREE.MeshLambertMaterial({map: woodTex})); m.position.set(x,1, z); scene.add(m); storeAabbs.push({cx:x, cz:z, hx:4, hz:0.6}); return m; }
    shelf(storeBase.x - 8, storeBase.z + 4); shelf(storeBase.x + 8, storeBase.z + 4);
    // Add items on shelves (non-cube models + labels)
    function buildStoreItem(name){
      const g = new THREE.Group();
      if(name==='Potion'){
        const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.25,0.6,12), new THREE.MeshStandardMaterial({color:0xcc2244, transparent:true, opacity:0.8}));
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,0.2,8), new THREE.MeshStandardMaterial({color:0xdddddd})); neck.position.y=0.4;
        bottle.position.y=0.3; g.add(bottle); g.add(neck);
      } else if(name==='Shield'){
        const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,0.08,16), new THREE.MeshStandardMaterial({color:0x4466ff})); sh.rotation.x=Math.PI/2; g.add(sh);
      } else if(name==='Armor'){
        g.add(new THREE.Mesh(new THREE.TorusKnotGeometry(0.3,0.1,64,8), new THREE.MeshStandardMaterial({color:0x996633})));
      } else if(name==='Sword'){
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.6,0.08), new THREE.MeshStandardMaterial({color:0xdddddd})); blade.position.y=0.35; blade.rotation.z=Math.PI/2; g.add(blade);
        const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.05,0.05), new THREE.MeshStandardMaterial({color:0x555555})); hilt.position.y=0.35; hilt.position.x=-0.2; g.add(hilt);
      } else if(name==='Mace'){
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.6,8), new THREE.MeshStandardMaterial({color:0x8b5a2b})); handle.rotation.z=Math.PI/2; g.add(handle);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.12,12,12), new THREE.MeshStandardMaterial({color:0xcccccc})); head.position.x=0.3; g.add(head);
      } else if(name==='Axe'){
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.6,8), new THREE.MeshStandardMaterial({color:0x8b5a2b})); handle.rotation.z=Math.PI/2; g.add(handle);
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.3,0.25), new THREE.MeshStandardMaterial({color:0xbbbbbb})); blade.position.x=0.25; g.add(blade);
      } else if(name==='Scythe'){
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.9,8), new THREE.MeshStandardMaterial({color:0x8b5a2b})); handle.rotation.z=Math.PI/2; g.add(handle);
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02,0.6,0.2), new THREE.MeshStandardMaterial({color:0xcccccc})); blade.position.set(0.35,0.15,0); g.add(blade);
      } else if(name==='Bow'){
        const bow = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 8, 16, Math.PI*1.8), new THREE.MeshStandardMaterial({color:0x8b5a2b})); bow.rotation.y = Math.PI/2; g.add(bow);
      } else if(name==='Staff'){
        const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.9,8), new THREE.MeshStandardMaterial({color:0x6b4b2b})); g.add(stick);
        const gem = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), new THREE.MeshStandardMaterial({color:0x77ddff, emissive:0x224488})); gem.position.y=0.5; g.add(gem);
      }
      return g;
    }
    function addItem(name, price, color, x, z){
      const g = buildStoreItem(name);
      g.position.set(x, 2, z);
      g.userData = {name, price, isStoreItem:true};
      // label above item
      const spr = makeLabel(name + ' ' + price + 'g'); spr.position.set(0, 1.0, 0); g.add(spr);
      scene.add(g); storeItems.push(g);
    }
    addItem('Potion', 10, 0xff3366, storeBase.x - 10, storeBase.z + 4);
    addItem('Shield', 30, 0x3366ff, storeBase.x - 8, storeBase.z + 4);
    addItem('Armor', 50, 0x996633, storeBase.x - 6, storeBase.z + 4);
    addItem('Sword', 40, 0xdddddd, storeBase.x + 6, storeBase.z + 4);
    addItem('Mace', 45, 0xcccccc, storeBase.x + 8, storeBase.z + 4);
    addItem('Axe', 45, 0xbbbbbb, storeBase.x + 10, storeBase.z + 4);
    // Interior door visual near front wall center
    const intDoor = new THREE.Mesh(new THREE.PlaneGeometry(2,2.6), new THREE.MeshLambertMaterial({color:0x2b2b2b}));
    intDoor.position.set(storeBase.x, 1.3, storeBase.z + 14.01); intDoor.rotation.y = Math.PI; scene.add(intDoor);
    storeExitCenters = [ new THREE.Vector3(storeBase.x, 0, storeBase.z + 13.5) ]; // near front wall center (door)
    storeBuilt = true;
  }
  const npcSpeechEl = document.getElementById('npcSpeech');
  const toastEl = document.getElementById('toast');
  function showToast(msg){ if(!toastEl) return; toastEl.textContent = msg; toastEl.style.display='block'; setTimeout(()=>{ toastEl.style.display='none'; }, 1500); }
  function showNpcGreeting(){ if(!npcSpeechEl) return; npcSpeechEl.textContent = 'Shopkeeper: Welcome, traveler! Have a look at our wares.'; npcSpeechEl.style.display='block'; setTimeout(()=>{ npcSpeechEl.style.display='none'; }, 2500); }

  // Exit Game: save state then go to Saved Characters
  const exitBtn = document.getElementById('exitBtn');
  if(exitBtn){
    exitBtn.addEventListener('click', ()=>{
      // Build payload from current playerStats
      const payload = {
        health: playerStats.health,
        maxHealth: playerStats.maxHealth,
        armor: playerStats.armor,
        gold: playerStats.gold,
        level: playerStats.level,
        xp: playerStats.xp,
        attack: playerStats.attack,
        defense: playerStats.defense,
        magic: playerStats.magic,
        mana: playerStats.mana,
        weapon: playerStats.weapon,
        inventory: (playerStats.inventory||[]).join(','),
        spells: (playerStats.spells||[]).join(','),
        equippedSpell: playerStats.equippedSpell || '',
        skinColor: playerStats.colors && playerStats.colors.skin,
        shirtColor: playerStats.colors && playerStats.colors.shirt,
        pantsColor: playerStats.colors && playerStats.colors.pants,
        charClass: playerStats.charClass
      };
      const goHome = ()=>{ try{ document.exitPointerLock?.(); }catch(e){} window.location.href = '/characters'; };
      if(typeof charId !== 'undefined' && charId){
        fetch(`/characters/api/${charId}/saveState`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)})
          .then(()=> goHome())
          .catch(()=> goHome());
      } else {
        goHome();
      }
    });
  }

  // Also autosave on tab close/refresh/navigation using sendBeacon (best effort)
  function buildSavePayload(){
    return JSON.stringify({
      health: playerStats.health,
      maxHealth: playerStats.maxHealth,
      armor: playerStats.armor,
      gold: playerStats.gold,
      level: playerStats.level,
      xp: playerStats.xp,
      attack: playerStats.attack,
      defense: playerStats.defense,
      magic: playerStats.magic,
      mana: playerStats.mana,
      weapon: playerStats.weapon,
      inventory: (playerStats.inventory||[]).join(','),
      spells: (playerStats.spells||[]).join(','),
      equippedSpell: playerStats.equippedSpell || '',
      skinColor: playerStats.colors && playerStats.colors.skin,
      shirtColor: playerStats.colors && playerStats.colors.shirt,
      pantsColor: playerStats.colors && playerStats.colors.pants,
      charClass: playerStats.charClass
    });
  }
  function autosaveOnUnload(){
    if(typeof charId === 'undefined' || !charId) return; // nothing to save to
    const url = `/characters/api/${charId}/saveState`;
    const data = buildSavePayload();
    try{
      if(navigator.sendBeacon){
        const blob = new Blob([data], {type: 'application/json'});
        navigator.sendBeacon(url, blob);
      } else {
        // Fallback: synchronous XHR as last resort to ensure delivery
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, false); // sync
        xhr.setRequestHeader('Content-Type', 'application/json');
        try{ xhr.send(data); }catch(e){}
      }
    }catch(e){ /* swallow */ }
  }
  window.addEventListener('beforeunload', autosaveOnUnload);
  window.addEventListener('pagehide', autosaveOnUnload);
  // Also save when tab becomes hidden/backgrounded (best effort)
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'hidden'){ autosaveOnUnload(); } });

  function enterStore(){
    inStore = true; buildStoreInterior();
    scene.background = new THREE.Color(0x999999);
    ambient.intensity = 0.9; dir.intensity = 0.6; scene.fog = null;
    player.position.set(storeBase.x, player.position.y, storeBase.z + 10);
    showNpcGreeting();
  }
  function leaveStore(){
    inStore = false;
    scene.background = new THREE.Color(0x87ceeb);
    ambient.intensity = 0.7; dir.intensity = 0.9; scene.fog = null;
    // Return player near the hut entrance
    player.position.set(storeZone.x + 1.5, player.position.y, storeZone.z + 2);
  }

  // Monster helpers: label sprites
  function makeLabel(text){
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const font = '14px Arial';
    ctx.font = font;
    const w = ctx.measureText(text).width + 10;
    const h = 22;
    canvas.width = w; canvas.height = h;
    ctx.font = font;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0,0,w,h);
    ctx.fillStyle = '#fff'; ctx.textBaseline='middle'; ctx.fillText(text,5,h/2);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({map: tex, transparent:true});
    const spr = new THREE.Sprite(mat);
    spr.scale.set(w/50, h/50, 1);
    spr.userData.canvas = canvas; spr.userData.ctx = ctx; spr.userData.tex = tex; spr.userData.text = text;
    return spr;
  }
  function setLabelText(sprite, text){
    if(sprite.userData.text === text) return;
    const canvas = sprite.userData.canvas; const ctx = sprite.userData.ctx; const tex = sprite.userData.tex;
    const font = '14px Arial'; ctx.font = font;
    const w = ctx.measureText(text).width + 10; const h = 22;
    if(canvas.width !== w || canvas.height !== h){ canvas.width=w; canvas.height=h; }
    ctx.font = font; ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,w,h); ctx.fillStyle='#fff'; ctx.textBaseline='middle'; ctx.fillText(text,5,h/2);
    sprite.scale.set(w/50, h/50, 1); tex.needsUpdate = true; sprite.userData.text = text;
  }

  const monsters = [];
  const MONSTER_NAMES = ['Goblin','Orc','Slime','Bandit','Wolf'];
  function buildMonster(type){
    const g = new THREE.Group();
    let torso, head;
    const t = (type||'goblin').toLowerCase();
    if(t==='goblin'){
      torso = new THREE.Mesh(new THREE.BoxGeometry(0.9,1.0,0.6), new THREE.MeshLambertMaterial({color:0x397d2a}));
      head  = new THREE.Mesh(new THREE.SphereGeometry(0.35,12,12), new THREE.MeshLambertMaterial({color:0x4aa33a}));
      // horns
      const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.08,0.2,8), new THREE.MeshLambertMaterial({color:0xdddddd})); hornL.position.set(-0.15,1.9,0.2); hornL.rotation.x=-0.2; g.add(hornL);
      const hornR = hornL.clone(); hornR.position.x = 0.15; g.add(hornR);
    } else if(t==='orc'){
      torso = new THREE.Mesh(new THREE.BoxGeometry(1.1,1.2,0.7), new THREE.MeshLambertMaterial({color:0x225522}));
      head  = new THREE.Mesh(new THREE.SphereGeometry(0.4,12,12), new THREE.MeshLambertMaterial({color:0x2f7a2f}));
      // tusks
      const tuskL = new THREE.Mesh(new THREE.ConeGeometry(0.06,0.18,8), new THREE.MeshLambertMaterial({color:0xeeeeee})); tuskL.position.set(-0.1,1.6,0.28); tuskL.rotation.x = Math.PI/2; g.add(tuskL);
      const tuskR = tuskL.clone(); tuskR.position.x = 0.1; g.add(tuskR);
    } else if(t==='skeleton'){
      torso = new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.25,1.0,8), new THREE.MeshLambertMaterial({color:0xdddddd}));
      head  = new THREE.Mesh(new THREE.SphereGeometry(0.32,12,12), new THREE.MeshLambertMaterial({color:0xffffff}));
      // ribs
      for(let i=0;i<5;i++){ const r=new THREE.Mesh(new THREE.TorusGeometry(0.32,0.02,6,12), new THREE.MeshLambertMaterial({color:0xcccccc})); r.position.y = 0.6 - i*0.18; r.rotation.x=Math.PI/2; g.add(r);}    
    } else if(t==='slime'){
      torso = new THREE.Mesh(new THREE.BoxGeometry(1.1,1.1,1.1), new THREE.MeshLambertMaterial({color:0x33aa88, transparent:true, opacity:0.8}));
      head  = new THREE.Mesh(new THREE.SphereGeometry(0.0,8,8), new THREE.MeshLambertMaterial({visible:false}));
    } else { // wolf-like
      torso = new THREE.Mesh(new THREE.BoxGeometry(1.4,0.6,0.5), new THREE.MeshLambertMaterial({color:0x555555}));
      head  = new THREE.Mesh(new THREE.ConeGeometry(0.25,0.4,12), new THREE.MeshLambertMaterial({color:0x444444})); head.rotation.x = Math.PI/2; head.position.z = 0.5; head.position.y = 0.6;
    }
    torso.position.y = 0.9; g.add(torso); head.position.y = head.position.y||1.6; g.add(head);
    return {group: g, torso, head};
  }
  function spawnMonster(x,z,i){
    const types = ['goblin','orc','skeleton','slime','wolf'];
    const bodyParts = buildMonster(types[i % types.length]);
    const name = MONSTER_NAMES[i % MONSTER_NAMES.length] + ' ' + (i+1);
    const hp = 40 + Math.floor(Math.random()*30);
    const level = 1 + Math.floor(Math.random()*5);
    const label = makeLabel(name + ' Lvl ' + level + ' ('+hp+')');
    label.position.set(0, 2.2, 0);
    const g = new THREE.Group(); g.add(bodyParts.group); g.add(label); scene.add(g);
    g.position.set(x,0,z);
    g.userData = { vx:(Math.random()-0.5)*2, vz:(Math.random()-0.5)*2, body: bodyParts.group, label, hp, name, level };
    monsters.push(g);
  }
  for(let i=0;i<12;i++){ spawnMonster(Math.random()*120-60, Math.random()*120-60, i); }

  // Camera/player motion
  camera.position.set(0, 1.8, 3);
  let yaw = 0, pitch = 0; // radians

  const keys = {};
  window.addEventListener('keydown', (e)=> keys[e.key.toLowerCase()] = true, {passive:false});
  window.addEventListener('keyup',   (e)=> keys[e.key.toLowerCase()] = false);

  // Mouse look (drag fallback)
  let dragging = false, lastX=0, lastY=0;
  window.addEventListener('mousedown', (e)=>{ dragging = true; lastX = e.clientX; lastY = e.clientY; });
  window.addEventListener('mouseup', ()=> dragging=false);
  window.addEventListener('mousemove', (e)=>{
    if(!dragging) return;
    const dx = e.clientX - lastX; const dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
    yaw   -= dx * 0.003; pitch -= dy * 0.003;
    const clamp = Math.PI/2 - 0.05; if(pitch > clamp) pitch = clamp; if(pitch < -clamp) pitch = -clamp;
  });

  // Pointer Lock and jump/gravity controls
  const canvas = renderer.domElement;
  // Use mousedown to distinguish left/right click and integrate pointer lock + combat
  canvas.addEventListener('mousedown', (e)=>{
    // Right-click: prevent context menu
    if(e.button === 2){ e.preventDefault(); }
    // If not locked yet and we're inside the store, allow immediate purchase using actual mouse coords
    if(document.pointerLockElement !== canvas){
      if(e.button === 0 && inStore){
        storeClickPurchase(e); // try to buy with current mouse position
      }
      canvas.requestPointerLock();
      return; // first click primarily locks pointer
    }
    // When locked, interpret buttons
    if(e.button === 0){ // left click
      if(inStore){
        storeClickPurchase(e);
      } else {
        performAttack();
      }
    } else if(e.button === 2){ // right click = block (hold-to-block style)
      if(!inStore) startBlock();
    }
  });
  // Stop blocking on right mouse up when locked
  window.addEventListener('mouseup', (e)=>{
    if(document.pointerLockElement === canvas && e.button === 2){ endBlock(); }
  });
  // Prevent default context menu globally on canvas
  canvas.addEventListener('contextmenu', (e)=> e.preventDefault());

  window.addEventListener('mousemove', (e)=>{
    if(document.pointerLockElement === canvas){
      yaw   -= (e.movementX||0) * 0.0025;
      pitch -= (e.movementY||0) * 0.0025;
      const clamp = Math.PI/2 - 0.05; if(pitch>clamp)pitch=clamp; if(pitch<-clamp)pitch=-clamp;
    }
  });
  window.addEventListener('keydown', (e)=>{ if(e.code === 'Space') e.preventDefault(); }, {passive:false});
  // Weapon cycle: press R to cycle owned weapons and equip
  window.addEventListener('keydown', (e)=>{
    const key = e.key.toLowerCase();
    if(key === 'r'){
      const owned = (playerStats.inventory||[]).filter(w=> ['sword','axe','mace','scythe','bow','staff'].includes(String(w).toLowerCase()));
      if(!owned.length) return;
      const cur = playerStats.weapon||'Fists';
      let idx = owned.findIndex(w=> String(w).toLowerCase() === String(cur).toLowerCase());
      idx = (idx + 1) % owned.length;
      const nextW = owned[idx];
      if(charId){
        fetch(`/characters/api/${charId}/equip`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({weapon: nextW})})
          .then(r=> r.json()).then(res=>{
            if(res && res.ok){
              playerStats.weapon = res.character && res.character.weapon ? res.character.weapon : nextW;
              updateHud(); applyAppearance();
              showToast(res.message || ('Equipped ' + nextW));
            }
          }).catch(()=>{});
      } else {
        playerStats.weapon = nextW; updateHud(); applyAppearance(); showToast('Equipped ' + nextW);
      }
    }
    // Number keys 1-9 select hotbar slots
    if(key >= '1' && key <= '9'){ selectHotbar(parseInt(key,10)-1); }
    // Use selected item key: F
    if(key === 'f'){ useSelectedItem(); }
  });
  // Mouse wheel cycles hotbar
  window.addEventListener('wheel', (e)=>{ if(!hotbarEl) return; const d = Math.sign(e.deltaY); selectHotbar((hotbarSel + d + 9)%9); });
  // Spell keys: Q to cast, C to cycle equipped spell
  window.addEventListener('keydown', (e)=>{
    const k = e.key.toLowerCase();
    if(k==='q'){ castEquippedSpell(); }
    if(k==='c'){ cycleSpell(); }
  });
  // Interaction keys: Enter for store menu near clerk; E for closing menus and enter/exit areas
  window.addEventListener('keydown', (e)=>{
    const k = e.key.toLowerCase();
    if(k === 'enter'){
      if(inStore && storeClerkPos){
        const dClerk = Math.hypot(player.position.x - storeClerkPos.x, player.position.z - storeClerkPos.z);
        if(dClerk < 4 && storeOverlay){ storeOverlay.style.display = 'block'; }
      }
      return;
    }
    if(k !== 'e') return;
    // Close store overlay if open
    if(storeOverlay && storeOverlay.style.display==='block'){ storeOverlay.style.display='none'; return; }
    // Store enter/exit
    const dStore = Math.hypot(player.position.x - storeZone.x, player.position.z - storeZone.z);
    if(!inStore && dStore < 3){ enterStore(); return; }
    const nearStoreExit = storeExitCenters.find(v=> Math.hypot(player.position.x - v.x, player.position.z - v.z) < 2.5);
    if(inStore && nearStoreExit){ leaveStore(); return; }
    // Cave enter/exit
    const nearEntrance = caveEntrances.find(v=> Math.hypot(player.position.x - v.x, player.position.z - v.z) < 3);
    if(!inCave && nearEntrance){ enterCave(nearEntrance); return; }
    const nearExit = caveExitCenters.find(v=> Math.hypot(player.position.x - v.x, player.position.z - v.z) < 3);
    if(inCave && nearExit){ leaveCave(); return; }
  });

  const controls = { forward:['w','arrowup'], back:['s','arrowdown'], left:['a','arrowleft'], right:['d','arrowright'], jump:[' '], sprint:['shift'] };
  const keyDown = k=> !!keys[k];
  const anyDown = list => list.some(k=> keyDown(k));
  const isDown = action => anyDown(controls[action]||[]);

  // Simple collision resolution against circles and AABBs
  function resolveCollisions(pos, radius, useStore){
    const circles = worldCircles;
    const aabbs = useStore ? storeAabbs : worldAabbs;
    // circles
    for(const c of circles){
      const dx = pos.x - c.x, dz = pos.z - c.z; const d = Math.hypot(dx,dz);
      const minD = radius + c.r;
      if(d < minD){ const ux = (dx||(Math.random()-0.5))*1e-6; const uz = (dz||(Math.random()-0.5))*1e-6; const inv = 1/Math.hypot(ux,uz); pos.x = c.x + ux*inv*minD; pos.z = c.z + uz*inv*minD; }
    }
    // aabbs
    for(const b of aabbs){
      const dx = pos.x - b.cx; const dz = pos.z - b.cz;
      const px = b.hx + radius - Math.abs(dx);
      const pz = b.hz + radius - Math.abs(dz);
      if(px > 0 && pz > 0){
        if(px < pz){ pos.x = b.cx + Math.sign(dx) * (b.hx + radius); }
        else { pos.z = b.cz + Math.sign(dz) * (b.hz + radius); }
      }
    }
  }

  let vy = 0; const gravity = 20; const jumpStrength = 8; let grounded = true; const groundY = 0; // player base y
  let isDead = false;

  // Character stats and HUD
  const hud = {
    name: document.getElementById('hudName'),
    level: document.getElementById('hudLevel'),
    xp: document.getElementById('hudXp'),
    health: document.getElementById('hudHealth'),
    shield: document.getElementById('hudShield'),
    mana: document.getElementById('hudMana'),
    spell: document.getElementById('hudSpell'),
    armor: document.getElementById('hudArmor'),
    weapon: document.getElementById('hudWeapon'),
    gold: document.getElementById('hudGold')
  };
  const playerStats = { name:'Hero', level:1, xp:0, health:100, maxHealth:100, shield:0, attack:10, defense:5, armor:0, gold:100, weapon:'Fists', magic:50, mana:100, charClass:'Adventurer', colors:{skin:'#ffddaa', shirt:'#6699ff', pants:'#333333'}, inventory: [], spells: [], equippedSpell:'', weaponXp:{}, weaponLevel:{} };
  // Player overhead health bar
  const barBg = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.12), new THREE.MeshBasicMaterial({color:0x550000}));
  const barFg = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 0.10), new THREE.MeshBasicMaterial({color:0x00ff44}));
  const barGroup = new THREE.Group(); barGroup.add(barBg); barGroup.add(barFg);
  barBg.position.set(0,0,0); barFg.position.set(0,0,0.001);
  barGroup.position.set(0, 2.4, 0);
  playerMesh.add(barGroup);
  function updatePlayerBar(){
    const ratio = Math.max(0, Math.min(1, playerStats.health / playerStats.maxHealth));
    barFg.scale.x = ratio;
    barFg.position.x = -0.59 + 0.59*ratio; // keep left aligned
  }
  function updateHud(){
    if(hud.name) hud.name.textContent = playerStats.name;
    if(hud.level) hud.level.textContent = playerStats.level;
    if(hud.xp) hud.xp.textContent = playerStats.xp + ' / ' + (playerStats.level*100);
    if(hud.health) hud.health.textContent = playerStats.health + ' / ' + playerStats.maxHealth;
    if(hud.shield) hud.shield.textContent = playerStats.shield > 0 ? ('+ ' + playerStats.shield + ' shield') : '';
    if(hud.mana) hud.mana.textContent = playerStats.mana;
    if(hud.spell) hud.spell.textContent = playerStats.equippedSpell || 'None';
    if(hud.armor) hud.armor.textContent = playerStats.armor;
    if(hud.weapon) hud.weapon.textContent = playerStats.weapon;
    if(hud.gold) hud.gold.textContent = playerStats.gold;
    updatePlayerBar();
  }

  // UI elements for interactions & hotbar
  const promptEl = document.getElementById('prompt');
  const storeOverlay = document.getElementById('storeOverlay');
  const hotbarEl = document.getElementById('hotbar');
  let hotbarItems = [];
  let hotbarSel = 0;
  function isWeaponName(n){ return ['sword','axe','mace','scythe','bow','staff'].includes(String(n||'').toLowerCase()); }
  function rebuildHotbar(){
    if(!hotbarEl) return;
    hotbarItems = [];
    // Strategy: prefer current weapon, then other weapons, then consumables like Potion, Shield, Armor
    const inv = (playerStats.inventory||[]).slice();
    const curW = playerStats.weapon;
    if(curW && curW.toLowerCase()!=='fists') hotbarItems.push(curW);
    inv.forEach(it=>{ if(isWeaponName(it) && it!==curW && !hotbarItems.includes(it) && hotbarItems.length<9) hotbarItems.push(it); });
    if(inv.includes('Potion') && hotbarItems.length<9) hotbarItems.push('Potion');
    if(inv.includes('Shield') && hotbarItems.length<9) hotbarItems.push('Shield');
    if(inv.includes('Armor') && hotbarItems.length<9) hotbarItems.push('Armor');
    // pad with empty slots up to 9
    while(hotbarItems.length<9) hotbarItems.push('');
    // render
    hotbarEl.innerHTML='';
    hotbarItems.forEach((it,idx)=>{
      const slot = document.createElement('div'); slot.className = 'slot' + (idx===hotbarSel?' sel':'');
      slot.textContent = it ? it[0] : '';
      slot.title = it||'';
      slot.addEventListener('click', ()=> selectHotbar(idx));
      slot.addEventListener('dblclick', ()=> { if((hotbarItems[idx]||'').toLowerCase()==='potion') useSelectedItem(); });
      hotbarEl.appendChild(slot);
    });
  }
  function selectHotbar(idx){ hotbarSel = Math.max(0, Math.min(8, idx)); rebuildHotbar(); const it=(hotbarItems[hotbarSel]||''); if(isWeaponName(it)){ equipWeapon(it); } }
  function equipWeapon(name){
    if(!name) return;
    if(charId){
      fetch(`/characters/api/${charId}/equip`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({weapon: name})})
        .then(r=> r.json()).then(res=>{
          if(res && res.ok){ playerStats.weapon = res.character && res.character.weapon ? res.character.weapon : name; updateHud(); applyAppearance(); showToast(res.message||('Equipped '+name)); }
        }).catch(()=>{});
    } else { playerStats.weapon = name; updateHud(); applyAppearance(); showToast('Equipped '+name); }
  }
  function useSelectedItem(){
    const it = (hotbarItems[hotbarSel]||'').toLowerCase();
    if(it==='potion'){
      // consume one potion from inventory
      const idx = (playerStats.inventory||[]).findIndex(x=> String(x).toLowerCase()==='potion');
      if(idx>=0){ playerStats.inventory.splice(idx,1); playerStats.health = Math.min(playerStats.maxHealth, playerStats.health + 30); updateHud(); showToast('Used Potion (+30)'); rebuildHotbar(); }
    }
  }
  if(storeOverlay){
    storeOverlay.addEventListener('click', (e)=>{
      const row = e.target.closest('.item');
      if(!row) return;
      const item = row.getAttribute('data-item');
      // Prefer server purchase if we have a character id
      if(charId){
        fetch(`/characters/api/${charId}/buy`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({item})})
          .then(r=> r.json()).then(res=>{
            if(!res || res.ok===false){ alert(res && res.message ? res.message : 'Purchase failed'); return; }
            const ch = res.character || {};
            // sync key fields
            if(typeof ch.gold==='number') playerStats.gold = ch.gold;
            if(typeof ch.armor==='number') playerStats.armor = ch.armor;
            // parse inventory
            playerStats.inventory = (ch.inventory||'').split(',').map(s=>s.trim()).filter(Boolean);
            // client-only effects/shield
            if(item === 'Shield'){ playerStats.shield += 50; }
            if(item && ['Sword','Axe','Mace','Scythe','Bow','Staff'].includes(item)){
              // don't auto-equip unless desired; keep selection via hotbar or R
            }
            rebuildHotbar();
            updateHud(); applyAppearance();
            showToast(res.message || ('You bought ' + item));
          }).catch(()=> alert('Network error'));
      } else {
        // Fallback local-only purchase
        const price = parseInt(row.getAttribute('data-price')||'0', 10);
        if(playerStats.gold < price){ alert('Not enough gold.'); return; }
        playerStats.gold -= price;
        // update local inventory list
        playerStats.inventory = playerStats.inventory || [];
        playerStats.inventory.push(item);
        if(item === 'Potion'){
          // keep for usage
        } else if(item === 'Shield'){
          playerStats.armor += 5;
          playerStats.shield += 50;
        } else if(item === 'Armor'){
          playerStats.armor += 10;
        } else if(item){
          // weapon added; selection via hotbar
        }
        rebuildHotbar();
        updateHud(); showToast('You bought ' + item);
      }
    });
  }

  // Apply character colors and weapon to model
  function applyAppearance(){
    const u = playerMesh.userData;
    u.head.material.color.set(playerStats.colors.skin);
    u.armL.material.color.set(playerStats.colors.shirt);
    u.armR.material.color.set(playerStats.colors.shirt);
    u.torso.material.color.set(playerStats.colors.shirt);
    u.legL.material.color.set(playerStats.colors.pants);
    u.legR.material.color.set(playerStats.colors.pants);
    // replace weapon mesh to match selected type
    if(u.weapon){ playerMesh.remove(u.weapon); }
    if(playerStats.weapon && playerStats.weapon.toLowerCase() !== 'fists'){
      u.weapon = u.buildWeapon(playerStats.weapon);
      playerMesh.add(u.weapon);
    } else {
      u.weapon = null;
    }
    // Class-based accessories
    // Ensure accessory placeholders exist
    if(!u.hat){
      u.hat = new THREE.Mesh(new THREE.ConeGeometry(0.35,0.6,12), new THREE.MeshStandardMaterial({color:0x4422aa}));
      u.hat.position.set(0, 2.3, 0); u.hat.visible=false; playerMesh.add(u.hat);
    }
    if(!u.quiver){
      u.quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,0.6,8), new THREE.MeshStandardMaterial({color:0x5a3b1e}));
      u.quiver.position.set(0,1.6,-0.35); u.quiver.rotation.x = Math.PI/10; u.quiver.visible=false; playerMesh.add(u.quiver);
    }
    if(!u.shoulderL){
      u.shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.18,12,12), new THREE.MeshStandardMaterial({color:0x7a4a2a}));
      u.shoulderL.position.set(-0.55,1.6,0); u.shoulderL.visible=false; playerMesh.add(u.shoulderL);
      u.shoulderR = u.shoulderL.clone(); u.shoulderR.position.x = 0.55; playerMesh.add(u.shoulderR); u.shoulderR.visible=false;
    }
    // Reset visibilities
    u.hat.visible = false; if(u.shoulderL) u.shoulderL.visible=false; if(u.shoulderR) u.shoulderR.visible=false; if(u.quiver) u.quiver.visible=false;
    const c = (playerStats.charClass||'').toLowerCase();
    if(c==='wizard'){
      u.hat.visible = true;
      // auto-staff if chosen
      if(playerStats.weapon.toLowerCase()==='fists'){ playerStats.weapon = 'Staff'; if(u.weapon){ playerMesh.remove(u.weapon);} u.weapon = u.buildWeapon('Staff'); playerMesh.add(u.weapon); }
    } else if(c==='barbarian'){
      if(u.shoulderL){ u.shoulderL.visible=true; u.shoulderR.visible=true; }
    } else if(c==='archer'){
      if(u.quiver) u.quiver.visible=true;
      if(playerStats.weapon.toLowerCase()==='fists'){ playerStats.weapon = 'Bow'; if(u.weapon){ playerMesh.remove(u.weapon);} u.weapon = u.buildWeapon('Bow'); playerMesh.add(u.weapon); }
    }
  }

  // Fetch character from backend (by charId if present, else latest)
  const params = new URLSearchParams(window.location.search);
  const charId = params.get('charId');
  const url = charId ? `/characters/${charId}.json` : '/characters/latest.json';
  fetch(url).then(r=> r.ok ? r.json() : null).then(data=>{
    if(!data) { updateHud(); applyAppearance(); return; }
    playerStats.name = data.name || playerStats.name;
    playerStats.health = (typeof data.health==='number') ? data.health : playerStats.health;
    playerStats.maxHealth = Math.max(playerStats.maxHealth||playerStats.health, playerStats.health);
    playerStats.attack = (typeof data.attack==='number') ? data.attack : playerStats.attack;
    playerStats.defense = (typeof data.defense==='number') ? data.defense : playerStats.defense;
    playerStats.magic = (typeof data.magic==='number') ? data.magic : (playerStats.magic||0);
    playerStats.mana = (typeof data.mana==='number') ? data.mana : (playerStats.mana||100);
    playerStats.armor = (data.armor!=null)? data.armor : playerStats.armor;
    playerStats.gold = (data.gold!=null)? data.gold : playerStats.gold;
    // Apply saved progression
    if(typeof data.level === 'number') playerStats.level = data.level;
    if(typeof data.xp === 'number') playerStats.xp = data.xp;
    playerStats.weapon = data.weapon || playerStats.weapon;
    playerStats.charClass = data.charClass || playerStats.charClass;
    playerStats.colors.skin = data.skinColor || playerStats.colors.skin;
    playerStats.colors.shirt = data.shirtColor || playerStats.colors.shirt;
    playerStats.colors.pants = data.pantsColor || playerStats.colors.pants;
    playerStats.inventory = (data.inventory||'').split(',').map(s=>s.trim()).filter(Boolean);
    playerStats.spells = (data.spells||'').split(',').map(s=> s.trim()).filter(Boolean);
    playerStats.equippedSpell = data.equippedSpell || (playerStats.spells[0]||'');
    rebuildHotbar();
    updateHud(); applyAppearance();
  }).catch(()=>{ updateHud(); applyAppearance(); });

  // Attack/Block system
  function nearestMonsterInFront(maxDist=3, fovCos=Math.cos(THREE.MathUtils.degToRad(30))){
    let best=null, bestD=Infinity;
    const px = player.position.x, pz = player.position.z;
    const fx = Math.sin(yaw), fz = Math.cos(yaw);
    monsters.forEach(m=>{
      const dx = m.position.x - px; const dz = m.position.z - pz; const d = Math.hypot(dx,dz);
      if(d>maxDist) return;
      const dot = (dx/d)*fx + (dz/d)*fz; // cos angle
      if(dot < fovCos) return;
      if(d < bestD){ best=m; bestD=d; }
    });
    return best;
  }
  let attackSwing = 0; // radians accumulator for swing animation
  const arrows = [];
  const fireballs = [];
  const lightningBeams = [];
  const lastCast = {}; // per-spell cooldown timestamps
  function weaponBaseDamage(){
    // base damage from attack plus weapon level bonus
    const w = (playerStats.weapon||'fists').toLowerCase();
    const lvl = (playerStats.weaponLevel[w]||1);
    const bonus = Math.floor(lvl*2);
    return Math.max(1, playerStats.attack + bonus);
  }
  function addWeaponXp(){
    const w = (playerStats.weapon||'fists').toLowerCase();
    playerStats.weaponXp[w] = (playerStats.weaponXp[w]||0) + 1;
    const xp = playerStats.weaponXp[w];
    const curLvl = (playerStats.weaponLevel[w]||1);
    const nextLvl = curLvl + 1;
    const threshold = nextLvl*10; // 10, 20, 30...
    if(xp >= threshold){ playerStats.weaponLevel[w] = nextLvl; showToast((playerStats.weapon||'Weapon') + ' leveled to ' + nextLvl + '!'); }
  }
  function performAttack(){
    if(isDead) return;
    const weap = (playerStats.weapon||'').toLowerCase();
    if(weap==='bow'){
      // Fire an arrow projectile
      playTone(700, 0.04);
      const arrow = new THREE.Group();
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.01,0.01,0.8,6), new THREE.MeshStandardMaterial({color:0x8b5a2b}));
      shaft.rotation.z = Math.PI/2; arrow.add(shaft);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.03,0.08,8), new THREE.MeshStandardMaterial({color:0xcccccc}));
      tip.position.set(0.42,0,0); tip.rotation.z = Math.PI/2; arrow.add(tip);
      // start at right hand
      const start = new THREE.Vector3(0.9, 1.0 + playerMesh.position.y, 0);
      arrow.position.copy(player.position.clone().add(new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw)).multiplyScalar(0.2)));
      arrow.position.y = 1.6 + playerMesh.position.y;
      arrow.rotation.y = yaw;
      scene.add(arrow);
      const speed = 16; // m/s
      const vx = Math.sin(yaw) * speed;
      const vz = Math.cos(yaw) * speed;
      arrows.push({mesh:arrow, vx, vz, life:2.5, weap});
      addWeaponXp();
    } else {
      // Melee swing
      attackSwing = Math.max(attackSwing, Math.PI/3);
      playTone(440); // attack sound
      const m = nearestMonsterInFront();
      if(!m) return;
      const dmg = weaponBaseDamage();
      m.userData.hp -= dmg;
      addWeaponXp();
      const setEmissive = (color)=>{
        m.userData.body.traverse?.((child)=>{
          if(child.isMesh && child.material && 'emissive' in child.material){ child.material.emissive = new THREE.Color(color); }
        });
      };
      setEmissive(0xff0000);
      setTimeout(()=> setEmissive(0x000000), 120);
      setLabelText(m.userData.label, m.userData.name + ' Lvl ' + (m.userData.level||1) + ' (' + Math.max(0, m.userData.hp) + ')');
      if(m.userData.hp <= 0){
        scene.remove(m);
        const idx = monsters.indexOf(m); if(idx>=0) monsters.splice(idx,1);
        const lvl = m.userData.level || 1;
        const goldGain = Math.max(1, Math.floor(Math.random() * (3*lvl)) + lvl);
        playerStats.gold += goldGain;
        playerStats.xp += 20 * lvl;
        // level up
        while(playerStats.xp >= playerStats.level * 100){
          playerStats.xp -= playerStats.level * 100;
          playerStats.level += 1;
          playerStats.maxHealth += 10;
          playerStats.attack += 2;
          playerStats.health = playerStats.maxHealth;
        }
        updateHud();
      } else {
        const h = Array.from(m.userData.name).reduce((a,c)=> a + c.charCodeAt(0), 0);
        playTone(200 + (h % 200), 0.05);
      }
    }
  }

  // Blocking state
  let isBlocking = false;
  function startBlock(){ if(isDead) return; isBlocking = true; playerMesh.userData.shield.visible = true; playTone(320, 0.05); }
  function endBlock(){ isBlocking = false; playerMesh.userData.shield.visible = false; }

  const attackBtn = document.getElementById('attackBtn');
  if(attackBtn) attackBtn.addEventListener('click', performAttack);
  const blockBtn = document.getElementById('blockBtn');
  if(blockBtn) blockBtn.addEventListener('mousedown', ()=> startBlock());
  if(blockBtn) blockBtn.addEventListener('mouseup', ()=> endBlock());

  // Simple WebAudio tone
  const audioCtx = (window.AudioContext ? new AudioContext() : null);
  function playTone(freq=440, dur=0.08){
    if(!audioCtx) return;
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
    o.type = 'square'; o.frequency.value = freq; o.connect(g); g.connect(audioCtx.destination);
    const now = audioCtx.currentTime; g.gain.setValueAtTime(0.15, now); g.gain.exponentialRampToValueAtTime(0.0001, now + (dur||0.08));
    o.start(); o.stop(now + (dur||0.08));
  }
  function playSpellTone(type){
    if(!audioCtx) return;
    if(type==='Fireball') playTone(880, 0.08);
    else if(type==='Heal') playTone(520, 0.12);
    else if(type==='Lightning') playTone(1200, 0.05);
  }

  // Raycaster for store interaction
  const ray = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  function storeClickPurchase(e){
    // If pointer is locked, use center of screen; otherwise use actual mouse position
    if(document.pointerLockElement === canvas){
      mouse.set(0,0);
    } else if(e && typeof e.clientX === 'number' && typeof e.clientY === 'number'){
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    } else {
      mouse.set(0,0);
    }
    ray.setFromCamera(mouse, camera);
    const hits = ray.intersectObjects(storeItems, true);
    if(hits.length){
      const obj = hits[0].object; const base = (obj.userData && obj.userData.isStoreItem) ? obj : obj.parent;
      const info = (base && base.userData) || {};
      const name = info.name||'Item'; const price = info.price||0;
      // Prefer server purchase if we have a character id
      if(charId){
        fetch(`/characters/api/${charId}/buy`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({item: name})})
          .then(r=> r.json()).then(res=>{
            if(!res || res.ok===false){ alert(res && res.message ? res.message : 'Purchase failed'); return; }
            const ch = res.character || {};
            // sync key fields
            if(typeof ch.gold==='number') playerStats.gold = ch.gold;
            if(typeof ch.armor==='number') playerStats.armor = ch.armor;
            // parse inventory
            playerStats.inventory = (ch.inventory||'').split(',').map(s=>s.trim()).filter(Boolean);
            updateHud(); applyAppearance();
            showToast(res.message || ('You bought ' + name));
          }).catch(()=> alert('Network error'));
      } else {
        // Fallback local-only purchase
        if(playerStats.gold < price){ alert('Not enough gold.'); return; }
        playerStats.gold -= price;
        if(name === 'Potion'){
          playerStats.health = Math.min(playerStats.maxHealth, playerStats.health + 20);
        } else if(name === 'Shield'){
          playerStats.armor += 5;
        } else if(name === 'Armor'){
          playerStats.armor += 10;
        } else if(name === 'Sword' || name==='Axe' || name==='Mace' || name==='Scythe' || name==='Bow' || name==='Staff'){
          playerStats.weapon = name; applyAppearance();
        }
        updateHud();
        playTone(600, 0.05);
      }
    }
  }

  // Spell casting
  function cycleSpell(){
    if(!playerStats.spells || !playerStats.spells.length) return;
    const idx = Math.max(0, playerStats.spells.findIndex(s=> s===playerStats.equippedSpell));
    playerStats.equippedSpell = playerStats.spells[(idx+1) % playerStats.spells.length];
    updateHud();
  }
  function canCast(spell, cost, cd=0.3){
    const now = performance.now()/1000;
    if(playerStats.mana < cost) return false;
    const last = lastCast[spell]||0;
    if(now - last < cd) return false;
    lastCast[spell] = now;
    return true;
  }
  function castEquippedSpell(){
    const sp = playerStats.equippedSpell || '';
    if(!sp) return;
    if(sp==='Fireball') return castFireball();
    if(sp==='Heal') return castHeal();
    if(sp==='Lightning') return castLightning();
  }
  function castFireball(){
    const cost = 15; if(!canCast('Fireball', cost, 0.4)) return;
    playerStats.mana -= cost; updateHud(); playSpellTone('Fireball');
    const fb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), new THREE.MeshStandardMaterial({color:0xff5522, emissive:0xff3300, emissiveIntensity:1.0}));
    fb.position.copy(player.position.clone().add(new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw)).multiplyScalar(0.4)));
    fb.position.y = 1.5 + playerMesh.position.y;
    fb.rotation.y = yaw; scene.add(fb);
    const speed = 14; const vx = Math.sin(yaw)*speed; const vz = Math.cos(yaw)*speed;
    fireballs.push({mesh: fb, vx, vz, life: 2.0});
  }
  function castHeal(){
    const cost = 20; if(!canCast('Heal', cost, 1.0)) return;
    playerStats.mana -= cost; playerStats.health = Math.min(playerStats.maxHealth, playerStats.health + 20 + Math.floor(playerStats.magic*0.4)); updateHud(); playSpellTone('Heal');
    // green particles
    const grp = new THREE.Group();
    for(let i=0;i<12;i++){
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.05,6,6), new THREE.MeshBasicMaterial({color:0x33ff88}));
      const a = (i/12)*Math.PI*2; p.position.set(Math.cos(a)*0.6, 0.2+Math.random()*0.6, Math.sin(a)*0.6); grp.add(p);
    }
    grp.position.set(player.position.x, 1.0+playerMesh.position.y, player.position.z); scene.add(grp);
    setTimeout(()=> scene.remove(grp), 600);
  }
  function castLightning(){
    const cost = 25; if(!canCast('Lightning', cost, 0.8)) return;
    playerStats.mana -= cost; updateHud(); playSpellTone('Lightning');
    // find target in front within 10 units
    const target = nearestMonsterInFront(10);
    const start = new THREE.Vector3(player.position.x, 1.6 + playerMesh.position.y, player.position.z);
    const end = target ? new THREE.Vector3(target.position.x, 1.2, target.position.z) : start.clone().add(new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw)).multiplyScalar(6));
    const geom = new THREE.BufferGeometry().setFromPoints([start, end]);
    const mat = new THREE.LineBasicMaterial({color:0x99ddff, transparent:true, opacity:0.9});
    const beam = new THREE.Line(geom, mat); beam.maxLife = 0.15; beam.life = beam.maxLife; scene.add(beam); lightningBeams.push(beam);
    if(target){
      const dmg = Math.max(1, Math.floor(playerStats.magic) + 15);
      target.userData.hp -= dmg;
      setLabelText(target.userData.label, target.userData.name + ' (' + Math.max(0, target.userData.hp) + ')');
      if(target.userData.hp <= 0){
        const lvl = target.userData.level || 1;
        const goldGain = Math.max(1, Math.floor(Math.random() * (3*lvl)) + lvl);
        playerStats.gold += goldGain;
        playerStats.xp += 20 * lvl;
        while(playerStats.xp >= playerStats.level * 100){
          playerStats.xp -= playerStats.level * 100;
          playerStats.level += 1;
          playerStats.maxHealth += 10;
          playerStats.attack += 2;
          playerStats.health = playerStats.maxHealth;
        }
        updateHud();
        scene.remove(target); const idx = monsters.indexOf(target); if(idx>=0) monsters.splice(idx,1);
      }
    }
  }

  function move(dt){
    const speed = isDown('sprint') ? 8 : 4;
    const forward = isDown('forward') ? 1 : isDown('back') ? -1 : 0;
    const strafe  = isDown('right') ? 1 : isDown('left') ? -1 : 0;

    const dirX = Math.sin(yaw); const dirZ = Math.cos(yaw);
    const rightX = Math.cos(yaw); const rightZ = -Math.sin(yaw);

    const vx = (dirX*forward + rightX*strafe) * speed * dt;
    const vz = (dirZ*forward + rightZ*strafe) * speed * dt;

    player.position.x += vx; player.position.z += vz;
    // Resolve collisions against world/store geometry so we cannot walk through trees/walls
    resolveCollisions(player.position, 0.5, inStore);

    // Jumping physics (move the mesh up/down)
    if(!isDead && isDown('jump') && grounded){ vy = jumpStrength; grounded = false; }
    vy -= gravity * dt; playerMesh.position.y += vy * dt;
    if(playerMesh.position.y <= 0){ playerMesh.position.y = 0; vy = 0; grounded = true; }

    // Monster AI: roam & chase
    const px = player.position.x, pz = player.position.z;
    monsters.forEach(m=>{
      const dx = px - m.position.x; const dz = pz - m.position.z; const dist = Math.hypot(dx,dz);
      if(dist < 10){ const k = 2.0 * dt; m.position.x += (dx/dist)*k; m.position.z += (dz/dist)*k; }
      else { m.position.x += m.userData.vx * dt; m.position.z += m.userData.vz * dt; }
      if(Math.abs(m.position.x) > 95){ m.userData.vx*=-1; }
      if(Math.abs(m.position.z) > 95){ m.userData.vz*=-1; }
      // position label above
      m.userData.label.position.set(0, 2.2 + 0.05*Math.sin(performance.now()*0.003), 0);
      // contact damage (simple)
      if(dist < 1.2){
        // Monster damage: base 1-10 scaled by level, with random x2/x3 crits
        const lvl = m.userData.level || 1;
        let incoming = Math.floor(1 + Math.random()*10);
        incoming = Math.floor(incoming * (1 + 0.15*lvl));
        const r = Math.random(); if(r > 0.97) incoming *= 3; else if(r > 0.9) incoming *= 2;
        // apply block reduction
        if(isBlocking){ incoming = Math.max(0, Math.floor(incoming * 0.3)); }
        // shields absorb first
        if(playerStats.shield > 0){
          const used = Math.min(playerStats.shield, incoming);
          playerStats.shield -= used; incoming -= used;
        }
        if(!isDead && incoming > 0){ playTone(120, 0.06); }
        playerStats.health = Math.max(0, playerStats.health - incoming);
        updateHud();
        // maintain safe distance to avoid shaking/overlap
        const minDist = 1.2;
        const ux = dx / (dist||1); const uz = dz / (dist||1);
        player.position.x = m.position.x + ux * minDist;
        player.position.z = m.position.z + uz * minDist;
      }
    });

    // Simple attack swing animation on right arm + weapon
    if(attackSwing > 0){
      const swingSpeed = 6.0; // rad/sec decay
      const swingAngle = Math.min(attackSwing, Math.PI/3);
      playerMesh.userData.armR.rotation.z = -swingAngle; // swing right arm
      if(playerMesh.userData.weapon){ playerMesh.userData.weapon.rotation.z = -swingAngle; }
      attackSwing = Math.max(0, attackSwing - swingSpeed * dt);
      if(attackSwing === 0){
        playerMesh.userData.armR.rotation.z = 0;
        if(playerMesh.userData.weapon){ playerMesh.userData.weapon.rotation.z = 0; }
      }
    }

    // Projectiles update (arrows)
    for(let i=arrows.length-1;i>=0;i--){
        const a = arrows[i];
        a.mesh.position.x += a.vx * dt;
        a.mesh.position.z += a.vz * dt;
        a.life -= dt;
        // hit test with monsters
        let hitIndex = -1;
        for(let j=0;j<monsters.length;j++){
          const m = monsters[j];
          const dx = a.mesh.position.x - m.position.x; const dz = a.mesh.position.z - m.position.z; const d = Math.hypot(dx,dz);
          if(d < 0.8){ hitIndex = j; break; }
        }
        if(hitIndex>=0){
          const m = monsters[hitIndex];
          const dmg = weaponBaseDamage();
          m.userData.hp -= dmg;
          setLabelText(m.userData.label, m.userData.name + ' (' + Math.max(0, m.userData.hp) + ')');
          if(m.userData.hp <= 0){
            const lvl = m.userData.level || 1;
            const goldGain = Math.max(1, Math.floor(Math.random() * (3*lvl)) + lvl);
            playerStats.gold += goldGain;
            playerStats.xp += 20 * lvl;
            while(playerStats.xp >= playerStats.level * 100){
              playerStats.xp -= playerStats.level * 100;
              playerStats.level += 1;
              playerStats.maxHealth += 10;
              playerStats.attack += 2;
              playerStats.health = playerStats.maxHealth;
            }
            updateHud();
            scene.remove(m); monsters.splice(hitIndex,1);
          }
          scene.remove(a.mesh); arrows.splice(i,1); continue;
        }
        if(a.life <= 0){ scene.remove(a.mesh); arrows.splice(i,1); }
      }

      // Projectiles update (fireballs)
      for(let i=fireballs.length-1;i>=0;i--){
        const f = fireballs[i];
        f.mesh.position.x += f.vx * dt;
        f.mesh.position.z += f.vz * dt;
        f.life -= dt;
        f.mesh.material.emissiveIntensity = 0.5 + 0.5*Math.sin(performance.now()*0.01);
        let hitIndex = -1;
        for(let j=0;j<monsters.length;j++){
          const m = monsters[j];
          const dx = f.mesh.position.x - m.position.x; const dz = f.mesh.position.z - m.position.z; const d = Math.hypot(dx,dz);
          if(d < 1.1){ hitIndex = j; break; }
        }
        if(hitIndex>=0){
          const m = monsters[hitIndex];
          const dmg = Math.max(1, Math.floor(playerStats.magic * 0.8) + 10);
          m.userData.hp -= dmg;
          setLabelText(m.userData.label, m.userData.name + ' (' + Math.max(0, m.userData.hp) + ')');
          const flash = new THREE.PointLight(0xff5522, 1.2, 5); flash.position.copy(f.mesh.position); scene.add(flash); setTimeout(()=> scene.remove(flash), 150);
          if(m.userData.hp <= 0){
            const lvl = m.userData.level || 1;
            const goldGain = Math.max(1, Math.floor(Math.random() * (3*lvl)) + lvl);
            playerStats.gold += goldGain;
            playerStats.xp += 20 * lvl;
            while(playerStats.xp >= playerStats.level * 100){
              playerStats.xp -= playerStats.level * 100;
              playerStats.level += 1;
              playerStats.maxHealth += 10;
              playerStats.attack += 2;
              playerStats.health = playerStats.maxHealth;
            }
            updateHud();
            scene.remove(m); monsters.splice(hitIndex,1);
          }
          scene.remove(f.mesh); fireballs.splice(i,1); continue;
        }
        if(f.life <= 0){ scene.remove(f.mesh); fireballs.splice(i,1); }
      }

      // Lightning beams fade
      for(let i=lightningBeams.length-1;i>=0;i--){
        const b = lightningBeams[i];
        b.life -= dt;
        b.material.opacity = Math.max(0, b.life / b.maxLife);
        if(b.life <= 0){ scene.remove(b); lightningBeams.splice(i,1); }
      }

    // Death check
    if(!isDead && playerStats.health <= 0){
      isDead = true;
      const overlay = document.getElementById('deathOverlay');
      // Build payload once
      const payload = {
        health: playerStats.health,
        maxHealth: playerStats.maxHealth,
        armor: playerStats.armor,
        gold: playerStats.gold,
        level: playerStats.level,
        xp: playerStats.xp,
        attack: playerStats.attack,
        defense: playerStats.defense,
        magic: playerStats.magic,
        mana: playerStats.mana,
        weapon: playerStats.weapon,
        inventory: (playerStats.inventory||[]).join(','),
        skinColor: playerStats.colors && playerStats.colors.skin,
        shirtColor: playerStats.colors && playerStats.colors.shirt,
        pantsColor: playerStats.colors && playerStats.colors.pants,
        charClass: playerStats.charClass
      };
      // Show overlay only after we best-effort save, or after a short timeout fallback
      const showOverlay = ()=>{ if(overlay){ overlay.style.display = 'flex'; } };
      let shown = false;
      const fallbackTimer = setTimeout(()=>{ if(!shown){ shown = true; showOverlay(); } }, 800);
      if(typeof charId !== 'undefined' && charId){
        try{
          fetch(`/characters/api/${charId}/saveState`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)})
            .catch(()=>{})
            .finally(()=>{ if(!shown){ shown = true; clearTimeout(fallbackTimer); showOverlay(); } });
        }catch(e){ if(!shown){ shown = true; clearTimeout(fallbackTimer); showOverlay(); } }
      } else {
        if(!shown){ shown = true; clearTimeout(fallbackTimer); showOverlay(); }
      }
    }

    // Camera follow + model facing
    // Rotate the player model to face the current yaw
    player.rotation.y = yaw;
    // Third-person boom using yaw (horizontal) and pitch (vertical)
    const r = 2.8;
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    camera.position.x = player.position.x - Math.sin(yaw) * cp * r;
    camera.position.z = player.position.z - Math.cos(yaw) * cp * r;
    camera.position.y = 1.6 + playerMesh.position.y + sp * r * 0.8; // add some vertical boom from pitch
    camera.lookAt(player.position.x, 1.5 + playerMesh.position.y, player.position.z);

    // Interaction prompts (store / cave enter/exit)
    if(promptEl){
      let show = false; let text = 'Press E to interact';
      const dStore = Math.hypot(player.position.x - storeZone.x, player.position.z - storeZone.z);
      if(!inStore && dStore < 3){ show=true; text='Press E to enter Store'; }
      const nearStoreExit = storeExitCenters.find(v=> Math.hypot(player.position.x - v.x, player.position.z - v.z) < 2.5);
      if(!show && inStore && nearStoreExit){ show=true; text='Press E to leave Store'; }
      if(!show && inStore && storeClerkPos){
        const dClerk = Math.hypot(player.position.x - storeClerkPos.x, player.position.z - storeClerkPos.z);
        if(dClerk < 4){ show=true; text='Press Enter to open Store Menu'; }
      }
      const nearEntrance = caveEntrances.find(v=> Math.hypot(player.position.x - v.x, player.position.z - v.z) < 3);
      if(!show && !inCave && nearEntrance){ show=true; text='Press E to enter Cave'; }
      const nearExit = caveExitCenters.find(v=> Math.hypot(player.position.x - v.x, player.position.z - v.z) < 3);
      if(!show && inCave && nearExit){ show=true; text='Press E to leave Cave'; }
      promptEl.textContent = text;
      promptEl.style.display = show ? 'block' : 'none';
    }

    // Zone checks removed; everything happens in-map now
  }

  // distanceToGate removed

  // Resize
  window.addEventListener('resize', ()=>{ camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });

  let last = performance.now();
  function animate(){
    const now = performance.now(); const dt = Math.min(0.05, (now - last)/1000); last = now;
    move(dt);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
})();