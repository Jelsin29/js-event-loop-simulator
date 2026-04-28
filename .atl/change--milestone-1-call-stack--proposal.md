# Proposal: milestone-1-call-stack

## Intent

Implement the Call Stack data structure for the JS Event Loop Simulator. The call stack is fundamental to understanding JavaScript execution — it's a LIFO structure that tracks function frames during execution. This milestone delivers a working `CallStack` implementation with frame representation, core operations, and overflow detection.

## Scope

### In Scope
- `StackFrame` type/class with: function name, arguments, local variables, return address
- `CallStack` class with: `push()`, `pop()`, `peek()`, `isEmpty()`, `size()`
- Configurable stack overflow detection (max depth)
- Clear error messages for underflow/overflow
- Comprehensive unit tests using TDD approach (tests written first)
- Project setup: tsconfig.json, package.json, Makefile, vitest config

### Out of Scope
- Event loop coordination (milestone 3)
- Microtask/macrotask queues (milestone 2)
- Visualization (milestone 4)
- Real function execution (only frame tracking, not actual JS execution)

## Approach

Build a generic `CallStack<T>` class with generic frame type support. Use TypeScript strict mode. Stack frames are plain objects containing metadata about each function call. Overflow detection throws if `size > maxDepth` on push. Underflow throws if `pop()` called on empty stack.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/call-stack.ts` | New | Core CallStack and StackFrame implementations |
| `src/call-stack.test.ts` | New | Comprehensive unit tests |
| `tsconfig.json` | New | TypeScript configuration (strict mode) |
| `package.json` | New | Project dependencies (vitest) |
| `Makefile` | New | Task runner commands |
| `README.md` | Modified | Document the call stack concept |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| TypeScript strict mode conflicts | Low | Enable incrementally, fix errors |
| Stack overflow detection too aggressive | Low | Make maxDepth configurable, default to 10000 |

## Rollback Plan

Delete `src/call-stack.ts` and `src/call-stack.test.ts`. Revert any config changes. The feature is isolated to its own module.

## Dependencies

- `vitest` for testing (dev dependency)
- No runtime dependencies

## Success Criteria

- [ ] CallStack.push() adds frames to top
- [ ] CallStack.pop() removes and returns frames from top
- [ ] CallStack.peek() returns top frame without removing
- [ ] CallStack.isEmpty() returns true only when empty
- [ ] CallStack.size() returns current frame count
- [ ] StackOverflowError thrown when max depth exceeded
- [ ] StackUnderflowError thrown when pop/peek on empty
- [ ] All tests pass with 100% coverage on call-stack module