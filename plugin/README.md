# Prompt Forge

An Antigravity plugin and companion web app that turn any rough idea into a token-efficient, phased, source-verified prompt tuned for Claude (Opus, Sonnet, Haiku, Fable), Gemini (4 Carbon, Neon, Argon, Hydrogen, 3.5 Flash-Lite), and GPT (GPT-5, GPT-5 mini, GPT-4.1, OpenAI o3) across Antigravity, coding IDEs, web chat, and APIs.

## What's included

- **`/prompt` skill** (`skills/prompt/SKILL.md`): Analyzes any request offline with `scripts/forge.mjs`, surfaces clarifying questions, embeds portable approach skills for every workspace (including Chat), routes installed Antigravity skills when targeting Antigravity, and outputs a ready-to-run prompt.
- **Model guides** (`skills/prompt/references/model-guides.md`): Concise prompting rules for Claude, Gemini, and GPT models.

## Quick CLI usage

```bash
node skills/prompt/scripts/forge.mjs \
  --goal "Create a web app that makes AI videos and images and verify all sources" \
  --model claude-fable \
  --target chat \
  --budget standard
```
