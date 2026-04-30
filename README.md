# js-event-loop-simulator

i built this because i kept losing track of why `Promise.resolve().then()` runs BEFORE `setTimeout(..., 0)`. everyone says "microtasks have priority" but that sentence doesn't click until you see it in action.

## what this is

a TypeScript simulator that shows how JavaScript's execution model actually works — the call stack, microtask queue, macrotask queue, and the event loop that orchestrates them all.

the key insight that finally made it click for me:

```
sync code runs first        ← everything in the main script
microtasks drain completely ← Promise.resolve().then() etc
ONE macrotask runs          ← setTimeout, setInterval, etc
microtasks drain again
repeat
```

the "drain completely" part is the tricky bit. it's not "run one microtask" — it's "keep running microtasks until the queue is EMPTY". and if a microtask schedules another microtask, that new one runs too before anything else.

## what actually broke me

**the while loop behavior in drainMicrotasks()**. i initially wrote it as:
```typescript
// WRONG — only runs one microtask
const task = this.microtaskQueue.dequeue();
task();
```

but that's wrong! the spec says ALL microtasks must drain before the next macrotask. so it needs to be:
```typescript
// RIGHT — keeps draining until empty
while (!this.microtaskQueue.isEmpty()) {
  const task = this.microtaskQueue.dequeue();
  task();
}
```

and then i found out another wrinkle — if a microtask schedules another microtask (like chaining promises), the new one gets added to the queue and the while loop picks it up. which is exactly what you want, but it took me three readings of the spec to believe it.

**setInterval re-registration**. when a setInterval timer fires, it doesn't just get removed — it re-registers itself for the next interval. i caught this in the tests:
```typescript
if (timer.isInterval) {
  // Re-register with original delay for next interval
  stillPending.push({ ...timer, remaining: timer.delay });
}
```

without this, setInterval would only fire once instead of repeatedly.

**run-to-completion guarantee**. this is the thing that makes the event loop predictable. once a task (or microtask) starts running, nothing else can interrupt it until its stack is empty. that's why:
```javascript
let i = 0;
Promise.resolve().then(() => i++);
Promise.resolve().then(() => i++);
console.log(i); // Always prints 0, then 1, 2
```

the sync code runs first and prints 0, then the microtasks run one at a time, each finishing before the next starts.

## what i'd do differently

start with the visualizer earlier. i built the core engine first and then added visualization, but watching the state change step-by-step is what makes the concepts click. next time i'd pair the visualizer with the event loop engine from day one.

also, the REPL was a late addition but it's the most useful part for learning. you can type `log("hello")` or `setTimeout(() => { log("fired") }, 100)` and watch what happens. much better than reading test output.

## architecture

```
src/
├── call-stack.ts    # LIFO stack for function frames
├── task-queue.ts    # MicrotaskQueue, MacrotaskQueue, TimerRegistry
├── event-loop.ts    # EventLoopEngine + Script DSL
├── visualizer.ts    # ASCII terminal output
├── parser.ts        # InputParser for REPL
├── repl.ts          # Interactive REPL
└── index.ts         # Exports

tests/
├── call-stack.test.ts    # 20 tests
├── task-queue.test.ts    # 49 tests
├── event-loop.test.ts    # 30 tests
├── visualizer.test.ts    # 25 tests
├── parser.test.ts       # 20 tests
└── repl.test.ts         # 14 tests

demos/
├── jake-archibald.ts    # Classic event loop demo (the one that confuses everyone)
└── repl-demo.ts         # REPL demo
```

## key concepts

- **Call Stack**: LIFO — push on call, pop on return
- **Microtask Queue**: FIFO, drains COMPLETELY before next macrotask (while loop!)
- **Macrotask Queue**: FIFO — setTimeout, setInterval, I/O callbacks
- **Event Loop**: sync → microtasks → macrotask → repeat

## running

```bash
make test        # Run all 158 tests
make typecheck   # TypeScript check
npx tsx demos/jake-archibald.ts  # Run the classic example
```

## interactive REPL

try the interactive REPL to experiment yourself:

```bash
npx tsx src/repl.ts
```

commands:
- `.help` - Show help
- `.state` - Show current execution state
- `.reset` - Clear all state
- `.exit` - Exit REPL

supported syntax:
```
> log("hello")
> setTimeout(() => { log("fired") }, 100)
> Promise.resolve().then(() => { log("done") })
```

## milestones

| Milestone | Status | Tests |
|-----------|--------|-------|
| 1. Call Stack | ✅ Done | 20 |
| 2. Task Queues | ✅ Done | 49 |
| 3. Event Loop Engine | ✅ Done | 30 |
| 4. Visualizer | ✅ Done | 25 |
| 5. Interactive REPL | ✅ Done | 14 |

**Total: 158 tests passing**
