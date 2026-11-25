import { useCallback, useEffect, useMemo, useState } from 'react';
import { Composer } from './components/Composer';
import { Footer } from './components/Footer';
import { TermsModal } from './components/TermsModal';
import { TopBar } from './components/TopBar';
import { Workbench } from './components/Workbench';
import { PRESETS, type Preset } from './data/presets';
import {
  ALL_PILLARS_ON,
  forge,
  MODELS,
  type Budget,
  type ModelId,
  type Pillar,
  type Target,
  type TaskType,
} from './engine';

function initialTheme(): 'dark' | 'light' {
  try {
    const saved = window.localStorage.getItem('pf-theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Ignore storage access errors in restricted frames.
  }
  return 'dark';
}

export function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(initialTheme);
  const [target, setTarget] = useState<Target>(PRESETS[0].target);
  const [goal, setGoal] = useState(PRESETS[0].goal);
  const [model, setModel] = useState<ModelId>(PRESETS[0].model);
  const [budget, setBudget] = useState<Budget>(PRESETS[0].budget);
  const [taskType, setTaskType] = useState<TaskType | 'auto'>(PRESETS[0].taskType);
  const [stack, setStack] = useState(PRESETS[0].stack);
  const [context, setContext] = useState('');
  const [constraints, setConstraints] = useState(PRESETS[0].constraints);
  const [pillars, setPillars] = useState<Record<Pillar, boolean>>({ ...ALL_PILLARS_ON });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [termsOpen, setTermsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem('pf-theme', theme);
    } catch {
      // Ignore storage access errors.
    }
  }, [theme]);

  const input = useMemo(
    () => ({
      goal,
      model,
      budget,
      target,
      taskType,
      stack,
      context,
      constraints,
      pillars,
      answers,
    }),
    [goal, model, budget, target, taskType, stack, context, constraints, pillars, answers],
  );

  const result = useMemo(() => forge(input), [input]);
  const family = MODELS[model].family;

  const budgetTokens = useMemo(
    () => ({
      lean: budget === 'lean' ? result.tokens : forge({ ...input, budget: 'lean' }).tokens,
      standard:
        budget === 'standard' ? result.tokens : forge({ ...input, budget: 'standard' }).tokens,
      thorough:
        budget === 'thorough' ? result.tokens : forge({ ...input, budget: 'thorough' }).tokens,
    }),
    [input, budget, result.tokens],
  );

  const handleCopy = useCallback(async () => {
    if (!result.prompt) return;
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(result.prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError('Clipboard access was blocked by the browser. Select the prompt text and copy manually.');
    }
  }, [result.prompt]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        void handleCopy();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleCopy]);

  const handleDownload = useCallback(() => {
    if (!result.prompt) return;
    const blob = new Blob([result.prompt], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prompt-${result.taskType}-${model}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [result.prompt, result.taskType, model]);

  const applyPreset = useCallback((preset: Preset) => {
    setGoal(preset.goal);
    setStack(preset.stack);
    setConstraints(preset.constraints);
    setContext('');
    setModel(preset.model);
    setBudget(preset.budget);
    setTarget(preset.target);
    setTaskType(preset.taskType);
    setAnswers({});
  }, []);

  return (
    <div className="shell" data-family={family}>
      <TopBar
        target={target}
        onTargetChange={setTarget}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      />

      <main className="workspace">
        <Composer
          goal={goal}
          onGoalChange={setGoal}
          model={model}
          onModelChange={setModel}
          budget={budget}
          onBudgetChange={setBudget}
          taskType={taskType}
          detectedTaskType={result.detectedTaskType}
          onTaskTypeChange={setTaskType}
          stack={stack}
          onStackChange={setStack}
          context={context}
          onContextChange={setContext}
          constraints={constraints}
          onConstraintsChange={setConstraints}
          pillars={pillars}
          onTogglePillar={(key) => setPillars((prev) => ({ ...prev, [key]: !prev[key] }))}
          onResetPillars={() => setPillars({ ...ALL_PILLARS_ON })}
          onApplyPreset={applyPreset}
          lint={result.lint}
        />

        <Workbench
          result={result}
          model={model}
          budget={budget}
          onBudgetChange={setBudget}
          budgetTokens={budgetTokens}
          answers={answers}
          onAnswerChange={(id, value) => setAnswers((prev) => ({ ...prev, [id]: value }))}
          copyError={copyError}
          onDismissError={() => setCopyError(null)}
          copied={copied}
          onCopy={() => void handleCopy()}
          onDownload={handleDownload}
        />
      </main>

      <Footer onOpenTerms={() => setTermsOpen(true)} />
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
    </div>
  );
}
