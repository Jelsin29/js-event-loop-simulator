# JS Event Loop Simulator

A visual simulator for JavaScript's execution model in TypeScript.

## Status

**Milestones 1-3: Core Engine — DONE**

- **Milestone 1: Call Stack** — LIFO stack with push/pop/peek, overflow detection (20 tests)
- **Milestone 2: Task Queues** — MicrotaskQueue (FIFO, drain-all), MacrotaskQueue (FIFO), TimerRegistry with virtual time (49 tests)
- **Milestone 3: Event Loop Engine** — Orchestrates everything, correct microtask-before-macrotask ordering, step mode (30 tests)

**Total: 99 tests passing**

## What It Simulates

The JavaScript event loop behavior:
1. Execute synchronous script code
2. When stack is empty, drain ALL microtasks (while loop!)
3. Process one macrotask, then drain ALL microtasks again
4. Repeat until queues are empty

Shows exactly why `Promise.resolve().then()` runs before `setTimeout(..., 0)`.

## Architecture

```
src/
├── call-stack.ts    # LIFO stack for function frames
├── task-queue.ts    # MicrotaskQueue, MacrotaskQueue, TimerRegistry
├── event-loop.ts    # EventLoopEngine + Script DSL
└── index.ts        # Exports

tests/
├── call-stack.test.ts
├── task-queue.test.ts
└── event-loop.test.ts
```

## Language

TypeScript (strict mode, ES2022, NodeNext)

## Running

```bash
make test      # Run all tests
make typecheck # TypeScript check
make start     # Run demo
```
