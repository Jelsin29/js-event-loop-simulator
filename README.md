# JS Event Loop Simulator

A visual simulator for JavaScript's execution model in TypeScript.

## What It Demonstrates

Why `Promise.resolve().then()` ALWAYS runs before `setTimeout(..., 0)`:

```
script start     ← sync code runs first
script end       ← sync code finishes
promise1         ← microtask (priority queue!)
promise2         ← another microtask (chained)
timeout          ← macrotask (lower priority)
```

## Architecture

```
src/
├── call-stack.ts    # LIFO stack for function frames
├── task-queue.ts    # MicrotaskQueue, MacrotaskQueue, TimerRegistry
├── event-loop.ts    # EventLoopEngine + Script DSL
├── visualizer.ts    # ASCII terminal output
└── index.ts        # Exports

tests/
├── call-stack.test.ts    # 20 tests
├── task-queue.test.ts    # 49 tests
├── event-loop.test.ts    # 30 tests
└── visualizer.test.ts   # 25 tests

demos/
└── jake-archibald.ts    # Classic event loop demo
```

## Key Concepts

- **Call Stack**: LIFO — push on call, pop on return
- **Microtask Queue**: FIFO, drains COMPLETELY before next macrotask (while loop!)
- **Macrotask Queue**: FIFO — setTimeout, setInterval, I/O callbacks
- **Event Loop**: sync → microtasks → macrotask → repeat

## Running

```bash
make test        # Run all 124 tests
make typecheck   # TypeScript check
npx tsx demos/jake-archibald.ts  # Run demo
```

## Milestones

| Milestone | Status | Tests |
|-----------|--------|-------|
| 1. Call Stack | ✅ Done | 20 |
| 2. Task Queues | ✅ Done | 49 |
| 3. Event Loop Engine | ✅ Done | 30 |
| 4. Visualizer | ✅ Done | 25 |

**Total: 124 tests passing**
