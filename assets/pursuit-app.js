(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const physics = window.PursuitPhysics;
  const colors = { mint: '#73e3bd', amber: '#ffc278', muted: '#9eafbf', grid: '#29394a', blue: '#87b7fa' };
  let a = 3, u = 6, time = 0, playing = false, previous = null;
  let events = physics.events(a, u);
  const fmt = (n, digits = 2) => (Math.abs(n) < 1e-9 ? 0 : n).toFixed(digits);
  const short = n => Number(n.toFixed(2)).toString();
  function text(id, value) { $(id).textContent = value; }
  function line(x1, y1, x2, y2, stroke, extra = '') { return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" ${extra}/>`; }
  function label(x, y, value, fill = colors.muted, extra = '') { return `<text x="${x}" y="${y}" fill="${fill}" font-size="11" ${extra}>${value}</text>`; }
  function path(points, stroke, extra = '') { return `<path d="${points.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ')}" stroke="${stroke}" fill="none" ${extra}/>`; }
  function dot(x, y, color) { return `<circle cx="${x}" cy="${y}" r="4" fill="${color}" stroke="#111d2b" stroke-width="2"/>`; }
  function plot(minY, maxY, unit) {
    const x = t => 54 + t / events.duration * 370;
    const y = value => 183 - (value - minY) / (maxY - minY) * 145;
    let svg = label(14, 22, unit) + label(432, 213, 't / s', colors.muted, 'text-anchor="end"');
    for (let i = 0; i <= 4; i++) {
      const value = minY + (maxY - minY) * i / 4;
      svg += line(54, y(value), 424, y(value), colors.grid) + label(45, y(value) + 4, short(value), colors.muted, 'text-anchor="end"');
    }
    [0, events.equal, events.catch, events.duration].forEach(t => {
      svg += line(x(t), 38, x(t), 186, colors.grid, 'stroke-dasharray="3 5"') + label(x(t), 202, short(t), colors.muted, 'text-anchor="middle"');
    });
    svg += line(54, y(0), 424, y(0), '#6a8194');
    return { x, y, svg };
  }
  function charts(s) {
    const v = plot(0, a * events.duration * 1.12, 'v / (m/s)');
    const endLost = Math.min(time, events.equal);
    const lost = [[v.x(0), v.y(u)], [v.x(endLost), v.y(u)], [v.x(endLost), v.y(a * endLost)], [v.x(0), v.y(0)]];
    let velocity = v.svg + path(lost.concat([lost[0]]), 'none', 'style="fill:#ffc278;fill-opacity:.18"');
    if (time > events.equal) velocity += path([[v.x(events.equal), v.y(u)], [v.x(time), v.y(a * time)], [v.x(time), v.y(u)], [v.x(events.equal), v.y(u)]], 'none', 'style="fill:#73e3bd;fill-opacity:.2"');
    velocity += line(v.x(0), v.y(0), v.x(events.duration), v.y(a * events.duration), colors.mint, 'stroke-width="2.5"');
    velocity += line(v.x(0), v.y(u), v.x(events.duration), v.y(u), colors.amber, 'stroke-width="2.5"');
    velocity += label(255, 22, '— 汽车', colors.mint) + label(330, 22, '— 自行车', colors.amber);
    velocity += line(v.x(time), 38, v.x(time), 183, '#dbe8f3', 'stroke-dasharray="4 4"');
    velocity += dot(v.x(time), v.y(s.carV), colors.mint) + dot(v.x(time), v.y(u), colors.amber);
    velocity += dot(v.x(events.equal), v.y(u), '#ffffff') + label(v.x(events.equal) + 8, v.y(u) - 12, '同速', '#dbe8f3');
    $('velocity-chart').innerHTML = velocity;
    const g = plot(-1.5 * events.maxGap, 1.5 * events.maxGap, 'Δx / m');
    const points = Array.from({ length: 121 }, (_, i) => { const t = events.duration * i / 120; return [g.x(t), g.y(physics.stateAt(a, u, t).gap)]; });
    let gap = g.svg + path(points, colors.blue, 'stroke-width="2.5"');
    gap += line(g.x(time), 38, g.x(time), 183, '#dbe8f3', 'stroke-dasharray="4 4"') + dot(g.x(time), g.y(s.gap), '#ffffff');
    gap += dot(g.x(events.equal), g.y(events.maxGap), colors.amber) + label(g.x(events.equal), g.y(events.maxGap) - 11, `最远 ${short(events.maxGap)} m`, colors.amber, 'text-anchor="middle"');
    gap += dot(g.x(events.catch), g.y(0), colors.mint) + label(g.x(events.catch) - 8, g.y(0) - 11, '追上', colors.mint, 'text-anchor="end"');
    $('gap-chart').innerHTML = gap;
    text('area-note', `橙色：累计落后 ${fmt(s.lost)} m；绿色：累计追回 ${fmt(s.recovered)} m。面积之差 = 位置差。`);
  }
  function render() {
    const s = physics.stateAt(a, u, time);
    const near = t => Math.abs(time - t) < 1e-8;
    let phase, title, copy;
    if (near(0)) {
      phase = '同地出发'; title = '同一位置，不同速度'; copy = '绿灯亮，自行车恰好经过汽车。汽车刚从静止起步，自行车将先向前拉开距离。';
    } else if (near(events.equal)) {
      phase = '速度相等 · 距离最远'; title = '同速了，但还没有追上'; copy = `两车速度都是 ${short(u)} m/s，自行车仍领先 ${short(events.maxGap)} m。间距由增大转为减小，此刻达到最大值。`;
    } else if (near(events.catch)) {
      phase = '再次相遇 · 汽车追上'; title = '位置相等，才是追上'; copy = `两车都到达 ${short(s.carX)} m 处。汽车速度为 ${short(s.carV)} m/s，是自行车的 2 倍；此前落后的距离恰好全部追回。`;
    } else if (time < events.equal) {
      phase = '自行车领先 · 间距增大'; title = '虽然加速，仍然越落越远'; copy = `汽车当前比自行车慢 ${fmt(u - s.carV)} m/s。自行车每秒走得更多，所以两车间距继续增大。`;
    } else if (time < events.catch) {
      phase = '汽车追赶 · 间距减小'; title = '速度超过了，位置还没赶上'; copy = `汽车当前比自行车快 ${fmt(s.carV - u)} m/s，正在追回落后的距离，还需要弥补 ${fmt(s.distance)} m。`;
    } else {
      phase = '汽车领先 · 间距增大'; title = '追上之后，汽车继续向前'; copy = `汽车已领先 ${fmt(s.distance)} m。图中的位置差变为负值，表示汽车在前；实际间距取位置差的绝对值。`;
    }
    text('phase', phase); text('insight-title', title); text('insight-copy', copy);
    text('car-speed', fmt(s.carV)); text('bike-speed', fmt(u)); text('distance', fmt(s.distance)); text('leader', s.gap === 0 ? '同位置' : s.gap > 0 ? '自行车' : '汽车');
    text('car-equation', `½ × ${short(a)} × ${fmt(time)}² = ${fmt(s.carX)} m`);
    text('bike-equation', `${short(u)} × ${fmt(time)} = ${fmt(s.bikeX)} m`);
    text('gap-equation', `${fmt(s.bikeX)} − ${fmt(s.carX)} = ${fmt(s.gap)} m`);
    text('time-value', `${fmt(time)} s`); $('time').value = time;
    text('play', playing ? 'Ⅱ 暂停演示' : near(events.duration) ? '↺ 重新播放' : near(0) ? '▶ 开始演示' : '▶ 继续演示');
    $('play').setAttribute('aria-pressed', String(playing));
    [['start-event', 0], ['equal-event', events.equal], ['catch-event', events.catch]].forEach(([id, t]) => { $(id).classList.toggle('active', near(t)); $(id).setAttribute('aria-pressed', String(near(t))); });
    const maxX = .5 * a * events.duration ** 2;
    const toX = x => 90 + 770 * x / maxX;
    const carX = toX(s.carX), bikeX = toX(s.bikeX);
    $('car').setAttribute('transform', `translate(${carX} 106)`);
    $('bike').setAttribute('transform', `translate(${bikeX} 183)`);
    text('car-caption', `x₁ = ${fmt(s.carX)} m`); text('bike-caption', `x₂ = ${fmt(s.bikeX)} m`);
    $('gap-guides').setAttribute('d', `M${carX} 70V129M${bikeX} 70V206`);
    $('gap-bracket').setAttribute('d', `M${carX} 77V68H${bikeX}V77`);
    $('gap-label').setAttribute('x', Math.max(160, Math.min(775, (carX + bikeX) / 2)));
    text('gap-label', s.distance < 1e-8 ? '同一位置 · 间距 0 m' : `间距 ${fmt(s.distance)} m`);
    let axis = line(90, 252, 895, 252, '#6a8194') + label(913, 257, 'x / m', colors.muted, 'text-anchor="middle"');
    for (let i = 0; i <= 5; i++) { const value = maxX * i / 5; axis += line(toX(value), 248, toX(value), 257, '#6a8194') + label(toX(value), 275, short(value), colors.muted, 'text-anchor="middle"'); }
    $('road-axis').innerHTML = axis;
    text('road-desc', `${fmt(time)} 秒：汽车位置 ${fmt(s.carX)} 米，自行车位置 ${fmt(s.bikeX)} 米，两车间距 ${fmt(s.distance)} 米。${phase}。`);
    charts(s);
  }
  function setTime(t) { playing = false; previous = null; time = Math.max(0, Math.min(events.duration, t)); render(); }
  function parameters() {
    a = Number($('acceleration').value); u = Number($('bicycle-speed').value); events = physics.events(a, u);
    text('acceleration-value', `${fmt(a, 1)} m/s²`); text('bicycle-value', `${fmt(u, 1)} m/s`);
    text('parameter-mode', a === 3 && u === 6 ? '原题' : '参数探索');
    text('equal-event', `② 同速最远 · ${short(events.equal)} s`); text('catch-event', `③ 追上相遇 · ${short(events.catch)} s`);
    text('equal-answer', `t₁ = ${fmt(events.equal)} s`); text('distance-answer', `Δx最大 = ${fmt(events.maxGap)} m`);
    text('catch-answer', `t₂ = ${fmt(events.catch)} s`); text('speed-answer', `v₂ = ${fmt(2 * u)} m/s`);
    $('time').max = events.duration; text('duration-end', `${fmt(events.duration)} s`); setTime(0);
  }
  function toggle() {
    if (time >= events.duration - 1e-9) time = 0;
    playing = !playing; previous = null; render();
  }
  function frame(now) {
    if (playing) {
      if (previous !== null) {
        let next = Math.min(events.duration, time + Math.min((now - previous) / 1000, .1) * Number($('speed').value));
        if ($('auto-pause').checked) {
          // Snap floating-point frame times to the event before displaying it.
          // Exact current-time comparison allows resume without pausing twice.
          const event = [events.equal, events.catch].find(t => time < t && next >= t - 1e-8);
          if (event !== undefined) { next = event; playing = false; }
        }
        time = next;
        if (time >= events.duration) playing = false;
        render();
      }
      previous = now;
    } else previous = null;
    requestAnimationFrame(frame);
  }
  $('play').addEventListener('click', toggle);
  $('reset').addEventListener('click', () => setTime(0));
  $('step').addEventListener('click', () => setTime(time + .1));
  $('time').addEventListener('input', event => setTime(Number(event.target.value)));
  $('start-event').addEventListener('click', () => setTime(0));
  $('equal-event').addEventListener('click', () => setTime(events.equal));
  $('catch-event').addEventListener('click', () => setTime(events.catch));
  $('acceleration').addEventListener('input', parameters); $('bicycle-speed').addEventListener('input', parameters);
  $('original').addEventListener('click', () => { $('acceleration').value = 3; $('bicycle-speed').value = 6; parameters(); });
  document.addEventListener('keydown', event => {
    if (event.code === 'Space' && !event.repeat && !event.target.closest('input,select,button,summary,a,textarea,[contenteditable]')) { event.preventDefault(); toggle(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) { playing = false; previous = null; render(); } });
  $('fullscreen').addEventListener('click', async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { text('fullscreen', '请使用浏览器全屏'); }
  });
  document.addEventListener('fullscreenchange', () => text('fullscreen', document.fullscreenElement ? '⛶ 退出全屏' : '⛶ 全屏演示'));
  parameters(); requestAnimationFrame(frame);
})();
