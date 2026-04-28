# Visualizer Specification

## Purpose

Provide ASCII-based terminal visualization of the JavaScript event loop state. Render call stack, task queues, timers, and execution logs in a readable format for understanding step-by-step execution.

## Requirements

### Requirement: Visualizer Initialization

The Visualizer class MUST accept either an EventLoopEngine instance OR an array of ExecutionStep objects.

The Visualizer MUST maintain internal state that tracks the current step index for rendering at specific points in time.

#### Scenario: Initialize with ExecutionSteps

- GIVEN an array of ExecutionStep objects from engine.execute()
- WHEN Visualizer is constructed with the steps array
- THEN the Visualizer stores the steps and sets index to 0

#### Scenario: Initialize with EventLoopEngine

- GIVEN an EventLoopEngine instance that has executed a script
- WHEN Visualizer is constructed with the engine instance
- THEN the Visualizer extracts steps from engine.steps

### Requirement: renderCallStack()

The renderCallStack() method MUST render the current call stack frames using ASCII box-drawing characters.

The output MUST display frames from bottom (index 0) to top (last index) with clear numbering.

#### Scenario: Render empty call stack

- GIVEN an empty call stack
- WHEN renderCallStack() is called
- THEN output shows "Call Stack: (empty)"

#### Scenario: Render frames with function names

- GIVEN a call stack with frames for "main()" and "foo()"
- WHEN renderCallStack() is called
- THEN output shows:
  ```
  Call Stack:
    [0] main()
    [1] foo()
  ```

### Requirement: renderMicrotaskQueue()

The renderMicrotaskQueue() method MUST render pending microtasks in FIFO order.

The output MUST show placeholder names like "microtask-1", "microtask-2" since the actual callbacks are functions.

#### Scenario: Render empty microtask queue

- GIVEN an empty microtask queue
- WHEN renderMicrotaskQueue() is called
- THEN output shows "Microtask Queue: (empty)"

#### Scenario: Render pending microtasks

- GIVEN a microtask queue with 2 pending microtasks
- WHEN renderMicrotaskQueue() is called
- THEN output shows "Microtask Queue: [microtask-1, microtask-2]"

### Requirement: renderMacrotaskQueue()

The renderMacrotaskQueue() method MUST render pending macrotasks in FIFO order.

The output MUST show callback names when available.

#### Scenario: Render empty macrotask queue

- GIVEN an empty macrotask queue
- WHEN renderMacrotaskQueue() is called
- THEN output shows "Macrotask Queue: (empty)"

#### Scenario: Render pending macrotasks

- GIVEN a macrotask queue with callbacks named "setTimeout callback"
- WHEN renderMacrotaskQueue() is called
- THEN output shows "Macrotask Queue: [setTimeout callback]"

### Requirement: renderTimerRegistry()

The renderTimerRegistry() method MUST render active timers with their remaining time in milliseconds.

The output MUST show timer type (setTimeout/setInterval), delay, and remaining time.

#### Scenario: Render empty timer registry

- GIVEN no active timers
- WHEN renderTimerRegistry() is called
- THEN output shows "Timers: (none)"

#### Scenario: Render active timers

- GIVEN a timer registered with setTimeout(0)
- WHEN renderTimerRegistry() is called
- THEN output shows "Timers: setTimeout(0) - 0ms remaining"

### Requirement: renderState()

The renderState() method MUST combine all render methods into a single formatted output.

The output MUST show all four components with clear section headers.

#### Scenario: Render complete state

- GIVEN a call stack, microtask queue, macrotask queue, and timers
- WHEN renderState() is called
- THEN output shows all four sections with === headers

### Requirement: renderExecutionLog()

The renderExecutionLog() method MUST render all execution steps in chronological order.

Each step MUST show its index, type, name, and optional value.

#### Scenario: Render execution log

- GIVEN ExecutionStep array with types: log, functionCall, functionReturn
- WHEN renderExecutionLog() is called
- THEN output shows:
  ```
  === Execution Log ===
  [0] log: "script start"
  [1] call: foo()
  [2] return: returnFrom_foo
  ```

### Requirement: Demo Output

The demo script MUST demonstrate the classic Jake Archibald example with clear visual output.

The output MUST show the expected execution order: script start → async start → promise1 → promise2 → timeout → async end.

#### Scenario: Run Jake Archibald demo

- GIVEN the demo script running the classic example
- WHEN the demo executes and visualizes
- THEN the output shows:
  - script start
  - async start
  - promise1 (microtask)
  - promise2 (microtask after promise1)
  - setTimeout (macrotask)
  - async end