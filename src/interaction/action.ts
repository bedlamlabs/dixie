import { click } from './click';
import { type } from './type';
import { select } from './select';
import { MutationObserver, flushMutations } from '../observers/MutationObserver';

export interface ActionResult {
  success: boolean;
  mutations: any[];
  networkCalls: any[];
  errors: string[];
  duration: number;
}

export async function action(
  doc: any,
  actionType: string,
  selector: string,
  options?: { text?: string; value?: string },
): Promise<ActionResult> {
  const start = Date.now();
  const errors: string[] = [];
  const mutations: any[] = [];

  // Check element exists
  const el = doc.querySelector(selector);
  if (!el) {
    return {
      success: false,
      mutations: [],
      networkCalls: [],
      errors: [`Element not found: ${selector}`],
      duration: Date.now() - start,
    };
  }

  // Set up mutation observer
  let observer: MutationObserver | undefined;
  try {
    observer = new MutationObserver((records: any[]) => {
      mutations.push(...records);
    });
    const observeTarget = doc.body ?? doc;
    observer.observe(observeTarget, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
  } catch {
    // No observer available
  }

  try {
    switch (actionType) {
      case 'click':
        click(doc, selector);
        break;
      case 'type':
        if (!options?.text) {
          errors.push('type action requires options.text');
          break;
        }
        type(doc, selector, options.text);
        break;
      case 'select':
        if (!options?.value) {
          errors.push('select action requires options.value');
          break;
        }
        select(doc, selector, options.value);
        break;
      default:
        errors.push(`Unknown action type: ${actionType}`);
    }
  } catch (err: any) {
    errors.push(err.message);
  }

  // Flush mutations synchronously
  try {
    flushMutations();
  } catch {
    // No flush available
  }

  observer?.disconnect();

  return {
    success: errors.length === 0,
    mutations,
    networkCalls: [],
    errors,
    duration: Date.now() - start,
  };
}
