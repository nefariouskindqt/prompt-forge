import { AlertTriangle, ChevronDown, ChevronRight, Info, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { PRESETS, type Preset } from '../data/presets';
import {
  MODEL_GROUPS,
  MODELS,
  PILLARS,
  type Budget,
  type LintIssue,
  type ModelId,
  type Pillar,
  type TaskType,
} from '../engine';

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  feature: 'Feature / App',
  media: 'AI media',
  ui: 'UI and UX',
  bugfix: 'Bugfix',
  security: 'Security audit',
  refactor: 'Refactor',
  deploy: 'Deploy',
  data: 'Data and SQL',
  test: 'Testing',
  research: 'Research',
  writing: 'Writing',
  strategy: 'Strategy',
  automation: 'Automation',
  general: 'General idea',
};

const BUDGETS: { id: Budget; label: string }[] = [
  { id: 'lean', label: 'Lean' },
  { id: 'standard', label: 'Standard' },
  { id: 'thorough', label: 'Thorough' },
];

interface ComposerProps {
  goal: string;
  onGoalChange: (value: string) => void;
  model: ModelId;
  onModelChange: (value: ModelId) => void;
  budget: Budget;
  onBudgetChange: (value: Budget) => void;
  taskType: TaskType | 'auto';
  detectedTaskType: TaskType;
  onTaskTypeChange: (value: TaskType | 'auto') => void;
  stack: string;
  onStackChange: (value: string) => void;
  context: string;
  onContextChange: (value: string) => void;
  constraints: string;
  onConstraintsChange: (value: string) => void;
  pillars: Record<Pillar, boolean>;
  onTogglePillar: (key: Pillar) => void;
  onResetPillars: () => void;
  onApplyPreset: (preset: Preset) => void;
  lint: LintIssue[];
}

export function Composer({
  goal,
  onGoalChange,
  model,
  onModelChange,
  budget,
  onBudgetChange,
  taskType,
  detectedTaskType,
  onTaskTypeChange,
  stack,
  onStackChange,
  context,
  onContextChange,
  constraints,
  onConstraintsChange,
  pillars,
  onTogglePillar,
  onResetPillars,
  onApplyPreset,
  lint,
}: ComposerProps) {
  const [contextOpen, setContextOpen] = useState(false);
  const activeCount = PILLARS.filter((p) => pillars[p.key]).length;
  const hasContext = Boolean(stack.trim() || context.trim() || constraints.trim());

  return (
    <section className="column" aria-label="Prompt configuration">
      <div className="card">
        <div className="card-header">
          <label className="section-title" htmlFor="goal-input">
            Goal
          </label>
          <span className="meta">{goal.trim().split(/\s+/).filter(Boolean).length} words</span>
        </div>

        <textarea
          id="goal-input"
          className="textarea"
          value={goal}
          onChange={(e) => onGoalChange(e.target.value)}
          placeholder="Describe any idea — web app, AI video/image tool, bug fix, writing, strategy, or audit — and how you will know it is done"
          rows={4}
        />

        {lint.length > 0 && (
          <div className="lint-list" role="status" aria-live="polite">
            {lint.map((issue) => (
              <div
                key={issue.id}
                className={issue.level === 'warn' ? 'lint-item lint-warn' : 'lint-item'}
              >
                {issue.level === 'warn' ? (
                  <AlertTriangle size={16} strokeWidth={1.5} className="lint-icon" aria-hidden="true" />
                ) : (
                  <Info size={16} strokeWidth={1.5} className="lint-icon" aria-hidden="true" />
                )}
                <div>
                  <span className="lint-msg">{issue.message}</span>
                  <span className="lint-fix">{issue.fix}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="presets" aria-label="Starter examples">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="preset-btn"
              onClick={() => onApplyPreset(preset)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card controls-stack">
        <div className="controls-grid">
          <div className="field">
            <label className="field-label" htmlFor="model-select">
              Model
            </label>
            <select
              id="model-select"
              className="select"
              value={model}
              onChange={(e) => onModelChange(e.target.value as ModelId)}
            >
              {MODEL_GROUPS.map((group) => (
                <optgroup key={group.family} label={group.label}>
                  {group.ids.map((id) => (
                    <option key={id} value={id}>
                      {MODELS[id].label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="task-select">
              Idea type
            </label>
            <select
              id="task-select"
              className="select"
              value={taskType}
              onChange={(e) => onTaskTypeChange(e.target.value as TaskType | 'auto')}
            >
              <option value="auto">Auto ({TASK_TYPE_LABELS[detectedTaskType]})</option>
              {(Object.keys(TASK_TYPE_LABELS) as TaskType[]).map((type) => (
                <option key={type} value={type}>
                  {TASK_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <span className="field-label" id="budget-label">
            Token budget
          </span>
          <div className="segmented segmented-full" role="group" aria-labelledby="budget-label">
            {BUDGETS.map((b) => (
              <button
                key={b.id}
                type="button"
                className="seg-btn"
                aria-pressed={budget === b.id}
                onClick={() => onBudgetChange(b.id)}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card card-tight">
        <button
          type="button"
          className="drawer-toggle"
          aria-expanded={contextOpen}
          onClick={() => setContextOpen((v) => !v)}
        >
          <span className="drawer-toggle-left">
            {contextOpen ? (
              <ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <ChevronRight size={16} strokeWidth={1.5} aria-hidden="true" />
            )}
            <span>Context and constraints</span>
          </span>
          <span className="meta">{hasContext ? 'Set' : 'Optional'}</span>
        </button>

        {contextOpen && (
          <div className="drawer-body">
            <div className="field">
              <label className="field-label" htmlFor="stack-input">
                Tools or stack
              </label>
              <input
                id="stack-input"
                type="text"
                className="input"
                value={stack}
                onChange={(e) => onStackChange(e.target.value)}
                placeholder="React 19, Gemini API, Notion, or leave blank for non-code ideas"
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="constraints-input">
                Constraints
              </label>
              <textarea
                id="constraints-input"
                className="textarea textarea-compact"
                value={constraints}
                onChange={(e) => onConstraintsChange(e.target.value)}
                placeholder="One per line or separated by semicolons"
                rows={2}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="context-input">
                Background context
              </label>
              <textarea
                id="context-input"
                className="textarea textarea-compact"
                value={context}
                onChange={(e) => onContextChange(e.target.value)}
                placeholder="Audience, key files, existing APIs, or reference notes"
                rows={2}
              />
            </div>
          </div>
        )}
      </div>

      <div className="card card-tight">
        <div className="card-header">
          <h2 className="section-title">Quality modules</h2>
          <div className="card-header-actions">
            <span className="meta">
              {activeCount} / {PILLARS.length}
            </span>
            {activeCount < PILLARS.length && (
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={onResetPillars}
                title="Enable all quality modules"
              >
                <RotateCcw size={14} strokeWidth={1.5} aria-hidden="true" />
                <span>All</span>
              </button>
            )}
          </div>
        </div>

        <div className="pillars-grid">
          {PILLARS.map((p) => {
            const on = pillars[p.key];
            return (
              <button
                key={p.key}
                type="button"
                className="pillar-row"
                aria-pressed={on}
                onClick={() => onTogglePillar(p.key)}
              >
                <span className="pillar-info">
                  <span className="pillar-label">{p.label}</span>
                  <span className="pillar-hint">{p.hint}</span>
                </span>
                <span className="toggle-dot" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
