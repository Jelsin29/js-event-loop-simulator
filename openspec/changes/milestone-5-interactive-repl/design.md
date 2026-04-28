# Design: Interactive REPL

## Overview

Add a `src/repl.ts` module that wraps readline, a simple parser, and the existing EventLoopEngine+Visualizer into an interactive command-line experience.

## Architecture

```
User Input (readline)
       │
       ▼
InputParser.parse(line) → Script DSL operations
       │
       ▼
EventLoopEngine.execute() → ExecutionStep[]
       │
       ▼
Visualizer(state) → ASCII output
       │
       ▼
Display to stdout
```

## File Structure

```
src/
├── repl.ts      # REPL class (main entry point)
└── parser.ts    # InputParser class (string → DSL)
```

## Components

### InputParser

**Responsibility**: Convert string input to Script DSL operations.

```typescript
class InputParser {
  parse(line: string): ScriptOperation[]
  isCommand(line: string): boolean
  getCommand(line: string): string
}
```

**Parsing rules**:
1. Trim whitespace
2. If starts with `.`, treat as command
3. If `log(` or `console.log(`, extract string and create `Script.log`
4. If `setTimeout(`, parse arrow function and delay, create `Script.setTimeout`
5. If `Promise.resolve().then(`, parse callback, create `Script.promise`
6. If `await `, parse expression, create `Script.await`
7. Default: treat as expression to log the result

**Edge cases**:
- Empty line → ignore, prompt again
- Whitespace only → ignore, prompt again
- Unmatched parentheses → treat as incomplete, prompt for more (stretch goal)

### REPL Class

**Responsibility**: Orchestrate readline, parser, engine, and visualizer.

```typescript
class REPL {
  private engine: EventLoopEngine
  private visualizer: Visualizer
  private parser: InputParser

  start(): Promise<void>      // Begin readline loop
  handleLine(line: string): void  // Process one line
  executeStep(): void        // Execute one pending operation
  showHelp(): void           // Print help text
  showState(): void          // Visualize current state
  reset(): void              // Clear engine state
}
```

**Readline integration**:
- Use `readline.createInterface()` with `input: process.stdin`, `output: process.stdout`
- Use async iterator pattern for line reading
- Display prompt `> ` before each input

**Command handling**:
| Command | Action |
|---------|--------|
| `.step` | Execute next pending operation |
| `.state` | Show visualizer state |
| `.reset` | Clear engine and visualizer |
| `.help` | Print help |
| `.exit` | Close readline, exit |

### Integration with Visualizer

The REPL maintains a `Visualizer` instance updated after each execution step. The `Visualizer.renderState()` output is printed after each command.

## Demo Script

Create `demos/repl-demo.ts` showing:
1. How to start the REPL
2. Example input sequences
3. Expected outputs

## Testing Strategy

### Unit Tests (parser.test.ts)
- Parse `log("x")` → correct Script.log call
- Parse `setTimeout(() => {}, 0)` → correct Script.setTimeout call
- Parse `Promise.resolve().then(() => {})` → correct Script.promise call
- `.help` → isCommand returns true
- `random text` → logs as expression

### Integration Tests (repl.test.ts)
- REPL.start() outputs prompt
- Invalid input shows error
- `.help` shows command list
- `.exit` terminates cleanly
- Full sequence: log → step → state shows correct output

## Implementation Order

1. `src/parser.ts` — InputParser class
2. `src/repl.ts` — REPL class (uses parser)
3. `demos/repl-demo.ts` — Demo script
4. `tests/parser.test.ts` — Parser tests
5. `tests/repl.test.ts` — REPL tests (basic, since readline is hard to test)
6. Update `src/index.ts` — Export new modules
7. Update `README.md` — Document REPL usage
