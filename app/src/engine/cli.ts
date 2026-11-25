/**
 * Command-line entry for the Antigravity skill. Bundled to a single file:
 *   node forge.mjs --goal "..." [--model claude-sonnet] [--budget standard]
 *     [--target antigravity|ide|chat|api] [--type auto] [--stack "React, Vite"]
 *     [--context "..."] [--constraints "a; b"] [--answers '{"stack":"..."}']
 *     [--off tokens,uiux] [--json]
 */
import { forge, MODELS } from './index';
import type { Budget, ForgeInput, ModelId, Pillar, Target, TaskType } from './types';

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[key] = 'true';
    else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

const BUDGETS: Budget[] = ['lean', 'standard', 'thorough'];
const TARGETS: Target[] = ['antigravity', 'ide', 'chat', 'api'];
const TYPES: (TaskType | 'auto')[] = [
  'auto',
  'feature',
  'bugfix',
  'ui',
  'security',
  'refactor',
  'deploy',
  'research',
  'data',
  'test',
  'media',
  'writing',
  'strategy',
  'automation',
  'general',
];

function fail(msg: string): never {
  process.stderr.write(`forge: ${msg}\n`);
  process.exit(2);
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T, name: string): T {
  if (value === undefined) return fallback;
  if (!allowed.includes(value as T)) fail(`--${name} must be one of: ${allowed.join(', ')}`);
  return value as T;
}

const args = parseArgs(process.argv.slice(2));
if (!args.goal || args.goal === 'true') fail('--goal is required');

let answers: Record<string, string> = {};
if (args.answers) {
  try {
    const parsed: unknown = JSON.parse(args.answers);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error();
    const blocked = new Set(['__proto__', 'constructor', 'prototype']);
    answers = Object.fromEntries(
      Object.entries(parsed)
        .filter(([k]) => !blocked.has(k))
        .map(([k, v]) => [k, String(v)]),
    );
  } catch {
    fail('--answers must be a JSON object of question id to answer');
  }
}

const off = (args.off ?? '').split(',').map((s) => s.trim()).filter(Boolean) as Pillar[];

const input: ForgeInput = {
  goal: args.goal,
  model: oneOf(args.model, Object.keys(MODELS) as ModelId[], 'claude-sonnet', 'model'),
  budget: oneOf(args.budget, BUDGETS, 'standard', 'budget'),
  target: oneOf(args.target, TARGETS, 'antigravity', 'target'),
  taskType: oneOf(args.type, TYPES, 'auto', 'type'),
  stack: args.stack,
  context: args.context,
  constraints: args.constraints,
  answers,
  pillars: Object.fromEntries(off.map((p) => [p, false])),
};

const result = forge(input);

if (args.json === 'true') {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  const header = [
    `# Task: ${result.taskType}${result.taskType !== result.detectedTaskType ? ` (detected ${result.detectedTaskType})` : ''} | Target: ${input.target} | ~${result.tokens} tokens`,
    result.stack.length ? `# Stack: ${result.stack.join(', ')}` : '',
    ...result.lint.map((l) => `# Check (${l.level}): ${l.message} ${l.fix}`),
    ...result.questions.filter((q) => !answers[q.id]).map((q) => `# Question [${q.id}]: ${q.text}`),
    ...result.skills.filter((s) => s.kind === 'command').map((s) => `# Start with ${s.name}: ${s.when}`),
  ].filter(Boolean);
  process.stdout.write(`${header.join('\n')}\n\n${result.prompt}\n`);
}
