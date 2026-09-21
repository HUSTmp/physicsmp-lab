/* Offline classroom simulation. Analytical positions avoid integration drift. */
(() => {
  'use strict';
  const P = window.KinematicsPhysics;
  const $ = id => document.getElementById(id);
  const f = (value, digits = 2) => P.formatNumber(value, digits);
  const presets = {
    accelerate: { v0: 2, a: 1, T: 10 },
    reverse: { v0: 6, a: -2, T: 6 },
    uniform: { v0: 3, a: 0, T: 10 },
    negative: { v0: -2, a: -1, T: 10 }
  };
  let params = { ...presets.accelerate };
  let t = 0, playing = false, graph = 'v', lastFrame = null, frameId = null;
  let trackBounds, chartScale, chartBackground;
  const colors = { mint: '#73e3bd', amber: '#ffc278', red: '#fb928a', blue: '#87b7fa', muted: '#9cafc0', grid: '#253748' };
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const line = (x1, y1, x2, y2, color, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" ${extra}/>`;
  const text = (x, y, content, color = colors.muted, extra = '') => `<text x="${x}" y="${y}" fill="${color}" font-size="12" ${extra}>${content}</text>`;
  const circle = (x, y, r, fill, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
  const signedTerm = n => n < 0 ? `(${f(n)})` : f(n);

  function niceStep(span, count = 5) {
    const raw = Math.max(span / count, 0.0001);
    const power = 10 ** Math.floor(Math.log10(raw));
    const ratio = raw / power;
    return (ratio <= 1 ? 1 : ratio <= 2 ? 2 : ratio <= 5 ? 5 : 10) * power;
  }

  function updateScales() {
    const bounds = P.positionBounds(params.v0, params.a, params.T);
    const span = Math.max(bounds.max - bounds.min, 10);
    trackBounds = { min: bounds.min - span * .07, max: bounds.max + span * .07 };
    if (bounds.min === bounds.max) trackBounds = { min: -5, max: 5 };
    $('track-scale').textContent = '标尺随参数调整';

    let low, high;
    if (graph === 'v') { low = Math.min(0, params.v0, params.v0 + params.a * params.T); high = Math.max(0, params.v0, params.v0 + params.a * params.T); }
    else if (graph === 'x') { low = Math.min(0, bounds.min); high = Math.max(0, bounds.max); }
    else { low = Math.min(0, params.a); high = Math.max(0, params.a); }
    if (high - low < 1e-9) { low = -1; high = 1; }
    const tick = niceStep(high - low);
    low = Math.floor(low / tick) * tick;
    high = Math.ceil(high / tick) * tick;
    if (high === low) high += tick;
    const bottom = document.fullscreenElement && window.innerWidth > 850 ? 146 : 226;
    $('chart').setAttribute('viewBox', `0 0 900 ${bottom + 54}`);
    chartScale = { low, high, tick, bottom, X: n => 70 + n / params.T * 785, Y: n => bottom - (n - low) / (high - low) * (bottom - 44) };
    chartBackground = buildChartBackground();
  }

  function trackX(x) { return 85 + (x - trackBounds.min) / (trackBounds.max - trackBounds.min) * 730; }
  function graphValue(at) { const s = P.stateAt(params.v0, params.a, at); return graph === 'a' ? s.a : s[graph]; }
  function graphPath(end) {
    const { X, Y } = chartScale;
    const n = graph === 'x' ? Math.max(1, Math.ceil(80 * end / params.T)) : 1;
    return Array.from({ length: n + 1 }, (_, i) => {
      const at = end * i / n;
      return `${i ? 'L' : 'M'}${X(at).toFixed(2)},${Y(graphValue(at)).toFixed(2)}`;
    }).join(' ');
  }

  function buildChartBackground() {
    const { X, Y, low, high, tick, bottom } = chartScale;
    const unit = graph === 'v' ? 'v / (m·s⁻¹)' : graph === 'x' ? 'x / m' : 'a / (m·s⁻²)';
    let out = text(19, 23, unit, '#c4d5e3', 'font-weight="600"');
    for (let value = low; value <= high + tick * .001; value += tick) {
      out += line(70, Y(value), 855, Y(value), Math.abs(value) < 1e-8 ? '#758b9d' : colors.grid, Math.abs(value) < 1e-8 ? 'stroke-width="1.3"' : 'stroke-dasharray="3 5"');
      out += text(57, Y(value) + 4, f(value, Math.max(0, -Math.floor(Math.log10(tick)))), colors.muted, 'text-anchor="end" font-size="11"');
    }
    for (let i = 0; i <= 5; i++) {
      const at = params.T * i / 5;
      out += line(X(at), 38, X(at), bottom, colors.grid, 'stroke-dasharray="3 5"');
      out += text(X(at), bottom + 22, f(at, Number.isInteger(at) ? 0 : 1), colors.muted, 'text-anchor="middle" font-size="11"');
    }
    out += line(70, 33, 70, bottom + 4, '#758b9d');
    out += text(865, bottom + 43, 't / s', '#bacad7', 'text-anchor="end"');
    out += text(854, 23, '纵轴自动缩放 · 虚线：完整运动趋势', '#7e94a6', 'text-anchor="end" font-size="10"');
    out += `<path d="${graphPath(params.T)}" fill="none" stroke="${graph === 'a' ? colors.amber : colors.mint}" stroke-width="2" stroke-opacity=".35" stroke-dasharray="6 5"/>`;
    if (graph === 'v') {
      out += circle(X(0), Y(params.v0), 4, '#102033', `stroke="${colors.mint}" stroke-width="2"`);
      out += text(X(0) + 10, Y(params.v0) + (params.v0 === chartScale.high ? 17 : -9), `v₀ = ${f(params.v0, 1)}`, '#c6e5da', 'font-size="11"');
    }
    return out;
  }

  function drawTrack(s) {
    const cx = trackX(s.x);
    let out = `<defs><marker id="arrow-v" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto-start-reverse"><path d="M0 0 L6 3 L0 6Z" fill="${colors.mint}"/></marker><marker id="arrow-a" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto-start-reverse"><path d="M0 0 L6 3 L0 6Z" fill="${colors.amber}"/></marker></defs>`;
    out += `<rect x="44" y="116" width="812" height="7" rx="3" fill="#334454"/>`;
    out += line(trackX(0), 78, trackX(0), 151, '#466578', 'stroke-dasharray="3 5"');
    const tick = niceStep(trackBounds.max - trackBounds.min, 7);
    for (let x = Math.ceil(trackBounds.min / tick) * tick; x <= trackBounds.max + tick * .001; x += tick) {
      const px = trackX(x);
      out += line(px, 122, px, 130, '#6c8293');
      out += text(px, 148, f(x, tick < 1 ? 1 : 0), '#a1b5c5', 'text-anchor="middle" font-size="11"');
    }
    out += text(857, 148, 'x / m', '#a1b5c5', 'text-anchor="end" font-size="11"');
    if ($('show-trail').checked) {
      for (let at = 0; at <= Math.floor(t + 1e-8); at++) {
        const px = trackX(P.stateAt(params.v0, params.a, at).x);
        out += circle(px, 110, 3.5, colors.mint, 'opacity=".6"');
      }
    }
    // The cart itself is symmetric: direction is carried by the velocity arrow.
    out += `<g transform="translate(${cx.toFixed(2)},0)"><ellipse cx="0" cy="117" rx="33" ry="3" fill="#050c14" opacity=".65"/><path d="M-23 86 L-15 74 H13 L23 86Z" fill="#61ae97"/><path d="M-13 77 H-2 V85 H-19Z M2 77 H11 L18 85 H2Z" fill="#173e3b"/><rect x="-30" y="86" width="60" height="22" rx="7" fill="#73e3bd"/><rect x="-26" y="89" width="7" height="4" rx="1" fill="#bfffe7"/><rect x="20" y="89" width="6" height="4" rx="1" fill="#bfffe7"/><circle cx="-18" cy="109" r="9" fill="#0b1620" stroke="#829caa" stroke-width="2"/><circle cx="18" cy="109" r="9" fill="#0b1620" stroke="#829caa" stroke-width="2"/><circle cx="-18" cy="109" r="3" fill="#acc0ce"/><circle cx="18" cy="109" r="3" fill="#acc0ce"/></g>`;
    const vector = (value, y, color, marker, label) => {
      if (Math.abs(value) < 1e-8) return text(cx, y + 3, `${label} = 0`, color, 'text-anchor="middle" font-size="11"');
      const end = cx + Math.sign(value) * 52;
      return line(cx, y, end, y, color, `stroke-width="2.5" marker-end="url(#${marker})"`) + text(cx + Math.sign(value) * 25, y - 8, label, color, 'text-anchor="middle" font-style="italic" font-size="12"');
    };
    out += vector(s.v, 28, colors.mint, 'arrow-v', 'v');
    out += vector(s.a, 54, colors.amber, 'arrow-a', 'a');
    $('track').innerHTML = out;
    $('track').setAttribute('aria-label', `时间 ${f(t)} 秒，小车位移 ${f(s.x)} 米，速度 ${f(s.v)} 米每秒，加速度 ${f(s.a)} 米每二次方秒`);
  }

  function drawChart(s) {
    const { X, Y, bottom } = chartScale;
    let area = '';
    if (graph === 'v' && $('show-area').checked && t > 0) {
      const turning = P.turningTime(params.v0, params.a, t);
      const points = turning !== null && turning < t ? [0, turning, t] : [0, t];
      for (let i = 0; i < points.length - 1; i++) {
        const start = points[i], end = points[i + 1];
        const positive = graphValue((start + end) / 2) >= 0;
        area += `<path d="M${X(start)},${Y(0)} L${X(start)},${Y(graphValue(start))} L${X(end)},${Y(graphValue(end))} L${X(end)},${Y(0)}Z" fill="${positive ? colors.mint : colors.red}" opacity=".17"/>`;
      }
    }
    const value = graph === 'a' ? s.a : s[graph];
    const tone = graph === 'a' ? colors.amber : colors.mint;
    let overlay = line(X(t), 37, X(t), bottom + 2, '#abc6d5', 'stroke-opacity=".5" stroke-dasharray="4 4"');
    overlay += `<path d="${graphPath(t)}" fill="none" stroke="${tone}" stroke-width="3" stroke-linecap="round"/>`;
    overlay += circle(X(t), Y(value), 8, tone, 'opacity=".16"') + circle(X(t), Y(value), 4.5, tone, 'stroke="#d8fff0" stroke-width="1.5"');
    // A separate label stays inside the plot even at either end of the timeline.
    const lx = clamp(X(t), 136, 777), ly = Y(value) < 80 ? Y(value) + 26 : Y(value) - 17;
    overlay += `<rect x="${lx - 67}" y="${ly - 15}" width="134" height="23" rx="5" fill="#203b3d" stroke="#456864"/>`;
    overlay += text(lx, ly, `t=${f(t, 1)}  ${graph}=${f(value, 1)}`, '#d5f4e8', 'text-anchor="middle" font-size="11"');
    $('chart').innerHTML = chartBackground + area + overlay;
    $('chart').setAttribute('aria-label', `${graph === 'v' ? '速度' : graph === 'x' ? '位移' : '加速度'}时间图像：时间 ${f(t)} 秒，当前值 ${f(value)}`);
    if (graph === 'v') $('graph-explanation').textContent = `斜率 a = ${f(params.a, 1)} m/s² · 带符号面积 = ${f(s.x)} m（绿正 / 红负）`;
    else if (graph === 'x') $('graph-explanation').textContent = '曲线在当前时刻的切线斜率 = 速度 v；位移可以增大，也可以减小。';
    else $('graph-explanation').textContent = `加速度始终为 ${f(params.a, 1)} m/s²；面积 at = ${f(params.a * t)} m/s，即速度变化量。`;
  }

  function updateInsight(s) {
    const classification = P.classify(Math.abs(s.v) < 1e-8 ? 0 : s.v, s.a);
    $('motion-state').textContent = classification;
    $('motion-state').style.color = classification.includes('减速') ? colors.amber : colors.mint;
    $('insight-title').textContent = params.a === 0 ? '速度保持不变' : `速度每秒${params.a > 0 ? '增加' : '减少'} ${f(Math.abs(params.a), 1)} m/s`;
    let message;
    if (Math.abs(s.v) < 1e-8 && Math.abs(s.a) < 1e-8) message = '速度和加速度都为零，小车保持静止。v–t 图线与时间轴重合，位移和路程都不变。';
    else if (Math.abs(s.v) < 1e-8) message = '此刻速度为零，但加速度不为零，小车不会一直停住；继续播放，观察随后运动的方向。';
    else if (s.a === 0) message = '加速度为零，每秒的位移相同，等时位置点间距相等。v–t 图像是一条水平直线。';
    else if (s.v * s.a > 0) message = s.v < 0 ? '速度与加速度均为负，小车向左越跑越快。虽然速度数值减小，但速率 |v| 增大。' : '速度与加速度同向，小车越来越快，等时位置点的间距逐渐增大。';
    else message = '速度与加速度反向，小车正在减速。速度变为零后，若加速度不变，小车会反向加速。';
    $('insight-text').textContent = message;
    const turn = P.turningTime(params.v0, params.a, params.T);
    $('jump-turn').hidden = turn === null;
    if (turn !== null) $('jump-turn').textContent = `定位到 v = 0：t = ${f(turn)} s`;
    $('velocity-equation').textContent = `${f(params.v0)} + ${signedTerm(params.a)} × ${f(t)} = ${f(s.v)} m/s`;
    $('position-equation').textContent = `${signedTerm(params.v0)} × ${f(t)} + ½ × ${signedTerm(params.a)} × ${f(t)}² = ${f(s.x)} m`;
  }

  function render() {
    const s = P.stateAt(params.v0, params.a, t);
    $('time-value').textContent = f(t);
    $('velocity-value').textContent = f(s.v);
    $('position-value').textContent = f(s.x);
    $('distance-value').textContent = f(s.distance);
    $('time').value = t;
    $('time').setAttribute('aria-valuetext', `${f(t)} 秒`);
    $('play').textContent = playing ? 'Ⅱ 暂停演示' : t >= params.T ? '↻ 重新演示' : t > 0 ? '▶ 继续演示' : '▶ 开始演示';
    $('graph-status').textContent = playing ? '● 演示中' : t >= params.T ? '演示完成' : t > 0 ? '已暂停' : '等待开始';
    $('step').disabled = t >= params.T;
    drawTrack(s);
    drawChart(s);
    updateInsight(s);
  }

  function pause() {
    playing = false;
    lastFrame = null;
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
  }

  function frame(timestamp) {
    if (!playing) return;
    if (lastFrame !== null) t = Math.min(params.T, t + Math.max(0, timestamp - lastFrame) / 1000 * Number($('speed').value));
    lastFrame = timestamp;
    if (t >= params.T) pause();
    render();
    if (playing) frameId = requestAnimationFrame(frame);
  }

  function togglePlay() {
    if (playing) pause();
    else {
      if (t >= params.T) t = 0;
      playing = true;
      lastFrame = null;
      frameId = requestAnimationFrame(frame);
    }
    render();
  }

  function syncParameters() {
    [['acceleration', params.a], ['velocity', params.v0], ['duration', params.T]].forEach(([id, value]) => {
      $(id).value = value;
      $(`${id}-number`).value = value;
    });
    $('time').max = params.T;
    $('duration-end').textContent = `${params.T} s`;
  }

  function resetParameters() {
    pause();
    t = 0;
    syncParameters();
    updateScales();
    render();
  }

  function setGraph(next, focus = false) {
    graph = next;
    document.querySelectorAll('[data-graph]').forEach(button => {
      const selected = button.dataset.graph === graph;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      if (selected && focus) button.focus();
    });
    $('graph-content').setAttribute('aria-labelledby', `tab-${graph}`);
    $('area-control').hidden = graph !== 'v';
    updateScales();
    render();
  }

  document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => {
    params = { ...presets[button.dataset.preset] };
    document.querySelectorAll('[data-preset]').forEach(b => {
      b.classList.toggle('active', b === button);
      b.setAttribute('aria-pressed', String(b === button));
    });
    $('parameter-note').textContent = '已载入课堂预设，点击“开始演示”观察运动。';
    resetParameters();
  }));

  [['acceleration', 'a'], ['velocity', 'v0'], ['duration', 'T']].forEach(([id, key]) => {
    const range = $(id), number = $(`${id}-number`);
    const change = source => {
      const raw = source.valueAsNumber;
      if (!Number.isFinite(raw)) {
        syncParameters();
        $('parameter-note').textContent = '请输入有效数字；已保留上次参数。';
        return;
      }
      const min = Number(range.min), max = Number(range.max), step = Number(range.step);
      const value = Number((min + Math.round((clamp(raw, min, max) - min) / step) * step).toFixed(5));
      params[key] = clamp(value, min, max);
      document.querySelectorAll('[data-preset]').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      $('parameter-note').textContent = raw === params[key] ? '参数已更新，已回到 t = 0；本次加速度保持恒定。' : `已按范围 ${min}～${max} 和步长 ${step} 调整输入，回到 t = 0。`;
      resetParameters();
    };
    range.addEventListener('input', () => change(range));
    number.addEventListener('change', () => change(number));
    number.addEventListener('keydown', event => { if (event.key === 'Enter') number.blur(); });
  });
  document.querySelectorAll('[data-graph]').forEach(button => {
    button.addEventListener('click', () => setGraph(button.dataset.graph));
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const graphs = ['v', 'x', 'a'];
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (graphs.indexOf(graph) + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
      setGraph(graphs[index], true);
    });
  });
  $('play').addEventListener('click', togglePlay);
  $('reset').addEventListener('click', () => { pause(); t = 0; render(); });
  $('step').addEventListener('click', () => { pause(); t = Math.min(params.T, Math.round((t + .5) * 100) / 100); render(); });
  $('time').addEventListener('input', () => { pause(); t = clamp(Number($('time').value), 0, params.T); render(); });
  $('speed').addEventListener('change', () => { lastFrame = null; });
  $('show-trail').addEventListener('change', render);
  $('show-area').addEventListener('change', render);
  $('jump-turn').addEventListener('click', () => {
    const turn = P.turningTime(params.v0, params.a, params.T);
    if (turn !== null) { pause(); t = turn; render(); }
  });
  document.addEventListener('keydown', event => {
    if (event.code === 'Space' && !event.repeat && !event.ctrlKey && !event.altKey && !event.metaKey && !['INPUT', 'SELECT', 'BUTTON', 'A', 'TEXTAREA'].includes(event.target.tagName) && !event.target.isContentEditable) {
      event.preventDefault(); togglePlay();
    }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) { pause(); render(); } });
  $('fullscreen').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { $('parameter-note').textContent = '浏览器未允许全屏，可按 F11 或使用浏览器菜单进入全屏。'; }
  });
  document.addEventListener('fullscreenchange', () => {
    $('fullscreen').textContent = document.fullscreenElement ? '⛶ 退出全屏' : '⛶ 全屏演示';
    updateScales(); render();
  });
  window.addEventListener('resize', () => { updateScales(); render(); });
  $('export').addEventListener('click', () => {
    const rows = [['时间 t (s)', '速度 v (m/s)', '位移 x (m)', '路程 l (m)', '加速度 a (m/s²)', '初速度 v0 (m/s)']];
    P.sampleMotion(params.v0, params.a, params.T, .5).forEach(s => rows.push([s.t, s.v, s.x, s.distance, s.a, params.v0].map(n => f(n, 4))));
    const blob = new Blob(['\uFEFF' + rows.map(row => row.join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `匀变速实验_v0=${params.v0}_a=${params.a}_T=${params.T}.csv`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('parameter-note').textContent = '已导出本组参数的完整实验数据，每 0.5 s 取样一次。';
  });
  syncParameters();
  updateScales();
  render();
})();

