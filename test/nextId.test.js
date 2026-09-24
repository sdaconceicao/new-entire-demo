const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { nextId } = require('../lib/nextId');

describe('nextId', () => {
  it('returns 1 for an empty list', () => {
    assert.equal(nextId([]), 1);
  });

  it('returns max id + 1', () => {
    assert.equal(nextId([{ id: 1 }, { id: 5 }, { id: 3 }]), 6);
  });

  it('returns 2 when only id 1 exists', () => {
    assert.equal(nextId([{ id: 1, title: 'x' }]), 2);
  });

  it('handles a single high id', () => {
    assert.equal(nextId([{ id: 42 }]), 43);
  });
});
