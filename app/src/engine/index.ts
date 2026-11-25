import { assemble, estimateTokens } from './assemble';
import { detectStack, detectTaskType, detectTraits } from './detect';
import { MODELS } from './models';
import { buildPhases } from './phases';
import { buildRules } from './pillars';
import { buildQuestions, lintGoal } from './questions';
import { routeSkills } from './skills';
import type { ForgeInput, ForgeResult, Pillar } from './types';

export * from './types';
export { MODELS, MODEL_GROUPS } from './models';

export const PILLARS: { key: Pillar; label: string; hint: string }[] = [
  { key: 'tokens', label: 'Save tokens', hint: 'Brief replies, diffs only, zero filler' },
  { key: 'unslop', label: 'Unslop and verify', hint: 'Clean craft, no fluff, mandatory checks' },
  { key: 'clarify', label: 'Ask first', hint: 'Questions before acting, then wait' },
  { key: 'model', label: 'Model tuning', hint: 'Format and rules for Claude, Gemini, or GPT' },
  { key: 'security', label: 'Security', hint: 'Input validation, secrets, authz, audits' },
  { key: 'uiux', label: 'Senior UI/UX', hint: 'Tokens, states, WCAG 2.2 AA, no AI look' },
  { key: 'phases', label: 'Phased plan', hint: 'Ordered phases with exit gates' },
  { key: 'grounding', label: 'Grounding', hint: 'Evidence per step, verified sources' },
  { key: 'skills', label: 'Use skills', hint: 'Portable approach skills + workspace tools' },
];

export const ALL_PILLARS_ON: Record<Pillar, boolean> = Object.fromEntries(PILLARS.map((p) => [p.key, true])) as Record<
  Pillar,
  boolean
>;

const QUESTION_LIMIT = { lean: 3, standard: 5, thorough: 7 } as const;
const MAX_GOAL = 8000;
const MAX_FIELD = 20000;

export function splitList(text: string): string[] {
  return text
    .split(/\n|;/)
    .map((s) => s.replace(/^\s*[-*\d.)]+\s*/, '').trim())
    .filter(Boolean);
}

export function forge(input: ForgeInput): ForgeResult {
  const goal = input.goal.slice(0, MAX_GOAL);
  const context = (input.context ?? '').slice(0, MAX_FIELD);
  const constraintsText = (input.constraints ?? '').slice(0, MAX_FIELD);
  const stackText = (input.stack ?? '').slice(0, 500);
  const pillars = { ...ALL_PILLARS_ON, ...input.pillars };
  const model = MODELS[input.model] ?? MODELS['claude-sonnet'];
  const answers = input.answers ?? {};

  const allText = [goal, stackText, context, constraintsText, ...Object.values(answers)].join('\n');
  const detectedTaskType = detectTaskType(goal || allText);
  const taskType = input.taskType && input.taskType !== 'auto' ? input.taskType : detectedTaskType;

  const typed = splitList(stackText.replace(/,/g, ';'));
  // Skip detected names the user already typed, e.g. "React" when they wrote "React 19".
  const dedupedStack = [
    ...new Set(typed),
    ...detectStack(allText).filter((d) => !typed.some((t) => t.toLowerCase().includes(d.toLowerCase()))),
  ];

  // Ask based on what the user typed, not on answers, so answering never removes its own question.
  const typedStack = splitList(stackText).length > 0 || detectStack([goal, context, constraintsText].join('\n')).length > 0;
  const traits = detectTraits(allText, taskType, dedupedStack.length > 0);
  const typedTraits = detectTraits([goal, stackText, context, constraintsText].join('\n'), taskType, typedStack);

  const questionLimit = QUESTION_LIMIT[input.budget];
  const questions = buildQuestions({
    goal: `${goal}\n${constraintsText}`,
    taskType,
    traits: typedTraits,
    hasStack: typedStack,
    limit: questionLimit,
  });
  const answered = questions
    .filter((q) => answers[q.id]?.trim())
    .map((q) => ({ q: q.text, a: answers[q.id].trim().slice(0, MAX_FIELD) }));
  const openQuestions = pillars.clarify ? questions.filter((q) => !answers[q.id]?.trim()) : [];

  const rules = buildRules(pillars, {
    taskType,
    traits,
    budget: input.budget,
    target: input.target,
    modelRules: model.rules,
    questionLimit,
  });

  const phases = (pillars.phases ? buildPhases(taskType, input.budget, model.maxPhases, traits) : []).map((p) =>
    // The open questions are already listed; point to them instead of restating them.
    openQuestions.length
      ? {
          ...p,
          steps: p.steps.map((s) =>
            /^(Ask |List the open questions|List open questions)/.test(s) ? 'Ask the open questions and wait for answers.' : s,
          ),
        }
      : p,
  );

  const skills = routeSkills({
    text: allText,
    taskType,
    traits,
    budget: input.budget,
    tier: model.tier,
    target: input.target,
    pillars,
    hasStack: dedupedStack.length > 0,
  });

  const prompt = goal.trim()
    ? assemble({
        goal,
        taskType,
        traits,
        model,
        budget: input.budget,
        target: input.target,
        stack: dedupedStack,
        context,
        constraints: splitList(constraintsText),
        answered,
        openQuestions,
        rules,
        phases,
        // Slash commands start the session; they are shown to the user, not put in the prompt.
        skills: skills.filter((s) => s.kind !== 'command'),
        gated: pillars.phases && input.budget === 'thorough' && phases.some((p) => p.name === 'Plan'),
      })
    : '';

  return {
    prompt,
    tokens: estimateTokens(prompt),
    taskType,
    detectedTaskType,
    traits,
    stack: dedupedStack,
    questions,
    skills,
    lint: lintGoal(goal),
    phases,
  };
}
