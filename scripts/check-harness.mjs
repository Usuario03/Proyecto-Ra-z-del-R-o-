import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => readFileSync(path.join(root, file), 'utf8');
const config = JSON.parse(read('opencode.jsonc')); // Este archivo usa el subconjunto JSON de JSONC.
const agents = ['coordinator', 'planner', 'implementer', 'reviewer'];
const commands = ['constitution', 'spec', 'clarify', 'plan', 'tasks', 'implement', 'validate', 'change', 'status'];
const skills = ['sdd', 'backend-api', 'postgres-migrations', 'domain-rules'];
const lines = file => read(file).trimEnd().split(/\r?\n/).length;
assert(lines('AGENTS.md') <= 40, 'AGENTS.md excede 40 líneas');
assert(lines('MEMORY.md') <= 50, 'MEMORY.md excede 50 líneas');
assert.equal(config.model, 'openai/gpt-6-astra');
assert.equal(config.default_agent, 'build');
assert.equal(config.compaction.auto, true);
assert(config.tool_output.max_lines <= 300);
for (const server of Object.values(config.mcp.servers)) assert.equal(server.disabled, true, 'MCP activo: revisar costo/contexto');
for (const rule of config.permissions) {
  assert(['allow', 'ask', 'deny'].includes(rule.effect));
  assert.equal(typeof rule.action, 'string');
  assert.equal(typeof rule.resource, 'string');
}
for (const name of agents) {
  const text = read(`.opencode/agents/${name}.md`);
  assert(text.startsWith('---\n') || text.startsWith('---\r\n'));
  assert(text.includes(`mode: ${name === 'coordinator' ? 'primary' : 'subagent'}`));
  assert(text.includes('model: openai/gpt-6-astra#medium'));
  assert.match(text, /steps: [1-9]\d*/);
  if (name !== 'coordinator') assert.match(text, /action: subagent\r?\n\s+resource: "\*"\r?\n\s+effect: deny/);
}
for (const name of commands) {
  const text = read(`.opencode/commands/sdd-${name}.md`);
  const agent = text.match(/^agent: (\S+)$/m)?.[1];
  assert(agents.includes(agent), `Agente inexistente en comando ${name}`);
  assert(!text.includes('!`'), `Shell interpolado en ${name}`);
  assert(!text.includes('@MEMORY.md'), `Adjunto implícito no soportado en ${name}`);
}
for (const id of skills) assert.match(read(`.opencode/skills/${id}/SKILL.md`), /^description: .+/m);
for (const file of ['spec', 'plan', 'tasks', 'validation']) {
  assert(existsSync(path.join(root, `.opencode/skills/sdd/templates/${file}.md`)));
  assert(existsSync(path.join(root, `specs/001-harness/${file}.md`)));
}
// Enlaces Markdown locales: descubrir archivos nuevos también, sin recorrer dependencias ni artefactos.
function markdownFiles(dir) {
  return readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => {
    const relative = path.posix.join(dir, entry.name);
    return entry.isDirectory() ? markdownFiles(relative) : entry.name.endsWith('.md') ? [relative] : [];
  });
}
for (const file of ['AGENTS.md', 'MEMORY.md', 'README.md', ...markdownFiles('docs'), ...markdownFiles('specs'), ...markdownFiles('.opencode')]) {
  for (const match of read(file).matchAll(/\[[^\]]*\]\(([^\s)]+)\)/g)) {
    const target = match[1].split('#')[0];
    if (!target || /^[a-z]+:/i.test(target)) continue;
    assert(existsSync(path.resolve(root, path.dirname(file), target)), `${file}: enlace roto ${target}`);
  }
}
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
assert.deepEqual(pkg.engines, lock.packages[''].engines);
assert.match(read('.nvmrc').trim(), /^24\.\d+\.\d+$/);
console.log('Harness OK: 4 agentes, 9 comandos, 4 skills, plantillas, enlaces y límites de contexto.');
console.log('Validación estructural local; no ejecuta modelos, MCP, ni demuestra aplicación runtime de permisos.');
