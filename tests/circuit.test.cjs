const test = require('node:test');
const assert = require('node:assert/strict');
const { calculate: calc, resistanceFromLevel: r } = require('../assets/circuit-physics.js');
test('电压分配与能量守恒覆盖全部参数边界', () => {
  for (const E of [2, 6, 12]) for (const R of [1, 8, 20]) for (const h of [20, 50, 100]) {
    const s = calc(E, R, r(h));
    assert.ok(Math.abs(s.outer + s.inner - E) < 1e-12);
    assert.ok(Math.abs(E * s.I - s.I ** 2 * (R + r(h))) < 1e-12);
  }
  assert.deepEqual(calc(6, 8, 4), { E: 6, R: 8, r: 4, I: .5, outer: 4, inner: 2, closed: true });
});
test('两组控制变量与液面关系', () => {
  assert.ok(r(20) > r(100));
  assert.ok(calc(6, 20, 4).outer > calc(6, 1, 4).outer);
  assert.ok(calc(6, 20, 4).inner < calc(6, 1, 4).inner);
  assert.ok(calc(6, 8, 10).inner > calc(6, 8, 2).inner);
  assert.ok(calc(6, 8, 10).outer < calc(6, 8, 2).outer);
});
test('断路边界及非法参数', () => {
  const s = calc(6, 8, 4, false); assert.equal(s.I, 0); assert.equal(s.inner, 0); assert.equal(s.outer, 6);
  assert.throws(() => calc(6, 0, 4), RangeError);
});
