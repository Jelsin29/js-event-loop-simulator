/**
 * Interactive REPL for JS Event Loop Simulator
 *
 * Allows users to type JavaScript-like statements and watch them
 * execute step-by-step through the event loop with ASCII visualization.
 *
 * Usage:
 *   npx tsx src/repl.ts
 *
 * Commands:
 *   .help    - Show this help
 *   .step    - Execute next pending operation
 *   .state   - Show current visualizer state
 *   .reset   - Clear all state
 *   .exit    - Exit REPL
 *
 * Examples:
 *   > log("hello")
 *   > setTimeout(() => { log("fired") }, 100)
 *   > Promise.resolve().then(() => { log("done") })
 */

import * as readline from 'readline';
import { EventLoopEngine, Script, ScriptOperation } from './event-loop.js';
import { Visualizer } from './visualizer.js';
import { InputParser } from './parser.js';

export class REPL {
  private engine: EventLoopEngine;
  private visualizer: Visualizer | null = null;
  private parser: InputParser;
  private pendingOps: ScriptOperation[] = [];
  private rl: readline.Interface;
  private running: boolean = true;

  constructor() {
    this.engine = new EventLoopEngine();
    this.parser = new InputParser();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * Start the REPL loop
   */
  async start(): Promise<void> {
    this.printWelcome();
    this.prompt();

    for await (const line of this.rl) {
      await this.handleLine(line);
      if (!this.running) {
        break;
      }
      this.prompt();
    }

    this.cleanup();
  }

  /**
   * Process a single line of input
   */
  async handleLine(line: string): Promise<void> {
    const trimmed = line.trim();

    // Empty line - just prompt again
    if (!trimmed) {
      return;
    }

    // Command handling
    if (this.parser.isCommand(trimmed)) {
      await this.handleCommand(trimmed);
      return;
    }

    // Parse input into operations
    const ops = this.parser.parse(trimmed);

    if (ops.length === 0) {
      console.log('(no operations parsed from input)\n');
      return;
    }

    // Add to pending and execute
    this.pendingOps.push(...ops);
    this.executePending();
  }

  /**
   * Execute pending operations through the engine
   */
  private executePending(): void {
    if (this.pendingOps.length === 0) {
      return;
    }

    // Build a script from pending operations
    const script: Script = [...this.pendingOps];
    this.pendingOps = [];

    // Execute through engine
    const steps = this.engine.execute(script);

    // Create visualizer with all steps
    this.visualizer = new Visualizer(steps);

    // Show results
    console.log('\n' + this.visualizer.renderExecutionLog());
  }

  /**
   * Show current visualizer state
   */
  private showState(): void {
    if (this.visualizer) {
      console.log('\n' + this.visualizer.renderState());
    } else {
      console.log('\n(no execution yet - try typing log("hello"))');
    }
  }

  /**
   * Show help text
   */
  private showHelp(): void {
    console.log(`
Available commands:
  .help    - Show this help
  .state   - Show current execution state
  .reset   - Clear all state and start fresh
  .exit    - Exit REPL

Supported syntax:
  log("x")                        - Log a message
  console.log("x")                - Same as log
  setTimeout(() => { log("x") }, 100)  - Schedule a timeout (delay in ms)
  Promise.resolve().then(() => { log("x") })  - Schedule a promise
  await expr                      - Await an expression

Examples:
  > log("hello")
  > setTimeout(() => { log("fired") }, 50)
  > Promise.resolve().then(() => { log("done") })
`);
  }

  /**
   * Reset engine and visualizer state
   */
  private reset(): void {
    this.engine.reset();
    this.visualizer = null;
    this.pendingOps = [];
    console.log('(state cleared)\n');
  }

  /**
   * Exit the REPL
   */
  private exit(): void {
    console.log('\nGoodbye!\n');
    this.running = false;
    this.rl.close();
  }

  /**
   * Handle REPL commands
   */
  private async handleCommand(line: string): Promise<void> {
    const cmd = this.parser.getCommand(line);

    switch (cmd) {
      case 'help':
        this.showHelp();
        break;
      case 'state':
        this.showState();
        break;
      case 'reset':
        this.reset();
        break;
      case 'exit':
      case 'quit':
        this.exit();
        break;
      default:
        console.log(`Unknown command: ${cmd}`);
        console.log('Type .help for available commands.\n');
    }
  }

  /**
   * Print welcome message
   */
  private printWelcome(): void {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║           JS Event Loop Simulator - Interactive REPL         ║
╚══════════════════════════════════════════════════════════════╝
Type JavaScript-like statements and see them execute.

Type .help for commands, .exit to quit.
`);
  }

  /**
   * Print the prompt
   */
  private prompt(): void {
    process.stdout.write('> ');
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (!this.rl.closed) {
      this.rl.close();
    }
  }
}

/**
 * Main entry point when run directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const repl = new REPL();
  repl.start().catch((err) => {
    console.error('REPL error:', err);
    process.exit(1);
  });
}
