# Tasks: Milestone 2 — Task Queues

## Phase 1: Foundation (Types & Errors)

- [x] 1.1 Create `src/task-queue.ts` with `Callback` type and `TimerConfig` interface
- [x] 1.2 Add `QueueUnderflowError` class to `src/task-queue.ts`
- [x] 1.3 Verify TypeScript compiles after adding types

## Phase 2: Core Implementation

- [x] 2.1 Implement `MicrotaskQueue` class with: enqueue, dequeue, peek, isEmpty, size, drain methods
- [x] 2.2 Implement `MacrotaskQueue` class with same API as MicrotaskQueue
- [x] 2.3 Implement `TimerRegistry` class with: register, cancel, advance, due, clear methods
- [x] 2.4 Use `NoUncheckedIndexedAccess` pattern — add `!` when accessing array elements
- [x] 2.5 Add private ID counter for timer references

## Phase 3: Integration

- [x] 3.1 Export `MicrotaskQueue`, `MacrotaskQueue`, `TimerRegistry` from `src/index.ts`
- [x] 3.2 Export `Callback` type and `TimerConfig` interface from `src/index.ts`
- [x] 3.3 Verify all exports work correctly

## Phase 4: Testing (TDD)

- [x] 4.1 Write failing test: MicrotaskQueue FIFO ordering (enqueue A, B → dequeue returns A then B)
- [x] 4.2 Write failing test: MicrotaskQueue.drain() returns all pending callbacks
- [x] 4.3 Write failing test: MicrotaskQueue throws QueueUnderflowError on dequeue/peek from empty
- [x] 4.4 Write failing test: MacrotaskQueue FIFO ordering
- [x] 4.5 Write failing test: MacrotaskQueue error handling
- [x] 4.6 Write failing test: TimerRegistry.register returns numeric ID
- [x] 4.7 Write failing test: TimerRegistry.due() returns callback after advance(time >= delay)
- [x] 4.8 Write failing test: TimerRegistry setInterval re-registers after due() clears callback
- [x] 4.9 Write failing test: TimerRegistry.cancel() removes pending timer
- [x] 4.10 Run all tests, fix implementation until green

## Phase 5: Cleanup

- [x] 5.1 Commit with conventional message: `feat: add task queues`
- [x] 5.2 Verify tests pass with `npm test`