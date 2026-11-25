import { Check, Copy, Download, X } from 'lucide-react';
import { useState } from 'react';
import { MODELS, type Budget, type ForgeResult, type ModelId } from '../engine';

type Tab = 'prompt' | 'questions' | 'phases' | 'skills';

const FAMILY_LABELS = {
  claude: 'Claude',
  gemini: 'Gemini',
  gpt: 'GPT',
} as const;

interface WorkbenchProps {
  result: ForgeResult;
  model: ModelId;
  budget: Budget;
  onBudgetChange: (b: Budget) => void;
  budgetTokens: Record<Budget, number>;
  answers: Record<string, string>;
  onAnswerChange: (id: string, value: string) => void;
  copyError: string | null;
  onDismissError: () => void;
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
}

function PromptLines({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <pre className="prompt-canvas" tabIndex={0} aria-label="Compiled prompt">
      {lines.map((line, i) => {
        let cls = 'prompt-line';
        const trimmed = line.trim();
        if (/^<\/?[a-z_]+(?:\s+name="[^"]+")?>$/.test(trimmed)) {
          cls += ' prompt-line-tag';
        } else if (/^#{2,3}\s/.test(trimmed)) {
          cls += ' prompt-line-heading';
        } else if (/^\*\*[^*]+\*\*$/.test(trimmed)) {
          cls += ' prompt-line-sub';
        } else if (/^Exit:\s/.test(trimmed)) {
          cls += ' prompt-line-exit';
        }
        return (
          <span key={i} className={cls}>
            {line === '' ? '\n' : `${line}\n`}
          </span>
        );
      })}
    </pre>
  );
}

export function Workbench({
  result,
  model,
  budget,
  onBudgetChange,
  budgetTokens,
  answers,
  onAnswerChange,
  copyError,
  onDismissError,
  copied,
  onCopy,
  onDownload,
}: WorkbenchProps) {
  const [tab, setTab] = useState<Tab>('prompt');
  const profile = MODELS[model];
  const formatLabel = profile.format === 'xml' ? 'XML' : 'Markdown';
  const openCount = result.questions.filter((q) => !answers[q.id]?.trim()).length;
  const approachSkills = result.skills.filter((s) => s.kind === 'approach');
  const commandSkills = result.skills.filter((s) => s.kind === 'command');
  const workspaceSkills = result.skills.filter((s) => s.kind !== 'approach' && s.kind !== 'command');

  return (
    <section className="column" aria-label="Prompt workbench">
      <div className="workbench-card">
        <div className="wb-header">
          <div className="wb-stats">
            <div className="stat-primary">
              <span className="stat-value">~{result.tokens.toLocaleString()}</span>
              <span className="stat-unit">tokens</span>
            </div>
            <div className="stat-meta-row">
              <span className="family-tag">
                <span className="family-dot" aria-hidden="true" />
                <span>{FAMILY_LABELS[profile.family]}</span>
              </span>
              <span className="stat-divider" aria-hidden="true" />
              <span>{formatLabel}</span>
              <span className="stat-divider" aria-hidden="true" />
              <span>{result.taskType}</span>
              {result.stack.length > 0 && (
                <>
                  <span className="stat-divider" aria-hidden="true" />
                  <span>{result.stack.slice(0, 3).join(', ')}</span>
                </>
              )}
            </div>
          </div>

          <div className="wb-actions">
            <button
              type="button"
              className="btn btn-sm btn-icon"
              disabled={!result.prompt}
              onClick={onDownload}
              aria-label="Download prompt as Markdown"
              title="Download prompt as Markdown"
            >
              <Download size={16} strokeWidth={1.5} aria-hidden="true" />
            </button>

            <button
              type="button"
              className="btn btn-sm btn-primary"
              disabled={!result.prompt}
              onClick={onCopy}
            >
              {copied ? (
                <Check size={16} strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <Copy size={16} strokeWidth={1.5} aria-hidden="true" />
              )}
              <span>{copied ? 'Copied' : 'Copy prompt'}</span>
              <kbd className="kbd">Ctrl+Shift+C</kbd>
            </button>
          </div>
        </div>

        <div className="tabs" role="tablist" aria-label="Prompt views">
          <button
            type="button"
            role="tab"
            className="tab-btn"
            aria-selected={tab === 'prompt'}
            onClick={() => setTab('prompt')}
          >
            <span>Prompt</span>
          </button>
          <button
            type="button"
            role="tab"
            className="tab-btn"
            aria-selected={tab === 'questions'}
            onClick={() => setTab('questions')}
          >
            <span>Questions</span>
            <span className="tab-count">{openCount}</span>
          </button>
          <button
            type="button"
            role="tab"
            className="tab-btn"
            aria-selected={tab === 'phases'}
            onClick={() => setTab('phases')}
          >
            <span>Phases</span>
            <span className="tab-count">{result.phases.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            className="tab-btn"
            aria-selected={tab === 'skills'}
            onClick={() => setTab('skills')}
          >
            <span>Skills</span>
            <span className="tab-count">{result.skills.length}</span>
          </button>
        </div>

        <div className="wb-body" role="tabpanel">
          {copyError && (
            <div className="error-bar" role="alert">
              <span>{copyError}</span>
              <button
                type="button"
                className="btn btn-sm btn-ghost btn-icon"
                onClick={onDismissError}
                aria-label="Dismiss error"
              >
                <X size={16} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
          )}

          {tab === 'prompt' &&
            (result.prompt ? (
              <PromptLines text={result.prompt} />
            ) : (
              <div className="empty-state">
                <h2 className="empty-title">Describe your idea on the left</h2>
                <p className="empty-desc">
                  Prompt Forge compiles any request into a model-tuned, phased prompt offline for
                  Claude, Gemini, or GPT across Antigravity, coding IDEs, web chat, or APIs.
                </p>
              </div>
            ))}

          {tab === 'questions' && (
            <div className="questions-list">
              {result.questions.length === 0 ? (
                <p className="empty-desc">
                  No open questions for this configuration. Add a goal to generate clarifying
                  questions.
                </p>
              ) : (
                result.questions.map((q) => {
                  const val = answers[q.id] ?? '';
                  const answered = Boolean(val.trim());
                  return (
                    <div
                      key={q.id}
                      className={
                        answered ? 'question-card question-card-answered' : 'question-card'
                      }
                    >
                      <label className="question-text" htmlFor={`q-${q.id}`}>
                        {q.text}
                      </label>
                      <span className="question-why">{q.why}</span>
                      <input
                        id={`q-${q.id}`}
                        type="text"
                        className="input"
                        value={val}
                        onChange={(e) => onAnswerChange(q.id, e.target.value)}
                        placeholder={q.placeholder}
                      />
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === 'phases' && (
            <div className="phases-list">
              {result.phases.length === 0 ? (
                <p className="empty-desc">
                  Phased planning is switched off. Enable Phased plan in Quality modules to build
                  step-by-step gates.
                </p>
              ) : (
                result.phases.map((phase, index) => {
                  const gated = budget === 'thorough' && phase.name === 'Plan';
                  return (
                    <div
                      key={phase.name}
                      className={gated ? 'phase-card phase-card-gated' : 'phase-card'}
                    >
                      <div className="phase-head">
                        <div className="phase-name">
                          <span className="phase-num">0{index + 1}</span>
                          <span>{phase.name}</span>
                        </div>
                        {gated && <span className="meta">Approval gate</span>}
                      </div>
                      <ol className="phase-steps">
                        {phase.steps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                      <div className="phase-exit">
                        <strong>Exit</strong>
                        <span>{phase.exit}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === 'skills' && (
            <div>
              {result.skills.length === 0 ? (
                <p className="empty-desc">
                  No skills active. Enable Use skills in Quality modules to embed portable approach
                  skills and workspace tools into your prompt.
                </p>
              ) : (
                <>
                  {approachSkills.length > 0 && (
                    <div className="skills-group">
                      <h3 className="section-title">Portable skills embedded in prompt (all workspaces)</h3>
                      {approachSkills.map((s) => (
                        <div key={s.name} className="skill-row">
                          <span className="skill-name">
                            <span>{s.name}</span>
                            <span className="skill-kind">approach</span>
                          </span>
                          <span className="skill-when">{s.when}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {commandSkills.length > 0 && (
                    <div className="skills-group">
                      <h3 className="section-title">Start the session with</h3>
                      {commandSkills.map((s) => (
                        <div key={s.name} className="skill-row">
                          <span className="skill-name">
                            <span>{s.name}</span>
                            <span className="skill-kind">command</span>
                          </span>
                          <span className="skill-when">{s.when}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {workspaceSkills.length > 0 && (
                    <div className="skills-group">
                      <h3 className="section-title">Workspace tools and skills</h3>
                      {workspaceSkills.map((s) => (
                        <div key={s.name} className="skill-row">
                          <span className="skill-name">
                            <span>{s.name}</span>
                            <span className="skill-kind">{s.kind}</span>
                          </span>
                          <span className="skill-when">{s.when}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="budget-strip" aria-label="Token budget comparison">
          {(['lean', 'standard', 'thorough'] as Budget[]).map((b) => (
            <button
              key={b}
              type="button"
              className="budget-cell"
              aria-pressed={budget === b}
              onClick={() => onBudgetChange(b)}
            >
              <span className="budget-cell-label">
                {b === 'lean' ? 'Lean' : b === 'standard' ? 'Standard' : 'Thorough'}
              </span>
              <span className="budget-cell-tokens">
                ~{budgetTokens[b].toLocaleString()} tok
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
