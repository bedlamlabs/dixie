export interface FormField {
  label?: string;
  type: string;
  value: string;
  required?: boolean;
  checked?: boolean;
}

export interface FormsResult {
  fields: FormField[];
}

function findLabel(doc: any, el: any): string | undefined {
  const id = el.getAttribute('id');
  if (id) {
    const label = doc.querySelector(`label[for="${id}"]`);
    if (label) return (label.textContent ?? '').trim();
  }
  const parent = el.closest?.('label');
  if (parent) {
    // Get label text excluding the input's own content
    const labelText = (parent.textContent ?? '').trim();
    return labelText || undefined;
  }
  return undefined;
}

export function collectForms(doc: any): FormsResult {
  const fields: FormField[] = [];

  const allFields = doc.querySelectorAll('input, select, textarea');
  for (const el of allFields) {
    const tag = el.tagName.toLowerCase();
    const field: FormField = {
      type: tag === 'input' ? (el.getAttribute('type') ?? 'text') : tag,
      value: '',
    };

    const label = findLabel(doc, el);
    if (label) field.label = label;

    if (tag === 'select') {
      field.type = 'select';
      // Get selected option value
      const selected = el.querySelector('option[selected]');
      field.value = selected?.getAttribute('value') ?? el.value ?? '';
    } else if (tag === 'textarea') {
      field.type = 'textarea';
      field.value = el.value ?? (el.textContent ?? '').trim();
    } else {
      field.value = el.value ?? el.getAttribute('value') ?? '';
    }

    if (el.hasAttribute('required')) {
      field.required = true;
    }

    if (field.type === 'checkbox') {
      field.checked = el.hasAttribute('checked') || el.checked === true;
    }

    fields.push(field);
  }

  return { fields };
}
