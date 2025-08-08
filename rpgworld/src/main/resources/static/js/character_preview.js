(function(){
  const container = document.getElementById('preview3d');
  if(!container) return;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202028);
  const camera = new THREE.PerspectiveCamera(60, container.clientWidth/container.clientHeight, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const dir = new THREE.DirectionalLight(0xffffff, 0.8); dir.position.set(5,10,7); scene.add(dir);

  // Character mesh (head + torso + legs)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(1,0.9,0.6), new THREE.MeshStandardMaterial({color: 0x6699ff}));
  torso.position.y = 0.45;
  const legs = new THREE.Mesh(new THREE.BoxGeometry(1,0.6,0.6), new THREE.MeshStandardMaterial({color: 0x333333}));
  legs.position.y = -0.15;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), new THREE.MeshStandardMaterial({color: 0xffddaa}));
  head.position.y = 1.1;

  const group = new THREE.Group(); group.add(torso); group.add(legs); group.add(head); scene.add(group);

  group.position.y = 0.9;
  camera.position.set(0,1.3,3);

  const ground = new THREE.Mesh(new THREE.CircleGeometry(2.5, 32), new THREE.MeshPhongMaterial({color:0x333333}));
  ground.rotation.x = -Math.PI/2; scene.add(ground);

  function setColorBySkills(sk){
    const s = (sk||'').toLowerCase();
    let color = 0x6699ff; // default torso color fallback
    if(s.includes('warrior')||s.includes('attack')) color = 0xcc3333;
    else if(s.includes('mage')||s.includes('magic')||s.includes('wizard')) color = 0x3344cc;
    else if(s.includes('rogue')||s.includes('stealth')) color = 0x33cc88;
    torso.material.color.setHex(color);
  }

  function updateFromInputs(){
    const val = (name, def='')=>{ const el=document.querySelector(`[name="${name}"]`); return el && el.value ? el.value : def; };
    const skin = val('skinColor', '#ffddaa');
    const shirt = val('shirtColor', '#6699ff');
    const pants = val('pantsColor', '#333333');
    const klass = (val('charClass','Adventurer')||'').toLowerCase();
    // apply base colors
    head.material.color.set(new THREE.Color(skin));
    torso.material.color.set(new THREE.Color(shirt));
    legs.material.color.set(new THREE.Color(pants));
    // simple class hint by tinting torso if unset
    if(klass==='wizard') torso.material.color.set(new THREE.Color('#3344cc'));
    if(klass==='barbarian') torso.material.color.set(new THREE.Color('#8b4513'));
    if(klass==='archer') torso.material.color.set(new THREE.Color('#556b2f'));
  }

  function spin(){ group.rotation.y += 0.01; }

  function onResize(){
    const w = container.clientWidth, h = container.clientHeight;
    camera.aspect = w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h);
  }
  window.addEventListener('resize', onResize);

  function animate(){ spin(); renderer.render(scene, camera); requestAnimationFrame(animate); }
  animate();

  // Hook inputs
  function byName(name){ return document.querySelector(`[name="${name}"]`); }
  const skillsInput = byName('skills');
  if(skillsInput){
    skillsInput.addEventListener('input', ()=> setColorBySkills(skillsInput.value));
    setColorBySkills(skillsInput.value);
  }
  ['skinColor','shirtColor','pantsColor','faceType'].forEach(n=>{
    const el = byName(n); if(el){ el.addEventListener('input', updateFromInputs); }
  });
  updateFromInputs();
})();