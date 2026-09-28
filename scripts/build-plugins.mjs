import { resolve } from 'node:path';
import ts from 'typescript';
import { minify } from 'terser';

// Compile once for all six bundles. Program-level compilation preserves const
// enum inlining and the TypeScript lowering used before the bundler migration.
export function typescript() {
  const configPath = resolve('tsconfig.json');
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  if (config.error)
    throw new Error(
      ts.flattenDiagnosticMessageText(config.error.messageText, '\n')
    );
  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    process.cwd(),
    {
      noEmit: false,
      declaration: false,
      sourceMap: true,
    }
  );
  const program = ts.createProgram(parsed.fileNames, parsed.options);
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
  return {
    name: 'mutative:typescript',
    load(id) {
      return modules.get(id);
    },
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
