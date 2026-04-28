/**
 * Tests for InputParser
 *
 * Tests parsing of user input strings into Script DSL operations.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InputParser } from '../src/parser.js';
import { OperationType } from '../src/event-loop.js';

describe('InputParser', () => {
  let parser: InputParser;

  beforeEach(() => {
    parser = new InputParser();
  });

  // ─── Command Detection ────────────────────────────────────────────────

  describe('isCommand', () => {
    it('returns true for lines starting with dot', () => {
      expect(parser.isCommand('.help')).toBe(true);
      expect(parser.isCommand('.step')).toBe(true);
      expect(parser.isCommand('  .exit')).toBe(true);
    });

    it('returns false for regular input', () => {
      expect(parser.isCommand('log("hello")')).toBe(false);
      expect(parser.isCommand('setTimeout(() => {}, 0)')).toBe(false);
    });
  });

  describe('getCommand', () => {
    it('extracts command name without dot', () => {
      expect(parser.getCommand('.help')).toBe('help');
      expect(parser.getCommand('.step')).toBe('step');
      expect(parser.getCommand('.exit')).toBe('exit');
    });

    it('handles commands with arguments', () => {
      expect(parser.getCommand('.unknown arg')).toBe('unknown');
    });
  });

  // ─── Empty/Comment Handling ───────────────────────────────────────────

  describe('parse', () => {
    it('returns empty array for empty lines', () => {
      expect(parser.parse('')).toEqual([]);
      expect(parser.parse('   ')).toEqual([]);
      expect(parser.parse('\t\n')).toEqual([]);
    });

    it('returns empty array for comments', () => {
      expect(parser.parse('// this is a comment')).toEqual([]);
      expect(parser.parse('# also a comment')).toEqual([]);
    });

    it('returns empty array for command lines (handled by REPL)', () => {
      expect(parser.parse('.help')).toEqual([]);
      expect(parser.parse('.step')).toEqual([]);
    });
  });

  // ─── Log Parsing ─────────────────────────────────────────────────────

  describe('parse log statements', () => {
    it('parses log("x") correctly', () => {
      const result = parser.parse('log("hello")');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: OperationType.Log,
        name: 'log',
        value: 'hello',
      });
    });

    it('parses console.log("x") correctly', () => {
      const result = parser.parse('console.log("world")');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: OperationType.Log,
        name: 'log',
        value: 'world',
      });
    });

    it('parses log with single quotes', () => {
      const result = parser.parse("log('single')");
      expect(result[0]?.value).toBe('single');
    });

    it('falls back to whole input for non-string log arguments', () => {
      // Parser only handles string literals, so log(variable) returns the whole thing
      const result = parser.parse('log(variable)');
      expect(result[0]?.value).toBe('log(variable)');
    });
  });

  // ─── SetTimeout Parsing ──────────────────────────────────────────────

  describe('parse setTimeout', () => {
    it('parses setTimeout with delay', () => {
      const result = parser.parse('setTimeout(() => { log("x") }, 100)');
      expect(result).toHaveLength(1);
      expect(result[0]?.type).toBe(OperationType.SetTimeout);
      expect(result[0]?.name).toBe('timeout');
      expect(result[0]?.delay).toBe(100);
      expect(result[0]?.children).toBeDefined();
      expect(result[0]?.children![0]?.value).toBe('x');
    });

    it('defaults delay to 0', () => {
      const result = parser.parse('setTimeout(() => { log("x") })');
      expect(result[0]?.delay).toBe(0);
    });

    it('extracts inner log value', () => {
      const result = parser.parse('setTimeout(() => { log("timeout fired") }, 50)');
      expect(result[0]?.children![0]?.value).toBe('timeout fired');
    });
  });

  // ─── Promise Parsing ─────────────────────────────────────────────────

  describe('parse Promise chains', () => {
    it('parses Promise.resolve().then()', () => {
      const result = parser.parse('Promise.resolve().then(() => { log("done") })');
      expect(result).toHaveLength(1);
      expect(result[0]?.type).toBe(OperationType.Promise);
      expect(result[0]?.children).toBeDefined();
      expect(result[0]?.children![0]?.value).toBe('done');
    });

    it('parses .then() with callback', () => {
      const result = parser.parse('something.then(() => { log("chained") })');
      expect(result[0]?.type).toBe(OperationType.Promise);
      expect(result[0]?.children![0]?.value).toBe('chained');
    });
  });

  // ─── Await Parsing ───────────────────────────────────────────────────

  describe('parse await', () => {
    it('parses await expression', () => {
      const result = parser.parse('await somePromise');
      expect(result).toHaveLength(1);
      expect(result[0]?.type).toBe(OperationType.Await);
      expect(result[0]?.value).toBe('somePromise');
    });

    it('parses await with expression', () => {
      const result = parser.parse('await Promise.resolve()');
      expect(result[0]?.value).toBe('Promise.resolve()');
    });
  });

  // ─── Fallback Parsing ────────────────────────────────────────────────

  describe('fallback for unknown input', () => {
    it('treats unrecognized input as expression to log', () => {
      const result = parser.parse('someRandomText');
      expect(result).toHaveLength(1);
      expect(result[0]?.type).toBe(OperationType.Log);
    });

    it('extracts string value from unrecognized input', () => {
      const result = parser.parse('log("fallback")');
      expect(result[0]?.value).toBe('fallback');
    });
  });
});
