import type { Budget, ModelId, Target, TaskType } from '../engine';

export interface Preset {
  id: string;
  label: string;
  goal: string;
  stack: string;
  constraints: string;
  model: ModelId;
  budget: Budget;
  target: Target;
  taskType: TaskType | 'auto';
}

export const PRESETS: Preset[] = [
  {
    id: 'ai-media',
    label: 'AI video & image app',
    goal: 'Create a web app that makes AI videos and images with prompt controls and downloads, and once the web app is done check and verify all sources, SDK versions, and model IDs.',
    stack: 'React 19, TypeScript, Node.js',
    constraints: 'Keep API keys server-side; handle slow async video jobs with progress and cancel states',
    model: 'gemini-neon',
    budget: 'standard',
    target: 'chat',
    taskType: 'auto',
  },
  {
    id: 'feature',
    label: 'Invoice CSV export',
    goal: 'Add CSV export to the invoices table in our React billing app so finance can reconcile monthly totals. Done when exported rows match active filters and 10k rows download in under 2 seconds.',
    stack: 'React 19, TypeScript, Vite',
    constraints: 'Client-side export only; escape formula injection cells (=, +, -, @)',
    model: 'gpt-5',
    budget: 'standard',
    target: 'ide',
    taskType: 'auto',
  },
  {
    id: 'creative',
    label: 'Launch strategy & script',
    goal: 'Write a go-to-market launch plan and a 90-second demo video script for an indie developer tool, citing verified benchmarks and competitor pricing.',
    stack: '',
    constraints: 'Direct, non-hype voice; under 1,200 words total; verify every public pricing claim',
    model: 'claude-fable',
    budget: 'standard',
    target: 'chat',
    taskType: 'auto',
  },
  {
    id: 'security',
    label: 'API + Firestore audit',
    goal: 'Audit our Express billing API and firestore.rules for OWASP Top 10 flaws, broken object-level authorization, and secret leaks. Done when every high finding has a failing exploit test and a fix.',
    stack: 'Node.js, Express, TypeScript, Firebase, Firestore',
    constraints: 'Do not break existing v1 mobile clients',
    model: 'claude-opus',
    budget: 'thorough',
    target: 'antigravity',
    taskType: 'auto',
  },
];
