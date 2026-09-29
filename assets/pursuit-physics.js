(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PursuitPhysics = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function events(a, u) {
    if (!Number.isFinite(a) || !Number.isFinite(u) || a <= 0 || u <= 0) throw new RangeError('a and u must be positive finite numbers');
    return { equal: u / a, catch: 2 * u / a, maxGap: u * u / (2 * a), duration: 2.5 * u / a };
  }
  function stateAt(a, u, t) {
    const e = events(a, u);
    if (!Number.isFinite(t) || t < 0) throw new RangeError('t must be nonnegative and finite');
    const carX = .5 * a * t * t, bikeX = u * t;
    const rawGap = bikeX - carX;
    const gap = Math.abs(rawGap) < 1e-10 ? 0 : rawGap;
    const before = Math.min(t, e.equal);
    return { carX, bikeX, carV: a * t, bikeV: u, gap, distance: Math.abs(gap), lost: u * before - .5 * a * before * before, recovered: t > e.equal ? .5 * a * (t - e.equal) ** 2 : 0 };
  }
  return Object.freeze({ events, stateAt });
}));
