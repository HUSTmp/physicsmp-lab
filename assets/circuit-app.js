(() => {
  'use strict';
  const $ = id => document.getElementById(id), P = CircuitPhysics;
  const fmt = n => n.toFixed(2);
  let mode = 'R', closed = true, flowing = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let running = false, progress = 0, phase = 0, last = null, records = [];
  const svgNS = 'http://www.w3.org/2000/svg';
  const particles = Array.from({ length: 20 }, () => {
    const c = document.createElementNS(svgNS, 'circle'); c.setAttribute('r', '3.5'); $('charges').append(c); return c;
  });
  const state = () => P.calculate(+$('source').value, +$('external').value, P.resistanceFromLevel(+$('level').value), closed);
  function updatePlay() {
    $('play').textContent = running ? 'Ⅱ 暂停自动演示' : (progress > 0 && progress < 1 ? '▶ 继续演示' : `▶ 自动增大${mode === 'R' ? '外阻' : '内阻'}`);
    $('play').setAttribute('aria-pressed', String(running));
    $('play').disabled = !closed;
  }
  function stop(resetProgress = true) { running = false; if (resetProgress) progress = 0; updatePlay(); }
  function chart(s) {
    const xMin = mode === 'R' ? 1 : 2, xMax = mode === 'R' ? 20 : 10;
    const x = v => 62 + (v - xMin) / (xMax - xMin) * 658, y = v => 203 - v / s.E * 162;
    let html = '';
    for (let i = 0; i <= 4; i++) {
      const v = s.E * i / 4;
      html += `<path d="M62 ${y(v)}H720" stroke="#273747"/><text x="49" y="${y(v) + 4}" fill="#9eafbf" text-anchor="end" font-size="12">${Number(v.toFixed(2))}</text>`;
    }
    const ticks = mode === 'R' ? [1, 5, 10, 15, 20] : [2, 4, 6, 8, 10];
    ticks.forEach(v => { html += `<text x="${x(v)}" y="224" fill="#9eafbf" text-anchor="middle" font-size="12">${v}</text>`; });
    html += '<text x="22" y="22" fill="#9eafbf" font-size="12">U / V</text><path d="M62 32V203H726" fill="none" stroke="#8195a7"/>';
    html += `<text x="720" y="246" text-anchor="end" fill="#9eafbf" font-size="12">${mode === 'R' ? '外电阻 R' : '内电阻 r'} / Ω</text><path d="M62 41H720" stroke="#a9bdce" stroke-dasharray="6 5"/><text x="726" y="38" fill="#c1d0dc" font-size="12">E</text>`;
    ['outer', 'inner'].forEach((key, index) => {
      let d = '';
      for (let i = 0; i <= 100; i++) {
        const v = xMin + i / 100 * (xMax - xMin), point = P.calculate(s.E, mode === 'R' ? v : s.R, mode === 'r' ? v : s.r, closed);
        d += `${i ? 'L' : 'M'}${x(v).toFixed(2)} ${y(point[key]).toFixed(2)}`;
      }
      const color = index ? '#ffc278' : '#73e3bd';
      html += `<path d="${d}" fill="none" stroke="${color}" stroke-width="2.5"/><circle cx="${x(mode === 'R' ? s.R : s.r)}" cy="${y(s[key])}" r="5" fill="${color}" stroke="#111d2b" stroke-width="2"/>`;
    });
    $('chart').innerHTML = html;
    $('chart-title').textContent = mode === 'R' ? `内阻固定 r = ${fmt(s.r)} Ω` : `外阻固定 R = ${fmt(s.R)} Ω`;
  }
  function drawParticles() {
    $('charges').style.display = closed ? '' : 'none';
    const path = $('current-path'), length = path.getTotalLength();
    particles.forEach((c, i) => { const p = path.getPointAtLength((phase + i / particles.length) % 1 * length); c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); });
  }
  function render() {
    const s = state(), h = +$('level').value;
    for (const [id, n] of Object.entries({ current: s.I, outer: s.outer, inner: s.inner, emf: s.E })) $(id).textContent = fmt(n);
    $('external-value').textContent = fmt(s.R) + ' Ω'; $('level-value').textContent = `${h.toFixed(1)}% · r = ${fmt(s.r)} Ω`; $('source-value').textContent = fmt(s.E) + ' V';
    $('meter-outer').textContent = fmt(s.outer) + ' V'; $('meter-inner').textContent = fmt(s.inner) + ' V';
    $('sum').textContent = `${fmt(s.outer)} + ${fmt(s.inner)} = ${fmt(s.E)} V`;
    $('outer-bar').style.width = s.outer / s.E * 100 + '%'; $('inner-bar').style.width = s.inner / s.E * 100 + '%';
    const surface = 497 - 1.2 * h, wiper = 540 - s.R / 20 * 240;
    $('liquid').setAttribute('y', surface); $('liquid').setAttribute('height', 507 - surface); $('liquid-surface').setAttribute('d', `M184 ${surface}H656`);
    $('r-label').textContent = `内阻 r = ${fmt(s.r)} Ω`; $('R-label').textContent = fmt(s.R) + ' Ω';
    $('wiper-wire').setAttribute('d', `M280 90H${wiper}V136`); $('P-label').setAttribute('x', wiper + 12);
    $('active-resistor').setAttribute('x', wiper); $('active-resistor').setAttribute('width', 540 - wiper);
    $('current-path').setAttribute('d', `M220 485V90H${wiper}V150H620V485H220`);
    $('switch-blade').setAttribute('d', closed ? 'M240 90L280 90' : 'M240 90L274 65');
    $('state').textContent = closed ? '电路闭合' : '电路断开 · I = 0'; $('switch').textContent = closed ? '断开电路' : '闭合电路'; $('switch').setAttribute('aria-pressed', String(closed));
    $('flow').textContent = flowing ? '暂停电流动画' : '播放电流动画'; $('flow').setAttribute('aria-pressed', String(flowing));
    $('external').disabled = mode !== 'R'; $('level').disabled = mode !== 'r';
    $('control-note').textContent = mode === 'R' ? '本组固定液面与内阻，只调节 R。切换到第②组可改变液面。调节 E 将开始新一组比较。' : '本组固定外阻 R，只调节液面。切换到第①组可改变 R。自动演示时液面逐渐降低、内阻增大。';
    $('insight-title').textContent = !closed ? '断路时，路端电压等于电动势' : mode === 'R' ? '外阻增大：外电压升、内电压降' : '液面降低：内电压升、外电压降';
    $('insight-copy').textContent = !closed ? '没有电流流过内阻，因此内电压为零；电压表 V₂ 的示数等于 E。闭合电路后继续观察电压分配。' : mode === 'R' ? '内阻不变时，增大外阻会使电流减小，内电压 Ir 随之减小。电动势固定，留给外电路的电压便增大。' : '外阻不变时，降低液面使电源内阻增大，电流减小，外电压 IR 减小。内电压等于 E − U外，因此增大。';
    $('equation-I').textContent = closed ? `${fmt(s.E)} ÷ (${fmt(s.R)} + ${fmt(s.r)}) = ${fmt(s.I)} A` : '电路断开：I = 0 A';
    $('equation-E').textContent = `${fmt(s.E)} = ${fmt(s.outer)} + ${fmt(s.inner)} V`;
    chart(s); drawParticles(); updatePlay();
  }
  ['external', 'level', 'source'].forEach(id => $(id).addEventListener('input', () => { stop(); $('demo-status').textContent = '已手动调整，点击自动演示可从最小电阻开始。'; render(); }));
  for (const m of ['R', 'r']) $('mode-' + m).addEventListener('click', () => {
    stop(); mode = m;
    for (const v of ['R', 'r']) { $('mode-' + v).classList.toggle('active', mode === v); $('mode-' + v).setAttribute('aria-pressed', String(mode === v)); }
    $('demo-status').textContent = '已切换探究组，固定另一电阻进行比较。'; render();
  });
  function sweep() { if (mode === 'R') $('external').value = 1 + 19 * progress; else $('level').value = 200 / (2 + 8 * progress); }
  $('play').addEventListener('click', () => {
    if (running) { stop(false); $('demo-status').textContent = '演示已暂停，可记录当前数据。'; return; }
    if (!closed) return;
    if (progress >= 1 || progress === 0) { progress = 0; sweep(); }
    running = true; last = null; $('demo-status').textContent = '8 秒自动演示 · 电动势和另一电阻保持不变'; render();
  });
  $('switch').addEventListener('click', () => { stop(); closed = !closed; $('demo-status').textContent = closed ? '已闭合电路。' : '已断开电路，自动演示停止。'; render(); });
  $('flow').addEventListener('click', () => { flowing = !flowing; render(); });
  $('reset').addEventListener('click', () => { stop(); $('external').value = 8; $('level').value = 50; $('source').value = 6; closed = true; phase = 0; $('mode-R').click(); $('demo-status').textContent = '已恢复初始参数，已有实验记录保留。'; });
  $('fullscreen').addEventListener('click', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { $('demo-status').textContent = '当前浏览器不支持全屏，请使用浏览器全屏功能。'; } });
  document.addEventListener('fullscreenchange', () => { $('fullscreen').textContent = document.fullscreenElement ? '⛶ 退出全屏' : '⛶ 全屏演示'; });
  document.addEventListener('keydown', e => { if (e.code === 'Space' && !/INPUT|BUTTON|SELECT|TEXTAREA|SUMMARY|A/.test(e.target.tagName)) { e.preventDefault(); $('play').click(); } });
  const row = (s, i) => [i + 1, s.closed ? '闭合' : '断开', s.E, s.R, s.r, s.I, s.outer, s.inner, s.outer + s.inner].map((v, j) => j > 1 ? fmt(v) : v);
  function renderRecords() {
    $('records-body').innerHTML = records.length ? records.map((s, i) => `<tr>${row(s, i).map(v => `<td>${v}</td>`).join('')}</tr>`).join('') : '<tr><td colspan="9" class="empty">还没有记录，调整参数后点击“记录当前数据”。</td></tr>';
    $('export').disabled = $('clear').disabled = !records.length;
    $('record-status').textContent = records.length ? `已记录 ${records.length} 组；显示值保留两位小数，个别数值相加可能有舍入差异。` : '';
  }
  $('record').addEventListener('click', () => { records.push(state()); renderRecords(); });
  $('clear').addEventListener('click', () => { records = []; renderRecords(); });
  $('export').addEventListener('click', () => {
    const csv = '\uFEFF序号,状态,E (V),R (Ω),r (Ω),I (A),U外 (V),U内 (V),电压和 (V)\r\n' + records.map((s, i) => row(s, i).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })), a = document.createElement('a');
    a.href = url; a.download = '内外电压实验记录.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  document.addEventListener('visibilitychange', () => { last = null; });
  function frame(now) {
    const dt = last === null ? 0 : Math.min((now - last) / 1000, .1); last = now;
    if (!document.hidden) {
      if (flowing && closed) phase = (phase + dt * Math.min(state().I, 3) * .11) % 1;
      if (running) { progress = Math.min(1, progress + dt / 8); sweep(); if (progress >= 1) { running = false; $('demo-status').textContent = '本组演示完成。可记录结果，或切换另一组继续比较。'; } render(); }
      else if (flowing && closed) drawParticles();
    }
    requestAnimationFrame(frame);
  }
  render(); requestAnimationFrame(frame);
})();
