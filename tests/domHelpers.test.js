import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  safeGetElementById,
  safeQuerySelector,
  safeSetTextContent,
  safeSetInnerHTML,
  safeAddEventListener
} from '../js/modules/domHelpers.js';

describe('domHelpers', () => {
  beforeEach(() => {
    // Clear the document body before each test
    document.body.innerHTML = '';
    // Clear console.warn spy
    vi.restoreAllMocks();
  });

  describe('safeGetElementById', () => {
    it('should return element when it exists', () => {
      document.body.innerHTML = '<div id="test-element">Hello</div>';
      const element = safeGetElementById('test-element');
      expect(element).not.toBeNull();
      expect(element.id).toBe('test-element');
      expect(element.textContent).toBe('Hello');
    });

    it('should return null when element does not exist', () => {
      const element = safeGetElementById('missing-element');
      expect(element).toBeNull();
    });

    it('should log warning when element not found and warnIfMissing is true', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      safeGetElementById('missing-element', true);
      expect(warnSpy).toHaveBeenCalledWith('[DOM] Element not found: #missing-element');
    });

    it('should log warning by default when element not found', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      safeGetElementById('missing-element');
      expect(warnSpy).toHaveBeenCalledWith('[DOM] Element not found: #missing-element');
    });

    it('should not log warning when element not found and warnIfMissing is false', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      safeGetElementById('missing-element', false);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should not log warning when element exists', () => {
      document.body.innerHTML = '<div id="test-element">Hello</div>';
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      safeGetElementById('test-element');
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('safeQuerySelector', () => {
    it('should return element when it exists', () => {
      document.body.innerHTML = '<div class="test-class">Hello</div>';
      const element = safeQuerySelector('.test-class');
      expect(element).not.toBeNull();
      expect(element.className).toBe('test-class');
      expect(element.textContent).toBe('Hello');
    });

    it('should return null when element does not exist', () => {
      const element = safeQuerySelector('.missing-class');
      expect(element).toBeNull();
    });

    it('should log warning when element not found and warnIfMissing is true', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      safeQuerySelector('.missing-class', true);
      expect(warnSpy).toHaveBeenCalledWith('[DOM] Element not found: .missing-class');
    });

    it('should log warning by default when element not found', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      safeQuerySelector('.missing-class');
      expect(warnSpy).toHaveBeenCalledWith('[DOM] Element not found: .missing-class');
    });

    it('should not log warning when element not found and warnIfMissing is false', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      safeQuerySelector('.missing-class', false);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should not log warning when element exists', () => {
      document.body.innerHTML = '<div class="test-class">Hello</div>';
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      safeQuerySelector('.test-class');
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('safeSetTextContent', () => {
    it('should set text content when element exists and return true', () => {
      document.body.innerHTML = '<div id="test-element">Old text</div>';
      const result = safeSetTextContent('test-element', 'New text');
      expect(result).toBe(true);
      expect(document.getElementById('test-element').textContent).toBe('New text');
    });

    it('should return false when element does not exist', () => {
      const result = safeSetTextContent('missing-element', 'Some text');
      expect(result).toBe(false);
    });

    it('should log warning when element not found', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      safeSetTextContent('missing-element', 'Some text');
      expect(warnSpy).toHaveBeenCalledWith('[DOM] Element not found: #missing-element');
    });

    it('should handle empty string as text content', () => {
      document.body.innerHTML = '<div id="test-element">Old text</div>';
      const result = safeSetTextContent('test-element', '');
      expect(result).toBe(true);
      expect(document.getElementById('test-element').textContent).toBe('');
    });

    it('should escape HTML when setting text content', () => {
      document.body.innerHTML = '<div id="test-element"></div>';
      safeSetTextContent('test-element', '<script>alert("xss")</script>');
      const element = document.getElementById('test-element');
      expect(element.textContent).toBe('<script>alert("xss")</script>');
      expect(element.innerHTML).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
    });
  });

  describe('safeSetInnerHTML', () => {
    it('should set inner HTML when element exists and return true', () => {
      document.body.innerHTML = '<div id="test-element">Old content</div>';
      const result = safeSetInnerHTML('test-element', '<span>New HTML</span>');
      expect(result).toBe(true);
      expect(document.getElementById('test-element').innerHTML).toBe('<span>New HTML</span>');
    });

    it('should return false when element does not exist', () => {
      const result = safeSetInnerHTML('missing-element', '<span>Some HTML</span>');
      expect(result).toBe(false);
    });

    it('should log warning when element not found', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      safeSetInnerHTML('missing-element', '<span>Some HTML</span>');
      expect(warnSpy).toHaveBeenCalledWith('[DOM] Element not found: #missing-element');
    });

    it('should handle empty string as HTML content', () => {
      document.body.innerHTML = '<div id="test-element"><p>Old</p></div>';
      const result = safeSetInnerHTML('test-element', '');
      expect(result).toBe(true);
      expect(document.getElementById('test-element').innerHTML).toBe('');
    });

    it('should parse HTML correctly', () => {
      document.body.innerHTML = '<div id="test-element"></div>';
      safeSetInnerHTML('test-element', '<p class="test">Paragraph</p>');
      const element = document.getElementById('test-element');
      const paragraph = element.querySelector('p');
      expect(paragraph).not.toBeNull();
      expect(paragraph.className).toBe('test');
      expect(paragraph.textContent).toBe('Paragraph');
    });
  });

  describe('safeAddEventListener', () => {
    it('should add event listener when element exists and return true', () => {
      document.body.innerHTML = '<button id="test-button">Click me</button>';
      const handler = vi.fn();
      const result = safeAddEventListener('test-button', 'click', handler);
      expect(result).toBe(true);

      // Trigger the event
      document.getElementById('test-button').click();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should return false when element does not exist', () => {
      const handler = vi.fn();
      const result = safeAddEventListener('missing-button', 'click', handler);
      expect(result).toBe(false);
    });

    it('should log warning when element not found', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const handler = vi.fn();
      safeAddEventListener('missing-button', 'click', handler);
      expect(warnSpy).toHaveBeenCalledWith('[DOM] Element not found: #missing-button');
    });

    it('should handle multiple event listeners on same element', () => {
      document.body.innerHTML = '<button id="test-button">Click me</button>';
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      safeAddEventListener('test-button', 'click', handler1);
      safeAddEventListener('test-button', 'click', handler2);

      document.getElementById('test-button').click();
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should handle different event types', () => {
      document.body.innerHTML = '<input id="test-input" type="text" />';
      const changeHandler = vi.fn();
      const inputHandler = vi.fn();

      safeAddEventListener('test-input', 'change', changeHandler);
      safeAddEventListener('test-input', 'input', inputHandler);

      const input = document.getElementById('test-input');
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('change'));

      expect(inputHandler).toHaveBeenCalledTimes(1);
      expect(changeHandler).toHaveBeenCalledTimes(1);
    });
  });
});
