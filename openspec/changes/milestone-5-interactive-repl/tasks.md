# Tasks: Milestone 5 - Interactive REPL

## Phase 1: Parser (src/parser.ts)

- [ ] 1.1 Create `InputParser` class
- [ ] 1.2 Implement `parse(line: string)` method
- [ ] 1.3 Handle `log("x")` and `console.log("x")` patterns
- [ ] 1.4 Handle `setTimeout(() => {}, delay)` pattern
- [ ] 1.5 Handle `Promise.resolve().then(() => {})` pattern
- [ ] 1.6 Handle `await expr` pattern
- [ ] 1.7 Implement `isCommand(line)` helper
- [ ] 1.8 Implement `getCommand(line)` helper
- [ ] 1.9 Handle empty/invalid input gracefully

## Phase 2: REPL (src/repl.ts)

- [ ] 2.1 Create `REPL` class with engine, visualizer, parser
- [ ] 2.2 Implement `start()` method with readline
- [ ] 2.3 Implement `handleLine(line)` dispatch logic
- [ ] 2.4 Implement `executeStep()` to advance execution
- [ ] 2.5 Implement `showHelp()` with command list
- [ ] 2.6 Implement `showState()` to render visualizer
- [ ] 2.7 Implement `reset()` to clear state
- [ ] 2.8 Implement `exit()` to terminate cleanly
- [ ] 2.9 Wire parser errors to display message

## Phase 3: Demo

- [ ] 3.1 Create `demos/repl-demo.ts`
- [ ] 3.2 Show example input sequences
- [ ] 3.3 Document expected outputs

## Phase 4: Testing

- [ ] 4.1 Write `tests/parser.test.ts` — 10 tests minimum
- [ ] 4.2 Write `tests/repl.test.ts` — basic readline tests
- [ ] 4.3 Run all tests, fix failures

## Phase 5: Integration & Polish

- [ ] 5.1 Export REPL and InputParser from `src/index.ts`
- [ ] 5.2 Update README.md with REPL usage section
- [ ] 5.3 Add Makefile target for REPL
- [ ] 5.4 Final test run — all 124+ tests pass
