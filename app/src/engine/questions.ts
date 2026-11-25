import { hasAcceptanceCriteria } from './detect';
import type { IdeaTraits, LintIssue, Question, TaskType } from './types';

const Q = (id: string, text: string, why: string, placeholder: string): Question => ({ id, text, why, placeholder });

const BY_TYPE: Record<TaskType, Question[]> = {
  feature: [
    Q('scope', 'What is in scope, and what is explicitly out?', 'Stops the model from building extras', 'In: CSV export of invoices. Out: PDF, scheduling'),
    Q('touch', 'Which existing files, modules, or APIs does this touch?', 'Points the model at real code instead of guesses', 'src/billing/, /api/invoices'),
  ],
  bugfix: [
    Q('repro', 'What are the exact steps to reproduce?', 'A bug the model cannot reproduce gets guessed at', '1. Log in  2. Open /settings  3. Click Save'),
    Q('actual', 'What did you expect, and what happened instead? Paste the error.', 'The error text is the best clue', 'Expected a toast; got TypeError: x is undefined at Save.tsx:42'),
    Q('since', 'When did it start, and what changed around then?', 'Narrows the search to recent changes', 'After upgrading react-router to v7'),
  ],
  ui: [
    Q('users', 'Who uses this screen, on which devices?', 'Sets density, layout, and touch targets', 'Ops staff on 1440px laptops, some on tablets'),
    Q('brand', 'Is there a design system, brand color, or component library to follow?', 'Keeps the result consistent with the product', 'Tailwind, brand color #0F766E'),
    Q('states', 'What data does the screen show, and what happens when it is empty or fails?', 'Empty and error states are where UI usually breaks', 'List of orders; empty = first-run prompt'),
  ],
  security: [
    Q('scope', 'What is in scope (repos, endpoints, infra), and what is out?', 'An audit without scope never ends', 'api/ and auth/ in this repo; not the CDN'),
    Q('data', 'What sensitive data and user roles exist?', 'Defines the assets and access model to test', 'PII (email, address); roles: admin, member'),
  ],
  refactor: [
    Q('keep', 'Which behavior and public interfaces must not change?', 'Defines what the safety net must pin', 'The REST API contract and DB schema'),
    Q('why', 'What is the pain this refactor removes?', 'Tells the model what "better" means here', 'Adding a payment provider takes a week'),
  ],
  deploy: [
    Q('where', 'Where does it deploy, and which environments exist?', 'Each platform needs different config', 'Firebase Hosting; staging and prod'),
    Q('approve', 'Who approves production releases, and what is the rollback plan?', 'Production changes need a gate', 'I approve; roll back to the previous release'),
  ],
  research: [
    Q('decision', 'What decision will this research inform, and by when?', 'Keeps research focused on the decision', 'Pick a state library before Monday'),
    Q('criteria', 'Which criteria matter most?', 'Turns opinions into a comparison', 'Bundle size, TypeScript support, maintenance'),
  ],
  data: [
    Q('volume', 'How much data, how fast does it grow, and what is the current schema?', 'Volume decides indexes and migration strategy', '20M rows, +1M a month; schema in db/schema.sql'),
  ],
  test: [
    Q('critical', 'Which behaviors would hurt most if they broke?', 'Spends test effort where risk is', 'Checkout totals and tax rounding'),
  ],
  media: [
    Q('providers', 'Which AI video/image providers or APIs do you want to use (or should it recommend one)?', 'Provider choice dictates auth, async polling, pricing, and limits', 'Gemini Omni Flash + Nano Banana, or Runway + Flux'),
    Q('outputs', 'What formats, aspect ratios, durations, and user controls are needed?', 'Prevents guessing resolutions, clip length, or editing features', '16:9 and 9:16; 5-10s video clips; PNG downloads'),
    Q('budget_quota', 'Should it support user accounts, storage, and per-user rate/cost limits?', 'Media APIs are expensive without quotas and server-side keys', 'Server-side API keys, S3/R2 storage, 10 generations/day per user'),
  ],
  writing: [
    Q('audience', 'Who is the reader, and what should they think or do after reading?', 'Decides vocabulary, depth, and structure', 'Technical founders deciding whether to adopt our SDK'),
    Q('voice', 'What tone, length, and format do you want?', 'Avoids generic blog-style prose', 'Direct and practical, 900 words, Markdown'),
  ],
  strategy: [
    Q('objective', 'What is the primary goal, timeline, and budget or team size?', 'Anchors the plan in real constraints', 'Reach 500 paying teams in 6 months with 2 engineers'),
    Q('audience', 'Who is the target customer or stakeholder?', 'Sharpens positioning and priorities', 'Small agencies managing 10-50 clients'),
  ],
  automation: [
    Q('trigger', 'What triggers the workflow, and what services does it connect?', 'Defines integrations, auth, and webhook vs schedule', 'New Stripe invoice -> Slack alert + Notion row'),
    Q('failures', 'What should happen when an external API fails or receives duplicate events?', 'Prevents duplicate side effects and silent failures', 'Retry 3 times with backoff, then alert #ops'),
  ],
  general: [
    Q('audience', 'Who is this for, and what format should the final output take?', 'Shapes depth, tone, and structure', 'Solo creator; step-by-step checklist and templates'),
    Q('scope', 'What must be included, and what is out of scope?', 'Keeps the response focused on what matters', 'Focus on MVP launch; skip enterprise features'),
  ],
};

export function buildQuestions(opts: {
  goal: string;
  taskType: TaskType;
  traits: IdeaTraits;
  hasStack: boolean;
  limit: number;
}): Question[] {
  const out: Question[] = [];
  if (opts.traits.isCode && !opts.hasStack && opts.taskType !== 'research') {
    out.push(
      Q(
        'stack',
        'What stack and versions are you using (or should the model recommend one)?',
        'Prevents code for the wrong framework or version',
        'Next.js 15, TypeScript, Tailwind (or recommend the simplest stack)',
      ),
    );
  }
  out.push(...BY_TYPE[opts.taskType]);
  if (opts.traits.hasSourceVerify && opts.taskType !== 'research') {
    out.push(
      Q(
        'sources',
        'Which sources or claims matter most to verify (APIs, pricing, citations, licensing)?',
        'Focuses verification effort where accuracy counts most',
        'Verify all video/image API endpoints, SDK versions, pricing, and library licenses',
      ),
    );
  }
  if (!hasAcceptanceCriteria(opts.goal)) {
    out.push(
      Q(
        'done',
        'How will you know it is done? Name one to three checks.',
        'Gives the model a finish line it can verify',
        'Generates a sample image and video, tests pass, and every source link is verified',
      ),
    );
  }
  return out.slice(0, opts.limit);
}

const VAGUE = /\b(better|nicer?|good|great|modern|clean|sleek|beautiful|fast|optimi[sz]e|improve|stuff|things|etc\.?|somehow|some kind of)\b/gi;

export function lintGoal(goal: string): LintIssue[] {
  const issues: LintIssue[] = [];
  const words = goal.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return issues;

  if (words.length < 8) {
    issues.push({
      id: 'short',
      level: 'warn',
      message: 'The goal is very short.',
      fix: 'Add who it is for, what it must do, and how you will check it.',
    });
  }
  const vague = [...new Set((goal.match(VAGUE) ?? []).map((w) => w.toLowerCase()))];
  if (vague.length) {
    issues.push({
      id: 'vague',
      level: 'warn',
      message: `Vague words: ${vague.join(', ')}.`,
      fix: 'Replace each with a measurable target, like "loads in under 1s" instead of "fast".',
    });
  }
  if (/\b[A-Z]{4,}\b/.test(goal) && /\b(MUST|NEVER|ALWAYS|IMPORTANT|CRITICAL|DO NOT)\b/.test(goal)) {
    issues.push({
      id: 'shouting',
      level: 'info',
      message: 'All-caps emphasis.',
      fix: 'Current models follow calm instructions closely and overreact to shouting; give the reason instead.',
    });
  }
  const negatives = (goal.match(/\b(don'?t|do not|never|avoid|no)\b/gi) ?? []).length;
  if (negatives >= 3) {
    issues.push({
      id: 'negative',
      level: 'info',
      message: 'Mostly "don\'t" instructions.',
      fix: 'Say what to do instead; models follow positive instructions more reliably.',
    });
  }
  if (!hasAcceptanceCriteria(goal)) {
    issues.push({
      id: 'criteria',
      level: 'info',
      message: 'No acceptance criteria.',
      fix: 'Add "done when..." with one to three checks, or answer the question in the Questions tab.',
    });
  }
  if (/\b(and also|plus|as well as)\b/i.test(goal) && words.length > 60) {
    issues.push({
      id: 'multi',
      level: 'info',
      message: 'Several goals in one prompt.',
      fix: 'Split unrelated goals into separate runs; each gets better focus and fewer tokens.',
    });
  }
  return issues;
}
