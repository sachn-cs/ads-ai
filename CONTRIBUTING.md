# Contributing to cinestudio

We welcome contributions! cinestudio is a Next.js 16 + Strands Agents TypeScript
project. The architecture is a deterministic Graph of 17 agents plus a parallel
render Workflow; please read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) before
opening substantial PRs.

## Getting Started

1. **Fork & Clone**:
   ```bash
   git clone https://github.com/your-username/cinestudio.git
   cd cinestudio
   ```

2. **Install**:
   ```bash
   pnpm install
   pnpm db:migrate
   ```

3. **Verify**:
   ```bash
   pnpm typecheck && pnpm lint && pnpm test
   ```

4. **Run the dev server**:
   ```bash
   pnpm dev
   ```

## Branch Naming

Use Conventional-Commits-style prefixes:

| Prefix | Purpose |
|--------|---------|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `chore/` | Tooling, dependencies, housekeeping |
| `docs/` | Documentation-only changes |
| `test/` | Test additions / fixes |
| `refactor/` | Internal changes without behavior change |

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/). Example:

```
feat(agents): add frame-by-frame music sync agent

The new sync agent runs after the Composer and matches per-shot
tempo to the score's BPM map. It produces a ShotSyncMap that the
Editor consults when cutting.
```

## Code Style

- TypeScript strict mode is mandatory.
- All cross-boundary types use **Zod** schemas (`src/models`).
- All agent outputs use **Strands structuredOutputSchema** — never `.invoke()` and
  hand-parse JSON.
- Components are **shadcn/ui** primitives plus app-level wrappers in `components/`.
- Tailwind utility-first. No ad-hoc CSS modules.
- The Graph node order is `src/graph/cinestudio.ts`. Adding an agent means adding a
  builder in `src/workflow/agent-nodes.ts` and an edge in the Graph.

## Tests

- Every new agent needs a Vitest spec mocking the Strands Agent and asserting the
  prompt construction.
- The Graph needs at least one end-to-end happy-path spec using a fake text provider.
- Use `tests/setup.ts` so the DB starts fresh between tests.

## Pull Requests

- Open a draft PR early. We review structure before implementation.
- Title format: `<type>(<scope>): <subject>`.
- Body: link the issue, summarize the design trade-off, paste the test output.
- All checks must pass (`pnpm ci`). Reviewers squash-merge.

## Extending the Agent Roster

Adding a new agent touches:

1. `src/models/<area>.ts` — Zod output schema
2. `src/prompts/system-prompts.ts` — the agent's reasoning trace + discipline rules
3. `src/agents/<agent-id>.ts` — the agent file
4. `src/agents/index.ts` — append the agent id to `AGENT_IDS`
5. `src/workflow/agent-nodes.ts` — `AgentNode<T>` builder
6. `src/graph/cinestudio.ts` — node + edges

Use this checklist.

## Adding a Render Provider

1. Add the type to `src/types/index.ts` (`RenderProvider` + `RenderProviderConfig`).
2. Add a `render_<provider>` tool in `src/agents/render-dispatcher.ts`. Replace the
   throw with the real SDK call returning a `ShotRenderResult`.
3. Wire the provider's toggle into the onboarding screen.

## License

By contributing you agree that your contributions will be licensed under MIT.
