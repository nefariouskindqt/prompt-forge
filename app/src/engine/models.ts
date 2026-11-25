import type { ModelId } from './types';

export interface ModelProfile {
  id: ModelId;
  label: string;
  family: 'claude' | 'gemini' | 'gpt';
  tier: 'frontier' | 'balanced' | 'fast';
  /**
   * Claude reads XML-tagged sections best;
   * Gemini reads Markdown headings best with the task anchored last;
   * GPT reads Markdown headings best with the objective up front.
   */
  format: 'xml' | 'markdown-last' | 'markdown-first';
  maxPhases: number;
  /** Model-specific working rules, added when the "model" pillar is on. */
  rules: string[];
}

const claudeShared = [
  'Explain the reason behind a non-obvious choice in one line so the next reader can verify it.',
  'Prefer clean, general solutions over brittle special-casing.',
];

const geminiShared = [
  'State every assumption explicitly before acting on it.',
  'Follow the output format exactly; be direct and skip filler or persuasive language.',
];

const gptShared = [
  'Follow each constraint literally and check your work against the acceptance criteria before finishing.',
  'Keep reasoning structured and concise; surface blockers or trade-offs plainly.',
];

export const MODELS: Record<ModelId, ModelProfile> = {
  'claude-opus': {
    id: 'claude-opus',
    label: 'Claude Opus',
    family: 'claude',
    tier: 'frontier',
    format: 'xml',
    maxPhases: 6,
    rules: [
      ...claudeShared,
      'Think through trade-offs before committing to a design, then act without asking permission for each step; stop only at the gates below.',
      'Add only what the task needs: no extra files, abstractions, or options nobody asked for.',
    ],
  },
  'claude-sonnet': {
    id: 'claude-sonnet',
    label: 'Claude Sonnet',
    family: 'claude',
    tier: 'balanced',
    format: 'xml',
    maxPhases: 6,
    rules: [
      ...claudeShared,
      'Run independent reads and searches in parallel; run dependent steps in order.',
      'Keep each change scoped to the current phase.',
    ],
  },
  'claude-haiku': {
    id: 'claude-haiku',
    label: 'Claude Haiku',
    family: 'claude',
    tier: 'fast',
    format: 'xml',
    maxPhases: 4,
    rules: [
      'Do the numbered steps in order and nothing else.',
      'If a step is unclear, stop and ask instead of guessing.',
    ],
  },
  'claude-fable': {
    id: 'claude-fable',
    label: 'Claude Fable',
    family: 'claude',
    tier: 'frontier',
    format: 'xml',
    maxPhases: 6,
    rules: [
      ...claudeShared,
      'Bring original craft, clear voice, and cohesive structure to creative, design, and product decisions while staying grounded in real constraints.',
      'Keep tone natural and specific; cut clichés, hype, and decorative fluff.',
    ],
  },
  'gemini-carbon': {
    id: 'gemini-carbon',
    label: 'Gemini 4 Carbon',
    family: 'gemini',
    tier: 'frontier',
    format: 'markdown-last',
    maxPhases: 6,
    rules: [
      ...geminiShared,
      'Use deep reasoning for design, verification, and root-cause work; keep the written answer tight.',
      'Add only what the task needs: no extra files, abstractions, or options nobody asked for.',
    ],
  },
  'gemini-neon': {
    id: 'gemini-neon',
    label: 'Gemini 4 Neon',
    family: 'gemini',
    tier: 'frontier',
    format: 'markdown-last',
    maxPhases: 6,
    rules: [...geminiShared, 'Finish each phase completely before starting the next.'],
  },
  'gemini-argon': {
    id: 'gemini-argon',
    label: 'Gemini 4 Argon',
    family: 'gemini',
    tier: 'balanced',
    format: 'markdown-last',
    maxPhases: 5,
    rules: [...geminiShared, 'Prefer small, verifiable increments over large rewrites.'],
  },
  'gemini-hydrogen': {
    id: 'gemini-hydrogen',
    label: 'Gemini 4 Hydrogen',
    family: 'gemini',
    tier: 'balanced',
    format: 'markdown-last',
    maxPhases: 5,
    rules: [...geminiShared, 'Prefer small, verifiable increments over large rewrites.'],
  },
  'gemini-flash-lite': {
    id: 'gemini-flash-lite',
    label: 'Gemini 3.5 Flash-Lite',
    family: 'gemini',
    tier: 'fast',
    format: 'markdown-last',
    maxPhases: 4,
    rules: [
      'Do the numbered steps in order and nothing else.',
      'If a step is unclear, stop and ask instead of guessing.',
    ],
  },
  'gpt-5': {
    id: 'gpt-5',
    label: 'GPT-5',
    family: 'gpt',
    tier: 'frontier',
    format: 'markdown-first',
    maxPhases: 6,
    rules: [
      ...gptShared,
      'Think carefully through architecture, edge cases, and verification before executing; avoid unrequested scope expansion.',
    ],
  },
  'gpt-5-mini': {
    id: 'gpt-5-mini',
    label: 'GPT-5 mini',
    family: 'gpt',
    tier: 'balanced',
    format: 'markdown-first',
    maxPhases: 5,
    rules: [...gptShared, 'Execute in short, verifiable steps and confirm each exit check before moving on.'],
  },
  'gpt-4.1': {
    id: 'gpt-4.1',
    label: 'GPT-4.1',
    family: 'gpt',
    tier: 'balanced',
    format: 'markdown-first',
    maxPhases: 5,
    rules: [
      ...gptShared,
      'Follow explicit instructions and edge-case rules strictly; when requirements conflict, flag the conflict and ask.',
    ],
  },
  o3: {
    id: 'o3',
    label: 'OpenAI o3',
    family: 'gpt',
    tier: 'frontier',
    format: 'markdown-first',
    maxPhases: 5,
    rules: [
      'Focus on the end goal, hard constraints, and verifiable exit criteria; skip redundant narration of intermediate reasoning.',
      'Verify every critical claim, calculation, or dependency before presenting the final output.',
    ],
  },
};

export const MODEL_GROUPS: { family: 'claude' | 'gemini' | 'gpt'; label: string; ids: ModelId[] }[] = [
  { family: 'claude', label: 'Claude', ids: ['claude-opus', 'claude-sonnet', 'claude-haiku', 'claude-fable'] },
  {
    family: 'gemini',
    label: 'Gemini',
    ids: ['gemini-carbon', 'gemini-neon', 'gemini-argon', 'gemini-hydrogen', 'gemini-flash-lite'],
  },
  { family: 'gpt', label: 'GPT / OpenAI', ids: ['gpt-5', 'gpt-5-mini', 'gpt-4.1', 'o3'] },
];
