import type { Budget, IdeaTraits, Phase, TaskType } from './types';

interface PhaseTemplate extends Phase {
  /** Core phases survive the lean budget and fast-tier models. */
  core: boolean;
}

const P = (name: string, core: boolean, exit: string, ...steps: string[]): PhaseTemplate => ({
  name,
  core,
  exit,
  steps,
});

const HARDEN = P(
  'Harden',
  true,
  'Security and quality checklists pass, with findings fixed or listed as accepted risks.',
  'Review the diff against the security rules; fix every issue you find.',
  'Do an unslop pass on the diff: remove dead code, debug output, redundant comments, and needless abstractions.',
);

const SHIP = P(
  'Report',
  true,
  'The report is written.',
  'Summarize what changed (file by file), how it was verified (commands and results), and open risks or follow-ups.',
);

const SOURCE_AUDIT = P(
  'Verify sources',
  true,
  'Every cited API, model, library, URL, and factual claim is checked against primary sources or explicitly marked unverified.',
  'Check every third-party API, model ID, library version, URL, and factual claim against official or primary sources.',
  'List verified sources alongside any unverified items or open assumptions.',
);

const TEMPLATES: Record<TaskType, PhaseTemplate[]> = {
  feature: [
    P(
      'Discover',
      true,
      'Open questions are answered and assumptions are listed.',
      'Read the code this feature touches; note conventions, entry points, and existing tests.',
      'List the open questions that change the design, ask them, and wait for answers.',
    ),
    P(
      'Plan',
      true,
      'The plan is written; on the thorough budget, it is approved.',
      'Write the plan: files to add or change, data flow, edge cases, risks, and the test plan.',
      'Split the work into increments that each leave the build green.',
    ),
    P(
      'Build',
      true,
      'The code compiles and typecheck or lint passes.',
      'Implement one increment at a time, following existing conventions.',
      'Handle the error, empty, and loading paths, not only the happy path.',
    ),
    P(
      'Verify',
      true,
      'All tests pass, with the output shown.',
      'Add or extend tests for the new behavior and its edge cases; run the full suite.',
      'Exercise the feature end to end the way a user would.',
    ),
    HARDEN,
    SHIP,
  ],
  bugfix: [
    P(
      'Reproduce',
      true,
      'The bug reproduces reliably, or the missing facts are requested.',
      'Reproduce the bug with the smallest possible case; capture the exact error output.',
      'If it does not reproduce, ask for the steps, environment, and logs instead of guessing.',
    ),
    P(
      'Diagnose',
      true,
      'The root cause is confirmed by evidence, not inferred.',
      'List up to three hypotheses ranked by likelihood; test each with a log, breakpoint, or failing test until one is confirmed.',
      'Explain the root cause in two sentences before changing code.',
    ),
    P(
      'Fix',
      true,
      'The failing test now passes.',
      'Write a failing regression test first, then make the smallest change that fixes the root cause.',
      'Check other call sites for the same defect.',
    ),
    P('Verify', true, 'The full test suite passes.', 'Run the full suite and the original reproduction steps.'),
    HARDEN,
    SHIP,
  ],
  ui: [
    P(
      'Discover',
      true,
      'Users, devices, brand, and existing components are known.',
      'Read the current screen and its components; take a screenshot if you can run it.',
      'Ask who uses the screen, on which devices, and whether a design system or brand exists.',
    ),
    P(
      'Direction',
      false,
      'The direction is approved.',
      'Write five lines: product, character (three concrete words), world, one or two rich moments, one signature detail.',
      'Show the direction and wait for approval before building.',
    ),
    P(
      'Build',
      true,
      'The screen renders with real content and every state.',
      'Build the screen with real components and plausible data, mobile-first.',
      'Implement loading, empty, error, disabled, hover, and focus states.',
    ),
    P(
      'Verify',
      true,
      'Screenshots at 1440px and 390px look right, and accessibility checks pass.',
      'Screenshot at 1440px and 390px widths and fix what looks off.',
      'Check keyboard navigation, visible focus, labels, and contrast of 4.5:1 or more.',
    ),
    HARDEN,
    SHIP,
  ],
  security: [
    P(
      'Scope',
      true,
      'Scope, assets, and trust boundaries are written down.',
      'Confirm what is in scope and out of scope.',
      'Write a short threat model: assets, entry points, trust boundaries, likely attackers.',
    ),
    P(
      'Audit',
      true,
      'Every OWASP Top 10 category is checked, each with a verdict.',
      'Check each OWASP Top 10 category against the code: access control, injection, auth, secrets, misconfiguration, vulnerable dependencies, SSRF, logging.',
      'Run dependency and secret scanners available in the project.',
    ),
    P(
      'Prioritize',
      false,
      'Findings are ranked.',
      'Rank findings by severity and exploitability; give each a file and line, impact, and fix.',
    ),
    P(
      'Fix',
      true,
      'Each fix has a test that proves the exploit no longer works.',
      'Fix critical and high findings first; write a test per fix that fails before it.',
    ),
    P('Verify', false, 'Tests and scanners are clean.', 'Re-run tests and scanners; confirm nothing regressed.'),
    SHIP,
  ],
  refactor: [
    P(
      'Map',
      true,
      'Dependencies and behavior to preserve are listed.',
      'Map the code being changed: callers, side effects, public interfaces.',
    ),
    P(
      'Safety net',
      true,
      'Characterization tests pass on the old code.',
      'Add characterization tests that pin current behavior before changing anything.',
    ),
    P(
      'Refactor',
      true,
      'Tests pass after each step.',
      'Change one thing at a time; run tests after each step.',
      'Preserve public interfaces unless the task says otherwise.',
    ),
    P('Verify', false, 'Full suite, typecheck, and lint pass.', 'Run the full suite, typecheck, and lint; compare behavior.'),
    SHIP,
  ],
  deploy: [
    P(
      'Inventory',
      true,
      'The target, build, environments, and secrets are known.',
      'Identify the deploy target, build command, environments, and required secrets.',
    ),
    P(
      'Configure',
      true,
      'Config is committed with no secrets in it.',
      'Write the deploy config; load secrets from the platform secret store, never from files in the repo.',
    ),
    P(
      'Harden',
      true,
      'HTTPS, security headers, and least-privilege access are in place.',
      'Set HTTPS, security headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy), and least-privilege service accounts.',
    ),
    P('Preview', false, 'The preview works.', 'Deploy to a preview or staging channel and smoke test it.'),
    P(
      'Release',
      true,
      'Production is live and verified, with a rollback path written down.',
      'Ask for approval, deploy to production, verify the live URL, and document rollback.',
    ),
  ],
  research: [
    P('Frame', true, 'The question and decision criteria are agreed.', 'Restate the question and list the decision criteria.'),
    P(
      'Gather',
      true,
      'Each claim has a primary source.',
      'Collect evidence from official docs and primary sources; cite each claim.',
    ),
    P('Compare', true, 'A comparison table exists.', 'Compare options in a table against the criteria.'),
    P(
      'Recommend',
      true,
      'A recommendation with confidence and caveats is given.',
      'Recommend one option, with confidence level, caveats, and what would change the answer.',
    ),
  ],
  data: [
    P('Model', true, 'The schema and access patterns are written.', 'Read the existing schema; write the target schema and access patterns.'),
    P(
      'Migrate',
      true,
      'The migration is reversible and tested on a copy.',
      'Write a reversible migration; test it up and down on a copy of the data.',
    ),
    P(
      'Query',
      true,
      'Queries are parameterized and indexed.',
      'Write parameterized queries; add indexes for each access pattern; check query plans.',
    ),
    P('Verify', true, 'Results match expectations on sample data.', 'Validate results against known sample data.'),
    SHIP,
  ],
  test: [
    P('Map', true, 'Behaviors to cover are listed.', 'List the behaviors, edge cases, and failure modes to cover.'),
    P(
      'Write',
      true,
      'Tests exist for each listed behavior.',
      'Write tests that assert behavior, not implementation details; one reason to fail per test.',
    ),
    P('Run', true, 'Tests pass, and coverage is reported.', 'Run the suite; report coverage for the touched code.'),
    P('Gaps', false, 'Gaps are filled or listed.', 'Fill remaining gaps or list them with reasons.'),
  ],
  media: [
    P(
      'Define',
      true,
      'Output formats, providers/models, quality bar, and constraints are agreed.',
      'Confirm target media formats (video/image/audio), aspect ratios, durations, providers or models, and cost or latency limits.',
      'List the open questions that change the architecture or creative direction, ask them, and wait for answers.',
    ),
    P(
      'Plan',
      true,
      'The architecture, provider integration, and user flow are written down.',
      'Design the generation flow: prompt inputs, async job queue/polling, storage, error/retry states, moderation, and UI or delivery format.',
      'Split delivery into verifiable increments.',
    ),
    P(
      'Build',
      true,
      'End-to-end generation flow works with real error, loading, and empty states.',
      'Implement the core generation pipeline and interface cleanly with server-side key handling and input validation.',
      'Handle slow jobs, cancellations, provider failures, and quota limits gracefully.',
    ),
    P(
      'Verify',
      true,
      'Outputs, edge cases, and all cited provider docs/sources are checked.',
      'Test generation, preview, download, and failure paths end to end.',
      'Verify provider SDK versions, model IDs, and API quotas against official documentation.',
    ),
    HARDEN,
    SHIP,
  ],
  writing: [
    P(
      'Brief',
      true,
      'Audience, goal, tone, length, and key points are confirmed.',
      'Clarify the audience, desired action, voice, format, and must-include facts.',
      'List open questions and wait for answers before drafting.',
    ),
    P(
      'Outline',
      true,
      'The structure and core thesis are set.',
      'Write a tight outline showing the hook, main sections, supporting evidence, and ending.',
    ),
    P(
      'Draft',
      true,
      'A complete, concrete draft is written with zero filler.',
      'Write the full draft in clear, specific prose matched to the audience.',
      'Back every factual claim with a cited source or flag it for confirmation.',
    ),
    P(
      'Edit and verify',
      true,
      'Clichés are cut, tone is consistent, and every fact and source is verified.',
      'Cut redundant words, hype, and vague claims; check readability and pacing.',
      'Verify all facts, names, quotes, numbers, and links against primary sources.',
    ),
  ],
  strategy: [
    P(
      'Frame',
      true,
      'Objective, constraints, audience, and decision criteria are clear.',
      'Clarify the goal, timeline, budget/resources, target users, and how success will be measured.',
      'Ask the highest-impact open questions before proposing options.',
    ),
    P(
      'Analyze',
      true,
      'Key options, risks, and assumptions are compared with evidence.',
      'Map 2 to 3 concrete approaches with trade-offs, risks, and cited evidence or benchmarks.',
    ),
    P(
      'Recommend',
      true,
      'One phased roadmap with owners, milestones, and metrics is defined.',
      'Select a primary recommendation and turn it into an actionable phased plan with measurable milestones.',
    ),
    P(
      'Stress-test',
      true,
      'Failure modes, mitigations, and sources are checked.',
      'List the top ways the plan could fail, how to detect each early, and verify all cited data.',
    ),
  ],
  automation: [
    P(
      'Map workflow',
      true,
      'Triggers, inputs, outputs, tools, and failure rules are defined.',
      'Map each trigger, external API/service, data transformation, and expected output.',
      'Ask about credentials, rate limits, and approval gates before building.',
    ),
    P(
      'Design',
      true,
      'Idempotency, retries, and secret handling are specified.',
      'Design idempotent steps, backoff retries, error alerts, and dry-run mode.',
    ),
    P(
      'Build',
      true,
      'The workflow runs cleanly in dry-run or test mode.',
      'Implement the workflow with strict input validation and zero hardcoded secrets.',
    ),
    P(
      'Verify',
      true,
      'Happy path, malformed input, and retry/failure paths all pass.',
      'Test end to end with sample payloads and simulated failures; verify logs and alerts.',
    ),
    SHIP,
  ],
  general: [
    P(
      'Clarify',
      true,
      'Goal, audience, constraints, and success criteria are agreed.',
      'Restate the goal in one sentence and identify any missing details that would change the result.',
      'Ask the open questions and wait for answers before committing to a full solution.',
    ),
    P(
      'Plan',
      true,
      'A clear, step-by-step approach is laid out.',
      'Break the work into concrete parts with clear deliverables and order of execution.',
    ),
    P(
      'Execute',
      true,
      'The complete deliverable meets every stated constraint.',
      'Produce the deliverable step by step, keeping each part concrete, structured, and free of filler.',
    ),
    P(
      'Verify',
      true,
      'All requirements, edge cases, and sources are checked.',
      'Review the output against every acceptance criterion, fix gaps, and verify all facts or sources cited.',
    ),
  ],
};

export function buildPhases(type: TaskType, budget: Budget, maxPhases: number, traits?: IdeaTraits): Phase[] {
  let template = [...TEMPLATES[type]];

  // If the user asked to verify sources and this template does not already have a dedicated source audit,
  // fold a focused Verify sources phase in before Report (or at the end).
  if (traits?.hasSourceVerify && !['research', 'writing', 'strategy'].includes(type)) {
    const reportIdx = template.findIndex((p) => p.name === 'Report');
    if (reportIdx !== -1) {
      template.splice(reportIdx, 0, SOURCE_AUDIT);
    } else {
      template.push(SOURCE_AUDIT);
    }
  }

  let phases: Phase[] = template;
  if (budget === 'lean' || template.length > maxPhases) {
    phases = template.filter((p) => p.core);
  }
  phases = phases.map(({ name, steps, exit }) => ({
    name,
    exit,
    // Lean keeps only the first, most important step of each phase.
    steps: budget === 'lean' ? steps.slice(0, 1) : [...steps],
  }));

  while (phases.length > maxPhases) {
    const reportAt = phases.findIndex((p) => p.name === 'Report');
    if (reportAt !== -1) {
      phases.splice(reportAt, 1);
      continue;
    }
    const b = phases.pop()!;
    const a = phases.pop()!;
    phases.push({
      name: `${a.name} and ${b.name.toLowerCase()}`,
      steps: [...a.steps, ...b.steps],
      exit: `${a.exit} ${b.exit}`,
    });
  }
  return phases;
}
