# REPL Specification

## Purpose

Interactive command-line REPL that accepts JavaScript-like statements, executes them via the EventLoopEngine, and displays results with ASCII visualization. Users step through execution one operation at a time.

## Requirements

### Requirement: REPL accepts user input

The REPL MUST display a prompt (`> `) and accept lines of input via Node.js readline. Input MUST be read asynchronously, line by line.

#### Scenario: Display prompt and read input

- GIVEN the REPL is started
- WHEN user types `console.log("hello")` and presses ENTER
- THEN the REPL SHOULD display the prompt, read the line, and process it

#### Scenario: Multiple input lines

- GIVEN the REPL is running
- WHEN user types multiple lines
- THEN each line MUST be processed in order

### Requirement: Parse basic JavaScript operations

The parser MUST convert string input into Script DSL operations:

| Input Pattern | DSL Operation |
|--------------|---------------|
| `log("x")` or `console.log("x")` | `Script.log("x")` |
| `setTimeout(() => { log("x") }, 0)` | `Script.setTimeout(fn, 0)` |
| `Promise.resolve().then(() => { log("x") })` | `Script.promise(fn)` |
| `await somePromise` | `Script.await(somePromise)` |

#### Scenario: Parse log statement

- GIVEN user inputs `log("hello")`
- WHEN the REPL parses the input
- THEN it SHOULD produce `Script.log("hello")`

#### Scenario: Parse setTimeout

- GIVEN user inputs `setTimeout(() => { log("x") }, 100)`
- WHEN the REPL parses the input
- THEN it SHOULD produce a `Script.setTimeout` operation with delay 100

#### Scenario: Parse Promise chain

- GIVEN user inputs `Promise.resolve().then(() => log("x"))`
- WHEN the REPL parses the input
- THEN it SHOULD produce `Script.promise` operation

### Requirement: Execute via EventLoopEngine

The REPL MUST pass parsed operations to EventLoopEngine for execution. Execution MUST produce an `ExecutionStep[]` array.

#### Scenario: Execute log operation

- GIVEN user inputs `log("test")`
- WHEN REPL executes via EventLoopEngine
- THEN it SHOULD produce steps containing a log step with value "test"

### Requirement: Display visualization after each step

After each REPL command, the Visualizer MUST render the current state: call stack, queues, and execution log.

#### Scenario: Show state after log

- GIVEN user inputs `log("hello")`
- WHEN REPL executes and visualizes
- THEN it SHOULD show the log output in execution log section

### Requirement: Step-by-step advancement

The REPL MUST support stepping through execution:

- `.step` — advance one operation
- `.state` — show current visualizer state without advancing
- `.reset` — clear all state and start fresh
- `.help` — show available commands
- `.exit` — terminate REPL cleanly

#### Scenario: Step through multiple operations

- GIVEN user runs `log("a")` then `log("b")`
- WHEN user types `.step`
- THEN execution SHOULD advance one operation per `.step`

#### Scenario: Show help

- GIVEN the REPL is running
- WHEN user types `.help`
- THEN REPL SHOULD display: step, state, reset, help, exit

#### Scenario: Exit REPL

- GIVEN the REPL is running
- WHEN user types `.exit`
- THEN REPL SHOULD print goodbye message and exit process cleanly

### Requirement: Queue state visualization

The visualizer MUST show current queue state:
- Microtask queue: pending microtasks
- Macrotask queue: pending macrotasks
- Timer registry: active timers with delays

#### Scenario: Show queues after scheduling

- GIVEN user schedules a setTimeout
- WHEN user types `.state`
- THEN visualizer SHOULD show the macrotask in queue and timer in registry

## Error Handling

### Requirement: Invalid input handling

- GIVEN user inputs invalid JavaScript syntax
- THEN REPL SHOULD print error message and continue running
- AND REPL SHOULD NOT crash

### Requirement: Unknown command handling

- GIVEN user inputs `.unknown`
- THEN REPL SHOULD print "Unknown command. Type .help for available commands."

## Acceptance Criteria

- [ ] REPL starts and shows `> ` prompt
- [ ] `log("x")` produces visible output
- [ ] `setTimeout(() => log("x"), 0)` schedules and shows in queue state
- [ ] `Promise.resolve().then(() => log("x"))` schedules and shows in microtask queue
- [ ] `.step` advances execution one operation
- [ ] `.state` shows visualizer output without advancing
- [ ] `.help` lists all commands
- [ ] `.exit` terminates cleanly
- [ ] Invalid input shows error and continues
- [ ] All existing tests pass
