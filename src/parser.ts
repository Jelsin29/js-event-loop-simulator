/**
 * InputParser for REPL
 *
 * Converts user input strings into Script DSL operations.
 * Supports basic JavaScript patterns:
 *   - log("x") or console.log("x")
 *   - setTimeout(() => { ... }, delay)
 *   - Promise.resolve().then(() => { ... })
 *   - await expr
 */

import { OperationType, ScriptOperation } from './event-loop.js';

export class InputParser {
  /**
   * Parse a line of input into Script operations.
   * Returns empty array for empty lines, comments, or unrecognized input.
   */
  parse(line: string): ScriptOperation[] {
    const trimmed = line.trim();

    // Empty line or comment
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) {
      return [];
    }

    // Command handling is done by REPL, not parser
    if (trimmed.startsWith('.')) {
      return [];
    }

    // log("x") or console.log("x")
    if (this.isLogStatement(trimmed)) {
      return [this.parseLog(trimmed)];
    }

    // setTimeout(() => { ... }, delay)
    if (this.isSetTimeout(trimmed)) {
      return [this.parseSetTimeout(trimmed)];
    }

    // Promise.resolve().then(() => { ... })
    if (this.isPromiseChain(trimmed)) {
      return [this.parsePromiseChain(trimmed)];
    }

    // await expr
    if (trimmed.startsWith('await ')) {
      return [this.parseAwait(trimmed)];
    }

    // Default: treat as expression to log
    return [this.parseUnknownAsLog(trimmed)];
  }

  /**
   * Check if input is a command (starts with dot)
   */
  isCommand(line: string): boolean {
    return line.trim().startsWith('.');
  }

  /**
   * Extract command name (without the dot)
   */
  getCommand(line: string): string {
    return line.trim().slice(1).split(/\s+/)[0] ?? '';
  }

  // ─── Private: Detection Helpers ────────────────────────────────────────

  private isLogStatement(input: string): boolean {
    return /^(log|console\.log)\s*\(/i.test(input);
  }

  private isSetTimeout(input: string): boolean {
    return /^setTimeout\s*\(/i.test(input);
  }

  private isPromiseChain(input: string): boolean {
    return /^Promise\s*\.\s*resolve\s*\(\s*\)\s*\./.test(input) ||
           /\.then\s*\(/.test(input);
  }

  // ─── Private: Log Parsing ─────────────────────────────────────────────

  private parseLog(input: string): ScriptOperation {
    // Match: log("...") or console.log("...")
    const match = input.match(/^(?:console\.)?log\s*\(\s*["'](.*?)["']\s*\)/i);
    const value = match?.[1] ?? input;
    return {
      type: OperationType.Log,
      name: 'log',
      value,
    };
  }

  // ─── Private: SetTimeout Parsing ───────────────────────────────────────

  private parseSetTimeout(input: string): ScriptOperation {
    // Match: setTimeout(() => { ... }, delay)
    // We extract the delay and create a placeholder callback
    const delayMatch = input.match(/,\s*(\d+)\s*\)\s*$/);
    const delay = delayMatch ? parseInt(delayMatch[1]!, 10) : 0;

    // Try to extract inner log
    const innerLogMatch = input.match(/log\s*\(\s*["'](.*?)["']\s*\)/i);
    const innerValue = innerLogMatch?.[1] ?? 'timeout';

    return {
      type: OperationType.SetTimeout,
      name: 'timeout',
      delay,
      children: [
        {
          type: OperationType.Log,
          name: 'timeoutCallback',
          value: innerValue,
        },
      ],
    };
  }

  // ─── Private: Promise Parsing ──────────────────────────────────────────

  private parsePromiseChain(input: string): ScriptOperation {
    // Match: Promise.resolve().then(() => { ... })
    // Or: something.then(() => { ... })

    // Try to extract inner log from .then(...)
    const thenMatch = input.match(/\.then\s*\(\s*\(\s*\)\s*=>\s*\{?\s*log\s*\(\s*["'](.*?)["']\s*\)/i);
    const innerValue = thenMatch?.[1] ?? 'promise';

    // Determine name from context
    let name = 'promise';
    if (input.includes('Promise.resolve()')) {
      name = 'promiseFromResolve';
    }

    return {
      type: OperationType.Promise,
      name,
      children: [
        {
          type: OperationType.Log,
          name: 'promiseCallback',
          value: innerValue,
        },
      ],
    };
  }

  // ─── Private: Await Parsing ───────────────────────────────────────────

  private parseAwait(input: string): ScriptOperation {
    // Match: await someExpression
    // Extract what we're awaiting
    const exprMatch = input.match(/^await\s+(.+)/);
    const expr = exprMatch?.[1] ?? 'unknown';

    return {
      type: OperationType.Await,
      name: 'await',
      value: expr,
      children: [
        {
          type: OperationType.Log,
          name: 'awaited',
          value: `resolved: ${expr}`,
        },
      ],
    };
  }

  // ─── Private: Fallback ─────────────────────────────────────────────────

  private parseUnknownAsLog(input: string): ScriptOperation {
    // Try to extract a string value
    const strMatch = input.match(/["'](.*?)["']/);
    const value = strMatch?.[1] ?? input;
    return {
      type: OperationType.Log,
      name: 'expr',
      value,
    };
  }
}
