# Milestone 1 — Call Stack Technical Design

## Overview

The Call Stack is the foundational data structure for the JS Event Loop Simulator. It represents the LIFO stack that tracks function execution frames during JavaScript code execution. This milestone implements only the call stack — no event loop integration yet.

## Architecture

### Data Model

```
StackFrameData (interface)
├── functionName: string
├── arguments: unknown[]
├── localVariables: Record<string, unknown>
└── returnAddress?: string

StackFrame (class)
├── readonly functionName: string
├── readonly arguments: unknown[]
├── readonly localVariables: Record<string, unknown>
├── readonly returnAddress?: string
└── private constructor(data: StackFrameData)
    └── static create(): StackFrame

CallStack (class)
├── private frames: StackFrame[]
├── private readonly maxDepth: number
├── push(frame: StackFrame): void
├── pop(): StackFrame
├── peek(): StackFrame
├── isEmpty(): boolean
├── size(): number
└── getMaxDepth(): number
```

### Design Decisions

#### 1. Generic Frame Type

Decision: Use a plain `StackFrame` class instead of a generic `CallStack<T>`.

Rationale: For the simulator, stack frames always represent function calls with metadata (name, args, locals). A generic parameter adds complexity without benefit. If future milestones need different frame types, we can refactor.

#### 2. Static Factory Method

Decision: `StackFrame` uses `static create()` instead of public constructor.

Rationale: The private constructor forces users through the factory, ensuring consistent object shape. This is a common pattern in TypeScript for controlling instance creation.

#### 3. Configurable Max Depth

Decision: `CallStack` accepts `maxDepth` option with default of 10000.

Rationale: JavaScript engines have call stack size limits (typically 10000-20000 frames). Making this configurable allows testing overflow behavior and aligns with real engine constraints.

#### 4. Error Classes

Decision: Custom `StackOverflowError` and `StackUnderflowError` extend `Error`.

Rationale: These specific error types enable callers to catch and handle overflow/underflow differently if needed. The error messages include context (max depth value for overflow).

#### 5. Private Frames Array

Decision: `frames` array is private with public accessor methods.

Rationale: Prevents external code from directly manipulating the internal array while providing controlled access through `push`, `pop`, `peek`, `size`, `isEmpty`.

### TypeScript Strict Mode Compliance

The implementation follows TypeScript strict mode requirements:

- **`noUncheckedIndexedAccess`**: The code uses `frames[len - 1]!` to assert non-null after bounds check
- **`noUnusedLocals`**: All local variables are used
- **`noUnusedParameters`**: All parameters are used
- **`strict`**: All strict checks enabled

### Testing Strategy

Tests follow the Arrange-Act-Assert pattern with descriptive test names:

```
StackFrame
├── should create a frame with function name
├── should create a frame with arguments
├── should create a frame with local variables
└── should create a frame with return address

CallStack
├── push
│   ├── should add a frame to the stack
│   ├── should add multiple frames in order
│   └── should throw StackOverflowError when max depth exceeded
├── pop
│   ├── should remove and return the top frame
│   ├── should follow LIFO order
│   └── should throw StackUnderflowError when stack is empty
├── peek
│   ├── should return top frame without removing it
│   └── should throw StackUnderflowError when stack is empty
├── isEmpty
│   ├── should return true for empty stack
│   ├── should return false for non-empty stack
│   └── should return true after popping last frame
├── size
│   ├── should return 0 for empty stack
│   ├── should return correct count
│   └── should reflect pop operations
└── error messages
    ├── StackUnderflowError should have clear message
    └── StackOverflowError should have clear message
```

**Total: 20 tests**

### File Structure

```
src/
├── call-stack.ts      # StackFrame, StackOverflowError, StackUnderflowError, CallStack
├── index.ts           # Exports CallStack and related types

tests/
├── call-stack.test.ts # 20 unit tests
```

### Export API

The following are exported from `src/index.ts`:

```typescript
export { CallStack, StackFrame, StackOverflowError, StackUnderflowError } from './call-stack.js';
```

## Implementation Notes

### Why `!` Assertion is Safe

After checking `frames.length === 0` in `pop()` and `peek()`, accessing `frames[len - 1]` is safe because:
1. `len` is derived from `frames.length` at the same moment
2. If `len > 0`, then `len - 1` is a valid index
3. TypeScript's `noUncheckedIndexedAccess` requires the `!` to assert non-null

### No Real Function Execution

The CallStack only tracks frame metadata — it doesn't execute any functions. This is intentional. The simulator will use this stack to represent what the call stack WOULD look like during execution, not to actually execute code.

### Future Integration

This module will be used by `src/event-loop.ts` in milestone 3. The event loop will push/pop frames as it processes tasks and microtasks.
