# Model Prompting Reference

Concise rules used by Prompt Forge when tuning prompts across Claude, Gemini, and GPT models.

## Claude (Opus, Sonnet, Haiku, Fable)

- **Structure**: XML-tagged sections (`<context>`, `<goal>`, `<constraints>`, `<rules>`, `<phases>`, `<skills>`, `<output_format>`). Clear delimiters keep instructions separate from user data.
- **Tone**: Calm and direct. Give the brief reason behind non-obvious constraints instead of all-caps emphasis (`MUST`, `NEVER`).
- **Model sizing**:
  - `claude-opus`: Up to 6 phases; strong at architecture trade-offs, security audits, and multi-file plans.
  - `claude-sonnet`: Up to 6 phases; encourages parallel independent reads/searches and tight phase scoping.
  - `claude-haiku`: Cap at 4 phases with explicit numbered steps and a stop-and-ask rule on ambiguity.
  - `claude-fable`: Up to 6 phases; tuned for expressive creative, narrative, product, and design craft while staying anchored to real constraints and verified facts.

## Gemini (4 Carbon, 4 Neon, 4 Argon, 4 Hydrogen, 3.5 Flash-Lite)

- **Structure**: Clean Markdown headings (`## Context`, `## Constraints`, `## Rules`, `## Phases`, `## Skills`, `## Output format`, `## Task`).
- **Task placement**: Place `## Task` at the end, after context and rules, so the model anchors on the exact objective after reading all constraints.
- **Assumptions**: Require explicit statement of assumptions before acting.
- **Model sizing**:
  - `gemini-carbon` / `gemini-neon`: Up to 6 phases; deep reasoning for design, debugging, multimodal systems, and source/security audits.
  - `gemini-argon` / `gemini-hydrogen`: Up to 5 phases; small, verifiable increments.
  - `gemini-flash-lite`: Cap at 4 phases; concise steps, no open-ended exploration.

## GPT / OpenAI (GPT-5, GPT-5 mini, GPT-4.1, OpenAI o3)

- **Structure**: Clean Markdown headings with `## Goal` placed near the top, followed by `## Context`, `## Constraints`, `## Rules`, `## Phases`, `## Skills`, and `## Output format`.
- **Model sizing**:
  - `gpt-5`: Up to 6 phases; thorough architecture, edge-case coverage, and verification without scope creep.
  - `gpt-5-mini`: Up to 5 phases; short verifiable steps with clear exit checks.
  - `gpt-4.1`: Up to 5 phases; literal instruction follower — keep constraints explicit and flag conflicts.
  - `o3`: Up to 5 phases; reasoning model — emphasize the end goal, hard constraints, and verifiable exit criteria without micromanaging intermediate chain-of-thought.

## Portable Skills Across Every Workspace

- **Every workspace** (`chat`, `ide`, `api`, `antigravity`) receives portable `approach` skills matched to the user's idea (such as `AI media pipeline`, `Source and claim verification`, `Design craft and UI states`, `Threat modeling and OWASP check`, `Root-cause debugging`, `Editorial clarity and structure`, or `Workflow and failure recovery`).
- **Coding IDEs** (`ide`) add local workspace context scanning and terminal test/build verification.
- **Antigravity** (`antigravity`) layers installed skills, MCP servers, subagents, and session slash commands on top.
