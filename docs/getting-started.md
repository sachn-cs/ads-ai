# Getting Started

## 1. Install

```bash
git clone https://github.com/your-org/cinestudio.git
cd cinestudio
pnpm install
```

## 2. Apply the database schema

```bash
pnpm db:migrate
```

This creates `./data/cinestudio.db` (or whatever `CINESTUDIO_DATA_DIR` points to).

## 3. Start the dev server

```bash
pnpm dev
```

Visit http://localhost:3000. You'll be redirected to the onboarding screen.

## 4. Configure a text provider

Pick one of: Bedrock (default), Anthropic, OpenAI, Google Gemini, Ollama, or
MiniMax. Enter the credentials. The form validates:

- API key requirement (Bedrock and Ollama do not require keys if running locally)
- Model identifier
- Region (Bedrock only)

Enable any of the render providers (Veo, Sora, Runway) you have access to. You can
disable all of them and the platform will still produce the brief, script,
storyboard, score plan, sound design, and color direction — you just won't get
rendered videos.

## 5. Start your first film

From the dashboard, click **New film**. Describe what you want — a logline, full
treatment, or reference imagery. The Genres selector tags the brief so the
Showrunner knows the target format.

## 6. Watch it run

The run detail page streams SSE events in real time. You'll see:

- A timeline of agents as they start and complete
- An event log with timestamps
- Per-agent JSON output (collapsible)

When the run finishes, you'll see the composite decision (GO / CONDITIONAL / NO-GO)
and the total renders ok vs failed.

## 7. Inspect artifacts

Every run writes to `./artifacts/runs/<run-id>/`:

- `prompt.txt` — your original input
- `graph-result.json` — the final Strands Graph result
- Plus a record per agent output in SQLite (`./data/cinestudio.db`)

## 8. Iterate

Open the critic output for a shot, write a directive, and rerun — the platform will
preserve your GO shots and re-render only the ones you flagged.
