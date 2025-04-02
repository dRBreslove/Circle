import example from './example.js';

describe('add function', () => {
  test('adds two numbers correctly', () => {
    expect(example(1, 2)).toBe(3);
    expect(example(-1, 1)).toBe(0);
    expect(example(0, 0)).toBe(0);
  });
});
