# Call Stack Specification

## Purpose

This spec defines the Call Stack data structure that forms the foundation of the JS Event Loop Simulator. The call stack is a Last-In-First-Out (LIFO) structure that tracks function execution frames during JavaScript code execution. This milestone delivers a working `CallStack` implementation with frame representation, core operations, and overflow detection.

## Requirements

### Requirement: StackFrame Data Structure

The StackFrame MUST capture all necessary information about a function call.

#### Scenario: Create a frame with function name

- GIVEN no existing frame
- WHEN `StackFrame.create('foo')` is called
- THEN returns a frame with functionName = 'foo'
- AND arguments = []
- AND localVariables = {}

#### Scenario: Create a frame with arguments

- GIVEN no existing frame
- WHEN `StackFrame.create('bar', [1, 'hello', true])` is called
- THEN returns a frame where arguments = [1, 'hello', true]

#### Scenario: Create a frame with local variables

- GIVEN no existing frame
- WHEN `StackFrame.create('baz', [], { x: 10, y: 20 })` is called
- THEN returns a frame where localVariables = { x: 10, y: 20 }

#### Scenario: Create a frame with return address

- GIVEN no existing frame
- WHEN `StackFrame.create('qux', [], {}, 'caller-module')` is called
- THEN returns a frame where returnAddress = 'caller-module'

### Requirement: CallStack Push Operation

The CallStack push() MUST add frames to the top of the stack.

#### Scenario: Push single frame

- GIVEN an empty CallStack
- WHEN push(frameA) is called
- THEN stack size becomes 1
- AND peek() returns frameA

#### Scenario: Push multiple frames

- GIVEN an empty CallStack
- WHEN push(frameA), push(frameB), push(frameC) are called in sequence
- THEN stack size is 3
- AND peek() returns frameC (top of stack)

#### Scenario: Stack overflow detection

- GIVEN a CallStack with maxDepth = 3
- WHEN push(frameA), push(frameB), push(frameC) succeed
- AND push(frameD) is called
- THEN throws StackOverflowError
- AND error message contains the max depth value

### Requirement: CallStack Pop Operation

The CallStack pop() MUST remove and return the top frame following LIFO order.

#### Scenario: Pop returns top frame

- GIVEN a CallStack with frameA at bottom, frameB at top
- WHEN pop() is called
- THEN returns frameB
- AND stack size decreases by 1

#### Scenario: LIFO ordering

- GIVEN an empty CallStack
- WHEN push(frameA), push(frameB), push(frameC) are called
- WHEN pop() is called three times
- THEN first pop returns frameC, second returns frameB, third returns frameA

#### Scenario: Stack underflow on empty

- GIVEN an empty CallStack
- WHEN pop() is called
- THEN throws StackUnderflowError
- AND error message indicates empty stack

### Requirement: CallStack Peek Operation

The CallStack peek() MUST return the top frame without removing it.

#### Scenario: Peek without removal

- GIVEN a CallStack with frameA and frameB (B at top)
- WHEN peek() is called
- THEN returns frameB
- AND stack size remains unchanged

#### Scenario: Peek on empty stack

- GIVEN an empty CallStack
- WHEN peek() is called
- THEN throws StackUnderflowError

### Requirement: CallStack Query Operations

The CallStack MUST provide methods to query its state.

#### Scenario: isEmpty on empty stack

- GIVEN an empty CallStack
- WHEN isEmpty() is called
- THEN returns true

#### Scenario: isEmpty on non-empty stack

- GIVEN a CallStack with one frame
- WHEN isEmpty() is called
- THEN returns false

#### Scenario: size returns correct count

- GIVEN an empty CallStack
- WHEN size() is called
- THEN returns 0
- WHEN push(frameA), push(frameB) are called
- THEN size() returns 2

### Requirement: Error Types

The CallStack MUST throw descriptive error types for error conditions.

#### Scenario: StackOverflowError has clear message

- GIVEN maxDepth = 5
- WHEN StackOverflowError(5) is created
- THEN error message contains "5"
- AND error name is "StackOverflowError"

#### Scenario: StackUnderflowError has clear message

- GIVEN StackUnderflowError is created
- THEN error message contains "pop"
- AND error name is "StackUnderflowError"
