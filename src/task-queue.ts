/**
 * Task Queue implementations for JS Event Loop Simulator
 *
 * MicrotaskQueue: FIFO, drains completely before next macrotask.
 * MacrotaskQueue: FIFO, lower priority than microtasks.
 * TimerRegistry: Virtual timer tracking for setTimeout/setInterval.
 */

// --- Callback Types ---

/** Callback type for microtask queue entries */
export type MicrotaskCallback = () => void;

/** Callback type for macrotask queue entries */
export type MacrotaskCallback = () => void;

// --- Error Classes ---

export class QueueUnderflowError extends Error {
  constructor(queueName: string) {
    super(`Queue underflow: cannot dequeue from empty ${queueName}`);
    this.name = 'QueueUnderflowError';
  }
}

// --- Timer Types ---

export interface Timer {
  readonly id: number;
  readonly callback: () => void;
  readonly delay: number;
  readonly isInterval: boolean;
  remaining: number;
}

// --- MicrotaskQueue ---

export class MicrotaskQueue {
  private queue: MicrotaskCallback[] = [];

  /**
   * Add a callback to the back of the microtask queue.
   */
  enqueue(callback: MicrotaskCallback): void {
    this.queue.push(callback);
  }

  /**
   * Remove and return the first callback from the queue.
   * @throws QueueUnderflowError if the queue is empty
   */
  dequeue(): MicrotaskCallback {
    if (this.queue.length === 0) {
      throw new QueueUnderflowError('MicrotaskQueue');
    }
    const callback = this.queue[0]!;
    this.queue.shift();
    return callback;
  }

  /**
   * Return the first callback without removing it.
   * @throws QueueUnderflowError if the queue is empty
   */
  peek(): MicrotaskCallback {
    if (this.queue.length === 0) {
      throw new QueueUnderflowError('MicrotaskQueue');
    }
    return this.queue[0]!;
  }

  /**
   * Check if the queue is empty.
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Get the number of callbacks in the queue.
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Drain all pending callbacks from the queue.
   * Returns them in FIFO order and empties the queue.
   * The caller (event loop) is responsible for executing them
   * and handling any new callbacks enqueued during execution.
   */
  drain(): MicrotaskCallback[] {
    const pending = this.queue;
    this.queue = [];
    return pending;
  }
}

// --- MacrotaskQueue ---

export class MacrotaskQueue {
  private queue: MacrotaskCallback[] = [];

  /**
   * Add a callback to the back of the macrotask queue.
   */
  enqueue(callback: MacrotaskCallback): void {
    this.queue.push(callback);
  }

  /**
   * Remove and return the first callback from the queue.
   * @throws QueueUnderflowError if the queue is empty
   */
  dequeue(): MacrotaskCallback {
    if (this.queue.length === 0) {
      throw new QueueUnderflowError('MacrotaskQueue');
    }
    const callback = this.queue[0]!;
    this.queue.shift();
    return callback;
  }

  /**
   * Return the first callback without removing it.
   * @throws QueueUnderflowError if the queue is empty
   */
  peek(): MacrotaskCallback {
    if (this.queue.length === 0) {
      throw new QueueUnderflowError('MacrotaskQueue');
    }
    return this.queue[0]!;
  }

  /**
   * Check if the queue is empty.
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Get the number of callbacks in the queue.
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Drain all pending callbacks from the queue.
   * Returns them in FIFO order and empties the queue.
   */
  drain(): MacrotaskCallback[] {
    const pending = this.queue;
    this.queue = [];
    return pending;
  }
}

// --- TimerRegistry ---

export class TimerRegistry {
  private timers: Timer[] = [];
  private nextId = 1;
  private currentTime = 0;

  /**
   * Register a new timer (setTimeout or setInterval).
   * @param callback - Function to call when timer fires
   * @param delay - Delay in milliseconds (virtual time)
   * @param isInterval - true for setInterval, false for setTimeout
   * @returns Numeric timer ID (like browser setTimeout returns)
   */
  register(callback: () => void, delay: number, isInterval: boolean): number {
    const id = this.nextId;
    this.nextId += 1;

    const timer: Timer = {
      id,
      callback,
      delay,
      isInterval,
      remaining: delay,
    };

    this.timers.push(timer);
    return id;
  }

  /**
   * Cancel a pending timer by its ID.
   * @returns true if timer was found and cancelled, false otherwise
   */
  cancel(timerId: number): boolean {
    const index = this.timers.findIndex((t) => t.id === timerId);
    if (index === -1) {
      return false;
    }
    this.timers.splice(index, 1);
    return true;
  }

  /**
   * Advance virtual time by the given number of milliseconds.
   * Decrements remaining time on all pending timers.
   */
  advance(time: number): void {
    this.currentTime += time;
    for (const timer of this.timers) {
      timer.remaining -= time;
    }
  }

  /**
   * Return all callbacks whose timers have reached zero or below.
   * Removes one-shot timers from the registry.
   * Re-registers interval timers with their original delay.
   */
  due(): (() => void)[] {
    const ready: (() => void)[] = [];
    const stillPending: Timer[] = [];

    for (const timer of this.timers) {
      if (timer.remaining <= 0) {
        ready.push(timer.callback);
        if (timer.isInterval) {
          // Re-register with original delay for next interval
          stillPending.push({
            ...timer,
            remaining: timer.delay,
          });
        }
        // One-shot timers are removed (not pushed to stillPending)
      } else {
        stillPending.push(timer);
      }
    }

    this.timers = stillPending;
    return ready;
  }

  /**
   * Remove all pending timers from the registry.
   */
  clear(): void {
    this.timers = [];
  }
}