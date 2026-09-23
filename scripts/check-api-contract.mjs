// Checks that every mutation this app sends matches the API schema that
// validates it.
//
// Why this exists: the API validates bodies with zod objects that STRIP
// unknown keys, and replaces req.body with the result. So a field the web app
// names differently is not an error — it is silently dropped, and the form
// "succeeds" while losing data. A field the API requires and the web app never
// sends fails every time. Neither repo's tests can see either: each side only
// tests itself.
//
// How: parse both codebases with the TypeScript compiler (no execution),
//   - API:  routes/index.ts mounts -> each router's validateRequest(schema)
//           -> the zod object's keys, following .partial/.extend/.omit/.pick
//   - web:  every httpClient.post/put/patch in src/services -> the declared
//           type of the payload argument -> its keys, following Partial,
//           Omit, Pick, intersections and interface extends
// then pair them by method + path and compare.
//
// The API checkout is found at $API_REPO_DIR, else ../travel_agency_backend.
// Missing locally: skipped with a notice. Missing in CI: a failure.
//
// usage: node scripts/check-api-contract.mjs

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB = path.join(WEB_ROOT, "src");
const API_ROOT = path.resolve(process.env.API_REPO_DIR ?? path.join(WEB_ROOT, "..", "travel_agency_backend"));
const API = path.join(API_ROOT, "src", "app");

if (!fs.existsSync(path.join(API, "routes", "index.ts"))) {
  const message = `[check-api-contract] API source not found at ${API_ROOT} (set API_REPO_DIR)`;
  if (process.env.CI) {
    console.error(`${message} — failing, because in CI a skipped check is a passed check nobody ran.`);
    process.exit(1);
  }
  console.log(`${message} — skipped.`);
  process.exit(0);
}

const parse = (file) => ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
const walk = (node, visit) => {
  visit(node);
  ts.forEachChild(node, (child) => walk(child, visit));
};
const propName = (node) => node.getText().replace(/['"]/g, "");
/** "/customers/${id}?x" and "/customers/:id" both become "/customers/:p". */
const normalisePath = (raw) =>
  `/${raw}`
    .replace(/\?.*$/, "")
    .replace(/\$\{[^}]*\}/g, ":p")
    .replace(/:[A-Za-z_]+/g, ":p")
    .replace(/\/+/g, "/")
    .replace(/(.)\/$/, "$1");

/* --------------------------------- API ---------------------------------- */

const OPTIONAL_ZOD = /\.optional\(\)|\.default\(|\.nullish\(\)|\.catch\(/;

/** { key: required } for an object literal of zod fields. */
const zodObjectKeys = (objectLiteral) => {
  const keys = {};
  for (const prop of objectLiteral.properties) {
    if (ts.isPropertyAssignment(prop)) keys[propName(prop.name)] = !OPTIONAL_ZOD.test(prop.initializer.getText());
    else if (ts.isShorthandPropertyAssignment(prop)) keys[propName(prop.name)] = true;
  }
  return keys;
};

/** { key: required } for a zod expression, or null when it is not an object schema we can read. */
const zodKeys = (expr, scope) => {
  if (!expr) return null;
  if (ts.isParenthesizedExpression(expr)) return zodKeys(expr.expression, scope);
  if (ts.isIdentifier(expr)) return scope.get(expr.text) ?? null;
  if (!ts.isCallExpression(expr) || !ts.isPropertyAccessExpression(expr.expression)) return null;

  const method = expr.expression.name.text;
  const target = expr.expression.expression;
  const [arg] = expr.arguments;

  if (ts.isIdentifier(target) && target.text === "z") {
    return /object$/i.test(method) && arg && ts.isObjectLiteralExpression(arg) ? zodObjectKeys(arg) : null;
  }

  const inner = zodKeys(target, scope);
  if (!inner) return null;

  if (method === "partial") return Object.fromEntries(Object.keys(inner).map((key) => [key, false]));
  if (method === "extend" || method === "merge") {
    const extra = arg && ts.isObjectLiteralExpression(arg) ? zodObjectKeys(arg) : zodKeys(arg, scope);
    return extra ? { ...inner, ...extra } : null;
  }
  if (method === "omit" || method === "pick") {
    const listed = arg && ts.isObjectLiteralExpression(arg) ? arg.properties.map((p) => propName(p.name)) : [];
    return Object.fromEntries(
      Object.entries(inner).filter(([key]) => (method === "omit" ? !listed.includes(key) : listed.includes(key))),
    );
  }
  // refine, superRefine, transform, describe…: same shape.
  return inner;
};

const schemasByFile = new Map();
const schemasIn = (file) => {
  if (schemasByFile.has(file)) return schemasByFile.get(file);
  const scope = new Map();
  schemasByFile.set(file, scope);
  if (!fs.existsSync(file)) return scope;
  const sf = parse(file);
  // Declarations are in source order, so one pass resolves references to earlier schemas.
  walk(sf, (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const keys = zodKeys(node.initializer, scope);
      if (keys) scope.set(node.name.text, keys);
    }
  });
  return scope;
};

const namedImports = (sf, dir, filter) => {
  const found = new Map();
  walk(sf, (node) => {
    if (!ts.isImportDeclaration(node) || !filter(node.moduleSpecifier.text)) return;
    const bindings = node.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) return;
    const file = path.resolve(dir, node.moduleSpecifier.text.replace(/\.js$/, ".ts"));
    for (const element of bindings.elements) found.set(element.name.text, file);
  });
  return found;
};

const indexFile = path.join(API, "routes", "index.ts");
const indexSf = parse(indexFile);
const routerFiles = namedImports(indexSf, path.dirname(indexFile), () => true);

const apiRoutes = [];
walk(indexSf, (node) => {
  if (!ts.isCallExpression(node) || node.expression.getText() !== "router.use") return;
  const [prefixArg, routerArg] = node.arguments;
  if (!prefixArg || !routerArg || !ts.isStringLiteral(prefixArg)) return;

  const exported = routerArg.getText();
  const file = routerFiles.get(exported);
  if (!file) return;

  const sf = parse(file);
  let routerVar = exported;
  walk(sf, (decl) => {
    if (ts.isVariableDeclaration(decl) && decl.name.getText() === exported && decl.initializer && ts.isIdentifier(decl.initializer)) {
      routerVar = decl.initializer.text;
    }
  });
  const validations = namedImports(sf, path.dirname(file), (spec) => spec.endsWith("validation.js"));

  walk(sf, (call) => {
    if (!ts.isCallExpression(call) || !ts.isPropertyAccessExpression(call.expression)) return;
    if (call.expression.expression.getText() !== routerVar) return;
    const verb = call.expression.name.text;
    if (!["get", "post", "put", "patch", "delete", "all"].includes(verb)) return;
    const [routePath] = call.arguments;
    if (!routePath || !ts.isStringLiteral(routePath)) return;

    let schema = null;
    let keys = null;
    for (const arg of call.arguments) {
      if (ts.isCallExpression(arg) && arg.expression.getText() === "validateRequest") {
        const ref = arg.arguments[0];
        schema = ref.getText();
        if (ts.isPropertyAccessExpression(ref)) {
          const validationFile = validations.get(ref.expression.getText());
          keys = validationFile ? (schemasIn(validationFile).get(ref.name.text) ?? null) : null;
        }
      }
    }

    apiRoutes.push({
      method: verb.toUpperCase(),
      path: normalisePath(`${prefixArg.text}${routePath.text}`),
      schema,
      keys,
    });
  });
});

/* --------------------------------- web ---------------------------------- */

const interfaces = new Map();
const aliases = new Map();
const heritage = new Map();

for (const name of fs.readdirSync(path.join(WEB, "types")).filter((f) => f.endsWith(".ts"))) {
  walk(parse(path.join(WEB, "types", name)), (node) => {
    if (ts.isInterfaceDeclaration(node)) {
      const keys = {};
      for (const member of node.members) if (member.name) keys[propName(member.name)] = !member.questionToken;
      interfaces.set(node.name.text, keys);
      heritage.set(node.name.text, (node.heritageClauses ?? []).flatMap((clause) => clause.types));
    }
    if (ts.isTypeAliasDeclaration(node)) aliases.set(node.name.text, node.type);
  });
}

/** { key: required } for a type node, or null when it cannot be resolved. */
const typeKeys = (node, depth = 0) => {
  if (!node || depth > 10) return null;
  if (ts.isParenthesizedTypeNode(node)) return typeKeys(node.type, depth + 1);
  if (ts.isTypeLiteralNode(node)) {
    const keys = {};
    for (const member of node.members) if (member.name) keys[propName(member.name)] = !member.questionToken;
    return keys;
  }
  if (ts.isIntersectionTypeNode(node)) {
    const parts = node.types.map((part) => typeKeys(part, depth + 1));
    return parts.every(Boolean) ? Object.assign({}, ...parts) : null;
  }
  if (ts.isTypeReferenceNode(node) || ts.isExpressionWithTypeArguments(node)) {
    const name = (ts.isTypeReferenceNode(node) ? node.typeName : node.expression).getText();
    const args = node.typeArguments ?? [];
    if (name === "Partial") {
      const inner = typeKeys(args[0], depth + 1);
      return inner && Object.fromEntries(Object.keys(inner).map((key) => [key, false]));
    }
    if (name === "Omit" || name === "Pick") {
      const inner = typeKeys(args[0], depth + 1);
      const listed = (args[1]?.getText() ?? "").replace(/["'\s]/g, "").split("|");
      return (
        inner &&
        Object.fromEntries(Object.entries(inner).filter(([key]) => (name === "Omit" ? !listed.includes(key) : listed.includes(key))))
      );
    }
    if (aliases.has(name)) return typeKeys(aliases.get(name), depth + 1);
    if (interfaces.has(name)) {
      const inherited = heritage.get(name).map((base) => typeKeys(base, depth + 1));
      if (inherited.some((keys) => keys === null)) return null;
      return Object.assign({}, ...inherited, interfaces.get(name));
    }
  }
  return null;
};

const typeKeysFromText = (text) => {
  const sf = ts.createSourceFile("payload.ts", `type Payload = ${text};`, ts.ScriptTarget.Latest, true);
  return typeKeys(sf.statements[0].type);
};

const VERBS = { post: "POST", put: "PUT", patch: "PATCH", postFormData: "POST", patchFormData: "PATCH" };

// An upload carries a file, not fields: there is no JSON body for a schema
// to check, and the route's upload filter is what decides what is allowed.
const FILE_UPLOAD_VERBS = new Set(["postFormData", "patchFormData"]);
const webCalls = [];

for (const name of fs.readdirSync(path.join(WEB, "services")).filter((f) => f.endsWith(".ts"))) {
  walk(parse(path.join(WEB, "services", name)), (call) => {
    if (!ts.isCallExpression(call) || !ts.isPropertyAccessExpression(call.expression)) return;
    if (call.expression.expression.getText() !== "httpClient") return;
    const method = VERBS[call.expression.name.text];
    if (!method) return;
    const isUpload = FILE_UPLOAD_VERBS.has(call.expression.name.text);

    let fn = call.parent;
    while (fn && !ts.isArrowFunction(fn) && !ts.isFunctionDeclaration(fn)) fn = fn.parent;
    const fnName =
      fn && ts.isFunctionDeclaration(fn) ? fn.name?.text : fn && ts.isVariableDeclaration(fn.parent) ? fn.parent.name.getText() : "?";

    const [pathArg, payload] = call.arguments;
    const rawPath = pathArg.getText().replace(/^[`'"]|[`'"]$/g, "");

    let typeText = null;
    let keys = {};
    if (payload && ts.isIdentifier(payload)) {
      typeText = fn?.parameters.find((p) => p.name.getText() === payload.text)?.type?.getText() ?? null;
      keys = typeText ? typeKeysFromText(typeText) : null;
    } else if (payload && ts.isObjectLiteralExpression(payload)) {
      typeText = "(object literal)";
      for (const prop of payload.properties) {
        if (ts.isSpreadAssignment(prop)) {
          const spreadType = fn?.parameters.find((p) => p.name.getText() === prop.expression.getText())?.type?.getText();
          const spread = spreadType ? typeKeysFromText(spreadType) : null;
          if (!spread) keys = null;
          else if (keys) Object.assign(keys, spread);
        } else if (keys && prop.name) {
          keys[propName(prop.name)] = true;
        }
      }
    } else if (payload) {
      typeText = payload.getText();
      keys = null;
    }

    webCalls.push({ where: `src/services/${name} ${fnName}`, method, path: normalisePath(rawPath), rawPath, typeText, keys, isUpload });
  });
}

/* ------------------------------- compare -------------------------------- */

const problems = [];
const notes = [];

for (const call of webCalls) {
  const label = `${call.method} ${call.rawPath}  (${call.where})`;
  const route = apiRoutes.find((r) => r.path === call.path && (r.method === call.method || r.method === "ALL"));

  if (!route) {
    problems.push(`${label}\n    no API route answers ${call.method} ${call.path}`);
    continue;
  }

  if (call.isUpload) {
    notes.push(`${label}\n    file upload — checked by the route's upload filter, not by a schema`);
    continue;
  }

  const sendsSomething = call.keys === null || Object.keys(call.keys).length > 0;
  if (!route.schema) {
    if (sendsSomething) problems.push(`${label}\n    sends a body, but the API route validates none — its fields are unchecked`);
    continue;
  }
  if (route.keys === null) {
    problems.push(`${label}\n    could not read the API schema ${route.schema} — teach this script its shape`);
    continue;
  }
  if (call.keys === null) {
    problems.push(`${label}\n    could not read the payload type ${call.typeText} — teach this script its shape`);
    continue;
  }

  const dropped = Object.keys(call.keys).filter((key) => !(key in route.keys));
  const notSent = Object.entries(route.keys).filter(([key, required]) => required && !(key in call.keys)).map(([key]) => key);
  const maybeNotSent = Object.entries(route.keys)
    .filter(([key, required]) => required && call.keys[key] === false)
    .map(([key]) => key);
  const unreachable = Object.entries(route.keys).filter(([key, required]) => !required && !(key in call.keys)).map(([key]) => key);

  if (dropped.length) problems.push(`${label}\n    SILENTLY DROPPED by ${route.schema}: ${dropped.join(", ")}`);
  if (notSent.length) problems.push(`${label}\n    ${route.schema} requires, never sent: ${notSent.join(", ")}`);
  if (maybeNotSent.length) problems.push(`${label}\n    ${route.schema} requires, but ${call.typeText} makes optional: ${maybeNotSent.join(", ")}`);
  if (unreachable.length) notes.push(`${label}\n    API accepts, this app never sends: ${unreachable.join(", ")}`);
}

// A parser that quietly finds nothing would report "all clear".
const validated = apiRoutes.filter((r) => r.schema).length;
if (validated === 0 || webCalls.length === 0) {
  problems.push(`parsed ${validated} validated API routes and ${webCalls.length} web mutations — the parser is broken`);
}

console.log(`[check-api-contract] ${webCalls.length} web mutations against ${validated} validated API routes (${API_ROOT})`);
for (const note of notes) console.log(`  note: ${note}`);

if (problems.length) {
  console.error(`\n[check-api-contract] ${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ✗ ${problem}\n`);
  process.exit(1);
}

console.log("[check-api-contract] ok: every payload matches its API schema");
