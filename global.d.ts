
export {} // "This does not work without at least one export (or import) keyword. This turns this file into an ES module, which is necessary for this to work. You can export any of the statements or add an empty export {}."

declare global {
  /**
   * Allow __DEV__ to be used in the code, which is replaced via rollup-plugin-replace in the build process.
   * WARNING: if directly executing scripts like the benchmarks via tsx or ts-node, this global variable needs to be set at the start.
   * See https://stackoverflow.com/questions/59459312/using-globalthis-in-typescript.
   */
  // eslint-disable-next-line no-var
  // noinspection ES6ConvertVarToLetConst
  var __DEV__: boolean;
}
