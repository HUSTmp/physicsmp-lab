'use strict';
(function () {
const deckLength = 200;
    const deckWidth = 32;
    const deckHeight = 4;
    const acceleration = 6; // m/s^2
    const requiredSpeed = 50; // m/s
    const minimalExtraSpeed = 10; // m/s
const scenarios = [
  {
    id: "catapult",
    title: "方案 A",
    initialSpeed: minimalExtraSpeed,
    deckSpeed: 0,
    climbRate: 7,
    skyColor: 0x142d43,
    oceanHue: 0x18485b,
  },
  {
    id: "moving",
    title: "方案 B",
    initialSpeed: 0,
    deckSpeed: requiredSpeed - Math.sqrt(2 * acceleration * deckLength),
    climbRate: 6,
    skyColor: 0x142d43,
    oceanHue: 0x18485b,
  },
];

    function createRenderer(canvas) {
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setClearColor(0x000000, 0);
      return renderer;
    }

    function createCamera(canvas) {
      const camera = new THREE.PerspectiveCamera(48, canvas.clientWidth / canvas.clientHeight, 0.1, 800);
      camera.position.set(150, 145, 210);
      return camera;
    }

    function createPlaneModel() {
      const group = new THREE.Group();

      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xb7c2cf,
        metalness: 0.25,
        roughness: 0.45,
      });
      const accentMaterial = new THREE.MeshStandardMaterial({
        color: 0x2f4b63,
        metalness: 0.3,
        roughness: 0.5,
      });

      const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 9, 24, 1, false), bodyMaterial);
      fuselage.rotation.z = Math.PI / 2;
      fuselage.castShadow = true;
      group.add(fuselage);

      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.4, 24), accentMaterial);
      nose.rotation.z = -Math.PI / 2;
      nose.position.x = 4.8;
      nose.castShadow = true;
      group.add(nose);

      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.4, 2.2, 18), bodyMaterial);
      tail.rotation.z = Math.PI / 2;
      tail.position.x = -4.8;
      tail.castShadow = true;
      group.add(tail);

      const wingGeometry = new THREE.BoxGeometry(2.8, 0.4, 12);
      const wings = new THREE.Mesh(wingGeometry, bodyMaterial);
      wings.position.set(-0.2, 0.4, 0);
      wings.castShadow = true;
      group.add(wings);

      const tailWing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 4.5), bodyMaterial);
      tailWing.position.set(-4, 0.6, 0);
      tailWing.castShadow = true;
      group.add(tailWing);

      const tailFin = new THREE.Mesh(new THREE.BoxGeometry(2, 2.2, 0.5), accentMaterial);
      tailFin.position.set(-4.6, 1.2, 0);
      tailFin.castShadow = true;
      group.add(tailFin);

      const cockpit = new THREE.Mesh(new THREE.SphereGeometry(1.15, 20, 20, 0, Math.PI), new THREE.MeshStandardMaterial({
        color: 0x1f3a56,
        metalness: 0.4,
        roughness: 0.2,
        transparent: true,
        opacity: 0.85,
      }));
      cockpit.rotation.z = Math.PI / 2;
      cockpit.position.set(1.2, 0.5, 0);
      cockpit.castShadow = true;
      group.add(cockpit);

      group.traverse((obj) => {
        if (obj.isMesh) {
          obj.receiveShadow = true;
        }
      });

      group.scale.setScalar(2.1);
      group.position.set(-deckLength / 2, deckHeight + 2.8, 0);

      return group;
    }

    function createCarrierDeck(color = 0x5e6c78) {
      const deckGeometry = new THREE.BoxGeometry(deckLength, deckHeight, deckWidth);
      const deckMaterial = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.6,
        metalness: 0.1,
      });
      const deck = new THREE.Mesh(deckGeometry, deckMaterial);
      deck.receiveShadow = true;
      deck.castShadow = true;
      deck.position.y = deckHeight / 2;

      const runwayGroup = new THREE.Group();
      const centralLineMaterial = new THREE.MeshBasicMaterial({ color: 0xf4f6f8 });
      const centralLine = new THREE.Mesh(new THREE.PlaneGeometry(deckLength * 0.92, 0.5), centralLineMaterial);
      centralLine.rotation.x = -Math.PI / 2;
      centralLine.position.y = deckHeight / 2 + 0.05;
      runwayGroup.add(centralLine);

      const stripeMaterial = new THREE.MeshBasicMaterial({ color: 0xf0b550 });
      for (let i = -4; i <= 4; i++) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.2), stripeMaterial);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set((i / 5) * deckLength * 0.8, deckHeight / 2 + 0.06, deckWidth * 0.2);
        runwayGroup.add(stripe);
      }

      const edgeMaterial = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
      const edgeLine = new THREE.Mesh(new THREE.PlaneGeometry(deckLength * 0.96, 0.4), edgeMaterial);
      edgeLine.rotation.x = -Math.PI / 2;
      edgeLine.position.set(0, deckHeight / 2 + 0.05, deckWidth / 2 - 2);
      runwayGroup.add(edgeLine);

      deck.add(runwayGroup);
      return deck;
    }

    function createOcean(color) {
      const geometry = new THREE.PlaneGeometry(1200, 1200, 50, 50);
      const material = new THREE.MeshPhongMaterial({
        color,
        transparent: true,
        opacity: 0.96,
        shininess: 30,
        specular: 0xe5edf4,
      });
      const ocean = new THREE.Mesh(geometry, material);
      ocean.rotation.x = -Math.PI / 2;
      ocean.position.y = -0.1;
      ocean.receiveShadow = true;
      return ocean;
    }

    function addLights(scene, skyColor) {
      scene.fog = new THREE.Fog(skyColor, 200, 650);
      scene.background = new THREE.Color(skyColor);
      const hemi = new THREE.HemisphereLight(0xf3f6f8, 0x2a4257, 0.6);
      hemi.position.set(0, 180, 0);
      scene.add(hemi);

      const dir = new THREE.DirectionalLight(0xfbe9d0, 1.05);
      dir.position.set(-110, 180, 140);
      dir.castShadow = true;
      dir.shadow.mapSize.set(2048, 2048);
      dir.shadow.camera.near = 10;
      dir.shadow.camera.far = 500;
      dir.shadow.camera.left = -200;
      dir.shadow.camera.right = 200;
      dir.shadow.camera.top = 200;
      dir.shadow.camera.bottom = -200;
      scene.add(dir);

      const rimLight = new THREE.DirectionalLight(0xc5d6e5, 0.4);
      rimLight.position.set(180, 120, -120);
      scene.add(rimLight);
    }

    function formatNumber(value, unit = "") {
      return `${value.toFixed(2)} ${unit}`.trim();
    }

    function setupScenario(config) {
      const canvas = document.getElementById(`scene-${config.id}`);
      const hud = document.getElementById(`hud-${config.id}`);
      const renderer = createRenderer(canvas);
      const camera = createCamera(canvas);
      const controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.maxPolarAngle = Math.PI / 2.1;
      controls.minDistance = 40;
      controls.maxDistance = 420;
      controls.target.set(0, 12, 0);

      const scene = new THREE.Scene();
      addLights(scene, config.skyColor);

      const ocean = createOcean(config.oceanHue);
      scene.add(ocean);

      const carrierGroup = new THREE.Group();
      const deck = createCarrierDeck();
      carrierGroup.add(deck);

      const island = new THREE.Mesh(
        new THREE.BoxGeometry(18, 28, 12),
        new THREE.MeshStandardMaterial({ color: 0x4f5d6a, metalness: 0.25, roughness: 0.5 })
      );
      island.position.set(deckLength / 3, 18, -deckWidth / 2 + 7);
      island.castShadow = true;
      carrierGroup.add(island);

      const radar = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.2, 6, 16),
        new THREE.MeshStandardMaterial({ color: 0x6a7a87, metalness: 0.2, roughness: 0.5 })
      );
      radar.position.set(deckLength / 3, 32, -deckWidth / 2 + 7);
      radar.castShadow = true;
      carrierGroup.add(radar);

      scene.add(carrierGroup);

      // Fixed world-space references reveal translation independently of camera orbit.
      const origin = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(deckLength, deckHeight, deckWidth)),
        new THREE.LineDashedMaterial({ color: 0x87b7fa, dashSize: 3, gapSize: 2, transparent: true, opacity: .8 })
      );
      origin.position.y = deckHeight / 2 + .1;
      origin.computeLineDistances();
      scene.add(origin);
      [-100, 0, 100].forEach(x => {
        const marker = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(.7, .7, 13, 8), new THREE.MeshBasicMaterial({ color: 0xffc278 }));
        pole.position.y = 6.5;
        marker.add(pole);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(2, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffc278 }));
        cap.position.y = 14;
        marker.add(cap);
        marker.position.set(x, 0, 32);
        scene.add(marker);
      });
      const motionArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 2, 48), 1, 0x73e3bd, 5, 3);
      scene.add(motionArrow);

      const plane = createPlaneModel();
      carrierGroup.add(plane);

      const gridHelper = new THREE.GridHelper(800, 80, 0x285166, 0x285166);
      gridHelper.position.y = -0.05;
      scene.add(gridHelper);

      const hudFields = {};
      hud.querySelectorAll("[data-field]").forEach((el) => {
        hudFields[el.dataset.field] = el;
      });

      return {
        config,
        canvas,
        renderer,
        camera,
        controls,
        scene,
        ocean,
        oceanBaseColor: new THREE.Color(config.oceanHue),
        carrierGroup,
        motionArrow,
        deck,
        plane,
        hudFields,
        state: {
          elapsed: 0,
          onDeck: true,
          flightTime: 0,
          carrierProgress: 0,
          takeoffRecorded: false,
          worldVelocity: new THREE.Vector3(),
          relVelocity: 0,
          relDistance: 0,
          catapultFinished: false,
          takeoffTime: 0,
        },
      };
    }


    const $ = (id) => document.getElementById(id);
    const instances = [];
    let time = 0, playing = false, lastTime = 0;
    function endpoint(config) {
      const speed = Math.sqrt(config.initialSpeed ** 2 + 2 * acceleration * deckLength);
      return { speed, time: 2 * deckLength / (speed + config.initialSpeed), air: speed + config.deckSpeed };
    }
    function duration() { return Math.max(...scenarios.map(c => endpoint(c).time)) + 2.5; }
    try {
      scenarios.forEach(config => instances.push(setupScenario(config)));
    } catch (error) {
      console.error(error);
      $('render-error').hidden = false;
      $('render-error').textContent = '三维画面未能初始化，请在支持 WebGL 的浏览器中开启硬件加速后重试。下方数值与时间控制仍可使用。';
    }
    function updateScenario(config, index) {
      const end = endpoint(config);
      const runTime = Math.min(time, end.time);
      const distance = Math.min(deckLength, config.initialSpeed * runTime + .5 * acceleration * runTime ** 2);
      const relative = config.initialSpeed + acceleration * runTime;
      const air = relative + config.deckSpeed;
      const passed = end.air >= requiredSpeed - 1e-10;
      const finished = time >= end.time;
      const flight = passed ? Math.max(0, time - end.time) : 0;
      const hud = $('hud-' + config.id);
      const field = name => hud.querySelector(`[data-field="${name}"]`);
      field('distance').textContent = distance.toFixed(2);
      field('run-time').textContent = runTime.toFixed(2);
      field('rel-speed').textContent = relative.toFixed(2);
      field('world-speed').textContent = air.toFixed(2);
      field('status').textContent = finished ? (passed ? '已达标 · 离舰爬升（示意）' : '未达标 · 停留末端展示结果') : time === 0 ? '准备就绪 · 等待开始' : '甲板滑跑中';
      field('status').classList.toggle('failed', finished && !passed);
      field('meter').style.width = Math.min(100, air / requiredSpeed * 100) + '%';
      field('prediction').textContent = `末端对空气速度 ${end.air.toFixed(4)} m/s · ${passed ? '达到起飞要求' : '低于 50 m/s 要求'}`;
      // A bounded visual gain keeps the carrier visible even at the maximum speed.
      const gain = config.id === 'moving' && $('enhance-motion').checked
        ? Math.max(1, Math.min(6, 90 / Math.max(config.deckSpeed * duration(), 1))) : 1;
      const translation = config.deckSpeed * time * gain;
      if (config.id === 'moving') {
        $('carrier-distance').textContent = (config.deckSpeed * time).toFixed(2) + ' m';
        $('moving-view-label').textContent = gain > 1 ? `航母平移 ×${gain.toFixed(1)} · 示意增强` : '地面参考系 · 真实平移比例';
        $('carrier-distance').previousElementSibling.textContent = config.deckSpeed > 0 ? '航母向前航行 →' : '航母静止';
      }
      const instance = instances[index];
      if (!instance) return;
      // Analytic positions make seeking and replay independent of frame rate.
      instance.carrierGroup.position.x = translation;
      instance.motionArrow.visible = translation > .1;
      instance.motionArrow.setLength(Math.max(.1, translation), Math.min(5, translation * .25), Math.min(3, translation * .15));
      instance.plane.position.set(-deckLength / 2 + distance + end.speed * flight, deckHeight + 2.8 + config.climbRate * flight, 0);
      instance.plane.rotation.set(0, 0, Math.min(flight, 1) * Math.PI / 15);
    }
    function refresh() {
      scenarios.forEach(updateScenario);
      $('time').max = duration();
      $('time').value = time;
      $('time-value').textContent = time.toFixed(2) + ' s';
      $('duration-end').textContent = duration().toFixed(2) + ' s';
      $('play').textContent = playing ? 'Ⅱ 暂停演示' : time >= duration() ? '↻ 重新演示' : time > 0 ? '▶ 继续演示' : '▶ 开始演示';
      $('step').disabled = time >= duration();
      $('catapult-label').textContent = scenarios[0].initialSpeed.toFixed(2) + ' m/s';
      $('carrier-label').textContent = '≈ ' + scenarios[1].deckSpeed.toFixed(4) + ' m/s';
    }
    function reset() { playing = false; time = 0; refresh(); }
    function toggle() { if (time >= duration()) time = 0; playing = !playing; refresh(); }
    $('play').addEventListener('click', toggle);
    $('reset').addEventListener('click', reset);
    $('enhance-motion').addEventListener('change', refresh);
    $('step').addEventListener('click', () => { playing = false; time = Math.min(duration(), time + .5); refresh(); });
    $('time').addEventListener('input', e => { playing = false; time = Number(e.target.value); refresh(); });
    function markPreset(name) {
      document.querySelectorAll('[data-preset]').forEach(button => {
        const selected = button.dataset.preset === name;
        button.classList.toggle('active', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
    }
    [['catapult-speed', 0, 'initialSpeed'], ['carrier-speed', 1, 'deckSpeed']].forEach(([id, index, prop]) => {
      $(id).addEventListener('input', e => { scenarios[index][prop] = Number(e.target.value); markPreset(''); reset(); });
    });
    document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => {
      const name = button.dataset.preset;
      scenarios[0].initialSpeed = name === 'threshold' ? 10 : name === 'equal' ? 5 : 0;
      scenarios[1].deckSpeed = name === 'threshold' ? requiredSpeed - Math.sqrt(2 * acceleration * deckLength) : name === 'equal' ? 5 : 0;
      $('catapult-speed').value = scenarios[0].initialSpeed;
      $('carrier-speed').value = scenarios[1].deckSpeed;
      markPreset(name); reset();
    }));
    $('camera-reset').addEventListener('click', () => instances.forEach(instance => {
      instance.camera.position.set(150, 145, 210);
      instance.controls.target.set(0, 12, 0);
      instance.controls.update();
    }));
    $('fullscreen').addEventListener('click', async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
      } catch {
        $('render-error').hidden = false;
        $('render-error').textContent = '浏览器未允许全屏，请使用浏览器的全屏菜单。';
      }
    });
    document.addEventListener('fullscreenchange', () => { $('fullscreen').textContent = document.fullscreenElement ? '⛶ 退出全屏' : '⛶ 全屏演示'; });
    document.addEventListener('keydown', e => {
      if (e.code === 'Space' && !e.repeat && !['INPUT', 'SELECT', 'BUTTON', 'A', 'TEXTAREA'].includes(document.activeElement.tagName)) { e.preventDefault(); toggle(); }
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { playing = false; refresh(); } lastTime = 0; });
    function animate(now) {
      const delta = lastTime ? Math.min((now - lastTime) / 1000, .1) : 0;
      lastTime = now;
      if (playing) { time = Math.min(duration(), time + delta * Number($('speed').value)); if (time >= duration()) playing = false; refresh(); }
      instances.forEach(instance => {
        const width = instance.canvas.clientWidth, height = instance.canvas.clientHeight;
        if (!width || !height) return;
        const ratio = instance.renderer.getPixelRatio();
        if (instance.canvas.width !== Math.floor(width * ratio) || instance.canvas.height !== Math.floor(height * ratio)) {
          instance.renderer.setSize(width, height, false);
          instance.camera.aspect = width / height;
          instance.camera.updateProjectionMatrix();
        }
        instance.controls.update();
        instance.renderer.render(instance.scene, instance.camera);
      });
      requestAnimationFrame(animate);
    }
    refresh();
    requestAnimationFrame(animate);
})();
