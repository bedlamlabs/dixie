/**
 * DOMTokenList — a live set of space-separated tokens (e.g. classList).
 *
 * Backed by an Element's attribute. Changes to the DOMTokenList
 * are immediately reflected in the attribute, and changes to the
 * attribute are immediately reflected in the DOMTokenList.
 */
export class DOMTokenList {
  private _getAttr: () => string;
  private _setAttr: (value: string) => void;

  constructor(getAttr: () => string, setAttr: (value: string) => void) {
    this._getAttr = getAttr;
    this._setAttr = setAttr;
  }

  private _tokens(): string[] {
    const raw = this._getAttr();
    if (!raw) return [];
    return raw.split(/\s+/).filter(t => t.length > 0);
  }

  private _persist(tokens: string[]): void {
    this._setAttr(tokens.join(' '));
  }

  get length(): number {
    return this._tokens().length;
  }

  get value(): string {
    return this._getAttr();
  }

  set value(val: string) {
    this._setAttr(val);
  }

  item(index: number): string | null {
    return this._tokens()[index] ?? null;
  }

  contains(token: string): boolean {
    return this._tokens().includes(token);
  }

  add(...tokens: string[]): void {
    const current = this._tokens();
    for (const token of tokens) {
      if (token === '') throw new DOMException("The token provided must not be empty.", 'SyntaxError');
      if (token.includes(' ')) throw new DOMException("The token provided contains HTML space characters, which are not valid in tokens.", 'InvalidCharacterError');
      if (!current.includes(token)) {
        current.push(token);
      }
    }
    this._persist(current);
  }

  remove(...tokens: string[]): void {
    const current = this._tokens();
    const result = current.filter(t => !tokens.includes(t));
    this._persist(result);
  }

  toggle(token: string, force?: boolean): boolean {
    if (force !== undefined) {
      if (force) {
        this.add(token);
        return true;
      } else {
        this.remove(token);
        return false;
      }
    }
    if (this.contains(token)) {
      this.remove(token);
      return false;
    } else {
      this.add(token);
      return true;
    }
  }

  replace(oldToken: string, newToken: string): boolean {
    const tokens = this._tokens();
    const idx = tokens.indexOf(oldToken);
    if (idx === -1) return false;
    // If newToken already exists, just remove oldToken
    if (tokens.includes(newToken)) {
      tokens.splice(idx, 1);
    } else {
      tokens[idx] = newToken;
    }
    this._persist(tokens);
    return true;
  }

  forEach(callback: (value: string, index: number, list: DOMTokenList) => void, thisArg?: any): void {
    const tokens = this._tokens();
    for (let i = 0; i < tokens.length; i++) {
      callback.call(thisArg, tokens[i], i, this);
    }
  }

  *[Symbol.iterator](): IterableIterator<string> {
    const tokens = this._tokens();
    for (const token of tokens) {
      yield token;
    }
  }

  toString(): string {
    return this._getAttr();
  }
}
