/**
 * Call Stack implementation for JS Event Loop Simulator
 * 
 * Represents the LIFO stack that tracks function execution frames
 * during JavaScript code execution.
 */

export interface StackFrameData {
  functionName: string;
  arguments: unknown[];
  localVariables: Record<string, unknown>;
  returnAddress?: string;
}

export class StackFrame {
  readonly functionName: string;
  readonly arguments: unknown[];
  readonly localVariables: Record<string, unknown>;
  readonly returnAddress?: string;

  private constructor(data: StackFrameData) {
    this.functionName = data.functionName;
    this.arguments = data.arguments;
    this.localVariables = data.localVariables;
    this.returnAddress = data.returnAddress;
  }

  static create(
    functionName: string,
    args: unknown[] = [],
    localVars: Record<string, unknown> = {},
    returnAddr?: string
  ): StackFrame {
    return new StackFrame({
      functionName,
      arguments: args,
      localVariables: localVars,
      returnAddress: returnAddr,
    });
  }
}

export class StackOverflowError extends Error {
  constructor(maxDepth: number) {
    super(`Stack overflow: maximum depth ${maxDepth} exceeded`);
    this.name = 'StackOverflowError';
  }
}

export class StackUnderflowError extends Error {
  constructor() {
    super('Stack underflow: cannot pop from empty stack');
    this.name = 'StackUnderflowError';
  }
}

interface CallStackOptions {
  maxDepth?: number;
}

export class CallStack {
  private frames: StackFrame[] = [];
  private readonly maxDepth: number;

  constructor(options: CallStackOptions = {}) {
    this.maxDepth = options.maxDepth ?? 10000;
  }

  /**
   * Push a frame onto the stack
   * @throws StackOverflowError if max depth exceeded
   */
  push(frame: StackFrame): void {
    if (this.frames.length >= this.maxDepth) {
      throw new StackOverflowError(this.maxDepth);
    }
    this.frames.push(frame);
  }

  /**
   * Remove and return the top frame
   * @throws StackUnderflowError if stack is empty
   */
  pop(): StackFrame {
    if (this.frames.length === 0) {
      throw new StackUnderflowError();
    }
    const len = this.frames.length;
    const frame = this.frames[len - 1]!;
    this.frames.pop();
    return frame;
  }

  /**
   * Return the top frame without removing it
   * @throws StackUnderflowError if stack is empty
   */
  peek(): StackFrame {
    const len = this.frames.length;
    if (len === 0) {
      throw new StackUnderflowError();
    }
    return this.frames[len - 1]!;
  }

  /**
   * Check if stack is empty
   */
  isEmpty(): boolean {
    return this.frames.length === 0;
  }

  /**
   * Get current stack size
   */
  size(): number {
    return this.frames.length;
  }

  /**
   * Get current max depth setting
   */
  getMaxDepth(): number {
    return this.maxDepth;
  }
}