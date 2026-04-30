# Exploration: JavaScript Event Loop Simulator

## Current State

This is a fresh project (not started). The goal is to build a TypeScript-based simulator that visually demonstrates how JavaScript's execution model works — the call stack, microtask queue, macrotask queue, and the event loop that orchestrates them all.

## Research Summary

### 1. Core Data Structures

#### 1.1 Call Stack (LIFO)
- **What**: A stack of *execution contexts* (stack frames)
- **Behavior**: Push when a function is called, pop when it returns
- **Frame contents**: Function name, arguments, local variables, return address
- **Key invariant**: Only the top frame executes. A frame must fully complete (run-to-completion) before popping.
- **Entry point**: The initial script execution creates the first frame (the "main" or "global" frame)
- **Empty stack**: Signals that the current task/callback has finished — triggers microtask checkpoint

#### 1.2 Microtask Queue (FIFO — Higher Priority)
- **What**: A queue of callbacks that must run BEFORE the next macrotask
- **Sources**:
  - `Promise.resolve().then(...)` — each `.then()` schedules a microtask
  - `queueMicrotask(fn)` — direct microtask enqueue
  - `MutationObserver` callbacks
  - `async/await` — the code after `await` runs as a microtask
- **Critical behavior**: 
  - DRAINS COMPLETELY before the next macrotask
  - Microtasks scheduled DURING microtask processing are added to the END and also executed
  - Risk of infinite loops if microtasks keep scheduling microtasks
- **Microtask checkpoint**: The HTML spec term for "process all microtasks until empty"

#### 1.3 Macrotask Queue / Task Queue (FIFO — Lower Priority)
- **What**: A queue of tasks, each representing a unit of work
- **Sources** (each source is a separate sub-queue, but for a simulator we can use one):
  - `setTimeout(callback, delay)` — schedules a task after delay
  - `setInterval(callback, interval)` — schedules recurring tasks
  - DOM events (click, load, etc.) — each event dispatch is a task
  - I/O callbacks
  - `postMessage`
  - Initial script execution (the very first task)
- **Task sources**: The spec defines multiple task sources (timer source, DOM manipulation source, user interaction source, etc.). The browser can pick which source to service, but within a source, order is FIFO.
- **Between tasks**: The browser MAY update rendering (repaint/reflow)

#### 1.4 Timer Registry (Simulator-specific)
- **What**: A collection of pending timers that haven't fired yet
- **Fields**: callback, delay, remaining time, interval flag (for setInterval)
- **Behavior**: Each event loop tick, decrement timers. When remaining ≤ 0, move callback to macrotask queue

### 2. State Transitions and Rules

#### 2.1 The Event Loop Processing Model (from HTML Spec §8.1.7.3)

The event loop continuously runs these steps:

```
1. Let oldestTask be the oldest task on one of the event loop's task queues
   (if any), ignoring task sources whose "queue a task" steps are not
   currently allowed to run.

2. If oldestTask is undefined:
   a. Perform a microtask checkpoint (drain microtask queue)
   b. Update rendering (optional, browser may skip)
   c. Wait for new tasks → go to step 1

3. Set oldestTask's "document's readiness" to "loading" if applicable.

4. Run oldestTask:
   a. Push execution context onto call stack
   b. Execute the task's code (may push/pop more frames)
   c. When task code completes, stack is empty
   d. Pop the task's frame

5. Perform a microtask checkpoint:
   a. While microtask queue is not empty:
      i.   Take the first microtask
      ii.  Push execution context, run it, pop
      iii. (New microtasks may be added during this loop)

6. Update rendering (browser may paint here)

7. Go to step 1
```

#### 2.2 Key State Transitions

| From State | Trigger | To State |
|------------|---------|----------|
| Stack empty, queues empty | New macrotask arrives | Execute macrotask |
| Stack empty, macrotask done | Microtask checkpoint | Execute all microtasks |
| Microtask queue empty | Rendering opportunity | Update UI, next tick |
| Promise settles | `.then()` called | Microtask enqueued |
| `setTimeout` fires | Delay elapsed | Macrotask enqueued |
| Microtask runs | `queueMicrotask()` called | New microtask at end of queue |
| `await` in async fn | Promise resolves | Continuation as microtask |

#### 2.3 The "Run-to-Completion" Guarantee
- Once a task or microtask starts executing, it CANNOT be interrupted
- No other task/microtask runs until the current one's stack is empty
- This is why `let i = 0; promise.then(() => i++); promise.then(() => i++)` always logs 1, 2 — never a race condition

### 3. The Event Loop Algorithm (Simulator Pseudocode)

```typescript
class EventLoopSimulator {
  callStack: Stack<Frame> = new Stack();
  macrotaskQueue: Queue<Macrotask> = new Queue();
  microtaskQueue: Queue<Microtask> = new Queue();
  timerRegistry: TimerRegistry = new TimerRegistry();
  tickLog: ExecutionStep[] = [];

  // Main loop — one "tick" processes ONE macrotask + ALL microtasks
  runOneTick(): ExecutionStep[] {
    const steps: ExecutionStep[] = [];

    // Step 1: Advance timers
    this.timerRegistry.advance();
    const readyTimers = this.timerRegistry.due();
    for (const timer of readyTimers) {
      this.macrotaskQueue.enqueue(timer.callback);
      steps.push({ type: 'timer-fired', timer });
    }

    // Step 2: Pick oldest macrotask (or skip if none)
    const task = this.macrotaskQueue.dequeue();
    if (task) {
      steps.push({ type: 'macrotask-start', task });
      this.callStack.push(createFrame(task));
      
      // Execute the task — may push/pop frames, schedule more tasks
      const taskSteps = this.executeStack();
      steps.push(...taskSteps);
      
      this.callStack.pop();
      steps.push({ type: 'macrotask-end', task });
    }

    // Step 3: Microtask checkpoint — drain COMPLETELY
    steps.push({ type: 'microtask-checkpoint-start' });
    while (!this.microtaskQueue.isEmpty()) {
      const microtask = this.microtaskQueue.dequeue();
      steps.push({ type: 'microtask-start', microtask });
      this.callStack.push(createFrame(microtask));
      const microSteps = this.executeStack();
      steps.push(...microSteps);
      this.callStack.pop();
      steps.push({ type: 'microtask-end', microtask });
    }
    steps.push({ type: 'microtask-checkpoint-end' });

    // Step 4: Rendering opportunity (simulator can show this)
    steps.push({ type: 'render-opportunity' });

    return steps;
  }

  // Execute all frames on the stack until empty
  executeStack(): ExecutionStep[] {
    const steps: ExecutionStep[] = [];
    // In the simulator, each "task" is a pre-parsed sequence of operations
    // Each operation may push/pop frames or schedule tasks/microtasks
    return steps;
  }

  // Public API for scheduling
  setTimeout(callback: () => void, delay: number) {
    this.timerRegistry.register(callback, delay, false);
  }

  queueMicrotask(callback: () => void) {
    this.microtaskQueue.enqueue(callback);
  }

  resolvePromise(callback: () => void) {
    // Promise .then() callbacks are microtasks
    this.microtaskQueue.enqueue(callback);
  }
}
```

### 4. Edge Cases to Handle

#### 4.1 Microtasks Scheduling More Microtasks
```javascript
queueMicrotask(() => {
  console.log('A');
  queueMicrotask(() => console.log('B'));
});
queueMicrotask(() => console.log('C'));
// Output: A, B, C — NOT A, C, B
// B was added during microtask processing, runs before next macrotask
```
**Simulator requirement**: The microtask drain loop must check `!isEmpty()` each iteration, not pre-count.

#### 4.2 `setTimeout(0)` vs `Promise.resolve()`
```javascript
setTimeout(() => console.log('timeout'), 0);
Promise.resolve().then(() => console.log('promise'));
// Output: 'promise' THEN 'timeout'
// Even with 0ms delay, setTimeout schedules a macrotask
// Promise schedules a microtask, which has priority
```

#### 4.3 Nested Promise Chains
```javascript
Promise.resolve()
  .then(() => console.log(1))
  .then(() => console.log(2))
  .then(() => console.log(3));
// Each .then() schedules a microtask AFTER the previous one resolves
// Output: 1, 2, 3 — each in its OWN microtask tick
```
**Simulator requirement**: `.then()` doesn't run immediately — it schedules a microtask. Chained `.then()`s create a cascade of microtasks.

#### 4.4 Promise Inside setTimeout
```javascript
setTimeout(() => {
  console.log('timeout start');
  Promise.resolve().then(() => console.log('promise inside timeout'));
  console.log('timeout end');
}, 0);
Promise.resolve().then(() => console.log('promise before timeout'));
// Output: 'promise before timeout', 'timeout start', 'timeout end', 'promise inside timeout'
```

#### 4.5 Multiple setTimeout(0) Order
```javascript
setTimeout(() => console.log('A'), 0);
setTimeout(() => console.log('B'), 0);
// Output: A, B — FIFO order within the same task source
```

#### 4.6 Microtask Checkpoint After Each Callback (Not Just End of Task)
From the HTML spec: "If the stack of script settings objects is now empty, perform a microtask checkpoint."
This means microtasks run after EACH callback returns (if stack is empty), not just at end of task.
However, if callbacks are nested (like `element.click()` dispatching synchronously), the stack isn't empty between them.

#### 4.7 `async/await` Desugaring
```javascript
async function foo() {
  console.log('A');
  await Promise.resolve();
  console.log('B');
}
foo();
console.log('C');
// Output: A, C, B
// The code after 'await' runs as a microtask
```

#### 4.8 setInterval Behavior
- `setInterval` schedules tasks at fixed intervals
- If a setInterval callback takes longer than the interval, callbacks queue up (no skipping in basic model)
- In practice, browsers may skip overlapping intervals

#### 4.9 Error Handling
- Uncaught errors in a task: task ends, stack clears, microtask checkpoint still runs
- Rejected promises without `.catch()`: tracked by `HostPromiseRejectionTracker`
- Errors in microtasks: same behavior — microtask ends, remaining microtasks still run

### 5. Key Terminology

| Term | Definition |
|------|-----------|
| **Task (macrotask)** | A unit of work scheduled on the task queue (setTimeout, events, I/O) |
| **Microtask** | Higher-priority callback that runs after current task, before next task |
| **Task source** | A category of tasks (timer source, DOM source, etc.) — guarantees FIFO within source |
| **Microtask checkpoint** | The process of draining the entire microtask queue |
| **Run-to-completion** | Guarantee that a task/microtask runs fully without interruption |
| **Execution context** | A stack frame tracking function state, variables, and return point |
| **Realm** | A global environment (globalThis, built-in constructors) |
| **Agent** | A thread-like execution context with its own stack, heap, and event loop |
| **Job** | ECMAScript term equivalent to microtask |
| **Wind-down** | Informal term for the microtask checkpoint at end of task |

### 6. Simulator Architecture Options

| Approach | Pros | Cons | Complexity |
|----------|------|------|------------|
| **A. Pre-parsed DSL** — User writes a simple DSL that gets parsed into operations | Easy to control execution, deterministic, great for visualization | Less realistic, doesn't run real JS code | Low |
| **B. AST-based simulator** — Parse real JS, walk AST, simulate execution | More realistic, can handle real code snippets | Very complex to implement correctly (scoping, closures, etc.) | High |
| **C. Step-through executor** — User provides code as an array of labeled steps | Simplest to implement, perfectly deterministic | Requires manual step definition | Lowest |

**Recommendation**: Start with **Approach A** (pre-parsed DSL) for Milestones 1-3. The DSL can represent:
- Function calls (push to stack)
- Returns (pop from stack)
- `log` statements (output)
- `setTimeout` calls (schedule macrotask)
- `Promise.resolve().then()` (schedule microtask)
- `queueMicrotask` (schedule microtask)

This gives us full control over execution order while teaching the real concepts. Approach B can be a future enhancement.

### 7. Proposed DSL Format

```typescript
// A "script" is an array of operations
interface ScriptOperation {
  type: 'call' | 'return' | 'log' | 'setTimeout' | 'promise' | 'microtask';
  name?: string;       // function/operation name
  delay?: number;      // for setTimeout
  children?: ScriptOperation[]; // nested operations (function body)
}

// Example: the classic Jake Archibald example
const script: ScriptOperation[] = [
  { type: 'log', name: 'script start' },
  { type: 'setTimeout', name: 'setTimeout', delay: 0, children: [
    { type: 'log', name: 'setTimeout' }
  ]},
  { type: 'promise', name: 'promise1', children: [
    { type: 'log', name: 'promise1' },
    { type: 'promise', name: 'promise2', children: [
      { type: 'log', name: 'promise2' }
    ]}
  ]},
  { type: 'log', name: 'script end' }
];
// Expected output: script start, script end, promise1, promise2, setTimeout
```

### 8. Key References

1. **[Jake Archibald — "Tasks, microtasks, queues and schedules"](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/)** — The definitive practical guide. Includes the famous click/MutationObserver/Promise example.
2. **[Jake Archibald — "In The Loop" (JSConf.Asia 2018)](https://www.youtube.com/watch?v=cCOL7MC4Pl0)** — Visual talk showing the event loop in action with animations.
3. **[MDN — JavaScript execution model](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model)** — Covers agents, realms, stack, job queue.
4. **[MDN — Microtask guide](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide)** — queueMicrotask, tasks vs microtasks, batching.
5. **[HTML Spec §8.1.7 — Event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)** — The authoritative specification. Defines tasks, microtasks, processing model.
6. **[HTML Spec §8.1.7.3 — Event loop processing model](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model)** — The exact algorithm the browser follows.
7. **[ECMAScript Spec — Jobs and Job Queues](https://tc39.es/ecma262/#sec-jobs-and-job-queues)** — ECMAScript's "job" concept (equivalent to microtasks).
8. **[Philip Roberts — "What the heck is the event loop anyway?" (JSConf 2014)](https://www.youtube.com/watch?v=8aGhZQkoFbQ)** — Great introductory talk (doesn't cover microtasks).

## Recommendation

Build the simulator in 4 milestones as defined in AGENTS.md:

1. **Call Stack** — LIFO stack with frame representation, push/pop, visualization
2. **Task Queues** — Microtask and macrotask queues with correct priority ordering
3. **Event Loop Engine** — The main loop processing tasks → microtasks → render
4. **Visualizer** — Terminal/HTML output showing step-by-step execution state

Use Approach A (pre-parsed DSL) for the initial implementation. This keeps complexity manageable while teaching the core concepts accurately.

## Risks

- **Scope creep on DSL**: Making the DSL too expressive turns this into a JS interpreter. Keep it minimal — just enough to demonstrate event loop behavior.
- **Timer accuracy**: Simulating `setTimeout` with real delays makes tests flaky. Use virtual/deterministic time advancement instead.
- **Promise complexity**: Real Promise behavior has subtle edge cases (e.g., `Promise.resolve(thenable)`). The simulator should handle basic `.then()` chains correctly but doesn't need full Promise/A+ compliance.
- **Visualization complexity**: Don't over-engineer the visualizer in early milestones. Start with terminal output, add HTML later.

## Ready for Proposal

**Yes** — The problem space is well understood. The next step is to create a change proposal for Milestone 1 (Call Stack implementation).
