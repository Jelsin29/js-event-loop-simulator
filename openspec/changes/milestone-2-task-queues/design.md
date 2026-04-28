# Design: Milestone 2 — Task Queues

## Technical Approach

Implement three core classes (MicrotaskQueue, MacrotaskQueue, TimerRegistry) as pure TypeScript data structures. Use virtual time for timers to ensure deterministic, testable behavior. Follow the same patterns as the existing CallStack module: NoUncheckedIndexedAccess compliance, custom error classes, and factory methods where appropriate.

## Architecture Decisions

### Decision: Queue Implementation Storage

**Choice**: Use TypeScript array as underlying storage
**Alternatives considered**: Linked list, circular buffer
**Rationale**: JavaScript arrays are optimized for push/shift operations. Simplicity over micro-optimization for this learning project.

### Decision: Timer Virtual Time

**Choice**: Explicit advance(time) method, not real setTimeout
**Alternatives considered**: Real-time setTimeout, callback-based async
**Rationale**: Real-time delays make tests flaky and non-deterministic. Virtual time allows precise control in tests.

### Decision: Timer Identifier

**Choice**: Generate numeric IDs for timer references
**Alternatives considered**: Return callback directly, use UUID
**Rationale**: Numeric IDs align with how browsers handle timer references (setTimeout returns numeric ID). Allows cancellation support for future milestones.

### Decision: Drain Return Value

**Choice**: drain() returns array of all callbacks, doesn't execute them
**Alternatives considered**: Execute callbacks directly in drain
**Rationale**: Separates queue management from execution. The Event Loop Engine (milestone 3) will handle execution, keeping concerns separated.

## Data Flow

```
TimerRegistry                    MicrotaskQueue           MacrotaskQueue
┌─────────────────────┐          ┌─────────────────┐    ┌─────────────────┐
│ register(cb, 100)  │          │ enqueue(cb)     │    │ enqueue(cb)     │
│   ↓                │          │   ↓             │    │   ↓             │
│ pending: [{cb, 100}]│          │ queue: [cb1,   │    │ queue: [cb1,    │
│   ↓                │          │        cb2]     │    │        cb2]     │
│ advance(110)       │          │   ↓             │    │   ↓             │
│   ↓                │          │ dequeue()→cb1  │    │ dequeue()→cb1   │
│ due() → [cb]       │          │   ↓             │    │   ↓             │
│   ↓                │          │ drain()→[all]  │    │ drain()→[all]   │
│ macrotaskQueue     │          │   ↓             │    │   ↓             │
│   .enqueue(cb)     │          │ execute in      │    │ execute in      │
└─────────────────────┘          │ event loop      │    │ event loop      │
                                └─────────────────┘    └─────────────────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/task-queue.ts` | Create | Queue implementations (MicrotaskQueue, MacrotaskQueue, TimerRegistry) |
| `src/index.ts` | Modify | Export new classes and types |
| `tests/task-queue.test.ts` | Create | Comprehensive TDD tests |
| `openspec/changes/milestone-2-task-queues/design.md` | Create | This file |

## Interfaces / Contracts

```typescript
// Callback type for queues
type Callback = () => void;

// Timer configuration
interface TimerConfig {
  callback: Callback;
  delay: number;
  isInterval: boolean;
  remaining: number;
  id: number;
}

// QueueUnderflowError for empty queue operations
class QueueUnderflowError extends Error {
  constructor(queueName: string);
}

// MicrotaskQueue: FIFO, drains completely
class MicrotaskQueue {
  enqueue(callback: Callback): void;
  dequeue(): Callback;
  peek(): Callback;
  isEmpty(): boolean;
  size(): number;
  drain(): Callback[];  // Returns ALL pending callbacks
}

// MacrotaskQueue: FIFO
class MacrotaskQueue {
  enqueue(callback: Callback): void;
  dequeue(): Callback;
  peek(): Callback;
  isEmpty(): boolean;
  size(): number;
  drain(): Callback[];
}

// TimerRegistry: Virtual time tracking
class TimerRegistry {
  register(callback: Callback, delay: number, isInterval: boolean): number;
  cancel(timerId: number): boolean;
  advance(time: number): void;
  due(): Callback[];
  clear(): void;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | MicrotaskQueue FIFO | Enqueue 3, dequeue 3, verify order |
| Unit | MicrotaskQueue nested drain | Schedule during drain, verify execution order |
| Unit | MacrotaskQueue FIFO | Same as microtask |
| Unit | TimerRegistry due | Register timer, advance partially, verify due returns only ready |
| Unit | TimerRegistry interval | Verify interval re-registers after fire |
| Unit | Error handling | Verify QueueUnderflowError on empty |

## Migration / Rollout

No migration required. This is a new module being added to the existing project structure.

## Open Questions

- [ ] None — design follows existing CallStack patterns

## Next Step

Ready for tasks (sdd-tasks) to break down implementation into actionable items.