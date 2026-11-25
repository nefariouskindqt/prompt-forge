import type { ModelProfile } from './models';
import type { RuleSection } from './pillars';
import type { Budget, IdeaTraits, Phase, Question, SkillRef, Target, TaskType } from './types';

const ROLES: Record<TaskType, string> = {
  feature: 'senior software engineer',
  bugfix: 'senior engineer who debugs from evidence, not guesses',
  ui: 'senior product engineer with a strong design eye',
  security: 'application security engineer',
  refactor: 'staff engineer who refactors safely',
  deploy: 'senior platform engineer',
  research: 'technical researcher who cites primary sources',
  data: 'senior data engineer',
  test: 'senior test engineer',
  media: 'senior AI product engineer specializing in generative video, image, and multimodal systems',
  writing: 'senior editor and subject-matter writer',
  strategy: 'principal product strategist',
  automation: 'senior automation and systems engineer',
  general: 'senior domain specialist and clear problem solver',
};

export interface AssembleInput {
  goal: string;
  taskType: TaskType;
  traits: IdeaTraits;
  model: ModelProfile;
  budget: Budget;
  target: Target;
  stack: string[];
  context: string;
  constraints: string[];
  answered: { q: string; a: string }[];
  openQuestions: Question[];
  rules: RuleSection[];
  phases: Phase[];
  skills: SkillRef[];
  gated: boolean;
}

function outputFormat(a: AssembleInput): string[] {
  const lines: string[] = [];
  if (a.target === 'chat') {
    if (a.traits.isCode) {
      lines.push('Give code as complete files or unified diffs, each headed by its file path.');
    }
    if (a.phases.length) lines.push('Finish one phase per reply and wait for me to say "continue".');
  } else if (a.target === 'api') {
    lines.push('Return structured, directly usable output with no conversational filler.');
  }
  if (a.phases.length) {
    lines.push(
      a.budget === 'lean'
        ? 'End each phase with one line of evidence.'
        : 'Start each phase with its name; end it with Done, Evidence, and Next, one line each.',
    );
  }
  if (a.traits.isCode) {
    lines.push(
      a.budget === 'lean'
        ? 'Final reply: files changed and how they were verified.'
        : 'Final reply: files changed, how each was verified (commands, results, and sources), and open risks.',
    );
  } else {
    lines.push(
      a.budget === 'lean'
        ? 'Final reply: the complete deliverable and key verified sources.'
        : 'Final reply: the complete deliverable, verified sources/citations, and open assumptions or next steps.',
    );
  }
  return lines;
}

const bullets = (items: string[]) => items.map((i) => `- ${i}`).join('\n');
const numbered = (items: string[]) => items.map((i, n) => `${n + 1}. ${i}`).join('\n');
const tag = (name: string, body: string) => `<${name}>\n${body}\n</${name}>`;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

function contextBody(a: AssembleInput): string {
  const parts: string[] = [];
  if (a.context.trim()) parts.push(a.context.trim());
  if (a.stack.length) parts.push(`Stack: ${a.stack.join(', ')}`);
  if (a.answered.length) parts.push(a.answered.map(({ q, a: ans }) => `${q}\n${ans}`).join('\n\n'));
  return parts.join('\n\n');
}

function roleLine(a: AssembleInput): string {
  const where: Record<Target, string> = {
    antigravity: ' You work inside Antigravity with file, terminal, and browser tools.',
    ide: ' You work inside a coding IDE/CLI with local repository and terminal access.',
    chat: ' You are working in a chat interface without direct access to local files or a terminal.',
    api: ' Respond cleanly as a reusable system workflow for automated or interactive requests.',
  };
  return `You are a ${ROLES[a.taskType]}.${where[a.target]}`;
}

const PHASE_INTRO = 'Work through these phases in order. Start a phase only when the previous exit criterion is met.';
const GATE = 'After the plan, stop and wait for my approval before executing.';
const OPEN_INTRO = 'Ask these unless the context already answers them:';

function skillsBlock(a: AssembleInput): { intro: string; lines: string[] } | null {
  if (!a.skills.length) return null;
  const hasNative = a.skills.some((s) => s.kind !== 'approach');
  const intro =
    a.target === 'antigravity' && hasNative
      ? 'Apply these approach skills throughout, and load workspace tools/skills when the phase that needs them starts:'
      : 'Apply these domain skills and methodologies so the output is thorough, verified, and free of common failure modes:';
  return { intro, lines: a.skills.map(skillLine) };
}

function skillLine(s: SkillRef): string {
  if (s.kind === 'approach') return `${s.name}: ${s.when}`;
  if (s.kind === 'command') return `${s.name} (slash command, run by me): ${s.when}`;
  if (s.kind === 'skill') return `${s.name}: ${s.when}`;
  return `${s.name} (${s.kind}): ${s.when}`;
}

function renderXml(a: AssembleInput): string {
  const out: string[] = [roleLine(a)];
  const ctx = contextBody(a);
  if (ctx) out.push(tag('context', ctx));
  out.push(tag('goal', a.goal.trim()));
  if (a.constraints.length) out.push(tag('constraints', bullets(a.constraints)));
  if (a.rules.length) {
    out.push(tag('rules', a.rules.map((r) => tag(slug(r.title), bullets(r.items))).join('\n')));
  }
  if (a.openQuestions.length) out.push(tag('open_questions', `${OPEN_INTRO}\n${bullets(a.openQuestions.map((q) => q.text))}`));
  if (a.phases.length) {
    const body = a.phases
      .map((p) => `<phase name="${p.name}">\n${numbered(p.steps)}\nExit: ${p.exit}\n</phase>`)
      .join('\n');
    out.push(tag('phases', `${PHASE_INTRO}${a.gated ? ` ${GATE}` : ''}\n${body}`));
  }
  const sb = skillsBlock(a);
  if (sb) out.push(tag('skills', `${sb.intro}\n${bullets(sb.lines)}`));
  out.push(tag('output_format', bullets(outputFormat(a))));
  return out.join('\n\n');
}

function renderMarkdown(a: AssembleInput, taskLast: boolean): string {
  const out: string[] = [roleLine(a)];
  const ctx = contextBody(a);
  if (!taskLast) out.push(`## Goal\n${a.goal.trim()}`);
  if (ctx) out.push(`## Context\n${ctx}`);
  if (a.constraints.length) out.push(`## Constraints\n${bullets(a.constraints)}`);
  if (a.rules.length) {
    out.push(`## Rules\n${a.rules.map((r) => `**${r.title}**\n${bullets(r.items)}`).join('\n\n')}`);
  }
  if (a.openQuestions.length) out.push(`## Open questions\n${OPEN_INTRO}\n${bullets(a.openQuestions.map((q) => q.text))}`);
  if (a.phases.length) {
    const body = a.phases.map((p, i) => `### ${i + 1}. ${p.name}\n${numbered(p.steps)}\nExit: ${p.exit}`).join('\n\n');
    out.push(`## Phases\n${PHASE_INTRO}${a.gated ? ` ${GATE}` : ''}\n\n${body}`);
  }
  const sb = skillsBlock(a);
  if (sb) out.push(`## Skills\n${sb.intro}\n${bullets(sb.lines)}`);
  out.push(`## Output format\n${bullets(outputFormat(a))}`);
  if (taskLast) out.push(`## Task\n${a.goal.trim()}`);
  return out.join('\n\n');
}

export function assemble(a: AssembleInput): string {
  if (a.model.format === 'xml') return renderXml(a);
  return renderMarkdown(a, a.model.format === 'markdown-last');
}

/** Rough token count: about four characters per token for English and code. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
