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

  // Ground
  const groundGeo = new THREE.PlaneGeometry(200, 200);
  const groundMat = new THREE.MeshLambertMaterial({color: 0x228b22});
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
  function addTree(x,z){
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.3,2,8), new THREE.MeshLambertMaterial({color:0x8b4513}));
    trunk.position.set(x,1,z);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 12), new THREE.MeshLambertMaterial({color:0x2e8b57}));
    crown.position.set(x,2.4,z);
    scene.add(trunk); scene.add(crown);
  }
  for(let i=0;i<40;i++) addTree(Math.random()*180-90, Math.random()*180-90);

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
  function buildMonsterBody(){
    const group = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9,1.0,0.6), new THREE.MeshLambertMaterial({color:0x6a34b0}));
    torso.position.y = 0.9; group.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.35,12,12), new THREE.MeshLambertMaterial({color:0x7a54d0}));
    head.position.y = 1.6; group.add(head);
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.25,0.6,0.25), new THREE.MeshLambertMaterial({color:0x6a34b0})); legL.position.set(-0.2,0.3,0);
    const legR = legL.clone(); legR.position.x = 0.2; group.add(legL); group.add(legR);
    return {group, torso, head};
  }
  function spawnMonster(x,z,i){
    const bodyParts = buildMonsterBody();
    const name = MONSTER_NAMES[i % MONSTER_NAMES.length] + ' ' + (i+1);
    const hp = 40 + Math.floor(Math.random()*30);
    const label = makeLabel(name + ' ('+hp+')');
    label.position.set(0, 2.0, 0);
    const g = new THREE.Group(); g.add(bodyParts.group); g.add(label); scene.add(g);
    g.position.set(x,0,z);
    g.userData = { vx:(Math.random()-0.5)*2, vz:(Math.random()-0.5)*2, body: bodyParts.group, label, hp, name };
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
    if(document.pointerLockElement !== canvas){
      canvas.requestPointerLock();
      return; // first click just locks pointer
    }
    // When locked, interpret buttons
    if(e.button === 0){ // left click = attack
      performAttack();
    } else if(e.button === 2){ // right click = block (hold-to-block style)
      startBlock();
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

  const controls = { forward:['w','arrowup'], back:['s','arrowdown'], left:['a','arrowleft'], right:['d','arrowright'], jump:[' '], sprint:['shift'] };
  const keyDown = k=> !!keys[k];
  const anyDown = list => list.some(k=> keyDown(k));
  const isDown = action => anyDown(controls[action]||[]);

  let vy = 0; const gravity = 20; const jumpStrength = 8; let grounded = true; const groundY = 0; // player base y
  let isDead = false;

  // Character stats and HUD
  const hud = {
    name: document.getElementById('hudName'),
    health: document.getElementById('hudHealth'),
    armor: document.getElementById('hudArmor'),
    weapon: document.getElementById('hudWeapon'),
    gold: document.getElementById('hudGold')
  };
  const playerStats = { name:'Hero', health:100, maxHealth:100, attack:10, defense:5, armor:0, gold:0, weapon:'Fists', colors:{skin:'#ffddaa', shirt:'#6699ff', pants:'#333333'} };
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
    if(hud.health) hud.health.textContent = playerStats.health + ' / ' + playerStats.maxHealth;
    if(hud.armor) hud.armor.textContent = playerStats.armor;
    if(hud.weapon) hud.weapon.textContent = playerStats.weapon;
    if(hud.gold) hud.gold.textContent = playerStats.gold;
    updatePlayerBar();
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
  }

  // Fetch character from backend (by charId if present, else latest)
  const params = new URLSearchParams(window.location.search);
  const charId = params.get('charId');
  const url = charId ? `/characters/${charId}.json` : '/characters/latest.json';
  fetch(url).then(r=> r.ok ? r.json() : null).then(data=>{
    if(!data) { updateHud(); applyAppearance(); return; }
    playerStats.name = data.name || playerStats.name;
    playerStats.health = data.health > 0 ? data.health : playerStats.health;
    playerStats.maxHealth = playerStats.health;
    playerStats.attack = data.attack || playerStats.attack;
    playerStats.defense = data.defense || playerStats.defense;
    playerStats.armor = (data.armor!=null)? data.armor : playerStats.armor;
    playerStats.gold = (data.gold!=null)? data.gold : playerStats.gold;
    playerStats.weapon = data.weapon || playerStats.weapon;
    playerStats.colors.skin = data.skinColor || playerStats.colors.skin;
    playerStats.colors.shirt = data.shirtColor || playerStats.colors.shirt;
    playerStats.colors.pants = data.pantsColor || playerStats.colors.pants;
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
  function performAttack(){
    if(isDead) return;
    // trigger swing
    attackSwing = Math.max(attackSwing, Math.PI/3); // swing amplitude
    playTone(440); // attack sound
    const m = nearestMonsterInFront();
    if(!m) return;
    const dmg = Math.max(1, playerStats.attack);
    m.userData.hp -= dmg;
    // flash monster torso/head to indicate hit
    const setEmissive = (color)=>{
      m.userData.body.traverse?.((child)=>{
        if(child.isMesh && child.material && 'emissive' in child.material){ child.material.emissive = new THREE.Color(color); }
      });
    };
    setEmissive(0xff0000);
    setTimeout(()=> setEmissive(0x000000), 120);
    setLabelText(m.userData.label, m.userData.name + ' (' + Math.max(0, m.userData.hp) + ')');
    if(m.userData.hp <= 0){
      scene.remove(m);
      const idx = monsters.indexOf(m); if(idx>=0) monsters.splice(idx,1);
      playerStats.gold += 5; updateHud();
    } else {
      // monster grunt frequency based on name hash
      const h = Array.from(m.userData.name).reduce((a,c)=> a + c.charCodeAt(0), 0);
      playTone(200 + (h % 200), 0.05);
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

  function move(dt){
    const speed = isDown('sprint') ? 8 : 4;
    const forward = isDown('forward') ? 1 : isDown('back') ? -1 : 0;
    const strafe  = isDown('right') ? 1 : isDown('left') ? -1 : 0;

    const dirX = Math.sin(yaw); const dirZ = Math.cos(yaw);
    const rightX = Math.cos(yaw); const rightZ = -Math.sin(yaw);

    const vx = (dirX*forward + rightX*strafe) * speed * dt;
    const vz = (dirZ*forward + rightZ*strafe) * speed * dt;

    player.position.x += vx; player.position.z += vz;

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
      m.userData.label.position.set(0, 1.4 + 0.05*Math.sin(performance.now()*0.003), 0);
      // contact damage (simple)
      if(dist < 1.2){
        let incoming = Math.max(1, 6 - Math.floor(playerStats.armor/5));
        if(isBlocking){
          incoming = Math.max(0, Math.floor(incoming * 0.3)); // 70% reduction while blocking
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

    // Death check
    if(!isDead && playerStats.health <= 0){
      isDead = true;
      const overlay = document.getElementById('deathOverlay');
      if(overlay){ overlay.style.display = 'flex'; }
    }

    // Camera follow
    camera.position.x = player.position.x - Math.sin(yaw)*2.8;
    camera.position.z = player.position.z - Math.cos(yaw)*2.8;
    camera.position.y = 1.6 + playerMesh.position.y;
    camera.lookAt(player.position.x, 1.5 + playerMesh.position.y, player.position.z);

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