import { describe, expect, it } from 'vitest';
import { detectStack, detectTaskType } from './detect';
import { forge, MODELS, type ForgeInput } from './index';
import { buildPhases } from './phases';
import { lintGoal } from './questions';

const base: ForgeInput = {
  goal: 'Add CSV export to the invoices table in our React dashboard so finance can reconcile monthly',
  model: 'claude-sonnet',
  budget: 'standard',
  target: 'antigravity',
};

describe('detectTaskType', () => {
  it.each([
    ['Fix the crash when saving settings, TypeError in Save.tsx', 'bugfix'],
    ['Redesign the landing page hero and navbar', 'ui'],
    ['Run an OWASP security audit on the auth endpoints', 'security'],
    ['Refactor the billing module to remove tech debt', 'refactor'],
    ['Deploy the app to Firebase Hosting with a CI/CD pipeline', 'deploy'],
    ['Compare Zustand vs Redux and recommend one', 'research'],
    ['Design the Postgres schema for orders and write the migration', 'data'],
    ['Write unit tests with vitest for the cart reducer', 'test'],
    ['Add a share button that copies a link', 'feature'],
    ['Create a web app that makes ai videos and images and once the web app is done check and verify all sources', 'media'],
    ['Write a blog post and newsletter copy announcing our pricing update', 'writing'],
    ['Build a go-to-market business plan and roadmap for a developer startup', 'strategy'],
    ['Build an n8n workflow automation that syncs Stripe invoices to Slack', 'automation'],
    ['Help me organize a 3-day family road trip with calm daily stops', 'general'],
  ])('%s -> %s', (text, type) => {
    expect(detectTaskType(text)).toBe(type);
  });
});

describe('detectStack', () => {
  it('finds frameworks and ignores the verb "go"', () => {
    expect(detectStack('React + Vite + Tailwind, deploy to Firebase. Go live Friday')).toEqual([
      'React',
      'Vite',
      'Tailwind',
      'Firebase',
    ]);
  });
  it('detects Go when named as a language', () => {
    expect(detectStack('write the service in Go with Postgres')).toEqual(['Go', 'PostgreSQL']);
  });
});

describe('forge', () => {
  it('formats Claude (including Fable) with XML, Gemini with task last, and GPT with Goal first', () => {
    const claude = forge(base).prompt;
    expect(claude).toContain('<goal>');
    expect(claude).toContain('<phases>');
    expect(claude).not.toContain('## Task');

    const fable = forge({ ...base, model: 'claude-fable' }).prompt;
    expect(fable).toContain('<goal>');
    expect(fable).toContain('original craft');

    const gemini = forge({ ...base, model: 'gemini-neon' }).prompt;
    expect(gemini).toContain('## Phases');
    expect(gemini).not.toContain('<goal>');
    expect(gemini.trimEnd().endsWith(base.goal)).toBe(true);

    const gpt5 = forge({ ...base, model: 'gpt-5' }).prompt;
    expect(gpt5).toContain('## Goal');
    expect(gpt5.indexOf('## Goal')).toBeLessThan(gpt5.indexOf('## Phases'));
    expect(gpt5).not.toContain('<goal>');

    const o3 = forge({ ...base, model: 'o3' }).prompt;
    expect(o3).toContain('## Goal');
    expect(o3).toContain('hard constraints');
  });

  it('returns an empty prompt for an empty goal', () => {
    const r = forge({ ...base, goal: '   ' });
    expect(r.prompt).toBe('');
    expect(r.tokens).toBe(0);
  });

  it('lean is shorter than standard, which is shorter than thorough', () => {
    const t = (budget: ForgeInput['budget']) => forge({ ...base, budget }).tokens;
    expect(t('lean')).toBeLessThan(t('standard'));
    expect(t('standard')).toBeLessThan(t('thorough'));
  });

  it('every pillar can be switched off', () => {
    const r = forge({
      ...base,
      pillars: { tokens: false, unslop: false, clarify: false, model: false, security: false, uiux: false, phases: false, grounding: false, skills: false },
    });
    expect(r.prompt).not.toContain('<rules>');
    expect(r.prompt).not.toContain('<phases>');
    expect(r.prompt).not.toContain('<skills>');
    expect(r.prompt).not.toContain('<open_questions>');
    expect(r.skills).toEqual([]);
  });

  it('adapts to AI video & image web app + source verification in Chat mode with portable skills', () => {
    const r = forge({
      goal: 'Create a web app that makes ai videos and images and once the web app is done check and verify all sources',
      model: 'gpt-5',
      budget: 'standard',
      target: 'chat',
    });
    expect(r.taskType).toBe('media');
    expect(r.traits.hasAiMedia).toBe(true);
    expect(r.traits.hasSourceVerify).toBe(true);
    expect(r.traits.hasUi).toBe(true);

    // Even in chat mode, portable approach skills are routed and embedded in the prompt.
    const names = r.skills.map((s) => s.name);
    expect(names).toEqual(
      expect.arrayContaining(['AI media pipeline', 'Source and claim verification', 'Design craft and UI states']),
    );
    expect(r.skills.every((s) => s.kind === 'approach')).toBe(true);
    expect(r.prompt).toContain('## Skills');
    expect(r.prompt).toContain('AI media pipeline');
    expect(r.prompt).toContain('Verify sources');
  });

  it('adapts smoothly to non-coding ideas without forcing code rules or stack questions', () => {
    const r = forge({
      goal: 'Write a go-to-market business plan and launch script for a local specialty coffee roaster',
      model: 'claude-fable',
      budget: 'standard',
      target: 'chat',
    });
    expect(r.traits.isCode).toBe(false);
    expect(r.prompt).not.toContain('parameterized queries');
    expect(r.prompt).not.toContain('typecheck');
    expect(r.prompt).toContain('<draft_quality>');
    expect(r.questions.map((q) => q.id)).not.toContain('stack');
    expect(r.skills.map((s) => s.name)).toContain('Editorial clarity and structure');
  });

  it('supports Coding IDE and API target runtimes with tailored skills and framing', () => {
    const ide = forge({ ...base, target: 'ide', model: 'gpt-4.1' });
    expect(ide.prompt).toContain('coding IDE/CLI');
    expect(ide.skills.map((s) => s.name)).toContain('Workspace context scan');

    const api = forge({ ...base, target: 'api', model: 'claude-sonnet' });
    expect(api.prompt).toContain('reusable system workflow');
    expect(api.skills.length).toBeGreaterThan(0);
  });

  it('adds UI rules only when there is a UI', () => {
    expect(forge(base).prompt).toContain('<ui_and_ux>');
    const backend = forge({ ...base, goal: 'Add rate limiting to the Express API so each key gets 100 requests per minute' });
    expect(backend.prompt).not.toContain('<ui_and_ux>');
  });

  it('moves answered questions into context and keeps the rest open', () => {
    const first = forge({ ...base, goal: 'Build an invoices page' });
    const ids = first.questions.map((q) => q.id);
    expect(ids).toContain('stack');
    const r = forge({ ...base, goal: 'Build an invoices page', answers: { stack: 'Svelte 5 and Vite' } });
    expect(r.questions.map((q) => q.id)).toContain('stack');
    expect(r.prompt).toContain('Svelte 5 and Vite');
    expect(r.prompt).not.toMatch(/<open_questions>[\s\S]*What stack and versions/);
  });

  it('routes Antigravity-native skills on top of portable skills for Antigravity', () => {
    const ui = forge({ ...base, goal: 'Redesign the analytics dashboard screen in React', budget: 'thorough', model: 'claude-opus' });
    const names = ui.skills.map((s) => s.name);
    expect(names).toEqual(
      expect.arrayContaining(['Design craft and UI states', 'unslop', 'a11y-debugging', 'browser', 'context7-mcp', '/plan', '/boost']),
    );
    expect(ui.prompt).not.toContain('/boost');
  });

  it('routes firestore rules work to the mandatory subagent', () => {
    const r = forge({ ...base, goal: 'Lock down firestore.rules so users only read their own orders' });
    expect(r.skills.map((s) => s.name)).toContain('firestore-rules-author');
  });

  it('honors an explicit task type over detection', () => {
    const r = forge({ ...base, taskType: 'security' });
    expect(r.taskType).toBe('security');
    expect(r.detectedTaskType).toBe('feature');
  });

  it('does not repeat a detected framework the user already typed', () => {
    const r = forge({ ...base, goal: 'Fix the React crash on save', stack: 'React 19, TypeScript' });
    expect(r.stack).toEqual(['React 19', 'TypeScript']);
  });

  it('keeps UI rules out of bugfix prompts', () => {
    const r = forge({ ...base, goal: 'Fix the crash when saving settings in the React app', budget: 'lean' });
    expect(r.taskType).toBe('bugfix');
    expect(r.prompt).not.toContain('<ui_and_ux>');
  });

  it('caps oversized input', () => {
    const r = forge({ ...base, goal: 'x '.repeat(20000) });
    expect(r.prompt.length).toBeLessThan(30000);
  });

  it('tells chat models to hand over commands instead of running them', () => {
    expect(forge({ ...base, target: 'chat' }).prompt).toContain('ask me to paste the output');
  });
});

describe('buildPhases', () => {
  it('fits fast models without losing harden or verify work', () => {
    const phases = buildPhases('feature', 'standard', MODELS['claude-haiku'].maxPhases);
    expect(phases.length).toBeLessThanOrEqual(4);
    const steps = phases.flatMap((p) => p.steps).join(' ');
    expect(steps).toContain('unslop pass');
    expect(steps).toContain('run the full suite');
  });
  it('gates the plan on the thorough budget', () => {
    expect(forge({ ...base, budget: 'thorough' }).prompt).toContain('wait for my approval');
    expect(forge({ ...base, budget: 'standard' }).prompt).not.toContain('wait for my approval');
  });
});

describe('lintGoal', () => {
  it('flags short, vague and shouting goals', () => {
    const ids = lintGoal('Make it BETTER. NEVER fail, IMPORTANT').map((i) => i.id);
    expect(ids).toEqual(expect.arrayContaining(['short', 'vague', 'shouting', 'criteria']));
  });
  it('passes a specific goal', () => {
    const ids = lintGoal(
      'Add CSV export to the invoices table; done when the file matches the on-screen rows and the export of 10k rows finishes within 2s',
    ).map((i) => i.id);
    expect(ids).toEqual([]);
  });
});
