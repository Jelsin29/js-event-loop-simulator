# Milestone 3: Event Loop Engine — Tasks

## Phase 1: Types & DSL

- [x] 1.1 Define `OperationType` const object and `OperationTypeValue` type
- [x] 1.2 Define `ScriptOperation` interface and `Script` type
- [x] 1.3 Define `ExecutionStepType`, `ExecutionStepTypeValue`, `ExecutionStep` interfaces
- [x] 1.4 Define `EventLoopState` interface

## Phase 2: EventLoopEngine Class

- [x] 2.1 Create `EventLoopEngine` class with CallStack, MicrotaskQueue, MacrotaskQueue, TimerRegistry instances
- [x] 2.2 Implement `execute(script: Script): ExecutionStep[]` — full event loop
- [x] 2.3 Implement `runOperation(op: ScriptOperation)` — dispatch by operation type
- [x] 2.4 Implement `drainMicrotasks()` — while loop draining
- [x] 2.5 Implement `processMacrotasks()` — one-at-a-time with microtask drain after each
- [x] 2.6 Implement `loadScript(script: Script)` and `step(): ExecutionStep | null`
- [x] 2.7 Implement `reset()` — clear all state
- [x] 2.8 Implement `getState(): EventLoopState`

## Phase 3: TDD Tests

- [x] 3.1 Basic script execution (log operations)
- [x] 3.2 setTimeout(0) schedules macrotask, not immediate execution
- [x] 3.3 Promise.resolve().then() schedules microtask, not immediate execution
- [x] 3.4 Microtasks drain BEFORE next macrotask
- [x] 3.5 Nested microtasks drain correctly (while loop behavior)
- [x] 3.6 Classic Jake Archibald example: script start → script end → promise1 → promise2 → timeout
- [x] 3.7 Edge cases: empty script, multiple setTimeouts, interleaving
- [x] 3.8 Call and return operations
- [x] 3.9 Microtask operation type
- [x] 3.10 step() single-step mode
- [x] 3.11 reset() clears all state
- [x] 3.12 getState() snapshot

## Phase 4: Integration & Cleanup

- [x] 4.1 Export all types from src/index.ts
- [x] 4.2 TypeScript strict mode passes
- [x] 4.3 All 99 tests pass (20 call-stack + 49 task-queue + 30 event-loop)
- [x] 4.4 Commits: feat, refactor