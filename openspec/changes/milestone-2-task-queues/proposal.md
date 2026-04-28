# Proposal: Milestone 2 — Task Queues

## Intent

Implement the Microtask and Macrotask queues that form the backbone of JavaScript's async execution model. This milestone delivers the queue data structures needed for milestone 3 (Event Loop Engine). Without properly implemented queues with correct FIFO ordering and drain behavior, the simulator cannot accurately demonstrate JavaScript's event loop priorities.

## Scope

### In Scope
- **MicrotaskQueue class** — FIFO queue with enqueue, dequeue, isEmpty, peek, size. Must drain COMPLETELY (while loop, not for loop) to handle microtasks scheduling more microtasks.
- **MacrotaskQueue class** — FIFO queue with same API as microtask queue but lower priority.
- **TimerRegistry** — Track pending setTimeout/setInterval timers, advance virtual time, due() returns ready callbacks.
- **Callback types** — Proper TypeScript types for queue elements (functions).
- **Comprehensive tests** — TDD approach, tests written first, covering edge cases like nested microtasks.
- **Export from index** — Wire up new exports.

### Out of Scope
- Event loop integration (milestone 3)
- DSL parser or script execution
- Visualizer output
- Promise resolution simulation

## Approach

Implement three core classes following the same patterns as CallStack:
- Use `NoUncheckedIndexedAccess` — add `!` when accessing array elements
- Custom error classes for underflow/empty states
- Private constructors with static factory methods where appropriate
- Virtual time for timers (not real setTimeout)

Key implementation details:
- **MicrotaskQueue.drain()** — Use `while (!isEmpty())` pattern, NOT pre-counted loop
- **TimerRegistry** — Store remaining time, decrement on advance(), return due timers

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/task-queue.ts` | New | Queue implementations |
| `src/index.ts` | Modified | Export new classes |
| `tests/task-queue.test.ts` | New | TDD tests first |
| `openspec/changes/milestone-2-task-queues/proposal.md` | New | This file |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| For-loop instead of while-loop in drain | High | Write failing test for nested microtasks first |
| Timer precision issues | Medium | Use integer virtual time, not real delays |
| Incorrect FIFO ordering | Low | Test with multiple enqueues followed by dequeues |

## Rollback Plan

If issues arise:
1. Delete `src/task-queue.ts`
2. Remove exports from `src/index.ts`
3. Delete `tests/task-queue.test.ts`
4. Revert any index.ts changes

## Dependencies

- None — this is the foundational layer

## Success Criteria

- [ ] MicrotaskQueue: enqueue → dequeue returns same callback (FIFO)
- [ ] MicrotaskQueue: drain-all behavior works (nested microtasks execute)
- [ ] MacrotaskQueue: enqueue → dequeue returns same callback (FIFO)
- [ ] TimerRegistry: register → advance → due() returns callback
- [ ] TimerRegistry: setInterval re-registers after callback
- [ ] All tests pass (vitest)
- [ ] Code compiles without errors
- [ ] Follows conventional commit: `feat: add task queues`