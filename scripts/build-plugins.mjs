import { resolve } from 'node:path';
import ts from 'typescript';
import { minify } from 'terser';

// Program-level compilation preserves cross-module const-enum inlining.
function compileTypescript(watch) {
  const configPath = resolve('tsconfig.json');
  const files = new Set([configPath]);
  watch(configPath);
  const readFile = (file) => {
    files.add(resolve(file));
    watch(resolve(file));
    return ts.sys.readFile(file);
  };
  const config = ts.readConfigFile(configPath, readFile);
  if (config.error)
    throw new Error(
      ts.flattenDiagnosticMessageText(config.error.messageText, '\n')
    );
  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    { ...ts.sys, readFile },
    process.cwd(),
    {
      noEmit: false,
      declaration: false,
      sourceMap: true,
    }
  );
  const program = ts.createProgram(parsed.fileNames, parsed.options);
  for (const file of parsed.fileNames) files.add(resolve(file));
  for (const source of program.getSourceFiles()) {
    if (
      !program.isSourceFileDefaultLibrary(source) &&
      !program.isSourceFileFromExternalLibrary(source)
    ) {
      files.add(resolve(source.fileName));
    }
  }
  for (const file of files) watch(file);
  const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)];
  if (diagnostics.length) {
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCanonicalFileName: (file) => file,
        getCurrentDirectory: ts.sys.getCurrentDirectory,
        getNewLine: () => '\n',
      })
    );
  }
  const modules = new Map();
  program.emit(undefined, (file, text, _bom, _error, sources) => {
    const source = sources?.[0];
    if (!source) return;
    const id = resolve(source.fileName);
    const output = modules.get(id) ?? {};
    if (file.endsWith('.js.map')) {
      output.map = { ...JSON.parse(text), sources: [id], sourceRoot: '' };
    } else if (file.endsWith('.js')) {
      output.code = text.replace(/\/\/# sourceMappingURL=.*$/m, '');
    }
    modules.set(id, output);
  });
  return { modules, files };
}

// Variants share completed compilations, but each keeps its own build snapshot.
// One watcher's invalidation must not clear another watcher's active load data.
export function typescript() {
  let cached;
  let generation = 0;
  return () => {
    let compilation;
    return {
      name: 'mutative:typescript',
      watchChange() {
        generation += 1;
      },
      buildStart() {
        if (!cached || cached.generation !== generation) {
          cached = {
            ...compileTypescript((file) => this.addWatchFile(file)),
            generation,
          };
        }
        compilation = cached;
        for (const file of compilation.files) this.addWatchFile(file);
      },
      load(id) {
        const output = compilation.modules.get(id);
        if (!output) return;
        // TypeScript can erase imports after inlining const enum values.
        for (const file of compilation.files) this.addWatchFile(file);
        return output;
      },
    };
  };
}

export function terser() {
  return {
    name: 'mutative:terser',
    async renderChunk(code, _chunk, options) {
      const result = await minify(code, {
        module: options.format === 'es',
        toplevel: options.format === 'cjs',
        compress: { passes: 3 },
        sourceMap: { asObject: true },
      });
      return { code: result.code, map: result.map };
    },
  };
}
