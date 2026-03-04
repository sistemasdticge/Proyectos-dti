import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const HELP = `
Uso:
  npm run g:shared-ui -- --categoria=<categoria> --tipo=<tipo> [--nombre=<nombre>] [--dry-run]

Ejemplos:
  npm run g:shared-ui -- --categoria=buttons --tipo=eliminar --nombre=eliminar
  npm run g:shared-ui -- --categoria=inputs --tipo=fecha --nombre=fecha

Reglas:
  - categoria: carpeta principal (buttons, inputs, tables, etc.)
  - tipo: subcarpeta funcional (eliminar, aceptar, fecha, etc.)
  - nombre: nombre del componente. Si no se envía, se usa el valor de --tipo
`;

function parseArgs(argv) {
  const parsed = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const [key, value] = arg.slice(2).split('=');
    if (!key) continue;
    parsed[key] = value ?? 'true';
  }
  return parsed;
}

function isValidName(value) {
  return /^[a-z0-9-]+$/.test(value);
}

const args = parseArgs(process.argv.slice(2));
if (args.help || args.h) {
  console.log(HELP);
  process.exit(0);
}

const category = args.categoria;
const type = args.tipo;
const name = args.nombre || type;
const dryRun = args['dry-run'] === 'true';

if (!category || !type || !name) {
  console.error('Error: faltan argumentos obligatorios.');
  console.error(HELP);
  process.exit(1);
}

for (const [label, value] of [
  ['categoria', category],
  ['tipo', type],
  ['nombre', name],
]) {
  if (!isValidName(value)) {
    console.error(`Error: ${label}="${value}" no es válido. Usa solo minúsculas, números y guiones.`);
    process.exit(1);
  }
}

const workspaceRoot = process.cwd();
const categoryDir = resolve(workspaceRoot, `libs/shared-ui/src/lib/components/${category}`);
if (!existsSync(categoryDir)) {
  mkdirSync(categoryDir, { recursive: true });
  console.log(`Carpeta creada: libs/shared-ui/src/lib/components/${category}`);
}

const componentPath = `libs/shared-ui/src/lib/components/${category}/${type}/${name}`;
const nxCommand = [
  'nx',
  'g',
  '@nx/angular:component',
  componentPath,
  '--export',
  '--no-interactive',
];

if (dryRun) {
  nxCommand.push('--dry-run');
}

const npxExecutable = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const generation = spawnSync(npxExecutable, nxCommand, {
  cwd: workspaceRoot,
  stdio: 'inherit',
  shell: false,
});

if (generation.status !== 0) {
  process.exit(generation.status ?? 1);
}

if (!dryRun) {
  const indexPath = resolve(workspaceRoot, 'libs/shared-ui/src/index.ts');
  const exportLine = `export * from './lib/components/${category}/${type}/${name}';`;

  const indexContent = readFileSync(indexPath, 'utf8');
  if (!indexContent.includes(exportLine)) {
    const nextContent = `${indexContent.trim()}\n\n${exportLine}\n`;
    writeFileSync(indexPath, nextContent, 'utf8');
    console.log(`Export agregado manualmente en index.ts: ${exportLine}`);
  }
}

console.log('✅ Componente generado correctamente.');
console.log(`Ruta: ${componentPath}`);
