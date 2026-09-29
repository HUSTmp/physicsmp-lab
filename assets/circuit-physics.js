(function (root) {
  'use strict';
  function calculate(E, R, r, closed = true) {
    if (![E, R, r].every(Number.isFinite) || E <= 0 || R <= 0 || r <= 0) throw new RangeError('参数必须为正数');
    const I = closed ? E / (R + r) : 0;
    return { E, R, r, I, inner: I * r, outer: closed ? I * R : E, closed };
  }
  // Constant electrode spacing and resistivity: r ∝ 1 / immersed area ∝ 1 / height.
  function resistanceFromLevel(level) { return 200 / level; }
  const api = { calculate, resistanceFromLevel };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CircuitPhysics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
