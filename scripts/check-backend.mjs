import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CDKContextKey } from '@aws-amplify/platform-core';

// Synthesize locally: no credentials, asset publishing, or AWS deployment.
const outdir = mkdtempSync(join(tmpdir(), 'who-got-who-backend-'));
try {
  const synth = spawnSync(process.execPath, [
    '--import', 'tsx', '--input-type=module', '-e',
    "await import('./amplify/backend.ts'); process.emit('message', 'amplifySynth');",
  ], {
    cwd: new URL('..', import.meta.url),
    env: {
      ...process.env,
      CDK_OUTDIR: outdir,
      CDK_DEFAULT_ACCOUNT: '123456789012',
      CDK_DEFAULT_REGION: 'eu-west-2',
      CDK_CONTEXT_JSON: process.env.CDK_CONTEXT_JSON || JSON.stringify({
        [CDKContextKey.BACKEND_NAMESPACE]: 'who-got-who-check',
        [CDKContextKey.BACKEND_NAME]: 'check',
        [CDKContextKey.DEPLOYMENT_TYPE]: 'sandbox',
      }),
    },
    stdio: 'inherit',
  });
  assert.equal(synth.status, 0, 'Backend synthesis failed');

  // CloudFormation follows Ref/GetAtt/Sub as well as explicit DependsOn edges.
  // CDK synthesis alone does not reject every nested-stack dependency cycle.
  const templates = readdirSync(outdir).filter((file) => file.endsWith('.template.json'));
  assert.ok(templates.length > 1, 'Expected the root and nested stack templates');
  for (const file of templates) {
    const { Resources: resources } = JSON.parse(readFileSync(join(outdir, file), 'utf8'));
    const graph = new Map(Object.keys(resources).map((id) => [id, new Set()]));
    function collect(value, edges) {
      if (!value || typeof value !== 'object') return;
      if (typeof value.Ref === 'string') edges.add(value.Ref);
      const getAtt = value['Fn::GetAtt'];
      if (getAtt) edges.add(Array.isArray(getAtt) ? getAtt[0] : getAtt.split('.')[0]);
      const sub = value['Fn::Sub'];
      if (sub) {
        const template = Array.isArray(sub) ? sub[0] : sub;
        const substitutions = Array.isArray(sub) ? sub[1] : {};
        for (const [, name] of template.matchAll(/\$\{([^}]+)\}/g)) {
          if (!(name in substitutions)) edges.add(name.split('.')[0]);
        }
      }
      Object.values(value).forEach((child) => collect(child, edges));
    }
    for (const [id, resource] of Object.entries(resources)) {
      const edges = graph.get(id);
      const depends = resource.DependsOn || [];
      for (const dependency of Array.isArray(depends) ? depends : [depends]) edges.add(dependency);
      collect(resource.Properties, edges);
    }
    const visited = new Set();
    function visit(id, path = []) {
      assert.ok(!path.includes(id), `${file}: circular dependency: ${[...path, id].join(' -> ')}`);
      if (visited.has(id)) return;
      for (const dependency of graph.get(id)) {
        if (graph.has(dependency)) visit(dependency, [...path, id]);
      }
      visited.add(id);
    }
    for (const id of graph.keys()) visit(id);
  }
  console.log(`Backend dependency check passed (${templates.length} templates).`);
} finally {
  if (process.argv.includes('--keep-output')) {
    console.log(`Synthesized templates: ${outdir}`);
  } else {
    rmSync(outdir, { recursive: true, force: true });
  }
}
