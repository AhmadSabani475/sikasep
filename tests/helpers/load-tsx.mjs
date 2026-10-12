// Transpilasi komponen .tsx asli dengan `typescript` (devDependency) dan arahkan
// impor 'react' / 'react/jsx-runtime' ke React palsu, lalu impor modulnya.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const fakeReactUrl = pathToFileURL(path.join(here, 'fake-react.mjs')).href;

let counter = 0;

export async function loadTsxComponent(relPath) {
  const src = fs.readFileSync(path.join(root, relPath), 'utf8');
  const { outputText } = ts.transpileModule(src, {
    fileName: relPath,
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      verbatimModuleSyntax: false,
    },
  });

  const code = outputText.replace(/from\s+['"]react(\/jsx-runtime|\/jsx-dev-runtime)?['"]/g, `from '${fakeReactUrl}'`);
  if (/from\s+['"]@\//.test(code)) {
    throw new Error(`${relPath} mengimpor modul runtime '@/...' yang belum didukung harness`);
  }

  const out = path.join(os.tmpdir(), `sikasep-${path.basename(relPath)}-${process.pid}-${++counter}.mjs`);
  fs.writeFileSync(out, code);
  return import(pathToFileURL(out).href);
}
