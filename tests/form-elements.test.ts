import { describe, it, expect, vi } from 'vitest';
import { HTMLInputElement } from '../src/nodes/HTMLInputElement';
import { HTMLSelectElement } from '../src/nodes/HTMLSelectElement';
import { HTMLTextAreaElement } from '../src/nodes/HTMLTextAreaElement';
import { HTMLFormElement } from '../src/nodes/HTMLFormElement';
import { HTMLOptionElement } from '../src/nodes/HTMLOptionElement';
import { HTMLButtonElement } from '../src/nodes/HTMLButtonElement';
import { HTMLLabelElement } from '../src/nodes/HTMLLabelElement';
import { Element } from '../src/nodes/Element';
import { Document } from '../src/nodes/Document';

// ═══════════════════════════════════════════════════════════════════
// HTMLInputElement
// ═══════════════════════════════════════════════════════════════════
describe('HTMLInputElement', () => {
  it('has tagName INPUT', () => {
    const input = new HTMLInputElement();
    expect(input.tagName).toBe('INPUT');
  });

  it('type defaults to text', () => {
    const input = new HTMLInputElement();
    expect(input.type).toBe('text');
  });

  it('type getter/setter uses attribute', () => {
    const input = new HTMLInputElement();
    input.type = 'email';
    expect(input.type).toBe('email');
    expect(input.getAttribute('type')).toBe('email');
  });

  it('value is internal state, NOT the attribute', () => {
    const input = new HTMLInputElement();
    input.value = 'hello';
    expect(input.value).toBe('hello');
    // The 'value' attribute should NOT reflect internal value
    expect(input.getAttribute('value')).toBeNull();
  });

  it('defaultValue maps to the value attribute', () => {
    const input = new HTMLInputElement();
    input.defaultValue = 'default';
    expect(input.defaultValue).toBe('default');
    expect(input.getAttribute('value')).toBe('default');
    // Internal value is independent
    expect(input.value).toBe('');
  });

  it('checked is internal state, NOT the attribute', () => {
    const input = new HTMLInputElement();
    input.type = 'checkbox';
    input.checked = true;
    expect(input.checked).toBe(true);
    expect(input.hasAttribute('checked')).toBe(false);
  });

  it('defaultChecked maps to the checked attribute', () => {
    const input = new HTMLInputElement();
    input.defaultChecked = true;
    expect(input.defaultChecked).toBe(true);
    expect(input.hasAttribute('checked')).toBe(true);
    // Internal checked is independent
    expect(input.checked).toBe(false);
  });

  it('defaultChecked removal', () => {
    const input = new HTMLInputElement();
    input.defaultChecked = true;
    expect(input.hasAttribute('checked')).toBe(true);
    input.defaultChecked = false;
    expect(input.hasAttribute('checked')).toBe(false);
  });

  it('name getter/setter', () => {
    const input = new HTMLInputElement();
    expect(input.name).toBe('');
    input.name = 'username';
    expect(input.name).toBe('username');
    expect(input.getAttribute('name')).toBe('username');
  });

  it('disabled boolean attribute', () => {
    const input = new HTMLInputElement();
    expect(input.disabled).toBe(false);
    input.disabled = true;
    expect(input.disabled).toBe(true);
    expect(input.hasAttribute('disabled')).toBe(true);
    input.disabled = false;
    expect(input.disabled).toBe(false);
    expect(input.hasAttribute('disabled')).toBe(false);
  });

  it('readOnly boolean attribute', () => {
    const input = new HTMLInputElement();
    expect(input.readOnly).toBe(false);
    input.readOnly = true;
    expect(input.readOnly).toBe(true);
    expect(input.hasAttribute('readonly')).toBe(true);
    input.readOnly = false;
    expect(input.readOnly).toBe(false);
  });

  it('required boolean attribute', () => {
    const input = new HTMLInputElement();
    expect(input.required).toBe(false);
    input.required = true;
    expect(input.required).toBe(true);
    expect(input.hasAttribute('required')).toBe(true);
  });

  it('placeholder getter/setter', () => {
    const input = new HTMLInputElement();
    expect(input.placeholder).toBe('');
    input.placeholder = 'Enter text';
    expect(input.placeholder).toBe('Enter text');
    expect(input.getAttribute('placeholder')).toBe('Enter text');
  });

  it('min / max / step getter/setter', () => {
    const input = new HTMLInputElement();
    expect(input.min).toBe('');
    expect(input.max).toBe('');
    expect(input.step).toBe('');

    input.min = '0';
    input.max = '100';
    input.step = '5';

    expect(input.min).toBe('0');
    expect(input.max).toBe('100');
    expect(input.step).toBe('5');
  });

  it('minLength / maxLength default to -1', () => {
    const input = new HTMLInputElement();
    expect(input.minLength).toBe(-1);
    expect(input.maxLength).toBe(-1);
  });

  it('minLength / maxLength getter/setter', () => {
    const input = new HTMLInputElement();
    input.minLength = 3;
    input.maxLength = 50;
    expect(input.minLength).toBe(3);
    expect(input.maxLength).toBe(50);
    expect(input.getAttribute('minlength')).toBe('3');
    expect(input.getAttribute('maxlength')).toBe('50');
  });

  it('pattern getter/setter', () => {
    const input = new HTMLInputElement();
    expect(input.pattern).toBe('');
    input.pattern = '[0-9]+';
    expect(input.pattern).toBe('[0-9]+');
  });

  it('multiple boolean attribute', () => {
    const input = new HTMLInputElement();
    expect(input.multiple).toBe(false);
    input.multiple = true;
    expect(input.multiple).toBe(true);
    input.multiple = false;
    expect(input.multiple).toBe(false);
  });

  it('autofocus boolean attribute', () => {
    const input = new HTMLInputElement();
    expect(input.autofocus).toBe(false);
    input.autofocus = true;
    expect(input.autofocus).toBe(true);
    input.autofocus = false;
    expect(input.autofocus).toBe(false);
  });

  it('form returns parent form element', () => {
    const form = new HTMLFormElement();
    const input = new HTMLInputElement();
    form.appendChild(input);
    expect(input.form).toBe(form);
  });

  it('form returns null when not inside a form', () => {
    const input = new HTMLInputElement();
    expect(input.form).toBeNull();
  });

  it('form walks up through nested elements', () => {
    const form = new HTMLFormElement();
    const div = new Element('div');
    const input = new HTMLInputElement();
    form.appendChild(div);
    div.appendChild(input);
    expect(input.form).toBe(form);
  });

  it('focus / blur / select are no-ops and do not throw', () => {
    const input = new HTMLInputElement();
    expect(() => input.focus()).not.toThrow();
    expect(() => input.blur()).not.toThrow();
    expect(() => input.select()).not.toThrow();
  });

  it('click() toggles checked for checkbox', () => {
    const input = new HTMLInputElement();
    input.type = 'checkbox';
    expect(input.checked).toBe(false);
    input.click();
    expect(input.checked).toBe(true);
    input.click();
    expect(input.checked).toBe(false);
  });

  it('click() dispatches click event', () => {
    const input = new HTMLInputElement();
    const handler = vi.fn();
    input.addEventListener('click', handler);
    input.click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('click() does NOT toggle checked for non-checkbox types', () => {
    const input = new HTMLInputElement();
    input.type = 'text';
    input.checked = false;
    input.click();
    expect(input.checked).toBe(false);
  });

  it('checkValidity returns false when required and empty', () => {
    const input = new HTMLInputElement();
    input.required = true;
    expect(input.checkValidity()).toBe(false);
  });

  it('checkValidity returns true when required and has value', () => {
    const input = new HTMLInputElement();
    input.required = true;
    input.value = 'something';
    expect(input.checkValidity()).toBe(true);
  });

  it('checkValidity returns true when not required and empty', () => {
    const input = new HTMLInputElement();
    expect(input.checkValidity()).toBe(true);
  });

  it('reportValidity matches checkValidity', () => {
    const input = new HTMLInputElement();
    input.required = true;
    expect(input.reportValidity()).toBe(false);
    input.value = 'x';
    expect(input.reportValidity()).toBe(true);
  });

  it('validity object has valid and valueMissing', () => {
    const input = new HTMLInputElement();
    input.required = true;
    expect(input.validity.valid).toBe(false);
    expect(input.validity.valueMissing).toBe(true);

    input.value = 'filled';
    expect(input.validity.valid).toBe(true);
    expect(input.validity.valueMissing).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// HTMLOptionElement
// ═══════════════════════════════════════════════════════════════════
describe('HTMLOptionElement', () => {
  it('has tagName OPTION', () => {
    const opt = new HTMLOptionElement();
    expect(opt.tagName).toBe('OPTION');
  });

  it('value falls back to textContent when no attribute', () => {
    const opt = new HTMLOptionElement();
    opt.textContent = 'Hello';
    expect(opt.value).toBe('Hello');
  });

  it('value uses attribute when set', () => {
    const opt = new HTMLOptionElement();
    opt.textContent = 'Display Text';
    opt.value = 'val1';
    expect(opt.value).toBe('val1');
    expect(opt.getAttribute('value')).toBe('val1');
  });

  it('text getter/setter maps to textContent', () => {
    const opt = new HTMLOptionElement();
    opt.text = 'Option A';
    expect(opt.text).toBe('Option A');
    expect(opt.textContent).toBe('Option A');
  });

  it('selected getter/setter (internal state)', () => {
    const opt = new HTMLOptionElement();
    expect(opt.selected).toBe(false);
    opt.selected = true;
    expect(opt.selected).toBe(true);
  });

  it('defaultSelected maps to selected attribute', () => {
    const opt = new HTMLOptionElement();
    expect(opt.defaultSelected).toBe(false);
    opt.defaultSelected = true;
    expect(opt.defaultSelected).toBe(true);
    expect(opt.hasAttribute('selected')).toBe(true);
    opt.defaultSelected = false;
    expect(opt.hasAttribute('selected')).toBe(false);
  });

  it('disabled boolean attribute', () => {
    const opt = new HTMLOptionElement();
    expect(opt.disabled).toBe(false);
    opt.disabled = true;
    expect(opt.disabled).toBe(true);
  });

  it('index reflects position in parent select', () => {
    const select = new HTMLSelectElement();
    const opt0 = new HTMLOptionElement();
    const opt1 = new HTMLOptionElement();
    select.appendChild(opt0);
    select.appendChild(opt1);
    expect(opt0.index).toBe(0);
    expect(opt1.index).toBe(1);
  });

  it('index returns 0 when no parent select', () => {
    const opt = new HTMLOptionElement();
    expect(opt.index).toBe(0);
  });

  it('label falls back to text', () => {
    const opt = new HTMLOptionElement();
    opt.text = 'My Option';
    expect(opt.label).toBe('My Option');
  });

  it('label uses attribute when set', () => {
    const opt = new HTMLOptionElement();
    opt.text = 'My Option';
    opt.label = 'Short Label';
    expect(opt.label).toBe('Short Label');
  });

  it('form returns parent form', () => {
    const form = new HTMLFormElement();
    const select = new HTMLSelectElement();
    const opt = new HTMLOptionElement();
    form.appendChild(select);
    select.appendChild(opt);
    expect(opt.form).toBe(form);
  });
});

// ═══════════════════════════════════════════════════════════════════
// HTMLSelectElement
// ═══════════════════════════════════════════════════════════════════
describe('HTMLSelectElement', () => {
  it('has tagName SELECT', () => {
    const select = new HTMLSelectElement();
    expect(select.tagName).toBe('SELECT');
  });

  it('options returns live collection of option children', () => {
    const select = new HTMLSelectElement();
    const opt1 = new HTMLOptionElement();
    const opt2 = new HTMLOptionElement();
    select.appendChild(opt1);
    select.appendChild(opt2);
    expect(select.options.length).toBe(2);
  });

  it('selectedIndex defaults to -1', () => {
    const select = new HTMLSelectElement();
    expect(select.selectedIndex).toBe(-1);
  });

  it('setting value updates selectedIndex', () => {
    const select = new HTMLSelectElement();
    const opt1 = new HTMLOptionElement();
    opt1.value = 'a';
    const opt2 = new HTMLOptionElement();
    opt2.value = 'b';
    select.appendChild(opt1);
    select.appendChild(opt2);

    select.value = 'b';
    expect(select.selectedIndex).toBe(1);
    expect(opt2.selected).toBe(true);
    expect(opt1.selected).toBe(false);
  });

  it('setting selectedIndex updates value', () => {
    const select = new HTMLSelectElement();
    const opt1 = new HTMLOptionElement();
    opt1.value = 'x';
    const opt2 = new HTMLOptionElement();
    opt2.value = 'y';
    select.appendChild(opt1);
    select.appendChild(opt2);

    select.selectedIndex = 0;
    expect(select.value).toBe('x');
    expect(opt1.selected).toBe(true);
  });

  it('setting value to non-existent option sets selectedIndex to -1', () => {
    const select = new HTMLSelectElement();
    const opt = new HTMLOptionElement();
    opt.value = 'a';
    select.appendChild(opt);

    select.value = 'nonexistent';
    expect(select.selectedIndex).toBe(-1);
  });

  it('setting selectedIndex out of range sets -1', () => {
    const select = new HTMLSelectElement();
    const opt = new HTMLOptionElement();
    select.appendChild(opt);

    select.selectedIndex = 99;
    expect(select.selectedIndex).toBe(-1);
  });

  it('selectedOptions returns array of selected options', () => {
    const select = new HTMLSelectElement();
    const opt1 = new HTMLOptionElement();
    opt1.value = 'a';
    const opt2 = new HTMLOptionElement();
    opt2.value = 'b';
    select.appendChild(opt1);
    select.appendChild(opt2);

    select.value = 'a';
    const selected = select.selectedOptions;
    expect(selected).toHaveLength(1);
    expect(selected[0]).toBe(opt1);
  });

  it('value returns empty string when nothing selected', () => {
    const select = new HTMLSelectElement();
    expect(select.value).toBe('');
  });

  it('multiple boolean attribute', () => {
    const select = new HTMLSelectElement();
    expect(select.multiple).toBe(false);
    select.multiple = true;
    expect(select.multiple).toBe(true);
  });

  it('name getter/setter', () => {
    const select = new HTMLSelectElement();
    expect(select.name).toBe('');
    select.name = 'country';
    expect(select.name).toBe('country');
  });

  it('disabled boolean attribute', () => {
    const select = new HTMLSelectElement();
    expect(select.disabled).toBe(false);
    select.disabled = true;
    expect(select.disabled).toBe(true);
  });

  it('required boolean attribute', () => {
    const select = new HTMLSelectElement();
    expect(select.required).toBe(false);
    select.required = true;
    expect(select.required).toBe(true);
  });

  it('length returns number of options', () => {
    const select = new HTMLSelectElement();
    expect(select.length).toBe(0);
    select.appendChild(new HTMLOptionElement());
    select.appendChild(new HTMLOptionElement());
    expect(select.length).toBe(2);
  });

  it('form returns parent form', () => {
    const form = new HTMLFormElement();
    const select = new HTMLSelectElement();
    form.appendChild(select);
    expect(select.form).toBe(form);
  });

  it('form returns null when not inside form', () => {
    const select = new HTMLSelectElement();
    expect(select.form).toBeNull();
  });

  it('add() appends option', () => {
    const select = new HTMLSelectElement();
    const opt = new HTMLOptionElement();
    select.add(opt);
    expect(select.length).toBe(1);
  });

  it('add() inserts before index', () => {
    const select = new HTMLSelectElement();
    const opt1 = new HTMLOptionElement();
    opt1.value = 'first';
    const opt2 = new HTMLOptionElement();
    opt2.value = 'second';
    const opt3 = new HTMLOptionElement();
    opt3.value = 'inserted';

    select.add(opt1);
    select.add(opt2);
    select.add(opt3, 1);

    const opts = [...select.options] as HTMLOptionElement[];
    expect(opts[0].value).toBe('first');
    expect(opts[1].value).toBe('inserted');
    expect(opts[2].value).toBe('second');
  });

  it('add() inserts before HTMLOptionElement ref', () => {
    const select = new HTMLSelectElement();
    const opt1 = new HTMLOptionElement();
    opt1.value = 'a';
    const opt2 = new HTMLOptionElement();
    opt2.value = 'b';
    select.add(opt1);
    select.add(opt2, opt1);

    const opts = [...select.options] as HTMLOptionElement[];
    expect(opts[0].value).toBe('b');
    expect(opts[1].value).toBe('a');
  });

  it('remove() removes option at index', () => {
    const select = new HTMLSelectElement();
    const opt1 = new HTMLOptionElement();
    const opt2 = new HTMLOptionElement();
    select.appendChild(opt1);
    select.appendChild(opt2);

    select.remove(0);
    expect(select.length).toBe(1);
  });

  it('remove() adjusts selectedIndex when removing before it', () => {
    const select = new HTMLSelectElement();
    const opt1 = new HTMLOptionElement();
    opt1.value = 'a';
    const opt2 = new HTMLOptionElement();
    opt2.value = 'b';
    const opt3 = new HTMLOptionElement();
    opt3.value = 'c';
    select.appendChild(opt1);
    select.appendChild(opt2);
    select.appendChild(opt3);

    select.selectedIndex = 2;
    select.remove(0);
    expect(select.selectedIndex).toBe(1);
  });

  it('remove() resets selectedIndex when removing selected', () => {
    const select = new HTMLSelectElement();
    const opt1 = new HTMLOptionElement();
    const opt2 = new HTMLOptionElement();
    select.appendChild(opt1);
    select.appendChild(opt2);

    select.selectedIndex = 0;
    select.remove(0);
    expect(select.selectedIndex).toBe(-1);
  });

  it('checkValidity returns false when required and nothing selected', () => {
    const select = new HTMLSelectElement();
    select.required = true;
    expect(select.checkValidity()).toBe(false);
  });

  it('checkValidity returns true when required and something selected', () => {
    const select = new HTMLSelectElement();
    select.required = true;
    const opt = new HTMLOptionElement();
    select.appendChild(opt);
    select.selectedIndex = 0;
    expect(select.checkValidity()).toBe(true);
  });

  it('checkValidity returns true when not required', () => {
    const select = new HTMLSelectElement();
    expect(select.checkValidity()).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// HTMLTextAreaElement
// ═══════════════════════════════════════════════════════════════════
describe('HTMLTextAreaElement', () => {
  it('has tagName TEXTAREA', () => {
    const ta = new HTMLTextAreaElement();
    expect(ta.tagName).toBe('TEXTAREA');
  });

  it('value is internal state', () => {
    const ta = new HTMLTextAreaElement();
    ta.value = 'some text';
    expect(ta.value).toBe('some text');
    // Not reflected in textContent
    expect(ta.textContent).toBe('');
  });

  it('defaultValue maps to textContent', () => {
    const ta = new HTMLTextAreaElement();
    ta.defaultValue = 'default text';
    expect(ta.defaultValue).toBe('default text');
    expect(ta.textContent).toBe('default text');
    // Internal value is independent
    expect(ta.value).toBe('');
  });

  it('name getter/setter', () => {
    const ta = new HTMLTextAreaElement();
    expect(ta.name).toBe('');
    ta.name = 'bio';
    expect(ta.name).toBe('bio');
  });

  it('disabled boolean attribute', () => {
    const ta = new HTMLTextAreaElement();
    expect(ta.disabled).toBe(false);
    ta.disabled = true;
    expect(ta.disabled).toBe(true);
    ta.disabled = false;
    expect(ta.disabled).toBe(false);
  });

  it('readOnly boolean attribute', () => {
    const ta = new HTMLTextAreaElement();
    expect(ta.readOnly).toBe(false);
    ta.readOnly = true;
    expect(ta.readOnly).toBe(true);
  });

  it('required boolean attribute', () => {
    const ta = new HTMLTextAreaElement();
    expect(ta.required).toBe(false);
    ta.required = true;
    expect(ta.required).toBe(true);
  });

  it('placeholder getter/setter', () => {
    const ta = new HTMLTextAreaElement();
    expect(ta.placeholder).toBe('');
    ta.placeholder = 'Type here...';
    expect(ta.placeholder).toBe('Type here...');
  });

  it('rows defaults to 2', () => {
    const ta = new HTMLTextAreaElement();
    expect(ta.rows).toBe(2);
  });

  it('rows getter/setter', () => {
    const ta = new HTMLTextAreaElement();
    ta.rows = 10;
    expect(ta.rows).toBe(10);
    expect(ta.getAttribute('rows')).toBe('10');
  });

  it('cols defaults to 20', () => {
    const ta = new HTMLTextAreaElement();
    expect(ta.cols).toBe(20);
  });

  it('cols getter/setter', () => {
    const ta = new HTMLTextAreaElement();
    ta.cols = 80;
    expect(ta.cols).toBe(80);
  });

  it('maxLength / minLength default to -1', () => {
    const ta = new HTMLTextAreaElement();
    expect(ta.maxLength).toBe(-1);
    expect(ta.minLength).toBe(-1);
  });

  it('maxLength / minLength getter/setter', () => {
    const ta = new HTMLTextAreaElement();
    ta.maxLength = 500;
    ta.minLength = 10;
    expect(ta.maxLength).toBe(500);
    expect(ta.minLength).toBe(10);
  });

  it('form returns parent form', () => {
    const form = new HTMLFormElement();
    const ta = new HTMLTextAreaElement();
    form.appendChild(ta);
    expect(ta.form).toBe(form);
  });

  it('form returns null when not inside form', () => {
    const ta = new HTMLTextAreaElement();
    expect(ta.form).toBeNull();
  });

  it('select / focus / blur are no-ops', () => {
    const ta = new HTMLTextAreaElement();
    expect(() => ta.select()).not.toThrow();
    expect(() => ta.focus()).not.toThrow();
    expect(() => ta.blur()).not.toThrow();
  });

  it('checkValidity returns false when required and empty', () => {
    const ta = new HTMLTextAreaElement();
    ta.required = true;
    expect(ta.checkValidity()).toBe(false);
  });

  it('checkValidity returns true when required and has value', () => {
    const ta = new HTMLTextAreaElement();
    ta.required = true;
    ta.value = 'content';
    expect(ta.checkValidity()).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// HTMLFormElement
// ═══════════════════════════════════════════════════════════════════
describe('HTMLFormElement', () => {
  it('has tagName FORM', () => {
    const form = new HTMLFormElement();
    expect(form.tagName).toBe('FORM');
  });

  it('elements returns collection of descendant form controls', () => {
    const form = new HTMLFormElement();
    const input = new HTMLInputElement();
    const select = new HTMLSelectElement();
    const textarea = new HTMLTextAreaElement();
    const button = new HTMLButtonElement();
    form.appendChild(input);
    form.appendChild(select);
    form.appendChild(textarea);
    form.appendChild(button);

    expect(form.elements.length).toBe(4);
  });

  it('elements includes nested form controls', () => {
    const form = new HTMLFormElement();
    const div = new Element('div');
    const input = new HTMLInputElement();
    form.appendChild(div);
    div.appendChild(input);

    expect(form.elements.length).toBe(1);
  });

  it('length is alias for elements.length', () => {
    const form = new HTMLFormElement();
    form.appendChild(new HTMLInputElement());
    form.appendChild(new HTMLInputElement());
    expect(form.length).toBe(2);
  });

  it('action getter/setter', () => {
    const form = new HTMLFormElement();
    expect(form.action).toBe('');
    form.action = '/submit';
    expect(form.action).toBe('/submit');
    expect(form.getAttribute('action')).toBe('/submit');
  });

  it('method defaults to get', () => {
    const form = new HTMLFormElement();
    expect(form.method).toBe('get');
  });

  it('method getter/setter', () => {
    const form = new HTMLFormElement();
    form.method = 'post';
    expect(form.method).toBe('post');
  });

  it('enctype getter/setter', () => {
    const form = new HTMLFormElement();
    expect(form.enctype).toBe('');
    form.enctype = 'multipart/form-data';
    expect(form.enctype).toBe('multipart/form-data');
  });

  it('name getter/setter', () => {
    const form = new HTMLFormElement();
    expect(form.name).toBe('');
    form.name = 'loginForm';
    expect(form.name).toBe('loginForm');
  });

  it('submit() dispatches submit event', () => {
    const form = new HTMLFormElement();
    const handler = vi.fn();
    form.addEventListener('submit', handler);
    form.submit();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('reset() dispatches reset event', () => {
    const form = new HTMLFormElement();
    const handler = vi.fn();
    form.addEventListener('reset', handler);
    form.reset();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('reset() resets input value to defaultValue', () => {
    const form = new HTMLFormElement();
    const input = new HTMLInputElement();
    input.defaultValue = 'original';
    input.value = 'changed';
    form.appendChild(input);

    form.reset();
    expect(input.value).toBe('original');
  });

  it('reset() resets input checked to defaultChecked', () => {
    const form = new HTMLFormElement();
    const input = new HTMLInputElement();
    input.type = 'checkbox';
    input.defaultChecked = true;
    input.checked = false;
    form.appendChild(input);

    form.reset();
    expect(input.checked).toBe(true);
  });

  it('reset() resets textarea value to defaultValue', () => {
    const form = new HTMLFormElement();
    const ta = new HTMLTextAreaElement();
    ta.defaultValue = 'default text';
    ta.value = 'changed text';
    form.appendChild(ta);

    form.reset();
    expect(ta.value).toBe('default text');
  });

  it('reset() resets select selectedIndex to -1', () => {
    const form = new HTMLFormElement();
    const select = new HTMLSelectElement();
    const opt = new HTMLOptionElement();
    select.appendChild(opt);
    select.selectedIndex = 0;
    form.appendChild(select);

    form.reset();
    expect(select.selectedIndex).toBe(-1);
  });

  it('checkValidity returns true when all controls valid', () => {
    const form = new HTMLFormElement();
    const input = new HTMLInputElement();
    input.value = 'x';
    form.appendChild(input);
    expect(form.checkValidity()).toBe(true);
  });

  it('checkValidity returns false when any control is invalid', () => {
    const form = new HTMLFormElement();
    const input1 = new HTMLInputElement();
    input1.value = 'fine';
    const input2 = new HTMLInputElement();
    input2.required = true;
    // input2.value is '' (empty)
    form.appendChild(input1);
    form.appendChild(input2);
    expect(form.checkValidity()).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// HTMLButtonElement
// ═══════════════════════════════════════════════════════════════════
describe('HTMLButtonElement', () => {
  it('has tagName BUTTON', () => {
    const button = new HTMLButtonElement();
    expect(button.tagName).toBe('BUTTON');
  });

  it('type defaults to submit', () => {
    const button = new HTMLButtonElement();
    expect(button.type).toBe('submit');
  });

  it('type getter/setter', () => {
    const button = new HTMLButtonElement();
    button.type = 'button';
    expect(button.type).toBe('button');
    expect(button.getAttribute('type')).toBe('button');
  });

  it('value getter/setter', () => {
    const button = new HTMLButtonElement();
    expect(button.value).toBe('');
    button.value = 'submit_value';
    expect(button.value).toBe('submit_value');
  });

  it('name getter/setter', () => {
    const button = new HTMLButtonElement();
    expect(button.name).toBe('');
    button.name = 'action';
    expect(button.name).toBe('action');
  });

  it('disabled boolean attribute', () => {
    const button = new HTMLButtonElement();
    expect(button.disabled).toBe(false);
    button.disabled = true;
    expect(button.disabled).toBe(true);
    button.disabled = false;
    expect(button.disabled).toBe(false);
  });

  it('form returns parent form', () => {
    const form = new HTMLFormElement();
    const button = new HTMLButtonElement();
    form.appendChild(button);
    expect(button.form).toBe(form);
  });

  it('form returns null when not inside form', () => {
    const button = new HTMLButtonElement();
    expect(button.form).toBeNull();
  });

  it('click() dispatches click event', () => {
    const button = new HTMLButtonElement();
    const handler = vi.fn();
    button.addEventListener('click', handler);
    button.click();
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// HTMLLabelElement
// ═══════════════════════════════════════════════════════════════════
describe('HTMLLabelElement', () => {
  it('has tagName LABEL', () => {
    const label = new HTMLLabelElement();
    expect(label.tagName).toBe('LABEL');
  });

  it('htmlFor getter/setter maps to for attribute', () => {
    const label = new HTMLLabelElement();
    expect(label.htmlFor).toBe('');
    label.htmlFor = 'email-input';
    expect(label.htmlFor).toBe('email-input');
    expect(label.getAttribute('for')).toBe('email-input');
  });

  it('control returns null when htmlFor is empty', () => {
    const label = new HTMLLabelElement();
    expect(label.control).toBeNull();
  });

  it('control finds element by ID in same document', () => {
    const doc = new Document();
    const label = new HTMLLabelElement();
    label.ownerDocument = doc;
    label.htmlFor = 'my-input';

    const input = new HTMLInputElement();
    input.id = 'my-input';
    input.ownerDocument = doc;

    doc.body.appendChild(label);
    doc.body.appendChild(input);

    expect(label.control).toBe(input);
  });

  it('control returns null when no matching ID', () => {
    const doc = new Document();
    const label = new HTMLLabelElement();
    label.ownerDocument = doc;
    label.htmlFor = 'nonexistent';
    doc.body.appendChild(label);

    expect(label.control).toBeNull();
  });

  it('form returns parent form', () => {
    const form = new HTMLFormElement();
    const label = new HTMLLabelElement();
    form.appendChild(label);
    expect(label.form).toBe(form);
  });

  it('form returns null when not inside form', () => {
    const label = new HTMLLabelElement();
    expect(label.form).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// Integration tests: form + controls together
// ═══════════════════════════════════════════════════════════════════
describe('Form integration', () => {
  it('form.elements includes all control types', () => {
    const form = new HTMLFormElement();
    form.appendChild(new HTMLInputElement());
    form.appendChild(new HTMLSelectElement());
    form.appendChild(new HTMLTextAreaElement());
    form.appendChild(new HTMLButtonElement());

    expect(form.elements.length).toBe(4);
    expect(form.length).toBe(4);
  });

  it('form.reset() resets multiple controls', () => {
    const form = new HTMLFormElement();

    const input = new HTMLInputElement();
    input.defaultValue = 'default_input';
    input.value = 'modified';

    const ta = new HTMLTextAreaElement();
    ta.defaultValue = 'default_ta';
    ta.value = 'modified_ta';

    const checkbox = new HTMLInputElement();
    checkbox.type = 'checkbox';
    checkbox.defaultChecked = true;
    checkbox.checked = false;

    form.appendChild(input);
    form.appendChild(ta);
    form.appendChild(checkbox);

    form.reset();

    expect(input.value).toBe('default_input');
    expect(ta.value).toBe('default_ta');
    expect(checkbox.checked).toBe(true);
  });

  it('select/option value synchronization', () => {
    const select = new HTMLSelectElement();
    const opt1 = new HTMLOptionElement();
    opt1.value = 'red';
    opt1.text = 'Red';
    const opt2 = new HTMLOptionElement();
    opt2.value = 'blue';
    opt2.text = 'Blue';
    const opt3 = new HTMLOptionElement();
    opt3.value = 'green';
    opt3.text = 'Green';

    select.appendChild(opt1);
    select.appendChild(opt2);
    select.appendChild(opt3);

    // Select by value
    select.value = 'blue';
    expect(select.selectedIndex).toBe(1);
    expect(select.value).toBe('blue');
    expect(opt2.selected).toBe(true);
    expect(opt1.selected).toBe(false);

    // Select by index
    select.selectedIndex = 2;
    expect(select.value).toBe('green');
    expect(opt3.selected).toBe(true);
    expect(opt2.selected).toBe(false);
  });

  it('form checkValidity with mixed required/optional fields', () => {
    const form = new HTMLFormElement();

    const requiredInput = new HTMLInputElement();
    requiredInput.required = true;

    const optionalInput = new HTMLInputElement();

    const requiredSelect = new HTMLSelectElement();
    requiredSelect.required = true;

    form.appendChild(requiredInput);
    form.appendChild(optionalInput);
    form.appendChild(requiredSelect);

    // Both required fields empty
    expect(form.checkValidity()).toBe(false);

    // Fill input but select still empty
    requiredInput.value = 'filled';
    expect(form.checkValidity()).toBe(false);

    // Select an option
    const opt = new HTMLOptionElement();
    requiredSelect.appendChild(opt);
    requiredSelect.selectedIndex = 0;
    expect(form.checkValidity()).toBe(true);
  });
});
