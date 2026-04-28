# Design: Milestone 4 - Event Loop Visualizer

## Technical Approach

Create a Visualizer class that takes ExecutionStep[] (from EventLoopEngine.execute()) and renders ASCII output showing call stack, task queues, timers, and execution log. The visualizer operates on pre-computed steps — it doesn't track live engine state but renders snapshots at specific points.

## Architecture Decisions

### Decision: ExecutionStep[] vs Live Engine

**Choice**: Accept `ExecutionStep[]` from `engine.execute()` in constructor
**Alternatives considered**: Accept EventLoopEngine instance directly, wrap engine for live updates
**Rationale**: Simpler — steps are already computed and immutable. Consumer calls `engine.execute()` then passes result to Visualizer. No need to track live state changes.

### Decision: ASCII Box-Drawing Characters

**Choice**: Use box-drawing characters (┌─┐│└┘) for framing sections
**Alternatives considered**: Plain text with dashes, Unicode boxes (═║), HTML tags
**Rationale**: Standard terminal aesthetic, readable, works in most terminals. Follows convention from user requirements showing "=== Event Loop State ===" format.

### Decision: Rendering Individual Queues vs Combined

**Choice**: Individual `render*()` methods + combined `renderState()`
**Alternatives considered**: Only combined render, only individual
**Rationale**: Individual methods allow testing each component in isolation. Combined `renderState()` is the common case for demos.

## Data Flow

```
EventLoopEngine.execute(script)
         │
         ▼
    ExecutionStep[]
         │
         ▼
    Visualizer(steps)
         │
         ▼
   renderCallStack() ──→ ASCII string
   renderMicrotaskQueue() ──→ ASCII string
   renderMacrotaskQueue() ──→ ASCII string
   renderTimerRegistry() ──→ ASCII string
   renderState() ──→ Combined ASCII
   renderExecutionLog() ──→ Log entries
```

Note: The visualizer tracks `currentStepIndex` internally to render state at any point. After `renderState(n)` shows state after n steps.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/visualizer.ts` | Create | Visualizer class with all render methods |
| `tests/visualizer.test.ts` | Create | Unit tests for render output |
| `demos/jake-archibald.ts` | Create | Demo script with classic example |
| `src/index.ts` | Modify | Export Visualizer class |

## Interfaces / Contracts

```typescript
import type { ExecutionStep } from './event-loop.js';

export interface VisualizerOptions {
  showTimestamps?: boolean;
}

export class Visualizer {
  constructor(steps: ExecutionStep[], options?: VisualizerOptions);
  currentStepIndex: number;

  renderCallStack(): string;
  renderMicrotaskQueue(): string;
  renderMacrotaskQueue(): string;
  renderTimerRegistry(): string;
  renderState(): string;
  renderExecutionLog(): string;

  // Step navigation
  stepTo(index: number): void;
  nextStep(): void;
  reset(): void;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | renderCallStack() output format | Assert exact string output |
| Unit | renderMicrotaskQueue() with empty/non-empty | Both cases |
| Unit | renderMacrotaskQueue() with empty/non-empty | Both cases |
| Unit | renderTimerRegistry() with timers | Check format with delay |
| Unit | renderExecutionLog() with various step types | Test log/functionCall/functionReturn |
| Integration | Full demo runs without error | Run demo, verify no throw |

## Migration / Rollout

No migration required. This is a new module that doesn't affect existing engine functionality.

## Open Questions

- [ ] None — the design is straightforward based on the spec

## Next Step

Ready for tasks (sdd-tasks).