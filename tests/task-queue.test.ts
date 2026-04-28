import { describe, it, expect, beforeEach } from 'vitest';
import {
  MicrotaskQueue,
  MacrotaskQueue,
  TimerRegistry,
  QueueUnderflowError,
} from '../src/task-queue';
import type { MicrotaskCallback, MacrotaskCallback, Timer } from '../src/task-queue';

describe('MicrotaskQueue', () => {
  let queue: MicrotaskQueue;

  beforeEach(() => {
    queue = new MicrotaskQueue();
  });

  describe('FIFO ordering', () => {
    it('should dequeue callbacks in the order they were enqueued', () => {
      const results: string[] = [];
      const callbackA: MicrotaskCallback = () => { results.push('A'); };
      const callbackB: MicrotaskCallback = () => { results.push('B'); };
      const callbackC: MicrotaskCallback = () => { results.push('C'); };

      queue.enqueue(callbackA);
      queue.enqueue(callbackB);
      queue.enqueue(callbackC);

      const first = queue.dequeue();
      const second = queue.dequeue();
      const third = queue.dequeue();

      first();
      second();
      third();

      expect(results).toEqual(['A', 'B', 'C']);
    });

    it('should return the exact callback reference that was enqueued', () => {
      const callbackA: MicrotaskCallback = () => {};
      const callbackB: MicrotaskCallback = () => {};

      queue.enqueue(callbackA);
      queue.enqueue(callbackB);

      expect(queue.dequeue()).toBe(callbackA);
      expect(queue.dequeue()).toBe(callbackB);
    });
  });

  describe('peek', () => {
    it('should return the next callback without removing it', () => {
      const callback: MicrotaskCallback = () => {};
      queue.enqueue(callback);

      const peeked = queue.peek();
      expect(peeked).toBe(callback);
      expect(queue.size()).toBe(1);
    });

    it('should return the same callback on repeated peeks', () => {
      const callback: MicrotaskCallback = () => {};
      queue.enqueue(callback);

      expect(queue.peek()).toBe(callback);
      expect(queue.peek()).toBe(callback);
      expect(queue.size()).toBe(1);
    });
  });

  describe('drain', () => {
    it('should return all pending callbacks and empty the queue', () => {
      const results: string[] = [];
      const callbackA: MicrotaskCallback = () => { results.push('A'); };
      const callbackB: MicrotaskCallback = () => { results.push('B'); };
      const callbackC: MicrotaskCallback = () => { results.push('C'); };

      queue.enqueue(callbackA);
      queue.enqueue(callbackB);
      queue.enqueue(callbackC);

      const drained = queue.drain();

      expect(drained).toHaveLength(3);
      expect(drained[0]).toBe(callbackA);
      expect(drained[1]).toBe(callbackB);
      expect(drained[2]).toBe(callbackC);
      expect(queue.isEmpty()).toBe(true);
    });

    it('should return empty array when queue is empty', () => {
      const drained = queue.drain();
      expect(drained).toEqual([]);
    });

    it('should capture callbacks enqueued during iteration (drain takes snapshot)', () => {
      // drain() returns ALL currently pending callbacks at once.
      // Callbacks added AFTER drain() are not included — that's
      // the event loop's job to handle via while-loop draining.
      const callbackA: MicrotaskCallback = () => {};
      const callbackB: MicrotaskCallback = () => {};

      queue.enqueue(callbackA);
      queue.enqueue(callbackB);

      const drained = queue.drain();
      expect(drained).toHaveLength(2);
      // Queue is now empty, new enqueues go to a fresh queue
      expect(queue.isEmpty()).toBe(true);
    });
  });

  describe('isEmpty', () => {
    it('should return true for a new queue', () => {
      expect(queue.isEmpty()).toBe(true);
    });

    it('should return false after enqueue', () => {
      queue.enqueue(() => {});
      expect(queue.isEmpty()).toBe(false);
    });

    it('should return true after draining all callbacks', () => {
      queue.enqueue(() => {});
      queue.drain();
      expect(queue.isEmpty()).toBe(true);
    });
  });

  describe('size', () => {
    it('should return 0 for an empty queue', () => {
      expect(queue.size()).toBe(0);
    });

    it('should return the correct count after enqueues', () => {
      queue.enqueue(() => {});
      queue.enqueue(() => {});
      queue.enqueue(() => {});
      expect(queue.size()).toBe(3);
    });

    it('should decrease after dequeue', () => {
      queue.enqueue(() => {});
      queue.enqueue(() => {});
      queue.dequeue();
      expect(queue.size()).toBe(1);
    });

    it('should return 0 after drain', () => {
      queue.enqueue(() => {});
      queue.enqueue(() => {});
      queue.drain();
      expect(queue.size()).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should throw QueueUnderflowError when dequeuing from empty queue', () => {
      expect(() => queue.dequeue()).toThrow(QueueUnderflowError);
    });

    it('should throw QueueUnderflowError when peeking empty queue', () => {
      expect(() => queue.peek()).toThrow(QueueUnderflowError);
    });

    it('should include queue name in error message for dequeue', () => {
      expect(() => queue.dequeue()).toThrow('MicrotaskQueue');
    });

    it('should include queue name in error message for peek', () => {
      expect(() => queue.peek()).toThrow('MicrotaskQueue');
    });
  });
});

describe('MacrotaskQueue', () => {
  let queue: MacrotaskQueue;

  beforeEach(() => {
    queue = new MacrotaskQueue();
  });

  describe('FIFO ordering', () => {
    it('should dequeue callbacks in the order they were enqueued', () => {
      const results: string[] = [];
      const callbackX: MacrotaskCallback = () => { results.push('X'); };
      const callbackY: MacrotaskCallback = () => { results.push('Y'); };

      queue.enqueue(callbackX);
      queue.enqueue(callbackY);

      const first = queue.dequeue();
      const second = queue.dequeue();

      first();
      second();

      expect(results).toEqual(['X', 'Y']);
    });

    it('should return the exact callback reference that was enqueued', () => {
      const callbackX: MacrotaskCallback = () => {};
      const callbackY: MacrotaskCallback = () => {};

      queue.enqueue(callbackX);
      queue.enqueue(callbackY);

      expect(queue.dequeue()).toBe(callbackX);
      expect(queue.dequeue()).toBe(callbackY);
    });
  });

  describe('peek', () => {
    it('should return the next callback without removing it', () => {
      const callback: MacrotaskCallback = () => {};
      queue.enqueue(callback);

      expect(queue.peek()).toBe(callback);
      expect(queue.size()).toBe(1);
    });
  });

  describe('drain', () => {
    it('should return all pending callbacks and empty the queue', () => {
      const callbackX: MacrotaskCallback = () => {};
      const callbackY: MacrotaskCallback = () => {};

      queue.enqueue(callbackX);
      queue.enqueue(callbackY);

      const drained = queue.drain();

      expect(drained).toHaveLength(2);
      expect(drained[0]).toBe(callbackX);
      expect(drained[1]).toBe(callbackY);
      expect(queue.isEmpty()).toBe(true);
    });

    it('should return empty array when queue is empty', () => {
      expect(queue.drain()).toEqual([]);
    });
  });

  describe('isEmpty', () => {
    it('should return true for a new queue', () => {
      expect(queue.isEmpty()).toBe(true);
    });

    it('should return false after enqueue', () => {
      queue.enqueue(() => {});
      expect(queue.isEmpty()).toBe(false);
    });
  });

  describe('size', () => {
    it('should return 0 for an empty queue', () => {
      expect(queue.size()).toBe(0);
    });

    it('should track count correctly', () => {
      queue.enqueue(() => {});
      queue.enqueue(() => {});
      queue.enqueue(() => {});
      expect(queue.size()).toBe(3);
    });
  });

  describe('error handling', () => {
    it('should throw QueueUnderflowError when dequeuing from empty queue', () => {
      expect(() => queue.dequeue()).toThrow(QueueUnderflowError);
    });

    it('should throw QueueUnderflowError when peeking empty queue', () => {
      expect(() => queue.peek()).toThrow(QueueUnderflowError);
    });

    it('should include queue name in error message for dequeue', () => {
      expect(() => queue.dequeue()).toThrow('MacrotaskQueue');
    });

    it('should include queue name in error message for peek', () => {
      expect(() => queue.peek()).toThrow('MacrotaskQueue');
    });
  });
});

describe('TimerRegistry', () => {
  let registry: TimerRegistry;

  beforeEach(() => {
    registry = new TimerRegistry();
  });

  describe('register', () => {
    it('should return a numeric timer ID', () => {
      const callback: MicrotaskCallback = () => {};
      const id = registry.register(callback, 100, false);
      expect(typeof id).toBe('number');
    });

    it('should return unique IDs for multiple registrations', () => {
      const id1 = registry.register(() => {}, 100, false);
      const id2 = registry.register(() => {}, 200, false);
      expect(id1).not.toBe(id2);
    });

    it('should return incrementing IDs', () => {
      const id1 = registry.register(() => {}, 100, false);
      const id2 = registry.register(() => {}, 200, false);
      const id3 = registry.register(() => {}, 300, false);
      expect(id2).toBeGreaterThan(id1);
      expect(id3).toBeGreaterThan(id2);
    });
  });

  describe('advance and due', () => {
    it('should not return timers that have not reached their delay', () => {
      const callback = () => {};
      registry.register(callback, 100, false);

      registry.advance(50);
      const due = registry.due();

      expect(due).toEqual([]);
    });

    it('should return callbacks when their delay has elapsed', () => {
      const callbackA = () => {};
      const callbackB = () => {};
      registry.register(callbackA, 50, false);
      registry.register(callbackB, 100, false);

      registry.advance(75);
      const due = registry.due();

      expect(due).toHaveLength(1);
      expect(due[0]).toBe(callbackA);
    });

    it('should return multiple callbacks when delays have elapsed', () => {
      const callbackA = () => {};
      const callbackB = () => {};
      registry.register(callbackA, 50, false);
      registry.register(callbackB, 100, false);

      registry.advance(150);
      const due = registry.due();

      expect(due).toHaveLength(2);
      expect(due[0]).toBe(callbackA);
      expect(due[1]).toBe(callbackB);
    });

    it('should return empty array when no timers are due', () => {
      registry.register(() => {}, 100, false);

      registry.advance(50);
      expect(registry.due()).toEqual([]);
    });

    it('should handle cumulative advance calls', () => {
      const callback = () => {};
      registry.register(callback, 100, false);

      registry.advance(50);
      expect(registry.due()).toEqual([]);

      registry.advance(60);
      const due = registry.due();

      expect(due).toHaveLength(1);
      expect(due[0]).toBe(callback);
    });
  });

  describe('single-shot timers (setTimeout)', () => {
    it('should remove timer after it fires', () => {
      const callback = () => {};
      registry.register(callback, 50, false);

      registry.advance(100);
      const first = registry.due();
      expect(first).toHaveLength(1);

      // Advance more and check no more callbacks for this timer
      registry.advance(100);
      const second = registry.due();
      expect(second).toEqual([]);
    });
  });

  describe('interval timers (setInterval)', () => {
    it('should re-register interval timer after callback is retrieved', () => {
      const callback = () => {};
      registry.register(callback, 30, true);

      // Fire the first interval
      registry.advance(35);
      const first = registry.due();
      expect(first).toHaveLength(1);
      expect(first[0]).toBe(callback);

      // Fire the next interval
      registry.advance(30);
      const second = registry.due();
      expect(second).toHaveLength(1);
      expect(second[0]).toBe(callback);
    });

    it('should fire interval multiple times with enough advancement', () => {
      const callback = () => {};
      registry.register(callback, 20, true);

      registry.advance(20);
      expect(registry.due()).toHaveLength(1);

      registry.advance(20);
      expect(registry.due()).toHaveLength(1);

      registry.advance(20);
      expect(registry.due()).toHaveLength(1);
    });
  });

  describe('cancel', () => {
    it('should cancel a pending timer by ID', () => {
      const callback = () => {};
      const id = registry.register(callback, 100, false);

      const cancelled = registry.cancel(id);

      expect(cancelled).toBe(true);
      registry.advance(200);
      expect(registry.due()).toEqual([]);
    });

    it('should return false when cancelling a non-existent timer', () => {
      const cancelled = registry.cancel(9999);
      expect(cancelled).toBe(false);
    });

    it('should return false when cancelling an already-fired timer', () => {
      const callback = () => {};
      const id = registry.register(callback, 50, false);

      registry.advance(100);
      registry.due(); // fires the timer

      const cancelled = registry.cancel(id);
      expect(cancelled).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all pending timers', () => {
      registry.register(() => {}, 50, false);
      registry.register(() => {}, 100, false);
      registry.register(() => {}, 150, true);

      registry.clear();

      registry.advance(200);
      expect(registry.due()).toEqual([]);
    });

    it('should allow new registrations after clear', () => {
      registry.register(() => {}, 50, false);
      registry.clear();

      const callback = () => {};
      registry.register(callback, 50, false);

      registry.advance(100);
      expect(registry.due()).toHaveLength(1);
    });
  });

  describe('edge cases', () => {
    it('should handle zero delay timers', () => {
      const callback = () => {};
      registry.register(callback, 0, false);

      registry.advance(0);
      const due = registry.due();

      expect(due).toHaveLength(1);
    });

    it('should handle advancing by 0', () => {
      const callback = () => {};
      registry.register(callback, 10, false);

      registry.advance(0);
      expect(registry.due()).toEqual([]);
    });
  });
});