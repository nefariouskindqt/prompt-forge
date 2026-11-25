export type ModelId =
  | 'claude-opus'
  | 'claude-sonnet'
  | 'claude-haiku'
  | 'claude-fable'
  | 'gemini-carbon'
  | 'gemini-neon'
  | 'gemini-argon'
  | 'gemini-hydrogen'
  | 'gemini-flash-lite'
  | 'gpt-5'
  | 'gpt-5-mini'
  | 'gpt-4.1'
  | 'o3';

export type Budget = 'lean' | 'standard' | 'thorough';

export type Target = 'antigravity' | 'ide' | 'chat' | 'api';

export type TaskType =
  | 'feature'
  | 'bugfix'
  | 'ui'
  | 'security'
  | 'refactor'
  | 'deploy'
  | 'research'
  | 'data'
  | 'test'
  | 'media'
  | 'writing'
  | 'strategy'
  | 'automation'
  | 'general';

/** Cross-cutting capabilities detected in any user idea. */
export interface IdeaTraits {
  isCode: boolean;
  hasUi: boolean;
  hasAiMedia: boolean;
  hasSourceVerify: boolean;
  hasApiOrBackend: boolean;
  hasAutomation: boolean;
}

/** The nine quality modules a prompt can carry. */
export type Pillar =
  | 'tokens'
  | 'unslop'
  | 'clarify'
  | 'model'
  | 'security'
  | 'uiux'
  | 'phases'
  | 'grounding'
  | 'skills';

export interface ForgeInput {
  goal: string;
  model: ModelId;
  budget: Budget;
  target: Target;
  taskType?: TaskType | 'auto';
  stack?: string;
  context?: string;
  constraints?: string;
  pillars?: Partial<Record<Pillar, boolean>>;
  /** Answers to pre-flight questions, keyed by question id. */
  answers?: Record<string, string>;
}

export interface Question {
  id: string;
  text: string;
  why: string;
  placeholder: string;
}

export interface SkillRef {
  name: string;
  kind: 'approach' | 'skill' | 'command' | 'subagent' | 'mcp';
  when: string;
}

export interface LintIssue {
  id: string;
  level: 'warn' | 'info';
  message: string;
  fix: string;
}

export interface Phase {
  name: string;
  steps: string[];
  exit: string;
}

export interface ForgeResult {
  prompt: string;
  tokens: number;
  taskType: TaskType;
  detectedTaskType: TaskType;
  traits: IdeaTraits;
  stack: string[];
  questions: Question[];
  skills: SkillRef[];
  lint: LintIssue[];
  phases: Phase[];
}
