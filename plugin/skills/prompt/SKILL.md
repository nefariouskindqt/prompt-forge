---
name: prompt
description: >-
  Turns any rough idea (software, AI video/image apps, UI/UX, security, writing,
  strategy, automation, or research) into a token-efficient, phased, verified
  prompt tuned for Claude (Opus, Sonnet, Haiku, Fable), Gemini (4 Carbon, Neon,
  Argon, Hydrogen, 3.5 Flash-Lite), and GPT (GPT-5, GPT-5 mini, GPT-4.1, o3)
  across Antigravity, coding IDEs, web chat, and APIs—with portable approach
  skills included in every workspace. Use when the user invokes /prompt, asks to
  write, optimize, or structure a prompt, or wants a phased plan before acting.
---

# Prompt Forge (`/prompt`)

Generate high-signal, low-token prompts tailored to any idea, target model, and workspace using the bundled deterministic engine.

## Workflow

1. **Run the engine first.**
   Execute [forge.mjs](./scripts/forge.mjs) with the user's request and any known parameters:

   ```bash
   node <skill-dir>/scripts/forge.mjs \
     --goal "<user request>" \
     --model <claude-opus|claude-sonnet|claude-haiku|claude-fable|gemini-carbon|gemini-neon|gemini-argon|gemini-hydrogen|gemini-flash-lite|gpt-5|gpt-5-mini|gpt-4.1|o3> \
     --budget <lean|standard|thorough> \
     --target <antigravity|ide|chat|api> \
     [--type <auto|feature|bugfix|ui|security|refactor|deploy|research|data|test|media|writing|strategy|automation|general>] \
     [--stack "<tools, frameworks, or versions>"] \
     [--context "<background or audience notes>"] \
     [--constraints "<semicolon-separated constraints>"] \
     [--off "<comma-separated pillars to disable>"] \
     --json
   ```

   Defaults: `--model claude-sonnet`, `--budget standard`, `--target antigravity`, `--type auto`.

2. **Check lint warnings and open questions.**
   Read the JSON output (`lint`, `questions`, `taskType`, `traits`, `stack`, `skills`, `tokens`).
   - If the request is ambiguous or missing critical facts (audience, stack/providers, acceptance criteria, or scope) and the user did not say "skip questions", ask the top 2–4 questions from `questions` (prefer `ask_question` when options are clear, otherwise concise plain text) and wait for answers.
   - Skip asking if the codebase or user message already answers them; fold known facts into `--context` or `--stack`.

3. **Re-run with answers.**
   Pass the user's replies via `--answers '{"id":"answer"}'`, producing the complete prompt with answered facts moved into context, portable approach skills embedded for every target workspace (including `chat`, `ide`, and `api`), and Antigravity-native skills added when `--target antigravity`.

4. **Optional editorial tightening pass.**
   Review the generated prompt against [references/model-guides.md](./references/model-guides.md):
   - Cut redundant words without dropping any phase, exit criterion, constraint, source-verification check, security rule, or routed skill.
   - Never invent file paths, library APIs, model IDs, or requirements not supplied by the user.
   - Keep XML tags for Claude models (including `claude-fable`), Markdown headings with `## Task` anchored last for Gemini models, and Markdown headings with `## Goal` up front for GPT / OpenAI models.

5. **Deliver and advise.**
   Return:
   - The final ready-to-copy prompt in a single fenced block.
   - One short metadata line: target model, workspace (`antigravity`, `ide`, `chat`, or `api`), idea type, estimated token count, and any recommended slash commands (`/plan`, `/grill-me`, `/boost`, `/goal`) when targeting Antigravity.
   - Ask whether the user wants to run the prompt now or adjust budget/pillars.

## Available Pillars (`--off` to disable)

| Key | Purpose |
| :--- | :--- |
| `tokens` | Brief replies, diffs only for code, zero filler |
| `unslop` | Code hygiene + tests (for code) or crisp draft review (for non-code) |
| `clarify` | Ask high-impact questions before acting, then wait |
| `model` | Model-specific formatting and behavioral rules |
| `security` | Input validation, server-side secrets, authz, dependency auditing |
| `uiux` | Design tokens, all UI states, WCAG 2.2 AA, anti-AI-slop rules |
| `phases` | Ordered phases with exit gates (plus automatic source verification phase when requested) |
| `grounding` | Evidence per step, read-before-edit, primary-source verification |
| `skills` | Portable approach skills in every workspace + Antigravity/IDE tools when applicable |
