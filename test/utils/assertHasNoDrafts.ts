import { deepIterateObjectNodes } from '../generic-utils/recordUtil';
import { isDraft } from '../../src';

export function assertHasNoDrafts(obj: any) {
  for (const [path, value] of deepIterateObjectNodes(obj)) {
    let isDraftResult: boolean;
    try {
      isDraftResult = isDraft(value);
    } catch (e) {
      if (
        e instanceof Error &&
        e.message.endsWith('on a proxy that has been revoked')
      ) {
        // throw new Error(`Draft found at path ${path.join('.')}, but the proxy has been revoked`, {
        //   cause: e,
        // });
        // TODO separate tsconfig for tests to upgrade tsconfig target?
        throw new Error(
          `Draft found at path ${path.join(
            '.'
          )}, but the proxy has been revoked`
        );
      }
      throw e;
    }
    if (isDraftResult) {
      throw new Error(`Draft found at path ${path.join('.')}`);
    }
  }
}
