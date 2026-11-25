import type { IdeaTraits, TaskType } from './types';

/** Keyword signals per task type. Each match adds its weight to the score. */
const TASK_SIGNALS: Record<Exclude<TaskType, 'general'>, [RegExp, number][]> = {
  feature: [
    [/\b(web app|webapp|app|application|website|saas|platform|extension|cli|plugin|build|create|implement|add feature)\b/i, 2],
    [/\b(backend|frontend|full[- ]?stack|endpoint|api|auth|crud|export|import|upload|dashboard|portal)\b/i, 1],
  ],
  bugfix: [
    [/\b(bug|bugs|fix|fixes|broken|crash(es|ing)?|regression|exception|stack ?trace|traceback)\b/i, 3],
    [/\b(error|fails?|failing|not working|doesn'?t work|undefined is not|null pointer|debug)\b/i, 2],
  ],
  ui: [
    [/\b(ui|ux|landing page|layout|design system|redesign|restyle|frontend|front-end|look and feel|wireframe)\b/i, 3],
    [/\b(dashboard|screen|component|css|tailwind|responsive|style|styling|page|form|modal|navbar|sidebar)\b/i, 1],
  ],
  security: [
    [/\b(security|secure|vulnerab\w*|owasp|pentest|penetration|threat model|cve|hardening)\b/i, 3],
    [/\b(xss|csrf|ssrf|sql injection|injection|auth(n|z)?|permissions?|secrets?|rules audit)\b/i, 2],
  ],
  refactor: [
    [/\b(refactor\w*|clean ?up|restructure|tech(nical)? debt|unslop|simplify|decouple)\b/i, 3],
    [/\b(migrate|rewrite|modernize|split (up|into))\b/i, 1],
  ],
  deploy: [
    [/\b(deploy\w*|hosting|ci\/cd|pipeline|docker\w*|kubernetes|k8s|release|go live)\b/i, 3],
    [/\b(production|prod|vercel|netlify|cloudflare|cloud run|app hosting|github actions)\b/i, 1],
  ],
  research: [
    [/\b(research|investigate|compare|comparison|evaluate|which (library|framework|tool)|pros and cons|fact[- ]?check)\b/i, 3],
    [/\b(explore|survey|recommend|trade-?offs?|literature|sources?)\b/i, 1],
  ],
  data: [
    [/\b(database|schema|sql|etl|data pipeline|analytics|warehouse|bigquery|postgres\w*)\b/i, 3],
    [/\b(query|queries|index(es)?|migration|dataset|csv|spreadsheet)\b/i, 1],
  ],
  test: [
    [/\b(tests?|testing|coverage|unit tests?|e2e|end-to-end|integration tests?)\b/i, 3],
    [/\b(vitest|jest|playwright|pytest|cypress)\b/i, 2],
  ],
  media: [
    [/\b(ai videos?|ai images?|video generat\w*|image generat\w*|text[- ]to[- ](video|image|speech)|tts|audio generat\w*|storyboard|thumbnail|music generat\w*|multimodal)\b/i, 4],
    [/\b(videos?|images?|animation|voiceover|podcast|ffmpeg|render|media studio|creative studio)\b/i, 2],
  ],
  writing: [
    [/\b(write (a|an|the)? ?(blog|article|essay|story|script|copy|email|newsletter|doc|documentation|guide|book|post|speech)|copywriting|blog post|landing copy|screenplay|fable|novel)\b/i, 4],
    [/\b(tone|narrative|outline|draft|headline|content calendar|documentation|readme)\b/i, 2],
  ],
  strategy: [
    [/\b(business plan|product spec|prd|roadmap|go[- ]to[- ]market|gtm|pitch deck|pricing strategy|startup idea|marketing plan|launch plan|study plan|curriculum)\b/i, 4],
    [/\b(strategy|positioning|competitor|market|okrs?|kpis?|monetiz\w*|proposal)\b/i, 2],
  ],
  automation: [
    [/\b(automat\w*|workflow|n8n|zapier|make\.com|cron|scheduled job|scraper|bot|ai agent|multi[- ]agent|webhook pipeline)\b/i, 4],
    [/\b(trigger|sync|orchestrat\w*|integrat\w*|batch process)\b/i, 2],
  ],
};

const CODE_TYPES = new Set<TaskType>(['feature', 'bugfix', 'ui', 'security', 'refactor', 'deploy', 'data', 'test']);

const CODE_SIGNAL =
  /\b(code|web app|webapp|app|website|api|backend|frontend|server|database|sql|react|vue|svelte|angular|next(\.js)?|vite|typescript|javascript|python|node|express|fastapi|django|flask|golang|go (module|service|backend|api|server)|rust|java|kotlin|swift|flutter|firebase|supabase|docker|html|css|component|function|module|repo|git|sdk|cli|(shell|bash|python|node|build|deploy) script|button|page|screen|dashboard|modal|sidebar|navbar|table|endpoint|webhook)\b/i;

const UI_SIGNAL =
  /\b(ui|ux|web app|webapp|website|page|screen|dashboard|landing|component|frontend|front-end|form|layout|react|vue|svelte|angular|next(\.js)?|tailwind|css|html|interface|studio|editor)\b/i;

const AI_MEDIA_SIGNAL =
  /\b(ai videos?|ai images?|video generat\w*|image generat\w*|audio generat\w*|tts|text[- ]to[- ](video|image|speech)|multimodal|veo|omni|sora|runway|midjourney|imagen|nano banana|diffusion|generat(e|es|ing|ion) (ai )?(videos?|images?|audio|media))\b/i;

const SOURCE_VERIFY_SIGNAL =
  /\b(verify (all )?sources?|check (and verify )?(all )?sources?|cite|citations?|fact[- ]?check|references?|sources?|grounded|hallucinat\w*|verify claims?|provenance|audit)\b/i;

const API_BACKEND_SIGNAL =
  /\b(api|backend|server|webhook|auth|database|storage|queue|worker|stripe|billing|firebase|supabase|postgres|express|fastapi|node|endpoint|sdk)\b/i;

const AUTOMATION_SIGNAL =
  /\b(automat\w*|workflow|n8n|zapier|cron|schedule|bot|agent|pipeline|webhook)\b/i;

export function detectTaskType(text: string): TaskType {
  if (!text.trim()) return 'general';

  let best: TaskType = 'general';
  let bestScore = 2;
  for (const [type, signals] of Object.entries(TASK_SIGNALS) as [Exclude<TaskType, 'general'>, [RegExp, number][]][]) {
    const score = signals.reduce((sum, [re, w]) => (re.test(text) ? sum + w : sum), 0);
    if (score > bestScore) {
      best = type;
      bestScore = score;
    }
  }
  if (best === 'general' && CODE_SIGNAL.test(text)) return 'feature';
  return best;
}

export function detectTraits(text: string, taskType: TaskType, hasStack: boolean): IdeaTraits {
  const isCode = CODE_TYPES.has(taskType) || hasStack || CODE_SIGNAL.test(text);
  const hasUi = taskType === 'ui' || (isCode && UI_SIGNAL.test(text));
  const hasAiMedia = taskType === 'media' || AI_MEDIA_SIGNAL.test(text);
  const hasSourceVerify = taskType === 'research' || SOURCE_VERIFY_SIGNAL.test(text);
  const hasApiOrBackend = taskType === 'data' || taskType === 'deploy' || API_BACKEND_SIGNAL.test(text);
  const hasAutomation = taskType === 'automation' || AUTOMATION_SIGNAL.test(text);

  return {
    isCode,
    hasUi,
    hasAiMedia,
    hasSourceVerify,
    hasApiOrBackend,
    hasAutomation,
  };
}

const STACK_TOKENS: [RegExp, string][] = [
  [/\bnext(\.js|js)?\b/i, 'Next.js'],
  [/\breact\b/i, 'React'],
  [/\bvue\b/i, 'Vue'],
  [/\bsvelte(kit)?\b/i, 'Svelte'],
  [/\bangular\b/i, 'Angular'],
  [/\bvite\b/i, 'Vite'],
  [/\btailwind\b/i, 'Tailwind'],
  [/\btypescript\b|\btsx?\b/i, 'TypeScript'],
  [/\bnode(\.js|js)?\b/i, 'Node.js'],
  [/\bexpress\b/i, 'Express'],
  [/\bpython\b/i, 'Python'],
  [/\bdjango\b/i, 'Django'],
  [/\bflask\b/i, 'Flask'],
  [/\bfastapi\b/i, 'FastAPI'],
  [/\bgolang\b|\bgo (module|service|backend|api|server)\b|\b(in|with|using) go\b/i, 'Go'],
  [/\brust\b/i, 'Rust'],
  [/\bjava\b/i, 'Java'],
  [/\bkotlin\b/i, 'Kotlin'],
  [/\bandroid\b/i, 'Android'],
  [/\bswift(ui)?\b|\bios\b/i, 'Swift'],
  [/\bflutter\b/i, 'Flutter'],
  [/\bfirebase\b|\bfirestore\b/i, 'Firebase'],
  [/\bsupabase\b/i, 'Supabase'],
  [/\bpostgres\w*\b/i, 'PostgreSQL'],
  [/\bmongo(db)?\b/i, 'MongoDB'],
  [/\bdocker\b/i, 'Docker'],
  [/\bgemini\b/i, 'Gemini API'],
  [/\bopenai\b|\bgpt\b/i, 'OpenAI API'],
  [/\bclaude\b|\banthropic\b/i, 'Anthropic API'],
  [/\bffmpeg\b/i, 'FFmpeg'],
  [/\bn8n\b/i, 'n8n'],
  [/\bmujoco\b/i, 'MuJoCo'],
];

export function detectStack(text: string): string[] {
  const found: string[] = [];
  for (const [re, name] of STACK_TOKENS) {
    if (re.test(text) && !found.includes(name)) found.push(name);
  }
  return found;
}

/** True when the text names a measurable outcome or acceptance check. */
export function hasAcceptanceCriteria(text: string): boolean {
  return /\b(should|must|so that|acceptance|done when|once .* done|success(ful)? when|passes|returns|under \d|within \d|\d+ ?(ms|s|%|px)|verify all)\b/i.test(
    text,
  );
}
