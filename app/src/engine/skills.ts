import type { Budget, IdeaTraits, Pillar, SkillRef, Target, TaskType } from './types';

interface PortableRule {
  name: string;
  when: string;
  pillar?: Pillar;
  check: (ctx: RouteCtx) => boolean;
}

interface NativeRule extends SkillRef {
  types?: TaskType[];
  match?: RegExp;
  pillar?: Pillar;
  check?: (ctx: RouteCtx) => boolean;
}

export interface RouteCtx {
  text: string;
  taskType: TaskType;
  traits: IdeaTraits;
  budget: Budget;
  tier: 'frontier' | 'balanced' | 'fast';
  target: Target;
  pillars: Record<Pillar, boolean>;
  hasStack: boolean;
}

/**
 * Portable approach skills work in EVERY workspace (Chat, Coding IDE, API, and Antigravity).
 * They give copied prompts concrete domain craft even without local plugins.
 */
const PORTABLE_SKILLS: PortableRule[] = [
  {
    name: 'AI media pipeline',
    when: 'Specify generation models, aspect ratios/durations, async job states, media storage, cost/rate limits, and moderation before building.',
    check: (c) => c.traits.hasAiMedia,
  },
  {
    name: 'Source and claim verification',
    when: 'Verify every URL, SDK/model ID, benchmark, and factual claim against primary documentation; label anything unverified explicitly.',
    pillar: 'grounding',
    check: (c) => c.traits.hasSourceVerify || c.taskType === 'research' || c.taskType === 'writing',
  },
  {
    name: 'Design craft and UI states',
    when: 'Apply a 4px spacing grid, clear type hierarchy, one accent, WCAG 2.2 AA contrast, and full loading, empty, error, and focus states.',
    pillar: 'uiux',
    check: (c) => c.traits.hasUi,
  },
  {
    name: 'Root-cause debugging',
    when: 'Reproduce minimally, list up to 3 ranked hypotheses, confirm one with evidence, then add a failing regression test before fixing.',
    check: (c) => c.taskType === 'bugfix',
  },
  {
    name: 'Threat modeling and OWASP check',
    when: 'Map assets and trust boundaries; keep API keys server-side, validate external input, enforce authz, and check OWASP Top 10 risks.',
    pillar: 'security',
    check: (c) => c.taskType === 'security' || c.traits.hasApiOrBackend || (c.traits.isCode && c.traits.hasAiMedia),
  },
  {
    name: 'Architecture and trade-off brief',
    when: 'Compare the main implementation or strategic options against constraints and failure modes before committing.',
    check: (c) =>
      c.taskType === 'feature' ||
      c.taskType === 'strategy' ||
      c.taskType === 'media' ||
      c.taskType === 'deploy' ||
      c.taskType === 'data',
  },
  {
    name: 'Safe refactoring',
    when: 'Pin current behavior with characterization tests first, then apply small behavior-preserving steps.',
    check: (c) => c.taskType === 'refactor',
  },
  {
    name: 'Workflow and failure recovery',
    when: 'Design idempotent steps, explicit retries/timeouts, rate-limit handling, dry-run testing, and clear failure logs.',
    check: (c) => c.traits.hasAutomation,
  },
  {
    name: 'Test and verification loop',
    when: 'Cover edge cases, failure paths, and acceptance checks; verify with runnable commands or a concrete review checklist.',
    pillar: 'unslop',
    check: (c) => c.traits.isCode || c.taskType === 'test',
  },
  {
    name: 'Editorial clarity and structure',
    when: 'Lead with the core point for the target audience, use concrete specifics instead of filler, and cut clichés.',
    check: (c) => c.taskType === 'writing' || c.taskType === 'strategy' || (!c.traits.isCode && c.taskType === 'general'),
  },
  {
    name: 'Structured problem framing',
    when: 'Define the audience, constraints, success criteria, and concrete deliverables before drafting the solution.',
    check: (c) => c.taskType === 'general',
  },
];

/**
 * Extra workspace workflow hints for non-Antigravity coding IDEs / CLIs
 * (Cursor, Claude Code, Codex, Windsurf, Copilot, etc.).
 */
const IDE_SKILLS: PortableRule[] = [
  {
    name: 'Workspace context scan',
    when: 'Inspect the repository structure, docs, and neighboring files before drafting or editing.',
    check: () => true,
  },
  {
    name: 'Local verify loop',
    when: 'Run the project test, typecheck, and build commands in the terminal and paste the observed results.',
    pillar: 'unslop',
    check: (c) => c.traits.isCode,
  },
];

/**
 * Antigravity-native skills, MCP servers, and subagents layered on top
 * when the target runtime is Antigravity.
 */
const ANTIGRAVITY_CATALOG: NativeRule[] = [
  {
    name: 'unslop',
    kind: 'skill',
    when: 'Before and after building UI: direction, then the nine polish passes',
    pillar: 'uiux',
    check: (c) => c.traits.hasUi,
  },
  {
    name: 'redesign-screen',
    kind: 'skill',
    when: 'Ground a redesign in patterns real apps ship (Mobbin)',
    match: /\bredesign|restyle|inspiration|patterns?\b/i,
    types: ['ui'],
  },
  {
    name: 'a11y-debugging',
    kind: 'skill',
    when: 'Verify phase: semantics, focus, keyboard, contrast',
    pillar: 'uiux',
    check: (c) => c.traits.hasUi,
  },
  {
    name: 'browser',
    kind: 'subagent',
    when: 'Verify phase: open the running app, click through flows, take screenshots',
    check: (c) => c.traits.hasUi,
  },
  {
    name: 'gemini-omni-flash-api',
    kind: 'skill',
    when: 'AI video generation, editing, and transitions via Gemini Omni Flash',
    match: /\b(ai videos?|video generat\w*|text[- ]to[- ]video|omni|video editing)\b/i,
  },
  {
    name: 'image-generator',
    kind: 'subagent',
    when: 'Generate or edit visual assets from a brief',
    match: /\b(ai images?|image generat\w*|text[- ]to[- ]image|hero visual|illustration|artwork|storyboard)\b/i,
  },
  {
    name: 'gemini-api-dev',
    kind: 'skill',
    when: 'Any code that calls the Gemini API or builds multimodal AI features',
    match: /\b(gemini|llm|genai|ai videos?|ai images?|ai feature|chatbot|multimodal)\b/i,
  },
  {
    name: 'chrome-devtools',
    kind: 'skill',
    when: 'Debug network, console, and runtime errors in the browser',
    match: /\b(console|network|browser|devtools|runtime error|hydration)\b/i,
  },
  {
    name: 'debug-optimize-lcp',
    kind: 'skill',
    when: 'Page load and Core Web Vitals work',
    match: /\b(lcp|web vitals|cwv|slow (page|load)|page speed|performance)\b/i,
  },
  {
    name: 'memory-leak-debugging',
    kind: 'skill',
    when: 'Memory growth, OOM, heap snapshots',
    match: /\b(memory leak|leak|oom|heap|out of memory)\b/i,
  },
  {
    name: 'cookie-debugging',
    kind: 'skill',
    when: 'Session, cookie, and 401/403 issues',
    match: /\b(cookie|session|401|403|samesite|login loop)\b/i,
  },
  {
    name: 'context7-mcp',
    kind: 'mcp',
    when: 'Fetch current library docs before using any third-party API',
    pillar: 'grounding',
    check: (c) => c.hasStack || c.traits.isCode,
  },
  {
    name: 'firebase-basics',
    kind: 'skill',
    when: 'Firebase CLI setup and project selection',
    match: /\bfirebase\b/i,
  },
  {
    name: 'firebase-auth-basics',
    kind: 'skill',
    when: 'Sign-in and user management',
    match: /\b(firebase auth|sign[- ]?in|login|authentication)\b/i,
  },
  {
    name: 'firebase-firestore',
    kind: 'skill',
    when: 'Firestore data model, queries, and indexes',
    match: /\bfirestore\b/i,
  },
  {
    name: 'firestore-rules-author',
    kind: 'subagent',
    when: 'Author or change firestore.rules (mandatory delegate)',
    match: /\b(firestore\.rules|firestore rules|security rules)\b/i,
  },
  {
    name: 'firebase-security-rules-auditor',
    kind: 'skill',
    when: 'Audit Firestore and Storage rules',
    match: /\b(firestore|firebase storage|security rules)\b/i,
    types: ['security'],
  },
  {
    name: 'firebase-hosting-basics',
    kind: 'skill',
    when: 'Static site or SPA deploys',
    match: /\b(firebase hosting|static site|spa)\b/i,
    types: ['deploy'],
  },
  {
    name: 'firebase-app-hosting-basics',
    kind: 'skill',
    when: 'Next.js or Angular SSR deploys',
    match: /\b(next(\.js)?|angular|ssr|app hosting)\b/i,
    types: ['deploy'],
  },
  {
    name: 'android-cli',
    kind: 'skill',
    when: 'Create, build, and run Android apps',
    match: /\bandroid\b/i,
  },
  {
    name: 'generative_ui',
    kind: 'skill',
    when: 'Show diagrams or interactive visuals in the chat',
    match: /\b(diagram|visuali[sz]e|chart|flowchart)\b/i,
  },
  {
    name: 'notion-spec-to-implementation',
    kind: 'skill',
    when: 'Turn a Notion spec into tasks and track progress',
    match: /\bnotion\b/i,
  },
  {
    name: 'run-workflow',
    kind: 'skill',
    when: 'Fan out across many files, modules, or review angles',
    match: /\b(every file|all files|whole (repo|codebase)|monorepo|many (files|modules))\b/i,
  },
  {
    name: 'research',
    kind: 'subagent',
    when: 'Broad codebase or docs survey and source verification without cluttering context',
    check: (c) =>
      c.taskType === 'research' || c.taskType === 'refactor' || c.taskType === 'security' || c.traits.hasSourceVerify,
  },
];

export function routeSkills(ctx: RouteCtx): SkillRef[] {
  if (!ctx.pillars.skills) return [];

  const picked: SkillRef[] = [];
  const seen = new Set<string>();
  const add = (ref: SkillRef) => {
    if (seen.has(ref.name)) return;
    seen.add(ref.name);
    picked.push(ref);
  };

  // 1. Always route portable approach skills (works in Chat, IDE, API, and Antigravity).
  const maxPortable = ctx.budget === 'lean' ? 3 : ctx.budget === 'standard' ? 5 : 7;
  let portableCount = 0;
  for (const rule of PORTABLE_SKILLS) {
    if (portableCount >= maxPortable) break;
    if (rule.pillar && !ctx.pillars[rule.pillar]) continue;
    if (rule.check(ctx)) {
      add({ name: rule.name, kind: 'approach', when: rule.when });
      portableCount++;
    }
  }

  // 2. IDE-specific workflow skills (Cursor, Claude Code, Codex, Windsurf, etc.).
  if (ctx.target === 'ide') {
    for (const rule of IDE_SKILLS) {
      if (rule.pillar && !ctx.pillars[rule.pillar]) continue;
      if (rule.check(ctx)) add({ name: rule.name, kind: 'skill', when: rule.when });
    }
  }

  // 3. Antigravity-native skills, MCP servers, subagents, and session slash commands.
  if (ctx.target === 'antigravity') {
    for (const rule of ANTIGRAVITY_CATALOG) {
      if (rule.pillar && !ctx.pillars[rule.pillar]) continue;
      let hit = false;
      if (rule.check) {
        hit = rule.check(ctx);
      } else {
        const byType = rule.types?.includes(ctx.taskType) ?? false;
        const byText = rule.match?.test(ctx.text) ?? false;
        hit = rule.types && rule.match ? byType && byText : byType || byText;
      }
      if (hit) add({ name: rule.name, kind: rule.kind, when: rule.when });
    }

    if (ctx.pillars.phases && ctx.budget === 'thorough') {
      add({
        name: '/plan',
        kind: 'command',
        when: 'Start the session in planning mode so phases are agreed before execution',
      });
    }
    if (ctx.pillars.clarify && ctx.budget === 'thorough') {
      add({
        name: '/grill-me',
        kind: 'command',
        when: 'Resolve design decisions in an interview before building',
      });
    }
    if (ctx.budget === 'thorough' && ctx.tier === 'frontier') {
      add({
        name: '/boost',
        kind: 'command',
        when: 'Deep planning, multiple perspectives, and rigorous verification',
      });
    }
    if (/\b(overnight|long[- ]running|until (it'?s )?done|large project|full app|end[- ]to[- ]end app)\b/i.test(ctx.text)) {
      add({
        name: '/goal',
        kind: 'command',
        when: 'Long run that should not stop until the goal is met',
      });
    }
  }

  return picked;
}
