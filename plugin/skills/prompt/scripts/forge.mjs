// src/engine/assemble.ts
var ROLES = {
  feature: "senior software engineer",
  bugfix: "senior engineer who debugs from evidence, not guesses",
  ui: "senior product engineer with a strong design eye",
  security: "application security engineer",
  refactor: "staff engineer who refactors safely",
  deploy: "senior platform engineer",
  research: "technical researcher who cites primary sources",
  data: "senior data engineer",
  test: "senior test engineer",
  media: "senior AI product engineer specializing in generative video, image, and multimodal systems",
  writing: "senior editor and subject-matter writer",
  strategy: "principal product strategist",
  automation: "senior automation and systems engineer",
  general: "senior domain specialist and clear problem solver"
};
function outputFormat(a) {
  const lines = [];
  if (a.target === "chat") {
    if (a.traits.isCode) {
      lines.push("Give code as complete files or unified diffs, each headed by its file path.");
    }
    if (a.phases.length) lines.push('Finish one phase per reply and wait for me to say "continue".');
  } else if (a.target === "api") {
    lines.push("Return structured, directly usable output with no conversational filler.");
  }
  if (a.phases.length) {
    lines.push(
      a.budget === "lean" ? "End each phase with one line of evidence." : "Start each phase with its name; end it with Done, Evidence, and Next, one line each."
    );
  }
  if (a.traits.isCode) {
    lines.push(
      a.budget === "lean" ? "Final reply: files changed and how they were verified." : "Final reply: files changed, how each was verified (commands, results, and sources), and open risks."
    );
  } else {
    lines.push(
      a.budget === "lean" ? "Final reply: the complete deliverable and key verified sources." : "Final reply: the complete deliverable, verified sources/citations, and open assumptions or next steps."
    );
  }
  return lines;
}
var bullets = (items) => items.map((i) => `- ${i}`).join("\n");
var numbered = (items) => items.map((i, n) => `${n + 1}. ${i}`).join("\n");
var tag = (name, body) => `<${name}>
${body}
</${name}>`;
var slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
function contextBody(a) {
  const parts = [];
  if (a.context.trim()) parts.push(a.context.trim());
  if (a.stack.length) parts.push(`Stack: ${a.stack.join(", ")}`);
  if (a.answered.length) parts.push(a.answered.map(({ q, a: ans }) => `${q}
${ans}`).join("\n\n"));
  return parts.join("\n\n");
}
function roleLine(a) {
  const where = {
    antigravity: " You work inside Antigravity with file, terminal, and browser tools.",
    ide: " You work inside a coding IDE/CLI with local repository and terminal access.",
    chat: " You are working in a chat interface without direct access to local files or a terminal.",
    api: " Respond cleanly as a reusable system workflow for automated or interactive requests."
  };
  return `You are a ${ROLES[a.taskType]}.${where[a.target]}`;
}
var PHASE_INTRO = "Work through these phases in order. Start a phase only when the previous exit criterion is met.";
var GATE = "After the plan, stop and wait for my approval before executing.";
var OPEN_INTRO = "Ask these unless the context already answers them:";
function skillsBlock(a) {
  if (!a.skills.length) return null;
  const hasNative = a.skills.some((s) => s.kind !== "approach");
  const intro = a.target === "antigravity" && hasNative ? "Apply these approach skills throughout, and load workspace tools/skills when the phase that needs them starts:" : "Apply these domain skills and methodologies so the output is thorough, verified, and free of common failure modes:";
  return { intro, lines: a.skills.map(skillLine) };
}
function skillLine(s) {
  if (s.kind === "approach") return `${s.name}: ${s.when}`;
  if (s.kind === "command") return `${s.name} (slash command, run by me): ${s.when}`;
  if (s.kind === "skill") return `${s.name}: ${s.when}`;
  return `${s.name} (${s.kind}): ${s.when}`;
}
function renderXml(a) {
  const out = [roleLine(a)];
  const ctx = contextBody(a);
  if (ctx) out.push(tag("context", ctx));
  out.push(tag("goal", a.goal.trim()));
  if (a.constraints.length) out.push(tag("constraints", bullets(a.constraints)));
  if (a.rules.length) {
    out.push(tag("rules", a.rules.map((r) => tag(slug(r.title), bullets(r.items))).join("\n")));
  }
  if (a.openQuestions.length) out.push(tag("open_questions", `${OPEN_INTRO}
${bullets(a.openQuestions.map((q) => q.text))}`));
  if (a.phases.length) {
    const body = a.phases.map((p) => `<phase name="${p.name}">
${numbered(p.steps)}
Exit: ${p.exit}
</phase>`).join("\n");
    out.push(tag("phases", `${PHASE_INTRO}${a.gated ? ` ${GATE}` : ""}
${body}`));
  }
  const sb = skillsBlock(a);
  if (sb) out.push(tag("skills", `${sb.intro}
${bullets(sb.lines)}`));
  out.push(tag("output_format", bullets(outputFormat(a))));
  return out.join("\n\n");
}
function renderMarkdown(a, taskLast) {
  const out = [roleLine(a)];
  const ctx = contextBody(a);
  if (!taskLast) out.push(`## Goal
${a.goal.trim()}`);
  if (ctx) out.push(`## Context
${ctx}`);
  if (a.constraints.length) out.push(`## Constraints
${bullets(a.constraints)}`);
  if (a.rules.length) {
    out.push(`## Rules
${a.rules.map((r) => `**${r.title}**
${bullets(r.items)}`).join("\n\n")}`);
  }
  if (a.openQuestions.length) out.push(`## Open questions
${OPEN_INTRO}
${bullets(a.openQuestions.map((q) => q.text))}`);
  if (a.phases.length) {
    const body = a.phases.map((p, i) => `### ${i + 1}. ${p.name}
${numbered(p.steps)}
Exit: ${p.exit}`).join("\n\n");
    out.push(`## Phases
${PHASE_INTRO}${a.gated ? ` ${GATE}` : ""}

${body}`);
  }
  const sb = skillsBlock(a);
  if (sb) out.push(`## Skills
${sb.intro}
${bullets(sb.lines)}`);
  out.push(`## Output format
${bullets(outputFormat(a))}`);
  if (taskLast) out.push(`## Task
${a.goal.trim()}`);
  return out.join("\n\n");
}
function assemble(a) {
  if (a.model.format === "xml") return renderXml(a);
  return renderMarkdown(a, a.model.format === "markdown-last");
}
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

// src/engine/detect.ts
var TASK_SIGNALS = {
  feature: [
    [/\b(web app|webapp|app|application|website|saas|platform|extension|cli|plugin|build|create|implement|add feature)\b/i, 2],
    [/\b(backend|frontend|full[- ]?stack|endpoint|api|auth|crud|export|import|upload|dashboard|portal)\b/i, 1]
  ],
  bugfix: [
    [/\b(bug|bugs|fix|fixes|broken|crash(es|ing)?|regression|exception|stack ?trace|traceback)\b/i, 3],
    [/\b(error|fails?|failing|not working|doesn'?t work|undefined is not|null pointer|debug)\b/i, 2]
  ],
  ui: [
    [/\b(ui|ux|landing page|layout|design system|redesign|restyle|frontend|front-end|look and feel|wireframe)\b/i, 3],
    [/\b(dashboard|screen|component|css|tailwind|responsive|style|styling|page|form|modal|navbar|sidebar)\b/i, 1]
  ],
  security: [
    [/\b(security|secure|vulnerab\w*|owasp|pentest|penetration|threat model|cve|hardening)\b/i, 3],
    [/\b(xss|csrf|ssrf|sql injection|injection|auth(n|z)?|permissions?|secrets?|rules audit)\b/i, 2]
  ],
  refactor: [
    [/\b(refactor\w*|clean ?up|restructure|tech(nical)? debt|unslop|simplify|decouple)\b/i, 3],
    [/\b(migrate|rewrite|modernize|split (up|into))\b/i, 1]
  ],
  deploy: [
    [/\b(deploy\w*|hosting|ci\/cd|pipeline|docker\w*|kubernetes|k8s|release|go live)\b/i, 3],
    [/\b(production|prod|vercel|netlify|cloudflare|cloud run|app hosting|github actions)\b/i, 1]
  ],
  research: [
    [/\b(research|investigate|compare|comparison|evaluate|which (library|framework|tool)|pros and cons|fact[- ]?check)\b/i, 3],
    [/\b(explore|survey|recommend|trade-?offs?|literature|sources?)\b/i, 1]
  ],
  data: [
    [/\b(database|schema|sql|etl|data pipeline|analytics|warehouse|bigquery|postgres\w*)\b/i, 3],
    [/\b(query|queries|index(es)?|migration|dataset|csv|spreadsheet)\b/i, 1]
  ],
  test: [
    [/\b(tests?|testing|coverage|unit tests?|e2e|end-to-end|integration tests?)\b/i, 3],
    [/\b(vitest|jest|playwright|pytest|cypress)\b/i, 2]
  ],
  media: [
    [/\b(ai videos?|ai images?|video generat\w*|image generat\w*|text[- ]to[- ](video|image|speech)|tts|audio generat\w*|storyboard|thumbnail|music generat\w*|multimodal)\b/i, 4],
    [/\b(videos?|images?|animation|voiceover|podcast|ffmpeg|render|media studio|creative studio)\b/i, 2]
  ],
  writing: [
    [/\b(write (a|an|the)? ?(blog|article|essay|story|script|copy|email|newsletter|doc|documentation|guide|book|post|speech)|copywriting|blog post|landing copy|screenplay|fable|novel)\b/i, 4],
    [/\b(tone|narrative|outline|draft|headline|content calendar|documentation|readme)\b/i, 2]
  ],
  strategy: [
    [/\b(business plan|product spec|prd|roadmap|go[- ]to[- ]market|gtm|pitch deck|pricing strategy|startup idea|marketing plan|launch plan|study plan|curriculum)\b/i, 4],
    [/\b(strategy|positioning|competitor|market|okrs?|kpis?|monetiz\w*|proposal)\b/i, 2]
  ],
  automation: [
    [/\b(automat\w*|workflow|n8n|zapier|make\.com|cron|scheduled job|scraper|bot|ai agent|multi[- ]agent|webhook pipeline)\b/i, 4],
    [/\b(trigger|sync|orchestrat\w*|integrat\w*|batch process)\b/i, 2]
  ]
};
var CODE_TYPES = /* @__PURE__ */ new Set(["feature", "bugfix", "ui", "security", "refactor", "deploy", "data", "test"]);
var CODE_SIGNAL = /\b(code|web app|webapp|app|website|api|backend|frontend|server|database|sql|react|vue|svelte|angular|next(\.js)?|vite|typescript|javascript|python|node|express|fastapi|django|flask|golang|go (module|service|backend|api|server)|rust|java|kotlin|swift|flutter|firebase|supabase|docker|html|css|component|function|module|repo|git|sdk|cli|(shell|bash|python|node|build|deploy) script|button|page|screen|dashboard|modal|sidebar|navbar|table|endpoint|webhook)\b/i;
var UI_SIGNAL = /\b(ui|ux|web app|webapp|website|page|screen|dashboard|landing|component|frontend|front-end|form|layout|react|vue|svelte|angular|next(\.js)?|tailwind|css|html|interface|studio|editor)\b/i;
var AI_MEDIA_SIGNAL = /\b(ai videos?|ai images?|video generat\w*|image generat\w*|audio generat\w*|tts|text[- ]to[- ](video|image|speech)|multimodal|veo|omni|sora|runway|midjourney|imagen|nano banana|diffusion|generat(e|es|ing|ion) (ai )?(videos?|images?|audio|media))\b/i;
var SOURCE_VERIFY_SIGNAL = /\b(verify (all )?sources?|check (and verify )?(all )?sources?|cite|citations?|fact[- ]?check|references?|sources?|grounded|hallucinat\w*|verify claims?|provenance|audit)\b/i;
var API_BACKEND_SIGNAL = /\b(api|backend|server|webhook|auth|database|storage|queue|worker|stripe|billing|firebase|supabase|postgres|express|fastapi|node|endpoint|sdk)\b/i;
var AUTOMATION_SIGNAL = /\b(automat\w*|workflow|n8n|zapier|cron|schedule|bot|agent|pipeline|webhook)\b/i;
function detectTaskType(text) {
  if (!text.trim()) return "general";
  let best = "general";
  let bestScore = 2;
  for (const [type, signals] of Object.entries(TASK_SIGNALS)) {
    const score = signals.reduce((sum, [re, w]) => re.test(text) ? sum + w : sum, 0);
    if (score > bestScore) {
      best = type;
      bestScore = score;
    }
  }
  if (best === "general" && CODE_SIGNAL.test(text)) return "feature";
  return best;
}
function detectTraits(text, taskType, hasStack) {
  const isCode = CODE_TYPES.has(taskType) || hasStack || CODE_SIGNAL.test(text);
  const hasUi = taskType === "ui" || isCode && UI_SIGNAL.test(text);
  const hasAiMedia = taskType === "media" || AI_MEDIA_SIGNAL.test(text);
  const hasSourceVerify = taskType === "research" || SOURCE_VERIFY_SIGNAL.test(text);
  const hasApiOrBackend = taskType === "data" || taskType === "deploy" || API_BACKEND_SIGNAL.test(text);
  const hasAutomation = taskType === "automation" || AUTOMATION_SIGNAL.test(text);
  return {
    isCode,
    hasUi,
    hasAiMedia,
    hasSourceVerify,
    hasApiOrBackend,
    hasAutomation
  };
}
var STACK_TOKENS = [
  [/\bnext(\.js|js)?\b/i, "Next.js"],
  [/\breact\b/i, "React"],
  [/\bvue\b/i, "Vue"],
  [/\bsvelte(kit)?\b/i, "Svelte"],
  [/\bangular\b/i, "Angular"],
  [/\bvite\b/i, "Vite"],
  [/\btailwind\b/i, "Tailwind"],
  [/\btypescript\b|\btsx?\b/i, "TypeScript"],
  [/\bnode(\.js|js)?\b/i, "Node.js"],
  [/\bexpress\b/i, "Express"],
  [/\bpython\b/i, "Python"],
  [/\bdjango\b/i, "Django"],
  [/\bflask\b/i, "Flask"],
  [/\bfastapi\b/i, "FastAPI"],
  [/\bgolang\b|\bgo (module|service|backend|api|server)\b|\b(in|with|using) go\b/i, "Go"],
  [/\brust\b/i, "Rust"],
  [/\bjava\b/i, "Java"],
  [/\bkotlin\b/i, "Kotlin"],
  [/\bandroid\b/i, "Android"],
  [/\bswift(ui)?\b|\bios\b/i, "Swift"],
  [/\bflutter\b/i, "Flutter"],
  [/\bfirebase\b|\bfirestore\b/i, "Firebase"],
  [/\bsupabase\b/i, "Supabase"],
  [/\bpostgres\w*\b/i, "PostgreSQL"],
  [/\bmongo(db)?\b/i, "MongoDB"],
  [/\bdocker\b/i, "Docker"],
  [/\bgemini\b/i, "Gemini API"],
  [/\bopenai\b|\bgpt\b/i, "OpenAI API"],
  [/\bclaude\b|\banthropic\b/i, "Anthropic API"],
  [/\bffmpeg\b/i, "FFmpeg"],
  [/\bn8n\b/i, "n8n"],
  [/\bmujoco\b/i, "MuJoCo"]
];
function detectStack(text) {
  const found = [];
  for (const [re, name] of STACK_TOKENS) {
    if (re.test(text) && !found.includes(name)) found.push(name);
  }
  return found;
}
function hasAcceptanceCriteria(text) {
  return /\b(should|must|so that|acceptance|done when|once .* done|success(ful)? when|passes|returns|under \d|within \d|\d+ ?(ms|s|%|px)|verify all)\b/i.test(
    text
  );
}

// src/engine/models.ts
var claudeShared = [
  "Explain the reason behind a non-obvious choice in one line so the next reader can verify it.",
  "Prefer clean, general solutions over brittle special-casing."
];
var geminiShared = [
  "State every assumption explicitly before acting on it.",
  "Follow the output format exactly; be direct and skip filler or persuasive language."
];
var gptShared = [
  "Follow each constraint literally and check your work against the acceptance criteria before finishing.",
  "Keep reasoning structured and concise; surface blockers or trade-offs plainly."
];
var MODELS = {
  "claude-opus": {
    id: "claude-opus",
    label: "Claude Opus",
    family: "claude",
    tier: "frontier",
    format: "xml",
    maxPhases: 6,
    rules: [
      ...claudeShared,
      "Think through trade-offs before committing to a design, then act without asking permission for each step; stop only at the gates below.",
      "Add only what the task needs: no extra files, abstractions, or options nobody asked for."
    ]
  },
  "claude-sonnet": {
    id: "claude-sonnet",
    label: "Claude Sonnet",
    family: "claude",
    tier: "balanced",
    format: "xml",
    maxPhases: 6,
    rules: [
      ...claudeShared,
      "Run independent reads and searches in parallel; run dependent steps in order.",
      "Keep each change scoped to the current phase."
    ]
  },
  "claude-haiku": {
    id: "claude-haiku",
    label: "Claude Haiku",
    family: "claude",
    tier: "fast",
    format: "xml",
    maxPhases: 4,
    rules: [
      "Do the numbered steps in order and nothing else.",
      "If a step is unclear, stop and ask instead of guessing."
    ]
  },
  "claude-fable": {
    id: "claude-fable",
    label: "Claude Fable",
    family: "claude",
    tier: "frontier",
    format: "xml",
    maxPhases: 6,
    rules: [
      ...claudeShared,
      "Bring original craft, clear voice, and cohesive structure to creative, design, and product decisions while staying grounded in real constraints.",
      "Keep tone natural and specific; cut clich\xE9s, hype, and decorative fluff."
    ]
  },
  "gemini-carbon": {
    id: "gemini-carbon",
    label: "Gemini 4 Carbon",
    family: "gemini",
    tier: "frontier",
    format: "markdown-last",
    maxPhases: 6,
    rules: [
      ...geminiShared,
      "Use deep reasoning for design, verification, and root-cause work; keep the written answer tight.",
      "Add only what the task needs: no extra files, abstractions, or options nobody asked for."
    ]
  },
  "gemini-neon": {
    id: "gemini-neon",
    label: "Gemini 4 Neon",
    family: "gemini",
    tier: "frontier",
    format: "markdown-last",
    maxPhases: 6,
    rules: [...geminiShared, "Finish each phase completely before starting the next."]
  },
  "gemini-argon": {
    id: "gemini-argon",
    label: "Gemini 4 Argon",
    family: "gemini",
    tier: "balanced",
    format: "markdown-last",
    maxPhases: 5,
    rules: [...geminiShared, "Prefer small, verifiable increments over large rewrites."]
  },
  "gemini-hydrogen": {
    id: "gemini-hydrogen",
    label: "Gemini 4 Hydrogen",
    family: "gemini",
    tier: "balanced",
    format: "markdown-last",
    maxPhases: 5,
    rules: [...geminiShared, "Prefer small, verifiable increments over large rewrites."]
  },
  "gemini-flash-lite": {
    id: "gemini-flash-lite",
    label: "Gemini 3.5 Flash-Lite",
    family: "gemini",
    tier: "fast",
    format: "markdown-last",
    maxPhases: 4,
    rules: [
      "Do the numbered steps in order and nothing else.",
      "If a step is unclear, stop and ask instead of guessing."
    ]
  },
  "gpt-5": {
    id: "gpt-5",
    label: "GPT-5",
    family: "gpt",
    tier: "frontier",
    format: "markdown-first",
    maxPhases: 6,
    rules: [
      ...gptShared,
      "Think carefully through architecture, edge cases, and verification before executing; avoid unrequested scope expansion."
    ]
  },
  "gpt-5-mini": {
    id: "gpt-5-mini",
    label: "GPT-5 mini",
    family: "gpt",
    tier: "balanced",
    format: "markdown-first",
    maxPhases: 5,
    rules: [...gptShared, "Execute in short, verifiable steps and confirm each exit check before moving on."]
  },
  "gpt-4.1": {
    id: "gpt-4.1",
    label: "GPT-4.1",
    family: "gpt",
    tier: "balanced",
    format: "markdown-first",
    maxPhases: 5,
    rules: [
      ...gptShared,
      "Follow explicit instructions and edge-case rules strictly; when requirements conflict, flag the conflict and ask."
    ]
  },
  o3: {
    id: "o3",
    label: "OpenAI o3",
    family: "gpt",
    tier: "frontier",
    format: "markdown-first",
    maxPhases: 5,
    rules: [
      "Focus on the end goal, hard constraints, and verifiable exit criteria; skip redundant narration of intermediate reasoning.",
      "Verify every critical claim, calculation, or dependency before presenting the final output."
    ]
  }
};

// src/engine/phases.ts
var P = (name, core, exit, ...steps) => ({
  name,
  core,
  exit,
  steps
});
var HARDEN = P(
  "Harden",
  true,
  "Security and quality checklists pass, with findings fixed or listed as accepted risks.",
  "Review the diff against the security rules; fix every issue you find.",
  "Do an unslop pass on the diff: remove dead code, debug output, redundant comments, and needless abstractions."
);
var SHIP = P(
  "Report",
  true,
  "The report is written.",
  "Summarize what changed (file by file), how it was verified (commands and results), and open risks or follow-ups."
);
var SOURCE_AUDIT = P(
  "Verify sources",
  true,
  "Every cited API, model, library, URL, and factual claim is checked against primary sources or explicitly marked unverified.",
  "Check every third-party API, model ID, library version, URL, and factual claim against official or primary sources.",
  "List verified sources alongside any unverified items or open assumptions."
);
var TEMPLATES = {
  feature: [
    P(
      "Discover",
      true,
      "Open questions are answered and assumptions are listed.",
      "Read the code this feature touches; note conventions, entry points, and existing tests.",
      "List the open questions that change the design, ask them, and wait for answers."
    ),
    P(
      "Plan",
      true,
      "The plan is written; on the thorough budget, it is approved.",
      "Write the plan: files to add or change, data flow, edge cases, risks, and the test plan.",
      "Split the work into increments that each leave the build green."
    ),
    P(
      "Build",
      true,
      "The code compiles and typecheck or lint passes.",
      "Implement one increment at a time, following existing conventions.",
      "Handle the error, empty, and loading paths, not only the happy path."
    ),
    P(
      "Verify",
      true,
      "All tests pass, with the output shown.",
      "Add or extend tests for the new behavior and its edge cases; run the full suite.",
      "Exercise the feature end to end the way a user would."
    ),
    HARDEN,
    SHIP
  ],
  bugfix: [
    P(
      "Reproduce",
      true,
      "The bug reproduces reliably, or the missing facts are requested.",
      "Reproduce the bug with the smallest possible case; capture the exact error output.",
      "If it does not reproduce, ask for the steps, environment, and logs instead of guessing."
    ),
    P(
      "Diagnose",
      true,
      "The root cause is confirmed by evidence, not inferred.",
      "List up to three hypotheses ranked by likelihood; test each with a log, breakpoint, or failing test until one is confirmed.",
      "Explain the root cause in two sentences before changing code."
    ),
    P(
      "Fix",
      true,
      "The failing test now passes.",
      "Write a failing regression test first, then make the smallest change that fixes the root cause.",
      "Check other call sites for the same defect."
    ),
    P("Verify", true, "The full test suite passes.", "Run the full suite and the original reproduction steps."),
    HARDEN,
    SHIP
  ],
  ui: [
    P(
      "Discover",
      true,
      "Users, devices, brand, and existing components are known.",
      "Read the current screen and its components; take a screenshot if you can run it.",
      "Ask who uses the screen, on which devices, and whether a design system or brand exists."
    ),
    P(
      "Direction",
      false,
      "The direction is approved.",
      "Write five lines: product, character (three concrete words), world, one or two rich moments, one signature detail.",
      "Show the direction and wait for approval before building."
    ),
    P(
      "Build",
      true,
      "The screen renders with real content and every state.",
      "Build the screen with real components and plausible data, mobile-first.",
      "Implement loading, empty, error, disabled, hover, and focus states."
    ),
    P(
      "Verify",
      true,
      "Screenshots at 1440px and 390px look right, and accessibility checks pass.",
      "Screenshot at 1440px and 390px widths and fix what looks off.",
      "Check keyboard navigation, visible focus, labels, and contrast of 4.5:1 or more."
    ),
    HARDEN,
    SHIP
  ],
  security: [
    P(
      "Scope",
      true,
      "Scope, assets, and trust boundaries are written down.",
      "Confirm what is in scope and out of scope.",
      "Write a short threat model: assets, entry points, trust boundaries, likely attackers."
    ),
    P(
      "Audit",
      true,
      "Every OWASP Top 10 category is checked, each with a verdict.",
      "Check each OWASP Top 10 category against the code: access control, injection, auth, secrets, misconfiguration, vulnerable dependencies, SSRF, logging.",
      "Run dependency and secret scanners available in the project."
    ),
    P(
      "Prioritize",
      false,
      "Findings are ranked.",
      "Rank findings by severity and exploitability; give each a file and line, impact, and fix."
    ),
    P(
      "Fix",
      true,
      "Each fix has a test that proves the exploit no longer works.",
      "Fix critical and high findings first; write a test per fix that fails before it."
    ),
    P("Verify", false, "Tests and scanners are clean.", "Re-run tests and scanners; confirm nothing regressed."),
    SHIP
  ],
  refactor: [
    P(
      "Map",
      true,
      "Dependencies and behavior to preserve are listed.",
      "Map the code being changed: callers, side effects, public interfaces."
    ),
    P(
      "Safety net",
      true,
      "Characterization tests pass on the old code.",
      "Add characterization tests that pin current behavior before changing anything."
    ),
    P(
      "Refactor",
      true,
      "Tests pass after each step.",
      "Change one thing at a time; run tests after each step.",
      "Preserve public interfaces unless the task says otherwise."
    ),
    P("Verify", false, "Full suite, typecheck, and lint pass.", "Run the full suite, typecheck, and lint; compare behavior."),
    SHIP
  ],
  deploy: [
    P(
      "Inventory",
      true,
      "The target, build, environments, and secrets are known.",
      "Identify the deploy target, build command, environments, and required secrets."
    ),
    P(
      "Configure",
      true,
      "Config is committed with no secrets in it.",
      "Write the deploy config; load secrets from the platform secret store, never from files in the repo."
    ),
    P(
      "Harden",
      true,
      "HTTPS, security headers, and least-privilege access are in place.",
      "Set HTTPS, security headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy), and least-privilege service accounts."
    ),
    P("Preview", false, "The preview works.", "Deploy to a preview or staging channel and smoke test it."),
    P(
      "Release",
      true,
      "Production is live and verified, with a rollback path written down.",
      "Ask for approval, deploy to production, verify the live URL, and document rollback."
    )
  ],
  research: [
    P("Frame", true, "The question and decision criteria are agreed.", "Restate the question and list the decision criteria."),
    P(
      "Gather",
      true,
      "Each claim has a primary source.",
      "Collect evidence from official docs and primary sources; cite each claim."
    ),
    P("Compare", true, "A comparison table exists.", "Compare options in a table against the criteria."),
    P(
      "Recommend",
      true,
      "A recommendation with confidence and caveats is given.",
      "Recommend one option, with confidence level, caveats, and what would change the answer."
    )
  ],
  data: [
    P("Model", true, "The schema and access patterns are written.", "Read the existing schema; write the target schema and access patterns."),
    P(
      "Migrate",
      true,
      "The migration is reversible and tested on a copy.",
      "Write a reversible migration; test it up and down on a copy of the data."
    ),
    P(
      "Query",
      true,
      "Queries are parameterized and indexed.",
      "Write parameterized queries; add indexes for each access pattern; check query plans."
    ),
    P("Verify", true, "Results match expectations on sample data.", "Validate results against known sample data."),
    SHIP
  ],
  test: [
    P("Map", true, "Behaviors to cover are listed.", "List the behaviors, edge cases, and failure modes to cover."),
    P(
      "Write",
      true,
      "Tests exist for each listed behavior.",
      "Write tests that assert behavior, not implementation details; one reason to fail per test."
    ),
    P("Run", true, "Tests pass, and coverage is reported.", "Run the suite; report coverage for the touched code."),
    P("Gaps", false, "Gaps are filled or listed.", "Fill remaining gaps or list them with reasons.")
  ],
  media: [
    P(
      "Define",
      true,
      "Output formats, providers/models, quality bar, and constraints are agreed.",
      "Confirm target media formats (video/image/audio), aspect ratios, durations, providers or models, and cost or latency limits.",
      "List the open questions that change the architecture or creative direction, ask them, and wait for answers."
    ),
    P(
      "Plan",
      true,
      "The architecture, provider integration, and user flow are written down.",
      "Design the generation flow: prompt inputs, async job queue/polling, storage, error/retry states, moderation, and UI or delivery format.",
      "Split delivery into verifiable increments."
    ),
    P(
      "Build",
      true,
      "End-to-end generation flow works with real error, loading, and empty states.",
      "Implement the core generation pipeline and interface cleanly with server-side key handling and input validation.",
      "Handle slow jobs, cancellations, provider failures, and quota limits gracefully."
    ),
    P(
      "Verify",
      true,
      "Outputs, edge cases, and all cited provider docs/sources are checked.",
      "Test generation, preview, download, and failure paths end to end.",
      "Verify provider SDK versions, model IDs, and API quotas against official documentation."
    ),
    HARDEN,
    SHIP
  ],
  writing: [
    P(
      "Brief",
      true,
      "Audience, goal, tone, length, and key points are confirmed.",
      "Clarify the audience, desired action, voice, format, and must-include facts.",
      "List open questions and wait for answers before drafting."
    ),
    P(
      "Outline",
      true,
      "The structure and core thesis are set.",
      "Write a tight outline showing the hook, main sections, supporting evidence, and ending."
    ),
    P(
      "Draft",
      true,
      "A complete, concrete draft is written with zero filler.",
      "Write the full draft in clear, specific prose matched to the audience.",
      "Back every factual claim with a cited source or flag it for confirmation."
    ),
    P(
      "Edit and verify",
      true,
      "Clich\xE9s are cut, tone is consistent, and every fact and source is verified.",
      "Cut redundant words, hype, and vague claims; check readability and pacing.",
      "Verify all facts, names, quotes, numbers, and links against primary sources."
    )
  ],
  strategy: [
    P(
      "Frame",
      true,
      "Objective, constraints, audience, and decision criteria are clear.",
      "Clarify the goal, timeline, budget/resources, target users, and how success will be measured.",
      "Ask the highest-impact open questions before proposing options."
    ),
    P(
      "Analyze",
      true,
      "Key options, risks, and assumptions are compared with evidence.",
      "Map 2 to 3 concrete approaches with trade-offs, risks, and cited evidence or benchmarks."
    ),
    P(
      "Recommend",
      true,
      "One phased roadmap with owners, milestones, and metrics is defined.",
      "Select a primary recommendation and turn it into an actionable phased plan with measurable milestones."
    ),
    P(
      "Stress-test",
      true,
      "Failure modes, mitigations, and sources are checked.",
      "List the top ways the plan could fail, how to detect each early, and verify all cited data."
    )
  ],
  automation: [
    P(
      "Map workflow",
      true,
      "Triggers, inputs, outputs, tools, and failure rules are defined.",
      "Map each trigger, external API/service, data transformation, and expected output.",
      "Ask about credentials, rate limits, and approval gates before building."
    ),
    P(
      "Design",
      true,
      "Idempotency, retries, and secret handling are specified.",
      "Design idempotent steps, backoff retries, error alerts, and dry-run mode."
    ),
    P(
      "Build",
      true,
      "The workflow runs cleanly in dry-run or test mode.",
      "Implement the workflow with strict input validation and zero hardcoded secrets."
    ),
    P(
      "Verify",
      true,
      "Happy path, malformed input, and retry/failure paths all pass.",
      "Test end to end with sample payloads and simulated failures; verify logs and alerts."
    ),
    SHIP
  ],
  general: [
    P(
      "Clarify",
      true,
      "Goal, audience, constraints, and success criteria are agreed.",
      "Restate the goal in one sentence and identify any missing details that would change the result.",
      "Ask the open questions and wait for answers before committing to a full solution."
    ),
    P(
      "Plan",
      true,
      "A clear, step-by-step approach is laid out.",
      "Break the work into concrete parts with clear deliverables and order of execution."
    ),
    P(
      "Execute",
      true,
      "The complete deliverable meets every stated constraint.",
      "Produce the deliverable step by step, keeping each part concrete, structured, and free of filler."
    ),
    P(
      "Verify",
      true,
      "All requirements, edge cases, and sources are checked.",
      "Review the output against every acceptance criterion, fix gaps, and verify all facts or sources cited."
    )
  ]
};
function buildPhases(type, budget, maxPhases, traits) {
  let template = [...TEMPLATES[type]];
  if (traits?.hasSourceVerify && !["research", "writing", "strategy"].includes(type)) {
    const reportIdx = template.findIndex((p) => p.name === "Report");
    if (reportIdx !== -1) {
      template.splice(reportIdx, 0, SOURCE_AUDIT);
    } else {
      template.push(SOURCE_AUDIT);
    }
  }
  let phases = template;
  if (budget === "lean" || template.length > maxPhases) {
    phases = template.filter((p) => p.core);
  }
  phases = phases.map(({ name, steps, exit }) => ({
    name,
    exit,
    // Lean keeps only the first, most important step of each phase.
    steps: budget === "lean" ? steps.slice(0, 1) : [...steps]
  }));
  while (phases.length > maxPhases) {
    const reportAt = phases.findIndex((p) => p.name === "Report");
    if (reportAt !== -1) {
      phases.splice(reportAt, 1);
      continue;
    }
    const b = phases.pop();
    const a = phases.pop();
    phases.push({
      name: `${a.name} and ${b.name.toLowerCase()}`,
      steps: [...a.steps, ...b.steps],
      exit: `${a.exit} ${b.exit}`
    });
  }
  return phases;
}

// src/engine/pillars.ts
var pick = (budget, items, leanCount, standardCount = items.length) => items.slice(0, budget === "lean" ? leanCount : budget === "standard" ? standardCount : items.length);
function tokens(c) {
  const codeEfficiency = c.target === "antigravity" || c.target === "ide" ? "Read only the files you need; batch independent reads and searches in one step." : "Ask for specific files or snippets when you need them instead of guessing their contents.";
  const items = [
    "Be brief: no preamble, no restating the task, no closing summary of what was just shown.",
    c.traits.isCode ? "Show only changed code, as diffs or complete changed functions; never reprint unchanged files." : "Keep each section tight and concrete; cut filler, repetition, and generic disclaimers.",
    ...c.traits.isCode ? [codeEfficiency] : []
  ];
  return pick(c.budget, items, 2);
}
function unslop(c) {
  if (!c.traits.isCode) {
    return pick(
      c.budget,
      [
        "Review the finished draft against every requirement and acceptance check before delivering it.",
        "Cut AI-sounding filler, clich\xE9s, hype words, and padded bullet lists; replace vague statements with specifics.",
        "Ensure every section serves the user goal directly with consistent tone and clear structure."
      ],
      2,
      3
    );
  }
  const run = c.target === "antigravity" || c.target === "ide" ? "Run the tests, typecheck, and lint yourself and show the output; a change is not done until they pass." : "Give the exact commands to test, typecheck, and lint, with the expected result; ask me to paste the output.";
  return pick(
    c.budget,
    [
      run,
      "Match the existing code style, naming, and structure; reuse existing helpers before writing new ones.",
      "Leave no slop: no dead or commented-out code, debug logs, placeholder TODOs, comments that restate the code, or checks for impossible states.",
      "Prefer the simplest design that meets the requirements; every abstraction must remove more complexity than it adds."
    ],
    2,
    3
  );
}
function clarify(c) {
  const action = c.traits.isCode ? "writing code" : "producing the full output";
  return [
    `Before ${action}, ask at most ${c.questionLimit} questions about anything you cannot infer that would change the result (scope, audience, data, acceptance criteria). Then stop and wait for answers.`,
    "If an answer is already clear from the context or existing materials, state it as an assumption instead of asking.",
    ...c.budget === "thorough" ? ["Restate the agreed requirements in three lines before the plan."] : []
  ];
}
function security(c) {
  if (!c.traits.isCode && c.taskType !== "automation") {
    if (c.budget === "thorough" && c.taskType === "strategy") {
      return ["Flag privacy, legal, or compliance constraints (such as PII handling or licensing) where relevant."];
    }
    return [];
  }
  const validate = "Validate and type-check all external input at the boundary; encode output for its context (HTML, SQL, shell, URL).";
  const secrets = "Keep secrets and provider API keys out of code, logs, URLs, and client bundles; load them server-side from environment or a secret manager.";
  const authz = "Enforce authorization and rate limits on the server for every request; never trust client-side checks.";
  const queries = "Use parameterized queries and safe APIs; never build SQL, shell, or HTML from strings.";
  const deps = "Pin and audit dependencies (for example `npm audit` or `pip-audit`); add none without a reason.";
  const noHtml = "No `innerHTML` or `dangerouslySetInnerHTML` with untrusted data; ship a strict Content Security Policy.";
  const byType = {
    feature: [validate, secrets, authz, queries, deps, ...c.traits.hasUi ? [noHtml] : []],
    media: [secrets, validate, authz, noHtml, deps],
    bugfix: [validate, secrets, authz, queries],
    ui: [noHtml, secrets, validate, deps],
    security: [validate, secrets, authz, queries, deps],
    refactor: [validate, secrets, authz, deps],
    deploy: [
      secrets,
      "Serve HTTPS only with HSTS, CSP, X-Content-Type-Options, and Referrer-Policy headers; use least-privilege service accounts.",
      deps
    ],
    data: [queries, secrets, "Grant the app the least database privilege it needs; make migrations reversible.", validate],
    test: ["Add tests for authorization failures and malformed input, not only the happy path.", secrets],
    automation: [secrets, validate, authz, deps]
  };
  const list = byType[c.taskType] ?? [validate, secrets, authz, deps];
  return pick(c.budget, list, 2, 4);
}
function uiux(c) {
  return pick(
    c.budget,
    [
      "Use design tokens: a 4px spacing grid, one type scale with weights 400 to 600, one tinted neutral ramp, and a single accent.",
      "Design every state: loading, empty, error, disabled, hover, focus, and success.",
      "Meet WCAG 2.2 AA: 4.5:1 text contrast, full keyboard use, visible focus, labelled controls, and `prefers-reduced-motion` respected.",
      "Build mobile-first and responsive; check 390px and 1440px widths.",
      "Avoid AI-looking UI: no hue gradients, glows, gradient text, emoji icons, uppercase tracked labels, or looping animations. Use real copy, never lorem ipsum.",
      "Motion explains state changes only: 120 to 220ms, one easing curve, animate transform and opacity only."
    ],
    3,
    5
  );
}
function grounding(c) {
  const verifyApi = c.target === "antigravity" ? "Check current docs (via MCP or primary sources) for every third-party library, model ID, or API instead of relying on memory." : "Verify every API, model ID, library version, URL, and claim against primary sources; if you cannot check live, mark it explicitly as unverified.";
  const items = [
    c.traits.isCode ? "Work one step at a time and end each phase with evidence: file paths, command output, test results, or cited sources." : "Work one step at a time and end each phase with concrete evidence: primary sources, data, or worked examples.",
    c.traits.isCode ? "Never cite an API, flag, file, or function you have not read or verified; read files before editing them." : "Never fabricate citations, statistics, quotes, URLs, or capabilities; cite primary sources for factual claims.",
    verifyApi,
    `Say "I don't know" or "unverified" when that is true; label assumptions as assumptions.`
  ];
  return pick(c.budget, items, 2, c.traits.hasSourceVerify ? 4 : 3);
}
function buildRules(pillars, c) {
  const sections = [];
  const add = (key, title, items) => {
    if (pillars[key] && items.length) sections.push({ key, title, items });
  };
  add("model", "How to work", c.modelRules);
  add("grounding", "Accuracy and sources", grounding(c));
  add("clarify", "Questions first", clarify(c));
  add("unslop", c.traits.isCode ? "Code quality" : "Draft quality", unslop(c));
  add("security", "Security", security(c));
  if (c.taskType === "ui" || c.traits.hasUi && ["feature", "media", "general"].includes(c.taskType)) {
    add("uiux", "UI and UX", uiux(c));
  }
  add("tokens", "Efficiency", tokens(c));
  return sections;
}

// src/engine/questions.ts
var Q = (id, text, why, placeholder) => ({ id, text, why, placeholder });
var BY_TYPE = {
  feature: [
    Q("scope", "What is in scope, and what is explicitly out?", "Stops the model from building extras", "In: CSV export of invoices. Out: PDF, scheduling"),
    Q("touch", "Which existing files, modules, or APIs does this touch?", "Points the model at real code instead of guesses", "src/billing/, /api/invoices")
  ],
  bugfix: [
    Q("repro", "What are the exact steps to reproduce?", "A bug the model cannot reproduce gets guessed at", "1. Log in  2. Open /settings  3. Click Save"),
    Q("actual", "What did you expect, and what happened instead? Paste the error.", "The error text is the best clue", "Expected a toast; got TypeError: x is undefined at Save.tsx:42"),
    Q("since", "When did it start, and what changed around then?", "Narrows the search to recent changes", "After upgrading react-router to v7")
  ],
  ui: [
    Q("users", "Who uses this screen, on which devices?", "Sets density, layout, and touch targets", "Ops staff on 1440px laptops, some on tablets"),
    Q("brand", "Is there a design system, brand color, or component library to follow?", "Keeps the result consistent with the product", "Tailwind, brand color #0F766E"),
    Q("states", "What data does the screen show, and what happens when it is empty or fails?", "Empty and error states are where UI usually breaks", "List of orders; empty = first-run prompt")
  ],
  security: [
    Q("scope", "What is in scope (repos, endpoints, infra), and what is out?", "An audit without scope never ends", "api/ and auth/ in this repo; not the CDN"),
    Q("data", "What sensitive data and user roles exist?", "Defines the assets and access model to test", "PII (email, address); roles: admin, member")
  ],
  refactor: [
    Q("keep", "Which behavior and public interfaces must not change?", "Defines what the safety net must pin", "The REST API contract and DB schema"),
    Q("why", "What is the pain this refactor removes?", 'Tells the model what "better" means here', "Adding a payment provider takes a week")
  ],
  deploy: [
    Q("where", "Where does it deploy, and which environments exist?", "Each platform needs different config", "Firebase Hosting; staging and prod"),
    Q("approve", "Who approves production releases, and what is the rollback plan?", "Production changes need a gate", "I approve; roll back to the previous release")
  ],
  research: [
    Q("decision", "What decision will this research inform, and by when?", "Keeps research focused on the decision", "Pick a state library before Monday"),
    Q("criteria", "Which criteria matter most?", "Turns opinions into a comparison", "Bundle size, TypeScript support, maintenance")
  ],
  data: [
    Q("volume", "How much data, how fast does it grow, and what is the current schema?", "Volume decides indexes and migration strategy", "20M rows, +1M a month; schema in db/schema.sql")
  ],
  test: [
    Q("critical", "Which behaviors would hurt most if they broke?", "Spends test effort where risk is", "Checkout totals and tax rounding")
  ],
  media: [
    Q("providers", "Which AI video/image providers or APIs do you want to use (or should it recommend one)?", "Provider choice dictates auth, async polling, pricing, and limits", "Gemini Omni Flash + Nano Banana, or Runway + Flux"),
    Q("outputs", "What formats, aspect ratios, durations, and user controls are needed?", "Prevents guessing resolutions, clip length, or editing features", "16:9 and 9:16; 5-10s video clips; PNG downloads"),
    Q("budget_quota", "Should it support user accounts, storage, and per-user rate/cost limits?", "Media APIs are expensive without quotas and server-side keys", "Server-side API keys, S3/R2 storage, 10 generations/day per user")
  ],
  writing: [
    Q("audience", "Who is the reader, and what should they think or do after reading?", "Decides vocabulary, depth, and structure", "Technical founders deciding whether to adopt our SDK"),
    Q("voice", "What tone, length, and format do you want?", "Avoids generic blog-style prose", "Direct and practical, 900 words, Markdown")
  ],
  strategy: [
    Q("objective", "What is the primary goal, timeline, and budget or team size?", "Anchors the plan in real constraints", "Reach 500 paying teams in 6 months with 2 engineers"),
    Q("audience", "Who is the target customer or stakeholder?", "Sharpens positioning and priorities", "Small agencies managing 10-50 clients")
  ],
  automation: [
    Q("trigger", "What triggers the workflow, and what services does it connect?", "Defines integrations, auth, and webhook vs schedule", "New Stripe invoice -> Slack alert + Notion row"),
    Q("failures", "What should happen when an external API fails or receives duplicate events?", "Prevents duplicate side effects and silent failures", "Retry 3 times with backoff, then alert #ops")
  ],
  general: [
    Q("audience", "Who is this for, and what format should the final output take?", "Shapes depth, tone, and structure", "Solo creator; step-by-step checklist and templates"),
    Q("scope", "What must be included, and what is out of scope?", "Keeps the response focused on what matters", "Focus on MVP launch; skip enterprise features")
  ]
};
function buildQuestions(opts) {
  const out = [];
  if (opts.traits.isCode && !opts.hasStack && opts.taskType !== "research") {
    out.push(
      Q(
        "stack",
        "What stack and versions are you using (or should the model recommend one)?",
        "Prevents code for the wrong framework or version",
        "Next.js 15, TypeScript, Tailwind (or recommend the simplest stack)"
      )
    );
  }
  out.push(...BY_TYPE[opts.taskType]);
  if (opts.traits.hasSourceVerify && opts.taskType !== "research") {
    out.push(
      Q(
        "sources",
        "Which sources or claims matter most to verify (APIs, pricing, citations, licensing)?",
        "Focuses verification effort where accuracy counts most",
        "Verify all video/image API endpoints, SDK versions, pricing, and library licenses"
      )
    );
  }
  if (!hasAcceptanceCriteria(opts.goal)) {
    out.push(
      Q(
        "done",
        "How will you know it is done? Name one to three checks.",
        "Gives the model a finish line it can verify",
        "Generates a sample image and video, tests pass, and every source link is verified"
      )
    );
  }
  return out.slice(0, opts.limit);
}
var VAGUE = /\b(better|nicer?|good|great|modern|clean|sleek|beautiful|fast|optimi[sz]e|improve|stuff|things|etc\.?|somehow|some kind of)\b/gi;
function lintGoal(goal) {
  const issues = [];
  const words = goal.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return issues;
  if (words.length < 8) {
    issues.push({
      id: "short",
      level: "warn",
      message: "The goal is very short.",
      fix: "Add who it is for, what it must do, and how you will check it."
    });
  }
  const vague = [...new Set((goal.match(VAGUE) ?? []).map((w) => w.toLowerCase()))];
  if (vague.length) {
    issues.push({
      id: "vague",
      level: "warn",
      message: `Vague words: ${vague.join(", ")}.`,
      fix: 'Replace each with a measurable target, like "loads in under 1s" instead of "fast".'
    });
  }
  if (/\b[A-Z]{4,}\b/.test(goal) && /\b(MUST|NEVER|ALWAYS|IMPORTANT|CRITICAL|DO NOT)\b/.test(goal)) {
    issues.push({
      id: "shouting",
      level: "info",
      message: "All-caps emphasis.",
      fix: "Current models follow calm instructions closely and overreact to shouting; give the reason instead."
    });
  }
  const negatives = (goal.match(/\b(don'?t|do not|never|avoid|no)\b/gi) ?? []).length;
  if (negatives >= 3) {
    issues.push({
      id: "negative",
      level: "info",
      message: `Mostly "don't" instructions.`,
      fix: "Say what to do instead; models follow positive instructions more reliably."
    });
  }
  if (!hasAcceptanceCriteria(goal)) {
    issues.push({
      id: "criteria",
      level: "info",
      message: "No acceptance criteria.",
      fix: 'Add "done when..." with one to three checks, or answer the question in the Questions tab.'
    });
  }
  if (/\b(and also|plus|as well as)\b/i.test(goal) && words.length > 60) {
    issues.push({
      id: "multi",
      level: "info",
      message: "Several goals in one prompt.",
      fix: "Split unrelated goals into separate runs; each gets better focus and fewer tokens."
    });
  }
  return issues;
}

// src/engine/skills.ts
var PORTABLE_SKILLS = [
  {
    name: "AI media pipeline",
    when: "Specify generation models, aspect ratios/durations, async job states, media storage, cost/rate limits, and moderation before building.",
    check: (c) => c.traits.hasAiMedia
  },
  {
    name: "Source and claim verification",
    when: "Verify every URL, SDK/model ID, benchmark, and factual claim against primary documentation; label anything unverified explicitly.",
    pillar: "grounding",
    check: (c) => c.traits.hasSourceVerify || c.taskType === "research" || c.taskType === "writing"
  },
  {
    name: "Design craft and UI states",
    when: "Apply a 4px spacing grid, clear type hierarchy, one accent, WCAG 2.2 AA contrast, and full loading, empty, error, and focus states.",
    pillar: "uiux",
    check: (c) => c.traits.hasUi
  },
  {
    name: "Root-cause debugging",
    when: "Reproduce minimally, list up to 3 ranked hypotheses, confirm one with evidence, then add a failing regression test before fixing.",
    check: (c) => c.taskType === "bugfix"
  },
  {
    name: "Threat modeling and OWASP check",
    when: "Map assets and trust boundaries; keep API keys server-side, validate external input, enforce authz, and check OWASP Top 10 risks.",
    pillar: "security",
    check: (c) => c.taskType === "security" || c.traits.hasApiOrBackend || c.traits.isCode && c.traits.hasAiMedia
  },
  {
    name: "Architecture and trade-off brief",
    when: "Compare the main implementation or strategic options against constraints and failure modes before committing.",
    check: (c) => c.taskType === "feature" || c.taskType === "strategy" || c.taskType === "media" || c.taskType === "deploy" || c.taskType === "data"
  },
  {
    name: "Safe refactoring",
    when: "Pin current behavior with characterization tests first, then apply small behavior-preserving steps.",
    check: (c) => c.taskType === "refactor"
  },
  {
    name: "Workflow and failure recovery",
    when: "Design idempotent steps, explicit retries/timeouts, rate-limit handling, dry-run testing, and clear failure logs.",
    check: (c) => c.traits.hasAutomation
  },
  {
    name: "Test and verification loop",
    when: "Cover edge cases, failure paths, and acceptance checks; verify with runnable commands or a concrete review checklist.",
    pillar: "unslop",
    check: (c) => c.traits.isCode || c.taskType === "test"
  },
  {
    name: "Editorial clarity and structure",
    when: "Lead with the core point for the target audience, use concrete specifics instead of filler, and cut clich\xE9s.",
    check: (c) => c.taskType === "writing" || c.taskType === "strategy" || !c.traits.isCode && c.taskType === "general"
  },
  {
    name: "Structured problem framing",
    when: "Define the audience, constraints, success criteria, and concrete deliverables before drafting the solution.",
    check: (c) => c.taskType === "general"
  }
];
var IDE_SKILLS = [
  {
    name: "Workspace context scan",
    when: "Inspect the repository structure, docs, and neighboring files before drafting or editing.",
    check: () => true
  },
  {
    name: "Local verify loop",
    when: "Run the project test, typecheck, and build commands in the terminal and paste the observed results.",
    pillar: "unslop",
    check: (c) => c.traits.isCode
  }
];
var ANTIGRAVITY_CATALOG = [
  {
    name: "unslop",
    kind: "skill",
    when: "Before and after building UI: direction, then the nine polish passes",
    pillar: "uiux",
    check: (c) => c.traits.hasUi
  },
  {
    name: "redesign-screen",
    kind: "skill",
    when: "Ground a redesign in patterns real apps ship (Mobbin)",
    match: /\bredesign|restyle|inspiration|patterns?\b/i,
    types: ["ui"]
  },
  {
    name: "a11y-debugging",
    kind: "skill",
    when: "Verify phase: semantics, focus, keyboard, contrast",
    pillar: "uiux",
    check: (c) => c.traits.hasUi
  },
  {
    name: "browser",
    kind: "subagent",
    when: "Verify phase: open the running app, click through flows, take screenshots",
    check: (c) => c.traits.hasUi
  },
  {
    name: "gemini-omni-flash-api",
    kind: "skill",
    when: "AI video generation, editing, and transitions via Gemini Omni Flash",
    match: /\b(ai videos?|video generat\w*|text[- ]to[- ]video|omni|video editing)\b/i
  },
  {
    name: "image-generator",
    kind: "subagent",
    when: "Generate or edit visual assets from a brief",
    match: /\b(ai images?|image generat\w*|text[- ]to[- ]image|hero visual|illustration|artwork|storyboard)\b/i
  },
  {
    name: "gemini-api-dev",
    kind: "skill",
    when: "Any code that calls the Gemini API or builds multimodal AI features",
    match: /\b(gemini|llm|genai|ai videos?|ai images?|ai feature|chatbot|multimodal)\b/i
  },
  {
    name: "chrome-devtools",
    kind: "skill",
    when: "Debug network, console, and runtime errors in the browser",
    match: /\b(console|network|browser|devtools|runtime error|hydration)\b/i
  },
  {
    name: "debug-optimize-lcp",
    kind: "skill",
    when: "Page load and Core Web Vitals work",
    match: /\b(lcp|web vitals|cwv|slow (page|load)|page speed|performance)\b/i
  },
  {
    name: "memory-leak-debugging",
    kind: "skill",
    when: "Memory growth, OOM, heap snapshots",
    match: /\b(memory leak|leak|oom|heap|out of memory)\b/i
  },
  {
    name: "cookie-debugging",
    kind: "skill",
    when: "Session, cookie, and 401/403 issues",
    match: /\b(cookie|session|401|403|samesite|login loop)\b/i
  },
  {
    name: "context7-mcp",
    kind: "mcp",
    when: "Fetch current library docs before using any third-party API",
    pillar: "grounding",
    check: (c) => c.hasStack || c.traits.isCode
  },
  {
    name: "firebase-basics",
    kind: "skill",
    when: "Firebase CLI setup and project selection",
    match: /\bfirebase\b/i
  },
  {
    name: "firebase-auth-basics",
    kind: "skill",
    when: "Sign-in and user management",
    match: /\b(firebase auth|sign[- ]?in|login|authentication)\b/i
  },
  {
    name: "firebase-firestore",
    kind: "skill",
    when: "Firestore data model, queries, and indexes",
    match: /\bfirestore\b/i
  },
  {
    name: "firestore-rules-author",
    kind: "subagent",
    when: "Author or change firestore.rules (mandatory delegate)",
    match: /\b(firestore\.rules|firestore rules|security rules)\b/i
  },
  {
    name: "firebase-security-rules-auditor",
    kind: "skill",
    when: "Audit Firestore and Storage rules",
    match: /\b(firestore|firebase storage|security rules)\b/i,
    types: ["security"]
  },
  {
    name: "firebase-hosting-basics",
    kind: "skill",
    when: "Static site or SPA deploys",
    match: /\b(firebase hosting|static site|spa)\b/i,
    types: ["deploy"]
  },
  {
    name: "firebase-app-hosting-basics",
    kind: "skill",
    when: "Next.js or Angular SSR deploys",
    match: /\b(next(\.js)?|angular|ssr|app hosting)\b/i,
    types: ["deploy"]
  },
  {
    name: "android-cli",
    kind: "skill",
    when: "Create, build, and run Android apps",
    match: /\bandroid\b/i
  },
  {
    name: "generative_ui",
    kind: "skill",
    when: "Show diagrams or interactive visuals in the chat",
    match: /\b(diagram|visuali[sz]e|chart|flowchart)\b/i
  },
  {
    name: "notion-spec-to-implementation",
    kind: "skill",
    when: "Turn a Notion spec into tasks and track progress",
    match: /\bnotion\b/i
  },
  {
    name: "run-workflow",
    kind: "skill",
    when: "Fan out across many files, modules, or review angles",
    match: /\b(every file|all files|whole (repo|codebase)|monorepo|many (files|modules))\b/i
  },
  {
    name: "research",
    kind: "subagent",
    when: "Broad codebase or docs survey and source verification without cluttering context",
    check: (c) => c.taskType === "research" || c.taskType === "refactor" || c.taskType === "security" || c.traits.hasSourceVerify
  }
];
function routeSkills(ctx) {
  if (!ctx.pillars.skills) return [];
  const picked = [];
  const seen = /* @__PURE__ */ new Set();
  const add = (ref) => {
    if (seen.has(ref.name)) return;
    seen.add(ref.name);
    picked.push(ref);
  };
  const maxPortable = ctx.budget === "lean" ? 3 : ctx.budget === "standard" ? 5 : 7;
  let portableCount = 0;
  for (const rule of PORTABLE_SKILLS) {
    if (portableCount >= maxPortable) break;
    if (rule.pillar && !ctx.pillars[rule.pillar]) continue;
    if (rule.check(ctx)) {
      add({ name: rule.name, kind: "approach", when: rule.when });
      portableCount++;
    }
  }
  if (ctx.target === "ide") {
    for (const rule of IDE_SKILLS) {
      if (rule.pillar && !ctx.pillars[rule.pillar]) continue;
      if (rule.check(ctx)) add({ name: rule.name, kind: "skill", when: rule.when });
    }
  }
  if (ctx.target === "antigravity") {
    for (const rule of ANTIGRAVITY_CATALOG) {
      if (rule.pillar && !ctx.pillars[rule.pillar]) continue;
      let hit = false;
      if (rule.check) {
        hit = rule.check(ctx);
      } else {
        const byType = rule.types?.includes(ctx.taskType) ?? false;
        const byText = rule.match?.test(ctx.text) ?? false;
        hit = rule.types && rule.match ? byType && byText : byType || byText;
      }
      if (hit) add({ name: rule.name, kind: rule.kind, when: rule.when });
    }
    if (ctx.pillars.phases && ctx.budget === "thorough") {
      add({
        name: "/plan",
        kind: "command",
        when: "Start the session in planning mode so phases are agreed before execution"
      });
    }
    if (ctx.pillars.clarify && ctx.budget === "thorough") {
      add({
        name: "/grill-me",
        kind: "command",
        when: "Resolve design decisions in an interview before building"
      });
    }
    if (ctx.budget === "thorough" && ctx.tier === "frontier") {
      add({
        name: "/boost",
        kind: "command",
        when: "Deep planning, multiple perspectives, and rigorous verification"
      });
    }
    if (/\b(overnight|long[- ]running|until (it'?s )?done|large project|full app|end[- ]to[- ]end app)\b/i.test(ctx.text)) {
      add({
        name: "/goal",
        kind: "command",
        when: "Long run that should not stop until the goal is met"
      });
    }
  }
  return picked;
}

// src/engine/index.ts
var PILLARS = [
  { key: "tokens", label: "Save tokens", hint: "Brief replies, diffs only, zero filler" },
  { key: "unslop", label: "Unslop and verify", hint: "Clean craft, no fluff, mandatory checks" },
  { key: "clarify", label: "Ask first", hint: "Questions before acting, then wait" },
  { key: "model", label: "Model tuning", hint: "Format and rules for Claude, Gemini, or GPT" },
  { key: "security", label: "Security", hint: "Input validation, secrets, authz, audits" },
  { key: "uiux", label: "Senior UI/UX", hint: "Tokens, states, WCAG 2.2 AA, no AI look" },
  { key: "phases", label: "Phased plan", hint: "Ordered phases with exit gates" },
  { key: "grounding", label: "Grounding", hint: "Evidence per step, verified sources" },
  { key: "skills", label: "Use skills", hint: "Portable approach skills + workspace tools" }
];
var ALL_PILLARS_ON = Object.fromEntries(PILLARS.map((p) => [p.key, true]));
var QUESTION_LIMIT = { lean: 3, standard: 5, thorough: 7 };
var MAX_GOAL = 8e3;
var MAX_FIELD = 2e4;
function splitList(text) {
  return text.split(/\n|;/).map((s) => s.replace(/^\s*[-*\d.)]+\s*/, "").trim()).filter(Boolean);
}
function forge(input2) {
  const goal = input2.goal.slice(0, MAX_GOAL);
  const context = (input2.context ?? "").slice(0, MAX_FIELD);
  const constraintsText = (input2.constraints ?? "").slice(0, MAX_FIELD);
  const stackText = (input2.stack ?? "").slice(0, 500);
  const pillars = { ...ALL_PILLARS_ON, ...input2.pillars };
  const model = MODELS[input2.model] ?? MODELS["claude-sonnet"];
  const answers2 = input2.answers ?? {};
  const allText = [goal, stackText, context, constraintsText, ...Object.values(answers2)].join("\n");
  const detectedTaskType = detectTaskType(goal || allText);
  const taskType = input2.taskType && input2.taskType !== "auto" ? input2.taskType : detectedTaskType;
  const typed = splitList(stackText.replace(/,/g, ";"));
  const dedupedStack = [
    ...new Set(typed),
    ...detectStack(allText).filter((d) => !typed.some((t) => t.toLowerCase().includes(d.toLowerCase())))
  ];
  const typedStack = splitList(stackText).length > 0 || detectStack([goal, context, constraintsText].join("\n")).length > 0;
  const traits = detectTraits(allText, taskType, dedupedStack.length > 0);
  const typedTraits = detectTraits([goal, stackText, context, constraintsText].join("\n"), taskType, typedStack);
  const questionLimit = QUESTION_LIMIT[input2.budget];
  const questions = buildQuestions({
    goal: `${goal}
${constraintsText}`,
    taskType,
    traits: typedTraits,
    hasStack: typedStack,
    limit: questionLimit
  });
  const answered = questions.filter((q) => answers2[q.id]?.trim()).map((q) => ({ q: q.text, a: answers2[q.id].trim().slice(0, MAX_FIELD) }));
  const openQuestions = pillars.clarify ? questions.filter((q) => !answers2[q.id]?.trim()) : [];
  const rules = buildRules(pillars, {
    taskType,
    traits,
    budget: input2.budget,
    target: input2.target,
    modelRules: model.rules,
    questionLimit
  });
  const phases = (pillars.phases ? buildPhases(taskType, input2.budget, model.maxPhases, traits) : []).map(
    (p) => (
      // The open questions are already listed; point to them instead of restating them.
      openQuestions.length ? {
        ...p,
        steps: p.steps.map(
          (s) => /^(Ask |List the open questions|List open questions)/.test(s) ? "Ask the open questions and wait for answers." : s
        )
      } : p
    )
  );
  const skills = routeSkills({
    text: allText,
    taskType,
    traits,
    budget: input2.budget,
    tier: model.tier,
    target: input2.target,
    pillars,
    hasStack: dedupedStack.length > 0
  });
  const prompt = goal.trim() ? assemble({
    goal,
    taskType,
    traits,
    model,
    budget: input2.budget,
    target: input2.target,
    stack: dedupedStack,
    context,
    constraints: splitList(constraintsText),
    answered,
    openQuestions,
    rules,
    phases,
    // Slash commands start the session; they are shown to the user, not put in the prompt.
    skills: skills.filter((s) => s.kind !== "command"),
    gated: pillars.phases && input2.budget === "thorough" && phases.some((p) => p.name === "Plan")
  }) : "";
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
    phases
  };
}

// src/engine/cli.ts
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === void 0 || next.startsWith("--")) out[key] = "true";
    else {
      out[key] = next;
      i++;
    }
  }
  return out;
}
var BUDGETS = ["lean", "standard", "thorough"];
var TARGETS = ["antigravity", "ide", "chat", "api"];
var TYPES = [
  "auto",
  "feature",
  "bugfix",
  "ui",
  "security",
  "refactor",
  "deploy",
  "research",
  "data",
  "test",
  "media",
  "writing",
  "strategy",
  "automation",
  "general"
];
function fail(msg) {
  process.stderr.write(`forge: ${msg}
`);
  process.exit(2);
}
function oneOf(value, allowed, fallback, name) {
  if (value === void 0) return fallback;
  if (!allowed.includes(value)) fail(`--${name} must be one of: ${allowed.join(", ")}`);
  return value;
}
var args = parseArgs(process.argv.slice(2));
if (!args.goal || args.goal === "true") fail("--goal is required");
var answers = {};
if (args.answers) {
  try {
    const parsed = JSON.parse(args.answers);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error();
    const blocked = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"]);
    answers = Object.fromEntries(
      Object.entries(parsed).filter(([k]) => !blocked.has(k)).map(([k, v]) => [k, String(v)])
    );
  } catch {
    fail("--answers must be a JSON object of question id to answer");
  }
}
var off = (args.off ?? "").split(",").map((s) => s.trim()).filter(Boolean);
var input = {
  goal: args.goal,
  model: oneOf(args.model, Object.keys(MODELS), "claude-sonnet", "model"),
  budget: oneOf(args.budget, BUDGETS, "standard", "budget"),
  target: oneOf(args.target, TARGETS, "antigravity", "target"),
  taskType: oneOf(args.type, TYPES, "auto", "type"),
  stack: args.stack,
  context: args.context,
  constraints: args.constraints,
  answers,
  pillars: Object.fromEntries(off.map((p) => [p, false]))
};
var result = forge(input);
if (args.json === "true") {
  process.stdout.write(`${JSON.stringify(result, null, 2)}
`);
} else {
  const header = [
    `# Task: ${result.taskType}${result.taskType !== result.detectedTaskType ? ` (detected ${result.detectedTaskType})` : ""} | Target: ${input.target} | ~${result.tokens} tokens`,
    result.stack.length ? `# Stack: ${result.stack.join(", ")}` : "",
    ...result.lint.map((l) => `# Check (${l.level}): ${l.message} ${l.fix}`),
    ...result.questions.filter((q) => !answers[q.id]).map((q) => `# Question [${q.id}]: ${q.text}`),
    ...result.skills.filter((s) => s.kind === "command").map((s) => `# Start with ${s.name}: ${s.when}`)
  ].filter(Boolean);
  process.stdout.write(`${header.join("\n")}

${result.prompt}
`);
}
