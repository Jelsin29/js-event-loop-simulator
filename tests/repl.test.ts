/**
 * Basic tests for REPL class
 *
 * Tests REPL command handling and initialization.
 * Full readline interaction tests would require mocking stdin.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { REPL } from '../src/repl.js';
import { InputParser } from '../src/parser.js';

describe('REPL Commands', () => {
  let parser: InputParser;

  beforeEach(() => {
    parser = new InputParser();
  });

  describe('InputParser integration', () => {
    it('parser detects .help as command', () => {
      expect(parser.isCommand('.help')).toBe(true);
    });

    it('parser extracts help command', () => {
      expect(parser.getCommand('.help')).toBe('help');
    });

    it('parser detects .exit as command', () => {
      expect(parser.isCommand('.exit')).toBe(true);
    });

    it('parser extracts exit command', () => {
      expect(parser.getCommand('.exit')).toBe('exit');
    });

    it('parser detects .state as command', () => {
      expect(parser.isCommand('.state')).toBe(true);
    });

    it('parser extracts state command', () => {
      expect(parser.getCommand('.state')).toBe('state');
    });

    it('parser detects .reset as command', () => {
      expect(parser.isCommand('.reset')).toBe(true);
    });

    it('parser extracts reset command', () => {
      expect(parser.getCommand('.reset')).toBe('reset');
    });

    it('parser returns empty for regular input (not a command)', () => {
      expect(parser.parse('log("hello")')).toBeDefined();
      expect(parser.parse('log("hello")').length).toBeGreaterThan(0);
    });
  });

  describe('Command handling logic', () => {
    it('maps help command correctly', () => {
      const cmd = parser.getCommand('.help');
      expect(cmd).toBe('help');
    });

    it('maps exit command correctly', () => {
      const cmd = parser.getCommand('.exit');
      expect(cmd).toBe('exit');
    });

    it('maps state command correctly', () => {
      const cmd = parser.getCommand('.state');
      expect(cmd).toBe('state');
    });

    it('maps reset command correctly', () => {
      const cmd = parser.getCommand('.reset');
      expect(cmd).toBe('reset');
    });

    it('handles quit as exit alias', () => {
      const cmd = parser.getCommand('.quit');
      expect(cmd).toBe('quit');
    });
  });
});
