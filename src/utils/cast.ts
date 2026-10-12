import { Draft, Immutable } from '../interface';

/**
 * Cast a value to its draft type; it returns the value as it is.
 */
export function castDraft<T>(value: T): Draft<T> {
  return value as any;
}

/**
 * Cast a value to its immutable type, without freezing it.
 */
export function castImmutable<T>(value: T): Immutable<T> {
  return value as any;
}

/**
 * Cast a draft to the type of its base state.
 */
export function castMutable<T>(draft: Draft<T>): T {
  return draft as any;
}
