import { Draft, Immutable } from '../interface';

/**
 * Cast a value to an Draft type value.
 */
export function castDraft<T>(value: T): Draft<T> {
  return value as any;
}

/**
 * Cast a value to an Immutable type value.
 */
export function castImmutable<T>(value: T): Immutable<T> {
  return value as any;
}

/**
 * Cast a value to an Mutable type value.
 */
export function castMutable<T>(draft: Draft<T>): T {
  return draft as any;
}
