import type { Budget, IdeaTraits, Pillar, Target, TaskType } from './types';

export interface RuleSection {
  key: Pillar;
  title: string;
  items: string[];
}

interface Ctx {
  taskType: TaskType;
  traits: IdeaTraits;
  budget: Budget;
  target: Target;
  modelRules: string[];
  questionLimit: number;
}

const pick = (budget: Budget, items: string[], leanCount: number, standardCount = items.length) =>
  items.slice(0, budget === 'lean' ? leanCount : budget === 'standard' ? standardCount : items.length);

function tokens(c: Ctx): string[] {
  const codeEfficiency =
    c.target === 'antigravity' || c.target === 'ide'
      ? 'Read only the files you need; batch independent reads and searches in one step.'
      : 'Ask for specific files or snippets when you need them instead of guessing their contents.';

  const items = [
    'Be brief: no preamble, no restating the task, no closing summary of what was just shown.',
    c.traits.isCode
      ? 'Show only changed code, as diffs or complete changed functions; never reprint unchanged files.'
      : 'Keep each section tight and concrete; cut filler, repetition, and generic disclaimers.',
    ...(c.traits.isCode ? [codeEfficiency] : []),
  ];
  return pick(c.budget, items, 2);
}

function unslop(c: Ctx): string[] {
  if (!c.traits.isCode) {
    return pick(
      c.budget,
      [
        'Review the finished draft against every requirement and acceptance check before delivering it.',
        'Cut AI-sounding filler, clichés, hype words, and padded bullet lists; replace vague statements with specifics.',
        'Ensure every section serves the user goal directly with consistent tone and clear structure.',
      ],
      2,
      3,
    );
  }

  const run =
    c.target === 'antigravity' || c.target === 'ide'
      ? 'Run the tests, typecheck, and lint yourself and show the output; a change is not done until they pass.'
      : 'Give the exact commands to test, typecheck, and lint, with the expected result; ask me to paste the output.';

  return pick(
    c.budget,
    [
      run,
      'Match the existing code style, naming, and structure; reuse existing helpers before writing new ones.',
      'Leave no slop: no dead or commented-out code, debug logs, placeholder TODOs, comments that restate the code, or checks for impossible states.',
      'Prefer the simplest design that meets the requirements; every abstraction must remove more complexity than it adds.',
    ],
    2,
    3,
  );
}

function clarify(c: Ctx): string[] {
  const action = c.traits.isCode ? 'writing code' : 'producing the full output';
  return [
    `Before ${action}, ask at most ${c.questionLimit} questions about anything you cannot infer that would change the result (scope, audience, data, acceptance criteria). Then stop and wait for answers.`,
    'If an answer is already clear from the context or existing materials, state it as an assumption instead of asking.',
    ...(c.budget === 'thorough' ? ['Restate the agreed requirements in three lines before the plan.'] : []),
  ];
}

function security(c: Ctx): string[] {
  if (!c.traits.isCode && c.taskType !== 'automation') {
    // Non-code tasks still benefit from privacy/compliance awareness on thorough budget only.
    if (c.budget === 'thorough' && c.taskType === 'strategy') {
      return ['Flag privacy, legal, or compliance constraints (such as PII handling or licensing) where relevant.'];
    }
    return [];
  }

  const validate = 'Validate and type-check all external input at the boundary; encode output for its context (HTML, SQL, shell, URL).';
  const secrets = 'Keep secrets and provider API keys out of code, logs, URLs, and client bundles; load them server-side from environment or a secret manager.';
  const authz = 'Enforce authorization and rate limits on the server for every request; never trust client-side checks.';
  const queries = 'Use parameterized queries and safe APIs; never build SQL, shell, or HTML from strings.';
  const deps = 'Pin and audit dependencies (for example `npm audit` or `pip-audit`); add none without a reason.';
  const noHtml = 'No `innerHTML` or `dangerouslySetInnerHTML` with untrusted data; ship a strict Content Security Policy.';

  const byType: Partial<Record<TaskType, string[]>> = {
    feature: [validate, secrets, authz, queries, deps, ...(c.traits.hasUi ? [noHtml] : [])],
    media: [secrets, validate, authz, noHtml, deps],
    bugfix: [validate, secrets, authz, queries],
    ui: [noHtml, secrets, validate, deps],
    security: [validate, secrets, authz, queries, deps],
    refactor: [validate, secrets, authz, deps],
    deploy: [
      secrets,
      'Serve HTTPS only with HSTS, CSP, X-Content-Type-Options, and Referrer-Policy headers; use least-privilege service accounts.',
      deps,
    ],
    data: [queries, secrets, 'Grant the app the least database privilege it needs; make migrations reversible.', validate],
    test: ['Add tests for authorization failures and malformed input, not only the happy path.', secrets],
    automation: [secrets, validate, authz, deps],
  };

  const list = byType[c.taskType] ?? [validate, secrets, authz, deps];
  return pick(c.budget, list, 2, 4);
}

function uiux(c: Ctx): string[] {
  return pick(
    c.budget,
    [
      'Use design tokens: a 4px spacing grid, one type scale with weights 400 to 600, one tinted neutral ramp, and a single accent.',
      'Design every state: loading, empty, error, disabled, hover, focus, and success.',
      'Meet WCAG 2.2 AA: 4.5:1 text contrast, full keyboard use, visible focus, labelled controls, and `prefers-reduced-motion` respected.',
      'Build mobile-first and responsive; check 390px and 1440px widths.',
      'Avoid AI-looking UI: no hue gradients, glows, gradient text, emoji icons, uppercase tracked labels, or looping animations. Use real copy, never lorem ipsum.',
      'Motion explains state changes only: 120 to 220ms, one easing curve, animate transform and opacity only.',
    ],
    3,
    5,
  );
}

function grounding(c: Ctx): string[] {
  const verifyApi =
    c.target === 'antigravity'
      ? 'Check current docs (via MCP or primary sources) for every third-party library, model ID, or API instead of relying on memory.'
      : 'Verify every API, model ID, library version, URL, and claim against primary sources; if you cannot check live, mark it explicitly as unverified.';

  const items = [
    c.traits.isCode
      ? 'Work one step at a time and end each phase with evidence: file paths, command output, test results, or cited sources.'
      : 'Work one step at a time and end each phase with concrete evidence: primary sources, data, or worked examples.',
    c.traits.isCode
      ? 'Never cite an API, flag, file, or function you have not read or verified; read files before editing them.'
      : 'Never fabricate citations, statistics, quotes, URLs, or capabilities; cite primary sources for factual claims.',
    verifyApi,
    'Say "I don\'t know" or "unverified" when that is true; label assumptions as assumptions.',
  ];
  return pick(c.budget, items, 2, c.traits.hasSourceVerify ? 4 : 3);
}

export function buildRules(pillars: Record<Pillar, boolean>, c: Ctx): RuleSection[] {
  const sections: RuleSection[] = [];
  const add = (key: Pillar, title: string, items: string[]) => {
    if (pillars[key] && items.length) sections.push({ key, title, items });
  };
  add('model', 'How to work', c.modelRules);
  add('grounding', 'Accuracy and sources', grounding(c));
  add('clarify', 'Questions first', clarify(c));
  add('unslop', c.traits.isCode ? 'Code quality' : 'Draft quality', unslop(c));
  add('security', 'Security', security(c));
  // UI rules only cost tokens when the task builds or designs a user interface.
  if (c.taskType === 'ui' || (c.traits.hasUi && ['feature', 'media', 'general'].includes(c.taskType))) {
    add('uiux', 'UI and UX', uiux(c));
  }
  add('tokens', 'Efficiency', tokens(c));
  return sections;
}
