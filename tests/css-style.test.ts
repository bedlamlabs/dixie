import { describe, it, expect } from 'vitest';
import { CSSStyleDeclaration, camelToKebab, kebabToCamel } from '../src/css';

// ═══════════════════════════════════════════════════════════════════════
// Helper: fake element for sync tests
// ═══════════════════════════════════════════════════════════════════════

function createFakeElement() {
  const attrs: Record<string, string> = {};
  return {
    setAttribute(name: string, value: string) {
      attrs[name] = value;
    },
    getAttribute(name: string): string | null {
      return attrs[name] ?? null;
    },
    _attrs: attrs,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Name conversion utilities
// ═══════════════════════════════════════════════════════════════════════

describe('camelToKebab', () => {
  it('converts simple camelCase', () => {
    expect(camelToKebab('backgroundColor')).toBe('background-color');
  });

  it('converts multiple capitals', () => {
    expect(camelToKebab('borderTopWidth')).toBe('border-top-width');
  });

  it('handles single word (no capitals)', () => {
    expect(camelToKebab('color')).toBe('color');
  });

  it('handles vendor prefix webkitTransform', () => {
    expect(camelToKebab('webkitTransform')).toBe('-webkit-transform');
  });

  it('handles vendor prefix mozTransition', () => {
    expect(camelToKebab('mozTransition')).toBe('-moz-transition');
  });

  it('handles vendor prefix msOverflowStyle', () => {
    expect(camelToKebab('msOverflowStyle')).toBe('-ms-overflow-style');
  });

  it('handles vendor prefix oTransition', () => {
    expect(camelToKebab('oTransition')).toBe('-o-transition');
  });
});

describe('kebabToCamel', () => {
  it('converts simple kebab-case', () => {
    expect(kebabToCamel('background-color')).toBe('backgroundColor');
  });

  it('converts multiple dashes', () => {
    expect(kebabToCamel('border-top-width')).toBe('borderTopWidth');
  });

  it('handles single word', () => {
    expect(kebabToCamel('color')).toBe('color');
  });

  it('handles vendor prefix -webkit-transform', () => {
    expect(kebabToCamel('-webkit-transform')).toBe('webkitTransform');
  });

  it('handles vendor prefix -moz-transition', () => {
    expect(kebabToCamel('-moz-transition')).toBe('mozTransition');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CSSStyleDeclaration — Core methods
// ═══════════════════════════════════════════════════════════════════════

describe('CSSStyleDeclaration', () => {
  describe('setProperty / getPropertyValue', () => {
    it('sets and gets a simple property', () => {
      const style = new CSSStyleDeclaration();
      style.setProperty('color', 'red');
      expect(style.getPropertyValue('color')).toBe('red');
    });

    it('overwrites an existing property', () => {
      const style = new CSSStyleDeclaration();
      style.setProperty('color', 'red');
      style.setProperty('color', 'blue');
      expect(style.getPropertyValue('color')).toBe('blue');
    });

    it('returns empty string for non-existent property', () => {
      const style = new CSSStyleDeclaration();
      expect(style.getPropertyValue('color')).toBe('');
    });

    it('removes property when value is null', () => {
      const style = new CSSStyleDeclaration();
      style.setProperty('color', 'red');
      style.setProperty('color', null);
      expect(style.getPropertyValue('color')).toBe('');
    });

    it('removes property when value is empty string', () => {
      const style = new CSSStyleDeclaration();
      style.setProperty('color', 'red');
      style.setProperty('color', '');
      expect(style.getPropertyValue('color')).toBe('');
    });
  });

  describe('removeProperty', () => {
    it('removes a property and returns old value', () => {
      const style = new CSSStyleDeclaration();
      style.setProperty('color', 'red');
      const old = style.removeProperty('color');
      expect(old).toBe('red');
      expect(style.getPropertyValue('color')).toBe('');
    });

    it('returns empty string for non-existent property', () => {
      const style = new CSSStyleDeclaration();
      expect(style.removeProperty('color')).toBe('');
    });

    it('decrements length after removal', () => {
      const style = new CSSStyleDeclaration();
      style.setProperty('color', 'red');
      style.setProperty('font-size', '14px');
      expect(style.length).toBe(2);
      style.removeProperty('color');
      expect(style.length).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Priority (!important)
  // ═══════════════════════════════════════════════════════════════════

  describe('priority / !important', () => {
    it('stores priority when set', () => {
      const style = new CSSStyleDeclaration();
      style.setProperty('color', 'red', 'important');
      expect(style.getPropertyPriority('color')).toBe('important');
    });

    it('returns empty string when no priority', () => {
      const style = new CSSStyleDeclaration();
      style.setProperty('color', 'red');
      expect(style.getPropertyPriority('color')).toBe('');
    });

    it('returns empty string for non-existent property', () => {
      const style = new CSSStyleDeclaration();
      expect(style.getPropertyPriority('color')).toBe('');
    });

    it('includes !important in cssText', () => {
      const style = new CSSStyleDeclaration();
      style.setProperty('color', 'red', 'important');
      expect(style.cssText).toBe('color: red !important;');
    });

    it('ignores non-"important" priority values', () => {
      const style = new CSSStyleDeclaration();
      style.setProperty('color', 'red', 'banana');
      expect(style.getPropertyPriority('color')).toBe('');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // item() and length
  // ═══════════════════════════════════════════════════════════════════

  describe('item() and length', () => {
    it('starts with length 0', () => {
      const style = new CSSStyleDeclaration();
      expect(style.length).toBe(0);
    });

    it('increments length on add', () => {
      const style = new CSSStyleDeclaration();
      style.setProperty('color', 'red');
      expect(style.length).toBe(1);
      style.setProperty('font-size', '14px');
      expect(style.length).toBe(2);
    });

    it('does not increment length when overwriting', () => {
      const style = new CSSStyleDeclaration();
      style.setProperty('color', 'red');
      style.setProperty('color', 'blue');
      expect(style.length).toBe(1);
    });

    it('returns property name by index (insertion order)', () => {
      const style = new CSSStyleDeclaration();
      style.setProperty('color', 'red');
      style.setProperty('font-size', '14px');
      style.setProperty('margin', '10px');
      expect(style.item(0)).toBe('color');
      expect(style.item(1)).toBe('font-size');
      expect(style.item(2)).toBe('margin');
    });

    it('returns empty string for out-of-bounds index', () => {
      const style = new CSSStyleDeclaration();
      expect(style.item(0)).toBe('');
      expect(style.item(99)).toBe('');
    });

    it('supports numeric index via proxy', () => {
      const style = new CSSStyleDeclaration() as any;
      style.setProperty('color', 'red');
      style.setProperty('font-size', '14px');
      expect(style[0]).toBe('color');
      expect(style[1]).toBe('font-size');
      expect(style[5]).toBe('');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // cssText getter / setter
  // ═══════════════════════════════════════════════════════════════════

  describe('cssText', () => {
    it('serializes empty to empty string', () => {
      const style = new CSSStyleDeclaration();
      expect(style.cssText).toBe('');
    });

    it('serializes single property', () => {
      const style = new CSSStyleDeclaration();
      style.setProperty('color', 'red');
      expect(style.cssText).toBe('color: red;');
    });

    it('serializes multiple properties with semicolons', () => {
      const style = new CSSStyleDeclaration();
      style.setProperty('color', 'red');
      style.setProperty('font-size', '14px');
      expect(style.cssText).toBe('color: red; font-size: 14px;');
    });

    it('setter replaces all properties', () => {
      const style = new CSSStyleDeclaration();
      style.setProperty('color', 'red');
      style.cssText = 'font-size: 14px; margin: 10px;';
      expect(style.getPropertyValue('color')).toBe('');
      expect(style.getPropertyValue('font-size')).toBe('14px');
      expect(style.getPropertyValue('margin')).toBe('10px');
      expect(style.length).toBe(2);
    });

    it('setter handles empty string (clears all)', () => {
      const style = new CSSStyleDeclaration();
      style.setProperty('color', 'red');
      style.cssText = '';
      expect(style.length).toBe(0);
      expect(style.cssText).toBe('');
    });

    it('parses trailing semicolons', () => {
      const style = new CSSStyleDeclaration();
      style.cssText = 'color: red;;;';
      expect(style.getPropertyValue('color')).toBe('red');
      expect(style.length).toBe(1);
    });

    it('parses extra whitespace', () => {
      const style = new CSSStyleDeclaration();
      style.cssText = '  color :  red  ;  font-size :  14px  ;  ';
      expect(style.getPropertyValue('color')).toBe('red');
      expect(style.getPropertyValue('font-size')).toBe('14px');
    });

    it('parses !important in cssText', () => {
      const style = new CSSStyleDeclaration();
      style.cssText = 'color: red !important; font-size: 14px;';
      expect(style.getPropertyValue('color')).toBe('red');
      expect(style.getPropertyPriority('color')).toBe('important');
      expect(style.getPropertyPriority('font-size')).toBe('');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Proxy-based camelCase access
  // ═══════════════════════════════════════════════════════════════════

  describe('camelCase proxy access', () => {
    it('sets via camelCase, gets via camelCase', () => {
      const style = new CSSStyleDeclaration() as any;
      style.backgroundColor = 'red';
      expect(style.backgroundColor).toBe('red');
    });

    it('stores internally as kebab-case', () => {
      const style = new CSSStyleDeclaration() as any;
      style.backgroundColor = 'red';
      expect(style.getPropertyValue('background-color')).toBe('red');
    });

    it('gets via camelCase what was set via setProperty', () => {
      const style = new CSSStyleDeclaration() as any;
      style.setProperty('background-color', 'blue');
      expect(style.backgroundColor).toBe('blue');
    });

    it('returns empty string for unset camelCase property', () => {
      const style = new CSSStyleDeclaration() as any;
      expect(style.backgroundColor).toBe('');
    });

    it('removes property when set to empty string via camelCase', () => {
      const style = new CSSStyleDeclaration() as any;
      style.backgroundColor = 'red';
      style.backgroundColor = '';
      expect(style.backgroundColor).toBe('');
      expect(style.length).toBe(0);
    });

    it('removes property when set to null via camelCase', () => {
      const style = new CSSStyleDeclaration() as any;
      style.backgroundColor = 'red';
      style.backgroundColor = null;
      expect(style.backgroundColor).toBe('');
      expect(style.length).toBe(0);
    });

    it('handles simple single-word property via camelCase', () => {
      const style = new CSSStyleDeclaration() as any;
      style.color = 'green';
      expect(style.color).toBe('green');
      expect(style.getPropertyValue('color')).toBe('green');
    });

    it('handles numeric values', () => {
      const style = new CSSStyleDeclaration() as any;
      style.fontSize = '16px';
      expect(style.fontSize).toBe('16px');
    });

    it('handles lineHeight', () => {
      const style = new CSSStyleDeclaration() as any;
      style.lineHeight = '1.5';
      expect(style.lineHeight).toBe('1.5');
      expect(style.getPropertyValue('line-height')).toBe('1.5');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // cssFloat ↔ float special mapping
  // ═══════════════════════════════════════════════════════════════════

  describe('cssFloat ↔ float', () => {
    it('cssFloat sets the float CSS property', () => {
      const style = new CSSStyleDeclaration() as any;
      style.cssFloat = 'left';
      expect(style.getPropertyValue('float')).toBe('left');
    });

    it('cssFloat gets the float CSS property', () => {
      const style = new CSSStyleDeclaration() as any;
      style.setProperty('float', 'right');
      expect(style.cssFloat).toBe('right');
    });

    it('cssFloat returns empty string when unset', () => {
      const style = new CSSStyleDeclaration() as any;
      expect(style.cssFloat).toBe('');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Vendor prefixes via proxy
  // ═══════════════════════════════════════════════════════════════════

  describe('vendor prefixes via proxy', () => {
    it('webkitTransform maps to -webkit-transform', () => {
      const style = new CSSStyleDeclaration() as any;
      style.webkitTransform = 'rotate(45deg)';
      expect(style.getPropertyValue('-webkit-transform')).toBe('rotate(45deg)');
      expect(style.webkitTransform).toBe('rotate(45deg)');
    });

    it('mozTransition maps to -moz-transition', () => {
      const style = new CSSStyleDeclaration() as any;
      style.mozTransition = 'all 0.3s';
      expect(style.getPropertyValue('-moz-transition')).toBe('all 0.3s');
      expect(style.mozTransition).toBe('all 0.3s');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Constructor with initial CSS text
  // ═══════════════════════════════════════════════════════════════════

  describe('constructor with initial CSS text', () => {
    it('parses initial CSS text', () => {
      const style = new CSSStyleDeclaration('color: red; font-size: 14px;');
      expect(style.getPropertyValue('color')).toBe('red');
      expect(style.getPropertyValue('font-size')).toBe('14px');
      expect(style.length).toBe(2);
    });

    it('parses initial CSS text with !important', () => {
      const style = new CSSStyleDeclaration('color: red !important;');
      expect(style.getPropertyValue('color')).toBe('red');
      expect(style.getPropertyPriority('color')).toBe('important');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Owner element sync
  // ═══════════════════════════════════════════════════════════════════

  describe('owner element sync', () => {
    it('syncs setProperty to element style attribute', () => {
      const el = createFakeElement();
      const style = new CSSStyleDeclaration(undefined, el);
      style.setProperty('color', 'red');
      expect(el._attrs['style']).toBe('color: red;');
    });

    it('syncs camelCase set to element style attribute', () => {
      const el = createFakeElement();
      const style = new CSSStyleDeclaration(undefined, el) as any;
      style.backgroundColor = 'blue';
      expect(el._attrs['style']).toBe('background-color: blue;');
    });

    it('syncs removeProperty to element style attribute', () => {
      const el = createFakeElement();
      const style = new CSSStyleDeclaration('color: red; font-size: 14px;', el);
      style.removeProperty('color');
      expect(el._attrs['style']).toBe('font-size: 14px;');
    });

    it('syncs cssText setter to element style attribute', () => {
      const el = createFakeElement();
      const style = new CSSStyleDeclaration(undefined, el);
      style.cssText = 'margin: 10px; padding: 5px;';
      expect(el._attrs['style']).toBe('margin: 10px; padding: 5px;');
    });

    it('sets empty string on element when all properties removed', () => {
      const el = createFakeElement();
      const style = new CSSStyleDeclaration('color: red;', el);
      style.removeProperty('color');
      expect(el._attrs['style']).toBe('');
    });

    it('does not sync when no owner element', () => {
      // Just make sure it doesn't throw
      const style = new CSSStyleDeclaration();
      style.setProperty('color', 'red');
      style.removeProperty('color');
      style.cssText = 'font-size: 14px;';
    });

    it('does not sync constructor parse to element', () => {
      // The constructor parse happens before sync binding — verifying
      // that initial cssText is not prematurely written. This is by
      // design: the element already has the style attribute that
      // prompted the CSSStyleDeclaration creation.
      const el = createFakeElement();
      const _style = new CSSStyleDeclaration('color: red;', el);
      // After construction, no sync should have occurred
      // (the element is assumed to already have this value)
      expect(el._attrs['style']).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Edge cases
  // ═══════════════════════════════════════════════════════════════════

  describe('edge cases', () => {
    it('handles property value with colons (e.g. url())', () => {
      const style = new CSSStyleDeclaration();
      style.cssText = 'background: url(http://example.com/img.png);';
      expect(style.getPropertyValue('background')).toBe('url(http://example.com/img.png)');
    });

    it('handles property with spaces in value', () => {
      const style = new CSSStyleDeclaration();
      style.setProperty('font-family', '"Helvetica Neue", Arial, sans-serif');
      expect(style.getPropertyValue('font-family')).toBe('"Helvetica Neue", Arial, sans-serif');
    });

    it('does not duplicate property in order list when overwriting', () => {
      const style = new CSSStyleDeclaration();
      style.setProperty('color', 'red');
      style.setProperty('font-size', '14px');
      style.setProperty('color', 'blue');
      expect(style.length).toBe(2);
      expect(style.item(0)).toBe('color');
      expect(style.item(1)).toBe('font-size');
    });

    it('cssText parses declarations without values gracefully', () => {
      const style = new CSSStyleDeclaration();
      // "color" alone with no colon should be skipped
      style.cssText = 'color; font-size: 14px;';
      expect(style.getPropertyValue('color')).toBe('');
      expect(style.getPropertyValue('font-size')).toBe('14px');
      expect(style.length).toBe(1);
    });

    it('cssText parses declarations with empty value gracefully', () => {
      const style = new CSSStyleDeclaration();
      // "color:" with nothing after colon should be skipped (empty val)
      style.cssText = 'color: ; font-size: 14px;';
      expect(style.getPropertyValue('color')).toBe('');
      expect(style.getPropertyValue('font-size')).toBe('14px');
    });

    it('handles setting same property twice via cssText', () => {
      const style = new CSSStyleDeclaration();
      style.cssText = 'color: red; color: blue;';
      expect(style.getPropertyValue('color')).toBe('blue');
      expect(style.length).toBe(1);
    });

    it('multiple add/remove cycles maintain correct length', () => {
      const style = new CSSStyleDeclaration();
      style.setProperty('color', 'red');
      style.setProperty('font-size', '14px');
      style.setProperty('margin', '10px');
      expect(style.length).toBe(3);

      style.removeProperty('font-size');
      expect(style.length).toBe(2);

      style.setProperty('padding', '5px');
      expect(style.length).toBe(3);

      style.removeProperty('color');
      style.removeProperty('margin');
      style.removeProperty('padding');
      expect(style.length).toBe(0);
    });

    it('item returns empty after all properties removed', () => {
      const style = new CSSStyleDeclaration();
      style.setProperty('color', 'red');
      style.removeProperty('color');
      expect(style.item(0)).toBe('');
    });
  });
});
