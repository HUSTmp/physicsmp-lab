const { test } = require('node:test');
const assert = require('node:assert/strict');
const { events, stateAt } = require('../assets/pursuit-physics.js');
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
test('original problem: start, maximum separation, catch and overtake', () => {
  assert.deepEqual(events(3, 6), { equal: 2, catch: 4, maxGap: 6, duration: 5 });
  assert.equal(stateAt(3, 6, 0).distance, 0);
  const max = stateAt(3, 6, 2);
  assert.equal(max.carV, 6); assert.equal(max.bikeX, 12); assert.equal(max.carX, 6); assert.equal(max.distance, 6);
  const caught = stateAt(3, 6, 4);
  assert.equal(caught.distance, 0); assert.equal(caught.carV, 12); assert.equal(caught.carX, 24);
  assert.equal(caught.lost, caught.recovered);
  assert.equal(stateAt(3, 6, 5).gap, -7.5); assert.equal(stateAt(3, 6, 5).distance, 7.5);
});
test('parameter range preserves extrema, catch, area interpretation and derivative', () => {
  for (let a = 1; a <= 6; a += .5) for (let u = 2; u <= 12; u += .5) {
    const e = events(a, u), max = stateAt(a, u, e.equal), caught = stateAt(a, u, e.catch);
    close(max.carV, max.bikeV); close(max.distance, e.maxGap); close(caught.distance, 0); close(caught.carV, 2 * u);
    assert.ok(stateAt(a, u, e.equal - .001).gap < max.gap);
    assert.ok(stateAt(a, u, e.equal + .001).gap < max.gap);
    for (const t of [0, e.equal / 2, e.equal, e.catch, e.duration]) {
      const s = stateAt(a, u, t); close(s.lost - s.recovered, s.gap);
      if (t > 0) close((stateAt(a, u, t + .0001).gap - stateAt(a, u, t - .0001).gap) / .0002, s.bikeV - s.carV);
    }
  }
});
test('invalid physical inputs are rejected', () => {
  for (const value of [0, -1, NaN, Infinity]) { assert.throws(() => events(value, 6), RangeError); assert.throws(() => events(3, value), RangeError); }
  assert.throws(() => stateAt(3, 6, -1), RangeError);
});
