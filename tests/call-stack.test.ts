import { describe, it, expect, beforeEach } from 'vitest';
import { CallStack, StackFrame, StackOverflowError, StackUnderflowError } from '../src/call-stack';

describe('StackFrame', () => {
  it('should create a frame with function name', () => {
    const frame = StackFrame.create('foo');
    expect(frame.functionName).toBe('foo');
  });

  it('should create a frame with arguments', () => {
    const frame = StackFrame.create('bar', [1, 'hello', true]);
    expect(frame.arguments).toEqual([1, 'hello', true]);
  });

  it('should create a frame with local variables', () => {
    const frame = StackFrame.create('baz', [], { x: 10, y: 20 });
    expect(frame.localVariables).toEqual({ x: 10, y: 20 });
  });

  it('should create a frame with return address', () => {
    const frame = StackFrame.create('qux', [], {}, 'caller-module');
    expect(frame.returnAddress).toBe('caller-module');
  });
});

describe('CallStack', () => {
  let stack: CallStack;

  beforeEach(() => {
    stack = new CallStack();
  });

  describe('push', () => {
    it('should add a frame to the stack', () => {
      stack.push(StackFrame.create('main'));
      expect(stack.size()).toBe(1);
    });

    it('should add multiple frames in order', () => {
      stack.push(StackFrame.create('a'));
      stack.push(StackFrame.create('b'));
      stack.push(StackFrame.create('c'));
      expect(stack.size()).toBe(3);
    });

    it('should throw StackOverflowError when max depth exceeded', () => {
      const limitedStack = new CallStack({ maxDepth: 3 });
      limitedStack.push(StackFrame.create('a'));
      limitedStack.push(StackFrame.create('b'));
      limitedStack.push(StackFrame.create('c'));
      
      expect(() => limitedStack.push(StackFrame.create('d')))
        .toThrow(StackOverflowError);
    });
  });

  describe('pop', () => {
    it('should remove and return the top frame', () => {
      stack.push(StackFrame.create('first'));
      stack.push(StackFrame.create('second'));
      
      const popped = stack.pop();
      expect(popped?.functionName).toBe('second');
      expect(stack.size()).toBe(1);
    });

    it('should follow LIFO order', () => {
      stack.push(StackFrame.create('a'));
      stack.push(StackFrame.create('b'));
      stack.push(StackFrame.create('c'));
      
      expect(stack.pop()?.functionName).toBe('c');
      expect(stack.pop()?.functionName).toBe('b');
      expect(stack.pop()?.functionName).toBe('a');
    });

    it('should throw StackUnderflowError when stack is empty', () => {
      expect(() => stack.pop()).toThrow(StackUnderflowError);
    });
  });

  describe('peek', () => {
    it('should return top frame without removing it', () => {
      stack.push(StackFrame.create('top'));
      stack.push(StackFrame.create('aboveTop'));
      
      const peeked = stack.peek();
      expect(peeked?.functionName).toBe('aboveTop');
      expect(stack.size()).toBe(2);
    });

    it('should throw StackUnderflowError when stack is empty', () => {
      expect(() => stack.peek()).toThrow(StackUnderflowError);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty stack', () => {
      expect(stack.isEmpty()).toBe(true);
    });

    it('should return false for non-empty stack', () => {
      stack.push(StackFrame.create('test'));
      expect(stack.isEmpty()).toBe(false);
    });

    it('should return true after popping last frame', () => {
      stack.push(StackFrame.create('only'));
      stack.pop();
      expect(stack.isEmpty()).toBe(true);
    });
  });

  describe('size', () => {
    it('should return 0 for empty stack', () => {
      expect(stack.size()).toBe(0);
    });

    it('should return correct count', () => {
      stack.push(StackFrame.create('a'));
      stack.push(StackFrame.create('b'));
      stack.push(StackFrame.create('c'));
      expect(stack.size()).toBe(3);
    });

    it('should reflect pop operations', () => {
      stack.push(StackFrame.create('a'));
      stack.push(StackFrame.create('b'));
      stack.pop();
      expect(stack.size()).toBe(1);
    });
  });

  describe('error messages', () => {
    it('StackUnderflowError should have clear message', () => {
      const error = new StackUnderflowError();
      expect(error.message).toContain('pop');
    });

    it('StackOverflowError should have clear message', () => {
      const error = new StackOverflowError(5);
      expect(error.message).toContain('5');
    });
  });
});