import { create, safeReturn } from '../src';

test('base', () => {
  const base = 3;
  expect(create(base, () => 4)).toBe(4);
  // @ts-expect-error
  expect(create(base, () => null)).toBe(null);
  expect(create(base, () => undefined)).toBe(3);
  expect(create(base, () => {})).toBe(3);
  expect(create(base, () => safeReturn(undefined))).toBe(undefined);

  expect(create({}, () => undefined)).toEqual({});
  expect(create({}, () => safeReturn(undefined))).toBe(undefined);
  expect(create(3, () => safeReturn(undefined))).toBe(undefined);

  expect(create(() => undefined)({})).toEqual({});
  expect(create(() => safeReturn(undefined))({})).toBe(undefined);
  expect(create(() => safeReturn(undefined))(3)).toBe(undefined);
});
