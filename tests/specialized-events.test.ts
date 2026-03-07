import { describe, it, expect, vi } from 'vitest';
import { Event } from '../src/events/Event';
import { UIEvent } from '../src/events/UIEvent';
import { MouseEvent } from '../src/events/MouseEvent';
import { KeyboardEvent } from '../src/events/KeyboardEvent';
import { FocusEvent } from '../src/events/FocusEvent';
import { InputEvent } from '../src/events/InputEvent';
import { PointerEvent } from '../src/events/PointerEvent';
import { EventTarget } from '../src/events/EventTarget';

// ─── UIEvent ───────────────────────────────────────────────────────────────

describe('UIEvent', () => {
  it('should have correct defaults when no init provided', () => {
    const e = new UIEvent('resize');
    expect(e.type).toBe('resize');
    expect(e.view).toBeNull();
    expect(e.detail).toBe(0);
    expect(e.bubbles).toBe(false);
    expect(e.cancelable).toBe(false);
  });

  it('should accept init properties', () => {
    const fakeView = { window: true };
    const e = new UIEvent('scroll', { view: fakeView, detail: 3, bubbles: true });
    expect(e.view).toBe(fakeView);
    expect(e.detail).toBe(3);
    expect(e.bubbles).toBe(true);
  });

  it('should be instanceof Event', () => {
    const e = new UIEvent('test');
    expect(e).toBeInstanceOf(Event);
    expect(e).toBeInstanceOf(UIEvent);
  });

  it('should have a timeStamp', () => {
    const before = Date.now();
    const e = new UIEvent('test');
    const after = Date.now();
    expect(e.timeStamp).toBeGreaterThanOrEqual(before);
    expect(e.timeStamp).toBeLessThanOrEqual(after);
  });

  it('should support preventDefault when cancelable', () => {
    const e = new UIEvent('test', { cancelable: true });
    expect(e.defaultPrevented).toBe(false);
    e.preventDefault();
    expect(e.defaultPrevented).toBe(true);
  });
});

// ─── MouseEvent ────────────────────────────────────────────────────────────

describe('MouseEvent', () => {
  it('should have correct defaults when no init provided', () => {
    const e = new MouseEvent('click');
    expect(e.type).toBe('click');
    expect(e.screenX).toBe(0);
    expect(e.screenY).toBe(0);
    expect(e.clientX).toBe(0);
    expect(e.clientY).toBe(0);
    expect(e.pageX).toBe(0);
    expect(e.pageY).toBe(0);
    expect(e.offsetX).toBe(0);
    expect(e.offsetY).toBe(0);
    expect(e.movementX).toBe(0);
    expect(e.movementY).toBe(0);
    expect(e.button).toBe(0);
    expect(e.buttons).toBe(0);
    expect(e.altKey).toBe(false);
    expect(e.ctrlKey).toBe(false);
    expect(e.metaKey).toBe(false);
    expect(e.shiftKey).toBe(false);
    expect(e.relatedTarget).toBeNull();
  });

  it('should accept all init properties', () => {
    const related = new EventTarget();
    const e = new MouseEvent('mousedown', {
      screenX: 100,
      screenY: 200,
      clientX: 50,
      clientY: 75,
      pageX: 55,
      pageY: 80,
      offsetX: 10,
      offsetY: 15,
      movementX: 5,
      movementY: -3,
      button: 2,
      buttons: 6,
      altKey: true,
      ctrlKey: true,
      metaKey: false,
      shiftKey: true,
      relatedTarget: related,
      bubbles: true,
      cancelable: true,
    });
    expect(e.screenX).toBe(100);
    expect(e.screenY).toBe(200);
    expect(e.clientX).toBe(50);
    expect(e.clientY).toBe(75);
    expect(e.pageX).toBe(55);
    expect(e.pageY).toBe(80);
    expect(e.offsetX).toBe(10);
    expect(e.offsetY).toBe(15);
    expect(e.movementX).toBe(5);
    expect(e.movementY).toBe(-3);
    expect(e.button).toBe(2);
    expect(e.buttons).toBe(6);
    expect(e.altKey).toBe(true);
    expect(e.ctrlKey).toBe(true);
    expect(e.metaKey).toBe(false);
    expect(e.shiftKey).toBe(true);
    expect(e.relatedTarget).toBe(related);
    expect(e.bubbles).toBe(true);
    expect(e.cancelable).toBe(true);
  });

  it('should default pageX/pageY to clientX/clientY when not provided', () => {
    const e = new MouseEvent('mousemove', { clientX: 123, clientY: 456 });
    expect(e.pageX).toBe(123);
    expect(e.pageY).toBe(456);
  });

  it('should override pageX/pageY independently of clientX/clientY', () => {
    const e = new MouseEvent('mousemove', { clientX: 10, clientY: 20, pageX: 30, pageY: 40 });
    expect(e.clientX).toBe(10);
    expect(e.clientY).toBe(20);
    expect(e.pageX).toBe(30);
    expect(e.pageY).toBe(40);
  });

  it('should be instanceof UIEvent and Event', () => {
    const e = new MouseEvent('click');
    expect(e).toBeInstanceOf(MouseEvent);
    expect(e).toBeInstanceOf(UIEvent);
    expect(e).toBeInstanceOf(Event);
  });

  describe('getModifierState', () => {
    it('should return true for Alt when altKey is set', () => {
      const e = new MouseEvent('click', { altKey: true });
      expect(e.getModifierState('Alt')).toBe(true);
      expect(e.getModifierState('Control')).toBe(false);
    });

    it('should return true for AltGraph when altKey is set', () => {
      const e = new MouseEvent('click', { altKey: true });
      expect(e.getModifierState('AltGraph')).toBe(true);
    });

    it('should return true for Control when ctrlKey is set', () => {
      const e = new MouseEvent('click', { ctrlKey: true });
      expect(e.getModifierState('Control')).toBe(true);
    });

    it('should return true for Meta when metaKey is set', () => {
      const e = new MouseEvent('click', { metaKey: true });
      expect(e.getModifierState('Meta')).toBe(true);
    });

    it('should return true for Shift when shiftKey is set', () => {
      const e = new MouseEvent('click', { shiftKey: true });
      expect(e.getModifierState('Shift')).toBe(true);
    });

    it('should return false for unknown modifier keys', () => {
      const e = new MouseEvent('click', {
        altKey: true,
        ctrlKey: true,
        metaKey: true,
        shiftKey: true,
      });
      expect(e.getModifierState('CapsLock')).toBe(false);
      expect(e.getModifierState('NumLock')).toBe(false);
      expect(e.getModifierState('')).toBe(false);
    });

    it('should handle multiple modifiers simultaneously', () => {
      const e = new MouseEvent('click', { ctrlKey: true, shiftKey: true });
      expect(e.getModifierState('Control')).toBe(true);
      expect(e.getModifierState('Shift')).toBe(true);
      expect(e.getModifierState('Alt')).toBe(false);
      expect(e.getModifierState('Meta')).toBe(false);
    });
  });

  it('should represent left click with button 0', () => {
    const e = new MouseEvent('click', { button: 0 });
    expect(e.button).toBe(0);
  });

  it('should represent middle click with button 1', () => {
    const e = new MouseEvent('click', { button: 1 });
    expect(e.button).toBe(1);
  });

  it('should represent right click with button 2', () => {
    const e = new MouseEvent('contextmenu', { button: 2 });
    expect(e.button).toBe(2);
  });
});

// ─── KeyboardEvent ─────────────────────────────────────────────────────────

describe('KeyboardEvent', () => {
  it('should have correct defaults when no init provided', () => {
    const e = new KeyboardEvent('keydown');
    expect(e.type).toBe('keydown');
    expect(e.key).toBe('');
    expect(e.code).toBe('');
    expect(e.location).toBe(0);
    expect(e.altKey).toBe(false);
    expect(e.ctrlKey).toBe(false);
    expect(e.metaKey).toBe(false);
    expect(e.shiftKey).toBe(false);
    expect(e.repeat).toBe(false);
    expect(e.isComposing).toBe(false);
  });

  it('should accept all init properties', () => {
    const e = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      location: 0,
      altKey: true,
      ctrlKey: true,
      metaKey: true,
      shiftKey: true,
      repeat: true,
      isComposing: true,
      bubbles: true,
      cancelable: true,
    });
    expect(e.key).toBe('Enter');
    expect(e.code).toBe('Enter');
    expect(e.location).toBe(0);
    expect(e.altKey).toBe(true);
    expect(e.ctrlKey).toBe(true);
    expect(e.metaKey).toBe(true);
    expect(e.shiftKey).toBe(true);
    expect(e.repeat).toBe(true);
    expect(e.isComposing).toBe(true);
    expect(e.bubbles).toBe(true);
    expect(e.cancelable).toBe(true);
  });

  it('should be instanceof UIEvent and Event', () => {
    const e = new KeyboardEvent('keyup');
    expect(e).toBeInstanceOf(KeyboardEvent);
    expect(e).toBeInstanceOf(UIEvent);
    expect(e).toBeInstanceOf(Event);
  });

  it('should have static location constants', () => {
    expect(KeyboardEvent.DOM_KEY_LOCATION_STANDARD).toBe(0);
    expect(KeyboardEvent.DOM_KEY_LOCATION_LEFT).toBe(1);
    expect(KeyboardEvent.DOM_KEY_LOCATION_RIGHT).toBe(2);
    expect(KeyboardEvent.DOM_KEY_LOCATION_NUMPAD).toBe(3);
  });

  it('should represent letter key correctly', () => {
    const e = new KeyboardEvent('keydown', { key: 'a', code: 'KeyA' });
    expect(e.key).toBe('a');
    expect(e.code).toBe('KeyA');
  });

  it('should represent arrow key correctly', () => {
    const e = new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown' });
    expect(e.key).toBe('ArrowDown');
    expect(e.code).toBe('ArrowDown');
  });

  it('should represent numpad key with correct location', () => {
    const e = new KeyboardEvent('keydown', {
      key: '5',
      code: 'Numpad5',
      location: KeyboardEvent.DOM_KEY_LOCATION_NUMPAD,
    });
    expect(e.key).toBe('5');
    expect(e.code).toBe('Numpad5');
    expect(e.location).toBe(3);
  });

  it('should distinguish left and right modifier locations', () => {
    const left = new KeyboardEvent('keydown', {
      key: 'Shift',
      code: 'ShiftLeft',
      location: KeyboardEvent.DOM_KEY_LOCATION_LEFT,
      shiftKey: true,
    });
    const right = new KeyboardEvent('keydown', {
      key: 'Shift',
      code: 'ShiftRight',
      location: KeyboardEvent.DOM_KEY_LOCATION_RIGHT,
      shiftKey: true,
    });
    expect(left.location).toBe(1);
    expect(right.location).toBe(2);
    expect(left.key).toBe(right.key);
  });

  describe('getModifierState', () => {
    it('should return true for Alt when altKey is set', () => {
      const e = new KeyboardEvent('keydown', { altKey: true });
      expect(e.getModifierState('Alt')).toBe(true);
    });

    it('should return true for Control when ctrlKey is set', () => {
      const e = new KeyboardEvent('keydown', { ctrlKey: true });
      expect(e.getModifierState('Control')).toBe(true);
    });

    it('should return true for Meta when metaKey is set', () => {
      const e = new KeyboardEvent('keydown', { metaKey: true });
      expect(e.getModifierState('Meta')).toBe(true);
    });

    it('should return true for Shift when shiftKey is set', () => {
      const e = new KeyboardEvent('keydown', { shiftKey: true });
      expect(e.getModifierState('Shift')).toBe(true);
    });

    it('should return false for unknown modifiers', () => {
      const e = new KeyboardEvent('keydown', { altKey: true });
      expect(e.getModifierState('CapsLock')).toBe(false);
    });
  });

  it('should handle repeat flag for held keys', () => {
    const first = new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', repeat: false });
    const held = new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', repeat: true });
    expect(first.repeat).toBe(false);
    expect(held.repeat).toBe(true);
  });

  it('should handle isComposing for IME input', () => {
    const e = new KeyboardEvent('keydown', { key: 'Process', isComposing: true });
    expect(e.isComposing).toBe(true);
  });
});

// ─── FocusEvent ────────────────────────────────────────────────────────────

describe('FocusEvent', () => {
  it('should have correct defaults when no init provided', () => {
    const e = new FocusEvent('focus');
    expect(e.type).toBe('focus');
    expect(e.relatedTarget).toBeNull();
    expect(e.bubbles).toBe(false);
  });

  it('should accept relatedTarget in init', () => {
    const other = new EventTarget();
    const e = new FocusEvent('blur', { relatedTarget: other });
    expect(e.relatedTarget).toBe(other);
  });

  it('should be instanceof UIEvent and Event', () => {
    const e = new FocusEvent('focus');
    expect(e).toBeInstanceOf(FocusEvent);
    expect(e).toBeInstanceOf(UIEvent);
    expect(e).toBeInstanceOf(Event);
  });

  it('should support non-bubbling focus event', () => {
    const e = new FocusEvent('focus', { bubbles: false });
    expect(e.bubbles).toBe(false);
  });

  it('should support bubbling focusin event', () => {
    const e = new FocusEvent('focusin', { bubbles: true });
    expect(e.bubbles).toBe(true);
  });

  it('should support non-bubbling blur event', () => {
    const e = new FocusEvent('blur', { bubbles: false });
    expect(e.bubbles).toBe(false);
  });

  it('should support bubbling focusout event', () => {
    const e = new FocusEvent('focusout', { bubbles: true });
    expect(e.bubbles).toBe(true);
  });

  it('should carry relatedTarget representing the element losing focus', () => {
    const losingFocus = new EventTarget();
    const gainingFocus = new EventTarget();
    const focusIn = new FocusEvent('focusin', {
      relatedTarget: losingFocus,
      bubbles: true,
    });
    expect(focusIn.relatedTarget).toBe(losingFocus);
  });
});

// ─── InputEvent ────────────────────────────────────────────────────────────

describe('InputEvent', () => {
  it('should have correct defaults when no init provided', () => {
    const e = new InputEvent('input');
    expect(e.type).toBe('input');
    expect(e.data).toBeNull();
    expect(e.inputType).toBe('');
    expect(e.isComposing).toBe(false);
    expect(e.dataTransfer).toBeNull();
  });

  it('should accept all init properties', () => {
    const e = new InputEvent('input', {
      data: 'hello',
      inputType: 'insertText',
      isComposing: false,
      bubbles: true,
    });
    expect(e.data).toBe('hello');
    expect(e.inputType).toBe('insertText');
    expect(e.isComposing).toBe(false);
    expect(e.bubbles).toBe(true);
  });

  it('should be instanceof UIEvent and Event', () => {
    const e = new InputEvent('input');
    expect(e).toBeInstanceOf(InputEvent);
    expect(e).toBeInstanceOf(UIEvent);
    expect(e).toBeInstanceOf(Event);
  });

  it('should handle deleteContentBackward inputType', () => {
    const e = new InputEvent('input', {
      data: null,
      inputType: 'deleteContentBackward',
    });
    expect(e.data).toBeNull();
    expect(e.inputType).toBe('deleteContentBackward');
  });

  it('should handle insertFromPaste inputType', () => {
    const e = new InputEvent('input', {
      data: 'pasted text',
      inputType: 'insertFromPaste',
    });
    expect(e.data).toBe('pasted text');
    expect(e.inputType).toBe('insertFromPaste');
  });

  it('should handle beforeinput event type', () => {
    const e = new InputEvent('beforeinput', {
      data: 'x',
      inputType: 'insertText',
      cancelable: true,
    });
    expect(e.type).toBe('beforeinput');
    expect(e.cancelable).toBe(true);
  });

  it('should handle composition input', () => {
    const e = new InputEvent('input', {
      data: '\u304B',
      inputType: 'insertCompositionText',
      isComposing: true,
    });
    expect(e.data).toBe('\u304B');
    expect(e.isComposing).toBe(true);
  });

  it('should always have dataTransfer as null (stub)', () => {
    const e = new InputEvent('input', { data: 'test' });
    expect(e.dataTransfer).toBeNull();
  });
});

// ─── PointerEvent ──────────────────────────────────────────────────────────

describe('PointerEvent', () => {
  it('should have correct defaults when no init provided', () => {
    const e = new PointerEvent('pointerdown');
    expect(e.type).toBe('pointerdown');
    expect(e.pointerId).toBe(0);
    expect(e.width).toBe(1);
    expect(e.height).toBe(1);
    expect(e.pressure).toBe(0);
    expect(e.tangentialPressure).toBe(0);
    expect(e.tiltX).toBe(0);
    expect(e.tiltY).toBe(0);
    expect(e.twist).toBe(0);
    expect(e.pointerType).toBe('mouse');
    expect(e.isPrimary).toBe(false);
    // Inherited MouseEvent defaults
    expect(e.clientX).toBe(0);
    expect(e.clientY).toBe(0);
    expect(e.button).toBe(0);
  });

  it('should accept all pointer-specific init properties', () => {
    const e = new PointerEvent('pointermove', {
      pointerId: 42,
      width: 25,
      height: 25,
      pressure: 0.75,
      tangentialPressure: 0.1,
      tiltX: 30,
      tiltY: -15,
      twist: 45,
      pointerType: 'pen',
      isPrimary: true,
      clientX: 200,
      clientY: 300,
      bubbles: true,
    });
    expect(e.pointerId).toBe(42);
    expect(e.width).toBe(25);
    expect(e.height).toBe(25);
    expect(e.pressure).toBe(0.75);
    expect(e.tangentialPressure).toBe(0.1);
    expect(e.tiltX).toBe(30);
    expect(e.tiltY).toBe(-15);
    expect(e.twist).toBe(45);
    expect(e.pointerType).toBe('pen');
    expect(e.isPrimary).toBe(true);
    expect(e.clientX).toBe(200);
    expect(e.clientY).toBe(300);
    expect(e.bubbles).toBe(true);
  });

  it('should be instanceof MouseEvent, UIEvent, and Event', () => {
    const e = new PointerEvent('pointerdown');
    expect(e).toBeInstanceOf(PointerEvent);
    expect(e).toBeInstanceOf(MouseEvent);
    expect(e).toBeInstanceOf(UIEvent);
    expect(e).toBeInstanceOf(Event);
  });

  it('should represent touch input', () => {
    const e = new PointerEvent('pointerdown', {
      pointerId: 1,
      pointerType: 'touch',
      isPrimary: true,
      width: 50,
      height: 50,
      pressure: 0.5,
    });
    expect(e.pointerType).toBe('touch');
    expect(e.isPrimary).toBe(true);
    expect(e.width).toBe(50);
    expect(e.height).toBe(50);
  });

  it('should represent pen input with tilt', () => {
    const e = new PointerEvent('pointermove', {
      pointerType: 'pen',
      tiltX: 45,
      tiltY: -20,
      pressure: 0.9,
      twist: 10,
    });
    expect(e.pointerType).toBe('pen');
    expect(e.tiltX).toBe(45);
    expect(e.tiltY).toBe(-20);
    expect(e.pressure).toBe(0.9);
    expect(e.twist).toBe(10);
  });

  it('should inherit getModifierState from MouseEvent', () => {
    const e = new PointerEvent('pointerdown', { ctrlKey: true, shiftKey: true });
    expect(e.getModifierState('Control')).toBe(true);
    expect(e.getModifierState('Shift')).toBe(true);
    expect(e.getModifierState('Alt')).toBe(false);
  });
});

// ─── Dispatch through DOM tree ─────────────────────────────────────────────

describe('Specialized events dispatched through DOM tree', () => {
  // Helper: create a simple parent-child EventTarget chain
  function createTree() {
    const parent = new EventTarget();
    const child = new EventTarget();
    // Wire up parentNode for propagation
    (child as any).parentNode = parent;
    return { parent, child };
  }

  it('should dispatch MouseEvent through capture and bubble', () => {
    const { parent, child } = createTree();
    const phases: number[] = [];
    parent.addEventListener('click', (e) => {
      phases.push(e.eventPhase);
    }, { capture: true });
    parent.addEventListener('click', (e) => {
      phases.push(e.eventPhase);
    });
    child.addEventListener('click', (e) => {
      phases.push(e.eventPhase);
    });

    const event = new MouseEvent('click', { bubbles: true, clientX: 42, clientY: 84 });
    child.dispatchEvent(event);

    expect(phases).toEqual([
      Event.CAPTURING_PHASE,
      Event.AT_TARGET,
      Event.BUBBLING_PHASE,
    ]);
    expect(event.target).toBe(child);
  });

  it('should dispatch KeyboardEvent through the tree', () => {
    const { parent, child } = createTree();
    const keys: string[] = [];

    parent.addEventListener('keydown', (e) => {
      keys.push((e as KeyboardEvent).key);
    });

    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      bubbles: true,
    });
    child.dispatchEvent(event);

    expect(keys).toEqual(['Escape']);
  });

  it('should dispatch FocusEvent (non-bubbling) — only at-target', () => {
    const { parent, child } = createTree();
    let parentHeard = false;
    let childHeard = false;

    parent.addEventListener('focus', () => { parentHeard = true; });
    child.addEventListener('focus', () => { childHeard = true; });

    const event = new FocusEvent('focus', { bubbles: false });
    child.dispatchEvent(event);

    expect(childHeard).toBe(true);
    expect(parentHeard).toBe(false);
  });

  it('should dispatch FocusEvent (bubbling focusin) — parent hears it', () => {
    const { parent, child } = createTree();
    let parentHeard = false;

    parent.addEventListener('focusin', () => { parentHeard = true; });

    const event = new FocusEvent('focusin', { bubbles: true });
    child.dispatchEvent(event);

    expect(parentHeard).toBe(true);
  });

  it('should dispatch InputEvent through the tree', () => {
    const { parent, child } = createTree();
    let capturedData: string | null = null;

    parent.addEventListener('input', (e) => {
      capturedData = (e as InputEvent).data;
    });

    const event = new InputEvent('input', { data: 'typed text', bubbles: true });
    child.dispatchEvent(event);

    expect(capturedData).toBe('typed text');
  });

  it('should dispatch PointerEvent through the tree', () => {
    const { parent, child } = createTree();
    let capturedPointerId: number | null = null;

    parent.addEventListener('pointerdown', (e) => {
      capturedPointerId = (e as PointerEvent).pointerId;
    });

    const event = new PointerEvent('pointerdown', {
      pointerId: 7,
      bubbles: true,
    });
    child.dispatchEvent(event);

    expect(capturedPointerId).toBe(7);
  });

  it('should allow stopPropagation on specialized events', () => {
    const { parent, child } = createTree();
    let parentHeard = false;

    child.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    parent.addEventListener('click', () => {
      parentHeard = true;
    });

    const event = new MouseEvent('click', { bubbles: true });
    child.dispatchEvent(event);

    expect(parentHeard).toBe(false);
  });

  it('should allow preventDefault on cancelable specialized events', () => {
    const { parent, child } = createTree();

    child.addEventListener('keydown', (e) => {
      e.preventDefault();
    });

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    const result = child.dispatchEvent(event);

    expect(result).toBe(false);
    expect(event.defaultPrevented).toBe(true);
  });
});

// ─── Index exports ─────────────────────────────────────────────────────────

describe('Index exports', () => {
  it('should export all specialized event classes from index', async () => {
    const events = await import('../src/events/index');
    expect(events.UIEvent).toBe(UIEvent);
    expect(events.MouseEvent).toBe(MouseEvent);
    expect(events.KeyboardEvent).toBe(KeyboardEvent);
    expect(events.FocusEvent).toBe(FocusEvent);
    expect(events.InputEvent).toBe(InputEvent);
    expect(events.PointerEvent).toBe(PointerEvent);
  });
});
