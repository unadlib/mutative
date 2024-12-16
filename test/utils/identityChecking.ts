import {
  getAllChildIntermediateAndLeafNodePaths, getDeepValueByPath,
} from '../generic-utils/recordUtil';
import {format as prettyFormat} from 'pretty-format';

/**
 * returns a function that asserts that the value did not change in any way (deep equality and identity checks)
 * @param value
 */
export function makeAssertDidNotChange(value: any) {
  const strRepr = prettyFormat(value);
  const allPaths = getAllChildIntermediateAndLeafNodePaths(value);
  const valuePerPath = allPaths.map((path) => {
    return getDeepValueByPath(value, path);
  });

  return function assertDidNotChange() {
    // console.debug('checking that the value did not change, strRepr:', strRepr);
    expect(prettyFormat(value)).toStrictEqual(strRepr);
    const newAllPaths = getAllChildIntermediateAndLeafNodePaths(value);
    expect(newAllPaths).toStrictEqual(allPaths);
    allPaths.forEach((path, index) => {
      expect(getDeepValueByPath(value, path)).toBe(valuePerPath[index]);
    });
  }
}
