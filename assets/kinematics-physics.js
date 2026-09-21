(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KinematicsPhysics = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function finite(value, name) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new RangeError(name + ' must be a finite number');
    }
    return value;
  }

  function nonnegative(value, name) {
    finite(value, name);
    if (value < 0) throw new RangeError(name + ' must be nonnegative');
    return value;
  }

  function validateMotion(v0, a, time) {
    finite(v0, 'v0');
    finite(a, 'a');
    nonnegative(time, 'time');
  }

  function normalizeZero(value) {
    return value === 0 ? 0 : value;
  }

  function turningTime(v0, a, T) {
    validateMotion(v0, a, T);
    if (a === 0) return null;
    var time = -v0 / a;
    return time > 0 && time <= T ? time : null;
  }

  function stateAt(v0, a, t) {
    validateMotion(v0, a, t);
    var x = v0 * t + 0.5 * a * t * t;
    var v = v0 + a * t;
    var turn = turningTime(v0, a, t);
    var distance = Math.abs(x);
    if (turn !== null) {
      var turningPosition = v0 * turn + 0.5 * a * turn * turn;
      // Split the trajectory where velocity changes sign: distance is
      // the sum of both travelled lengths, while x remains signed.
      distance = Math.abs(turningPosition) + Math.abs(x - turningPosition);
    }
    return {
      t: normalizeZero(t),
      x: normalizeZero(x),
      v: normalizeZero(v),
      a: normalizeZero(a),
      distance: normalizeZero(distance)
    };
  }

  function positionBounds(v0, a, T) {
    validateMotion(v0, a, T);
    var end = stateAt(v0, a, T).x;
    var min = Math.min(0, end);
    var max = Math.max(0, end);
    var turn = turningTime(v0, a, T);
    if (turn !== null) {
      var vertex = stateAt(v0, a, turn).x;
      min = Math.min(min, vertex);
      max = Math.max(max, vertex);
    }
    return { min: normalizeZero(min), max: normalizeZero(max) };
  }

  function classify(v, a) {
    finite(v, 'v');
    finite(a, 'a');
    if (a === 0) return v === 0 ? '静止' : '匀速直线运动';
    if (v === 0) return '瞬时速度为零';
    // Same directions increase speed; opposite directions decrease speed.
    return (v > 0) === (a > 0) ? '匀加速直线运动' : '匀减速直线运动';
  }

  function sampleMotion(v0, a, T, step) {
    if (step === undefined) step = 0.5;
    validateMotion(v0, a, T);
    finite(step, 'step');
    if (step <= 0) throw new RangeError('step must be positive');
    var count = Math.ceil(T / step);
    if (count >= 4294967295) {
      throw new RangeError('The sample count exceeds the maximum array length');
    }
    var samples = [stateAt(v0, a, 0)];
    // Multiply each index by step to avoid accumulating clock drift.
    for (var i = 1; i < count; i += 1) {
      var time = i * step;
      if (time >= T) break;
      samples.push(stateAt(v0, a, time));
    }
    if (T > 0) samples.push(stateAt(v0, a, T));
    return samples;
  }

  function formatNumber(value, digits) {
    if (digits === undefined) digits = 2;
    finite(value, 'value');
    finite(digits, 'digits');
    if (!Number.isInteger(digits) || digits < 0 || digits > 100) {
      throw new RangeError('digits must be an integer from 0 to 100');
    }
    var formatted = value.toFixed(digits);
    // toFixed switches to exponential notation at 1e21. Expand that case
    // so this helper still guarantees the requested decimal places.
    if (/e/i.test(formatted)) {
      var parts = formatted.split(/e/i);
      var mantissa = parts[0];
      var fractionLength = (mantissa.split('.')[1] || '').length;
      formatted = mantissa.replace('.', '') + '0'.repeat(Number(parts[1]) - fractionLength);
      if (digits > 0) formatted += '.' + '0'.repeat(digits);
    }
    return Number(formatted) === 0 ? formatted.replace(/^-/, '') : formatted;
  }

  return Object.freeze({
    stateAt: stateAt,
    turningTime: turningTime,
    positionBounds: positionBounds,
    classify: classify,
    sampleMotion: sampleMotion,
    formatNumber: formatNumber
  });
}));

