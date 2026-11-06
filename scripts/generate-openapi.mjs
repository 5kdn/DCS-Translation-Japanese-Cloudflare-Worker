import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv/dist/2020.js';
import standaloneCode from 'ajv/dist/standalone/index.js';
import addFormats from 'ajv-formats';
import { build } from 'esbuild';
import openapiTS from 'openapi-typescript';

const root = new URL('../', import.meta.url);
const document = JSON.parse(await readFile(new URL('src/api/v2/openapi.json', root), 'utf8'));
const dereference = (value) => {
  if (Array.isArray(value)) return value.map(dereference);
  if (!value || typeof value !== 'object') return value;
  if (value.$ref) {
    assert(value.$ref.startsWith('#/'), 'Only local OAS references are supported');
    return dereference(
      value.$ref
        .slice(2)
        .split('/')
        .reduce((node, key) => node[key], document),
    );
  }
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, dereference(child)]));
};
const requests = new Ajv({ allErrors: true, strict: false, coerceTypes: true, code: { source: true, esm: true } });
const responses = new Ajv({ allErrors: true, strict: false, code: { source: true, esm: true } });
addFormats(requests);
addFormats(responses);
const requestExports = {};
const responseExports = {};
const responseSchemas = new Map();
const operations = {};
for (const [path, item] of Object.entries(document.paths)) {
  for (const [method, operation] of Object.entries(item)) {
    if (!operation.operationId) continue;
    const id = operation.operationId;
    const properties = {
      path: { type: 'object', properties: {}, additionalProperties: false, required: [] },
      query: { type: 'object', properties: {}, additionalProperties: false, required: [] },
    };
    for (const parameter of [...(item.parameters ?? []), ...(operation.parameters ?? [])].map(dereference)) {
      if (!['path', 'query'].includes(parameter.in)) continue;
      properties[parameter.in].properties[parameter.name] = parameter.schema;
      if (parameter.required) properties[parameter.in].required.push(parameter.name);
    }
    const required = ['path', 'query'];
    const body = operation.requestBody && dereference(operation.requestBody);
    if (body) {
      assert(body.content['application/json'], `JSON request schema missing: ${id}`);
      properties.body = {};
      responses.addSchema(dereference(body.content['application/json'].schema), `body_${id}`);
      responseExports[`body_${id}`] = `body_${id}`;
      if (body.required) required.push('body');
    }
    requests.addSchema(dereference({ type: 'object', properties, required, additionalProperties: false }), id);
    requestExports[id] = id;
    const responseMetadata = {};
    for (const [status, response] of Object.entries(operation.responses)) {
      const resolved = dereference(response);
      responseMetadata[status] = {};
      for (const [mediaType, content] of Object.entries(resolved.content ?? {})) {
        const schema = content.schema ?? {};
        const signature = JSON.stringify(schema);
        let key = responseSchemas.get(signature);
        if (!key) {
          key = `response${responseSchemas.size}`;
          responses.addSchema(schema, key);
          responseExports[key] = key;
          responseSchemas.set(signature, key);
        }
        responseMetadata[status][mediaType] = key;
      }
    }
    operations[id] = {
      path,
      method: method.toUpperCase(),
      bodyRequired: !!body?.required,
      hasBody: !!body,
      bodyValidator: body ? `body_${id}` : null,
      responses: responseMetadata,
    };
  }
}
responses.addSchema(dereference(document.components.schemas.Problem), 'problem');
responseExports.problem = 'problem';
// Compile at generation time: Workers disallows runtime eval/new Function.
const requestSource = standaloneCode(requests, requestExports);
const responseSource = standaloneCode(responses, responseExports);
const bundled = await build({
  stdin: {
    contents: `import * as requests from 'requests'; import * as responses from 'responses'; export { requests, responses };`,
    resolveDir: fileURLToPath(root),
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  plugins: [
    {
      name: 'validators',
      setup(build) {
        build.onResolve({ filter: /^(requests|responses)$/ }, (args) => ({ path: args.path, namespace: 'validators' }));
        build.onLoad({ filter: /.*/, namespace: 'validators' }, (args) => ({
          contents: args.path === 'requests' ? requestSource : responseSource,
          resolveDir: fileURLToPath(root),
        }));
      },
    },
  ],
});
const artifacts = {
  'types.ts': await openapiTS(document),
  'validators.js': bundled.outputFiles[0].text,
  'validators.d.ts':
    "import type { ValidateFunction } from 'ajv';\nexport const requests: Record<string, ValidateFunction>;\nexport const responses: Record<string, ValidateFunction>;\n",
  'operations.ts': `// Generated by scripts/generate-openapi.mjs. Do not edit.\nexport const operations = ${JSON.stringify(operations, null, 2)} as const;\n`,
};
await mkdir(new URL('src/api/v2/generated/', root), { recursive: true });
for (const [name, source] of Object.entries(artifacts)) {
  const path = new URL(`src/api/v2/generated/${name}`, root);
  if (process.argv.includes('--check'))
    assert.equal(await readFile(path, 'utf8'), source, `${name} is stale. Run pnpm generate:openapi`);
  else await writeFile(path, source);
}
console.log(
  process.argv.includes('--check') ? 'OAS generated artifacts are up to date.' : 'OAS types and validators generated.',
);
