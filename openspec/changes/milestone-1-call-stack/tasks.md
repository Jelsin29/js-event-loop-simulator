# Milestone 1 — Call Stack Tasks

Implementation tasks for the Call Stack milestone.

## Task Checklist

### Phase 1: Project Setup

- [x] Create tsconfig.json with strict mode and NodeNext module
- [x] Configure package.json with vitest and TypeScript dependencies
- [x] Create Makefile with test and typecheck targets
- [x] Configure vitest.config.ts
- [x] Initialize git repository

### Phase 2: StackFrame Implementation

- [x] Define `StackFrameData` interface with functionName, arguments, localVariables, returnAddress
- [x] Implement `StackFrame` class with private constructor
- [x] Add `StackFrame.create()` static factory method
- [x] Add readonly properties: functionName, arguments, localVariables, returnAddress

### Phase 3: Error Classes

- [x] Implement `StackOverflowError` extending Error with max depth in message
- [x] Implement `StackUnderflowError` extending Error with clear message
- [x] Verify error names are correct for catch filtering

### Phase 4: CallStack Core

- [x] Implement `CallStack` class with private frames array
- [x] Add configurable maxDepth option with default of 10000
- [x] Implement `push(frame)` with overflow detection
- [x] Implement `pop()` with underflow detection and LIFO return
- [x] Implement `peek()` with underflow detection
- [x] Implement `isEmpty()` query method
- [x] Implement `size()` query method
- [x] Implement `getMaxDepth()` accessor

### Phase 5: Testing

- [x] Write StackFrame tests (4 cases)
- [x] Write CallStack.push tests (3 cases including overflow)
- [x] Write CallStack.pop tests (3 cases including underflow)
- [x] Write CallStack.peek tests (2 cases including underflow)
- [x] Write CallStack.isEmpty tests (3 cases)
- [x] Write CallStack.size tests (3 cases)
- [x] Write error message tests (2 cases)
- [x] Verify all 20 tests pass

### Phase 6: Integration

- [x] Export CallStack and related types from src/index.ts
- [x] Verify TypeScript compilation passes
- [x] Verify `npm run typecheck` passes
- [x] Verify `npm test` passes all 158 tests (including new call-stack tests)

### Phase 7: Documentation

- [x] Update README.md with call stack concept explanation
- [x] Add architecture diagram to README
- [x] Document running instructions

## Completion Criteria

- [x] CallStack.push() adds frames to top
- [x] CallStack.pop() removes and returns frames from top
- [x] CallStack.peek() returns top frame without removing
- [x] CallStack.isEmpty() returns true only when empty
- [x] CallStack.size() returns current frame count
- [x] StackOverflowError thrown when max depth exceeded
- [x] StackUnderflowError thrown when pop/peek on empty
- [x] All 20 tests pass
- [x] TypeScript compiles without errors
- [x] README updated with concept explanation

## Files Created/Modified

| File | Action |
|------|--------|
| src/call-stack.ts | Created |
| src/index.ts | Created |
| tests/call-stack.test.ts | Created |
| tsconfig.json | Created |
| package.json | Created |
| Makefile | Created |
| vitest.config.ts | Created |
| README.md | Modified |

## Time Spent

This milestone establishes the foundation. Estimated: 2-3 hours for someone new to TypeScript strict mode patterns.
