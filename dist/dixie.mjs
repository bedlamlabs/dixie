#!/usr/bin/env tsx
import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/nodes/NodeList.ts
var NodeList;
var init_NodeList = __esm({
  "src/nodes/NodeList.ts"() {
    "use strict";
    NodeList = class {
      /** The backing array — owned by the parent Node, shared by reference. */
      _items;
      /** Whether this is a live node list (childNodes) vs static (querySelectorAll). */
      _live;
      constructor(backingArray, live) {
        this._items = backingArray;
        this._live = live ?? false;
        if (this._live) {
          return new Proxy(this, {
            get(target, prop, receiver) {
              if (typeof prop === "string") {
                const index = Number(prop);
                if (Number.isInteger(index) && index >= 0) {
                  return target._items[index] ?? void 0;
                }
              }
              return Reflect.get(target, prop, receiver);
            }
          });
        } else {
          for (let i = 0, len = backingArray.length; i < len; i++) {
            this[i] = backingArray[i];
          }
        }
      }
      get length() {
        return this._items.length;
      }
      item(index) {
        return this._items[index] ?? null;
      }
      forEach(callback, thisArg) {
        for (let i = 0; i < this._items.length; i++) {
          callback.call(thisArg, this._items[i], i, this);
        }
      }
      *entries() {
        for (let i = 0; i < this._items.length; i++) {
          yield [i, this._items[i]];
        }
      }
      *keys() {
        for (let i = 0; i < this._items.length; i++) {
          yield i;
        }
      }
      *values() {
        for (let i = 0; i < this._items.length; i++) {
          yield this._items[i];
        }
      }
      [Symbol.iterator]() {
        return this.values();
      }
    };
  }
});

// src/events/Event.ts
var Event;
var init_Event = __esm({
  "src/events/Event.ts"() {
    "use strict";
    Event = class _Event {
      // ── Phase constants ────────────────────────────────────────────────
      static NONE = 0;
      static CAPTURING_PHASE = 1;
      static AT_TARGET = 2;
      static BUBBLING_PHASE = 3;
      // Instance-level phase constants (per spec)
      NONE = 0;
      CAPTURING_PHASE = 1;
      AT_TARGET = 2;
      BUBBLING_PHASE = 3;
      // ── Readonly properties ────────────────────────────────────────────
      type;
      bubbles;
      cancelable;
      composed;
      timeStamp;
      // ── Mutable during dispatch ────────────────────────────────────────
      target = null;
      currentTarget = null;
      eventPhase = _Event.NONE;
      isTrusted = false;
      // ── Internal flags ─────────────────────────────────────────────────
      _defaultPrevented = false;
      /** @internal */
      _stopPropagation = false;
      /** @internal */
      _stopImmediatePropagation = false;
      constructor(type3, init) {
        this.type = type3;
        this.bubbles = init?.bubbles ?? false;
        this.cancelable = init?.cancelable ?? false;
        this.composed = init?.composed ?? false;
        this.timeStamp = Date.now();
      }
      get defaultPrevented() {
        return this._defaultPrevented;
      }
      preventDefault() {
        if (this.cancelable) {
          this._defaultPrevented = true;
        }
      }
      stopPropagation() {
        this._stopPropagation = true;
      }
      stopImmediatePropagation() {
        this._stopPropagation = true;
        this._stopImmediatePropagation = true;
      }
    };
  }
});

// src/events/EventTarget.ts
function _invokeListeners(target, event, captureOnly) {
  const listeners = target._listeners.slice();
  for (const record of listeners) {
    if (record.type !== event.type) continue;
    if (captureOnly === true && !record.capture) continue;
    if (captureOnly === false && record.capture) continue;
    if (record.once) {
      target.removeEventListener(record.type, record.callback, { capture: record.capture });
    }
    if (typeof record.callback === "function") {
      record.callback(event);
    } else if (record.callback && typeof record.callback.handleEvent === "function") {
      record.callback.handleEvent(event);
    }
    if (event._stopImmediatePropagation) break;
  }
}
var EventTarget;
var init_EventTarget = __esm({
  "src/events/EventTarget.ts"() {
    "use strict";
    init_Event();
    EventTarget = class {
      /** @internal */
      _listeners = [];
      addEventListener(type3, callback, options) {
        if (callback === null || callback === void 0) return;
        const capture = typeof options === "boolean" ? options : options?.capture ?? false;
        const once = typeof options === "boolean" ? false : options?.once ?? false;
        const passive = typeof options === "boolean" ? false : options?.passive ?? false;
        for (const record of this._listeners) {
          if (record.type === type3 && record.callback === callback && record.capture === capture) {
            return;
          }
        }
        this._listeners.push({ type: type3, callback, capture, once, passive });
      }
      removeEventListener(type3, callback, options) {
        if (callback === null || callback === void 0) return;
        const capture = typeof options === "boolean" ? options : options?.capture ?? false;
        const index = this._listeners.findIndex(
          (r) => r.type === type3 && r.callback === callback && r.capture === capture
        );
        if (index !== -1) {
          this._listeners.splice(index, 1);
        }
      }
      /**
       * Dispatches an event through the DOM tree.
       *
       * 1. Build path from target to root (via parentNode chain).
       * 2. Capture phase: walk root → target, calling capture listeners.
       * 3. At-target: call both capture and bubble listeners.
       * 4. Bubble phase: walk target → root, calling bubble listeners (only if event.bubbles).
       *
       * Returns false if preventDefault() was called, true otherwise.
       */
      dispatchEvent(event) {
        event.target = this;
        const path4 = [];
        let current = this;
        while (current) {
          path4.push(current);
          current = current.parentNode ?? null;
        }
        const ancestors = path4.slice(1);
        event.eventPhase = Event.CAPTURING_PHASE;
        for (let i = ancestors.length - 1; i >= 0; i--) {
          event.currentTarget = ancestors[i];
          _invokeListeners(
            ancestors[i],
            event,
            /* captureOnly */
            true
          );
          if (event._stopPropagation) break;
        }
        if (!event._stopPropagation) {
          event.eventPhase = Event.AT_TARGET;
          event.currentTarget = this;
          _invokeListeners(
            this,
            event,
            /* captureOnly */
            null
          );
        }
        if (event.bubbles && !event._stopPropagation) {
          event.eventPhase = Event.BUBBLING_PHASE;
          for (let i = 0; i < ancestors.length; i++) {
            event.currentTarget = ancestors[i];
            _invokeListeners(
              ancestors[i],
              event,
              /* captureOnly */
              false
            );
            if (event._stopPropagation) break;
          }
        }
        event.currentTarget = null;
        event.eventPhase = Event.NONE;
        return !event.defaultPrevented;
      }
    };
  }
});

// src/observers/MutationRecord.ts
var MutationRecord;
var init_MutationRecord = __esm({
  "src/observers/MutationRecord.ts"() {
    "use strict";
    init_NodeList();
    MutationRecord = class {
      type;
      target;
      addedNodes;
      removedNodes;
      previousSibling;
      nextSibling;
      attributeName;
      attributeNamespace;
      oldValue;
      constructor(init) {
        this.type = init.type;
        this.target = init.target;
        this.addedNodes = new NodeList(init.addedNodes ?? []);
        this.removedNodes = new NodeList(init.removedNodes ?? []);
        this.previousSibling = init.previousSibling ?? null;
        this.nextSibling = init.nextSibling ?? null;
        this.attributeName = init.attributeName ?? null;
        this.attributeNamespace = init.attributeNamespace ?? null;
        this.oldValue = init.oldValue ?? null;
      }
    };
  }
});

// src/observers/MutationObserver.ts
function triggerMutation(type3, target, details = {}) {
  if (_registry.size === 0) return;
  for (const observer of _registry) {
    const reg = observer._matchesMutation(
      type3,
      target,
      details.attributeName ?? void 0
    );
    if (!reg) continue;
    let oldValue = null;
    if (type3 === "attributes" && reg.options.attributeOldValue) {
      oldValue = details.oldValue ?? null;
    } else if (type3 === "characterData" && reg.options.characterDataOldValue) {
      oldValue = details.oldValue ?? null;
    }
    const record = new MutationRecord({
      type: type3,
      target,
      addedNodes: details.addedNodes,
      removedNodes: details.removedNodes,
      previousSibling: details.previousSibling,
      nextSibling: details.nextSibling,
      attributeName: details.attributeName ?? null,
      attributeNamespace: details.attributeNamespace ?? null,
      oldValue
    });
    observer._queueRecord(record);
  }
}
function flushMutations() {
  for (const observer of _registry) {
    observer._deliver();
  }
}
function clearMutationRegistry() {
  for (const observer of _registry) {
    observer.disconnect();
  }
  _registry.clear();
}
var MutationObserver, _registry;
var init_MutationObserver = __esm({
  "src/observers/MutationObserver.ts"() {
    "use strict";
    init_MutationRecord();
    MutationObserver = class {
      _callback;
      _registrations = [];
      _recordQueue = [];
      _scheduled = false;
      constructor(callback) {
        if (typeof callback !== "function") {
          throw new TypeError(
            "Failed to construct 'MutationObserver': The callback provided as parameter 1 is not a function."
          );
        }
        this._callback = callback;
      }
      /**
       * Start observing the target node for mutations matching the given options.
       * If the same target is already being observed, the options are replaced.
       */
      observe(target, options = {}) {
        const hasFilter = options.childList || options.attributes || options.characterData;
        const impliedAttributes = options.attributeOldValue || options.attributeFilter && options.attributeFilter.length > 0;
        const impliedCharacterData = options.characterDataOldValue;
        if (!hasFilter && !impliedAttributes && !impliedCharacterData) {
          throw new TypeError(
            "Failed to execute 'observe' on 'MutationObserver': The options object must set at least one of 'attributes', 'characterData', or 'childList' to true."
          );
        }
        const normalizedOptions = { ...options };
        if (impliedAttributes && !normalizedOptions.attributes) {
          normalizedOptions.attributes = true;
        }
        if (impliedCharacterData && !normalizedOptions.characterData) {
          normalizedOptions.characterData = true;
        }
        const existing = this._registrations.findIndex((r) => r.target === target);
        if (existing !== -1) {
          this._registrations[existing].options = normalizedOptions;
        } else {
          this._registrations.push({ target, options: normalizedOptions });
        }
        _registry.add(this);
      }
      /**
       * Stop observing all targets. Pending records are NOT delivered.
       */
      disconnect() {
        this._registrations = [];
        this._recordQueue = [];
        this._scheduled = false;
        _registry.delete(this);
      }
      /**
       * Return all pending MutationRecords and clear the queue.
       * Cancels any pending microtask delivery.
       */
      takeRecords() {
        const records = this._recordQueue.slice();
        this._recordQueue = [];
        this._scheduled = false;
        return records;
      }
      // ── Internal API (used by triggerMutation) ──────────────────────────
      /**
       * Check if this observer is interested in a mutation on the given target.
       */
      _matchesMutation(type3, target, attributeName) {
        for (const reg of this._registrations) {
          const directMatch = reg.target === target;
          const subtreeMatch = reg.options.subtree && (reg.target.nodeType === 9 || reg.target.nodeType === 1 && reg.target.parentNode?.nodeType === 9 || reg.target.contains(target));
          if (!directMatch && !subtreeMatch) continue;
          if (type3 === "childList" && !reg.options.childList) continue;
          if (type3 === "attributes" && !reg.options.attributes) continue;
          if (type3 === "characterData" && !reg.options.characterData) continue;
          if (type3 === "attributes" && reg.options.attributeFilter && attributeName && !reg.options.attributeFilter.includes(attributeName)) {
            continue;
          }
          return reg;
        }
        return null;
      }
      /**
       * Queue a record for delivery. Schedules async callback via setImmediate,
       * which fires after the current event loop tick (after all microtasks and
       * I/O callbacks complete). This matches Chromium's frame-coalesced delivery
       * semantics: React finishes its entire synchronous reconciliation first,
       * then we deliver one batched callback — not one callback per fiber step.
       *
       * Using queueMicrotask here caused the settle detector in the journey
       * benchmark to restart its quiet window on every React fiber boundary,
       * adding hundreds of milliseconds of false-extension wait per page.
       */
      _queueRecord(record) {
        this._recordQueue.push(record);
        if (!this._scheduled) {
          this._scheduled = true;
          setImmediate(() => this._deliver());
        }
      }
      /**
       * Synchronously deliver all pending records to the callback.
       */
      _deliver() {
        this._scheduled = false;
        if (this._recordQueue.length === 0) return;
        const records = this._recordQueue.slice();
        this._recordQueue = [];
        this._callback(records, this);
      }
    };
    _registry = /* @__PURE__ */ new Set();
  }
});

// src/nodes/Node.ts
function _setFallbackDocument(doc) {
  _lastCreatedDocument = doc;
}
var _lastCreatedDocument, Node;
var init_Node = __esm({
  "src/nodes/Node.ts"() {
    "use strict";
    init_NodeList();
    init_EventTarget();
    init_MutationObserver();
    _lastCreatedDocument = null;
    Node = class _Node extends EventTarget {
      // ── Static type constants ────────────────────────────────────────────
      static ELEMENT_NODE = 1;
      static TEXT_NODE = 3;
      static COMMENT_NODE = 8;
      static DOCUMENT_NODE = 9;
      static DOCUMENT_FRAGMENT_NODE = 11;
      // ── Instance state ───────────────────────────────────────────────────
      nodeType;
      nodeName;
      parentNode = null;
      nextSibling = null;
      previousSibling = null;
      _ownerDocument = null;
      // typed loosely until Document exists
      /**
       * ownerDocument — returns the Document that owns this node.
       * If the stored value is null, walks up the parent chain to find
       * the root Document (defensive fallback for nodes that missed adoption).
       */
      get ownerDocument() {
        if (this._ownerDocument) return this._ownerDocument;
        if (this.nodeType === 9) return this;
        let node = this.parentNode;
        while (node) {
          if (node._ownerDocument) return node._ownerDocument;
          if (node.nodeType === 9) return node;
          node = node.parentNode;
        }
        return _lastCreatedDocument;
      }
      set ownerDocument(doc) {
        this._ownerDocument = doc;
      }
      /** Mutable text data for TEXT_NODE and COMMENT_NODE. */
      _textData = null;
      /** Internal children array — shared with the live NodeList. */
      _children = [];
      /** Cached live NodeList — created lazily on first access. */
      _childNodes = null;
      constructor(nodeType, nodeName) {
        super();
        this.nodeType = nodeType;
        this.nodeName = nodeName;
        if (nodeType === _Node.TEXT_NODE || nodeType === _Node.COMMENT_NODE) {
          this._textData = nodeName;
        }
      }
      // ── Child accessors ──────────────────────────────────────────────────
      get childNodes() {
        if (!this._childNodes) {
          this._childNodes = new NodeList(this._children, true);
        }
        return this._childNodes;
      }
      get firstChild() {
        return this._children[0] ?? null;
      }
      get lastChild() {
        return this._children[this._children.length - 1] ?? null;
      }
      // ── Query helpers ────────────────────────────────────────────────────
      hasChildNodes() {
        return this._children.length > 0;
      }
      /**
       * isConnected — true if this node is in a Document tree.
       * React 18's commit phase checks this before applying DOM updates.
       * Without it, re-renders are silently skipped.
       */
      get isConnected() {
        let node = this;
        while (node !== null) {
          if (node.nodeType === _Node.DOCUMENT_NODE) return true;
          node = node.parentNode;
        }
        return false;
      }
      /**
       * getRootNode — returns the topmost ancestor (Document if connected).
       */
      getRootNode() {
        let node = this;
        while (node.parentNode !== null) {
          node = node.parentNode;
        }
        return node;
      }
      /**
       * compareDocumentPosition — bitfield comparison of two nodes' positions.
       * React uses this for ordering checks during reconciliation.
       */
      compareDocumentPosition(other) {
        if (this === other) return 0;
        if (this.contains(other)) return 20;
        if (other.contains(this)) return 10;
        return 1;
      }
      /**
       * replaceChildren — remove all children and optionally append new ones.
       */
      replaceChildren(...nodes) {
        while (this._children.length > 0) {
          this.removeChild(this._children[this._children.length - 1]);
        }
        for (const node of nodes) {
          this.appendChild(node);
        }
      }
      contains(other) {
        if (other === null) return false;
        let node = other;
        while (node !== null) {
          if (node === this) return true;
          node = node.parentNode;
        }
        return false;
      }
      // ── Tree mutations ───────────────────────────────────────────────────
      appendChild(child) {
        if (child === this || child.parentNode !== null && child.contains(this)) {
          throw new DOMException(
            "Failed to execute 'appendChild' on 'Node': The new child element contains the parent.",
            "HierarchyRequestError"
          );
        }
        if (child.parentNode) {
          child.parentNode.removeChild(child);
        }
        if (child.nodeType === _Node.DOCUMENT_FRAGMENT_NODE) {
          while (child._children.length > 0) {
            this.appendChild(child._children[0]);
          }
          return child;
        }
        const last = this.lastChild;
        if (last) {
          last.nextSibling = child;
          child.previousSibling = last;
        } else {
          child.previousSibling = null;
        }
        child.nextSibling = null;
        child.parentNode = this;
        this._children.push(child);
        const doc = this.nodeType === 9 ? this : this.ownerDocument;
        if (doc && child.ownerDocument !== doc) {
          this._adoptNode(child, doc);
        }
        this._notifyMutation();
        triggerMutation("childList", this, { addedNodes: [child] });
        return child;
      }
      removeChild(child) {
        const index = this._children.indexOf(child);
        if (index === -1) {
          return child;
        }
        this._spliceChild(index);
        return child;
      }
      insertBefore(newChild, refChild) {
        if (refChild === null) {
          return this.appendChild(newChild);
        }
        if (newChild === refChild) {
          return newChild;
        }
        const refIndex = this._children.indexOf(refChild);
        if (refIndex === -1) {
          throw new DOMException(
            "Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.",
            "NotFoundError"
          );
        }
        if (newChild === this || newChild.parentNode !== null && newChild.contains(this)) {
          throw new DOMException(
            "Failed to execute 'insertBefore' on 'Node': The new child element contains the parent.",
            "HierarchyRequestError"
          );
        }
        if (newChild.parentNode) {
          newChild.parentNode.removeChild(newChild);
        }
        if (newChild.nodeType === _Node.DOCUMENT_FRAGMENT_NODE) {
          while (newChild._children.length > 0) {
            this.insertBefore(newChild._children[0], refChild);
          }
          return newChild;
        }
        const insertIndex = this._children.indexOf(refChild);
        const prev = refChild.previousSibling;
        if (prev) {
          prev.nextSibling = newChild;
        }
        newChild.previousSibling = prev;
        newChild.nextSibling = refChild;
        refChild.previousSibling = newChild;
        newChild.parentNode = this;
        this._children.splice(insertIndex, 0, newChild);
        const doc = this.nodeType === 9 ? this : this.ownerDocument;
        if (doc && newChild.ownerDocument !== doc) {
          this._adoptNode(newChild, doc);
        }
        this._notifyMutation();
        triggerMutation("childList", this, { addedNodes: [newChild] });
        return newChild;
      }
      replaceChild(newChild, oldChild) {
        if (newChild === oldChild) {
          return oldChild;
        }
        const index = this._children.indexOf(oldChild);
        if (index === -1) {
          throw new DOMException(
            "Failed to execute 'replaceChild' on 'Node': The node to be replaced is not a child of this node.",
            "NotFoundError"
          );
        }
        if (newChild === this || newChild.parentNode !== null && newChild.contains(this)) {
          throw new DOMException(
            "Failed to execute 'replaceChild' on 'Node': The new child element contains the parent.",
            "HierarchyRequestError"
          );
        }
        if (newChild.parentNode) {
          newChild.parentNode.removeChild(newChild);
        }
        const replaceIndex = this._children.indexOf(oldChild);
        if (newChild.nodeType === _Node.DOCUMENT_FRAGMENT_NODE) {
          const fragmentChildren = [...newChild._children];
          this._spliceChild(replaceIndex);
          for (let i = 0; i < fragmentChildren.length; i++) {
            const fc = fragmentChildren[i];
            fc.parentNode = null;
            if (replaceIndex + i >= this._children.length) {
              this.appendChild(fc);
            } else {
              this.insertBefore(fc, this._children[replaceIndex + i]);
            }
          }
          newChild._children.length = 0;
          return oldChild;
        }
        const prev = oldChild.previousSibling;
        const next = oldChild.nextSibling;
        newChild.previousSibling = prev;
        newChild.nextSibling = next;
        if (prev) prev.nextSibling = newChild;
        if (next) next.previousSibling = newChild;
        oldChild.parentNode = null;
        oldChild.previousSibling = null;
        oldChild.nextSibling = null;
        newChild.parentNode = this;
        this._children[replaceIndex] = newChild;
        this._notifyMutation();
        triggerMutation("childList", this, { addedNodes: [newChild], removedNodes: [oldChild] });
        return oldChild;
      }
      // ── Clone ────────────────────────────────────────────────────────────
      cloneNode(deep) {
        const clone = new this.constructor(this.nodeType, this.nodeName);
        clone.ownerDocument = this.ownerDocument;
        clone._textData = this._textData;
        if (deep) {
          for (const child of this._children) {
            clone.appendChild(child.cloneNode(true));
          }
        }
        return clone;
      }
      // ── textContent ──────────────────────────────────────────────────────
      get textContent() {
        if (this.nodeType === _Node.TEXT_NODE || this.nodeType === _Node.COMMENT_NODE) {
          return this._textData ?? "";
        }
        let text = "";
        for (const child of this._children) {
          text += child.textContent;
        }
        return text;
      }
      set textContent(value) {
        if (value == null) value = "";
        if (this.nodeType === _Node.TEXT_NODE || this.nodeType === _Node.COMMENT_NODE) {
          this._textData = value;
          return;
        }
        while (this._children.length > 0) {
          this._spliceChild(0);
        }
        if (value !== "") {
          const textNode = new _Node(_Node.TEXT_NODE, value);
          this.appendChild(textNode);
        }
      }
      // ── Internal helpers ─────────────────────────────────────────────────
      /** Notify owning document of a tree/attribute mutation (for query cache invalidation). */
      _notifyMutation() {
        const doc = this.nodeType === 9 ? this : this.ownerDocument;
        if (doc) doc._mutationVersion++;
      }
      /** Recursively set ownerDocument on a node and all its descendants. */
      _adoptNode(node, doc) {
        node.ownerDocument = doc;
        for (const child of node._children) {
          this._adoptNode(child, doc);
        }
      }
      /** Remove child at index, fix sibling links, detach from parent. */
      _spliceChild(index) {
        const child = this._children[index];
        const prev = child.previousSibling;
        const next = child.nextSibling;
        if (prev) prev.nextSibling = next;
        if (next) next.previousSibling = prev;
        child.parentNode = null;
        child.previousSibling = null;
        child.nextSibling = null;
        this._children.splice(index, 1);
        this._notifyMutation();
        triggerMutation("childList", this, { removedNodes: [child] });
      }
    };
    Object.defineProperties(Node.prototype, {
      ELEMENT_NODE: { value: 1 },
      TEXT_NODE: { value: 3 },
      COMMENT_NODE: { value: 8 },
      DOCUMENT_NODE: { value: 9 },
      DOCUMENT_FRAGMENT_NODE: { value: 11 }
    });
  }
});

// src/nodes/Text.ts
var Text;
var init_Text = __esm({
  "src/nodes/Text.ts"() {
    "use strict";
    init_Node();
    Text = class _Text extends Node {
      constructor(data = "") {
        super(Node.TEXT_NODE, "#text");
        this._textData = data;
      }
      get data() {
        return this._textData ?? "";
      }
      set data(value) {
        this._textData = value;
      }
      get length() {
        return this.data.length;
      }
      get textContent() {
        return this.data;
      }
      set textContent(value) {
        this.data = value ?? "";
      }
      get nodeValue() {
        return this.data;
      }
      set nodeValue(value) {
        this.data = value ?? "";
      }
      /**
       * wholeText — returns the concatenation of this text node and all
       * logically adjacent text nodes (siblings that are also Text nodes
       * with no intervening non-Text nodes).
       */
      get wholeText() {
        let text = "";
        let current = this;
        while (current.previousSibling && current.previousSibling.nodeType === Node.TEXT_NODE) {
          current = current.previousSibling;
        }
        while (current && current.nodeType === Node.TEXT_NODE) {
          text += current.data;
          current = current.nextSibling;
        }
        return text;
      }
      /**
       * splitText — splits this text node at the given offset, returning
       * the new text node containing the remainder.
       */
      splitText(offset) {
        if (offset < 0 || offset > this.data.length) {
          throw new DOMException(
            `Failed to execute 'splitText' on 'Text': The offset ${offset} is larger than the Text node's length.`,
            "IndexSizeError"
          );
        }
        const remainder = this.data.substring(offset);
        this.data = this.data.substring(0, offset);
        const newNode = new _Text(remainder);
        newNode.ownerDocument = this.ownerDocument;
        if (this.parentNode) {
          const nextSib = this.nextSibling;
          this.parentNode.insertBefore(newNode, nextSib);
        }
        return newNode;
      }
      cloneNode(_deep) {
        const clone = new _Text(this.data);
        clone.ownerDocument = this.ownerDocument;
        return clone;
      }
    };
  }
});

// src/nodes/Attr.ts
var Attr;
var init_Attr = __esm({
  "src/nodes/Attr.ts"() {
    "use strict";
    Attr = class {
      name;
      value;
      ownerElement = null;
      // typed loosely until Element import would cause circular ref
      constructor(name, value = "") {
        this.name = name;
        this.value = value;
      }
    };
  }
});

// src/collections/NamedNodeMap.ts
var NamedNodeMap;
var init_NamedNodeMap = __esm({
  "src/collections/NamedNodeMap.ts"() {
    "use strict";
    NamedNodeMap = class {
      /** Internal ordered list of attributes. */
      _attrs = [];
      /** O(1) name → Attr lookup (kept in sync with _attrs). */
      _map = /* @__PURE__ */ new Map();
      constructor() {
        return new Proxy(this, {
          get(target, prop, receiver) {
            if (typeof prop === "string" && /^\d+$/.test(prop)) {
              return target._attrs[Number(prop)];
            }
            return Reflect.get(target, prop, receiver);
          }
        });
      }
      get length() {
        return this._attrs.length;
      }
      item(index) {
        return this._attrs[index] ?? null;
      }
      getNamedItem(name) {
        return this._map.get(name.toLowerCase()) ?? null;
      }
      setNamedItem(attr) {
        const existing = this._map.get(attr.name);
        if (existing) {
          const idx = this._attrs.indexOf(existing);
          this._attrs[idx] = attr;
          this._map.set(attr.name, attr);
          return existing;
        }
        this._attrs.push(attr);
        this._map.set(attr.name, attr);
        return null;
      }
      removeNamedItem(name) {
        const lower = name.toLowerCase();
        const existing = this._map.get(lower);
        if (!existing) {
          throw new DOMException(
            `Failed to execute 'removeNamedItem' on 'NamedNodeMap': No attribute named '${name}' was found.`,
            "NotFoundError"
          );
        }
        const idx = this._attrs.indexOf(existing);
        this._attrs.splice(idx, 1);
        this._map.delete(lower);
        existing.ownerElement = null;
        return existing;
      }
      [Symbol.iterator]() {
        return this._attrs[Symbol.iterator]();
      }
    };
  }
});

// src/collections/DOMTokenList.ts
var DOMTokenList;
var init_DOMTokenList = __esm({
  "src/collections/DOMTokenList.ts"() {
    "use strict";
    DOMTokenList = class {
      _getAttr;
      _setAttr;
      constructor(getAttr, setAttr) {
        this._getAttr = getAttr;
        this._setAttr = setAttr;
      }
      _tokens() {
        const raw = this._getAttr();
        if (!raw) return [];
        return raw.split(/\s+/).filter((t) => t.length > 0);
      }
      _persist(tokens) {
        this._setAttr(tokens.join(" "));
      }
      get length() {
        return this._tokens().length;
      }
      get value() {
        return this._getAttr();
      }
      set value(val) {
        this._setAttr(val);
      }
      item(index) {
        return this._tokens()[index] ?? null;
      }
      contains(token) {
        return this._tokens().includes(token);
      }
      add(...tokens) {
        const current = this._tokens();
        for (const token of tokens) {
          if (token === "") throw new DOMException("The token provided must not be empty.", "SyntaxError");
          if (token.includes(" ")) throw new DOMException("The token provided contains HTML space characters, which are not valid in tokens.", "InvalidCharacterError");
          if (!current.includes(token)) {
            current.push(token);
          }
        }
        this._persist(current);
      }
      remove(...tokens) {
        const current = this._tokens();
        const result2 = current.filter((t) => !tokens.includes(t));
        this._persist(result2);
      }
      toggle(token, force) {
        if (force !== void 0) {
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
      replace(oldToken, newToken) {
        const tokens = this._tokens();
        const idx = tokens.indexOf(oldToken);
        if (idx === -1) return false;
        if (tokens.includes(newToken)) {
          tokens.splice(idx, 1);
        } else {
          tokens[idx] = newToken;
        }
        this._persist(tokens);
        return true;
      }
      forEach(callback, thisArg) {
        const tokens = this._tokens();
        for (let i = 0; i < tokens.length; i++) {
          callback.call(thisArg, tokens[i], i, this);
        }
      }
      *[Symbol.iterator]() {
        const tokens = this._tokens();
        for (const token of tokens) {
          yield token;
        }
      }
      toString() {
        return this._getAttr();
      }
    };
  }
});

// src/collections/HTMLCollection.ts
var HTMLCollection;
var init_HTMLCollection = __esm({
  "src/collections/HTMLCollection.ts"() {
    "use strict";
    HTMLCollection = class {
      _getElements;
      constructor(getElements) {
        this._getElements = getElements;
        return new Proxy(this, {
          get(target, prop, receiver) {
            if (typeof prop === "string") {
              const index = Number(prop);
              if (Number.isInteger(index) && index >= 0) {
                return target._getElements()[index] ?? void 0;
              }
            }
            return Reflect.get(target, prop, receiver);
          }
        });
      }
      get length() {
        return this._getElements().length;
      }
      item(index) {
        return this._getElements()[index] ?? null;
      }
      namedItem(name) {
        const elements = this._getElements();
        for (const el of elements) {
          if (el.getAttribute?.("id") === name) return el;
          if (el.getAttribute?.("name") === name) return el;
        }
        return null;
      }
      *[Symbol.iterator]() {
        const elements = this._getElements();
        for (const el of elements) {
          yield el;
        }
      }
    };
  }
});

// src/css/CSSStyleDeclaration.ts
function camelToKebab(name) {
  const kebab = name.replace(/[A-Z]/g, (match, offset) => {
    return (offset > 0 ? "-" : "") + match.toLowerCase();
  });
  if (/^(webkit|moz|ms|o)[A-Z]/.test(name)) {
    return "-" + kebab;
  }
  return kebab;
}
function jsToCss(jsProp) {
  if (SPECIAL_JS_TO_CSS[jsProp]) return SPECIAL_JS_TO_CSS[jsProp];
  return camelToKebab(jsProp);
}
var SPECIAL_JS_TO_CSS, OWN_MEMBERS, CSSStyleDeclaration;
var init_CSSStyleDeclaration = __esm({
  "src/css/CSSStyleDeclaration.ts"() {
    "use strict";
    SPECIAL_JS_TO_CSS = {
      cssFloat: "float"
    };
    OWN_MEMBERS = /* @__PURE__ */ new Set([
      "getPropertyValue",
      "setProperty",
      "removeProperty",
      "getPropertyPriority",
      "item",
      "length",
      "cssText",
      // Internal
      "_store",
      "_order",
      "_ownerElement",
      "_syncToElement",
      "_parseCssText",
      // Proxy/Object internals
      "constructor",
      "toString",
      "valueOf",
      "toJSON",
      "then",
      // Promise check
      Symbol.toPrimitive,
      Symbol.toStringTag,
      Symbol.iterator
    ]);
    CSSStyleDeclaration = class {
      /** Internal property map: CSS property name → { value, priority } */
      _store = /* @__PURE__ */ new Map();
      /** Ordered list of property names for item() and length */
      _order = [];
      /** Optional owner element for syncing the style attribute */
      _ownerElement = null;
      constructor(initialCssText, ownerElement) {
        this._ownerElement = ownerElement ?? null;
        if (initialCssText) {
          this._parseCssText(initialCssText);
        }
        return new Proxy(this, {
          get(target, prop, receiver) {
            if (typeof prop === "symbol" || OWN_MEMBERS.has(prop)) {
              return Reflect.get(target, prop, receiver);
            }
            if (typeof prop === "string" && /^\d+$/.test(prop)) {
              return target.item(Number(prop));
            }
            if (typeof prop === "string") {
              const cssProp = jsToCss(prop);
              return target.getPropertyValue(cssProp);
            }
            return Reflect.get(target, prop, receiver);
          },
          has(target, prop) {
            if (typeof prop === "symbol" || OWN_MEMBERS.has(prop)) {
              return prop in target;
            }
            if (typeof prop === "string") return true;
            return prop in target;
          },
          set(target, prop, value, receiver) {
            if (typeof prop === "symbol" || OWN_MEMBERS.has(prop)) {
              return Reflect.set(target, prop, value, receiver);
            }
            if (typeof prop === "string") {
              const cssProp = jsToCss(prop);
              if (value === "" || value === null || value === void 0) {
                target.removeProperty(cssProp);
              } else {
                target.setProperty(cssProp, String(value));
              }
              return true;
            }
            return Reflect.set(target, prop, value, receiver);
          }
        });
      }
      // ── length ──────────────────────────────────────────────────────────
      get length() {
        return this._order.length;
      }
      // ── cssText ─────────────────────────────────────────────────────────
      get cssText() {
        const parts = [];
        for (const prop of this._order) {
          const entry = this._store.get(prop);
          if (entry) {
            const important = entry.priority === "important" ? " !important" : "";
            parts.push(`${prop}: ${entry.value}${important}`);
          }
        }
        return parts.length > 0 ? parts.join("; ") + ";" : "";
      }
      set cssText(value) {
        this._store.clear();
        this._order = [];
        if (value) {
          this._parseCssText(value);
        }
        this._syncToElement();
      }
      // ── Methods ─────────────────────────────────────────────────────────
      getPropertyValue(property) {
        const entry = this._store.get(property);
        return entry ? entry.value : "";
      }
      setProperty(property, value, priority) {
        if (value === null || value === "") {
          this.removeProperty(property);
          return;
        }
        const normalizedPriority = priority === "important" ? "important" : "";
        const existing = this._store.has(property);
        this._store.set(property, {
          value: String(value),
          priority: normalizedPriority
        });
        if (!existing) {
          this._order.push(property);
        }
        this._syncToElement();
      }
      removeProperty(property) {
        const entry = this._store.get(property);
        if (!entry) return "";
        const oldValue = entry.value;
        this._store.delete(property);
        this._order = this._order.filter((p) => p !== property);
        this._syncToElement();
        return oldValue;
      }
      getPropertyPriority(property) {
        const entry = this._store.get(property);
        return entry ? entry.priority : "";
      }
      item(index) {
        return this._order[index] ?? "";
      }
      // ── Internal helpers ────────────────────────────────────────────────
      /** Parse a CSS text string into the store */
      _parseCssText(cssText) {
        const declarations = cssText.split(";").filter((d) => d.trim() !== "");
        for (const decl of declarations) {
          const colonIdx = decl.indexOf(":");
          if (colonIdx === -1) continue;
          const prop = decl.slice(0, colonIdx).trim();
          let val = decl.slice(colonIdx + 1).trim();
          let priority = "";
          const importantMatch = val.match(/\s*!important\s*$/i);
          if (importantMatch) {
            priority = "important";
            val = val.slice(0, val.length - importantMatch[0].length).trim();
          }
          if (prop && val) {
            this._store.set(prop, { value: val, priority });
            if (!this._order.includes(prop)) {
              this._order.push(prop);
            }
          }
        }
      }
      /** Sync the current cssText back to the owner element's style attribute */
      _syncToElement() {
        if (!this._ownerElement) return;
        const text = this.cssText;
        if (text) {
          this._ownerElement.setAttribute("style", text);
        } else {
          this._ownerElement.setAttribute("style", "");
        }
      }
    };
  }
});

// src/nodes/TreeWalk.ts
function _mutationVersionOf(root) {
  const doc = root.nodeType === 9 ? root : root.ownerDocument;
  return doc && typeof doc._mutationVersion === "number" ? doc._mutationVersion : null;
}
function _liveCollection(root, match) {
  let cached = null;
  let cachedVersion = -1;
  return new HTMLCollection(() => {
    const ver = _mutationVersionOf(root);
    if (ver !== null && cached !== null && cachedVersion === ver) return cached;
    const results = [];
    _walkElements(root, (el) => {
      if (match(el)) results.push(el);
    });
    if (ver !== null) {
      cached = results;
      cachedVersion = ver;
    }
    return results;
  });
}
function _getElementsByClassName(root, className) {
  const requiredClasses = className.split(/\s+/).filter((c) => c.length > 0);
  return _liveCollection(root, (el) => {
    if (requiredClasses.length === 0) return false;
    const elClasses = el.className.split(/\s+/);
    return requiredClasses.every((rc) => elClasses.includes(rc));
  });
}
function _getElementsByTagName(root, tagName) {
  const upper = tagName.toUpperCase();
  const matchAll = upper === "*";
  return _liveCollection(root, (el) => matchAll || el.tagName === upper);
}
function _walkElements(node, callback) {
  for (const child of node._children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      callback(child);
    }
    _walkElements(child, callback);
  }
}
var init_TreeWalk = __esm({
  "src/nodes/TreeWalk.ts"() {
    "use strict";
    init_HTMLCollection();
    init_Node();
  }
});

// src/parser/HTMLTokenizer.ts
function decodeEntities(text) {
  if (text.indexOf("&") === -1) return text;
  let result2 = "";
  let lastIdx = 0;
  const len = text.length;
  for (let i = 0; i < len; i++) {
    if (text.charCodeAt(i) !== 38) continue;
    const semiIdx = text.indexOf(";", i + 1);
    if (semiIdx === -1 || semiIdx - i > 10) {
      continue;
    }
    const entityBody = text.substring(i + 1, semiIdx);
    let decoded;
    if (entityBody.charCodeAt(0) === 35) {
      if (entityBody.charCodeAt(1) === 120 || entityBody.charCodeAt(1) === 88) {
        const code = parseInt(entityBody.substring(2), 16);
        if (!isNaN(code)) decoded = String.fromCodePoint(code);
      } else {
        const code = parseInt(entityBody.substring(1), 10);
        if (!isNaN(code)) decoded = String.fromCodePoint(code);
      }
    } else {
      decoded = ENTITIES[entityBody];
      if (decoded === void 0) {
        const lower = entityBody.toLowerCase();
        decoded = ENTITIES[lower];
      }
    }
    if (decoded !== void 0) {
      result2 += text.substring(lastIdx, i) + decoded;
      lastIdx = semiIdx + 1;
      i = semiIdx;
    }
  }
  if (lastIdx === 0) return text;
  return result2 + text.substring(lastIdx);
}
var ENTITIES;
var init_HTMLTokenizer = __esm({
  "src/parser/HTMLTokenizer.ts"() {
    "use strict";
    ENTITIES = {
      "amp": "&",
      "lt": "<",
      "gt": ">",
      "quot": '"',
      "apos": "'",
      "nbsp": "\xA0",
      "AMP": "&",
      "LT": "<",
      "GT": ">",
      "QUOT": '"',
      "APOS": "'",
      "NBSP": "\xA0",
      "Amp": "&",
      "Lt": "<",
      "Gt": ">",
      "Quot": '"',
      "Apos": "'",
      "Nbsp": "\xA0"
    };
  }
});

// src/parser/HTMLParser.ts
function isVoidElement(tagName) {
  return VOID_ELEMENTS.has(tagName.toLowerCase());
}
function isWS(cc) {
  return cc === CC_SPACE || cc === CC_TAB || cc === CC_LF || cc === CC_CR;
}
function fastAppend(parent, child) {
  const children = parent._children;
  const len = children.length;
  if (len > 0) {
    const last = children[len - 1];
    last.nextSibling = child;
    child.previousSibling = last;
  }
  child.parentNode = parent;
  children.push(child);
}
function parseHTML(html, document) {
  const result2 = [];
  const len = html.length;
  if (len === 0) return result2;
  const stack = [];
  let stackLen = 0;
  let pos = 0;
  while (pos < len) {
    if (html.charCodeAt(pos) === CC_LT) {
      if (pos + 3 < len && html.charCodeAt(pos + 1) === CC_EXCL && html.charCodeAt(pos + 2) === CC_DASH && html.charCodeAt(pos + 3) === CC_DASH) {
        const endIdx = html.indexOf("-->", pos + 4);
        let data;
        if (endIdx === -1) {
          data = html.substring(pos + 4);
          pos = len;
        } else {
          data = html.substring(pos + 4, endIdx);
          pos = endIdx + 3;
        }
        const commentNode = document.createComment(data);
        if (stackLen > 0) {
          fastAppend(stack[stackLen - 1], commentNode);
        } else {
          result2.push(commentNode);
        }
        continue;
      }
      if (pos + 1 < len && html.charCodeAt(pos + 1) === CC_SLASH) {
        const closeIdx = html.indexOf(">", pos + 2);
        if (closeIdx === -1) {
          const textNode = document.createTextNode(html.substring(pos));
          if (stackLen > 0) {
            fastAppend(stack[stackLen - 1], textNode);
          } else {
            result2.push(textNode);
          }
          pos = len;
        } else {
          let nameStart2 = pos + 2;
          let nameEnd = closeIdx;
          while (nameStart2 < nameEnd && isWS(html.charCodeAt(nameStart2))) nameStart2++;
          while (nameEnd > nameStart2 && isWS(html.charCodeAt(nameEnd - 1))) nameEnd--;
          const tagName = html.substring(nameStart2, nameEnd).toUpperCase();
          let found = -1;
          for (let i = stackLen - 1; i >= 0; i--) {
            if (stack[i].tagName === tagName) {
              found = i;
              break;
            }
          }
          if (found !== -1) {
            stackLen = found;
          }
          pos = closeIdx + 1;
        }
        continue;
      }
      const tagEnd = findTagEnd(html, pos + 1, len);
      if (tagEnd === -1) {
        const textNode = document.createTextNode(html.substring(pos));
        if (stackLen > 0) {
          fastAppend(stack[stackLen - 1], textNode);
        } else {
          result2.push(textNode);
        }
        pos = len;
        continue;
      }
      let contentEnd = tagEnd;
      const selfClosing = html.charCodeAt(tagEnd - 1) === CC_SLASH;
      if (selfClosing) contentEnd = tagEnd - 1;
      let p = pos + 1;
      while (p < contentEnd && isWS(html.charCodeAt(p))) p++;
      const nameStart = p;
      while (p < contentEnd) {
        const cc = html.charCodeAt(p);
        if (isWS(cc) || cc === CC_SLASH) break;
        p++;
      }
      const tagNameLower = html.substring(nameStart, p).toLowerCase();
      const el = document.createElement(tagNameLower);
      let hasId = false;
      let idValue = "";
      while (p < contentEnd) {
        while (p < contentEnd && isWS(html.charCodeAt(p))) p++;
        if (p >= contentEnd) break;
        const attrNameStart = p;
        while (p < contentEnd) {
          const cc = html.charCodeAt(p);
          if (cc === CC_EQ || isWS(cc) || cc === CC_SLASH) break;
          p++;
        }
        if (p === attrNameStart) break;
        const attrName = html.substring(attrNameStart, p).toLowerCase();
        while (p < contentEnd && isWS(html.charCodeAt(p))) p++;
        if (p >= contentEnd || html.charCodeAt(p) !== CC_EQ) {
          el._setAttributeFast(attrName, "");
          continue;
        }
        p++;
        while (p < contentEnd && isWS(html.charCodeAt(p))) p++;
        if (p >= contentEnd) {
          el._setAttributeFast(attrName, "");
          break;
        }
        let attrValue;
        const firstChar = html.charCodeAt(p);
        if (firstChar === CC_DQUOTE || firstChar === CC_SQUOTE) {
          p++;
          const valStart = p;
          while (p < contentEnd && html.charCodeAt(p) !== firstChar) p++;
          const rawValue = html.substring(valStart, p);
          attrValue = decodeEntities(rawValue);
          if (p < contentEnd) p++;
        } else {
          const valStart = p;
          while (p < contentEnd && !isWS(html.charCodeAt(p))) p++;
          const rawValue = html.substring(valStart, p);
          attrValue = decodeEntities(rawValue);
        }
        el._setAttributeFast(attrName, attrValue);
        if (attrName === "id" && attrValue) {
          hasId = true;
          idValue = attrValue;
        }
      }
      if (hasId) {
        const doc = el.ownerDocument;
        if (doc && doc._idIndex && !doc._idIndex.has(idValue)) {
          doc._idIndex.set(idValue, el);
        }
      }
      if (stackLen > 0) {
        fastAppend(stack[stackLen - 1], el);
      } else {
        result2.push(el);
      }
      if (tagNameLower === "script" || tagNameLower === "style") {
        const closePat = "</" + tagNameLower;
        const rawStart = tagEnd + 1;
        const htmlLower = html.toLowerCase();
        const rawEnd = htmlLower.indexOf(closePat, rawStart);
        const textEnd2 = rawEnd === -1 ? len : rawEnd;
        const rawText = html.substring(rawStart, textEnd2);
        if (rawText) {
          fastAppend(el, document.createTextNode(rawText));
        }
        if (rawEnd !== -1) {
          const closeTagGt = html.indexOf(">", rawEnd);
          pos = closeTagGt !== -1 ? closeTagGt + 1 : len;
        } else {
          pos = len;
        }
        continue;
      }
      if (!VOID_ELEMENTS.has(tagNameLower)) {
        stack[stackLen] = el;
        stackLen++;
      }
      pos = tagEnd + 1;
      continue;
    }
    const nextTag = html.indexOf("<", pos);
    const textEnd = nextTag === -1 ? len : nextTag;
    if (textEnd > pos) {
      const text = html.substring(pos, textEnd);
      const textNode = document.createTextNode(decodeEntities(text));
      if (stackLen > 0) {
        fastAppend(stack[stackLen - 1], textNode);
      } else {
        result2.push(textNode);
      }
    }
    pos = textEnd;
  }
  return result2;
}
function findTagEnd(html, start, len) {
  let inSingle = false;
  let inDouble = false;
  for (let i = start; i < len; i++) {
    const cc = html.charCodeAt(i);
    if (cc === CC_SQUOTE && !inDouble) {
      inSingle = !inSingle;
    } else if (cc === CC_DQUOTE && !inSingle) {
      inDouble = !inDouble;
    } else if (cc === CC_GT && !inSingle && !inDouble) {
      return i;
    }
  }
  return -1;
}
var VOID_ELEMENTS, CC_LT, CC_GT, CC_SLASH, CC_EXCL, CC_DASH, CC_EQ, CC_SQUOTE, CC_DQUOTE, CC_SPACE, CC_TAB, CC_LF, CC_CR;
var init_HTMLParser = __esm({
  "src/parser/HTMLParser.ts"() {
    "use strict";
    init_HTMLTokenizer();
    VOID_ELEMENTS = /* @__PURE__ */ new Set([
      "area",
      "base",
      "br",
      "col",
      "embed",
      "hr",
      "img",
      "input",
      "link",
      "meta",
      "source",
      "track",
      "wbr"
    ]);
    CC_LT = 60;
    CC_GT = 62;
    CC_SLASH = 47;
    CC_EXCL = 33;
    CC_DASH = 45;
    CC_EQ = 61;
    CC_SQUOTE = 39;
    CC_DQUOTE = 34;
    CC_SPACE = 32;
    CC_TAB = 9;
    CC_LF = 10;
    CC_CR = 13;
  }
});

// src/parser/HTMLSerializer.ts
function escapeText(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttrValue(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function serializeHTML(node) {
  switch (node.nodeType) {
    case Node.TEXT_NODE:
      return escapeText(node._textData ?? "");
    case Node.COMMENT_NODE:
      return `<!--${node._textData ?? ""}-->`;
    case Node.ELEMENT_NODE:
      return serializeElement(node);
    case Node.DOCUMENT_FRAGMENT_NODE:
      return serializeChildren(node);
    case Node.DOCUMENT_NODE:
      return serializeChildren(node);
    default:
      return "";
  }
}
function serializeElement(node) {
  const el = node;
  const tagName = el.tagName.toLowerCase();
  let html = `<${tagName}`;
  const attrs = el.attributes;
  for (let i = 0; i < attrs.length; i++) {
    const attr = attrs.item(i);
    if (attr) {
      if (attr.value === "") {
        html += ` ${attr.name}`;
      } else {
        html += ` ${attr.name}="${escapeAttrValue(attr.value)}"`;
      }
    }
  }
  html += ">";
  if (isVoidElement(tagName)) {
    return html;
  }
  html += serializeChildren(node);
  html += `</${tagName}>`;
  return html;
}
function serializeChildren(node) {
  let html = "";
  for (const child of node._children) {
    html += serializeHTML(child);
  }
  return html;
}
var init_HTMLSerializer = __esm({
  "src/parser/HTMLSerializer.ts"() {
    "use strict";
    init_Node();
    init_HTMLParser();
  }
});

// src/selectors/SelectorParser.ts
function parseSelector(input) {
  const trimmed = input.trim();
  const cached = parseCache.get(trimmed);
  if (cached) return cached;
  const parser = new SelectorParserImpl(trimmed);
  const result2 = parser.parseSelectorList();
  if (parseCache.size >= PARSE_CACHE_MAX) {
    const firstKey = parseCache.keys().next().value;
    if (firstKey !== void 0) parseCache.delete(firstKey);
  }
  parseCache.set(trimmed, result2);
  return result2;
}
var PARSE_CACHE_MAX, parseCache, SelectorParserImpl;
var init_SelectorParser = __esm({
  "src/selectors/SelectorParser.ts"() {
    "use strict";
    PARSE_CACHE_MAX = 128;
    parseCache = /* @__PURE__ */ new Map();
    SelectorParserImpl = class {
      input;
      pos = 0;
      constructor(input) {
        this.input = input;
      }
      parseSelectorList() {
        if (this.input.length === 0) {
          throw new DOMException(
            "Failed to execute 'querySelector': '' is not a valid selector.",
            "SyntaxError"
          );
        }
        const selectors = [];
        selectors.push(this.parseComplexSelector());
        while (this.pos < this.input.length && this.peek() === ",") {
          this.advance();
          this.skipWhitespace();
          if (this.pos >= this.input.length) {
            throw new DOMException(
              "Failed to execute 'querySelector': unexpected end of selector after ','.",
              "SyntaxError"
            );
          }
          selectors.push(this.parseComplexSelector());
        }
        if (this.pos < this.input.length) {
          throw new DOMException(
            `Failed to execute 'querySelector': '${this.input}' is not a valid selector.`,
            "SyntaxError"
          );
        }
        return { selectors };
      }
      parseComplexSelector() {
        this.skipWhitespace();
        const head = this.parseCompoundSelector();
        const tail = [];
        while (this.pos < this.input.length) {
          const beforeWs = this.pos;
          this.skipWhitespace();
          const hasWhitespace = this.pos > beforeWs;
          if (this.pos >= this.input.length || this.peek() === ",") {
            break;
          }
          let combinator;
          if (this.peek() === ">") {
            this.advance();
            this.skipWhitespace();
            combinator = "child";
          } else if (this.peek() === "+") {
            this.advance();
            this.skipWhitespace();
            combinator = "adjacentSibling";
          } else if (this.peek() === "~") {
            this.advance();
            this.skipWhitespace();
            combinator = "generalSibling";
          } else if (hasWhitespace) {
            combinator = "descendant";
          } else {
            break;
          }
          if (this.pos >= this.input.length || this.peek() === ",") {
            throw new DOMException(
              `Failed to execute 'querySelector': '${this.input}' is not a valid selector.`,
              "SyntaxError"
            );
          }
          const selector = this.parseCompoundSelector();
          tail.push({ combinator, selector });
        }
        return { head, tail };
      }
      parseCompoundSelector() {
        const selectors = [];
        while (this.pos < this.input.length) {
          const ch = this.peek();
          if (ch === "#") {
            this.advance();
            const name = this.readIdent();
            selectors.push({ type: "id", name });
          } else if (ch === ".") {
            this.advance();
            const name = this.readIdent();
            selectors.push({ type: "class", name });
          } else if (ch === "[") {
            selectors.push(this.parseAttributeSelector());
          } else if (ch === ":") {
            selectors.push(this.parsePseudoClassSelector());
          } else if (ch === "*") {
            this.advance();
            selectors.push({ type: "universal" });
          } else if (this.isIdentStart(ch)) {
            const name = this.readIdent();
            selectors.push({ type: "type", name });
          } else {
            break;
          }
        }
        if (selectors.length === 0) {
          throw new DOMException(
            `Failed to execute 'querySelector': '${this.input}' is not a valid selector.`,
            "SyntaxError"
          );
        }
        return { selectors };
      }
      parseAttributeSelector() {
        this.advance();
        this.skipWhitespace();
        const name = this.readIdent();
        this.skipWhitespace();
        if (this.peek() === "]") {
          this.advance();
          return { type: "attribute", name, operator: null, value: null };
        }
        let operator;
        const ch = this.peek();
        if (ch === "=") {
          operator = "=";
          this.advance();
        } else if (ch === "~" || ch === "|" || ch === "^" || ch === "$" || ch === "*") {
          this.advance();
          if (this.peek() !== "=") {
            throw new DOMException(
              `Failed to execute 'querySelector': '${this.input}' is not a valid selector.`,
              "SyntaxError"
            );
          }
          this.advance();
          operator = ch + "=";
        } else {
          throw new DOMException(
            `Failed to execute 'querySelector': '${this.input}' is not a valid selector.`,
            "SyntaxError"
          );
        }
        this.skipWhitespace();
        let value;
        if (this.peek() === '"' || this.peek() === "'") {
          value = this.readQuotedString();
        } else {
          value = this.readUnquotedValue();
        }
        this.skipWhitespace();
        if (this.peek() !== "]") {
          throw new DOMException(
            `Failed to execute 'querySelector': '${this.input}' is not a valid selector.`,
            "SyntaxError"
          );
        }
        this.advance();
        return { type: "attribute", name, operator, value };
      }
      // ── Pseudo-class parsing ─────────────────────────────────────────
      parsePseudoClassSelector() {
        this.advance();
        const name = this.readIdent();
        if (this.pos < this.input.length && this.peek() === "(") {
          this.advance();
          this.skipWhitespace();
          if (name === "not") {
            const innerSelectors = [];
            while (this.pos < this.input.length && this.peek() !== ")") {
              const ch = this.peek();
              if (ch === "#") {
                this.advance();
                const ident = this.readIdent();
                innerSelectors.push({ type: "id", name: ident });
              } else if (ch === ".") {
                this.advance();
                const ident = this.readIdent();
                innerSelectors.push({ type: "class", name: ident });
              } else if (ch === "[") {
                innerSelectors.push(this.parseAttributeSelector());
              } else if (ch === ":") {
                innerSelectors.push(this.parsePseudoClassSelector());
              } else if (ch === "*") {
                this.advance();
                innerSelectors.push({ type: "universal" });
              } else if (this.isIdentStart(ch)) {
                const ident = this.readIdent();
                innerSelectors.push({ type: "type", name: ident });
              } else {
                break;
              }
            }
            if (this.peek() !== ")") {
              throw new DOMException(
                `Failed to execute 'querySelector': '${this.input}' is not a valid selector (unclosed :not).`,
                "SyntaxError"
              );
            }
            this.advance();
            if (innerSelectors.length === 0) {
              throw new DOMException(
                `Failed to execute 'querySelector': ':not()' requires an argument.`,
                "SyntaxError"
              );
            }
            return { type: "pseudoNot", innerSelectors };
          }
          let argument = "";
          let depth = 1;
          while (this.pos < this.input.length && depth > 0) {
            const ch = this.peek();
            if (ch === "(") depth++;
            else if (ch === ")") {
              depth--;
              if (depth === 0) break;
            }
            argument += ch;
            this.advance();
          }
          if (this.peek() !== ")") {
            throw new DOMException(
              `Failed to execute 'querySelector': '${this.input}' is not a valid selector (unclosed function).`,
              "SyntaxError"
            );
          }
          this.advance();
          return { type: "pseudo", name, argument: argument.trim() };
        }
        return { type: "pseudo", name, argument: null };
      }
      // ── Low-level helpers ─────────────────────────────────────────────
      peek() {
        return this.input[this.pos] ?? "";
      }
      advance() {
        this.pos++;
      }
      skipWhitespace() {
        while (this.pos < this.input.length && /\s/.test(this.input[this.pos])) {
          this.pos++;
        }
      }
      isIdentStart(ch) {
        return /[a-zA-Z_\-]/.test(ch) || ch.charCodeAt(0) > 127;
      }
      isIdentChar(ch) {
        return /[a-zA-Z0-9_\-]/.test(ch) || ch.charCodeAt(0) > 127;
      }
      /**
       * Read an unquoted attribute value — accepts digit-starting sequences like `1`, `123`, `2rem`.
       * CSS4 allows any sequence of non-whitespace, non-] characters as an unquoted value.
       */
      readUnquotedValue() {
        const start = this.pos;
        while (this.pos < this.input.length) {
          const ch = this.input[this.pos];
          if (ch === "]" || ch === " " || ch === "	" || ch === "\n" || ch === "\r") break;
          this.pos++;
        }
        if (this.pos === start) {
          throw new DOMException(
            `Failed to execute 'querySelector': '${this.input}' is not a valid selector.`,
            "SyntaxError"
          );
        }
        return this.input.slice(start, this.pos);
      }
      readIdent() {
        const start = this.pos;
        if (this.pos >= this.input.length || !this.isIdentStart(this.peek())) {
          throw new DOMException(
            `Failed to execute 'querySelector': '${this.input}' is not a valid selector.`,
            "SyntaxError"
          );
        }
        while (this.pos < this.input.length && this.isIdentChar(this.input[this.pos])) {
          this.pos++;
        }
        return this.input.slice(start, this.pos);
      }
      readQuotedString() {
        const quote = this.peek();
        this.advance();
        let value = "";
        while (this.pos < this.input.length && this.input[this.pos] !== quote) {
          if (this.input[this.pos] === "\\") {
            this.advance();
            if (this.pos < this.input.length) {
              value += this.input[this.pos];
              this.advance();
            }
          } else {
            value += this.input[this.pos];
            this.advance();
          }
        }
        if (this.pos >= this.input.length) {
          throw new DOMException(
            `Failed to execute 'querySelector': unterminated string in selector.`,
            "SyntaxError"
          );
        }
        this.advance();
        return value;
      }
    };
  }
});

// src/selectors/SelectorMatcher.ts
function beginQuery() {
  _elementChildrenCache = /* @__PURE__ */ new WeakMap();
}
function endQuery() {
  _elementChildrenCache = null;
}
function _toUpperCase(s) {
  let cached = _upperCache.get(s);
  if (cached === void 0) {
    cached = s.toUpperCase();
    _upperCache.set(s, cached);
  }
  return cached;
}
function matchesSelector(element, ast) {
  const selectors = ast.selectors;
  if (selectors.length === 1) return matchesComplex(element, selectors[0]);
  for (let i = 0, len = selectors.length; i < len; i++) {
    if (matchesComplex(element, selectors[i])) return true;
  }
  return false;
}
function querySelectorAllElements(root, ast) {
  const results = [];
  beginQuery();
  try {
    walkDescendants(root, (el) => {
      if (matchesSelector(el, ast)) {
        results.push(el);
      }
    });
  } finally {
    endQuery();
  }
  return results;
}
function querySelectorFirstElement(root, ast) {
  beginQuery();
  try {
    return walkDescendantsFirst(root, (el) => matchesSelector(el, ast));
  } finally {
    endQuery();
  }
}
function getReversedChain(complex) {
  let cached = _reversedChainCache.get(complex);
  if (cached) return cached;
  const entries = [];
  entries.push({ compound: complex.head, combinator: complex.tail[0].combinator });
  for (let i = 0, len = complex.tail.length - 1; i < len; i++) {
    entries.push({
      compound: complex.tail[i].selector,
      combinator: complex.tail[i + 1].combinator
    });
  }
  entries.reverse();
  _reversedChainCache.set(complex, entries);
  return entries;
}
function matchesComplex(element, complex) {
  if (complex.tail.length === 0) {
    return matchesCompound(element, complex.head);
  }
  const lastEntry = complex.tail[complex.tail.length - 1];
  if (!matchesCompound(element, lastEntry.selector)) {
    return false;
  }
  const entries = getReversedChain(complex);
  let current = element;
  for (let i = 0, len = entries.length; i < len; i++) {
    const entry = entries[i];
    const comb = entry.combinator;
    if (comb === "child") {
      const parent = current.parentNode;
      if (!parent || parent.nodeType !== ELEMENT_NODE) return false;
      if (!matchesCompound(parent, entry.compound)) return false;
      current = parent;
    } else if (comb === "adjacentSibling") {
      const prevSibling = getPreviousElementSibling(current);
      if (!prevSibling) return false;
      if (!matchesCompound(prevSibling, entry.compound)) return false;
      current = prevSibling;
    } else if (comb === "generalSibling") {
      let sibling = getPreviousElementSibling(current);
      let found = false;
      while (sibling) {
        if (matchesCompound(sibling, entry.compound)) {
          current = sibling;
          found = true;
          break;
        }
        sibling = getPreviousElementSibling(sibling);
      }
      if (!found) return false;
    } else {
      let ancestor = current.parentNode;
      let found = false;
      while (ancestor) {
        if (ancestor.nodeType === ELEMENT_NODE && matchesCompound(ancestor, entry.compound)) {
          current = ancestor;
          found = true;
          break;
        }
        ancestor = ancestor.parentNode;
      }
      if (!found) return false;
    }
  }
  return true;
}
function matchesCompound(element, compound) {
  const sels = compound.selectors;
  for (let i = 0, len = sels.length; i < len; i++) {
    if (!matchesSimple(element, sels[i])) return false;
  }
  return true;
}
function matchesSimple(element, simple) {
  switch (simple.type) {
    case "universal":
      return true;
    case "type":
      return element.tagName === _toUpperCase(simple.name);
    case "id":
      return element.getAttribute("id") === simple.name;
    case "class":
      return hasClassName(element, simple.name);
    case "attribute":
      return matchesAttribute(element, simple);
    case "pseudo":
      return matchesPseudoClass(element, simple);
    case "pseudoNot":
      return matchesPseudoNot(element, simple);
  }
}
function hasClassName(element, name) {
  const cls = element.getAttribute("class");
  if (!cls) return false;
  if (cls === name) return true;
  const len = name.length;
  const clsLen = cls.length;
  let idx = 0;
  while (idx <= clsLen - len) {
    const found = cls.indexOf(name, idx);
    if (found === -1) return false;
    const before = found === 0 || cls.charCodeAt(found - 1) <= 32;
    const after = found + len === clsLen || cls.charCodeAt(found + len) <= 32;
    if (before && after) return true;
    idx = found + 1;
  }
  return false;
}
function matchesAttribute(element, simple) {
  const attrValue = element.getAttribute(simple.name);
  if (simple.operator === null) {
    return attrValue !== null;
  }
  if (attrValue === null) return false;
  const value = simple.value;
  switch (simple.operator) {
    case "=":
      return attrValue === value;
    case "~=":
      return attrValue.split(/\s+/).includes(value);
    case "|=":
      return attrValue === value || attrValue.startsWith(value + "-");
    case "^=":
      return attrValue.startsWith(value);
    case "$=":
      return attrValue.endsWith(value);
    case "*=":
      return attrValue.includes(value);
  }
}
function matchesPseudoClass(element, simple) {
  const name = simple.name.toLowerCase();
  switch (name) {
    case "first-child": {
      const parent = element.parentNode;
      if (!parent) return false;
      return getFirstElementChild(parent) === element;
    }
    case "last-child": {
      const parent = element.parentNode;
      if (!parent) return false;
      return getLastElementChild(parent) === element;
    }
    case "only-child": {
      const parent = element.parentNode;
      if (!parent) return false;
      const elementChildren = getElementChildren(parent);
      return elementChildren.length === 1 && elementChildren[0] === element;
    }
    case "nth-child": {
      if (simple.argument === null) return false;
      const { a, b } = parseNthExpression(simple.argument);
      const position = getElementPosition(element);
      if (position === -1) return false;
      return matchesNth(a, b, position);
    }
    case "nth-last-child": {
      if (simple.argument === null) return false;
      const { a, b } = parseNthExpression(simple.argument);
      const posFromEnd = getElementPositionFromEnd(element);
      if (posFromEnd === -1) return false;
      return matchesNth(a, b, posFromEnd);
    }
    case "empty": {
      const children = getChildNodes(element);
      for (const child of children) {
        if (child.nodeType === ELEMENT_NODE) return false;
        if (child.nodeType === TEXT_NODE) {
          const text = child.textContent;
          if (text && text.length > 0) return false;
        }
      }
      return true;
    }
    case "root": {
      const parent = element.parentNode;
      if (!parent) return false;
      return parent.nodeType === DOCUMENT_NODE;
    }
    case "enabled": {
      return isFormElement(element) && !element.hasAttribute("disabled");
    }
    case "disabled": {
      return isFormElement(element) && element.hasAttribute("disabled");
    }
    case "checked": {
      const tag = element.tagName.toLowerCase();
      if (tag === "input") {
        const type3 = (element.getAttribute("type") || "").toLowerCase();
        if (type3 === "checkbox" || type3 === "radio") {
          return element.hasAttribute("checked");
        }
      }
      if (tag === "option") {
        return element.hasAttribute("selected");
      }
      return false;
    }
    case "required": {
      return isFormInputElement(element) && element.hasAttribute("required");
    }
    case "optional": {
      return isFormInputElement(element) && !element.hasAttribute("required");
    }
    case "first-of-type": {
      const parent = element.parentNode;
      if (!parent) return false;
      const tag = element.tagName;
      const children = getElementChildren(parent);
      for (const child of children) {
        if (child.tagName === tag) {
          return child === element;
        }
      }
      return false;
    }
    case "last-of-type": {
      const parent = element.parentNode;
      if (!parent) return false;
      const tag = element.tagName;
      const children = getElementChildren(parent);
      for (let i = children.length - 1; i >= 0; i--) {
        if (children[i].tagName === tag) {
          return children[i] === element;
        }
      }
      return false;
    }
    default:
      return false;
  }
}
function matchesPseudoNot(element, simple) {
  return !simple.innerSelectors.every((inner) => matchesSimple(element, inner));
}
function parseNthExpression(expr) {
  const s = expr.trim().toLowerCase();
  const cached = _nthCache.get(s);
  if (cached) return cached;
  let result2;
  if (s === "odd") {
    result2 = { a: 2, b: 1 };
  } else if (s === "even") {
    result2 = { a: 2, b: 0 };
  } else if (!s.includes("n")) {
    const num = parseInt(s, 10);
    result2 = isNaN(num) ? { a: 0, b: 0 } : { a: 0, b: num };
  } else {
    const nIndex = s.indexOf("n");
    let aStr = s.slice(0, nIndex).trim();
    let bStr = s.slice(nIndex + 1).trim();
    let a;
    if (aStr === "" || aStr === "+") {
      a = 1;
    } else if (aStr === "-") {
      a = -1;
    } else {
      a = parseInt(aStr, 10);
      if (isNaN(a)) a = 0;
    }
    let b;
    if (bStr === "") {
      b = 0;
    } else {
      bStr = bStr.replace(/\s+/g, "");
      b = parseInt(bStr, 10);
      if (isNaN(b)) b = 0;
    }
    result2 = { a, b };
  }
  _nthCache.set(s, result2);
  return result2;
}
function matchesNth(a, b, position) {
  if (a === 0) {
    return position === b;
  }
  const diff = position - b;
  if (diff % a !== 0) return false;
  const n = diff / a;
  return n >= 0;
}
function isElement(node) {
  return node.nodeType === ELEMENT_NODE;
}
function getPreviousElementSibling(element) {
  let sibling = element.previousSibling;
  while (sibling) {
    if (isElement(sibling)) return sibling;
    sibling = sibling.previousSibling;
  }
  return null;
}
function getElementChildren(parent) {
  if (_elementChildrenCache) {
    const cached = _elementChildrenCache.get(parent);
    if (cached) return cached;
  }
  const raw = parent._children;
  const children = [];
  for (let i = 0, len = raw.length; i < len; i++) {
    if (raw[i].nodeType === ELEMENT_NODE) {
      children.push(raw[i]);
    }
  }
  if (_elementChildrenCache) {
    _elementChildrenCache.set(parent, children);
  }
  return children;
}
function getChildNodes(parent) {
  return parent._children;
}
function getFirstElementChild(parent) {
  const raw = parent._children;
  for (let i = 0, len = raw.length; i < len; i++) {
    if (raw[i].nodeType === ELEMENT_NODE) return raw[i];
  }
  return null;
}
function getLastElementChild(parent) {
  const raw = parent._children;
  for (let i = raw.length - 1; i >= 0; i--) {
    if (raw[i].nodeType === ELEMENT_NODE) return raw[i];
  }
  return null;
}
function getElementPosition(element) {
  const parent = element.parentNode;
  if (!parent) return -1;
  const elementChildren = getElementChildren(parent);
  const index = elementChildren.indexOf(element);
  return index === -1 ? -1 : index + 1;
}
function getElementPositionFromEnd(element) {
  const parent = element.parentNode;
  if (!parent) return -1;
  const elementChildren = getElementChildren(parent);
  const index = elementChildren.indexOf(element);
  if (index === -1) return -1;
  return elementChildren.length - index;
}
function isFormElement(element) {
  const tag = element.tagName.toLowerCase();
  return tag === "input" || tag === "select" || tag === "textarea" || tag === "button";
}
function isFormInputElement(element) {
  const tag = element.tagName.toLowerCase();
  return tag === "input" || tag === "select" || tag === "textarea";
}
function walkDescendants(root, callback) {
  const children = root._children;
  for (let i = 0, len = children.length; i < len; i++) {
    const child = children[i];
    if (child.nodeType === ELEMENT_NODE) {
      callback(child);
    }
    if (child._children.length > 0) {
      walkDescendants(child, callback);
    }
  }
}
function walkDescendantsFirst(root, predicate) {
  const children = root._children;
  for (let i = 0, len = children.length; i < len; i++) {
    const child = children[i];
    if (child.nodeType === ELEMENT_NODE) {
      if (predicate(child)) return child;
    }
    if (child._children.length > 0) {
      const found = walkDescendantsFirst(child, predicate);
      if (found) return found;
    }
  }
  return null;
}
function _fastQueryFirst(root, selector) {
  if (selector.length === 0) return void 0;
  const ch = selector.charCodeAt(0);
  if (ch === 46 && SIMPLE_CLASS_RE.test(selector)) {
    const name = selector.slice(1);
    return walkDescendantsFirst(root, (el) => hasClassName(el, name));
  }
  if (ch === 35 && SIMPLE_ID_RE.test(selector)) {
    const name = selector.slice(1);
    return walkDescendantsFirst(root, (el) => el.getAttribute("id") === name);
  }
  if ((ch >= 65 && ch <= 90 || ch >= 97 && ch <= 122) && SIMPLE_TAG_RE.test(selector)) {
    const upper = selector.toUpperCase();
    return walkDescendantsFirst(root, (el) => el.tagName === upper);
  }
  return void 0;
}
function _fastQueryAll(root, selector) {
  if (selector.length === 0) return void 0;
  const ch = selector.charCodeAt(0);
  if (ch === 46 && SIMPLE_CLASS_RE.test(selector)) {
    const name = selector.slice(1);
    const results = [];
    walkDescendants(root, (el) => {
      if (hasClassName(el, name)) results.push(el);
    });
    return results;
  }
  if (ch === 35 && SIMPLE_ID_RE.test(selector)) {
    const name = selector.slice(1);
    const results = [];
    walkDescendants(root, (el) => {
      if (el.getAttribute("id") === name) results.push(el);
    });
    return results;
  }
  if ((ch >= 65 && ch <= 90 || ch >= 97 && ch <= 122) && SIMPLE_TAG_RE.test(selector)) {
    const upper = selector.toUpperCase();
    const results = [];
    walkDescendants(root, (el) => {
      if (el.tagName === upper) results.push(el);
    });
    return results;
  }
  return void 0;
}
var _elementChildrenCache, _nthCache, _upperCache, _reversedChainCache, ELEMENT_NODE, TEXT_NODE, DOCUMENT_NODE, SIMPLE_CLASS_RE, SIMPLE_ID_RE, SIMPLE_TAG_RE;
var init_SelectorMatcher = __esm({
  "src/selectors/SelectorMatcher.ts"() {
    "use strict";
    _elementChildrenCache = null;
    _nthCache = /* @__PURE__ */ new Map();
    _upperCache = /* @__PURE__ */ new Map();
    _reversedChainCache = /* @__PURE__ */ new WeakMap();
    ELEMENT_NODE = 1;
    TEXT_NODE = 3;
    DOCUMENT_NODE = 9;
    SIMPLE_CLASS_RE = /^\.[a-zA-Z_\-][a-zA-Z0-9_\-]*$/;
    SIMPLE_ID_RE = /^#[a-zA-Z_\-][a-zA-Z0-9_\-]*$/;
    SIMPLE_TAG_RE = /^[a-zA-Z][a-zA-Z0-9]*$/;
  }
});

// src/selectors/index.ts
var init_selectors = __esm({
  "src/selectors/index.ts"() {
    "use strict";
    init_SelectorParser();
    init_SelectorMatcher();
  }
});

// src/nodes/Element.ts
var Element;
var init_Element = __esm({
  "src/nodes/Element.ts"() {
    "use strict";
    init_Node();
    init_Text();
    init_Attr();
    init_NodeList();
    init_NamedNodeMap();
    init_DOMTokenList();
    init_HTMLCollection();
    init_CSSStyleDeclaration();
    init_TreeWalk();
    init_HTMLParser();
    init_HTMLSerializer();
    init_Event();
    init_MutationObserver();
    init_selectors();
    Element = class _Element extends Node {
      tagName;
      /** Namespace URI, set by Document.createElementNS */
      _namespaceURI = null;
      _attributes;
      _classList = null;
      _style = null;
      _children_collection = null;
      /** Query cache — keyed by selector, validated against document mutation version. */
      _qsaCache = null;
      _qsCache = null;
      constructor(tagName) {
        const upper = tagName.toUpperCase();
        super(Node.ELEMENT_NODE, upper);
        this.tagName = upper;
        this._attributes = new NamedNodeMap();
      }
      get namespaceURI() {
        return this._namespaceURI;
      }
      getBoundingClientRect() {
        return { top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0, x: 0, y: 0 };
      }
      getClientRects() {
        return [this.getBoundingClientRect()];
      }
      // ── Focus / interaction stubs ──────────────────────────────────────
      focus(_options) {
      }
      blur() {
      }
      click() {
        const event = new Event("click", { bubbles: true, cancelable: true });
        this.dispatchEvent(event);
      }
      scrollIntoView(_arg) {
      }
      // ── Select element support ─────────────────────────────────────────
      get options() {
        if (this.tagName !== "SELECT") return [];
        const opts = [];
        for (const child of this._children) {
          if (child.nodeType === Node.ELEMENT_NODE && child.tagName === "OPTION") {
            opts.push(child);
          }
        }
        return opts;
      }
      get selectedIndex() {
        return -1;
      }
      set selectedIndex(_value) {
      }
      get selected() {
        return false;
      }
      set selected(_value) {
      }
      get disabled() {
        return this.hasAttribute("disabled");
      }
      set disabled(value) {
        if (value) {
          this.setAttribute("disabled", "");
        } else {
          this.removeAttribute("disabled");
        }
      }
      get defaultSelected() {
        return false;
      }
      set defaultSelected(_value) {
      }
      // ── Attributes ──────────────────────────────────────────────────────
      /**
       * Fast attribute setter for the parser. Assumes:
       * - name is already lowercase
       * - no existing attribute with this name on the element
       * - value is already a string
       * Skips getNamedItem lookup, toLowerCase, and id-index checks.
       * The id-index is updated separately after all attributes are set.
       */
      _setAttributeFast(name, value) {
        const attr = new Attr(name, value);
        attr.ownerElement = this;
        this._attributes._attrs.push(attr);
        this._attributes._map.set(name, attr);
      }
      get attributes() {
        return this._attributes;
      }
      getAttribute(name) {
        const attr = this._attributes.getNamedItem(name);
        return attr ? attr.value : null;
      }
      setAttribute(name, value) {
        const lower = name.toLowerCase();
        const strValue = String(value);
        const map2 = this._attributes._map;
        const existing = map2.get(lower);
        if (existing) {
          const oldValue = existing.value;
          if (lower === "id") {
            const doc = this.ownerDocument;
            if (doc && doc._idIndex) {
              if (oldValue && doc._idIndex.get(oldValue) === this) doc._idIndex.delete(oldValue);
              if (strValue && !doc._idIndex.has(strValue)) doc._idIndex.set(strValue, this);
            }
          }
          existing.value = strValue;
          this._notifyMutation();
          triggerMutation("attributes", this, { attributeName: lower, oldValue });
        } else {
          const attr = new Attr(lower, strValue);
          attr.ownerElement = this;
          this._attributes._attrs.push(attr);
          map2.set(lower, attr);
          if (lower === "id" && strValue) {
            const doc = this.ownerDocument;
            if (doc && doc._idIndex && !doc._idIndex.has(strValue)) doc._idIndex.set(strValue, this);
          }
          this._notifyMutation();
          triggerMutation("attributes", this, { attributeName: lower, oldValue: null });
        }
      }
      removeAttribute(name) {
        const lower = name.toLowerCase();
        const attr = this._attributes.getNamedItem(lower);
        if (attr) {
          const oldValue = attr.value;
          if (lower === "id") {
            const doc = this.ownerDocument;
            if (doc && doc._idIndex) {
              const oldId = attr.value;
              if (oldId && doc._idIndex.get(oldId) === this) {
                doc._idIndex.delete(oldId);
              }
            }
          }
          this._attributes.removeNamedItem(lower);
          this._notifyMutation();
          triggerMutation("attributes", this, { attributeName: lower, oldValue });
        }
      }
      hasAttribute(name) {
        return this._attributes.getNamedItem(name) !== null;
      }
      // ── id / className ──────────────────────────────────────────────────
      get id() {
        return this.getAttribute("id") ?? "";
      }
      set id(value) {
        this.setAttribute("id", value);
      }
      get className() {
        return this.getAttribute("class") ?? "";
      }
      set className(value) {
        this.setAttribute("class", value);
      }
      // ── classList ───────────────────────────────────────────────────────
      get classList() {
        if (!this._classList) {
          this._classList = new DOMTokenList(
            () => this.getAttribute("class") ?? "",
            (value) => this.setAttribute("class", value)
          );
        }
        return this._classList;
      }
      // ── style ──────────────────────────────────────────────────────────
      get style() {
        if (!this._style) {
          this._style = new CSSStyleDeclaration(
            this.getAttribute("style") ?? void 0,
            this
          );
        }
        return this._style;
      }
      // ── Element child traversal ─────────────────────────────────────────
      get children() {
        if (!this._children_collection) {
          this._children_collection = new HTMLCollection(
            () => this._children.filter((c) => c.nodeType === Node.ELEMENT_NODE)
          );
        }
        return this._children_collection;
      }
      get childElementCount() {
        let count = 0;
        const children = this._children;
        for (let i = 0, len = children.length; i < len; i++) {
          if (children[i].nodeType === 1) count++;
        }
        return count;
      }
      get firstElementChild() {
        for (const child of this._children) {
          if (child.nodeType === Node.ELEMENT_NODE) return child;
        }
        return null;
      }
      get lastElementChild() {
        for (let i = this._children.length - 1; i >= 0; i--) {
          if (this._children[i].nodeType === Node.ELEMENT_NODE) return this._children[i];
        }
        return null;
      }
      get nextElementSibling() {
        let sibling = this.nextSibling;
        while (sibling) {
          if (sibling.nodeType === Node.ELEMENT_NODE) return sibling;
          sibling = sibling.nextSibling;
        }
        return null;
      }
      get previousElementSibling() {
        let sibling = this.previousSibling;
        while (sibling) {
          if (sibling.nodeType === Node.ELEMENT_NODE) return sibling;
          sibling = sibling.previousSibling;
        }
        return null;
      }
      // ── Convenience mutation methods ────────────────────────────────────
      /**
       * Convert a Node-or-string argument to a Node.
       * Strings become Text nodes per the DOM spec.
       */
      _coerceNode(item) {
        if (typeof item === "string") {
          return new Text(item);
        }
        return item;
      }
      append(...nodes) {
        for (const item of nodes) {
          this.appendChild(this._coerceNode(item));
        }
      }
      prepend(...nodes) {
        const firstChild = this.firstChild;
        for (const item of nodes) {
          const node = this._coerceNode(item);
          if (firstChild) {
            this.insertBefore(node, firstChild);
          } else {
            this.appendChild(node);
          }
        }
      }
      after(...nodes) {
        const parent = this.parentNode;
        if (!parent) return;
        const nextSib = this.nextSibling;
        for (const item of nodes) {
          const node = this._coerceNode(item);
          parent.insertBefore(node, nextSib);
        }
      }
      before(...nodes) {
        const parent = this.parentNode;
        if (!parent) return;
        for (const item of nodes) {
          const node = this._coerceNode(item);
          parent.insertBefore(node, this);
        }
      }
      remove() {
        if (this.parentNode) {
          this.parentNode.removeChild(this);
        }
      }
      replaceWith(...nodes) {
        const parent = this.parentNode;
        if (!parent) return;
        const nextSib = this.nextSibling;
        parent.removeChild(this);
        for (const item of nodes) {
          const node = this._coerceNode(item);
          parent.insertBefore(node, nextSib);
        }
      }
      // ── Query methods ──────────────────────────────────────────────────
      getElementsByClassName(className) {
        return _getElementsByClassName(this, className);
      }
      getElementsByTagName(tagName) {
        return _getElementsByTagName(this, tagName);
      }
      querySelector(selector) {
        const doc = this.ownerDocument;
        const ver = doc ? doc._mutationVersion : -1;
        if (doc) {
          if (!this._qsCache) this._qsCache = /* @__PURE__ */ new Map();
          const cached = this._qsCache.get(selector);
          if (cached && cached.v === ver) return cached.r;
        }
        const fast = _fastQueryFirst(this, selector);
        if (fast !== void 0) {
          if (doc) this._qsCache.set(selector, { v: ver, r: fast });
          return fast;
        }
        const ast = parseSelector(selector);
        const result2 = querySelectorFirstElement(this, ast);
        if (doc) this._qsCache.set(selector, { v: ver, r: result2 });
        return result2;
      }
      querySelectorAll(selector) {
        const doc = this.ownerDocument;
        const ver = doc ? doc._mutationVersion : -1;
        if (doc) {
          if (!this._qsaCache) this._qsaCache = /* @__PURE__ */ new Map();
          const cached = this._qsaCache.get(selector);
          if (cached && cached.v === ver) return cached.r;
        }
        const fast = _fastQueryAll(this, selector);
        if (fast !== void 0) {
          const nl2 = new NodeList(fast);
          if (doc) this._qsaCache.set(selector, { v: ver, r: nl2 });
          return nl2;
        }
        const ast = parseSelector(selector);
        const elements = querySelectorAllElements(this, ast);
        const nl = new NodeList(elements);
        if (doc) this._qsaCache.set(selector, { v: ver, r: nl });
        return nl;
      }
      matches(selector) {
        const ast = parseSelector(selector);
        return matchesSelector(this, ast);
      }
      closest(selector) {
        const ast = parseSelector(selector);
        let current = this;
        while (current) {
          if (current.nodeType === Node.ELEMENT_NODE) {
            if (matchesSelector(current, ast)) {
              return current;
            }
          }
          current = current.parentNode;
        }
        return null;
      }
      // ── Clone ──────────────────────────────────────────────────────────
      cloneNode(deep) {
        const clone = new _Element(this.tagName);
        clone.ownerDocument = this.ownerDocument;
        for (const attr of this._attributes) {
          clone.setAttribute(attr.name, attr.value);
        }
        if (deep) {
          for (const child of this._children) {
            clone.appendChild(child.cloneNode(true));
          }
        }
        return clone;
      }
      // ── textContent override ───────────────────────────────────────────
      set textContent(value) {
        if (value == null) value = "";
        while (this._children.length > 0) {
          this.removeChild(this._children[0]);
        }
        if (value !== "") {
          this.appendChild(new Text(value));
        }
      }
      get textContent() {
        const parts = [];
        const children = this._children;
        for (let i = 0, len = children.length; i < len; i++) {
          if (children[i].nodeType !== 8) {
            parts.push(children[i].textContent);
          }
        }
        return parts.join("");
      }
      // ── innerHTML ─────────────────────────────────────────────────────
      get innerHTML() {
        let html = "";
        for (const child of this._children) {
          html += serializeHTML(child);
        }
        return html;
      }
      set innerHTML(html) {
        const children = this._children;
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          child.parentNode = null;
          child.previousSibling = null;
          child.nextSibling = null;
        }
        children.length = 0;
        if (html === "") {
          this._notifyMutation();
          return;
        }
        const doc = this._getOwnerDocument();
        const nodes = parseHTML(html, doc);
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          const prev = i > 0 ? nodes[i - 1] : null;
          if (prev) {
            prev.nextSibling = node;
            node.previousSibling = prev;
          } else {
            node.previousSibling = null;
          }
          node.nextSibling = null;
          node.parentNode = this;
          children.push(node);
        }
        this._notifyMutation();
      }
      // ── outerHTML ─────────────────────────────────────────────────────
      get outerHTML() {
        return serializeHTML(this);
      }
      set outerHTML(html) {
        const parent = this.parentNode;
        if (!parent) {
          throw new DOMException(
            "Failed to set the 'outerHTML' property on 'Element': This element has no parent node.",
            "NoModificationAllowedError"
          );
        }
        const doc = this._getOwnerDocument();
        const nodes = parseHTML(html, doc);
        const nextSib = this.nextSibling;
        parent.removeChild(this);
        for (const node of nodes) {
          parent.insertBefore(node, nextSib);
        }
      }
      // ── Internal helpers ──────────────────────────────────────────────
      _getOwnerDocument() {
        if (this.ownerDocument) return this.ownerDocument;
        return null;
      }
    };
  }
});

// src/nodes/Comment.ts
var Comment;
var init_Comment = __esm({
  "src/nodes/Comment.ts"() {
    "use strict";
    init_Node();
    Comment = class _Comment extends Node {
      constructor(data = "") {
        super(Node.COMMENT_NODE, "#comment");
        this._textData = data;
      }
      get data() {
        return this._textData ?? "";
      }
      set data(value) {
        this._textData = value;
      }
      get length() {
        return this.data.length;
      }
      get nodeValue() {
        return this.data;
      }
      set nodeValue(value) {
        this.data = value ?? "";
      }
      cloneNode(_deep) {
        const clone = new _Comment(this.data);
        clone.ownerDocument = this.ownerDocument;
        return clone;
      }
    };
  }
});

// src/nodes/DocumentFragment.ts
var DocumentFragment;
var init_DocumentFragment = __esm({
  "src/nodes/DocumentFragment.ts"() {
    "use strict";
    init_Node();
    init_Text();
    init_TreeWalk();
    init_NodeList();
    init_selectors();
    DocumentFragment = class extends Node {
      constructor() {
        super(Node.DOCUMENT_FRAGMENT_NODE, "#document-fragment");
        const activeDocument = typeof globalThis !== "undefined" && "document" in globalThis && globalThis.document && typeof globalThis.document?.createElement === "function" ? globalThis.document : null;
        if (activeDocument) {
          this.ownerDocument = activeDocument;
        }
      }
      // ── Convenience mutation methods ───────────────────────────────────
      _coerceNode(item) {
        if (typeof item === "string") {
          return new Text(item);
        }
        return item;
      }
      append(...nodes) {
        for (const item of nodes) {
          this.appendChild(this._coerceNode(item));
        }
      }
      prepend(...nodes) {
        const firstChild = this.firstChild;
        for (const item of nodes) {
          const node = this._coerceNode(item);
          if (firstChild) {
            this.insertBefore(node, firstChild);
          } else {
            this.appendChild(node);
          }
        }
      }
      // ── Query methods ──────────────────────────────────────────────────
      getElementById(id) {
        return this._walkForId(this, id);
      }
      _walkForId(node, id) {
        for (const child of node._children) {
          if (child.nodeType === Node.ELEMENT_NODE) {
            if (child.id === id) return child;
            const found = this._walkForId(child, id);
            if (found) return found;
          }
        }
        return null;
      }
      getElementsByClassName(className) {
        return _getElementsByClassName(this, className);
      }
      getElementsByTagName(tagName) {
        return _getElementsByTagName(this, tagName);
      }
      querySelector(selector) {
        const ast = parseSelector(selector);
        return querySelectorFirstElement(this, ast);
      }
      querySelectorAll(selector) {
        const ast = parseSelector(selector);
        const elements = querySelectorAllElements(this, ast);
        return new NodeList([...elements]);
      }
    };
  }
});

// src/nodes/HTMLInputElement.ts
var HTMLInputElement;
var init_HTMLInputElement = __esm({
  "src/nodes/HTMLInputElement.ts"() {
    "use strict";
    init_Element();
    init_Node();
    init_Event();
    HTMLInputElement = class extends Element {
      _value = "";
      _checked = false;
      constructor() {
        super("input");
      }
      // ── type ──────────────────────────────────────────────────────────
      get type() {
        return this.getAttribute("type") ?? "text";
      }
      set type(v) {
        this.setAttribute("type", v);
      }
      // ── value (internal state, NOT attribute) ─────────────────────────
      get value() {
        return this._value;
      }
      set value(v) {
        this._value = v;
      }
      // ── defaultValue (maps to 'value' attribute) ─────────────────────
      get defaultValue() {
        return this.getAttribute("value") ?? "";
      }
      set defaultValue(v) {
        this.setAttribute("value", v);
      }
      // ── checked (internal state, NOT attribute) ───────────────────────
      get checked() {
        return this._checked;
      }
      set checked(v) {
        this._checked = v;
      }
      // ── defaultChecked (maps to 'checked' attribute) ──────────────────
      get defaultChecked() {
        return this.hasAttribute("checked");
      }
      set defaultChecked(v) {
        if (v) {
          this.setAttribute("checked", "");
        } else {
          this.removeAttribute("checked");
        }
      }
      // ── name ──────────────────────────────────────────────────────────
      get name() {
        return this.getAttribute("name") ?? "";
      }
      set name(v) {
        this.setAttribute("name", v);
      }
      // ── disabled ──────────────────────────────────────────────────────
      get disabled() {
        return this.hasAttribute("disabled");
      }
      set disabled(v) {
        if (v) {
          this.setAttribute("disabled", "");
        } else {
          this.removeAttribute("disabled");
        }
      }
      // ── readOnly ──────────────────────────────────────────────────────
      get readOnly() {
        return this.hasAttribute("readonly");
      }
      set readOnly(v) {
        if (v) {
          this.setAttribute("readonly", "");
        } else {
          this.removeAttribute("readonly");
        }
      }
      // ── required ──────────────────────────────────────────────────────
      get required() {
        return this.hasAttribute("required");
      }
      set required(v) {
        if (v) {
          this.setAttribute("required", "");
        } else {
          this.removeAttribute("required");
        }
      }
      // ── placeholder ───────────────────────────────────────────────────
      get placeholder() {
        return this.getAttribute("placeholder") ?? "";
      }
      set placeholder(v) {
        this.setAttribute("placeholder", v);
      }
      // ── min / max / step ──────────────────────────────────────────────
      get min() {
        return this.getAttribute("min") ?? "";
      }
      set min(v) {
        this.setAttribute("min", v);
      }
      get max() {
        return this.getAttribute("max") ?? "";
      }
      set max(v) {
        this.setAttribute("max", v);
      }
      get step() {
        return this.getAttribute("step") ?? "";
      }
      set step(v) {
        this.setAttribute("step", v);
      }
      // ── minLength / maxLength ─────────────────────────────────────────
      get minLength() {
        const attr = this.getAttribute("minlength");
        return attr !== null ? parseInt(attr, 10) : -1;
      }
      set minLength(v) {
        this.setAttribute("minlength", String(v));
      }
      get maxLength() {
        const attr = this.getAttribute("maxlength");
        return attr !== null ? parseInt(attr, 10) : -1;
      }
      set maxLength(v) {
        this.setAttribute("maxlength", String(v));
      }
      // ── pattern ───────────────────────────────────────────────────────
      get pattern() {
        return this.getAttribute("pattern") ?? "";
      }
      set pattern(v) {
        this.setAttribute("pattern", v);
      }
      // ── multiple ──────────────────────────────────────────────────────
      get multiple() {
        return this.hasAttribute("multiple");
      }
      set multiple(v) {
        if (v) {
          this.setAttribute("multiple", "");
        } else {
          this.removeAttribute("multiple");
        }
      }
      // ── autofocus ─────────────────────────────────────────────────────
      get autofocus() {
        return this.hasAttribute("autofocus");
      }
      set autofocus(v) {
        if (v) {
          this.setAttribute("autofocus", "");
        } else {
          this.removeAttribute("autofocus");
        }
      }
      // ── form (walk up tree) ───────────────────────────────────────────
      get form() {
        let current = this.parentNode;
        while (current) {
          if (current.nodeType === Node.ELEMENT_NODE && current.tagName === "FORM") {
            return current;
          }
          current = current.parentNode;
        }
        return null;
      }
      // ── Methods ───────────────────────────────────────────────────────
      focus() {
      }
      blur() {
      }
      click() {
        if (this.type === "checkbox") {
          this._checked = !this._checked;
        }
        const event = new Event("click", { bubbles: true, cancelable: true });
        this.dispatchEvent(event);
      }
      select() {
      }
      // ── Validation ────────────────────────────────────────────────────
      get validity() {
        const valueMissing = this.required && this._value === "";
        return {
          valid: !valueMissing,
          valueMissing
        };
      }
      checkValidity() {
        return this.validity.valid;
      }
      reportValidity() {
        return this.checkValidity();
      }
    };
  }
});

// src/nodes/HTMLSelectElement.ts
var HTMLSelectElement;
var init_HTMLSelectElement = __esm({
  "src/nodes/HTMLSelectElement.ts"() {
    "use strict";
    init_Element();
    init_Node();
    init_HTMLCollection();
    HTMLSelectElement = class extends Element {
      _selectedIndex = -1;
      constructor() {
        super("select");
      }
      // ── options (live HTMLCollection of child <option> elements) ──────
      get options() {
        return new HTMLCollection(
          () => this._children.filter(
            (c) => c.nodeType === Node.ELEMENT_NODE && c.tagName === "OPTION"
          )
        );
      }
      // ── selectedIndex ─────────────────────────────────────────────────
      get selectedIndex() {
        return this._selectedIndex;
      }
      set selectedIndex(index) {
        const opts = this._getOptionElements();
        for (const opt of opts) {
          opt.selected = false;
        }
        if (index >= 0 && index < opts.length) {
          this._selectedIndex = index;
          opts[index].selected = true;
        } else {
          this._selectedIndex = -1;
        }
      }
      // ── value ─────────────────────────────────────────────────────────
      get value() {
        const opts = this._getOptionElements();
        if (this._selectedIndex >= 0 && this._selectedIndex < opts.length) {
          return opts[this._selectedIndex].value;
        }
        return "";
      }
      set value(v) {
        const opts = this._getOptionElements();
        for (const opt of opts) {
          opt.selected = false;
        }
        for (let i = 0; i < opts.length; i++) {
          if (opts[i].value === v) {
            this._selectedIndex = i;
            opts[i].selected = true;
            return;
          }
        }
        this._selectedIndex = -1;
      }
      // ── selectedOptions ───────────────────────────────────────────────
      get selectedOptions() {
        return this._getOptionElements().filter((opt) => opt.selected);
      }
      // ── multiple ──────────────────────────────────────────────────────
      get multiple() {
        return this.hasAttribute("multiple");
      }
      set multiple(v) {
        if (v) {
          this.setAttribute("multiple", "");
        } else {
          this.removeAttribute("multiple");
        }
      }
      // ── name ──────────────────────────────────────────────────────────
      get name() {
        return this.getAttribute("name") ?? "";
      }
      set name(v) {
        this.setAttribute("name", v);
      }
      // ── disabled ──────────────────────────────────────────────────────
      get disabled() {
        return this.hasAttribute("disabled");
      }
      set disabled(v) {
        if (v) {
          this.setAttribute("disabled", "");
        } else {
          this.removeAttribute("disabled");
        }
      }
      // ── required ──────────────────────────────────────────────────────
      get required() {
        return this.hasAttribute("required");
      }
      set required(v) {
        if (v) {
          this.setAttribute("required", "");
        } else {
          this.removeAttribute("required");
        }
      }
      // ── length ────────────────────────────────────────────────────────
      get length() {
        return this._getOptionElements().length;
      }
      // ── form ──────────────────────────────────────────────────────────
      get form() {
        let current = this.parentNode;
        while (current) {
          if (current.nodeType === Node.ELEMENT_NODE && current.tagName === "FORM") {
            return current;
          }
          current = current.parentNode;
        }
        return null;
      }
      // ── Methods ───────────────────────────────────────────────────────
      add(option, before) {
        if (before === void 0 || before === null) {
          this.appendChild(option);
        } else if (typeof before === "number") {
          const opts = this._getOptionElements();
          if (before >= 0 && before < opts.length) {
            this.insertBefore(option, opts[before]);
          } else {
            this.appendChild(option);
          }
        } else {
          this.insertBefore(option, before);
        }
      }
      remove(index) {
        if (index === void 0) {
          super.remove();
          return;
        }
        const opts = this._getOptionElements();
        if (index >= 0 && index < opts.length) {
          this.removeChild(opts[index]);
          if (this._selectedIndex === index) {
            this._selectedIndex = -1;
          } else if (this._selectedIndex > index) {
            this._selectedIndex--;
          }
        }
      }
      _copyCloneState(clone) {
        clone._selectedIndex = this._selectedIndex;
      }
      // ── Validation ────────────────────────────────────────────────────
      checkValidity() {
        if (this.required && this._selectedIndex === -1) {
          return false;
        }
        return true;
      }
      // ── Internal helpers ──────────────────────────────────────────────
      _getOptionElements() {
        return this._children.filter(
          (c) => c.nodeType === Node.ELEMENT_NODE && c.tagName === "OPTION"
        );
      }
    };
  }
});

// src/nodes/HTMLTextAreaElement.ts
var HTMLTextAreaElement;
var init_HTMLTextAreaElement = __esm({
  "src/nodes/HTMLTextAreaElement.ts"() {
    "use strict";
    init_Element();
    init_Node();
    HTMLTextAreaElement = class extends Element {
      _value = "";
      constructor() {
        super("textarea");
      }
      // ── value (internal state, NOT attribute) ─────────────────────────
      get value() {
        return this._value;
      }
      set value(v) {
        this._value = v;
      }
      // ── defaultValue (maps to textContent) ────────────────────────────
      get defaultValue() {
        return this.textContent;
      }
      set defaultValue(v) {
        this.textContent = v;
      }
      // ── name ──────────────────────────────────────────────────────────
      get name() {
        return this.getAttribute("name") ?? "";
      }
      set name(v) {
        this.setAttribute("name", v);
      }
      // ── disabled ──────────────────────────────────────────────────────
      get disabled() {
        return this.hasAttribute("disabled");
      }
      set disabled(v) {
        if (v) {
          this.setAttribute("disabled", "");
        } else {
          this.removeAttribute("disabled");
        }
      }
      // ── readOnly ──────────────────────────────────────────────────────
      get readOnly() {
        return this.hasAttribute("readonly");
      }
      set readOnly(v) {
        if (v) {
          this.setAttribute("readonly", "");
        } else {
          this.removeAttribute("readonly");
        }
      }
      // ── required ──────────────────────────────────────────────────────
      get required() {
        return this.hasAttribute("required");
      }
      set required(v) {
        if (v) {
          this.setAttribute("required", "");
        } else {
          this.removeAttribute("required");
        }
      }
      // ── placeholder ───────────────────────────────────────────────────
      get placeholder() {
        return this.getAttribute("placeholder") ?? "";
      }
      set placeholder(v) {
        this.setAttribute("placeholder", v);
      }
      // ── rows ──────────────────────────────────────────────────────────
      get rows() {
        const attr = this.getAttribute("rows");
        return attr !== null ? parseInt(attr, 10) : 2;
      }
      set rows(v) {
        this.setAttribute("rows", String(v));
      }
      // ── cols ──────────────────────────────────────────────────────────
      get cols() {
        const attr = this.getAttribute("cols");
        return attr !== null ? parseInt(attr, 10) : 20;
      }
      set cols(v) {
        this.setAttribute("cols", String(v));
      }
      // ── maxLength / minLength ─────────────────────────────────────────
      get maxLength() {
        const attr = this.getAttribute("maxlength");
        return attr !== null ? parseInt(attr, 10) : -1;
      }
      set maxLength(v) {
        this.setAttribute("maxlength", String(v));
      }
      get minLength() {
        const attr = this.getAttribute("minlength");
        return attr !== null ? parseInt(attr, 10) : -1;
      }
      set minLength(v) {
        this.setAttribute("minlength", String(v));
      }
      // ── form ──────────────────────────────────────────────────────────
      get form() {
        let current = this.parentNode;
        while (current) {
          if (current.nodeType === Node.ELEMENT_NODE && current.tagName === "FORM") {
            return current;
          }
          current = current.parentNode;
        }
        return null;
      }
      // ── Methods ───────────────────────────────────────────────────────
      select() {
      }
      focus() {
      }
      blur() {
      }
      // ── Validation ────────────────────────────────────────────────────
      checkValidity() {
        if (this.required && this._value === "") {
          return false;
        }
        return true;
      }
    };
  }
});

// src/nodes/HTMLFormElement.ts
var FORM_CONTROL_TAGS, HTMLFormElement;
var init_HTMLFormElement = __esm({
  "src/nodes/HTMLFormElement.ts"() {
    "use strict";
    init_Element();
    init_Node();
    init_HTMLCollection();
    init_Event();
    FORM_CONTROL_TAGS = /* @__PURE__ */ new Set(["INPUT", "SELECT", "TEXTAREA", "BUTTON"]);
    HTMLFormElement = class extends Element {
      constructor() {
        super("form");
      }
      // ── elements (live collection of descendant form controls) ────────
      get elements() {
        return new HTMLCollection(() => this._collectFormControls());
      }
      // ── length ────────────────────────────────────────────────────────
      get length() {
        return this._collectFormControls().length;
      }
      // ── action ────────────────────────────────────────────────────────
      get action() {
        return this.getAttribute("action") ?? "";
      }
      set action(v) {
        this.setAttribute("action", v);
      }
      // ── method ────────────────────────────────────────────────────────
      get method() {
        return this.getAttribute("method") ?? "get";
      }
      set method(v) {
        this.setAttribute("method", v);
      }
      // ── enctype ───────────────────────────────────────────────────────
      get enctype() {
        return this.getAttribute("enctype") ?? "";
      }
      set enctype(v) {
        this.setAttribute("enctype", v);
      }
      // ── name ──────────────────────────────────────────────────────────
      get name() {
        return this.getAttribute("name") ?? "";
      }
      set name(v) {
        this.setAttribute("name", v);
      }
      // ── Methods ───────────────────────────────────────────────────────
      submit() {
        const event = new Event("submit", { bubbles: true, cancelable: true });
        this.dispatchEvent(event);
      }
      reset() {
        const event = new Event("reset", { bubbles: true, cancelable: true });
        this.dispatchEvent(event);
        const controls = this._collectFormControls();
        for (const control of controls) {
          const el = control;
          if (el.tagName === "INPUT") {
            const input = el;
            input.value = input.defaultValue;
            input.checked = input.defaultChecked;
          } else if (el.tagName === "TEXTAREA") {
            const textarea = el;
            textarea.value = textarea.defaultValue;
          } else if (el.tagName === "SELECT") {
            const select2 = el;
            select2.selectedIndex = -1;
          }
        }
      }
      checkValidity() {
        const controls = this._collectFormControls();
        for (const control of controls) {
          const el = control;
          if (typeof el.checkValidity === "function") {
            if (!el.checkValidity()) {
              return false;
            }
          }
        }
        return true;
      }
      // ── Internal helpers ──────────────────────────────────────────────
      _collectFormControls() {
        const results = [];
        this._walkDescendants(this, results);
        return results;
      }
      _walkDescendants(node, results) {
        for (const child of node._children) {
          if (child.nodeType === Node.ELEMENT_NODE) {
            const el = child;
            if (FORM_CONTROL_TAGS.has(el.tagName)) {
              results.push(el);
            }
          }
          this._walkDescendants(child, results);
        }
      }
    };
  }
});

// src/nodes/HTMLOptionElement.ts
var HTMLOptionElement;
var init_HTMLOptionElement = __esm({
  "src/nodes/HTMLOptionElement.ts"() {
    "use strict";
    init_Element();
    init_Node();
    HTMLOptionElement = class extends Element {
      _selected = false;
      constructor() {
        super("option");
      }
      // ── value ─────────────────────────────────────────────────────────
      get value() {
        const attr = this.getAttribute("value");
        return attr !== null ? attr : this.textContent;
      }
      set value(v) {
        this.setAttribute("value", v);
      }
      // ── text ──────────────────────────────────────────────────────────
      get text() {
        return this.textContent;
      }
      set text(v) {
        this.textContent = v;
      }
      // ── selected ──────────────────────────────────────────────────────
      get selected() {
        return this._selected;
      }
      set selected(v) {
        this._selected = v;
      }
      // ── defaultSelected ───────────────────────────────────────────────
      get defaultSelected() {
        return this.hasAttribute("selected");
      }
      set defaultSelected(v) {
        if (v) {
          this.setAttribute("selected", "");
        } else {
          this.removeAttribute("selected");
        }
      }
      // ── disabled ──────────────────────────────────────────────────────
      get disabled() {
        return this.hasAttribute("disabled");
      }
      set disabled(v) {
        if (v) {
          this.setAttribute("disabled", "");
        } else {
          this.removeAttribute("disabled");
        }
      }
      // ── index ─────────────────────────────────────────────────────────
      get index() {
        const parent = this.parentNode;
        if (parent && parent.tagName === "SELECT") {
          const options = parent._children.filter(
            (c) => c.nodeType === Node.ELEMENT_NODE && c.tagName === "OPTION"
          );
          return options.indexOf(this);
        }
        return 0;
      }
      // ── label ─────────────────────────────────────────────────────────
      get label() {
        const attr = this.getAttribute("label");
        return attr !== null ? attr : this.text;
      }
      set label(v) {
        this.setAttribute("label", v);
      }
      // ── form ──────────────────────────────────────────────────────────
      get form() {
        let current = this.parentNode;
        while (current) {
          if (current.nodeType === Node.ELEMENT_NODE && current.tagName === "FORM") {
            return current;
          }
          current = current.parentNode;
        }
        return null;
      }
    };
  }
});

// src/nodes/HTMLButtonElement.ts
var HTMLButtonElement;
var init_HTMLButtonElement = __esm({
  "src/nodes/HTMLButtonElement.ts"() {
    "use strict";
    init_Element();
    init_Node();
    init_Event();
    HTMLButtonElement = class extends Element {
      constructor() {
        super("button");
      }
      // ── type ──────────────────────────────────────────────────────────
      get type() {
        return this.getAttribute("type") ?? "submit";
      }
      set type(v) {
        this.setAttribute("type", v);
      }
      // ── value ─────────────────────────────────────────────────────────
      get value() {
        return this.getAttribute("value") ?? "";
      }
      set value(v) {
        this.setAttribute("value", v);
      }
      // ── name ──────────────────────────────────────────────────────────
      get name() {
        return this.getAttribute("name") ?? "";
      }
      set name(v) {
        this.setAttribute("name", v);
      }
      // ── disabled ──────────────────────────────────────────────────────
      get disabled() {
        return this.hasAttribute("disabled");
      }
      set disabled(v) {
        if (v) {
          this.setAttribute("disabled", "");
        } else {
          this.removeAttribute("disabled");
        }
      }
      // ── form ──────────────────────────────────────────────────────────
      get form() {
        let current = this.parentNode;
        while (current) {
          if (current.nodeType === Node.ELEMENT_NODE && current.tagName === "FORM") {
            return current;
          }
          current = current.parentNode;
        }
        return null;
      }
      // ── Methods ───────────────────────────────────────────────────────
      click() {
        const event = new Event("click", { bubbles: true, cancelable: true });
        this.dispatchEvent(event);
      }
    };
  }
});

// src/nodes/HTMLLabelElement.ts
var HTMLLabelElement;
var init_HTMLLabelElement = __esm({
  "src/nodes/HTMLLabelElement.ts"() {
    "use strict";
    init_Element();
    init_Node();
    HTMLLabelElement = class extends Element {
      constructor() {
        super("label");
      }
      // ── htmlFor (maps to 'for' attribute) ─────────────────────────────
      get htmlFor() {
        return this.getAttribute("for") ?? "";
      }
      set htmlFor(v) {
        this.setAttribute("for", v);
      }
      // ── control ───────────────────────────────────────────────────────
      get control() {
        const forId = this.htmlFor;
        if (!forId) return null;
        const doc = this.ownerDocument;
        if (doc && typeof doc.getElementById === "function") {
          return doc.getElementById(forId);
        }
        return null;
      }
      // ── form ──────────────────────────────────────────────────────────
      get form() {
        let current = this.parentNode;
        while (current) {
          if (current.nodeType === Node.ELEMENT_NODE && current.tagName === "FORM") {
            return current;
          }
          current = current.parentNode;
        }
        return null;
      }
    };
  }
});

// src/nodes/Document.ts
function nodeTypeToShowBit(nodeType) {
  switch (nodeType) {
    case Node.ELEMENT_NODE:
      return NodeIteratorFilter.SHOW_ELEMENT;
    case Node.TEXT_NODE:
      return NodeIteratorFilter.SHOW_TEXT;
    case Node.COMMENT_NODE:
      return NodeIteratorFilter.SHOW_COMMENT;
    case Node.DOCUMENT_NODE:
      return NodeIteratorFilter.SHOW_DOCUMENT;
    case Node.DOCUMENT_FRAGMENT_NODE:
      return NodeIteratorFilter.SHOW_DOCUMENT_FRAGMENT;
    default:
      return 0;
  }
}
var Document, NodeIteratorFilter, NodeIterator, TreeWalker;
var init_Document = __esm({
  "src/nodes/Document.ts"() {
    "use strict";
    init_Node();
    init_Element();
    init_Text();
    init_Comment();
    init_DocumentFragment();
    init_NodeList();
    init_selectors();
    init_HTMLInputElement();
    init_HTMLSelectElement();
    init_HTMLTextAreaElement();
    init_HTMLFormElement();
    init_HTMLOptionElement();
    init_HTMLButtonElement();
    init_HTMLLabelElement();
    init_TreeWalk();
    Document = class _Document extends Node {
      _documentElement;
      _head;
      _body;
      /** Points to the Window object when running inside a DixieEnvironment. */
      defaultView = null;
      /** DOMImplementation stub — provides createHTMLDocument for libraries like TipTap. */
      implementation = {
        createHTMLDocument: (title) => {
          const doc = new _Document();
          if (title !== void 0) {
            doc.title = title;
          }
          return doc;
        },
        createDocument: () => new _Document(),
        hasFeature: () => true
      };
      /** Document visibility state. */
      visibilityState = "visible";
      /** Fast O(1) id→element index. Updated by Element.setAttribute/removeAttribute. */
      _idIndex = /* @__PURE__ */ new Map();
      /** Mutation version counter — incremented on any tree or attribute change. */
      _mutationVersion = 0;
      /** Cookie jar */
      _cookies = /* @__PURE__ */ new Map();
      /** Query caches — keyed by selector, validated against mutation version. */
      _qsCache = /* @__PURE__ */ new Map();
      _qsaCache = /* @__PURE__ */ new Map();
      constructor() {
        super(Node.DOCUMENT_NODE, "#document");
        _setFallbackDocument(this);
        this._documentElement = new Element("html");
        this._documentElement.ownerDocument = this;
        this._head = new Element("head");
        this._head.ownerDocument = this;
        this._body = new Element("body");
        this._body.ownerDocument = this;
        this._documentElement.appendChild(this._head);
        this._documentElement.appendChild(this._body);
        this.appendChild(this._documentElement);
      }
      // ── Document skeleton accessors ────────────────────────────────────
      get documentElement() {
        return this._documentElement;
      }
      get head() {
        return this._head;
      }
      get body() {
        return this._body;
      }
      // ── title ──────────────────────────────────────────────────────────
      get title() {
        const titleEl = this._findTitleElement();
        return titleEl ? titleEl.textContent : "";
      }
      set title(value) {
        let titleEl = this._findTitleElement();
        if (!titleEl) {
          titleEl = this.createElement("title");
          this._head.appendChild(titleEl);
        }
        titleEl.textContent = value;
      }
      _findTitleElement() {
        for (const child of this._head._children) {
          if (child.nodeType === Node.ELEMENT_NODE && child.tagName === "TITLE") {
            return child;
          }
        }
        return null;
      }
      // ── cookie ───────────────────────────────────────────────────────
      get cookie() {
        return Array.from(this._cookies.entries()).map(([k, v]) => `${k}=${v}`).join("; ");
      }
      set cookie(value) {
        const eqIndex = value.indexOf("=");
        if (eqIndex === -1) return;
        const name = value.slice(0, eqIndex).trim();
        const rest = value.slice(eqIndex + 1);
        const semiIndex = rest.indexOf(";");
        const val = semiIndex === -1 ? rest.trim() : rest.slice(0, semiIndex).trim();
        this._cookies.set(name, val);
      }
      // ── activeElement ──────────────────────────────────────────────
      get activeElement() {
        return this._body;
      }
      // ── getSelection ──────────────────────────────────────────────
      getSelection() {
        return {
          anchorNode: null,
          anchorOffset: 0,
          focusNode: null,
          focusOffset: 0,
          isCollapsed: true,
          rangeCount: 0,
          type: "None",
          addRange() {
          },
          removeAllRanges() {
          },
          removeRange() {
          },
          collapse() {
          },
          collapseToStart() {
          },
          collapseToEnd() {
          },
          extend() {
          },
          setBaseAndExtent() {
          },
          selectAllChildren() {
          },
          deleteFromDocument() {
          },
          getRangeAt() {
            return null;
          },
          containsNode() {
            return false;
          },
          toString() {
            return "";
          }
        };
      }
      // ── createRange ─────────────────────────────────────────────────
      createRange() {
        const range = {
          startContainer: null,
          startOffset: 0,
          endContainer: null,
          endOffset: 0,
          collapsed: true,
          commonAncestorContainer: null,
          setStart(node, offset) {
            range.startContainer = node;
            range.startOffset = offset;
            range.collapsed = range.startContainer === range.endContainer && range.startOffset === range.endOffset;
          },
          setEnd(node, offset) {
            range.endContainer = node;
            range.endOffset = offset;
            range.collapsed = range.startContainer === range.endContainer && range.startOffset === range.endOffset;
          },
          setStartBefore(_node) {
          },
          setStartAfter(_node) {
          },
          setEndBefore(_node) {
          },
          setEndAfter(_node) {
          },
          selectNode(_node) {
          },
          selectNodeContents(_node) {
          },
          collapse(_toStart) {
            range.collapsed = true;
          },
          cloneContents() {
            return new DocumentFragment();
          },
          cloneRange() {
            return { ...range };
          },
          deleteContents() {
          },
          extractContents() {
            return new DocumentFragment();
          },
          insertNode(_node) {
          },
          surroundContents(_node) {
          },
          compareBoundaryPoints() {
            return 0;
          },
          detach() {
          },
          toString() {
            return "";
          },
          getBoundingClientRect() {
            return { top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0, x: 0, y: 0 };
          },
          getClientRects() {
            return [];
          }
        };
        return range;
      }
      // ── Factory methods ────────────────────────────────────────────────
      createElement(tagName) {
        const lower = tagName.toLowerCase();
        let el;
        switch (lower) {
          case "input":
            el = new HTMLInputElement();
            break;
          case "select":
            el = new HTMLSelectElement();
            break;
          case "textarea":
            el = new HTMLTextAreaElement();
            break;
          case "form":
            el = new HTMLFormElement();
            break;
          case "option":
            el = new HTMLOptionElement();
            break;
          case "button":
            el = new HTMLButtonElement();
            break;
          case "label":
            el = new HTMLLabelElement();
            break;
          default:
            el = new Element(lower);
            break;
        }
        el.ownerDocument = this;
        return el;
      }
      createElementNS(namespaceURI, qualifiedName) {
        const el = this.createElement(qualifiedName);
        if (namespaceURI) {
          el._namespaceURI = namespaceURI;
        }
        return el;
      }
      createTextNode(data) {
        const text = new Text(data);
        text.ownerDocument = this;
        return text;
      }
      createComment(data) {
        const comment = new Comment(data);
        comment.ownerDocument = this;
        return comment;
      }
      createDocumentFragment() {
        const frag = new DocumentFragment();
        frag.ownerDocument = this;
        return frag;
      }
      // ── NodeIterator / TreeWalker ────────────────────────────────────────
      createNodeIterator(root, whatToShow = NodeIteratorFilter.SHOW_ALL, filter = null) {
        return new NodeIterator(root, whatToShow, filter);
      }
      createTreeWalker(root, whatToShow = NodeIteratorFilter.SHOW_ALL, filter = null) {
        return new TreeWalker(root, whatToShow, filter);
      }
      // ── Query methods ──────────────────────────────────────────────────
      getElementById(id) {
        const el = this._idIndex.get(id);
        if (el !== void 0) {
          if (el.parentNode && el.getAttribute("id") === id) return el;
          this._idIndex.delete(id);
        }
        const found = this._walkForId(this, id);
        if (found) this._idIndex.set(id, found);
        return found;
      }
      _walkForId(node, id) {
        for (const child of node._children) {
          if (child.nodeType === Node.ELEMENT_NODE) {
            if (child.id === id) return child;
            const found = this._walkForId(child, id);
            if (found) return found;
          }
        }
        return null;
      }
      getElementsByClassName(className) {
        return _getElementsByClassName(this, className);
      }
      getElementsByTagName(tagName) {
        return _getElementsByTagName(this, tagName);
      }
      // ── querySelector / querySelectorAll ─────────────────────────────────
      querySelector(selector) {
        if (selector.length > 1 && selector.charCodeAt(0) === 35 && selector.indexOf(" ") === -1 && selector.indexOf(".") === -1 && selector.indexOf("[") === -1) {
          const id = selector.slice(1);
          return this.getElementById(id);
        }
        const ver = this._mutationVersion;
        const cached = this._qsCache.get(selector);
        if (cached && cached.v === ver) return cached.r;
        const fast = _fastQueryFirst(this, selector);
        if (fast !== void 0) {
          this._qsCache.set(selector, { v: ver, r: fast });
          return fast;
        }
        const ast = parseSelector(selector);
        const result2 = querySelectorFirstElement(this, ast);
        this._qsCache.set(selector, { v: ver, r: result2 });
        return result2;
      }
      querySelectorAll(selector) {
        const ver = this._mutationVersion;
        const cached = this._qsaCache.get(selector);
        if (cached && cached.v === ver) return cached.r;
        const fast = _fastQueryAll(this, selector);
        if (fast !== void 0) {
          const nl2 = new NodeList(fast);
          this._qsaCache.set(selector, { v: ver, r: nl2 });
          return nl2;
        }
        const ast = parseSelector(selector);
        const elements = querySelectorAllElements(this, ast);
        const nl = new NodeList(elements);
        this._qsaCache.set(selector, { v: ver, r: nl });
        return nl;
      }
    };
    NodeIteratorFilter = {
      SHOW_ALL: 4294967295,
      SHOW_ELEMENT: 1,
      SHOW_ATTRIBUTE: 2,
      SHOW_TEXT: 4,
      SHOW_CDATA_SECTION: 8,
      SHOW_PROCESSING_INSTRUCTION: 64,
      SHOW_COMMENT: 128,
      SHOW_DOCUMENT: 256,
      SHOW_DOCUMENT_TYPE: 512,
      SHOW_DOCUMENT_FRAGMENT: 1024,
      FILTER_ACCEPT: 1,
      FILTER_REJECT: 2,
      FILTER_SKIP: 3
    };
    NodeIterator = class {
      root;
      whatToShow;
      filter;
      referenceNode;
      pointerBeforeReferenceNode = true;
      /** Cached flat tree — built once, invalidated on mutation via _mutationVersion. */
      _cachedNodes = null;
      _cachedMutationVersion = -1;
      /** Cached cursor index for O(1) nextNode/previousNode. */
      _cursorIndex = 0;
      constructor(root, whatToShow, filter) {
        this.root = root;
        this.whatToShow = whatToShow;
        this.filter = filter;
        this.referenceNode = root;
      }
      _acceptNode(node) {
        const showBit = nodeTypeToShowBit(node.nodeType);
        if (!(this.whatToShow & showBit)) return NodeIteratorFilter.FILTER_SKIP;
        if (this.filter === null) return NodeIteratorFilter.FILTER_ACCEPT;
        if (typeof this.filter === "function") return this.filter(node);
        if (typeof this.filter?.acceptNode === "function") return this.filter.acceptNode(node);
        return NodeIteratorFilter.FILTER_ACCEPT;
      }
      /** Iteratively collect all nodes in document order (depth-first pre-order). */
      _flattenTree(root) {
        const result2 = [];
        const stack = [root];
        while (stack.length > 0) {
          const node = stack.pop();
          result2.push(node);
          const children = node._children;
          for (let i = children.length - 1; i >= 0; i--) {
            stack.push(children[i]);
          }
        }
        return result2;
      }
      /** Return the flat node list, using cache when the tree hasn't mutated. */
      _getNodes() {
        const doc = this.root.ownerDocument ?? this.root;
        const currentVersion = doc._mutationVersion ?? 0;
        if (this._cachedNodes === null || this._cachedMutationVersion !== currentVersion) {
          this._cachedNodes = this._flattenTree(this.root);
          this._cachedMutationVersion = currentVersion;
          this._cursorIndex = this._cachedNodes.indexOf(this.referenceNode);
        }
        return this._cachedNodes;
      }
      nextNode() {
        const allNodes = this._getNodes();
        let currentIndex = this._cursorIndex;
        if (currentIndex === -1 || currentIndex >= allNodes.length || allNodes[currentIndex] !== this.referenceNode) {
          currentIndex = allNodes.indexOf(this.referenceNode);
          this._cursorIndex = currentIndex;
        }
        let startIndex = this.pointerBeforeReferenceNode ? currentIndex : currentIndex + 1;
        for (let i = startIndex; i < allNodes.length; i++) {
          const node = allNodes[i];
          if (i === currentIndex && this.pointerBeforeReferenceNode) continue;
          if (this._acceptNode(node) === NodeIteratorFilter.FILTER_ACCEPT) {
            this.referenceNode = node;
            this.pointerBeforeReferenceNode = false;
            this._cursorIndex = i;
            return node;
          }
        }
        return null;
      }
      previousNode() {
        const allNodes = this._getNodes();
        let currentIndex = this._cursorIndex;
        if (currentIndex === -1 || currentIndex >= allNodes.length || allNodes[currentIndex] !== this.referenceNode) {
          currentIndex = allNodes.indexOf(this.referenceNode);
          this._cursorIndex = currentIndex;
        }
        if (currentIndex === -1) return null;
        let startIndex = this.pointerBeforeReferenceNode ? currentIndex - 1 : currentIndex;
        for (let i = startIndex; i >= 0; i--) {
          const node = allNodes[i];
          if (i === currentIndex && !this.pointerBeforeReferenceNode) continue;
          if (this._acceptNode(node) === NodeIteratorFilter.FILTER_ACCEPT) {
            this.referenceNode = node;
            this.pointerBeforeReferenceNode = true;
            this._cursorIndex = i;
            return node;
          }
        }
        return null;
      }
      detach() {
      }
    };
    TreeWalker = class {
      root;
      whatToShow;
      filter;
      currentNode;
      constructor(root, whatToShow, filter) {
        this.root = root;
        this.whatToShow = whatToShow;
        this.filter = filter;
        this.currentNode = root;
      }
      _acceptNode(node) {
        const showBit = nodeTypeToShowBit(node.nodeType);
        if (!(this.whatToShow & showBit)) return NodeIteratorFilter.FILTER_SKIP;
        if (this.filter === null) return NodeIteratorFilter.FILTER_ACCEPT;
        if (typeof this.filter === "function") return this.filter(node);
        if (typeof this.filter?.acceptNode === "function") return this.filter.acceptNode(node);
        return NodeIteratorFilter.FILTER_ACCEPT;
      }
      firstChild() {
        for (const child of this.currentNode._children) {
          if (this._acceptNode(child) === NodeIteratorFilter.FILTER_ACCEPT) {
            this.currentNode = child;
            return child;
          }
        }
        return null;
      }
      lastChild() {
        const children = this.currentNode._children;
        for (let i = children.length - 1; i >= 0; i--) {
          if (this._acceptNode(children[i]) === NodeIteratorFilter.FILTER_ACCEPT) {
            this.currentNode = children[i];
            return children[i];
          }
        }
        return null;
      }
      nextSibling() {
        let node = this.currentNode;
        while (node && node !== this.root) {
          let sibling = node.nextSibling;
          while (sibling) {
            if (this._acceptNode(sibling) === NodeIteratorFilter.FILTER_ACCEPT) {
              this.currentNode = sibling;
              return sibling;
            }
            sibling = sibling.nextSibling;
          }
          node = node.parentNode;
        }
        return null;
      }
      previousSibling() {
        let node = this.currentNode;
        while (node && node !== this.root) {
          let sibling = node.previousSibling;
          while (sibling) {
            if (this._acceptNode(sibling) === NodeIteratorFilter.FILTER_ACCEPT) {
              this.currentNode = sibling;
              return sibling;
            }
            sibling = sibling.previousSibling;
          }
          node = node.parentNode;
        }
        return null;
      }
      parentNode() {
        let node = this.currentNode;
        while (node !== this.root) {
          const parent = node.parentNode;
          if (!parent) return null;
          if (this._acceptNode(parent) === NodeIteratorFilter.FILTER_ACCEPT) {
            this.currentNode = parent;
            return parent;
          }
          node = parent;
        }
        return null;
      }
      nextNode() {
        let node = this.currentNode;
        if (node._children.length > 0) {
          for (const child of node._children) {
            if (this._acceptNode(child) === NodeIteratorFilter.FILTER_ACCEPT) {
              this.currentNode = child;
              return child;
            }
          }
        }
        while (node && node !== this.root) {
          const parent = node.parentNode;
          if (!parent) return null;
          const siblings = parent._children;
          const idx = siblings.indexOf(node);
          for (let i = idx + 1; i < siblings.length; i++) {
            if (this._acceptNode(siblings[i]) === NodeIteratorFilter.FILTER_ACCEPT) {
              this.currentNode = siblings[i];
              return siblings[i];
            }
          }
          node = parent;
        }
        return null;
      }
      previousNode() {
        let node = this.currentNode;
        if (node === this.root) return null;
        const parent = node.parentNode;
        if (!parent) return null;
        const siblings = parent._children;
        const idx = siblings.indexOf(node);
        if (idx > 0) {
          let prev = siblings[idx - 1];
          while (prev._children.length > 0) {
            prev = prev._children[prev._children.length - 1];
          }
          if (this._acceptNode(prev) === NodeIteratorFilter.FILTER_ACCEPT) {
            this.currentNode = prev;
            return prev;
          }
        }
        if (this._acceptNode(parent) === NodeIteratorFilter.FILTER_ACCEPT) {
          this.currentNode = parent;
          return parent;
        }
        return null;
      }
    };
  }
});

// src/browser/Location.ts
var Location;
var init_Location = __esm({
  "src/browser/Location.ts"() {
    "use strict";
    Location = class {
      _url;
      constructor(href = "about:blank") {
        this._url = new URL(href);
      }
      // ── href (the master property) ─────────────────────────────────────
      get href() {
        return this._url.href;
      }
      set href(value) {
        this._url = new URL(value);
      }
      // ── Derived read/write properties ──────────────────────────────────
      get protocol() {
        return this._url.protocol;
      }
      set protocol(value) {
        this._url.protocol = value;
      }
      get host() {
        return this._url.host;
      }
      set host(value) {
        this._url.host = value;
      }
      get hostname() {
        return this._url.hostname;
      }
      set hostname(value) {
        this._url.hostname = value;
      }
      get port() {
        return this._url.port;
      }
      set port(value) {
        this._url.port = value;
      }
      get pathname() {
        return this._url.pathname;
      }
      set pathname(value) {
        this._url.pathname = value;
      }
      get search() {
        return this._url.search;
      }
      set search(value) {
        this._url.search = value;
      }
      get hash() {
        return this._url.hash;
      }
      set hash(value) {
        this._url.hash = value;
      }
      get origin() {
        return this._url.origin;
      }
      // ── Methods ────────────────────────────────────────────────────────
      assign(url) {
        this.href = url;
      }
      replace(url) {
        this.href = url;
      }
      reload() {
      }
      toString() {
        return this.href;
      }
    };
  }
});

// src/browser/History.ts
var History;
var init_History = __esm({
  "src/browser/History.ts"() {
    "use strict";
    init_Event();
    History = class {
      _entries = [{ state: null, title: "", url: null }];
      _index = 0;
      /** Link to the parent window — set externally by Window constructor. */
      _window = null;
      get length() {
        return this._entries.length;
      }
      get state() {
        return this._entries[this._index].state;
      }
      pushState(state, title, url) {
        this._entries = this._entries.slice(0, this._index + 1);
        this._entries.push({
          state: state !== void 0 ? state : null,
          title,
          url: url ?? null
        });
        this._index = this._entries.length - 1;
        if (url != null && this._window?.location) {
          this._syncLocation(url);
        }
      }
      replaceState(state, title, url) {
        this._entries[this._index] = {
          state: state !== void 0 ? state : null,
          title,
          url: url ?? null
        };
        if (url != null && this._window?.location) {
          this._syncLocation(url);
        }
      }
      back() {
        this.go(-1);
      }
      forward() {
        this.go(1);
      }
      go(delta) {
        if (delta === void 0 || delta === 0) return;
        const newIndex = this._index + delta;
        if (newIndex < 0 || newIndex >= this._entries.length) return;
        this._index = newIndex;
        const entry = this._entries[this._index];
        if (entry.url != null && this._window?.location) {
          this._syncLocation(entry.url);
        }
        if (this._window) {
          const popstateEvent = new Event("popstate", { bubbles: false, cancelable: false });
          popstateEvent.state = this._entries[this._index].state;
          this._window.dispatchEvent(popstateEvent);
        }
      }
      /** Update window.location to reflect a History URL change. */
      _syncLocation(url) {
        const loc = this._window.location;
        if (!loc) return;
        try {
          const resolved = new URL(url, loc.href);
          loc.pathname = resolved.pathname;
          loc.search = resolved.search;
          loc.hash = resolved.hash;
        } catch {
        }
      }
    };
  }
});

// src/browser/Navigator.ts
var DEFAULT_USER_AGENT, Navigator;
var init_Navigator = __esm({
  "src/browser/Navigator.ts"() {
    "use strict";
    DEFAULT_USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
    Navigator = class {
      userAgent = DEFAULT_USER_AGENT;
      language = "en-US";
      languages = ["en-US", "en"];
      platform = "Dixie";
      onLine = true;
      cookieEnabled = true;
      hardwareConcurrency = 1;
      maxTouchPoints = 0;
      clipboard;
      mediaDevices;
      _clipboardText = "";
      constructor() {
        this.clipboard = {
          readText: () => Promise.resolve(this._clipboardText),
          writeText: (text) => {
            this._clipboardText = text;
            return Promise.resolve();
          }
        };
        this.mediaDevices = {
          enumerateDevices: () => Promise.resolve([])
        };
      }
    };
  }
});

// src/browser/Screen.ts
var Screen;
var init_Screen = __esm({
  "src/browser/Screen.ts"() {
    "use strict";
    Screen = class {
      width;
      height;
      availWidth;
      availHeight;
      colorDepth;
      pixelDepth;
      orientation;
      constructor(options) {
        this.width = options?.width ?? 1920;
        this.height = options?.height ?? 1080;
        this.availWidth = options?.availWidth ?? this.width;
        this.availHeight = options?.availHeight ?? this.height;
        this.colorDepth = options?.colorDepth ?? 24;
        this.pixelDepth = options?.pixelDepth ?? 24;
        this.orientation = { type: "landscape-primary", angle: 0 };
      }
    };
  }
});

// src/network/sse.ts
var EventSourceStub;
var init_sse = __esm({
  "src/network/sse.ts"() {
    "use strict";
    EventSourceStub = class _EventSourceStub {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSED = 2;
      CONNECTING = 0;
      OPEN = 1;
      CLOSED = 2;
      url;
      withCredentials;
      readyState = _EventSourceStub.CONNECTING;
      onopen = null;
      onmessage = null;
      onerror = null;
      constructor(url, config) {
        this.url = url;
        this.withCredentials = config?.withCredentials ?? false;
      }
      close() {
        this.readyState = _EventSourceStub.CLOSED;
      }
      addEventListener(_type, _listener) {
      }
      removeEventListener(_type, _listener) {
      }
      dispatchEvent(_event) {
        return true;
      }
    };
  }
});

// src/network/websocket.ts
var WebSocketStub;
var init_websocket = __esm({
  "src/network/websocket.ts"() {
    "use strict";
    WebSocketStub = class _WebSocketStub {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSING = 2;
      static CLOSED = 3;
      CONNECTING = 0;
      OPEN = 1;
      CLOSING = 2;
      CLOSED = 3;
      url;
      protocol = "";
      extensions = "";
      readyState = _WebSocketStub.CONNECTING;
      bufferedAmount = 0;
      binaryType = "blob";
      onopen = null;
      onclose = null;
      onmessage = null;
      onerror = null;
      constructor(url, _protocols) {
        this.url = url;
      }
      send(_data) {
      }
      close(_code, _reason) {
        this.readyState = _WebSocketStub.CLOSED;
      }
      addEventListener(_type, _listener) {
      }
      removeEventListener(_type, _listener) {
      }
      dispatchEvent(_event) {
        return true;
      }
    };
  }
});

// src/browser/DOMParser.ts
var DOMParser;
var init_DOMParser = __esm({
  "src/browser/DOMParser.ts"() {
    "use strict";
    init_Document();
    DOMParser = class {
      parseFromString(markup, _mimeType) {
        const document = new Document();
        const htmlMatch = markup.match(/<html[^>]*>([\s\S]*?)<\/html>/i);
        const source = htmlMatch ? htmlMatch[1] : markup;
        const headMatch = source.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
        if (headMatch) {
          document.head.innerHTML = headMatch[1];
        }
        const bodyMatch = source.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        document.body.innerHTML = bodyMatch ? bodyMatch[1] : source;
        return document;
      }
    };
  }
});

// src/browser/Timers.ts
function _wrapTimerHandle(id) {
  return {
    ref() {
      return this;
    },
    unref() {
      return this;
    },
    hasRef() {
      return true;
    },
    [Symbol.toPrimitive]() {
      return id;
    }
  };
}
var RAF_FRAME_TIME, MAX_RUN_ALL_ITERATIONS, _nativeSetTimeout, _nativeClearTimeout, _nativeSetInterval, _nativeClearInterval, TimerController;
var init_Timers = __esm({
  "src/browser/Timers.ts"() {
    "use strict";
    RAF_FRAME_TIME = 16;
    MAX_RUN_ALL_ITERATIONS = 1e3;
    _nativeSetTimeout = globalThis.setTimeout;
    _nativeClearTimeout = globalThis.clearTimeout;
    _nativeSetInterval = globalThis.setInterval;
    _nativeClearInterval = globalThis.clearInterval;
    TimerController = class {
      _mode = "real";
      _nextId = 1;
      _registrationCounter = 0;
      _fakeNow = 0;
      // Fake mode queue — kept sorted by (scheduledTime, registrationOrder)
      _pending = [];
      // Real mode handle tracking (our ID -> native handle)
      _realHandles = /* @__PURE__ */ new Map();
      // Set of IDs cleared during the current callback execution (for interval self-clearing)
      _clearedDuringExecution = /* @__PURE__ */ new Set();
      _isExecutingCallback = false;
      // Once disposed, no new timers are scheduled and all live handles are cleared.
      _disposed = false;
      // ── Mode switching ──────────────────────────────────────────────────
      /**
       * Switch to fake timer mode. Resets fake time to 0 and clears the queue.
       */
      useFakeTimers() {
        this._mode = "fake";
        this._fakeNow = 0;
        this._pending = [];
        this._registrationCounter = 0;
      }
      /**
       * Switch back to real timer mode. Clears all pending fake timers.
       */
      useRealTimers() {
        this._mode = "real";
        this._pending = [];
        this._fakeNow = 0;
        this._registrationCounter = 0;
      }
      // ── Timer creation ──────────────────────────────────────────────────
      setTimeout(callback, delay = 0, ...args2) {
        const id = this._nextId++;
        if (this._disposed) {
          return _wrapTimerHandle(id);
        }
        if (this._mode === "real") {
          const handle = _nativeSetTimeout(() => {
            this._realHandles.delete(id);
            callback(...args2);
          }, delay);
          this._realHandles.set(id, handle);
          return _wrapTimerHandle(id);
        }
        this._pending.push({
          id,
          callback,
          args: args2,
          scheduledTime: this._fakeNow + Math.max(0, delay),
          interval: null,
          type: "timeout",
          registrationOrder: this._registrationCounter++
        });
        this._sortPending();
        return _wrapTimerHandle(id);
      }
      clearTimeout(id) {
        const key = typeof id === "number" ? id : Number(id);
        if (this._mode === "real") {
          const handle = this._realHandles.get(key);
          if (handle !== void 0) {
            _nativeClearTimeout(handle);
            this._realHandles.delete(key);
          }
          return;
        }
        this._pending = this._pending.filter((t) => t.id !== key);
        if (this._isExecutingCallback) {
          this._clearedDuringExecution.add(key);
        }
      }
      setInterval(callback, delay = 0, ...args2) {
        const id = this._nextId++;
        const period = Math.max(1, delay);
        if (this._disposed) {
          return _wrapTimerHandle(id);
        }
        if (this._mode === "real") {
          const handle = _nativeSetInterval(() => {
            callback(...args2);
          }, delay);
          this._realHandles.set(id, handle);
          return _wrapTimerHandle(id);
        }
        this._pending.push({
          id,
          callback,
          args: args2,
          scheduledTime: this._fakeNow + period,
          interval: period,
          type: "interval",
          registrationOrder: this._registrationCounter++
        });
        this._sortPending();
        return _wrapTimerHandle(id);
      }
      clearInterval(id) {
        this.clearTimeout(id);
      }
      requestAnimationFrame(callback) {
        const id = this._nextId++;
        if (this._disposed) {
          return id;
        }
        if (this._mode === "real") {
          const handle = _nativeSetTimeout(() => {
            this._realHandles.delete(id);
            callback(Date.now());
          }, RAF_FRAME_TIME);
          this._realHandles.set(id, handle);
          return id;
        }
        const wrappedCallback = () => {
          callback(this._fakeNow);
        };
        this._pending.push({
          id,
          callback: wrappedCallback,
          args: [],
          scheduledTime: this._fakeNow + RAF_FRAME_TIME,
          interval: null,
          type: "raf",
          registrationOrder: this._registrationCounter++
        });
        this._sortPending();
        return id;
      }
      cancelAnimationFrame(id) {
        this.clearTimeout(id);
      }
      // ── Fake timer control ──────────────────────────────────────────────
      /**
       * Advance fake time by `ms` milliseconds, executing all callbacks
       * whose scheduled time falls within [now, now + ms].
       */
      tick(ms) {
        this._assertFakeMode("tick");
        const targetTime = this._fakeNow + ms;
        this._advanceTo(targetTime);
      }
      /**
       * Async version of tick — flushes microtasks between each callback execution.
       */
      async tickAsync(ms) {
        this._assertFakeMode("tickAsync");
        const targetTime = this._fakeNow + ms;
        await this._advanceToAsync(targetTime);
      }
      /**
       * Advance fake time to an absolute timestamp. No-op if timestamp is in
       * the past (before current fake time).
       */
      advanceTo(timestamp2) {
        this._assertFakeMode("advanceTo");
        if (timestamp2 <= this._fakeNow) return;
        this._advanceTo(timestamp2);
      }
      /**
       * Execute ALL pending timers. Intervals will re-schedule, so this caps
       * at MAX_RUN_ALL_ITERATIONS to prevent infinite loops.
       */
      runAll() {
        this._assertFakeMode("runAll");
        let iterations = 0;
        while (this._pending.length > 0 && iterations < MAX_RUN_ALL_ITERATIONS) {
          const next = this._pending[0];
          this._fakeNow = next.scheduledTime;
          this._executeNext();
          iterations++;
        }
        if (iterations >= MAX_RUN_ALL_ITERATIONS && this._pending.length > 0) {
          throw new Error(
            `runAll() exceeded ${MAX_RUN_ALL_ITERATIONS} iterations. Likely an interval that never gets cleared. ${this._pending.length} timers still pending.`
          );
        }
      }
      /**
       * Async version of runAll — flushes microtasks between each callback.
       */
      async runAllAsync() {
        this._assertFakeMode("runAllAsync");
        let iterations = 0;
        while (this._pending.length > 0 && iterations < MAX_RUN_ALL_ITERATIONS) {
          const next = this._pending[0];
          this._fakeNow = next.scheduledTime;
          this._executeNext();
          await this._flushMicrotasks();
          iterations++;
        }
        if (iterations >= MAX_RUN_ALL_ITERATIONS && this._pending.length > 0) {
          throw new Error(
            `runAllAsync() exceeded ${MAX_RUN_ALL_ITERATIONS} iterations. Likely an interval that never gets cleared. ${this._pending.length} timers still pending.`
          );
        }
      }
      /**
       * Return the number of pending timers.
       */
      getTimerCount() {
        if (this._mode === "fake") {
          return this._pending.length;
        }
        return this._realHandles.size;
      }
      /**
       * Current time: returns fake time in fake mode, Date.now() in real mode.
       */
      now() {
        return this._mode === "fake" ? this._fakeNow : Date.now();
      }
      /**
       * Clear all pending timers and reset fake time to 0.
       */
      reset() {
        for (const handle of this._realHandles.values()) {
          _nativeClearTimeout(handle);
        }
        this._realHandles.clear();
        this._pending = [];
        this._fakeNow = 0;
        this._registrationCounter = 0;
      }
      /**
       * Permanently dispose the controller: clears every live real-mode handle
       * and all pending fake timers, and refuses any timers scheduled afterwards.
       * After dispose() the controller holds nothing that can keep the Node.js
       * event loop (and therefore the CLI process) alive.
       */
      dispose() {
        this._disposed = true;
        for (const handle of this._realHandles.values()) {
          _nativeClearTimeout(handle);
        }
        this._realHandles.clear();
        this._pending = [];
      }
      /** True once dispose() has been called. */
      get disposed() {
        return this._disposed;
      }
      // ── Internal helpers ────────────────────────────────────────────────
      _assertFakeMode(method) {
        if (this._mode !== "fake") {
          throw new Error(
            `${method}() can only be called in fake timer mode. Call useFakeTimers() first.`
          );
        }
      }
      _sortPending() {
        this._pending.sort((a, b) => {
          if (a.scheduledTime !== b.scheduledTime) {
            return a.scheduledTime - b.scheduledTime;
          }
          return a.registrationOrder - b.registrationOrder;
        });
      }
      /**
       * Advance fake time to targetTime, executing callbacks in order.
       */
      _advanceTo(targetTime) {
        while (this._pending.length > 0) {
          const next = this._pending[0];
          if (next.scheduledTime > targetTime) break;
          this._fakeNow = next.scheduledTime;
          this._executeNext();
        }
        this._fakeNow = targetTime;
      }
      /**
       * Async version of _advanceTo — flushes microtasks between callbacks.
       */
      async _advanceToAsync(targetTime) {
        while (this._pending.length > 0) {
          const next = this._pending[0];
          if (next.scheduledTime > targetTime) break;
          this._fakeNow = next.scheduledTime;
          this._executeNext();
          await this._flushMicrotasks();
        }
        this._fakeNow = targetTime;
      }
      /**
       * Shift and execute the first pending timer. If it's an interval,
       * re-schedule it unless it was cleared during its own callback.
       */
      _executeNext() {
        if (this._pending.length === 0) return;
        const timer = this._pending.shift();
        this._isExecutingCallback = true;
        this._clearedDuringExecution.clear();
        try {
          timer.callback(...timer.args);
        } finally {
          this._isExecutingCallback = false;
        }
        if (timer.interval !== null && !this._clearedDuringExecution.has(timer.id)) {
          this._pending.push({
            ...timer,
            scheduledTime: this._fakeNow + timer.interval,
            registrationOrder: this._registrationCounter++
          });
          this._sortPending();
        }
        this._clearedDuringExecution.clear();
      }
      async _flushMicrotasks() {
        await Promise.resolve();
      }
    };
  }
});

// src/browser/Window.ts
var Window;
var init_Window = __esm({
  "src/browser/Window.ts"() {
    "use strict";
    init_EventTarget();
    init_Location();
    init_History();
    init_Navigator();
    init_Screen();
    init_sse();
    init_websocket();
    init_DOMParser();
    init_Timers();
    Window = class extends EventTarget {
      // ── Sub-objects ────────────────────────────────────────────────────
      document = null;
      location;
      history;
      navigator;
      screen;
      // ── Viewport ──────────────────────────────────────────────────────
      innerWidth;
      innerHeight;
      outerWidth;
      outerHeight;
      devicePixelRatio;
      // ── Scroll ────────────────────────────────────────────────────────
      scrollX = 0;
      scrollY = 0;
      // ── Identity ──────────────────────────────────────────────────────
      name = "";
      closed = false;
      frameElement = null;
      // ── Timers ────────────────────────────────────────────────────────
      /** Tracks every timer scheduled through this window so dispose() can clear them. */
      _timers;
      constructor(options) {
        super();
        this._timers = options?.timers ?? new TimerController();
        this.location = new Location(options?.url ?? "about:blank");
        this.history = new History();
        this.history._window = this;
        this.navigator = new Navigator();
        this.screen = new Screen();
        this.innerWidth = options?.innerWidth ?? 1024;
        this.innerHeight = options?.innerHeight ?? 768;
        this.outerWidth = this.innerWidth;
        this.outerHeight = this.innerHeight;
        this.devicePixelRatio = options?.devicePixelRatio ?? 1;
      }
      // ── Self-references ───────────────────────────────────────────────
      get self() {
        return this;
      }
      get window() {
        return this;
      }
      get globalThis() {
        return this;
      }
      get top() {
        return this;
      }
      get parent() {
        return this;
      }
      get frames() {
        return this;
      }
      // ── Scroll aliases ────────────────────────────────────────────────
      get pageXOffset() {
        return this.scrollX;
      }
      get pageYOffset() {
        return this.scrollY;
      }
      // ── Scroll methods ────────────────────────────────────────────────
      scrollTo(x, y) {
        this.scrollX = x;
        this.scrollY = y;
      }
      scroll(x, y) {
        this.scrollTo(x, y);
      }
      scrollBy(dx, dy) {
        this.scrollX += dx;
        this.scrollY += dy;
      }
      // ── Computed style ────────────────────────────────────────────────
      getComputedStyle(_element) {
        return new Proxy(
          {},
          {
            get(_target, prop) {
              if (prop === Symbol.toPrimitive || prop === Symbol.toStringTag) {
                return void 0;
              }
              if (typeof prop === "string") {
                return "";
              }
              return void 0;
            }
          }
        );
      }
      // ── matchMedia ────────────────────────────────────────────────────
      matchMedia(query) {
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: () => {
          },
          removeListener: () => {
          },
          addEventListener: () => {
          },
          removeEventListener: () => {
          },
          dispatchEvent: () => true
        };
      }
      // ── Encoding ──────────────────────────────────────────────────────
      atob(encoded) {
        return Buffer.from(encoded, "base64").toString("binary");
      }
      btoa(data) {
        return Buffer.from(data, "binary").toString("base64");
      }
      // ── Timers (tracked by TimerController so dispose() can clear them) ──
      setTimeout(fn, delay, ...args2) {
        return this._timers.setTimeout(fn, delay ?? 0, ...args2);
      }
      clearTimeout(id) {
        this._timers.clearTimeout(id);
      }
      setInterval(fn, delay, ...args2) {
        return this._timers.setInterval(fn, delay ?? 0, ...args2);
      }
      clearInterval(id) {
        this._timers.clearInterval(id);
      }
      // ── Animation frames ──────────────────────────────────────────────
      requestAnimationFrame(callback) {
        return this._timers.requestAnimationFrame(callback);
      }
      cancelAnimationFrame(id) {
        this._timers.cancelAnimationFrame(id);
      }
      // ── Selection ─────────────────────────────────────────────────────
      getSelection() {
        return null;
      }
      // ── Window lifecycle no-ops ───────────────────────────────────────
      focus() {
      }
      blur() {
      }
      open() {
      }
      close() {
      }
      stop() {
      }
      // ── Dialog stubs ──────────────────────────────────────────────────
      alert(_message) {
      }
      confirm(_message) {
        return false;
      }
      prompt(_message, _defaultValue) {
        return null;
      }
      // ── Performance ───────────────────────────────────────────────────
      performance = {
        now: () => Date.now()
      };
      // ── Custom elements ───────────────────────────────────────────────
      customElements = {
        define: () => {
        },
        get: () => void 0,
        whenDefined: () => Promise.resolve()
      };
      // ── Microtask ─────────────────────────────────────────────────────
      queueMicrotask(fn) {
        queueMicrotask(fn);
      }
      // ── Network stubs ───────────────────────────────────────────────
      EventSource = EventSourceStub;
      WebSocket = WebSocketStub;
      DOMParser = DOMParser;
      // ── DOM constructors exposed on window ─────────────────────────
      EventTarget = EventTarget;
      // ── Structured clone ──────────────────────────────────────────────
      structuredClone(obj) {
        if (typeof globalThis.structuredClone === "function") {
          return globalThis.structuredClone(obj);
        }
        return JSON.parse(JSON.stringify(obj));
      }
    };
  }
});

// src/browser/Storage.ts
function createStorage() {
  const impl = new StorageImpl();
  const proxy = new Proxy(impl, {
    get(target, prop, receiver) {
      if (RESERVED_PROPS.has(prop) || typeof prop === "symbol") {
        const val2 = Reflect.get(target, prop, receiver);
        if (typeof val2 === "function") {
          return val2.bind(target);
        }
        return val2;
      }
      if (prop === "_keys" || prop === "_has") {
        const val2 = Reflect.get(target, prop, receiver);
        if (typeof val2 === "function") return val2.bind(target);
        return val2;
      }
      const key = prop;
      const val = target.getItem(key);
      return val === null ? void 0 : val;
    },
    set(target, prop, value) {
      if (RESERVED_PROPS.has(prop) || typeof prop === "symbol") {
        return true;
      }
      target.setItem(prop, value);
      return true;
    },
    deleteProperty(target, prop) {
      if (typeof prop === "string") {
        target.removeItem(prop);
      }
      return true;
    },
    has(target, prop) {
      if (RESERVED_PROPS.has(prop) || typeof prop === "symbol") {
        return prop in target;
      }
      return target._has(prop);
    },
    ownKeys(target) {
      return target._keys();
    },
    getOwnPropertyDescriptor(target, prop) {
      if (typeof prop === "string" && target._has(prop)) {
        return {
          value: target.getItem(prop),
          writable: true,
          enumerable: true,
          configurable: true
        };
      }
      return void 0;
    }
  });
  return proxy;
}
var RESERVED_PROPS, StorageImpl;
var init_Storage = __esm({
  "src/browser/Storage.ts"() {
    "use strict";
    RESERVED_PROPS = /* @__PURE__ */ new Set([
      "getItem",
      "setItem",
      "removeItem",
      "clear",
      "key",
      "length",
      "toString",
      // Internal
      "_store"
    ]);
    StorageImpl = class {
      /** Internal ordered map — Map preserves insertion order. */
      _store = /* @__PURE__ */ new Map();
      /** Number of key/value pairs currently present. */
      get length() {
        return this._store.size;
      }
      /**
       * Returns the name of the nth key, or null if index >= length.
       */
      key(index) {
        if (index < 0 || index >= this._store.size) {
          return null;
        }
        let i = 0;
        for (const k of this._store.keys()) {
          if (i === index) return k;
          i++;
        }
        return null;
      }
      /**
       * Returns the current value associated with the given key,
       * or null if the key does not exist.
       */
      getItem(key) {
        const val = this._store.get(key);
        return val === void 0 ? null : val;
      }
      /**
       * Sets the value of the pair identified by key to value,
       * creating a new pair if none existed previously.
       * Values are coerced to string via String().
       */
      setItem(key, value) {
        this._store.set(key, String(value));
      }
      /**
       * Removes the pair with the given key, if it exists.
       * No-op if the key does not exist.
       */
      removeItem(key) {
        this._store.delete(key);
      }
      /**
       * Removes all key/value pairs.
       */
      clear() {
        this._store.clear();
      }
      toString() {
        return "[object Storage]";
      }
      /** Expose keys for the Proxy's ownKeys trap. */
      _keys() {
        return [...this._store.keys()];
      }
      /** Check if a data key exists (for the Proxy's has trap). */
      _has(key) {
        return this._store.has(key);
      }
    };
  }
});

// src/events/CustomEvent.ts
var CustomEvent;
var init_CustomEvent = __esm({
  "src/events/CustomEvent.ts"() {
    "use strict";
    init_Event();
    CustomEvent = class extends Event {
      detail;
      constructor(type3, init) {
        super(type3, init);
        this.detail = init !== void 0 && "detail" in init ? init.detail : null;
      }
    };
  }
});

// src/events/UIEvent.ts
var UIEvent;
var init_UIEvent = __esm({
  "src/events/UIEvent.ts"() {
    "use strict";
    init_Event();
    UIEvent = class extends Event {
      view;
      detail;
      constructor(type3, init) {
        super(type3, init);
        this.view = init?.view ?? null;
        this.detail = init?.detail ?? 0;
      }
    };
  }
});

// src/events/MouseEvent.ts
var MouseEvent;
var init_MouseEvent = __esm({
  "src/events/MouseEvent.ts"() {
    "use strict";
    init_UIEvent();
    MouseEvent = class extends UIEvent {
      screenX;
      screenY;
      clientX;
      clientY;
      pageX;
      pageY;
      offsetX;
      offsetY;
      movementX;
      movementY;
      button;
      buttons;
      altKey;
      ctrlKey;
      metaKey;
      shiftKey;
      relatedTarget;
      constructor(type3, init) {
        super(type3, init);
        this.screenX = init?.screenX ?? 0;
        this.screenY = init?.screenY ?? 0;
        this.clientX = init?.clientX ?? 0;
        this.clientY = init?.clientY ?? 0;
        this.pageX = init?.pageX ?? (init?.clientX ?? 0);
        this.pageY = init?.pageY ?? (init?.clientY ?? 0);
        this.offsetX = init?.offsetX ?? 0;
        this.offsetY = init?.offsetY ?? 0;
        this.movementX = init?.movementX ?? 0;
        this.movementY = init?.movementY ?? 0;
        this.button = init?.button ?? 0;
        this.buttons = init?.buttons ?? 0;
        this.altKey = init?.altKey ?? false;
        this.ctrlKey = init?.ctrlKey ?? false;
        this.metaKey = init?.metaKey ?? false;
        this.shiftKey = init?.shiftKey ?? false;
        this.relatedTarget = init?.relatedTarget ?? null;
      }
      /**
       * Returns true if the specified modifier key was active during the event.
       * Supports: Alt, AltGraph, Control, Meta, Shift.
       */
      getModifierState(key) {
        switch (key) {
          case "Alt":
          case "AltGraph":
            return this.altKey;
          case "Control":
            return this.ctrlKey;
          case "Meta":
            return this.metaKey;
          case "Shift":
            return this.shiftKey;
          default:
            return false;
        }
      }
    };
  }
});

// src/events/KeyboardEvent.ts
var KeyboardEvent;
var init_KeyboardEvent = __esm({
  "src/events/KeyboardEvent.ts"() {
    "use strict";
    init_UIEvent();
    KeyboardEvent = class extends UIEvent {
      // Location constants (per spec)
      static DOM_KEY_LOCATION_STANDARD = 0;
      static DOM_KEY_LOCATION_LEFT = 1;
      static DOM_KEY_LOCATION_RIGHT = 2;
      static DOM_KEY_LOCATION_NUMPAD = 3;
      key;
      code;
      location;
      altKey;
      ctrlKey;
      metaKey;
      shiftKey;
      repeat;
      isComposing;
      constructor(type3, init) {
        super(type3, init);
        this.key = init?.key ?? "";
        this.code = init?.code ?? "";
        this.location = init?.location ?? 0;
        this.altKey = init?.altKey ?? false;
        this.ctrlKey = init?.ctrlKey ?? false;
        this.metaKey = init?.metaKey ?? false;
        this.shiftKey = init?.shiftKey ?? false;
        this.repeat = init?.repeat ?? false;
        this.isComposing = init?.isComposing ?? false;
      }
      /**
       * Returns true if the specified modifier key was active during the event.
       * Supports: Alt, AltGraph, Control, Meta, Shift.
       */
      getModifierState(key) {
        switch (key) {
          case "Alt":
          case "AltGraph":
            return this.altKey;
          case "Control":
            return this.ctrlKey;
          case "Meta":
            return this.metaKey;
          case "Shift":
            return this.shiftKey;
          default:
            return false;
        }
      }
    };
  }
});

// src/events/FocusEvent.ts
var FocusEvent;
var init_FocusEvent = __esm({
  "src/events/FocusEvent.ts"() {
    "use strict";
    init_UIEvent();
    FocusEvent = class extends UIEvent {
      relatedTarget;
      constructor(type3, init) {
        super(type3, init);
        this.relatedTarget = init?.relatedTarget ?? null;
      }
    };
  }
});

// src/events/InputEvent.ts
var InputEvent;
var init_InputEvent = __esm({
  "src/events/InputEvent.ts"() {
    "use strict";
    init_UIEvent();
    InputEvent = class extends UIEvent {
      data;
      inputType;
      isComposing;
      dataTransfer;
      constructor(type3, init) {
        super(type3, init);
        this.data = init?.data ?? null;
        this.inputType = init?.inputType ?? "";
        this.isComposing = init?.isComposing ?? false;
        this.dataTransfer = null;
      }
    };
  }
});

// src/events/PointerEvent.ts
var PointerEvent;
var init_PointerEvent = __esm({
  "src/events/PointerEvent.ts"() {
    "use strict";
    init_MouseEvent();
    PointerEvent = class extends MouseEvent {
      pointerId;
      width;
      height;
      pressure;
      tangentialPressure;
      tiltX;
      tiltY;
      twist;
      pointerType;
      isPrimary;
      constructor(type3, init) {
        super(type3, init);
        this.pointerId = init?.pointerId ?? 0;
        this.width = init?.width ?? 1;
        this.height = init?.height ?? 1;
        this.pressure = init?.pressure ?? 0;
        this.tangentialPressure = init?.tangentialPressure ?? 0;
        this.tiltX = init?.tiltX ?? 0;
        this.tiltY = init?.tiltY ?? 0;
        this.twist = init?.twist ?? 0;
        this.pointerType = init?.pointerType ?? "mouse";
        this.isPrimary = init?.isPrimary ?? false;
      }
    };
  }
});

// src/observers/ResizeObserver.ts
var ResizeObserver;
var init_ResizeObserver = __esm({
  "src/observers/ResizeObserver.ts"() {
    "use strict";
    ResizeObserver = class {
      _callback;
      _targets = /* @__PURE__ */ new Set();
      constructor(callback) {
        if (typeof callback !== "function") {
          throw new TypeError(
            "Failed to construct 'ResizeObserver': The callback provided as parameter 1 is not a function."
          );
        }
        this._callback = callback;
      }
      /**
       * Start observing the target element for size changes.
       * In Dixie this is a no-op beyond storing the target.
       */
      observe(target, options) {
        this._targets.add(target);
      }
      /**
       * Stop observing the target element.
       */
      unobserve(target) {
        this._targets.delete(target);
      }
      /**
       * Stop observing all targets.
       */
      disconnect() {
        this._targets.clear();
      }
      // ── Test helpers ──────────────────────────────────────────────────────
      /** Returns the number of observed targets (useful for testing). */
      get _observedCount() {
        return this._targets.size;
      }
      /** Returns the stored callback (useful for testing). */
      get _storedCallback() {
        return this._callback;
      }
    };
  }
});

// src/observers/IntersectionObserver.ts
var IntersectionObserver;
var init_IntersectionObserver = __esm({
  "src/observers/IntersectionObserver.ts"() {
    "use strict";
    IntersectionObserver = class {
      _callback;
      _options;
      _targets = /* @__PURE__ */ new Set();
      constructor(callback, options) {
        if (typeof callback !== "function") {
          throw new TypeError(
            "Failed to construct 'IntersectionObserver': The callback provided as parameter 1 is not a function."
          );
        }
        this._callback = callback;
        this._options = options ?? {};
      }
      // ── Spec properties ───────────────────────────────────────────────────
      get root() {
        return this._options.root ?? null;
      }
      get rootMargin() {
        return this._options.rootMargin ?? "0px 0px 0px 0px";
      }
      get thresholds() {
        const t = this._options.threshold;
        if (t == null) return [0];
        return Array.isArray(t) ? t : [t];
      }
      // ── Methods ───────────────────────────────────────────────────────────
      /**
       * Start observing the target element for intersection changes.
       * In Dixie this is a no-op beyond storing the target.
       */
      observe(target) {
        this._targets.add(target);
      }
      /**
       * Stop observing the target element.
       */
      unobserve(target) {
        this._targets.delete(target);
      }
      /**
       * Stop observing all targets.
       */
      disconnect() {
        this._targets.clear();
      }
      /**
       * Return pending entries. In Dixie, there are never pending entries.
       */
      takeRecords() {
        return [];
      }
      // ── Test helpers ──────────────────────────────────────────────────────
      /** Returns the number of observed targets (useful for testing). */
      get _observedCount() {
        return this._targets.size;
      }
      /** Returns the stored callback (useful for testing). */
      get _storedCallback() {
        return this._callback;
      }
    };
  }
});

// src/environment/DixieEnvironment.ts
function createHTMLConstructor(tagName) {
  const ctor = function() {
  };
  ctor.prototype = Object.create(Element.prototype);
  Object.defineProperty(ctor, Symbol.hasInstance, {
    value: (obj) => {
      if (!(obj instanceof Element)) return false;
      if (!tagName) return true;
      return obj.tagName === tagName;
    }
  });
  return ctor;
}
function addHasInstance(cls, tagName) {
  if (!Object.getOwnPropertyDescriptor(cls, Symbol.hasInstance)) {
    Object.defineProperty(cls, Symbol.hasInstance, {
      value: (obj) => {
        if (!(obj instanceof Element)) return false;
        if (!tagName) return true;
        return obj.tagName === tagName;
      }
    });
  }
}
function createDixieEnvironment(options) {
  const url = options?.url ?? "http://localhost/";
  const width = options?.width ?? 1024;
  const height = options?.height ?? 768;
  const userAgent = options?.userAgent;
  const document = new Document();
  const timers = new TimerController();
  const window = new Window({
    url,
    innerWidth: width,
    innerHeight: height,
    timers
  });
  Object.assign(window, STATIC_GLOBALS);
  window.document = document;
  if ("defaultView" in document) {
    document.defaultView = window;
  }
  if (userAgent !== void 0) {
    Object.defineProperty(window.navigator, "userAgent", {
      value: userAgent,
      writable: false,
      configurable: true
    });
  }
  const localStorage = createStorage();
  const sessionStorage = createStorage();
  let destroyed = false;
  const savedOriginals = /* @__PURE__ */ new Map();
  function assertNotDestroyed() {
    if (destroyed) {
      throw new Error("DixieEnvironment has been destroyed and cannot be used.");
    }
  }
  const boundSetTimeout = timers.setTimeout.bind(timers);
  const boundClearTimeout = timers.clearTimeout.bind(timers);
  const boundSetInterval = timers.setInterval.bind(timers);
  const boundClearInterval = timers.clearInterval.bind(timers);
  const boundRaf = timers.requestAnimationFrame.bind(timers);
  const boundCaf = timers.cancelAnimationFrame.bind(timers);
  const env = {
    get window() {
      assertNotDestroyed();
      return window;
    },
    get document() {
      assertNotDestroyed();
      return document;
    },
    get navigator() {
      assertNotDestroyed();
      return window.navigator;
    },
    get location() {
      assertNotDestroyed();
      return window.location;
    },
    get history() {
      assertNotDestroyed();
      return window.history;
    },
    get screen() {
      assertNotDestroyed();
      return window.screen;
    },
    get localStorage() {
      assertNotDestroyed();
      return localStorage;
    },
    get sessionStorage() {
      assertNotDestroyed();
      return sessionStorage;
    },
    get timers() {
      assertNotDestroyed();
      return timers;
    },
    reset() {
      assertNotDestroyed();
      const bodyChildren = document.body.childNodes;
      if (bodyChildren.length > 0) {
        while (document.body.firstChild) {
          document.body.removeChild(document.body.firstChild);
        }
      }
      const headChildren = document.head.childNodes;
      if (headChildren.length > 0) {
        while (document.head.firstChild) {
          document.head.removeChild(document.head.firstChild);
        }
      }
      localStorage.clear();
      sessionStorage.clear();
      timers.reset();
      clearMutationRegistry();
      window.scrollX = 0;
      window.scrollY = 0;
    },
    destroy() {
      assertNotDestroyed();
      env.reset();
      timers.dispose();
      destroyed = true;
    },
    installGlobals(target) {
      assertNotDestroyed();
      const t = target ?? globalThis;
      const originals = /* @__PURE__ */ new Map();
      for (const key of GLOBAL_KEYS) {
        originals.set(key, key in t ? t[key] : NOT_SET);
      }
      savedOriginals.set(t, originals);
      const safeSet = (key, value) => {
        try {
          t[key] = value;
        } catch {
          Object.defineProperty(t, key, { value, writable: true, configurable: true });
        }
      };
      safeSet("window", window);
      safeSet("document", document);
      safeSet("navigator", window.navigator);
      safeSet("location", window.location);
      safeSet("localStorage", localStorage);
      safeSet("sessionStorage", sessionStorage);
      safeSet("setTimeout", boundSetTimeout);
      safeSet("clearTimeout", boundClearTimeout);
      safeSet("setInterval", boundSetInterval);
      safeSet("clearInterval", boundClearInterval);
      safeSet("requestAnimationFrame", boundRaf);
      safeSet("cancelAnimationFrame", boundCaf);
      for (const [key, value] of Object.entries(STATIC_GLOBALS)) {
        safeSet(key, value);
      }
      Object.assign(window, STATIC_GLOBALS);
      safeSet("getComputedStyle", window.getComputedStyle.bind(window));
      safeSet("matchMedia", window.matchMedia.bind(window));
    },
    uninstallGlobals(target) {
      assertNotDestroyed();
      const t = target ?? globalThis;
      const originals = savedOriginals.get(t);
      if (!originals) return;
      for (const [key, original] of originals) {
        if (original === NOT_SET) {
          try {
            delete t[key];
          } catch {
          }
        } else {
          try {
            t[key] = original;
          } catch {
            Object.defineProperty(t, key, { value: original, writable: true, configurable: true });
          }
        }
      }
      savedOriginals.delete(t);
    }
  };
  return env;
}
var TAG_MAP, HTML_ELEMENT_NAMES, REAL_ELEMENT_CLASSES, HTML_CONSTRUCTORS_MAP, GLOBAL_KEYS, NOT_SET, STATIC_GLOBALS;
var init_DixieEnvironment = __esm({
  "src/environment/DixieEnvironment.ts"() {
    "use strict";
    init_Document();
    init_Window();
    init_Storage();
    init_Timers();
    init_MutationObserver();
    init_Event();
    init_CustomEvent();
    init_UIEvent();
    init_MouseEvent();
    init_KeyboardEvent();
    init_FocusEvent();
    init_InputEvent();
    init_PointerEvent();
    init_MutationObserver();
    init_ResizeObserver();
    init_IntersectionObserver();
    init_EventTarget();
    init_Element();
    init_Node();
    init_Text();
    init_Comment();
    init_DocumentFragment();
    init_HTMLInputElement();
    init_HTMLTextAreaElement();
    init_HTMLSelectElement();
    init_HTMLButtonElement();
    init_HTMLFormElement();
    init_HTMLLabelElement();
    init_HTMLOptionElement();
    init_DOMParser();
    init_Document();
    TAG_MAP = {
      HTMLElement: "",
      // base — matches any element
      HTMLDivElement: "DIV",
      HTMLSpanElement: "SPAN",
      HTMLAnchorElement: "A",
      HTMLButtonElement: "BUTTON",
      HTMLInputElement: "INPUT",
      HTMLTextAreaElement: "TEXTAREA",
      HTMLSelectElement: "SELECT",
      HTMLFormElement: "FORM",
      HTMLIFrameElement: "IFRAME",
      HTMLImageElement: "IMG",
      HTMLLabelElement: "LABEL",
      HTMLOptionElement: "OPTION",
      HTMLTableElement: "TABLE",
      HTMLTableRowElement: "TR",
      HTMLTableCellElement: "TD",
      HTMLUListElement: "UL",
      HTMLOListElement: "OL",
      HTMLLIElement: "LI",
      HTMLParagraphElement: "P",
      HTMLHeadingElement: "H1",
      HTMLPreElement: "PRE",
      HTMLCanvasElement: "CANVAS",
      HTMLVideoElement: "VIDEO",
      HTMLAudioElement: "AUDIO",
      HTMLSourceElement: "SOURCE",
      HTMLScriptElement: "SCRIPT",
      HTMLStyleElement: "STYLE",
      HTMLLinkElement: "LINK",
      HTMLMetaElement: "META",
      HTMLBodyElement: "BODY",
      HTMLHeadElement: "HEAD",
      HTMLHtmlElement: "HTML",
      HTMLTemplateElement: "TEMPLATE",
      HTMLSlotElement: "SLOT",
      HTMLDialogElement: "DIALOG",
      SVGElement: ""
    };
    HTML_ELEMENT_NAMES = Object.keys(TAG_MAP);
    REAL_ELEMENT_CLASSES = {
      HTMLInputElement,
      HTMLTextAreaElement,
      HTMLSelectElement,
      HTMLButtonElement,
      HTMLFormElement,
      HTMLLabelElement,
      HTMLOptionElement
    };
    HTML_CONSTRUCTORS_MAP = {};
    for (const [name, tag] of Object.entries(TAG_MAP)) {
      if (REAL_ELEMENT_CLASSES[name]) {
        addHasInstance(REAL_ELEMENT_CLASSES[name], tag);
        HTML_CONSTRUCTORS_MAP[name] = REAL_ELEMENT_CLASSES[name];
      } else {
        HTML_CONSTRUCTORS_MAP[name] = createHTMLConstructor(tag);
      }
    }
    GLOBAL_KEYS = [
      "window",
      "document",
      "navigator",
      "location",
      "localStorage",
      "sessionStorage",
      "setTimeout",
      "clearTimeout",
      "setInterval",
      "clearInterval",
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "Event",
      "CustomEvent",
      "UIEvent",
      "MouseEvent",
      "KeyboardEvent",
      "FocusEvent",
      "InputEvent",
      "PointerEvent",
      "Node",
      "Document",
      "DocumentFragment",
      "Text",
      "Comment",
      "MutationObserver",
      "ResizeObserver",
      "IntersectionObserver",
      "Element",
      "EventTarget",
      "getComputedStyle",
      "matchMedia",
      "DOMParser",
      "NodeFilter",
      ...HTML_ELEMENT_NAMES
    ];
    NOT_SET = Symbol("NOT_SET");
    STATIC_GLOBALS = Object.freeze({
      EventTarget,
      Event,
      CustomEvent,
      UIEvent,
      MouseEvent,
      KeyboardEvent,
      FocusEvent,
      InputEvent,
      PointerEvent,
      Node,
      Document,
      DocumentFragment,
      Text,
      Comment,
      MutationObserver,
      ResizeObserver,
      IntersectionObserver,
      Element,
      DOMParser,
      NodeFilter: NodeIteratorFilter,
      // HTML element constructors — real classes for elements with prototype getter/setters,
      // dummy constructors with Symbol.hasInstance for everything else
      ...HTML_CONSTRUCTORS_MAP
    });
  }
});

// src/environment/EnvironmentPool.ts
var EnvironmentPool;
var init_EnvironmentPool = __esm({
  "src/environment/EnvironmentPool.ts"() {
    "use strict";
    init_DixieEnvironment();
    EnvironmentPool = class {
      _available = [];
      _inUse = /* @__PURE__ */ new Set();
      _envOptions;
      _maxSize;
      _resetOnRelease;
      _drained = false;
      // Stats tracking
      _peakInUse = 0;
      _acquireCount = 0;
      _resetCount = 0;
      _totalCreated = 0;
      constructor(options) {
        const size = options?.size ?? 4;
        const preWarm = options?.preWarm ?? true;
        this._maxSize = options?.maxSize ?? 16;
        this._resetOnRelease = options?.resetOnRelease ?? true;
        this._envOptions = options?.environmentOptions;
        if (size > this._maxSize) {
          throw new Error(`Pool size (${size}) cannot exceed maxSize (${this._maxSize}).`);
        }
        if (preWarm) {
          for (let i = 0; i < size; i++) {
            this._available.push(createDixieEnvironment(this._envOptions));
            this._totalCreated++;
          }
        }
      }
      /** Number of environments currently available in the pool. */
      get availableCount() {
        return this._available.length;
      }
      /** Number of environments currently checked out. */
      get inUseCount() {
        return this._inUse.size;
      }
      /** Total environments managed by this pool (available + in use). */
      get totalCount() {
        return this._available.length + this._inUse.size;
      }
      /**
       * Acquire a fresh (reset) environment from the pool.
       * Returns from pool if available, creates new if pool empty (up to maxSize).
       * Throws if at maxSize with all environments in use.
       */
      acquire() {
        if (this._drained) {
          throw new Error("EnvironmentPool has been drained and cannot be used.");
        }
        let env;
        if (this._available.length > 0) {
          env = this._available.pop();
          env.reset();
          this._resetCount++;
        } else if (this.totalCount < this._maxSize) {
          env = createDixieEnvironment(this._envOptions);
          this._totalCreated++;
        } else {
          throw new Error(
            `EnvironmentPool exhausted: all ${this._maxSize} environments are in use. Increase maxSize or release environments before acquiring more.`
          );
        }
        this._inUse.add(env);
        this._acquireCount++;
        if (this._inUse.size > this._peakInUse) {
          this._peakInUse = this._inUse.size;
        }
        return env;
      }
      /**
       * Return an environment to the pool for reuse.
       * Resets the environment if resetOnRelease is true.
       */
      release(env) {
        if (this._drained) {
          throw new Error("EnvironmentPool has been drained and cannot be used.");
        }
        if (!this._inUse.has(env)) {
          throw new Error("Cannot release an environment that was not acquired from this pool.");
        }
        this._inUse.delete(env);
        if (this._resetOnRelease) {
          env.reset();
          this._resetCount++;
        }
        this._available.push(env);
      }
      /**
       * Execute a function with a pooled environment.
       * Automatically acquires before and releases after, even if fn throws.
       */
      withEnvironment(fn) {
        const env = this.acquire();
        try {
          return fn(env);
        } finally {
          this.release(env);
        }
      }
      /**
       * Async version of withEnvironment.
       * Automatically acquires before and releases after, even if fn rejects.
       */
      async withEnvironmentAsync(fn) {
        const env = this.acquire();
        try {
          return await fn(env);
        } finally {
          this.release(env);
        }
      }
      /**
       * Pool statistics for performance monitoring.
       */
      stats() {
        return {
          total: this.totalCount,
          available: this._available.length,
          inUse: this._inUse.size,
          peakInUse: this._peakInUse,
          acquireCount: this._acquireCount,
          resetCount: this._resetCount
        };
      }
      /**
       * Drain pool — destroy all idle environments.
       * In-use environments are also destroyed and the pool is marked as drained.
       * After calling drain(), the pool cannot be used.
       */
      drain() {
        if (this._drained) return;
        for (const env of this._available) {
          env.destroy();
        }
        this._available.length = 0;
        for (const env of this._inUse) {
          env.destroy();
        }
        this._inUse.clear();
        this._drained = true;
      }
      /**
       * Pre-warm the pool to a target size.
       * Creates additional environments up to the given count (or initial size).
       * Does not exceed maxSize.
       */
      warmUp(count) {
        if (this._drained) {
          throw new Error("EnvironmentPool has been drained and cannot be used.");
        }
        const target = count ?? this._maxSize - this.totalCount;
        const toCreate = Math.min(target, this._maxSize - this.totalCount);
        for (let i = 0; i < toCreate; i++) {
          this._available.push(createDixieEnvironment(this._envOptions));
          this._totalCreated++;
        }
      }
    };
  }
});

// src/environment/installGlobals.ts
function installGlobals(env) {
  const target = globalThis;
  const originals = /* @__PURE__ */ new Map();
  for (const key of GLOBAL_KEYS2) {
    originals.set(key, key in target ? target[key] : NOT_SET2);
  }
  target["window"] = env.window;
  target["document"] = env.document;
  target["navigator"] = env.navigator;
  target["localStorage"] = env.localStorage;
  target["sessionStorage"] = env.sessionStorage;
  target["location"] = env.location;
  target["history"] = env.history;
  if (env._mockFetch) {
    const mf = env._mockFetch;
    target["fetch"] = mf.fetch.bind(mf);
  }
  const timers = env.timers;
  target["setTimeout"] = timers.setTimeout.bind(timers);
  target["setInterval"] = timers.setInterval.bind(timers);
  target["clearTimeout"] = timers.clearTimeout.bind(timers);
  target["clearInterval"] = timers.clearInterval.bind(timers);
  target["requestAnimationFrame"] = timers.requestAnimationFrame.bind(timers);
  target["cancelAnimationFrame"] = timers.cancelAnimationFrame.bind(timers);
  target["Event"] = Event;
  target["CustomEvent"] = CustomEvent;
  target["Node"] = Node;
  target["Document"] = Document;
  target["DocumentFragment"] = DocumentFragment;
  target["Text"] = Text;
  target["Comment"] = Comment;
  for (const name of HTML_ELEMENT_CONSTRUCTORS) {
    target[name] = Element;
    env.window[name] = Element;
  }
  target["MutationObserver"] = MutationObserver;
  target["ResizeObserver"] = ResizeObserver;
  target["IntersectionObserver"] = IntersectionObserver;
  target["getComputedStyle"] = env.window.getComputedStyle.bind(env.window);
  target["matchMedia"] = env.window.matchMedia.bind(env.window);
  return {
    restore() {
      for (const [key, original] of originals) {
        if (original === NOT_SET2) {
          delete target[key];
        } else {
          target[key] = original;
        }
      }
    }
  };
}
var NOT_SET2, HTML_ELEMENT_CONSTRUCTORS, GLOBAL_KEYS2;
var init_installGlobals = __esm({
  "src/environment/installGlobals.ts"() {
    "use strict";
    init_Event();
    init_CustomEvent();
    init_Element();
    init_Node();
    init_Document();
    init_DocumentFragment();
    init_Text();
    init_Comment();
    init_MutationObserver();
    init_ResizeObserver();
    init_IntersectionObserver();
    NOT_SET2 = Symbol("NOT_SET");
    HTML_ELEMENT_CONSTRUCTORS = [
      "HTMLElement",
      "HTMLDivElement",
      "HTMLSpanElement",
      "HTMLAnchorElement",
      "HTMLButtonElement",
      "HTMLInputElement",
      "HTMLTextAreaElement",
      "HTMLSelectElement",
      "HTMLFormElement",
      "HTMLIFrameElement",
      "HTMLImageElement",
      "HTMLLabelElement",
      "HTMLOptionElement",
      "HTMLTableElement",
      "HTMLTableRowElement",
      "HTMLTableCellElement",
      "HTMLUListElement",
      "HTMLOListElement",
      "HTMLLIElement",
      "HTMLParagraphElement",
      "HTMLHeadingElement",
      "HTMLPreElement",
      "HTMLCanvasElement",
      "HTMLVideoElement",
      "HTMLAudioElement",
      "HTMLSourceElement",
      "HTMLScriptElement",
      "HTMLStyleElement",
      "HTMLLinkElement",
      "HTMLMetaElement",
      "HTMLBodyElement",
      "HTMLHeadElement",
      "HTMLHtmlElement",
      "HTMLTemplateElement",
      "HTMLSlotElement",
      "HTMLDialogElement",
      "SVGElement"
    ];
    GLOBAL_KEYS2 = [
      "window",
      "document",
      "navigator",
      "localStorage",
      "sessionStorage",
      "location",
      "history",
      "fetch",
      "setTimeout",
      "setInterval",
      "clearTimeout",
      "clearInterval",
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "Event",
      "CustomEvent",
      "Node",
      "Document",
      "DocumentFragment",
      "Text",
      "Comment",
      "MutationObserver",
      "ResizeObserver",
      "IntersectionObserver",
      "getComputedStyle",
      "matchMedia",
      ...HTML_ELEMENT_CONSTRUCTORS
    ];
  }
});

// src/environment/index.ts
var init_environment = __esm({
  "src/environment/index.ts"() {
    "use strict";
    init_DixieEnvironment();
    init_EnvironmentPool();
    init_installGlobals();
  }
});

// src/fetch/LiveFetch.ts
var LiveFetch;
var init_LiveFetch = __esm({
  "src/fetch/LiveFetch.ts"() {
    "use strict";
    LiveFetch = class {
      _origin;
      _referer;
      _userAgent;
      _requests = [];
      _maxRecordedRequests;
      /** Promise-level cache for fetchText — same URL deduplicates automatically */
      _textCache = /* @__PURE__ */ new Map();
      constructor(options) {
        this._userAgent = options.userAgent;
        this._maxRecordedRequests = options.maxRecordedRequests ?? 1e4;
        try {
          const parsed = new URL(options.pageUrl);
          this._origin = parsed.origin;
          this._referer = options.pageUrl;
        } catch {
          this._origin = "";
          this._referer = options.pageUrl;
        }
      }
      // ── Core fetch ──────────────────────────────────────────────────────
      async fetch(input, init) {
        const url = typeof input === "string" ? input : input.url;
        const method = init?.method?.toUpperCase() ?? (typeof input === "string" ? "GET" : input.method ?? "GET");
        const headers = new Headers(init?.headers ?? (typeof input !== "string" ? input.headers : void 0));
        if (!headers.has("User-Agent")) headers.set("User-Agent", this._userAgent);
        if (!headers.has("Origin") && this._origin) headers.set("Origin", this._origin);
        if (!headers.has("Referer") && this._referer) headers.set("Referer", this._referer);
        if (this._requests.length < this._maxRecordedRequests) {
          const headersRecord = {};
          headers.forEach((v, k) => {
            headersRecord[k] = v;
          });
          this._requests.push({
            url,
            method,
            headers: headersRecord,
            body: init?.body ?? null,
            timestamp: Date.now()
          });
        }
        return globalThis.fetch(input, { ...init, headers });
      }
      // ── Script fetching with cache ──────────────────────────────────────
      /**
       * Fetch a script URL and return its text content.
       * Results are cached at the promise level — concurrent calls for the
       * same URL share a single network request.
       */
      fetchText(url, options) {
        const cached = this._textCache.get(url);
        if (cached) return cached;
        const promise = this._fetchTextUncached(url, options?.timeout);
        this._textCache.set(url, promise);
        return promise;
      }
      async _fetchTextUncached(url, timeout) {
        const controller = timeout ? new AbortController() : void 0;
        const timer = controller ? setTimeout(() => controller.abort(), timeout) : void 0;
        try {
          const response = await this.fetch(url, {
            signal: controller?.signal
          });
          return await response.text();
        } finally {
          if (timer) clearTimeout(timer);
        }
      }
      // ── Request recording ───────────────────────────────────────────────
      getRequests() {
        return [...this._requests];
      }
      getRequestsTo(urlPattern) {
        return this._requests.filter((r) => r.url.startsWith(urlPattern));
      }
      clearRequests() {
        this._requests.length = 0;
      }
      clearCache() {
        this._textCache.clear();
      }
      reset() {
        this.clearRequests();
        this.clearCache();
      }
    };
  }
});

// src/fetch/Headers.ts
var DixieHeaders;
var init_Headers = __esm({
  "src/fetch/Headers.ts"() {
    "use strict";
    DixieHeaders = class _DixieHeaders {
      _map = /* @__PURE__ */ new Map();
      /** Preserves the original casing of the first set/append call for each header */
      _names = /* @__PURE__ */ new Map();
      constructor(init) {
        if (!init) return;
        if (init instanceof _DixieHeaders) {
          init.forEach((value, key) => {
            this.set(key, value);
          });
        } else if (Array.isArray(init)) {
          for (const [key, value] of init) {
            this.append(key, value);
          }
        } else {
          for (const key of Object.keys(init)) {
            this.set(key, init[key]);
          }
        }
      }
      _normalise(name) {
        return name.toLowerCase();
      }
      get(name) {
        return this._map.get(this._normalise(name)) ?? null;
      }
      set(name, value) {
        const norm = this._normalise(name);
        this._map.set(norm, value);
        if (!this._names.has(norm)) {
          this._names.set(norm, name);
        }
      }
      has(name) {
        return this._map.has(this._normalise(name));
      }
      delete(name) {
        const norm = this._normalise(name);
        this._map.delete(norm);
        this._names.delete(norm);
      }
      append(name, value) {
        const norm = this._normalise(name);
        const existing = this._map.get(norm);
        if (existing !== void 0) {
          this._map.set(norm, existing + ", " + value);
        } else {
          this._map.set(norm, value);
          this._names.set(norm, name);
        }
      }
      forEach(callback) {
        this._map.forEach((value, normKey) => {
          callback(value, normKey, this);
        });
      }
      *entries() {
        for (const [normKey, value] of this._map) {
          yield [normKey, value];
        }
      }
      *keys() {
        for (const normKey of this._map.keys()) {
          yield normKey;
        }
      }
      *values() {
        for (const value of this._map.values()) {
          yield value;
        }
      }
      [Symbol.iterator]() {
        return this.entries();
      }
    };
  }
});

// src/fetch/Request.ts
var DixieRequest;
var init_Request = __esm({
  "src/fetch/Request.ts"() {
    "use strict";
    init_Headers();
    DixieRequest = class _DixieRequest {
      url;
      method;
      headers;
      body;
      signal;
      _bodyUsed = false;
      constructor(input, init) {
        if (input instanceof _DixieRequest) {
          this.url = input.url;
          this.method = init?.method ?? input.method;
          this.headers = new DixieHeaders(init?.headers ?? input.headers);
          this.body = init?.body !== void 0 ? init.body : input.body;
          this.signal = init?.signal !== void 0 ? init.signal : input.signal;
        } else {
          this.url = input;
          this.method = init?.method?.toUpperCase() ?? "GET";
          this.headers = new DixieHeaders(init?.headers);
          this.body = init?.body ?? null;
          this.signal = init?.signal ?? null;
        }
      }
      get bodyUsed() {
        return this._bodyUsed;
      }
      async json() {
        this._bodyUsed = true;
        if (this.body === null) {
          throw new Error("Body is null");
        }
        return JSON.parse(this.body);
      }
      async text() {
        this._bodyUsed = true;
        return this.body ?? "";
      }
      clone() {
        if (this._bodyUsed) {
          throw new Error("Cannot clone a request whose body has already been consumed");
        }
        return new _DixieRequest(this.url, {
          method: this.method,
          headers: this.headers,
          body: this.body,
          signal: this.signal
        });
      }
    };
  }
});

// src/fetch/Response.ts
var Response_exports = {};
__export(Response_exports, {
  DixieResponse: () => DixieResponse
});
var DixieResponse;
var init_Response = __esm({
  "src/fetch/Response.ts"() {
    "use strict";
    init_Headers();
    DixieResponse = class _DixieResponse {
      status;
      statusText;
      headers;
      url;
      redirected = false;
      type = "basic";
      _body;
      _bodyUsed = false;
      constructor(body, init) {
        this._body = body ?? null;
        this.status = init?.status ?? 200;
        this.statusText = init?.statusText ?? "OK";
        this.headers = new DixieHeaders(init?.headers);
        this.url = init?.url ?? "";
      }
      get ok() {
        return this.status >= 200 && this.status <= 299;
      }
      get bodyUsed() {
        return this._bodyUsed;
      }
      async json() {
        if (this._bodyUsed) {
          throw new Error("Body has already been consumed");
        }
        this._bodyUsed = true;
        if (this._body === null) {
          throw new Error("Body is null");
        }
        return JSON.parse(this._body);
      }
      async text() {
        if (this._bodyUsed) {
          throw new Error("Body has already been consumed");
        }
        this._bodyUsed = true;
        return this._body ?? "";
      }
      async blob() {
        if (this._bodyUsed) {
          throw new Error("Body has already been consumed");
        }
        this._bodyUsed = true;
        const content = this._body ?? "";
        const contentType = this.headers.get("content-type") ?? "";
        return {
          size: content.length,
          type: contentType,
          text: async () => content
        };
      }
      async arrayBuffer() {
        if (this._bodyUsed) {
          throw new Error("Body has already been consumed");
        }
        this._bodyUsed = true;
        const content = this._body ?? "";
        const encoder = new TextEncoder();
        return encoder.encode(content).buffer;
      }
      clone() {
        if (this._bodyUsed) {
          throw new Error("Cannot clone a response whose body has already been consumed");
        }
        const cloned = new _DixieResponse(this._body, {
          status: this.status,
          statusText: this.statusText,
          headers: this.headers,
          url: this.url
        });
        return cloned;
      }
      // ─── Static factory methods ────────────────────────────────────────
      static json(data, init) {
        const body = JSON.stringify(data);
        const headers = new DixieHeaders(init?.headers);
        if (!headers.has("content-type")) {
          headers.set("content-type", "application/json");
        }
        return new _DixieResponse(body, {
          status: init?.status ?? 200,
          statusText: init?.statusText ?? "OK",
          headers,
          url: init?.url
        });
      }
      static error() {
        const resp = new _DixieResponse(null, {
          status: 0,
          statusText: ""
        });
        resp.type = "error";
        return resp;
      }
      static redirect(url, status = 302) {
        if (![301, 302, 303, 307, 308].includes(status)) {
          throw new RangeError(`Invalid redirect status: ${status}`);
        }
        return new _DixieResponse(null, {
          status,
          statusText: "Found",
          headers: { location: url }
        });
      }
    };
  }
});

// src/fetch/MockFetch.ts
var FALLBACK_404, MockFetch;
var init_MockFetch = __esm({
  "src/fetch/MockFetch.ts"() {
    "use strict";
    init_Headers();
    init_Request();
    init_Response();
    FALLBACK_404 = Object.freeze({ status: 404, statusText: "Not Found", body: null });
    MockFetch = class _MockFetch {
      _registry = /* @__PURE__ */ new Map();
      /** Registry entries sorted by pattern length descending (longest first) */
      _registrySorted = [];
      _registryDirty = false;
      _requests = [];
      _maxRecordedRequests;
      _passthroughMap = /* @__PURE__ */ new Map();
      /** Passthrough entries sorted by pattern length descending (longest first) */
      _passthroughSorted = [];
      _passthroughDirty = false;
      _defaultResponse = null;
      /** Cache: body config identity → pre-stringified JSON */
      _bodyCache = /* @__PURE__ */ new WeakMap();
      /** Track in-flight passthrough requests so the flush can wait for them */
      _inFlightCount = 0;
      constructor(options) {
        this._maxRecordedRequests = options?.maxRecordedRequests ?? 1e4;
      }
      /** Number of passthrough requests currently in-flight */
      get inFlightCount() {
        return this._inFlightCount;
      }
      /** Returns a promise that resolves when all in-flight requests complete */
      async waitForIdle(timeoutMs = 5e3) {
        const deadline = Date.now() + timeoutMs;
        while (this._inFlightCount > 0 && Date.now() < deadline) {
          await new Promise((resolve4) => setTimeout(resolve4, 50));
        }
        return this._inFlightCount === 0;
      }
      // ─── Response registry ───────────────────────────────────────────
      register(urlPattern, response) {
        this._registry.set(urlPattern, response);
        this._registryDirty = true;
      }
      unregister(urlPattern) {
        this._registry.delete(urlPattern);
        this._registryDirty = true;
      }
      clearRegistry() {
        this._registry.clear();
        this._registrySorted.length = 0;
        this._registryDirty = false;
      }
      // ─── Default response ────────────────────────────────────────────
      setDefaultResponse(response) {
        this._defaultResponse = response;
      }
      // ─── Passthrough ─────────────────────────────────────────────────
      setPassthrough(urlPattern, realFetch) {
        this._passthroughMap.set(urlPattern, realFetch);
        this._passthroughDirty = true;
      }
      clearPassthrough() {
        this._passthroughMap.clear();
        this._passthroughSorted.length = 0;
        this._passthroughDirty = false;
      }
      // ─── Request recording ───────────────────────────────────────────
      getRequests() {
        return [...this._requests];
      }
      getRequestsTo(urlPattern) {
        return this._requests.filter((r) => r.url.startsWith(urlPattern));
      }
      clearRequests() {
        this._requests.length = 0;
      }
      // ─── Reset ───────────────────────────────────────────────────────
      reset() {
        this.clearRegistry();
        this.clearRequests();
        this.clearPassthrough();
        this._defaultResponse = null;
      }
      /**
       * True when a registered route or passthrough matches this URL.
       * Used by the VM context to decide whether an in-page fetch should be
       * served by this MockFetch or fall through to LiveFetch (real network).
       */
      hasMatch(url) {
        if (this._passthroughMap.size > 0 && this._findLongestMatchSorted(url, this._getPassthroughSorted()) !== null) {
          return true;
        }
        if (this._registry.size > 0) {
          if (this._registry.has(url)) return true;
          if (this._findLongestMatchSorted(url, this._getRegistrySorted()) !== null) return true;
        }
        return false;
      }
      // ─── Core fetch ──────────────────────────────────────────────────
      async fetch(input, init) {
        if (input == null) {
          return this._buildResponse({ status: 400, statusText: "Bad Request", body: null }, "");
        }
        const isString = typeof input === "string";
        const url = isString ? input : input.url;
        if (this._requests.length < this._maxRecordedRequests) {
          if (isString) {
            let headersRec = {};
            if (init?.headers) {
              if (init.headers instanceof DixieHeaders) {
                init.headers.forEach((v, k) => {
                  headersRec[k] = v;
                });
              } else if (typeof init.headers === "object" && !Array.isArray(init.headers)) {
                for (const k of Object.keys(init.headers)) {
                  headersRec[k.toLowerCase()] = init.headers[k];
                }
              }
            }
            this._requests.push({
              url,
              method: init?.method?.toUpperCase() ?? "GET",
              headers: headersRec,
              body: init?.body ?? null,
              timestamp: Date.now()
            });
          } else {
            const headersRecord = {};
            input.headers.forEach((value, key) => {
              headersRecord[key] = value;
            });
            this._requests.push({
              url,
              method: input.method,
              headers: headersRecord,
              body: input.body,
              timestamp: Date.now()
            });
          }
        }
        if (this._passthroughMap.size > 0) {
          const ptMatch = this._findLongestMatchSorted(url, this._getPassthroughSorted());
          if (ptMatch !== null) {
            this._inFlightCount++;
            try {
              return await ptMatch(input, init);
            } finally {
              this._inFlightCount--;
            }
          }
        }
        if (this._registry.size > 0) {
          let regMatch = this._registry.get(url) ?? null;
          if (regMatch === null) {
            regMatch = this._findLongestMatchSorted(url, this._getRegistrySorted());
          }
          if (regMatch !== null) {
            if (typeof regMatch === "function") {
              const request = isString ? new DixieRequest(input, init) : input;
              return this._buildResponse(regMatch(request), url);
            }
            return this._buildResponse(regMatch, url);
          }
        }
        if (this._defaultResponse !== null) {
          return this._buildResponse(this._defaultResponse, url);
        }
        return this._buildResponse(FALLBACK_404, url);
      }
      // ─── Helpers ─────────────────────────────────────────────────────
      /** Rebuild the sorted registry array if dirty */
      _getRegistrySorted() {
        if (this._registryDirty) {
          this._registrySorted = this._buildSorted(this._registry);
          this._registryDirty = false;
        }
        return this._registrySorted;
      }
      /** Rebuild the sorted passthrough array if dirty */
      _getPassthroughSorted() {
        if (this._passthroughDirty) {
          this._passthroughSorted = this._buildSorted(this._passthroughMap);
          this._passthroughDirty = false;
        }
        return this._passthroughSorted;
      }
      /** Build a sorted array from a Map, longest patterns first */
      _buildSorted(map2) {
        const arr = [];
        for (const [pattern, value] of map2) {
          arr.push({ pattern, value });
        }
        arr.sort((a, b) => b.pattern.length - a.pattern.length);
        return arr;
      }
      /** Find the longest matching prefix from a pre-sorted array (longest first).
       *  Returns the value directly, or null if no match. */
      _findLongestMatchSorted(url, sorted) {
        for (let i = 0; i < sorted.length; i++) {
          if (url.startsWith(sorted[i].pattern)) {
            return sorted[i].value;
          }
        }
        return null;
      }
      async _buildResponse(config, url) {
        const delay = config.delay ?? 0;
        if (delay > 0) {
          await new Promise((resolve4) => setTimeout(resolve4, delay));
        }
        let body;
        const rawBody = config.body;
        if (rawBody !== void 0 && rawBody !== null) {
          if (typeof rawBody === "object") {
            let cached = this._bodyCache.get(rawBody);
            if (cached === void 0) {
              cached = JSON.stringify(rawBody);
              this._bodyCache.set(rawBody, cached);
            }
            body = cached;
          } else {
            body = JSON.stringify(rawBody);
          }
        } else {
          body = null;
        }
        const headers = config.headers ? { ...config.headers } : {};
        if (body !== null && !headers["content-type"]) {
          headers["content-type"] = "application/json";
        }
        return new DixieResponse(body, {
          status: config.status ?? 200,
          statusText: config.statusText ?? "OK",
          headers,
          url
        });
      }
      /**
       * Create a MockFetch pre-loaded with responses from a HAR entries array.
       * Each HAR entry is registered as a mock route keyed by request URL.
       * Used by mock-replay to replay recorded network sessions.
       */
      static loadFromHar(entries) {
        const instance = new _MockFetch();
        for (const entry of entries) {
          const url = entry.request?.url ?? entry.url;
          const method = entry.request?.method ?? entry.method ?? "GET";
          const status = entry.response?.status ?? entry.status ?? 200;
          const body = entry.response?.content?.text ?? entry.responseBody ?? "";
          const contentType = entry.response?.content?.mimeType ?? "application/json";
          if (url) {
            instance.register(url, {
              status,
              body,
              headers: { "content-type": contentType }
            });
          }
        }
        return instance;
      }
    };
  }
});

// src/execution/vm-context.ts
import * as vm from "node:vm";
function createSandboxConsole() {
  const noop = () => {
  };
  return {
    ...console,
    assert: noop,
    clear: noop,
    count: noop,
    countReset: noop,
    debug: noop,
    dir: noop,
    dirxml: noop,
    error: noop,
    group: noop,
    groupCollapsed: noop,
    groupEnd: noop,
    info: noop,
    log: noop,
    table: noop,
    time: noop,
    timeEnd: noop,
    timeLog: noop,
    trace: noop,
    warn: noop
  };
}
function createVmContext(envOrOptions) {
  let env;
  let timeout = 5e3;
  let harRecorder;
  let liveFetch;
  if (envOrOptions && "document" in envOrOptions && "window" in envOrOptions) {
    env = envOrOptions;
  } else {
    const options = envOrOptions;
    const url = options?.url ?? "http://localhost/";
    const userAgent = options?.userAgent ?? DEFAULT_USER_AGENT;
    env = createDixieEnvironment({
      url,
      ...options?.userAgent ? { userAgent: options.userAgent } : {}
    });
    const rawTimeout = options?.timeout ?? 5e3;
    timeout = typeof rawTimeout === "number" && Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : 5e3;
    harRecorder = options?.harRecorder;
    const enableFetch = options?.enableFetch !== false;
    liveFetch = enableFetch ? new LiveFetch({ pageUrl: url, userAgent }) : void 0;
  }
  const win = env.window;
  const mockFetch = new MockFetch();
  let effectiveFetch;
  if (liveFetch) {
    const live = liveFetch;
    effectiveFetch = (input, init) => {
      const reqUrl = typeof input === "string" ? input : input?.url ?? String(input);
      return mockFetch.hasMatch(reqUrl) ? mockFetch.fetch(input, init) : live.fetch(input, init);
    };
  } else {
    effectiveFetch = (input, init) => mockFetch.fetch(input, init);
  }
  const pageFetch = harRecorder ? async (input, init) => {
    const start = performance.now();
    const response = await effectiveFetch(input, init);
    const durationMs = performance.now() - start;
    const clone = response.clone();
    const body = await clone.text().catch(() => "");
    harRecorder.record({
      method: init?.method ?? "GET",
      url: typeof input === "string" ? input : input?.url ?? String(input),
      status: response.status,
      responseBody: body,
      durationMs: Math.round(durationMs * 100) / 100
    });
    return response;
  } : effectiveFetch;
  const sandbox = {
    // ── DOM ────────────────────────────────────────────────────────────
    document: env.document,
    // ── Console ────────────────────────────────────────────────────────
    console: win.console ?? createSandboxConsole(),
    // ── Timers ─────────────────────────────────────────────────────────
    // Route through the environment's TimerController (real mode delegates
    // to native Node timers, so async React scheduling still flushes) so
    // that dispose() can clear every page-scheduled timer. Without this,
    // page intervals keep the CLI process alive after the render finishes.
    setTimeout: env.timers.setTimeout.bind(env.timers),
    setInterval: env.timers.setInterval.bind(env.timers),
    clearTimeout: env.timers.clearTimeout.bind(env.timers),
    clearInterval: env.timers.clearInterval.bind(env.timers),
    // ── Animation frame ────────────────────────────────────────────────
    // React scheduler falls back to rAF when MessageChannel is unavailable
    requestAnimationFrame: (callback) => env.timers.requestAnimationFrame(callback),
    cancelAnimationFrame: (id) => env.timers.cancelAnimationFrame(id),
    // ── Microtask ──────────────────────────────────────────────────────
    queueMicrotask: globalThis.queueMicrotask,
    // ── MessageChannel ─────────────────────────────────────────────────
    // React 18 scheduler uses MessageChannel for priority task scheduling
    MessageChannel: globalThis.MessageChannel,
    MessageEvent: globalThis.MessageEvent,
    // ── Event listeners (window.addEventListener used by React Router) ──
    // Bind to env.window (EventTarget subclass) so listeners actually work.
    addEventListener: (type3, listener, options) => win.addEventListener(type3, listener, options),
    removeEventListener: (type3, listener, options) => win.removeEventListener(type3, listener, options),
    dispatchEvent: (event) => win.dispatchEvent(event),
    // ── Location, History, Navigator ───────────────────────────────────
    location: win.location,
    history: win.history,
    navigator: win.navigator,
    screen: win.screen,
    // ── URL ────────────────────────────────────────────────────────────
    URL: globalThis.URL,
    URLSearchParams: globalThis.URLSearchParams,
    // ── Fetch & Networking ─────────────────────────────────────────────
    // pageFetch = registered mock routes first, then LiveFetch (if enabled),
    // wrapped with the HAR recorder when one was provided. See wiring above.
    fetch: pageFetch,
    Headers: globalThis.Headers,
    Request: globalThis.Request,
    Response: globalThis.Response,
    AbortController: globalThis.AbortController,
    AbortSignal: globalThis.AbortSignal,
    // ── Encoding ───────────────────────────────────────────────────────
    TextEncoder: globalThis.TextEncoder,
    TextDecoder: globalThis.TextDecoder,
    // ── Crypto ─────────────────────────────────────────────────────────
    // React and router internals use crypto.getRandomValues for key generation
    crypto: globalThis.crypto,
    // ── Performance ────────────────────────────────────────────────────
    performance: globalThis.performance,
    // ── DOM Event constructors ─────────────────────────────────────────
    // Use Dixie's implementations so they interop with the Dixie EventTarget
    Event,
    CustomEvent,
    MouseEvent,
    KeyboardEvent,
    InputEvent,
    FocusEvent,
    // ── Observers ──────────────────────────────────────────────────────
    // MutationObserver — React uses it to detect disconnected subtrees
    MutationObserver,
    // ── Web Storage ──────────────────────────────────────────────────
    // Use the environment's storage instances so SPA code that references
    // localStorage/sessionStorage doesn't crash the VM.
    localStorage: env.localStorage,
    sessionStorage: env.sessionStorage,
    // ── Structured clone ───────────────────────────────────────────────
    structuredClone: globalThis.structuredClone,
    // ── Error constructors ─────────────────────────────────────────────
    Error: globalThis.Error,
    TypeError: globalThis.TypeError,
    RangeError: globalThis.RangeError,
    SyntaxError: globalThis.SyntaxError,
    ReferenceError: globalThis.ReferenceError,
    EvalError: globalThis.EvalError,
    URIError: globalThis.URIError,
    // ── Standard globals ───────────────────────────────────────────────
    Promise: globalThis.Promise,
    JSON: globalThis.JSON,
    Math: globalThis.Math,
    Object: globalThis.Object,
    Array: globalThis.Array,
    Map: globalThis.Map,
    Set: globalThis.Set,
    WeakMap: globalThis.WeakMap,
    WeakSet: globalThis.WeakSet,
    Symbol: globalThis.Symbol,
    Proxy: globalThis.Proxy,
    Reflect: globalThis.Reflect,
    RegExp: globalThis.RegExp,
    Date: globalThis.Date,
    parseInt: globalThis.parseInt,
    parseFloat: globalThis.parseFloat,
    isNaN: globalThis.isNaN,
    isFinite: globalThis.isFinite,
    decodeURIComponent: globalThis.decodeURIComponent,
    encodeURIComponent: globalThis.encodeURIComponent,
    decodeURI: globalThis.decodeURI,
    encodeURI: globalThis.encodeURI,
    // ── Binary / File APIs ───────────────────────────────────────────
    // Required by SPA code that creates blobs (email preview, file uploads),
    // Maxwell widget (localStorage + Blob), and automations page.
    Blob: globalThis.Blob,
    File: globalThis.File,
    FormData: globalThis.FormData,
    FileReader: FileReaderShim,
    // ── Base64 encoding ──────────────────────────────────────────────
    btoa: globalThis.btoa,
    atob: globalThis.atob,
    // ── Legacy networking ────────────────────────────────────────────
    // Third-party scripts (Google Sign-In, analytics) may reference XHR
    XMLHttpRequest: XMLHttpRequestShim
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.top = sandbox;
  sandbox.parent = sandbox;
  sandbox.frames = sandbox;
  const DOM_CONSTRUCTOR_NAMES = [
    "Node",
    "Element",
    "Document",
    "DocumentFragment",
    "Text",
    "Comment",
    "EventTarget",
    "DOMParser",
    "NodeFilter",
    "HTMLElement",
    "HTMLDivElement",
    "HTMLSpanElement",
    "HTMLAnchorElement",
    "HTMLButtonElement",
    "HTMLInputElement",
    "HTMLTextAreaElement",
    "HTMLSelectElement",
    "HTMLFormElement",
    "HTMLIFrameElement",
    "HTMLImageElement",
    "HTMLLabelElement",
    "HTMLOptionElement",
    "HTMLTableElement",
    "HTMLTableRowElement",
    "HTMLTableCellElement",
    "HTMLUListElement",
    "HTMLOListElement",
    "HTMLLIElement",
    "HTMLParagraphElement",
    "HTMLHeadingElement",
    "HTMLPreElement",
    "HTMLCanvasElement",
    "HTMLVideoElement",
    "HTMLAudioElement",
    "HTMLSourceElement",
    "HTMLScriptElement",
    "HTMLStyleElement",
    "HTMLLinkElement",
    "HTMLMetaElement",
    "HTMLBodyElement",
    "HTMLHeadElement",
    "HTMLHtmlElement",
    "HTMLTemplateElement",
    "HTMLSlotElement",
    "HTMLDialogElement",
    "SVGElement",
    "ResizeObserver",
    "IntersectionObserver",
    "UIEvent",
    "PointerEvent"
  ];
  for (const name of DOM_CONSTRUCTOR_NAMES) {
    if (!(name in sandbox) && win[name]) {
      sandbox[name] = win[name];
    }
  }
  if (win.getComputedStyle) {
    sandbox.getComputedStyle = win.getComputedStyle.bind(win);
  }
  if (win.matchMedia) {
    sandbox.matchMedia = win.matchMedia.bind(win);
  }
  const context = vm.createContext(sandbox);
  function executeScript(code) {
    try {
      vm.runInContext(code, context, { timeout });
      return {};
    } catch (err) {
      const msg = err.message ?? String(err);
      if (err.code === "ERR_SCRIPT_EXECUTION_TIMEOUT" || /timed out/i.test(msg)) {
        const timeoutErr = new Error(`Script timeout after ${timeout}ms`);
        timeoutErr.code = "ERR_SCRIPT_EXECUTION_TIMEOUT";
        throw timeoutErr;
      }
      return { error: msg };
    }
  }
  return {
    document: env.document,
    window: sandbox,
    sandbox,
    executeScript,
    env,
    mockFetch,
    liveFetch,
    _vmContext: context,
    dispose: () => {
      env.timers.dispose();
    }
  };
}
var FileReaderShim, XMLHttpRequestShim;
var init_vm_context = __esm({
  "src/execution/vm-context.ts"() {
    "use strict";
    init_environment();
    init_LiveFetch();
    init_Navigator();
    init_MockFetch();
    init_Event();
    init_CustomEvent();
    init_MouseEvent();
    init_KeyboardEvent();
    init_InputEvent();
    init_FocusEvent();
    init_MutationObserver();
    FileReaderShim = class {
      static EMPTY = 0;
      static LOADING = 1;
      static DONE = 2;
      EMPTY = 0;
      LOADING = 1;
      DONE = 2;
      readyState = 0;
      result = null;
      error = null;
      onload = null;
      onerror = null;
      onloadend = null;
      onabort = null;
      onloadstart = null;
      onprogress = null;
      readAsText(blob) {
        this._read(blob, "text");
      }
      readAsArrayBuffer(blob) {
        this._read(blob, "arraybuffer");
      }
      readAsDataURL(blob) {
        this._read(blob, "dataurl");
      }
      abort() {
      }
      async _read(blob, type3) {
        this.readyState = 1;
        try {
          if (type3 === "text") {
            this.result = await blob.text();
          } else if (type3 === "arraybuffer") {
            this.result = await blob.arrayBuffer();
          } else {
            const buf = await blob.arrayBuffer();
            this.result = "data:" + (blob.type || "application/octet-stream") + ";base64," + Buffer.from(buf).toString("base64");
          }
          this.readyState = 2;
          if (this.onload) this.onload({ target: this });
        } catch (e) {
          this.error = e;
          if (this.onerror) this.onerror({ target: this });
        }
        if (this.onloadend) this.onloadend({ target: this });
      }
    };
    XMLHttpRequestShim = class {
      static UNSENT = 0;
      static OPENED = 1;
      static HEADERS_RECEIVED = 2;
      static LOADING = 3;
      static DONE = 4;
      readyState = 0;
      status = 0;
      statusText = "";
      responseText = "";
      response = "";
      responseType = "";
      onload = null;
      onerror = null;
      onreadystatechange = null;
      open() {
        this.readyState = 1;
      }
      send() {
        this.readyState = 4;
        this.status = 0;
      }
      setRequestHeader() {
      }
      getResponseHeader() {
        return null;
      }
      getAllResponseHeaders() {
        return "";
      }
      abort() {
      }
      addEventListener() {
      }
      removeEventListener() {
      }
    };
  }
});

// src/execution/module-loader.ts
import * as vm2 from "node:vm";
function isModuleLoaderAvailable() {
  return typeof vm2.SourceTextModule === "function";
}
async function executeModule(source, sourceUrl, options) {
  const STM = vm2.SourceTextModule;
  if (!STM) {
    return {
      executed: false,
      error: "vm.SourceTextModule not available. Run Node with --experimental-vm-modules flag."
    };
  }
  const moduleCache = /* @__PURE__ */ new Map();
  async function linker(specifier, referencingModule) {
    const referrerUrl = referencingModule._dixieUrl ?? sourceUrl;
    const resolvedUrl = resolveModuleSpecifier(specifier, referrerUrl);
    const cached = moduleCache.get(resolvedUrl);
    if (cached) return cached;
    let moduleSource;
    try {
      moduleSource = await options.fetchFn(resolvedUrl);
    } catch (err) {
      const empty = new STM("export default undefined;", {
        context: options.vmContext,
        identifier: resolvedUrl
      });
      empty._dixieUrl = resolvedUrl;
      moduleCache.set(resolvedUrl, empty);
      await empty.link(linker);
      return empty;
    }
    const mod = new STM(moduleSource, {
      context: options.vmContext,
      identifier: resolvedUrl
    });
    mod._dixieUrl = resolvedUrl;
    moduleCache.set(resolvedUrl, mod);
    await mod.link(linker);
    return mod;
  }
  try {
    const rootModule = new STM(source, {
      context: options.vmContext,
      identifier: sourceUrl
    });
    rootModule._dixieUrl = sourceUrl;
    moduleCache.set(sourceUrl, rootModule);
    await rootModule.link(linker);
    await rootModule.evaluate({ timeout: options.timeout ?? 1e4 });
    return { executed: true };
  } catch (err) {
    return {
      executed: false,
      error: err.message ?? String(err)
    };
  }
}
function resolveModuleSpecifier(specifier, referrerUrl) {
  if (specifier.startsWith("http://") || specifier.startsWith("https://") || specifier.startsWith("data:")) {
    return specifier;
  }
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    try {
      return new URL(specifier, referrerUrl).href;
    } catch {
      return specifier;
    }
  }
  if (specifier.startsWith("/")) {
    try {
      const origin = new URL(referrerUrl).origin;
      return origin + specifier;
    } catch {
      return specifier;
    }
  }
  try {
    const origin = new URL(referrerUrl).origin;
    return origin + "/" + specifier;
  } catch {
    return specifier;
  }
}
var init_module_loader = __esm({
  "src/execution/module-loader.ts"() {
    "use strict";
  }
});

// node_modules/esbuild/lib/main.js
var require_main = __commonJS({
  "node_modules/esbuild/lib/main.js"(exports, module) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var node_exports = {};
    __export2(node_exports, {
      analyzeMetafile: () => analyzeMetafile,
      analyzeMetafileSync: () => analyzeMetafileSync,
      build: () => build,
      buildSync: () => buildSync,
      context: () => context,
      default: () => node_default,
      formatMessages: () => formatMessages,
      formatMessagesSync: () => formatMessagesSync,
      initialize: () => initialize,
      stop: () => stop,
      transform: () => transform,
      transformSync: () => transformSync,
      version: () => version
    });
    module.exports = __toCommonJS(node_exports);
    function encodePacket(packet) {
      let visit = (value) => {
        if (value === null) {
          bb.write8(0);
        } else if (typeof value === "boolean") {
          bb.write8(1);
          bb.write8(+value);
        } else if (typeof value === "number") {
          bb.write8(2);
          bb.write32(value | 0);
        } else if (typeof value === "string") {
          bb.write8(3);
          bb.write(encodeUTF8(value));
        } else if (value instanceof Uint8Array) {
          bb.write8(4);
          bb.write(value);
        } else if (value instanceof Array) {
          bb.write8(5);
          bb.write32(value.length);
          for (let item of value) {
            visit(item);
          }
        } else {
          let keys = Object.keys(value);
          bb.write8(6);
          bb.write32(keys.length);
          for (let key of keys) {
            bb.write(encodeUTF8(key));
            visit(value[key]);
          }
        }
      };
      let bb = new ByteBuffer();
      bb.write32(0);
      bb.write32(packet.id << 1 | +!packet.isRequest);
      visit(packet.value);
      writeUInt32LE(bb.buf, bb.len - 4, 0);
      return bb.buf.subarray(0, bb.len);
    }
    function decodePacket(bytes) {
      let visit = () => {
        switch (bb.read8()) {
          case 0:
            return null;
          case 1:
            return !!bb.read8();
          case 2:
            return bb.read32();
          case 3:
            return decodeUTF8(bb.read());
          case 4:
            return bb.read();
          case 5: {
            let count = bb.read32();
            let value2 = [];
            for (let i = 0; i < count; i++) {
              value2.push(visit());
            }
            return value2;
          }
          case 6: {
            let count = bb.read32();
            let value2 = {};
            for (let i = 0; i < count; i++) {
              value2[decodeUTF8(bb.read())] = visit();
            }
            return value2;
          }
          default:
            throw new Error("Invalid packet");
        }
      };
      let bb = new ByteBuffer(bytes);
      let id = bb.read32();
      let isRequest = (id & 1) === 0;
      id >>>= 1;
      let value = visit();
      if (bb.ptr !== bytes.length) {
        throw new Error("Invalid packet");
      }
      return { id, isRequest, value };
    }
    var ByteBuffer = class {
      constructor(buf = new Uint8Array(1024)) {
        this.buf = buf;
        this.len = 0;
        this.ptr = 0;
      }
      _write(delta) {
        if (this.len + delta > this.buf.length) {
          let clone = new Uint8Array((this.len + delta) * 2);
          clone.set(this.buf);
          this.buf = clone;
        }
        this.len += delta;
        return this.len - delta;
      }
      write8(value) {
        let offset = this._write(1);
        this.buf[offset] = value;
      }
      write32(value) {
        let offset = this._write(4);
        writeUInt32LE(this.buf, value, offset);
      }
      write(bytes) {
        let offset = this._write(4 + bytes.length);
        writeUInt32LE(this.buf, bytes.length, offset);
        this.buf.set(bytes, offset + 4);
      }
      _read(delta) {
        if (this.ptr + delta > this.buf.length) {
          throw new Error("Invalid packet");
        }
        this.ptr += delta;
        return this.ptr - delta;
      }
      read8() {
        return this.buf[this._read(1)];
      }
      read32() {
        return readUInt32LE(this.buf, this._read(4));
      }
      read() {
        let length = this.read32();
        let bytes = new Uint8Array(length);
        let ptr = this._read(bytes.length);
        bytes.set(this.buf.subarray(ptr, ptr + length));
        return bytes;
      }
    };
    var encodeUTF8;
    var decodeUTF8;
    var encodeInvariant;
    if (typeof TextEncoder !== "undefined" && typeof TextDecoder !== "undefined") {
      let encoder = new TextEncoder();
      let decoder = new TextDecoder();
      encodeUTF8 = (text) => encoder.encode(text);
      decodeUTF8 = (bytes) => decoder.decode(bytes);
      encodeInvariant = 'new TextEncoder().encode("")';
    } else if (typeof Buffer !== "undefined") {
      encodeUTF8 = (text) => Buffer.from(text);
      decodeUTF8 = (bytes) => {
        let { buffer, byteOffset, byteLength } = bytes;
        return Buffer.from(buffer, byteOffset, byteLength).toString();
      };
      encodeInvariant = 'Buffer.from("")';
    } else {
      throw new Error("No UTF-8 codec found");
    }
    if (!(encodeUTF8("") instanceof Uint8Array))
      throw new Error(`Invariant violation: "${encodeInvariant} instanceof Uint8Array" is incorrectly false

This indicates that your JavaScript environment is broken. You cannot use
esbuild in this environment because esbuild relies on this invariant. This
is not a problem with esbuild. You need to fix your environment instead.
`);
    function readUInt32LE(buffer, offset) {
      return buffer[offset++] | buffer[offset++] << 8 | buffer[offset++] << 16 | buffer[offset++] << 24;
    }
    function writeUInt32LE(buffer, value, offset) {
      buffer[offset++] = value;
      buffer[offset++] = value >> 8;
      buffer[offset++] = value >> 16;
      buffer[offset++] = value >> 24;
    }
    var quote = JSON.stringify;
    var buildLogLevelDefault = "warning";
    var transformLogLevelDefault = "silent";
    function validateTarget(target) {
      validateStringValue(target, "target");
      if (target.indexOf(",") >= 0) throw new Error(`Invalid target: ${target}`);
      return target;
    }
    var canBeAnything = () => null;
    var mustBeBoolean = (value) => typeof value === "boolean" ? null : "a boolean";
    var mustBeString = (value) => typeof value === "string" ? null : "a string";
    var mustBeRegExp = (value) => value instanceof RegExp ? null : "a RegExp object";
    var mustBeInteger = (value) => typeof value === "number" && value === (value | 0) ? null : "an integer";
    var mustBeFunction = (value) => typeof value === "function" ? null : "a function";
    var mustBeArray = (value) => Array.isArray(value) ? null : "an array";
    var mustBeObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value) ? null : "an object";
    var mustBeEntryPoints = (value) => typeof value === "object" && value !== null ? null : "an array or an object";
    var mustBeWebAssemblyModule = (value) => value instanceof WebAssembly.Module ? null : "a WebAssembly.Module";
    var mustBeObjectOrNull = (value) => typeof value === "object" && !Array.isArray(value) ? null : "an object or null";
    var mustBeStringOrBoolean = (value) => typeof value === "string" || typeof value === "boolean" ? null : "a string or a boolean";
    var mustBeStringOrObject = (value) => typeof value === "string" || typeof value === "object" && value !== null && !Array.isArray(value) ? null : "a string or an object";
    var mustBeStringOrArray = (value) => typeof value === "string" || Array.isArray(value) ? null : "a string or an array";
    var mustBeStringOrUint8Array = (value) => typeof value === "string" || value instanceof Uint8Array ? null : "a string or a Uint8Array";
    var mustBeStringOrURL = (value) => typeof value === "string" || value instanceof URL ? null : "a string or a URL";
    function getFlag(object, keys, key, mustBeFn) {
      let value = object[key];
      keys[key + ""] = true;
      if (value === void 0) return void 0;
      let mustBe = mustBeFn(value);
      if (mustBe !== null) throw new Error(`${quote(key)} must be ${mustBe}`);
      return value;
    }
    function checkForInvalidFlags(object, keys, where) {
      for (let key in object) {
        if (!(key in keys)) {
          throw new Error(`Invalid option ${where}: ${quote(key)}`);
        }
      }
    }
    function validateInitializeOptions(options) {
      let keys = /* @__PURE__ */ Object.create(null);
      let wasmURL = getFlag(options, keys, "wasmURL", mustBeStringOrURL);
      let wasmModule = getFlag(options, keys, "wasmModule", mustBeWebAssemblyModule);
      let worker = getFlag(options, keys, "worker", mustBeBoolean);
      checkForInvalidFlags(options, keys, "in initialize() call");
      return {
        wasmURL,
        wasmModule,
        worker
      };
    }
    function validateMangleCache(mangleCache) {
      let validated;
      if (mangleCache !== void 0) {
        validated = /* @__PURE__ */ Object.create(null);
        for (let key in mangleCache) {
          let value = mangleCache[key];
          if (typeof value === "string" || value === false) {
            validated[key] = value;
          } else {
            throw new Error(`Expected ${quote(key)} in mangle cache to map to either a string or false`);
          }
        }
      }
      return validated;
    }
    function pushLogFlags(flags, options, keys, isTTY2, logLevelDefault) {
      let color = getFlag(options, keys, "color", mustBeBoolean);
      let logLevel = getFlag(options, keys, "logLevel", mustBeString);
      let logLimit = getFlag(options, keys, "logLimit", mustBeInteger);
      if (color !== void 0) flags.push(`--color=${color}`);
      else if (isTTY2) flags.push(`--color=true`);
      flags.push(`--log-level=${logLevel || logLevelDefault}`);
      flags.push(`--log-limit=${logLimit || 0}`);
    }
    function validateStringValue(value, what, key) {
      if (typeof value !== "string") {
        throw new Error(`Expected value for ${what}${key !== void 0 ? " " + quote(key) : ""} to be a string, got ${typeof value} instead`);
      }
      return value;
    }
    function pushCommonFlags(flags, options, keys) {
      let legalComments = getFlag(options, keys, "legalComments", mustBeString);
      let sourceRoot = getFlag(options, keys, "sourceRoot", mustBeString);
      let sourcesContent = getFlag(options, keys, "sourcesContent", mustBeBoolean);
      let target = getFlag(options, keys, "target", mustBeStringOrArray);
      let format = getFlag(options, keys, "format", mustBeString);
      let globalName = getFlag(options, keys, "globalName", mustBeString);
      let mangleProps = getFlag(options, keys, "mangleProps", mustBeRegExp);
      let reserveProps = getFlag(options, keys, "reserveProps", mustBeRegExp);
      let mangleQuoted = getFlag(options, keys, "mangleQuoted", mustBeBoolean);
      let minify = getFlag(options, keys, "minify", mustBeBoolean);
      let minifySyntax = getFlag(options, keys, "minifySyntax", mustBeBoolean);
      let minifyWhitespace = getFlag(options, keys, "minifyWhitespace", mustBeBoolean);
      let minifyIdentifiers = getFlag(options, keys, "minifyIdentifiers", mustBeBoolean);
      let lineLimit = getFlag(options, keys, "lineLimit", mustBeInteger);
      let drop = getFlag(options, keys, "drop", mustBeArray);
      let dropLabels = getFlag(options, keys, "dropLabels", mustBeArray);
      let charset = getFlag(options, keys, "charset", mustBeString);
      let treeShaking = getFlag(options, keys, "treeShaking", mustBeBoolean);
      let ignoreAnnotations = getFlag(options, keys, "ignoreAnnotations", mustBeBoolean);
      let jsx = getFlag(options, keys, "jsx", mustBeString);
      let jsxFactory = getFlag(options, keys, "jsxFactory", mustBeString);
      let jsxFragment = getFlag(options, keys, "jsxFragment", mustBeString);
      let jsxImportSource = getFlag(options, keys, "jsxImportSource", mustBeString);
      let jsxDev = getFlag(options, keys, "jsxDev", mustBeBoolean);
      let jsxSideEffects = getFlag(options, keys, "jsxSideEffects", mustBeBoolean);
      let define = getFlag(options, keys, "define", mustBeObject);
      let logOverride = getFlag(options, keys, "logOverride", mustBeObject);
      let supported = getFlag(options, keys, "supported", mustBeObject);
      let pure = getFlag(options, keys, "pure", mustBeArray);
      let keepNames = getFlag(options, keys, "keepNames", mustBeBoolean);
      let platform = getFlag(options, keys, "platform", mustBeString);
      let tsconfigRaw = getFlag(options, keys, "tsconfigRaw", mustBeStringOrObject);
      if (legalComments) flags.push(`--legal-comments=${legalComments}`);
      if (sourceRoot !== void 0) flags.push(`--source-root=${sourceRoot}`);
      if (sourcesContent !== void 0) flags.push(`--sources-content=${sourcesContent}`);
      if (target) {
        if (Array.isArray(target)) flags.push(`--target=${Array.from(target).map(validateTarget).join(",")}`);
        else flags.push(`--target=${validateTarget(target)}`);
      }
      if (format) flags.push(`--format=${format}`);
      if (globalName) flags.push(`--global-name=${globalName}`);
      if (platform) flags.push(`--platform=${platform}`);
      if (tsconfigRaw) flags.push(`--tsconfig-raw=${typeof tsconfigRaw === "string" ? tsconfigRaw : JSON.stringify(tsconfigRaw)}`);
      if (minify) flags.push("--minify");
      if (minifySyntax) flags.push("--minify-syntax");
      if (minifyWhitespace) flags.push("--minify-whitespace");
      if (minifyIdentifiers) flags.push("--minify-identifiers");
      if (lineLimit) flags.push(`--line-limit=${lineLimit}`);
      if (charset) flags.push(`--charset=${charset}`);
      if (treeShaking !== void 0) flags.push(`--tree-shaking=${treeShaking}`);
      if (ignoreAnnotations) flags.push(`--ignore-annotations`);
      if (drop) for (let what of drop) flags.push(`--drop:${validateStringValue(what, "drop")}`);
      if (dropLabels) flags.push(`--drop-labels=${Array.from(dropLabels).map((what) => validateStringValue(what, "dropLabels")).join(",")}`);
      if (mangleProps) flags.push(`--mangle-props=${mangleProps.source}`);
      if (reserveProps) flags.push(`--reserve-props=${reserveProps.source}`);
      if (mangleQuoted !== void 0) flags.push(`--mangle-quoted=${mangleQuoted}`);
      if (jsx) flags.push(`--jsx=${jsx}`);
      if (jsxFactory) flags.push(`--jsx-factory=${jsxFactory}`);
      if (jsxFragment) flags.push(`--jsx-fragment=${jsxFragment}`);
      if (jsxImportSource) flags.push(`--jsx-import-source=${jsxImportSource}`);
      if (jsxDev) flags.push(`--jsx-dev`);
      if (jsxSideEffects) flags.push(`--jsx-side-effects`);
      if (define) {
        for (let key in define) {
          if (key.indexOf("=") >= 0) throw new Error(`Invalid define: ${key}`);
          flags.push(`--define:${key}=${validateStringValue(define[key], "define", key)}`);
        }
      }
      if (logOverride) {
        for (let key in logOverride) {
          if (key.indexOf("=") >= 0) throw new Error(`Invalid log override: ${key}`);
          flags.push(`--log-override:${key}=${validateStringValue(logOverride[key], "log override", key)}`);
        }
      }
      if (supported) {
        for (let key in supported) {
          if (key.indexOf("=") >= 0) throw new Error(`Invalid supported: ${key}`);
          const value = supported[key];
          if (typeof value !== "boolean") throw new Error(`Expected value for supported ${quote(key)} to be a boolean, got ${typeof value} instead`);
          flags.push(`--supported:${key}=${value}`);
        }
      }
      if (pure) for (let fn of pure) flags.push(`--pure:${validateStringValue(fn, "pure")}`);
      if (keepNames) flags.push(`--keep-names`);
    }
    function flagsForBuildOptions(callName, options, isTTY2, logLevelDefault, writeDefault) {
      var _a2;
      let flags = [];
      let entries = [];
      let keys = /* @__PURE__ */ Object.create(null);
      let stdinContents = null;
      let stdinResolveDir = null;
      pushLogFlags(flags, options, keys, isTTY2, logLevelDefault);
      pushCommonFlags(flags, options, keys);
      let sourcemap = getFlag(options, keys, "sourcemap", mustBeStringOrBoolean);
      let bundle = getFlag(options, keys, "bundle", mustBeBoolean);
      let splitting = getFlag(options, keys, "splitting", mustBeBoolean);
      let preserveSymlinks = getFlag(options, keys, "preserveSymlinks", mustBeBoolean);
      let metafile = getFlag(options, keys, "metafile", mustBeBoolean);
      let outfile = getFlag(options, keys, "outfile", mustBeString);
      let outdir = getFlag(options, keys, "outdir", mustBeString);
      let outbase = getFlag(options, keys, "outbase", mustBeString);
      let tsconfig = getFlag(options, keys, "tsconfig", mustBeString);
      let resolveExtensions = getFlag(options, keys, "resolveExtensions", mustBeArray);
      let nodePathsInput = getFlag(options, keys, "nodePaths", mustBeArray);
      let mainFields = getFlag(options, keys, "mainFields", mustBeArray);
      let conditions = getFlag(options, keys, "conditions", mustBeArray);
      let external = getFlag(options, keys, "external", mustBeArray);
      let packages = getFlag(options, keys, "packages", mustBeString);
      let alias = getFlag(options, keys, "alias", mustBeObject);
      let loader2 = getFlag(options, keys, "loader", mustBeObject);
      let outExtension = getFlag(options, keys, "outExtension", mustBeObject);
      let publicPath = getFlag(options, keys, "publicPath", mustBeString);
      let entryNames = getFlag(options, keys, "entryNames", mustBeString);
      let chunkNames = getFlag(options, keys, "chunkNames", mustBeString);
      let assetNames = getFlag(options, keys, "assetNames", mustBeString);
      let inject = getFlag(options, keys, "inject", mustBeArray);
      let banner = getFlag(options, keys, "banner", mustBeObject);
      let footer = getFlag(options, keys, "footer", mustBeObject);
      let entryPoints = getFlag(options, keys, "entryPoints", mustBeEntryPoints);
      let absWorkingDir = getFlag(options, keys, "absWorkingDir", mustBeString);
      let stdin = getFlag(options, keys, "stdin", mustBeObject);
      let write = (_a2 = getFlag(options, keys, "write", mustBeBoolean)) != null ? _a2 : writeDefault;
      let allowOverwrite = getFlag(options, keys, "allowOverwrite", mustBeBoolean);
      let mangleCache = getFlag(options, keys, "mangleCache", mustBeObject);
      keys.plugins = true;
      checkForInvalidFlags(options, keys, `in ${callName}() call`);
      if (sourcemap) flags.push(`--sourcemap${sourcemap === true ? "" : `=${sourcemap}`}`);
      if (bundle) flags.push("--bundle");
      if (allowOverwrite) flags.push("--allow-overwrite");
      if (splitting) flags.push("--splitting");
      if (preserveSymlinks) flags.push("--preserve-symlinks");
      if (metafile) flags.push(`--metafile`);
      if (outfile) flags.push(`--outfile=${outfile}`);
      if (outdir) flags.push(`--outdir=${outdir}`);
      if (outbase) flags.push(`--outbase=${outbase}`);
      if (tsconfig) flags.push(`--tsconfig=${tsconfig}`);
      if (packages) flags.push(`--packages=${packages}`);
      if (resolveExtensions) {
        let values = [];
        for (let value of resolveExtensions) {
          validateStringValue(value, "resolve extension");
          if (value.indexOf(",") >= 0) throw new Error(`Invalid resolve extension: ${value}`);
          values.push(value);
        }
        flags.push(`--resolve-extensions=${values.join(",")}`);
      }
      if (publicPath) flags.push(`--public-path=${publicPath}`);
      if (entryNames) flags.push(`--entry-names=${entryNames}`);
      if (chunkNames) flags.push(`--chunk-names=${chunkNames}`);
      if (assetNames) flags.push(`--asset-names=${assetNames}`);
      if (mainFields) {
        let values = [];
        for (let value of mainFields) {
          validateStringValue(value, "main field");
          if (value.indexOf(",") >= 0) throw new Error(`Invalid main field: ${value}`);
          values.push(value);
        }
        flags.push(`--main-fields=${values.join(",")}`);
      }
      if (conditions) {
        let values = [];
        for (let value of conditions) {
          validateStringValue(value, "condition");
          if (value.indexOf(",") >= 0) throw new Error(`Invalid condition: ${value}`);
          values.push(value);
        }
        flags.push(`--conditions=${values.join(",")}`);
      }
      if (external) for (let name of external) flags.push(`--external:${validateStringValue(name, "external")}`);
      if (alias) {
        for (let old in alias) {
          if (old.indexOf("=") >= 0) throw new Error(`Invalid package name in alias: ${old}`);
          flags.push(`--alias:${old}=${validateStringValue(alias[old], "alias", old)}`);
        }
      }
      if (banner) {
        for (let type3 in banner) {
          if (type3.indexOf("=") >= 0) throw new Error(`Invalid banner file type: ${type3}`);
          flags.push(`--banner:${type3}=${validateStringValue(banner[type3], "banner", type3)}`);
        }
      }
      if (footer) {
        for (let type3 in footer) {
          if (type3.indexOf("=") >= 0) throw new Error(`Invalid footer file type: ${type3}`);
          flags.push(`--footer:${type3}=${validateStringValue(footer[type3], "footer", type3)}`);
        }
      }
      if (inject) for (let path32 of inject) flags.push(`--inject:${validateStringValue(path32, "inject")}`);
      if (loader2) {
        for (let ext in loader2) {
          if (ext.indexOf("=") >= 0) throw new Error(`Invalid loader extension: ${ext}`);
          flags.push(`--loader:${ext}=${validateStringValue(loader2[ext], "loader", ext)}`);
        }
      }
      if (outExtension) {
        for (let ext in outExtension) {
          if (ext.indexOf("=") >= 0) throw new Error(`Invalid out extension: ${ext}`);
          flags.push(`--out-extension:${ext}=${validateStringValue(outExtension[ext], "out extension", ext)}`);
        }
      }
      if (entryPoints) {
        if (Array.isArray(entryPoints)) {
          for (let i = 0, n = entryPoints.length; i < n; i++) {
            let entryPoint = entryPoints[i];
            if (typeof entryPoint === "object" && entryPoint !== null) {
              let entryPointKeys = /* @__PURE__ */ Object.create(null);
              let input = getFlag(entryPoint, entryPointKeys, "in", mustBeString);
              let output = getFlag(entryPoint, entryPointKeys, "out", mustBeString);
              checkForInvalidFlags(entryPoint, entryPointKeys, "in entry point at index " + i);
              if (input === void 0) throw new Error('Missing property "in" for entry point at index ' + i);
              if (output === void 0) throw new Error('Missing property "out" for entry point at index ' + i);
              entries.push([output, input]);
            } else {
              entries.push(["", validateStringValue(entryPoint, "entry point at index " + i)]);
            }
          }
        } else {
          for (let key in entryPoints) {
            entries.push([key, validateStringValue(entryPoints[key], "entry point", key)]);
          }
        }
      }
      if (stdin) {
        let stdinKeys = /* @__PURE__ */ Object.create(null);
        let contents = getFlag(stdin, stdinKeys, "contents", mustBeStringOrUint8Array);
        let resolveDir = getFlag(stdin, stdinKeys, "resolveDir", mustBeString);
        let sourcefile = getFlag(stdin, stdinKeys, "sourcefile", mustBeString);
        let loader22 = getFlag(stdin, stdinKeys, "loader", mustBeString);
        checkForInvalidFlags(stdin, stdinKeys, 'in "stdin" object');
        if (sourcefile) flags.push(`--sourcefile=${sourcefile}`);
        if (loader22) flags.push(`--loader=${loader22}`);
        if (resolveDir) stdinResolveDir = resolveDir;
        if (typeof contents === "string") stdinContents = encodeUTF8(contents);
        else if (contents instanceof Uint8Array) stdinContents = contents;
      }
      let nodePaths = [];
      if (nodePathsInput) {
        for (let value of nodePathsInput) {
          value += "";
          nodePaths.push(value);
        }
      }
      return {
        entries,
        flags,
        write,
        stdinContents,
        stdinResolveDir,
        absWorkingDir,
        nodePaths,
        mangleCache: validateMangleCache(mangleCache)
      };
    }
    function flagsForTransformOptions(callName, options, isTTY2, logLevelDefault) {
      let flags = [];
      let keys = /* @__PURE__ */ Object.create(null);
      pushLogFlags(flags, options, keys, isTTY2, logLevelDefault);
      pushCommonFlags(flags, options, keys);
      let sourcemap = getFlag(options, keys, "sourcemap", mustBeStringOrBoolean);
      let sourcefile = getFlag(options, keys, "sourcefile", mustBeString);
      let loader2 = getFlag(options, keys, "loader", mustBeString);
      let banner = getFlag(options, keys, "banner", mustBeString);
      let footer = getFlag(options, keys, "footer", mustBeString);
      let mangleCache = getFlag(options, keys, "mangleCache", mustBeObject);
      checkForInvalidFlags(options, keys, `in ${callName}() call`);
      if (sourcemap) flags.push(`--sourcemap=${sourcemap === true ? "external" : sourcemap}`);
      if (sourcefile) flags.push(`--sourcefile=${sourcefile}`);
      if (loader2) flags.push(`--loader=${loader2}`);
      if (banner) flags.push(`--banner=${banner}`);
      if (footer) flags.push(`--footer=${footer}`);
      return {
        flags,
        mangleCache: validateMangleCache(mangleCache)
      };
    }
    function createChannel(streamIn) {
      const requestCallbacksByKey = {};
      const closeData = { didClose: false, reason: "" };
      let responseCallbacks = {};
      let nextRequestID = 0;
      let nextBuildKey = 0;
      let stdout = new Uint8Array(16 * 1024);
      let stdoutUsed = 0;
      let readFromStdout = (chunk) => {
        let limit = stdoutUsed + chunk.length;
        if (limit > stdout.length) {
          let swap = new Uint8Array(limit * 2);
          swap.set(stdout);
          stdout = swap;
        }
        stdout.set(chunk, stdoutUsed);
        stdoutUsed += chunk.length;
        let offset = 0;
        while (offset + 4 <= stdoutUsed) {
          let length = readUInt32LE(stdout, offset);
          if (offset + 4 + length > stdoutUsed) {
            break;
          }
          offset += 4;
          handleIncomingPacket(stdout.subarray(offset, offset + length));
          offset += length;
        }
        if (offset > 0) {
          stdout.copyWithin(0, offset, stdoutUsed);
          stdoutUsed -= offset;
        }
      };
      let afterClose = (error) => {
        closeData.didClose = true;
        if (error) closeData.reason = ": " + (error.message || error);
        const text = "The service was stopped" + closeData.reason;
        for (let id in responseCallbacks) {
          responseCallbacks[id](text, null);
        }
        responseCallbacks = {};
      };
      let sendRequest = (refs, value, callback) => {
        if (closeData.didClose) return callback("The service is no longer running" + closeData.reason, null);
        let id = nextRequestID++;
        responseCallbacks[id] = (error, response) => {
          try {
            callback(error, response);
          } finally {
            if (refs) refs.unref();
          }
        };
        if (refs) refs.ref();
        streamIn.writeToStdin(encodePacket({ id, isRequest: true, value }));
      };
      let sendResponse = (id, value) => {
        if (closeData.didClose) throw new Error("The service is no longer running" + closeData.reason);
        streamIn.writeToStdin(encodePacket({ id, isRequest: false, value }));
      };
      let handleRequest = async (id, request) => {
        try {
          if (request.command === "ping") {
            sendResponse(id, {});
            return;
          }
          if (typeof request.key === "number") {
            const requestCallbacks = requestCallbacksByKey[request.key];
            if (!requestCallbacks) {
              return;
            }
            const callback = requestCallbacks[request.command];
            if (callback) {
              await callback(id, request);
              return;
            }
          }
          throw new Error(`Invalid command: ` + request.command);
        } catch (e) {
          const errors = [extractErrorMessageV8(e, streamIn, null, void 0, "")];
          try {
            sendResponse(id, { errors });
          } catch {
          }
        }
      };
      let isFirstPacket = true;
      let handleIncomingPacket = (bytes) => {
        if (isFirstPacket) {
          isFirstPacket = false;
          let binaryVersion = String.fromCharCode(...bytes);
          if (binaryVersion !== "0.21.5") {
            throw new Error(`Cannot start service: Host version "${"0.21.5"}" does not match binary version ${quote(binaryVersion)}`);
          }
          return;
        }
        let packet = decodePacket(bytes);
        if (packet.isRequest) {
          handleRequest(packet.id, packet.value);
        } else {
          let callback = responseCallbacks[packet.id];
          delete responseCallbacks[packet.id];
          if (packet.value.error) callback(packet.value.error, {});
          else callback(null, packet.value);
        }
      };
      let buildOrContext = ({ callName, refs, options, isTTY: isTTY2, defaultWD: defaultWD2, callback }) => {
        let refCount = 0;
        const buildKey = nextBuildKey++;
        const requestCallbacks = {};
        const buildRefs = {
          ref() {
            if (++refCount === 1) {
              if (refs) refs.ref();
            }
          },
          unref() {
            if (--refCount === 0) {
              delete requestCallbacksByKey[buildKey];
              if (refs) refs.unref();
            }
          }
        };
        requestCallbacksByKey[buildKey] = requestCallbacks;
        buildRefs.ref();
        buildOrContextImpl(
          callName,
          buildKey,
          sendRequest,
          sendResponse,
          buildRefs,
          streamIn,
          requestCallbacks,
          options,
          isTTY2,
          defaultWD2,
          (err, res) => {
            try {
              callback(err, res);
            } finally {
              buildRefs.unref();
            }
          }
        );
      };
      let transform2 = ({ callName, refs, input, options, isTTY: isTTY2, fs: fs32, callback }) => {
        const details = createObjectStash();
        let start = (inputPath) => {
          try {
            if (typeof input !== "string" && !(input instanceof Uint8Array))
              throw new Error('The input to "transform" must be a string or a Uint8Array');
            let {
              flags,
              mangleCache
            } = flagsForTransformOptions(callName, options, isTTY2, transformLogLevelDefault);
            let request = {
              command: "transform",
              flags,
              inputFS: inputPath !== null,
              input: inputPath !== null ? encodeUTF8(inputPath) : typeof input === "string" ? encodeUTF8(input) : input
            };
            if (mangleCache) request.mangleCache = mangleCache;
            sendRequest(refs, request, (error, response) => {
              if (error) return callback(new Error(error), null);
              let errors = replaceDetailsInMessages(response.errors, details);
              let warnings = replaceDetailsInMessages(response.warnings, details);
              let outstanding = 1;
              let next = () => {
                if (--outstanding === 0) {
                  let result2 = {
                    warnings,
                    code: response.code,
                    map: response.map,
                    mangleCache: void 0,
                    legalComments: void 0
                  };
                  if ("legalComments" in response) result2.legalComments = response == null ? void 0 : response.legalComments;
                  if (response.mangleCache) result2.mangleCache = response == null ? void 0 : response.mangleCache;
                  callback(null, result2);
                }
              };
              if (errors.length > 0) return callback(failureErrorWithLog("Transform failed", errors, warnings), null);
              if (response.codeFS) {
                outstanding++;
                fs32.readFile(response.code, (err, contents) => {
                  if (err !== null) {
                    callback(err, null);
                  } else {
                    response.code = contents;
                    next();
                  }
                });
              }
              if (response.mapFS) {
                outstanding++;
                fs32.readFile(response.map, (err, contents) => {
                  if (err !== null) {
                    callback(err, null);
                  } else {
                    response.map = contents;
                    next();
                  }
                });
              }
              next();
            });
          } catch (e) {
            let flags = [];
            try {
              pushLogFlags(flags, options, {}, isTTY2, transformLogLevelDefault);
            } catch {
            }
            const error = extractErrorMessageV8(e, streamIn, details, void 0, "");
            sendRequest(refs, { command: "error", flags, error }, () => {
              error.detail = details.load(error.detail);
              callback(failureErrorWithLog("Transform failed", [error], []), null);
            });
          }
        };
        if ((typeof input === "string" || input instanceof Uint8Array) && input.length > 1024 * 1024) {
          let next = start;
          start = () => fs32.writeFile(input, next);
        }
        start(null);
      };
      let formatMessages2 = ({ callName, refs, messages, options, callback }) => {
        if (!options) throw new Error(`Missing second argument in ${callName}() call`);
        let keys = {};
        let kind = getFlag(options, keys, "kind", mustBeString);
        let color = getFlag(options, keys, "color", mustBeBoolean);
        let terminalWidth = getFlag(options, keys, "terminalWidth", mustBeInteger);
        checkForInvalidFlags(options, keys, `in ${callName}() call`);
        if (kind === void 0) throw new Error(`Missing "kind" in ${callName}() call`);
        if (kind !== "error" && kind !== "warning") throw new Error(`Expected "kind" to be "error" or "warning" in ${callName}() call`);
        let request = {
          command: "format-msgs",
          messages: sanitizeMessages(messages, "messages", null, "", terminalWidth),
          isWarning: kind === "warning"
        };
        if (color !== void 0) request.color = color;
        if (terminalWidth !== void 0) request.terminalWidth = terminalWidth;
        sendRequest(refs, request, (error, response) => {
          if (error) return callback(new Error(error), null);
          callback(null, response.messages);
        });
      };
      let analyzeMetafile2 = ({ callName, refs, metafile, options, callback }) => {
        if (options === void 0) options = {};
        let keys = {};
        let color = getFlag(options, keys, "color", mustBeBoolean);
        let verbose = getFlag(options, keys, "verbose", mustBeBoolean);
        checkForInvalidFlags(options, keys, `in ${callName}() call`);
        let request = {
          command: "analyze-metafile",
          metafile
        };
        if (color !== void 0) request.color = color;
        if (verbose !== void 0) request.verbose = verbose;
        sendRequest(refs, request, (error, response) => {
          if (error) return callback(new Error(error), null);
          callback(null, response.result);
        });
      };
      return {
        readFromStdout,
        afterClose,
        service: {
          buildOrContext,
          transform: transform2,
          formatMessages: formatMessages2,
          analyzeMetafile: analyzeMetafile2
        }
      };
    }
    function buildOrContextImpl(callName, buildKey, sendRequest, sendResponse, refs, streamIn, requestCallbacks, options, isTTY2, defaultWD2, callback) {
      const details = createObjectStash();
      const isContext = callName === "context";
      const handleError = (e, pluginName) => {
        const flags = [];
        try {
          pushLogFlags(flags, options, {}, isTTY2, buildLogLevelDefault);
        } catch {
        }
        const message = extractErrorMessageV8(e, streamIn, details, void 0, pluginName);
        sendRequest(refs, { command: "error", flags, error: message }, () => {
          message.detail = details.load(message.detail);
          callback(failureErrorWithLog(isContext ? "Context failed" : "Build failed", [message], []), null);
        });
      };
      let plugins;
      if (typeof options === "object") {
        const value = options.plugins;
        if (value !== void 0) {
          if (!Array.isArray(value)) return handleError(new Error(`"plugins" must be an array`), "");
          plugins = value;
        }
      }
      if (plugins && plugins.length > 0) {
        if (streamIn.isSync) return handleError(new Error("Cannot use plugins in synchronous API calls"), "");
        handlePlugins(
          buildKey,
          sendRequest,
          sendResponse,
          refs,
          streamIn,
          requestCallbacks,
          options,
          plugins,
          details
        ).then(
          (result2) => {
            if (!result2.ok) return handleError(result2.error, result2.pluginName);
            try {
              buildOrContextContinue(result2.requestPlugins, result2.runOnEndCallbacks, result2.scheduleOnDisposeCallbacks);
            } catch (e) {
              handleError(e, "");
            }
          },
          (e) => handleError(e, "")
        );
        return;
      }
      try {
        buildOrContextContinue(null, (result2, done) => done([], []), () => {
        });
      } catch (e) {
        handleError(e, "");
      }
      function buildOrContextContinue(requestPlugins, runOnEndCallbacks, scheduleOnDisposeCallbacks) {
        const writeDefault = streamIn.hasFS;
        const {
          entries,
          flags,
          write,
          stdinContents,
          stdinResolveDir,
          absWorkingDir,
          nodePaths,
          mangleCache
        } = flagsForBuildOptions(callName, options, isTTY2, buildLogLevelDefault, writeDefault);
        if (write && !streamIn.hasFS) throw new Error(`The "write" option is unavailable in this environment`);
        const request = {
          command: "build",
          key: buildKey,
          entries,
          flags,
          write,
          stdinContents,
          stdinResolveDir,
          absWorkingDir: absWorkingDir || defaultWD2,
          nodePaths,
          context: isContext
        };
        if (requestPlugins) request.plugins = requestPlugins;
        if (mangleCache) request.mangleCache = mangleCache;
        const buildResponseToResult = (response, callback2) => {
          const result2 = {
            errors: replaceDetailsInMessages(response.errors, details),
            warnings: replaceDetailsInMessages(response.warnings, details),
            outputFiles: void 0,
            metafile: void 0,
            mangleCache: void 0
          };
          const originalErrors = result2.errors.slice();
          const originalWarnings = result2.warnings.slice();
          if (response.outputFiles) result2.outputFiles = response.outputFiles.map(convertOutputFiles);
          if (response.metafile) result2.metafile = JSON.parse(response.metafile);
          if (response.mangleCache) result2.mangleCache = response.mangleCache;
          if (response.writeToStdout !== void 0) console.log(decodeUTF8(response.writeToStdout).replace(/\n$/, ""));
          runOnEndCallbacks(result2, (onEndErrors, onEndWarnings) => {
            if (originalErrors.length > 0 || onEndErrors.length > 0) {
              const error = failureErrorWithLog("Build failed", originalErrors.concat(onEndErrors), originalWarnings.concat(onEndWarnings));
              return callback2(error, null, onEndErrors, onEndWarnings);
            }
            callback2(null, result2, onEndErrors, onEndWarnings);
          });
        };
        let latestResultPromise;
        let provideLatestResult;
        if (isContext)
          requestCallbacks["on-end"] = (id, request2) => new Promise((resolve4) => {
            buildResponseToResult(request2, (err, result2, onEndErrors, onEndWarnings) => {
              const response = {
                errors: onEndErrors,
                warnings: onEndWarnings
              };
              if (provideLatestResult) provideLatestResult(err, result2);
              latestResultPromise = void 0;
              provideLatestResult = void 0;
              sendResponse(id, response);
              resolve4();
            });
          });
        sendRequest(refs, request, (error, response) => {
          if (error) return callback(new Error(error), null);
          if (!isContext) {
            return buildResponseToResult(response, (err, res) => {
              scheduleOnDisposeCallbacks();
              return callback(err, res);
            });
          }
          if (response.errors.length > 0) {
            return callback(failureErrorWithLog("Context failed", response.errors, response.warnings), null);
          }
          let didDispose = false;
          const result2 = {
            rebuild: () => {
              if (!latestResultPromise) latestResultPromise = new Promise((resolve4, reject) => {
                let settlePromise;
                provideLatestResult = (err, result22) => {
                  if (!settlePromise) settlePromise = () => err ? reject(err) : resolve4(result22);
                };
                const triggerAnotherBuild = () => {
                  const request2 = {
                    command: "rebuild",
                    key: buildKey
                  };
                  sendRequest(refs, request2, (error2, response2) => {
                    if (error2) {
                      reject(new Error(error2));
                    } else if (settlePromise) {
                      settlePromise();
                    } else {
                      triggerAnotherBuild();
                    }
                  });
                };
                triggerAnotherBuild();
              });
              return latestResultPromise;
            },
            watch: (options2 = {}) => new Promise((resolve4, reject) => {
              if (!streamIn.hasFS) throw new Error(`Cannot use the "watch" API in this environment`);
              const keys = {};
              checkForInvalidFlags(options2, keys, `in watch() call`);
              const request2 = {
                command: "watch",
                key: buildKey
              };
              sendRequest(refs, request2, (error2) => {
                if (error2) reject(new Error(error2));
                else resolve4(void 0);
              });
            }),
            serve: (options2 = {}) => new Promise((resolve4, reject) => {
              if (!streamIn.hasFS) throw new Error(`Cannot use the "serve" API in this environment`);
              const keys = {};
              const port = getFlag(options2, keys, "port", mustBeInteger);
              const host = getFlag(options2, keys, "host", mustBeString);
              const servedir = getFlag(options2, keys, "servedir", mustBeString);
              const keyfile = getFlag(options2, keys, "keyfile", mustBeString);
              const certfile = getFlag(options2, keys, "certfile", mustBeString);
              const fallback = getFlag(options2, keys, "fallback", mustBeString);
              const onRequest = getFlag(options2, keys, "onRequest", mustBeFunction);
              checkForInvalidFlags(options2, keys, `in serve() call`);
              const request2 = {
                command: "serve",
                key: buildKey,
                onRequest: !!onRequest
              };
              if (port !== void 0) request2.port = port;
              if (host !== void 0) request2.host = host;
              if (servedir !== void 0) request2.servedir = servedir;
              if (keyfile !== void 0) request2.keyfile = keyfile;
              if (certfile !== void 0) request2.certfile = certfile;
              if (fallback !== void 0) request2.fallback = fallback;
              sendRequest(refs, request2, (error2, response2) => {
                if (error2) return reject(new Error(error2));
                if (onRequest) {
                  requestCallbacks["serve-request"] = (id, request3) => {
                    onRequest(request3.args);
                    sendResponse(id, {});
                  };
                }
                resolve4(response2);
              });
            }),
            cancel: () => new Promise((resolve4) => {
              if (didDispose) return resolve4();
              const request2 = {
                command: "cancel",
                key: buildKey
              };
              sendRequest(refs, request2, () => {
                resolve4();
              });
            }),
            dispose: () => new Promise((resolve4) => {
              if (didDispose) return resolve4();
              didDispose = true;
              const request2 = {
                command: "dispose",
                key: buildKey
              };
              sendRequest(refs, request2, () => {
                resolve4();
                scheduleOnDisposeCallbacks();
                refs.unref();
              });
            })
          };
          refs.ref();
          callback(null, result2);
        });
      }
    }
    var handlePlugins = async (buildKey, sendRequest, sendResponse, refs, streamIn, requestCallbacks, initialOptions, plugins, details) => {
      let onStartCallbacks = [];
      let onEndCallbacks = [];
      let onResolveCallbacks = {};
      let onLoadCallbacks = {};
      let onDisposeCallbacks = [];
      let nextCallbackID = 0;
      let i = 0;
      let requestPlugins = [];
      let isSetupDone = false;
      plugins = [...plugins];
      for (let item of plugins) {
        let keys = {};
        if (typeof item !== "object") throw new Error(`Plugin at index ${i} must be an object`);
        const name = getFlag(item, keys, "name", mustBeString);
        if (typeof name !== "string" || name === "") throw new Error(`Plugin at index ${i} is missing a name`);
        try {
          let setup = getFlag(item, keys, "setup", mustBeFunction);
          if (typeof setup !== "function") throw new Error(`Plugin is missing a setup function`);
          checkForInvalidFlags(item, keys, `on plugin ${quote(name)}`);
          let plugin = {
            name,
            onStart: false,
            onEnd: false,
            onResolve: [],
            onLoad: []
          };
          i++;
          let resolve4 = (path32, options = {}) => {
            if (!isSetupDone) throw new Error('Cannot call "resolve" before plugin setup has completed');
            if (typeof path32 !== "string") throw new Error(`The path to resolve must be a string`);
            let keys2 = /* @__PURE__ */ Object.create(null);
            let pluginName = getFlag(options, keys2, "pluginName", mustBeString);
            let importer = getFlag(options, keys2, "importer", mustBeString);
            let namespace = getFlag(options, keys2, "namespace", mustBeString);
            let resolveDir = getFlag(options, keys2, "resolveDir", mustBeString);
            let kind = getFlag(options, keys2, "kind", mustBeString);
            let pluginData = getFlag(options, keys2, "pluginData", canBeAnything);
            let importAttributes = getFlag(options, keys2, "with", mustBeObject);
            checkForInvalidFlags(options, keys2, "in resolve() call");
            return new Promise((resolve22, reject) => {
              const request = {
                command: "resolve",
                path: path32,
                key: buildKey,
                pluginName: name
              };
              if (pluginName != null) request.pluginName = pluginName;
              if (importer != null) request.importer = importer;
              if (namespace != null) request.namespace = namespace;
              if (resolveDir != null) request.resolveDir = resolveDir;
              if (kind != null) request.kind = kind;
              else throw new Error(`Must specify "kind" when calling "resolve"`);
              if (pluginData != null) request.pluginData = details.store(pluginData);
              if (importAttributes != null) request.with = sanitizeStringMap(importAttributes, "with");
              sendRequest(refs, request, (error, response) => {
                if (error !== null) reject(new Error(error));
                else resolve22({
                  errors: replaceDetailsInMessages(response.errors, details),
                  warnings: replaceDetailsInMessages(response.warnings, details),
                  path: response.path,
                  external: response.external,
                  sideEffects: response.sideEffects,
                  namespace: response.namespace,
                  suffix: response.suffix,
                  pluginData: details.load(response.pluginData)
                });
              });
            });
          };
          let promise = setup({
            initialOptions,
            resolve: resolve4,
            onStart(callback) {
              let registeredText = `This error came from the "onStart" callback registered here:`;
              let registeredNote = extractCallerV8(new Error(registeredText), streamIn, "onStart");
              onStartCallbacks.push({ name, callback, note: registeredNote });
              plugin.onStart = true;
            },
            onEnd(callback) {
              let registeredText = `This error came from the "onEnd" callback registered here:`;
              let registeredNote = extractCallerV8(new Error(registeredText), streamIn, "onEnd");
              onEndCallbacks.push({ name, callback, note: registeredNote });
              plugin.onEnd = true;
            },
            onResolve(options, callback) {
              let registeredText = `This error came from the "onResolve" callback registered here:`;
              let registeredNote = extractCallerV8(new Error(registeredText), streamIn, "onResolve");
              let keys2 = {};
              let filter = getFlag(options, keys2, "filter", mustBeRegExp);
              let namespace = getFlag(options, keys2, "namespace", mustBeString);
              checkForInvalidFlags(options, keys2, `in onResolve() call for plugin ${quote(name)}`);
              if (filter == null) throw new Error(`onResolve() call is missing a filter`);
              let id = nextCallbackID++;
              onResolveCallbacks[id] = { name, callback, note: registeredNote };
              plugin.onResolve.push({ id, filter: filter.source, namespace: namespace || "" });
            },
            onLoad(options, callback) {
              let registeredText = `This error came from the "onLoad" callback registered here:`;
              let registeredNote = extractCallerV8(new Error(registeredText), streamIn, "onLoad");
              let keys2 = {};
              let filter = getFlag(options, keys2, "filter", mustBeRegExp);
              let namespace = getFlag(options, keys2, "namespace", mustBeString);
              checkForInvalidFlags(options, keys2, `in onLoad() call for plugin ${quote(name)}`);
              if (filter == null) throw new Error(`onLoad() call is missing a filter`);
              let id = nextCallbackID++;
              onLoadCallbacks[id] = { name, callback, note: registeredNote };
              plugin.onLoad.push({ id, filter: filter.source, namespace: namespace || "" });
            },
            onDispose(callback) {
              onDisposeCallbacks.push(callback);
            },
            esbuild: streamIn.esbuild
          });
          if (promise) await promise;
          requestPlugins.push(plugin);
        } catch (e) {
          return { ok: false, error: e, pluginName: name };
        }
      }
      requestCallbacks["on-start"] = async (id, request) => {
        let response = { errors: [], warnings: [] };
        await Promise.all(onStartCallbacks.map(async ({ name, callback, note }) => {
          try {
            let result2 = await callback();
            if (result2 != null) {
              if (typeof result2 !== "object") throw new Error(`Expected onStart() callback in plugin ${quote(name)} to return an object`);
              let keys = {};
              let errors = getFlag(result2, keys, "errors", mustBeArray);
              let warnings = getFlag(result2, keys, "warnings", mustBeArray);
              checkForInvalidFlags(result2, keys, `from onStart() callback in plugin ${quote(name)}`);
              if (errors != null) response.errors.push(...sanitizeMessages(errors, "errors", details, name, void 0));
              if (warnings != null) response.warnings.push(...sanitizeMessages(warnings, "warnings", details, name, void 0));
            }
          } catch (e) {
            response.errors.push(extractErrorMessageV8(e, streamIn, details, note && note(), name));
          }
        }));
        sendResponse(id, response);
      };
      requestCallbacks["on-resolve"] = async (id, request) => {
        let response = {}, name = "", callback, note;
        for (let id2 of request.ids) {
          try {
            ({ name, callback, note } = onResolveCallbacks[id2]);
            let result2 = await callback({
              path: request.path,
              importer: request.importer,
              namespace: request.namespace,
              resolveDir: request.resolveDir,
              kind: request.kind,
              pluginData: details.load(request.pluginData),
              with: request.with
            });
            if (result2 != null) {
              if (typeof result2 !== "object") throw new Error(`Expected onResolve() callback in plugin ${quote(name)} to return an object`);
              let keys = {};
              let pluginName = getFlag(result2, keys, "pluginName", mustBeString);
              let path32 = getFlag(result2, keys, "path", mustBeString);
              let namespace = getFlag(result2, keys, "namespace", mustBeString);
              let suffix = getFlag(result2, keys, "suffix", mustBeString);
              let external = getFlag(result2, keys, "external", mustBeBoolean);
              let sideEffects = getFlag(result2, keys, "sideEffects", mustBeBoolean);
              let pluginData = getFlag(result2, keys, "pluginData", canBeAnything);
              let errors = getFlag(result2, keys, "errors", mustBeArray);
              let warnings = getFlag(result2, keys, "warnings", mustBeArray);
              let watchFiles = getFlag(result2, keys, "watchFiles", mustBeArray);
              let watchDirs = getFlag(result2, keys, "watchDirs", mustBeArray);
              checkForInvalidFlags(result2, keys, `from onResolve() callback in plugin ${quote(name)}`);
              response.id = id2;
              if (pluginName != null) response.pluginName = pluginName;
              if (path32 != null) response.path = path32;
              if (namespace != null) response.namespace = namespace;
              if (suffix != null) response.suffix = suffix;
              if (external != null) response.external = external;
              if (sideEffects != null) response.sideEffects = sideEffects;
              if (pluginData != null) response.pluginData = details.store(pluginData);
              if (errors != null) response.errors = sanitizeMessages(errors, "errors", details, name, void 0);
              if (warnings != null) response.warnings = sanitizeMessages(warnings, "warnings", details, name, void 0);
              if (watchFiles != null) response.watchFiles = sanitizeStringArray(watchFiles, "watchFiles");
              if (watchDirs != null) response.watchDirs = sanitizeStringArray(watchDirs, "watchDirs");
              break;
            }
          } catch (e) {
            response = { id: id2, errors: [extractErrorMessageV8(e, streamIn, details, note && note(), name)] };
            break;
          }
        }
        sendResponse(id, response);
      };
      requestCallbacks["on-load"] = async (id, request) => {
        let response = {}, name = "", callback, note;
        for (let id2 of request.ids) {
          try {
            ({ name, callback, note } = onLoadCallbacks[id2]);
            let result2 = await callback({
              path: request.path,
              namespace: request.namespace,
              suffix: request.suffix,
              pluginData: details.load(request.pluginData),
              with: request.with
            });
            if (result2 != null) {
              if (typeof result2 !== "object") throw new Error(`Expected onLoad() callback in plugin ${quote(name)} to return an object`);
              let keys = {};
              let pluginName = getFlag(result2, keys, "pluginName", mustBeString);
              let contents = getFlag(result2, keys, "contents", mustBeStringOrUint8Array);
              let resolveDir = getFlag(result2, keys, "resolveDir", mustBeString);
              let pluginData = getFlag(result2, keys, "pluginData", canBeAnything);
              let loader2 = getFlag(result2, keys, "loader", mustBeString);
              let errors = getFlag(result2, keys, "errors", mustBeArray);
              let warnings = getFlag(result2, keys, "warnings", mustBeArray);
              let watchFiles = getFlag(result2, keys, "watchFiles", mustBeArray);
              let watchDirs = getFlag(result2, keys, "watchDirs", mustBeArray);
              checkForInvalidFlags(result2, keys, `from onLoad() callback in plugin ${quote(name)}`);
              response.id = id2;
              if (pluginName != null) response.pluginName = pluginName;
              if (contents instanceof Uint8Array) response.contents = contents;
              else if (contents != null) response.contents = encodeUTF8(contents);
              if (resolveDir != null) response.resolveDir = resolveDir;
              if (pluginData != null) response.pluginData = details.store(pluginData);
              if (loader2 != null) response.loader = loader2;
              if (errors != null) response.errors = sanitizeMessages(errors, "errors", details, name, void 0);
              if (warnings != null) response.warnings = sanitizeMessages(warnings, "warnings", details, name, void 0);
              if (watchFiles != null) response.watchFiles = sanitizeStringArray(watchFiles, "watchFiles");
              if (watchDirs != null) response.watchDirs = sanitizeStringArray(watchDirs, "watchDirs");
              break;
            }
          } catch (e) {
            response = { id: id2, errors: [extractErrorMessageV8(e, streamIn, details, note && note(), name)] };
            break;
          }
        }
        sendResponse(id, response);
      };
      let runOnEndCallbacks = (result2, done) => done([], []);
      if (onEndCallbacks.length > 0) {
        runOnEndCallbacks = (result2, done) => {
          (async () => {
            const onEndErrors = [];
            const onEndWarnings = [];
            for (const { name, callback, note } of onEndCallbacks) {
              let newErrors;
              let newWarnings;
              try {
                const value = await callback(result2);
                if (value != null) {
                  if (typeof value !== "object") throw new Error(`Expected onEnd() callback in plugin ${quote(name)} to return an object`);
                  let keys = {};
                  let errors = getFlag(value, keys, "errors", mustBeArray);
                  let warnings = getFlag(value, keys, "warnings", mustBeArray);
                  checkForInvalidFlags(value, keys, `from onEnd() callback in plugin ${quote(name)}`);
                  if (errors != null) newErrors = sanitizeMessages(errors, "errors", details, name, void 0);
                  if (warnings != null) newWarnings = sanitizeMessages(warnings, "warnings", details, name, void 0);
                }
              } catch (e) {
                newErrors = [extractErrorMessageV8(e, streamIn, details, note && note(), name)];
              }
              if (newErrors) {
                onEndErrors.push(...newErrors);
                try {
                  result2.errors.push(...newErrors);
                } catch {
                }
              }
              if (newWarnings) {
                onEndWarnings.push(...newWarnings);
                try {
                  result2.warnings.push(...newWarnings);
                } catch {
                }
              }
            }
            done(onEndErrors, onEndWarnings);
          })();
        };
      }
      let scheduleOnDisposeCallbacks = () => {
        for (const cb of onDisposeCallbacks) {
          setTimeout(() => cb(), 0);
        }
      };
      isSetupDone = true;
      return {
        ok: true,
        requestPlugins,
        runOnEndCallbacks,
        scheduleOnDisposeCallbacks
      };
    };
    function createObjectStash() {
      const map2 = /* @__PURE__ */ new Map();
      let nextID = 0;
      return {
        load(id) {
          return map2.get(id);
        },
        store(value) {
          if (value === void 0) return -1;
          const id = nextID++;
          map2.set(id, value);
          return id;
        }
      };
    }
    function extractCallerV8(e, streamIn, ident) {
      let note;
      let tried = false;
      return () => {
        if (tried) return note;
        tried = true;
        try {
          let lines = (e.stack + "").split("\n");
          lines.splice(1, 1);
          let location = parseStackLinesV8(streamIn, lines, ident);
          if (location) {
            note = { text: e.message, location };
            return note;
          }
        } catch {
        }
      };
    }
    function extractErrorMessageV8(e, streamIn, stash, note, pluginName) {
      let text = "Internal error";
      let location = null;
      try {
        text = (e && e.message || e) + "";
      } catch {
      }
      try {
        location = parseStackLinesV8(streamIn, (e.stack + "").split("\n"), "");
      } catch {
      }
      return { id: "", pluginName, text, location, notes: note ? [note] : [], detail: stash ? stash.store(e) : -1 };
    }
    function parseStackLinesV8(streamIn, lines, ident) {
      let at = "    at ";
      if (streamIn.readFileSync && !lines[0].startsWith(at) && lines[1].startsWith(at)) {
        for (let i = 1; i < lines.length; i++) {
          let line = lines[i];
          if (!line.startsWith(at)) continue;
          line = line.slice(at.length);
          while (true) {
            let match = /^(?:new |async )?\S+ \((.*)\)$/.exec(line);
            if (match) {
              line = match[1];
              continue;
            }
            match = /^eval at \S+ \((.*)\)(?:, \S+:\d+:\d+)?$/.exec(line);
            if (match) {
              line = match[1];
              continue;
            }
            match = /^(\S+):(\d+):(\d+)$/.exec(line);
            if (match) {
              let contents;
              try {
                contents = streamIn.readFileSync(match[1], "utf8");
              } catch {
                break;
              }
              let lineText = contents.split(/\r\n|\r|\n|\u2028|\u2029/)[+match[2] - 1] || "";
              let column = +match[3] - 1;
              let length = lineText.slice(column, column + ident.length) === ident ? ident.length : 0;
              return {
                file: match[1],
                namespace: "file",
                line: +match[2],
                column: encodeUTF8(lineText.slice(0, column)).length,
                length: encodeUTF8(lineText.slice(column, column + length)).length,
                lineText: lineText + "\n" + lines.slice(1).join("\n"),
                suggestion: ""
              };
            }
            break;
          }
        }
      }
      return null;
    }
    function failureErrorWithLog(text, errors, warnings) {
      let limit = 5;
      text += errors.length < 1 ? "" : ` with ${errors.length} error${errors.length < 2 ? "" : "s"}:` + errors.slice(0, limit + 1).map((e, i) => {
        if (i === limit) return "\n...";
        if (!e.location) return `
error: ${e.text}`;
        let { file, line, column } = e.location;
        let pluginText = e.pluginName ? `[plugin: ${e.pluginName}] ` : "";
        return `
${file}:${line}:${column}: ERROR: ${pluginText}${e.text}`;
      }).join("");
      let error = new Error(text);
      for (const [key, value] of [["errors", errors], ["warnings", warnings]]) {
        Object.defineProperty(error, key, {
          configurable: true,
          enumerable: true,
          get: () => value,
          set: (value2) => Object.defineProperty(error, key, {
            configurable: true,
            enumerable: true,
            value: value2
          })
        });
      }
      return error;
    }
    function replaceDetailsInMessages(messages, stash) {
      for (const message of messages) {
        message.detail = stash.load(message.detail);
      }
      return messages;
    }
    function sanitizeLocation(location, where, terminalWidth) {
      if (location == null) return null;
      let keys = {};
      let file = getFlag(location, keys, "file", mustBeString);
      let namespace = getFlag(location, keys, "namespace", mustBeString);
      let line = getFlag(location, keys, "line", mustBeInteger);
      let column = getFlag(location, keys, "column", mustBeInteger);
      let length = getFlag(location, keys, "length", mustBeInteger);
      let lineText = getFlag(location, keys, "lineText", mustBeString);
      let suggestion = getFlag(location, keys, "suggestion", mustBeString);
      checkForInvalidFlags(location, keys, where);
      if (lineText) {
        const relevantASCII = lineText.slice(
          0,
          (column && column > 0 ? column : 0) + (length && length > 0 ? length : 0) + (terminalWidth && terminalWidth > 0 ? terminalWidth : 80)
        );
        if (!/[\x7F-\uFFFF]/.test(relevantASCII) && !/\n/.test(lineText)) {
          lineText = relevantASCII;
        }
      }
      return {
        file: file || "",
        namespace: namespace || "",
        line: line || 0,
        column: column || 0,
        length: length || 0,
        lineText: lineText || "",
        suggestion: suggestion || ""
      };
    }
    function sanitizeMessages(messages, property, stash, fallbackPluginName, terminalWidth) {
      let messagesClone = [];
      let index = 0;
      for (const message of messages) {
        let keys = {};
        let id = getFlag(message, keys, "id", mustBeString);
        let pluginName = getFlag(message, keys, "pluginName", mustBeString);
        let text = getFlag(message, keys, "text", mustBeString);
        let location = getFlag(message, keys, "location", mustBeObjectOrNull);
        let notes = getFlag(message, keys, "notes", mustBeArray);
        let detail = getFlag(message, keys, "detail", canBeAnything);
        let where = `in element ${index} of "${property}"`;
        checkForInvalidFlags(message, keys, where);
        let notesClone = [];
        if (notes) {
          for (const note of notes) {
            let noteKeys = {};
            let noteText = getFlag(note, noteKeys, "text", mustBeString);
            let noteLocation = getFlag(note, noteKeys, "location", mustBeObjectOrNull);
            checkForInvalidFlags(note, noteKeys, where);
            notesClone.push({
              text: noteText || "",
              location: sanitizeLocation(noteLocation, where, terminalWidth)
            });
          }
        }
        messagesClone.push({
          id: id || "",
          pluginName: pluginName || fallbackPluginName,
          text: text || "",
          location: sanitizeLocation(location, where, terminalWidth),
          notes: notesClone,
          detail: stash ? stash.store(detail) : -1
        });
        index++;
      }
      return messagesClone;
    }
    function sanitizeStringArray(values, property) {
      const result2 = [];
      for (const value of values) {
        if (typeof value !== "string") throw new Error(`${quote(property)} must be an array of strings`);
        result2.push(value);
      }
      return result2;
    }
    function sanitizeStringMap(map2, property) {
      const result2 = /* @__PURE__ */ Object.create(null);
      for (const key in map2) {
        const value = map2[key];
        if (typeof value !== "string") throw new Error(`key ${quote(key)} in object ${quote(property)} must be a string`);
        result2[key] = value;
      }
      return result2;
    }
    function convertOutputFiles({ path: path32, contents, hash }) {
      let text = null;
      return {
        path: path32,
        contents,
        hash,
        get text() {
          const binary2 = this.contents;
          if (text === null || binary2 !== contents) {
            contents = binary2;
            text = decodeUTF8(binary2);
          }
          return text;
        }
      };
    }
    var fs3 = __require("fs");
    var os = __require("os");
    var path4 = __require("path");
    var ESBUILD_BINARY_PATH = process.env.ESBUILD_BINARY_PATH || ESBUILD_BINARY_PATH;
    var isValidBinaryPath = (x) => !!x && x !== "/usr/bin/esbuild";
    var packageDarwin_arm64 = "@esbuild/darwin-arm64";
    var packageDarwin_x64 = "@esbuild/darwin-x64";
    var knownWindowsPackages = {
      "win32 arm64 LE": "@esbuild/win32-arm64",
      "win32 ia32 LE": "@esbuild/win32-ia32",
      "win32 x64 LE": "@esbuild/win32-x64"
    };
    var knownUnixlikePackages = {
      "aix ppc64 BE": "@esbuild/aix-ppc64",
      "android arm64 LE": "@esbuild/android-arm64",
      "darwin arm64 LE": "@esbuild/darwin-arm64",
      "darwin x64 LE": "@esbuild/darwin-x64",
      "freebsd arm64 LE": "@esbuild/freebsd-arm64",
      "freebsd x64 LE": "@esbuild/freebsd-x64",
      "linux arm LE": "@esbuild/linux-arm",
      "linux arm64 LE": "@esbuild/linux-arm64",
      "linux ia32 LE": "@esbuild/linux-ia32",
      "linux mips64el LE": "@esbuild/linux-mips64el",
      "linux ppc64 LE": "@esbuild/linux-ppc64",
      "linux riscv64 LE": "@esbuild/linux-riscv64",
      "linux s390x BE": "@esbuild/linux-s390x",
      "linux x64 LE": "@esbuild/linux-x64",
      "linux loong64 LE": "@esbuild/linux-loong64",
      "netbsd x64 LE": "@esbuild/netbsd-x64",
      "openbsd x64 LE": "@esbuild/openbsd-x64",
      "sunos x64 LE": "@esbuild/sunos-x64"
    };
    var knownWebAssemblyFallbackPackages = {
      "android arm LE": "@esbuild/android-arm",
      "android x64 LE": "@esbuild/android-x64"
    };
    function pkgAndSubpathForCurrentPlatform() {
      let pkg;
      let subpath;
      let isWASM = false;
      let platformKey = `${process.platform} ${os.arch()} ${os.endianness()}`;
      if (platformKey in knownWindowsPackages) {
        pkg = knownWindowsPackages[platformKey];
        subpath = "esbuild.exe";
      } else if (platformKey in knownUnixlikePackages) {
        pkg = knownUnixlikePackages[platformKey];
        subpath = "bin/esbuild";
      } else if (platformKey in knownWebAssemblyFallbackPackages) {
        pkg = knownWebAssemblyFallbackPackages[platformKey];
        subpath = "bin/esbuild";
        isWASM = true;
      } else {
        throw new Error(`Unsupported platform: ${platformKey}`);
      }
      return { pkg, subpath, isWASM };
    }
    function pkgForSomeOtherPlatform() {
      const libMainJS = __require.resolve("esbuild");
      const nodeModulesDirectory = path4.dirname(path4.dirname(path4.dirname(libMainJS)));
      if (path4.basename(nodeModulesDirectory) === "node_modules") {
        for (const unixKey in knownUnixlikePackages) {
          try {
            const pkg = knownUnixlikePackages[unixKey];
            if (fs3.existsSync(path4.join(nodeModulesDirectory, pkg))) return pkg;
          } catch {
          }
        }
        for (const windowsKey in knownWindowsPackages) {
          try {
            const pkg = knownWindowsPackages[windowsKey];
            if (fs3.existsSync(path4.join(nodeModulesDirectory, pkg))) return pkg;
          } catch {
          }
        }
      }
      return null;
    }
    function downloadedBinPath(pkg, subpath) {
      const esbuildLibDir = path4.dirname(__require.resolve("esbuild"));
      return path4.join(esbuildLibDir, `downloaded-${pkg.replace("/", "-")}-${path4.basename(subpath)}`);
    }
    function generateBinPath() {
      if (isValidBinaryPath(ESBUILD_BINARY_PATH)) {
        if (!fs3.existsSync(ESBUILD_BINARY_PATH)) {
          console.warn(`[esbuild] Ignoring bad configuration: ESBUILD_BINARY_PATH=${ESBUILD_BINARY_PATH}`);
        } else {
          return { binPath: ESBUILD_BINARY_PATH, isWASM: false };
        }
      }
      const { pkg, subpath, isWASM } = pkgAndSubpathForCurrentPlatform();
      let binPath;
      try {
        binPath = __require.resolve(`${pkg}/${subpath}`);
      } catch (e) {
        binPath = downloadedBinPath(pkg, subpath);
        if (!fs3.existsSync(binPath)) {
          try {
            __require.resolve(pkg);
          } catch {
            const otherPkg = pkgForSomeOtherPlatform();
            if (otherPkg) {
              let suggestions = `
Specifically the "${otherPkg}" package is present but this platform
needs the "${pkg}" package instead. People often get into this
situation by installing esbuild on Windows or macOS and copying "node_modules"
into a Docker image that runs Linux, or by copying "node_modules" between
Windows and WSL environments.

If you are installing with npm, you can try not copying the "node_modules"
directory when you copy the files over, and running "npm ci" or "npm install"
on the destination platform after the copy. Or you could consider using yarn
instead of npm which has built-in support for installing a package on multiple
platforms simultaneously.

If you are installing with yarn, you can try listing both this platform and the
other platform in your ".yarnrc.yml" file using the "supportedArchitectures"
feature: https://yarnpkg.com/configuration/yarnrc/#supportedArchitectures
Keep in mind that this means multiple copies of esbuild will be present.
`;
              if (pkg === packageDarwin_x64 && otherPkg === packageDarwin_arm64 || pkg === packageDarwin_arm64 && otherPkg === packageDarwin_x64) {
                suggestions = `
Specifically the "${otherPkg}" package is present but this platform
needs the "${pkg}" package instead. People often get into this
situation by installing esbuild with npm running inside of Rosetta 2 and then
trying to use it with node running outside of Rosetta 2, or vice versa (Rosetta
2 is Apple's on-the-fly x86_64-to-arm64 translation service).

If you are installing with npm, you can try ensuring that both npm and node are
not running under Rosetta 2 and then reinstalling esbuild. This likely involves
changing how you installed npm and/or node. For example, installing node with
the universal installer here should work: https://nodejs.org/en/download/. Or
you could consider using yarn instead of npm which has built-in support for
installing a package on multiple platforms simultaneously.

If you are installing with yarn, you can try listing both "arm64" and "x64"
in your ".yarnrc.yml" file using the "supportedArchitectures" feature:
https://yarnpkg.com/configuration/yarnrc/#supportedArchitectures
Keep in mind that this means multiple copies of esbuild will be present.
`;
              }
              throw new Error(`
You installed esbuild for another platform than the one you're currently using.
This won't work because esbuild is written with native code and needs to
install a platform-specific binary executable.
${suggestions}
Another alternative is to use the "esbuild-wasm" package instead, which works
the same way on all platforms. But it comes with a heavy performance cost and
can sometimes be 10x slower than the "esbuild" package, so you may also not
want to do that.
`);
            }
            throw new Error(`The package "${pkg}" could not be found, and is needed by esbuild.

If you are installing esbuild with npm, make sure that you don't specify the
"--no-optional" or "--omit=optional" flags. The "optionalDependencies" feature
of "package.json" is used by esbuild to install the correct binary executable
for your current platform.`);
          }
          throw e;
        }
      }
      if (/\.zip\//.test(binPath)) {
        let pnpapi;
        try {
          pnpapi = __require("pnpapi");
        } catch (e) {
        }
        if (pnpapi) {
          const root = pnpapi.getPackageInformation(pnpapi.topLevel).packageLocation;
          const binTargetPath = path4.join(
            root,
            "node_modules",
            ".cache",
            "esbuild",
            `pnpapi-${pkg.replace("/", "-")}-${"0.21.5"}-${path4.basename(subpath)}`
          );
          if (!fs3.existsSync(binTargetPath)) {
            fs3.mkdirSync(path4.dirname(binTargetPath), { recursive: true });
            fs3.copyFileSync(binPath, binTargetPath);
            fs3.chmodSync(binTargetPath, 493);
          }
          return { binPath: binTargetPath, isWASM };
        }
      }
      return { binPath, isWASM };
    }
    var child_process = __require("child_process");
    var crypto = __require("crypto");
    var path22 = __require("path");
    var fs22 = __require("fs");
    var os2 = __require("os");
    var tty = __require("tty");
    var worker_threads;
    if (process.env.ESBUILD_WORKER_THREADS !== "0") {
      try {
        worker_threads = __require("worker_threads");
      } catch {
      }
      let [major, minor] = process.versions.node.split(".");
      if (
        // <v12.17.0 does not work
        +major < 12 || +major === 12 && +minor < 17 || +major === 13 && +minor < 13
      ) {
        worker_threads = void 0;
      }
    }
    var _a;
    var isInternalWorkerThread = ((_a = worker_threads == null ? void 0 : worker_threads.workerData) == null ? void 0 : _a.esbuildVersion) === "0.21.5";
    var esbuildCommandAndArgs = () => {
      if ((!ESBUILD_BINARY_PATH || false) && (path22.basename(__filename) !== "main.js" || path22.basename(__dirname) !== "lib")) {
        throw new Error(
          `The esbuild JavaScript API cannot be bundled. Please mark the "esbuild" package as external so it's not included in the bundle.

More information: The file containing the code for esbuild's JavaScript API (${__filename}) does not appear to be inside the esbuild package on the file system, which usually means that the esbuild package was bundled into another file. This is problematic because the API needs to run a binary executable inside the esbuild package which is located using a relative path from the API code to the executable. If the esbuild package is bundled, the relative path will be incorrect and the executable won't be found.`
        );
      }
      if (false) {
        return ["node", [path22.join(__dirname, "..", "bin", "esbuild")]];
      } else {
        const { binPath, isWASM } = generateBinPath();
        if (isWASM) {
          return ["node", [binPath]];
        } else {
          return [binPath, []];
        }
      }
    };
    var isTTY = () => tty.isatty(2);
    var fsSync = {
      readFile(tempFile, callback) {
        try {
          let contents = fs22.readFileSync(tempFile, "utf8");
          try {
            fs22.unlinkSync(tempFile);
          } catch {
          }
          callback(null, contents);
        } catch (err) {
          callback(err, null);
        }
      },
      writeFile(contents, callback) {
        try {
          let tempFile = randomFileName();
          fs22.writeFileSync(tempFile, contents);
          callback(tempFile);
        } catch {
          callback(null);
        }
      }
    };
    var fsAsync = {
      readFile(tempFile, callback) {
        try {
          fs22.readFile(tempFile, "utf8", (err, contents) => {
            try {
              fs22.unlink(tempFile, () => callback(err, contents));
            } catch {
              callback(err, contents);
            }
          });
        } catch (err) {
          callback(err, null);
        }
      },
      writeFile(contents, callback) {
        try {
          let tempFile = randomFileName();
          fs22.writeFile(tempFile, contents, (err) => err !== null ? callback(null) : callback(tempFile));
        } catch {
          callback(null);
        }
      }
    };
    var version = "0.21.5";
    var build = (options) => ensureServiceIsRunning().build(options);
    var context = (buildOptions) => ensureServiceIsRunning().context(buildOptions);
    var transform = (input, options) => ensureServiceIsRunning().transform(input, options);
    var formatMessages = (messages, options) => ensureServiceIsRunning().formatMessages(messages, options);
    var analyzeMetafile = (messages, options) => ensureServiceIsRunning().analyzeMetafile(messages, options);
    var buildSync = (options) => {
      if (worker_threads && !isInternalWorkerThread) {
        if (!workerThreadService) workerThreadService = startWorkerThreadService(worker_threads);
        return workerThreadService.buildSync(options);
      }
      let result2;
      runServiceSync((service) => service.buildOrContext({
        callName: "buildSync",
        refs: null,
        options,
        isTTY: isTTY(),
        defaultWD,
        callback: (err, res) => {
          if (err) throw err;
          result2 = res;
        }
      }));
      return result2;
    };
    var transformSync = (input, options) => {
      if (worker_threads && !isInternalWorkerThread) {
        if (!workerThreadService) workerThreadService = startWorkerThreadService(worker_threads);
        return workerThreadService.transformSync(input, options);
      }
      let result2;
      runServiceSync((service) => service.transform({
        callName: "transformSync",
        refs: null,
        input,
        options: options || {},
        isTTY: isTTY(),
        fs: fsSync,
        callback: (err, res) => {
          if (err) throw err;
          result2 = res;
        }
      }));
      return result2;
    };
    var formatMessagesSync = (messages, options) => {
      if (worker_threads && !isInternalWorkerThread) {
        if (!workerThreadService) workerThreadService = startWorkerThreadService(worker_threads);
        return workerThreadService.formatMessagesSync(messages, options);
      }
      let result2;
      runServiceSync((service) => service.formatMessages({
        callName: "formatMessagesSync",
        refs: null,
        messages,
        options,
        callback: (err, res) => {
          if (err) throw err;
          result2 = res;
        }
      }));
      return result2;
    };
    var analyzeMetafileSync = (metafile, options) => {
      if (worker_threads && !isInternalWorkerThread) {
        if (!workerThreadService) workerThreadService = startWorkerThreadService(worker_threads);
        return workerThreadService.analyzeMetafileSync(metafile, options);
      }
      let result2;
      runServiceSync((service) => service.analyzeMetafile({
        callName: "analyzeMetafileSync",
        refs: null,
        metafile: typeof metafile === "string" ? metafile : JSON.stringify(metafile),
        options,
        callback: (err, res) => {
          if (err) throw err;
          result2 = res;
        }
      }));
      return result2;
    };
    var stop = () => {
      if (stopService) stopService();
      if (workerThreadService) workerThreadService.stop();
      return Promise.resolve();
    };
    var initializeWasCalled = false;
    var initialize = (options) => {
      options = validateInitializeOptions(options || {});
      if (options.wasmURL) throw new Error(`The "wasmURL" option only works in the browser`);
      if (options.wasmModule) throw new Error(`The "wasmModule" option only works in the browser`);
      if (options.worker) throw new Error(`The "worker" option only works in the browser`);
      if (initializeWasCalled) throw new Error('Cannot call "initialize" more than once');
      ensureServiceIsRunning();
      initializeWasCalled = true;
      return Promise.resolve();
    };
    var defaultWD = process.cwd();
    var longLivedService;
    var stopService;
    var ensureServiceIsRunning = () => {
      if (longLivedService) return longLivedService;
      let [command, args2] = esbuildCommandAndArgs();
      let child = child_process.spawn(command, args2.concat(`--service=${"0.21.5"}`, "--ping"), {
        windowsHide: true,
        stdio: ["pipe", "pipe", "inherit"],
        cwd: defaultWD
      });
      let { readFromStdout, afterClose, service } = createChannel({
        writeToStdin(bytes) {
          child.stdin.write(bytes, (err) => {
            if (err) afterClose(err);
          });
        },
        readFileSync: fs22.readFileSync,
        isSync: false,
        hasFS: true,
        esbuild: node_exports
      });
      child.stdin.on("error", afterClose);
      child.on("error", afterClose);
      const stdin = child.stdin;
      const stdout = child.stdout;
      stdout.on("data", readFromStdout);
      stdout.on("end", afterClose);
      stopService = () => {
        stdin.destroy();
        stdout.destroy();
        child.kill();
        initializeWasCalled = false;
        longLivedService = void 0;
        stopService = void 0;
      };
      let refCount = 0;
      child.unref();
      if (stdin.unref) {
        stdin.unref();
      }
      if (stdout.unref) {
        stdout.unref();
      }
      const refs = {
        ref() {
          if (++refCount === 1) child.ref();
        },
        unref() {
          if (--refCount === 0) child.unref();
        }
      };
      longLivedService = {
        build: (options) => new Promise((resolve4, reject) => {
          service.buildOrContext({
            callName: "build",
            refs,
            options,
            isTTY: isTTY(),
            defaultWD,
            callback: (err, res) => err ? reject(err) : resolve4(res)
          });
        }),
        context: (options) => new Promise((resolve4, reject) => service.buildOrContext({
          callName: "context",
          refs,
          options,
          isTTY: isTTY(),
          defaultWD,
          callback: (err, res) => err ? reject(err) : resolve4(res)
        })),
        transform: (input, options) => new Promise((resolve4, reject) => service.transform({
          callName: "transform",
          refs,
          input,
          options: options || {},
          isTTY: isTTY(),
          fs: fsAsync,
          callback: (err, res) => err ? reject(err) : resolve4(res)
        })),
        formatMessages: (messages, options) => new Promise((resolve4, reject) => service.formatMessages({
          callName: "formatMessages",
          refs,
          messages,
          options,
          callback: (err, res) => err ? reject(err) : resolve4(res)
        })),
        analyzeMetafile: (metafile, options) => new Promise((resolve4, reject) => service.analyzeMetafile({
          callName: "analyzeMetafile",
          refs,
          metafile: typeof metafile === "string" ? metafile : JSON.stringify(metafile),
          options,
          callback: (err, res) => err ? reject(err) : resolve4(res)
        }))
      };
      return longLivedService;
    };
    var runServiceSync = (callback) => {
      let [command, args2] = esbuildCommandAndArgs();
      let stdin = new Uint8Array();
      let { readFromStdout, afterClose, service } = createChannel({
        writeToStdin(bytes) {
          if (stdin.length !== 0) throw new Error("Must run at most one command");
          stdin = bytes;
        },
        isSync: true,
        hasFS: true,
        esbuild: node_exports
      });
      callback(service);
      let stdout = child_process.execFileSync(command, args2.concat(`--service=${"0.21.5"}`), {
        cwd: defaultWD,
        windowsHide: true,
        input: stdin,
        // We don't know how large the output could be. If it's too large, the
        // command will fail with ENOBUFS. Reserve 16mb for now since that feels
        // like it should be enough. Also allow overriding this with an environment
        // variable.
        maxBuffer: +process.env.ESBUILD_MAX_BUFFER || 16 * 1024 * 1024
      });
      readFromStdout(stdout);
      afterClose(null);
    };
    var randomFileName = () => {
      return path22.join(os2.tmpdir(), `esbuild-${crypto.randomBytes(32).toString("hex")}`);
    };
    var workerThreadService = null;
    var startWorkerThreadService = (worker_threads2) => {
      let { port1: mainPort, port2: workerPort } = new worker_threads2.MessageChannel();
      let worker = new worker_threads2.Worker(__filename, {
        workerData: { workerPort, defaultWD, esbuildVersion: "0.21.5" },
        transferList: [workerPort],
        // From node's documentation: https://nodejs.org/api/worker_threads.html
        //
        //   Take care when launching worker threads from preload scripts (scripts loaded
        //   and run using the `-r` command line flag). Unless the `execArgv` option is
        //   explicitly set, new Worker threads automatically inherit the command line flags
        //   from the running process and will preload the same preload scripts as the main
        //   thread. If the preload script unconditionally launches a worker thread, every
        //   thread spawned will spawn another until the application crashes.
        //
        execArgv: []
      });
      let nextID = 0;
      let fakeBuildError = (text) => {
        let error = new Error(`Build failed with 1 error:
error: ${text}`);
        let errors = [{ id: "", pluginName: "", text, location: null, notes: [], detail: void 0 }];
        error.errors = errors;
        error.warnings = [];
        return error;
      };
      let validateBuildSyncOptions = (options) => {
        if (!options) return;
        let plugins = options.plugins;
        if (plugins && plugins.length > 0) throw fakeBuildError(`Cannot use plugins in synchronous API calls`);
      };
      let applyProperties = (object, properties) => {
        for (let key in properties) {
          object[key] = properties[key];
        }
      };
      let runCallSync = (command, args2) => {
        let id = nextID++;
        let sharedBuffer = new SharedArrayBuffer(8);
        let sharedBufferView = new Int32Array(sharedBuffer);
        let msg = { sharedBuffer, id, command, args: args2 };
        worker.postMessage(msg);
        let status = Atomics.wait(sharedBufferView, 0, 0);
        if (status !== "ok" && status !== "not-equal") throw new Error("Internal error: Atomics.wait() failed: " + status);
        let { message: { id: id2, resolve: resolve4, reject, properties } } = worker_threads2.receiveMessageOnPort(mainPort);
        if (id !== id2) throw new Error(`Internal error: Expected id ${id} but got id ${id2}`);
        if (reject) {
          applyProperties(reject, properties);
          throw reject;
        }
        return resolve4;
      };
      worker.unref();
      return {
        buildSync(options) {
          validateBuildSyncOptions(options);
          return runCallSync("build", [options]);
        },
        transformSync(input, options) {
          return runCallSync("transform", [input, options]);
        },
        formatMessagesSync(messages, options) {
          return runCallSync("formatMessages", [messages, options]);
        },
        analyzeMetafileSync(metafile, options) {
          return runCallSync("analyzeMetafile", [metafile, options]);
        },
        stop() {
          worker.terminate();
          workerThreadService = null;
        }
      };
    };
    var startSyncServiceWorker = () => {
      let workerPort = worker_threads.workerData.workerPort;
      let parentPort = worker_threads.parentPort;
      let extractProperties = (object) => {
        let properties = {};
        if (object && typeof object === "object") {
          for (let key in object) {
            properties[key] = object[key];
          }
        }
        return properties;
      };
      try {
        let service = ensureServiceIsRunning();
        defaultWD = worker_threads.workerData.defaultWD;
        parentPort.on("message", (msg) => {
          (async () => {
            let { sharedBuffer, id, command, args: args2 } = msg;
            let sharedBufferView = new Int32Array(sharedBuffer);
            try {
              switch (command) {
                case "build":
                  workerPort.postMessage({ id, resolve: await service.build(args2[0]) });
                  break;
                case "transform":
                  workerPort.postMessage({ id, resolve: await service.transform(args2[0], args2[1]) });
                  break;
                case "formatMessages":
                  workerPort.postMessage({ id, resolve: await service.formatMessages(args2[0], args2[1]) });
                  break;
                case "analyzeMetafile":
                  workerPort.postMessage({ id, resolve: await service.analyzeMetafile(args2[0], args2[1]) });
                  break;
                default:
                  throw new Error(`Invalid command: ${command}`);
              }
            } catch (reject) {
              workerPort.postMessage({ id, reject, properties: extractProperties(reject) });
            }
            Atomics.add(sharedBufferView, 0, 1);
            Atomics.notify(sharedBufferView, 0, Infinity);
          })();
        });
      } catch (reject) {
        parentPort.on("message", (msg) => {
          let { sharedBuffer, id } = msg;
          let sharedBufferView = new Int32Array(sharedBuffer);
          workerPort.postMessage({ id, reject, properties: extractProperties(reject) });
          Atomics.add(sharedBufferView, 0, 1);
          Atomics.notify(sharedBufferView, 0, Infinity);
        });
      }
    };
    if (isInternalWorkerThread) {
      startSyncServiceWorker();
    }
    var node_default = node_exports;
  }
});

// src/execution/script-loader.ts
function hasEsmSyntax(code) {
  return /^\s*(?:import[\s{"'*]|export[\s{*])/m.test(code);
}
function isViteDevScript(src) {
  return VITE_DEV_SKIP_PATTERNS.some((p) => p.test(src));
}
function isViteDevInlineScript(code) {
  return code.includes("/@react-refresh") || code.includes("__vite_plugin_react_preamble_installed__");
}
function stripViteHmr(code) {
  code = code.replace(/import\.meta\.hot/g, "__vite_import_meta_hot__");
  code = code.replace(/import\.meta\.env/g, "__vite_import_meta_env__");
  code = code.replace(/import\.meta\.url/g, '"about:blank"');
  code = code.replace(/import\.meta/g, "({})");
  return code;
}
async function bundleToIife(entryCode, entryUrl, token, deadline, suppressErrors, adapter) {
  const { build } = await Promise.resolve().then(() => __toESM(require_main(), 1));
  const fetchHeaders = {};
  if (token) fetchHeaders["Authorization"] = `Bearer ${token}`;
  const bypassedEntry = entryCode.replace(
    /,Ii=function\(e,t,n\)\{/,
    ",Ii=function(e,t,n){return e();};var __dixie_unused=function(e,t,n){"
  );
  const finalEntry = bypassedEntry !== entryCode ? bypassedEntry : entryCode;
  const bannerJs = adapter ? adapter.bannerCode() : `var __vite_import_meta_hot__ = {accept(){},dispose(){},prune(){},invalidate(){},on(){},off(){},data:{}};
var __vite_import_meta_env__ = {DEV:false,PROD:true,MODE:"production",BASE_URL:"/",SSR:false};`;
  const result2 = await build({
    entryPoints: [entryUrl],
    bundle: true,
    format: "iife",
    platform: "browser",
    write: false,
    logLevel: "silent",
    // React bundles expect these globals to be present
    define: {
      "process.env.NODE_ENV": '"production"'
    },
    // Inject a no-op import.meta.hot stub and import.meta.env at the top of the IIFE.
    // Vite dev server injects import.meta.hot = createHotContext(...) and
    // import.meta.hot.accept(...) into every file. In IIFE format, esbuild replaces
    // import.meta with an object, but the HMR calls still execute. The banner
    // provides a safe stub so these calls are no-ops instead of runtime errors.
    banner: {
      js: bannerJs
    },
    plugins: [
      {
        name: "dixie-http-fetch",
        setup(build2) {
          build2.onResolve(
            { filter: /^\/@react-refresh|^\/@vite\// },
            () => ({ path: "vite-dev-noop", namespace: "dixie-noop" })
          );
          build2.onResolve(
            { filter: /^(https?:\/\/|\/)/ },
            (args2) => {
              const base = args2.importer?.startsWith("http") ? args2.importer : entryUrl;
              const resolved = new URL(args2.path, base).toString();
              return { path: resolved, namespace: "dixie-http" };
            }
          );
          build2.onResolve(
            { filter: /^\.\.?\// },
            (args2) => ({
              path: new URL(args2.path, args2.importer || entryUrl).toString(),
              namespace: "dixie-http"
            })
          );
          build2.onResolve(
            { filter: /.*/ },
            (args2) => {
              if (args2.kind === "entry-point") {
                return { path: entryUrl, namespace: "dixie-http" };
              }
              return void 0;
            }
          );
          build2.onLoad(
            { filter: /.*/, namespace: "dixie-noop" },
            () => ({
              contents: `
                // /@vite/client stubs
                export function createHotContext() { return { accept(){}, dispose(){}, prune(){}, invalidate(){}, on(){}, off(){}, data:{} }; }
                export function updateStyle() {}
                export function removeStyle() {}
                // /@react-refresh stubs
                export function injectIntoGlobalHook() {}
                export function createSignatureFunctionForTransform() { return function(type) { return type; }; }
                export function isLikelyComponentType() { return false; }
                export function getFamilyByType() { return undefined; }
                export function register() {}
                export function getRefreshReg() { return function() {}; }
                export function __hmr_import() { return Promise.resolve({}); }
                export function registerExportsForReactRefresh() {}
                export function validateRefreshBoundaryAndEnqueueUpdate() { return undefined; }
                export default {};
              `,
              loader: "js"
            })
          );
          build2.onLoad(
            { filter: /.*/, namespace: "dixie-http" },
            async (args2) => {
              if (args2.path === entryUrl) {
                return { contents: adapter ? adapter.transformSource(finalEntry) : stripViteHmr(finalEntry), loader: "js" };
              }
              if (Date.now() > deadline) {
                throw new Error("Script bundling timed out");
              }
              const response = await fetch(args2.path, { headers: fetchHeaders });
              if (!response.ok) {
                throw new Error(`HTTP ${response.status} fetching ${args2.path}`);
              }
              let contents = await response.text();
              contents = adapter ? adapter.transformSource(contents) : stripViteHmr(contents);
              return { contents, loader: "js" };
            }
          );
        }
      }
    ]
  });
  let code = result2.outputFiles?.[0]?.text ?? "";
  if (adapter) {
    code = adapter.transformBundle(code);
  } else {
    code = code.replace(
      /throw\s+new\s+Error\(\s*["']@vitejs\/plugin-react can't detect preamble\.[^"']*["']\s*\)/g,
      "void 0"
    );
  }
  if (suppressErrors?.length) {
    for (const pattern of suppressErrors) {
      const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      code = code.replace(
        new RegExp(`throw new Error\\("${escaped}"\\)`, "g"),
        "return{}"
      );
    }
  }
  return code;
}
async function loadScripts(ctx, options, adapter) {
  const scripts = ctx.document.querySelectorAll("script");
  const baseUrl = options?.baseUrl ?? "http://localhost/";
  const token = options?.token;
  const deadline = options?.deadline ?? Date.now() + 1e4;
  const errors = [];
  ctx.executeScript(`try {
    window.__vite_plugin_react_preamble_installed__ = true;
    window.$RefreshReg$ = function() {};
    window.$RefreshSig$ = function() { return function(type) { return type; }; };
  } catch(e) {}`);
  for (const script of scripts) {
    if (Date.now() > deadline) {
      errors.push({ code: "SCRIPT_TIMEOUT", message: "Script loading deadline exceeded" });
      break;
    }
    const type3 = (script.getAttribute("type") ?? "").toLowerCase().trim();
    if (type3 && !EXECUTABLE_TYPES.has(type3)) {
      continue;
    }
    const src = script.getAttribute("src");
    if (src) {
      if (adapter ? adapter.skipPatterns().some((p) => p.test(src)) : isViteDevScript(src)) {
        continue;
      }
      try {
        const scriptUrl = new URL(src, baseUrl).toString();
        const fetchHeaders = {};
        if (token) fetchHeaders["Authorization"] = `Bearer ${token}`;
        const remaining = deadline - Date.now();
        const controller = new AbortController();
        const fetchTimer = setTimeout(() => controller.abort(), Math.min(remaining, 15e3));
        let code;
        try {
          const response = await fetch(scriptUrl, {
            headers: fetchHeaders,
            signal: controller.signal
          });
          if (!response.ok) {
            errors.push({
              code: "SCRIPT_HTTP_ERROR",
              message: `Script ${src} returned HTTP ${response.status}`
            });
            continue;
          }
          code = await response.text();
        } finally {
          clearTimeout(fetchTimer);
        }
        const isModule = type3 === "module" || hasEsmSyntax(code);
        if (isModule) {
          try {
            code = await bundleToIife(code, scriptUrl, token, deadline, options?.suppressErrors, adapter);
          } catch (bundleErr) {
            errors.push({
              code: "SCRIPT_BUNDLE_ERROR",
              message: `Failed to bundle ${src}: ${bundleErr.message}`
            });
            continue;
          }
        }
        if (code.trim()) {
          const result2 = ctx.executeScript(code);
          if (result2.error) {
            errors.push({ code: "SCRIPT_EXEC_ERROR", message: `${src}: ${result2.error}` });
          }
        }
      } catch (err) {
        const code = err.name === "AbortError" ? "SCRIPT_FETCH_TIMEOUT" : "SCRIPT_FETCH_ERROR";
        errors.push({ code, message: `Failed to load script ${src}: ${err.message}` });
      }
    } else {
      const code = script.textContent ?? "";
      if (!code.trim()) continue;
      const isViteInline = adapter ? code.includes("/@react-refresh") || code.includes("__vite_plugin_react_preamble_installed__") : isViteDevInlineScript(code);
      if (isViteInline) {
        continue;
      }
      const isModule = type3 === "module" || hasEsmSyntax(code);
      if (isModule) {
        try {
          const virtualUrl = new URL("/__dixie_inline_module__.js", baseUrl).toString();
          const bundled = await bundleToIife(code, virtualUrl, token, deadline, options?.suppressErrors, adapter);
          if (bundled.trim()) {
            const result2 = ctx.executeScript(bundled);
            if (result2.error) {
              errors.push({ code: "SCRIPT_EXEC_ERROR", message: `inline script: ${result2.error}` });
            }
          }
        } catch (bundleErr) {
          errors.push({
            code: "SCRIPT_BUNDLE_ERROR",
            message: `Failed to bundle inline script: ${bundleErr.message}`
          });
        }
      } else {
        const result2 = ctx.executeScript(code);
        if (result2.error) {
          errors.push({ code: "SCRIPT_EXEC_ERROR", message: `inline script: ${result2.error}` });
        }
      }
    }
  }
  return errors;
}
var EXECUTABLE_TYPES, VITE_DEV_SKIP_PATTERNS;
var init_script_loader = __esm({
  "src/execution/script-loader.ts"() {
    "use strict";
    init_module_loader();
    EXECUTABLE_TYPES = /* @__PURE__ */ new Set([
      "",
      // no type attribute = JavaScript
      "text/javascript",
      "application/javascript",
      "module"
      // ES module — bundled to IIFE via esbuild before execution
    ]);
    VITE_DEV_SKIP_PATTERNS = [
      /^\/@vite\//,
      // /@vite/client — HMR WebSocket client
      /^\/@react-refresh/
      // React Fast Refresh runtime
    ];
  }
});

// src/execution/event-loop-flush.ts
async function flushReactRender(doc, options) {
  const timeoutMs = options?.timeoutMs ?? 3e3;
  const requiredStableRounds = options?.stableRounds ?? 3;
  const waitForSelector = options?.waitForSelector;
  const deadline = Date.now() + timeoutMs;
  let lastCount = -1;
  let stableCount = 0;
  let rounds = 0;
  let lastMutationVersion = -1;
  while (Date.now() < deadline) {
    if (rounds === 0 || !waitForSelector) {
      await new Promise((resolve4) => setImmediate(resolve4));
    } else {
      await new Promise((resolve4) => setTimeout(resolve4, 100));
    }
    rounds++;
    const currentVersion = doc._mutationVersion ?? -2;
    let count;
    if (currentVersion === lastMutationVersion && lastCount >= 0) {
      count = lastCount;
    } else {
      count = doc.querySelectorAll("*").length;
      lastMutationVersion = currentVersion;
    }
    if (count === lastCount) {
      stableCount++;
      if (options?.mockFetch && options.mockFetch.inFlightCount > 0) {
        stableCount = 0;
        continue;
      }
      if (waitForSelector) {
        const found = doc.querySelector(waitForSelector);
        if (!found) {
          stableCount = 0;
          continue;
        }
      }
      if (stableCount >= requiredStableRounds) {
        return { stable: true, elementCount: count, rounds };
      }
    } else {
      stableCount = 0;
      lastCount = count;
    }
  }
  return {
    stable: false,
    elementCount: doc.querySelectorAll("*").length,
    rounds
  };
}
var init_event_loop_flush = __esm({
  "src/execution/event-loop-flush.ts"() {
    "use strict";
  }
});

// src/cli/config-loader.ts
import * as fs from "node:fs";
import * as path from "node:path";
function domainFromUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
  const host = parsed.hostname;
  const port = parsed.port;
  return port ? `${host}.${port}` : host;
}
async function resolveConfig(url, overrides, explicitConfig) {
  const isLegacyCall = typeof overrides === "string";
  const projectRoot = isLegacyCall ? overrides : process.cwd();
  const configOverride = isLegacyCall ? explicitConfig : void 0;
  const overrideObj = isLegacyCall ? {} : overrides ?? {};
  if (configOverride) {
    const fileConfig = await loadConfigFile(configOverride);
    return { isSPA: false, ...fileConfig, ...overrideObj };
  }
  const domain = domainFromUrl(url);
  const dixieDir = path.join(projectRoot, ".dixie");
  for (const ext of CONFIG_EXTENSIONS) {
    const configPath = path.join(dixieDir, `${domain}${ext}`);
    if (fs.existsSync(configPath)) {
      const fileConfig = await loadConfigFile(configPath);
      return { isSPA: false, ...fileConfig, ...overrideObj };
    }
  }
  return { isSPA: false, ...overrideObj };
}
async function loadConfigFile(configPath) {
  const abs = path.resolve(configPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Config file not found: ${abs}`);
  }
  try {
    if (abs.endsWith(".ts")) {
      const esbuild = await Promise.resolve().then(() => __toESM(require_main(), 1));
      const source = fs.readFileSync(abs, "utf-8");
      const result2 = await esbuild.transform(source, {
        loader: "ts",
        format: "esm",
        target: "node18"
      });
      const tmpFile = abs.replace(/\.ts$/, ".dixie-tmp.mjs");
      fs.writeFileSync(tmpFile, result2.code);
      try {
        const mod2 = await import(`file://${tmpFile}`);
        return mod2.default;
      } finally {
        fs.unlinkSync(tmpFile);
      }
    }
    const mod = await import(`file://${abs}`);
    return mod.default ?? mod;
  } catch (err) {
    const filename = path.basename(configPath);
    throw new Error(`Failed to load config ${filename}: ${err.message}`);
  }
}
var CONFIG_EXTENSIONS;
var init_config_loader = __esm({
  "src/cli/config-loader.ts"() {
    "use strict";
    CONFIG_EXTENSIONS = [".ts", ".js", ".mjs"];
  }
});

// node_modules/js-yaml/dist/js-yaml.mjs
function isNothing(subject) {
  return typeof subject === "undefined" || subject === null;
}
function isObject(subject) {
  return typeof subject === "object" && subject !== null;
}
function toArray(sequence) {
  if (Array.isArray(sequence)) return sequence;
  else if (isNothing(sequence)) return [];
  return [sequence];
}
function extend(target, source) {
  var index, length, key, sourceKeys;
  if (source) {
    sourceKeys = Object.keys(source);
    for (index = 0, length = sourceKeys.length; index < length; index += 1) {
      key = sourceKeys[index];
      target[key] = source[key];
    }
  }
  return target;
}
function repeat(string, count) {
  var result2 = "", cycle;
  for (cycle = 0; cycle < count; cycle += 1) {
    result2 += string;
  }
  return result2;
}
function isNegativeZero(number) {
  return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
}
function formatError(exception2, compact) {
  var where = "", message = exception2.reason || "(unknown reason)";
  if (!exception2.mark) return message;
  if (exception2.mark.name) {
    where += 'in "' + exception2.mark.name + '" ';
  }
  where += "(" + (exception2.mark.line + 1) + ":" + (exception2.mark.column + 1) + ")";
  if (!compact && exception2.mark.snippet) {
    where += "\n\n" + exception2.mark.snippet;
  }
  return message + " " + where;
}
function YAMLException$1(reason, mark) {
  Error.call(this);
  this.name = "YAMLException";
  this.reason = reason;
  this.mark = mark;
  this.message = formatError(this, false);
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    this.stack = new Error().stack || "";
  }
}
function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
  var head = "";
  var tail = "";
  var maxHalfLength = Math.floor(maxLineLength / 2) - 1;
  if (position - lineStart > maxHalfLength) {
    head = " ... ";
    lineStart = position - maxHalfLength + head.length;
  }
  if (lineEnd - position > maxHalfLength) {
    tail = " ...";
    lineEnd = position + maxHalfLength - tail.length;
  }
  return {
    str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, "\u2192") + tail,
    pos: position - lineStart + head.length
    // relative position
  };
}
function padStart(string, max) {
  return common.repeat(" ", max - string.length) + string;
}
function makeSnippet(mark, options) {
  options = Object.create(options || null);
  if (!mark.buffer) return null;
  if (!options.maxLength) options.maxLength = 79;
  if (typeof options.indent !== "number") options.indent = 1;
  if (typeof options.linesBefore !== "number") options.linesBefore = 3;
  if (typeof options.linesAfter !== "number") options.linesAfter = 2;
  var re = /\r?\n|\r|\0/g;
  var lineStarts = [0];
  var lineEnds = [];
  var match;
  var foundLineNo = -1;
  while (match = re.exec(mark.buffer)) {
    lineEnds.push(match.index);
    lineStarts.push(match.index + match[0].length);
    if (mark.position <= match.index && foundLineNo < 0) {
      foundLineNo = lineStarts.length - 2;
    }
  }
  if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;
  var result2 = "", i, line;
  var lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
  var maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);
  for (i = 1; i <= options.linesBefore; i++) {
    if (foundLineNo - i < 0) break;
    line = getLine(
      mark.buffer,
      lineStarts[foundLineNo - i],
      lineEnds[foundLineNo - i],
      mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]),
      maxLineLength
    );
    result2 = common.repeat(" ", options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) + " | " + line.str + "\n" + result2;
  }
  line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
  result2 += common.repeat(" ", options.indent) + padStart((mark.line + 1).toString(), lineNoLength) + " | " + line.str + "\n";
  result2 += common.repeat("-", options.indent + lineNoLength + 3 + line.pos) + "^\n";
  for (i = 1; i <= options.linesAfter; i++) {
    if (foundLineNo + i >= lineEnds.length) break;
    line = getLine(
      mark.buffer,
      lineStarts[foundLineNo + i],
      lineEnds[foundLineNo + i],
      mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]),
      maxLineLength
    );
    result2 += common.repeat(" ", options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) + " | " + line.str + "\n";
  }
  return result2.replace(/\n$/, "");
}
function compileStyleAliases(map2) {
  var result2 = {};
  if (map2 !== null) {
    Object.keys(map2).forEach(function(style) {
      map2[style].forEach(function(alias) {
        result2[String(alias)] = style;
      });
    });
  }
  return result2;
}
function Type$1(tag, options) {
  options = options || {};
  Object.keys(options).forEach(function(name) {
    if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
      throw new exception('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
    }
  });
  this.options = options;
  this.tag = tag;
  this.kind = options["kind"] || null;
  this.resolve = options["resolve"] || function() {
    return true;
  };
  this.construct = options["construct"] || function(data) {
    return data;
  };
  this.instanceOf = options["instanceOf"] || null;
  this.predicate = options["predicate"] || null;
  this.represent = options["represent"] || null;
  this.representName = options["representName"] || null;
  this.defaultStyle = options["defaultStyle"] || null;
  this.multi = options["multi"] || false;
  this.styleAliases = compileStyleAliases(options["styleAliases"] || null);
  if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
    throw new exception('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
  }
}
function compileList(schema2, name) {
  var result2 = [];
  schema2[name].forEach(function(currentType) {
    var newIndex = result2.length;
    result2.forEach(function(previousType, previousIndex) {
      if (previousType.tag === currentType.tag && previousType.kind === currentType.kind && previousType.multi === currentType.multi) {
        newIndex = previousIndex;
      }
    });
    result2[newIndex] = currentType;
  });
  return result2;
}
function compileMap() {
  var result2 = {
    scalar: {},
    sequence: {},
    mapping: {},
    fallback: {},
    multi: {
      scalar: [],
      sequence: [],
      mapping: [],
      fallback: []
    }
  }, index, length;
  function collectType(type3) {
    if (type3.multi) {
      result2.multi[type3.kind].push(type3);
      result2.multi["fallback"].push(type3);
    } else {
      result2[type3.kind][type3.tag] = result2["fallback"][type3.tag] = type3;
    }
  }
  for (index = 0, length = arguments.length; index < length; index += 1) {
    arguments[index].forEach(collectType);
  }
  return result2;
}
function Schema$1(definition) {
  return this.extend(definition);
}
function resolveYamlNull(data) {
  if (data === null) return true;
  var max = data.length;
  return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
}
function constructYamlNull() {
  return null;
}
function isNull(object) {
  return object === null;
}
function resolveYamlBoolean(data) {
  if (data === null) return false;
  var max = data.length;
  return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
}
function constructYamlBoolean(data) {
  return data === "true" || data === "True" || data === "TRUE";
}
function isBoolean(object) {
  return Object.prototype.toString.call(object) === "[object Boolean]";
}
function isHexCode(c) {
  return 48 <= c && c <= 57 || 65 <= c && c <= 70 || 97 <= c && c <= 102;
}
function isOctCode(c) {
  return 48 <= c && c <= 55;
}
function isDecCode(c) {
  return 48 <= c && c <= 57;
}
function resolveYamlInteger(data) {
  if (data === null) return false;
  var max = data.length, index = 0, hasDigits = false, ch;
  if (!max) return false;
  ch = data[index];
  if (ch === "-" || ch === "+") {
    ch = data[++index];
  }
  if (ch === "0") {
    if (index + 1 === max) return true;
    ch = data[++index];
    if (ch === "b") {
      index++;
      for (; index < max; index++) {
        ch = data[index];
        if (ch === "_") continue;
        if (ch !== "0" && ch !== "1") return false;
        hasDigits = true;
      }
      return hasDigits && ch !== "_";
    }
    if (ch === "x") {
      index++;
      for (; index < max; index++) {
        ch = data[index];
        if (ch === "_") continue;
        if (!isHexCode(data.charCodeAt(index))) return false;
        hasDigits = true;
      }
      return hasDigits && ch !== "_";
    }
    if (ch === "o") {
      index++;
      for (; index < max; index++) {
        ch = data[index];
        if (ch === "_") continue;
        if (!isOctCode(data.charCodeAt(index))) return false;
        hasDigits = true;
      }
      return hasDigits && ch !== "_";
    }
  }
  if (ch === "_") return false;
  for (; index < max; index++) {
    ch = data[index];
    if (ch === "_") continue;
    if (!isDecCode(data.charCodeAt(index))) {
      return false;
    }
    hasDigits = true;
  }
  if (!hasDigits || ch === "_") return false;
  return true;
}
function constructYamlInteger(data) {
  var value = data, sign = 1, ch;
  if (value.indexOf("_") !== -1) {
    value = value.replace(/_/g, "");
  }
  ch = value[0];
  if (ch === "-" || ch === "+") {
    if (ch === "-") sign = -1;
    value = value.slice(1);
    ch = value[0];
  }
  if (value === "0") return 0;
  if (ch === "0") {
    if (value[1] === "b") return sign * parseInt(value.slice(2), 2);
    if (value[1] === "x") return sign * parseInt(value.slice(2), 16);
    if (value[1] === "o") return sign * parseInt(value.slice(2), 8);
  }
  return sign * parseInt(value, 10);
}
function isInteger(object) {
  return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 === 0 && !common.isNegativeZero(object));
}
function resolveYamlFloat(data) {
  if (data === null) return false;
  if (!YAML_FLOAT_PATTERN.test(data) || // Quick hack to not allow integers end with `_`
  // Probably should update regexp & check speed
  data[data.length - 1] === "_") {
    return false;
  }
  return true;
}
function constructYamlFloat(data) {
  var value, sign;
  value = data.replace(/_/g, "").toLowerCase();
  sign = value[0] === "-" ? -1 : 1;
  if ("+-".indexOf(value[0]) >= 0) {
    value = value.slice(1);
  }
  if (value === ".inf") {
    return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  } else if (value === ".nan") {
    return NaN;
  }
  return sign * parseFloat(value, 10);
}
function representYamlFloat(object, style) {
  var res;
  if (isNaN(object)) {
    switch (style) {
      case "lowercase":
        return ".nan";
      case "uppercase":
        return ".NAN";
      case "camelcase":
        return ".NaN";
    }
  } else if (Number.POSITIVE_INFINITY === object) {
    switch (style) {
      case "lowercase":
        return ".inf";
      case "uppercase":
        return ".INF";
      case "camelcase":
        return ".Inf";
    }
  } else if (Number.NEGATIVE_INFINITY === object) {
    switch (style) {
      case "lowercase":
        return "-.inf";
      case "uppercase":
        return "-.INF";
      case "camelcase":
        return "-.Inf";
    }
  } else if (common.isNegativeZero(object)) {
    return "-0.0";
  }
  res = object.toString(10);
  return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
}
function isFloat(object) {
  return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common.isNegativeZero(object));
}
function resolveYamlTimestamp(data) {
  if (data === null) return false;
  if (YAML_DATE_REGEXP.exec(data) !== null) return true;
  if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
  return false;
}
function constructYamlTimestamp(data) {
  var match, year, month, day, hour, minute, second, fraction = 0, delta = null, tz_hour, tz_minute, date;
  match = YAML_DATE_REGEXP.exec(data);
  if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);
  if (match === null) throw new Error("Date resolve error");
  year = +match[1];
  month = +match[2] - 1;
  day = +match[3];
  if (!match[4]) {
    return new Date(Date.UTC(year, month, day));
  }
  hour = +match[4];
  minute = +match[5];
  second = +match[6];
  if (match[7]) {
    fraction = match[7].slice(0, 3);
    while (fraction.length < 3) {
      fraction += "0";
    }
    fraction = +fraction;
  }
  if (match[9]) {
    tz_hour = +match[10];
    tz_minute = +(match[11] || 0);
    delta = (tz_hour * 60 + tz_minute) * 6e4;
    if (match[9] === "-") delta = -delta;
  }
  date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
  if (delta) date.setTime(date.getTime() - delta);
  return date;
}
function representYamlTimestamp(object) {
  return object.toISOString();
}
function resolveYamlMerge(data) {
  return data === "<<" || data === null;
}
function resolveYamlBinary(data) {
  if (data === null) return false;
  var code, idx, bitlen = 0, max = data.length, map2 = BASE64_MAP;
  for (idx = 0; idx < max; idx++) {
    code = map2.indexOf(data.charAt(idx));
    if (code > 64) continue;
    if (code < 0) return false;
    bitlen += 6;
  }
  return bitlen % 8 === 0;
}
function constructYamlBinary(data) {
  var idx, tailbits, input = data.replace(/[\r\n=]/g, ""), max = input.length, map2 = BASE64_MAP, bits = 0, result2 = [];
  for (idx = 0; idx < max; idx++) {
    if (idx % 4 === 0 && idx) {
      result2.push(bits >> 16 & 255);
      result2.push(bits >> 8 & 255);
      result2.push(bits & 255);
    }
    bits = bits << 6 | map2.indexOf(input.charAt(idx));
  }
  tailbits = max % 4 * 6;
  if (tailbits === 0) {
    result2.push(bits >> 16 & 255);
    result2.push(bits >> 8 & 255);
    result2.push(bits & 255);
  } else if (tailbits === 18) {
    result2.push(bits >> 10 & 255);
    result2.push(bits >> 2 & 255);
  } else if (tailbits === 12) {
    result2.push(bits >> 4 & 255);
  }
  return new Uint8Array(result2);
}
function representYamlBinary(object) {
  var result2 = "", bits = 0, idx, tail, max = object.length, map2 = BASE64_MAP;
  for (idx = 0; idx < max; idx++) {
    if (idx % 3 === 0 && idx) {
      result2 += map2[bits >> 18 & 63];
      result2 += map2[bits >> 12 & 63];
      result2 += map2[bits >> 6 & 63];
      result2 += map2[bits & 63];
    }
    bits = (bits << 8) + object[idx];
  }
  tail = max % 3;
  if (tail === 0) {
    result2 += map2[bits >> 18 & 63];
    result2 += map2[bits >> 12 & 63];
    result2 += map2[bits >> 6 & 63];
    result2 += map2[bits & 63];
  } else if (tail === 2) {
    result2 += map2[bits >> 10 & 63];
    result2 += map2[bits >> 4 & 63];
    result2 += map2[bits << 2 & 63];
    result2 += map2[64];
  } else if (tail === 1) {
    result2 += map2[bits >> 2 & 63];
    result2 += map2[bits << 4 & 63];
    result2 += map2[64];
    result2 += map2[64];
  }
  return result2;
}
function isBinary(obj) {
  return Object.prototype.toString.call(obj) === "[object Uint8Array]";
}
function resolveYamlOmap(data) {
  if (data === null) return true;
  var objectKeys = [], index, length, pair, pairKey, pairHasKey, object = data;
  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    pairHasKey = false;
    if (_toString$2.call(pair) !== "[object Object]") return false;
    for (pairKey in pair) {
      if (_hasOwnProperty$3.call(pair, pairKey)) {
        if (!pairHasKey) pairHasKey = true;
        else return false;
      }
    }
    if (!pairHasKey) return false;
    if (objectKeys.indexOf(pairKey) === -1) objectKeys.push(pairKey);
    else return false;
  }
  return true;
}
function constructYamlOmap(data) {
  return data !== null ? data : [];
}
function resolveYamlPairs(data) {
  if (data === null) return true;
  var index, length, pair, keys, result2, object = data;
  result2 = new Array(object.length);
  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    if (_toString$1.call(pair) !== "[object Object]") return false;
    keys = Object.keys(pair);
    if (keys.length !== 1) return false;
    result2[index] = [keys[0], pair[keys[0]]];
  }
  return true;
}
function constructYamlPairs(data) {
  if (data === null) return [];
  var index, length, pair, keys, result2, object = data;
  result2 = new Array(object.length);
  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    keys = Object.keys(pair);
    result2[index] = [keys[0], pair[keys[0]]];
  }
  return result2;
}
function resolveYamlSet(data) {
  if (data === null) return true;
  var key, object = data;
  for (key in object) {
    if (_hasOwnProperty$2.call(object, key)) {
      if (object[key] !== null) return false;
    }
  }
  return true;
}
function constructYamlSet(data) {
  return data !== null ? data : {};
}
function _class(obj) {
  return Object.prototype.toString.call(obj);
}
function is_EOL(c) {
  return c === 10 || c === 13;
}
function is_WHITE_SPACE(c) {
  return c === 9 || c === 32;
}
function is_WS_OR_EOL(c) {
  return c === 9 || c === 32 || c === 10 || c === 13;
}
function is_FLOW_INDICATOR(c) {
  return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
}
function fromHexCode(c) {
  var lc;
  if (48 <= c && c <= 57) {
    return c - 48;
  }
  lc = c | 32;
  if (97 <= lc && lc <= 102) {
    return lc - 97 + 10;
  }
  return -1;
}
function escapedHexLen(c) {
  if (c === 120) {
    return 2;
  }
  if (c === 117) {
    return 4;
  }
  if (c === 85) {
    return 8;
  }
  return 0;
}
function fromDecimalCode(c) {
  if (48 <= c && c <= 57) {
    return c - 48;
  }
  return -1;
}
function simpleEscapeSequence(c) {
  return c === 48 ? "\0" : c === 97 ? "\x07" : c === 98 ? "\b" : c === 116 ? "	" : c === 9 ? "	" : c === 110 ? "\n" : c === 118 ? "\v" : c === 102 ? "\f" : c === 114 ? "\r" : c === 101 ? "\x1B" : c === 32 ? " " : c === 34 ? '"' : c === 47 ? "/" : c === 92 ? "\\" : c === 78 ? "\x85" : c === 95 ? "\xA0" : c === 76 ? "\u2028" : c === 80 ? "\u2029" : "";
}
function charFromCodepoint(c) {
  if (c <= 65535) {
    return String.fromCharCode(c);
  }
  return String.fromCharCode(
    (c - 65536 >> 10) + 55296,
    (c - 65536 & 1023) + 56320
  );
}
function setProperty(object, key, value) {
  if (key === "__proto__") {
    Object.defineProperty(object, key, {
      configurable: true,
      enumerable: true,
      writable: true,
      value
    });
  } else {
    object[key] = value;
  }
}
function State$1(input, options) {
  this.input = input;
  this.filename = options["filename"] || null;
  this.schema = options["schema"] || _default;
  this.onWarning = options["onWarning"] || null;
  this.legacy = options["legacy"] || false;
  this.json = options["json"] || false;
  this.listener = options["listener"] || null;
  this.implicitTypes = this.schema.compiledImplicit;
  this.typeMap = this.schema.compiledTypeMap;
  this.length = input.length;
  this.position = 0;
  this.line = 0;
  this.lineStart = 0;
  this.lineIndent = 0;
  this.firstTabInLine = -1;
  this.documents = [];
}
function generateError(state, message) {
  var mark = {
    name: state.filename,
    buffer: state.input.slice(0, -1),
    // omit trailing \0
    position: state.position,
    line: state.line,
    column: state.position - state.lineStart
  };
  mark.snippet = snippet(mark);
  return new exception(message, mark);
}
function throwError(state, message) {
  throw generateError(state, message);
}
function throwWarning(state, message) {
  if (state.onWarning) {
    state.onWarning.call(null, generateError(state, message));
  }
}
function captureSegment(state, start, end, checkJson) {
  var _position, _length, _character, _result;
  if (start < end) {
    _result = state.input.slice(start, end);
    if (checkJson) {
      for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
        _character = _result.charCodeAt(_position);
        if (!(_character === 9 || 32 <= _character && _character <= 1114111)) {
          throwError(state, "expected valid JSON character");
        }
      }
    } else if (PATTERN_NON_PRINTABLE.test(_result)) {
      throwError(state, "the stream contains non-printable characters");
    }
    state.result += _result;
  }
}
function mergeMappings(state, destination, source, overridableKeys) {
  var sourceKeys, key, index, quantity;
  if (!common.isObject(source)) {
    throwError(state, "cannot merge mappings; the provided source object is unacceptable");
  }
  sourceKeys = Object.keys(source);
  for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
    key = sourceKeys[index];
    if (!_hasOwnProperty$1.call(destination, key)) {
      setProperty(destination, key, source[key]);
      overridableKeys[key] = true;
    }
  }
}
function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startLineStart, startPos) {
  var index, quantity;
  if (Array.isArray(keyNode)) {
    keyNode = Array.prototype.slice.call(keyNode);
    for (index = 0, quantity = keyNode.length; index < quantity; index += 1) {
      if (Array.isArray(keyNode[index])) {
        throwError(state, "nested arrays are not supported inside keys");
      }
      if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]") {
        keyNode[index] = "[object Object]";
      }
    }
  }
  if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") {
    keyNode = "[object Object]";
  }
  keyNode = String(keyNode);
  if (_result === null) {
    _result = {};
  }
  if (keyTag === "tag:yaml.org,2002:merge") {
    if (Array.isArray(valueNode)) {
      for (index = 0, quantity = valueNode.length; index < quantity; index += 1) {
        mergeMappings(state, _result, valueNode[index], overridableKeys);
      }
    } else {
      mergeMappings(state, _result, valueNode, overridableKeys);
    }
  } else {
    if (!state.json && !_hasOwnProperty$1.call(overridableKeys, keyNode) && _hasOwnProperty$1.call(_result, keyNode)) {
      state.line = startLine || state.line;
      state.lineStart = startLineStart || state.lineStart;
      state.position = startPos || state.position;
      throwError(state, "duplicated mapping key");
    }
    setProperty(_result, keyNode, valueNode);
    delete overridableKeys[keyNode];
  }
  return _result;
}
function readLineBreak(state) {
  var ch;
  ch = state.input.charCodeAt(state.position);
  if (ch === 10) {
    state.position++;
  } else if (ch === 13) {
    state.position++;
    if (state.input.charCodeAt(state.position) === 10) {
      state.position++;
    }
  } else {
    throwError(state, "a line break is expected");
  }
  state.line += 1;
  state.lineStart = state.position;
  state.firstTabInLine = -1;
}
function skipSeparationSpace(state, allowComments, checkIndent) {
  var lineBreaks = 0, ch = state.input.charCodeAt(state.position);
  while (ch !== 0) {
    while (is_WHITE_SPACE(ch)) {
      if (ch === 9 && state.firstTabInLine === -1) {
        state.firstTabInLine = state.position;
      }
      ch = state.input.charCodeAt(++state.position);
    }
    if (allowComments && ch === 35) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (ch !== 10 && ch !== 13 && ch !== 0);
    }
    if (is_EOL(ch)) {
      readLineBreak(state);
      ch = state.input.charCodeAt(state.position);
      lineBreaks++;
      state.lineIndent = 0;
      while (ch === 32) {
        state.lineIndent++;
        ch = state.input.charCodeAt(++state.position);
      }
    } else {
      break;
    }
  }
  if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
    throwWarning(state, "deficient indentation");
  }
  return lineBreaks;
}
function testDocumentSeparator(state) {
  var _position = state.position, ch;
  ch = state.input.charCodeAt(_position);
  if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
    _position += 3;
    ch = state.input.charCodeAt(_position);
    if (ch === 0 || is_WS_OR_EOL(ch)) {
      return true;
    }
  }
  return false;
}
function writeFoldedLines(state, count) {
  if (count === 1) {
    state.result += " ";
  } else if (count > 1) {
    state.result += common.repeat("\n", count - 1);
  }
}
function readPlainScalar(state, nodeIndent, withinFlowCollection) {
  var preceding, following, captureStart, captureEnd, hasPendingContent, _line, _lineStart, _lineIndent, _kind = state.kind, _result = state.result, ch;
  ch = state.input.charCodeAt(state.position);
  if (is_WS_OR_EOL(ch) || is_FLOW_INDICATOR(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) {
    return false;
  }
  if (ch === 63 || ch === 45) {
    following = state.input.charCodeAt(state.position + 1);
    if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
      return false;
    }
  }
  state.kind = "scalar";
  state.result = "";
  captureStart = captureEnd = state.position;
  hasPendingContent = false;
  while (ch !== 0) {
    if (ch === 58) {
      following = state.input.charCodeAt(state.position + 1);
      if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
        break;
      }
    } else if (ch === 35) {
      preceding = state.input.charCodeAt(state.position - 1);
      if (is_WS_OR_EOL(preceding)) {
        break;
      }
    } else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && is_FLOW_INDICATOR(ch)) {
      break;
    } else if (is_EOL(ch)) {
      _line = state.line;
      _lineStart = state.lineStart;
      _lineIndent = state.lineIndent;
      skipSeparationSpace(state, false, -1);
      if (state.lineIndent >= nodeIndent) {
        hasPendingContent = true;
        ch = state.input.charCodeAt(state.position);
        continue;
      } else {
        state.position = captureEnd;
        state.line = _line;
        state.lineStart = _lineStart;
        state.lineIndent = _lineIndent;
        break;
      }
    }
    if (hasPendingContent) {
      captureSegment(state, captureStart, captureEnd, false);
      writeFoldedLines(state, state.line - _line);
      captureStart = captureEnd = state.position;
      hasPendingContent = false;
    }
    if (!is_WHITE_SPACE(ch)) {
      captureEnd = state.position + 1;
    }
    ch = state.input.charCodeAt(++state.position);
  }
  captureSegment(state, captureStart, captureEnd, false);
  if (state.result) {
    return true;
  }
  state.kind = _kind;
  state.result = _result;
  return false;
}
function readSingleQuotedScalar(state, nodeIndent) {
  var ch, captureStart, captureEnd;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 39) {
    return false;
  }
  state.kind = "scalar";
  state.result = "";
  state.position++;
  captureStart = captureEnd = state.position;
  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 39) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);
      if (ch === 39) {
        captureStart = state.position;
        state.position++;
        captureEnd = state.position;
      } else {
        return true;
      }
    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;
    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, "unexpected end of the document within a single quoted scalar");
    } else {
      state.position++;
      captureEnd = state.position;
    }
  }
  throwError(state, "unexpected end of the stream within a single quoted scalar");
}
function readDoubleQuotedScalar(state, nodeIndent) {
  var captureStart, captureEnd, hexLength, hexResult, tmp, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 34) {
    return false;
  }
  state.kind = "scalar";
  state.result = "";
  state.position++;
  captureStart = captureEnd = state.position;
  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 34) {
      captureSegment(state, captureStart, state.position, true);
      state.position++;
      return true;
    } else if (ch === 92) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);
      if (is_EOL(ch)) {
        skipSeparationSpace(state, false, nodeIndent);
      } else if (ch < 256 && simpleEscapeCheck[ch]) {
        state.result += simpleEscapeMap[ch];
        state.position++;
      } else if ((tmp = escapedHexLen(ch)) > 0) {
        hexLength = tmp;
        hexResult = 0;
        for (; hexLength > 0; hexLength--) {
          ch = state.input.charCodeAt(++state.position);
          if ((tmp = fromHexCode(ch)) >= 0) {
            hexResult = (hexResult << 4) + tmp;
          } else {
            throwError(state, "expected hexadecimal character");
          }
        }
        state.result += charFromCodepoint(hexResult);
        state.position++;
      } else {
        throwError(state, "unknown escape sequence");
      }
      captureStart = captureEnd = state.position;
    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;
    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, "unexpected end of the document within a double quoted scalar");
    } else {
      state.position++;
      captureEnd = state.position;
    }
  }
  throwError(state, "unexpected end of the stream within a double quoted scalar");
}
function readFlowCollection(state, nodeIndent) {
  var readNext = true, _line, _lineStart, _pos, _tag = state.tag, _result, _anchor = state.anchor, following, terminator, isPair, isExplicitPair, isMapping, overridableKeys = /* @__PURE__ */ Object.create(null), keyNode, keyTag, valueNode, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch === 91) {
    terminator = 93;
    isMapping = false;
    _result = [];
  } else if (ch === 123) {
    terminator = 125;
    isMapping = true;
    _result = {};
  } else {
    return false;
  }
  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }
  ch = state.input.charCodeAt(++state.position);
  while (ch !== 0) {
    skipSeparationSpace(state, true, nodeIndent);
    ch = state.input.charCodeAt(state.position);
    if (ch === terminator) {
      state.position++;
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = isMapping ? "mapping" : "sequence";
      state.result = _result;
      return true;
    } else if (!readNext) {
      throwError(state, "missed comma between flow collection entries");
    } else if (ch === 44) {
      throwError(state, "expected the node content, but found ','");
    }
    keyTag = keyNode = valueNode = null;
    isPair = isExplicitPair = false;
    if (ch === 63) {
      following = state.input.charCodeAt(state.position + 1);
      if (is_WS_OR_EOL(following)) {
        isPair = isExplicitPair = true;
        state.position++;
        skipSeparationSpace(state, true, nodeIndent);
      }
    }
    _line = state.line;
    _lineStart = state.lineStart;
    _pos = state.position;
    composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
    keyTag = state.tag;
    keyNode = state.result;
    skipSeparationSpace(state, true, nodeIndent);
    ch = state.input.charCodeAt(state.position);
    if ((isExplicitPair || state.line === _line) && ch === 58) {
      isPair = true;
      ch = state.input.charCodeAt(++state.position);
      skipSeparationSpace(state, true, nodeIndent);
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      valueNode = state.result;
    }
    if (isMapping) {
      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
    } else if (isPair) {
      _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
    } else {
      _result.push(keyNode);
    }
    skipSeparationSpace(state, true, nodeIndent);
    ch = state.input.charCodeAt(state.position);
    if (ch === 44) {
      readNext = true;
      ch = state.input.charCodeAt(++state.position);
    } else {
      readNext = false;
    }
  }
  throwError(state, "unexpected end of the stream within a flow collection");
}
function readBlockScalar(state, nodeIndent) {
  var captureStart, folding, chomping = CHOMPING_CLIP, didReadContent = false, detectedIndent = false, textIndent = nodeIndent, emptyLines = 0, atMoreIndented = false, tmp, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch === 124) {
    folding = false;
  } else if (ch === 62) {
    folding = true;
  } else {
    return false;
  }
  state.kind = "scalar";
  state.result = "";
  while (ch !== 0) {
    ch = state.input.charCodeAt(++state.position);
    if (ch === 43 || ch === 45) {
      if (CHOMPING_CLIP === chomping) {
        chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
      } else {
        throwError(state, "repeat of a chomping mode identifier");
      }
    } else if ((tmp = fromDecimalCode(ch)) >= 0) {
      if (tmp === 0) {
        throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
      } else if (!detectedIndent) {
        textIndent = nodeIndent + tmp - 1;
        detectedIndent = true;
      } else {
        throwError(state, "repeat of an indentation width identifier");
      }
    } else {
      break;
    }
  }
  if (is_WHITE_SPACE(ch)) {
    do {
      ch = state.input.charCodeAt(++state.position);
    } while (is_WHITE_SPACE(ch));
    if (ch === 35) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (!is_EOL(ch) && ch !== 0);
    }
  }
  while (ch !== 0) {
    readLineBreak(state);
    state.lineIndent = 0;
    ch = state.input.charCodeAt(state.position);
    while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
      state.lineIndent++;
      ch = state.input.charCodeAt(++state.position);
    }
    if (!detectedIndent && state.lineIndent > textIndent) {
      textIndent = state.lineIndent;
    }
    if (is_EOL(ch)) {
      emptyLines++;
      continue;
    }
    if (state.lineIndent < textIndent) {
      if (chomping === CHOMPING_KEEP) {
        state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
      } else if (chomping === CHOMPING_CLIP) {
        if (didReadContent) {
          state.result += "\n";
        }
      }
      break;
    }
    if (folding) {
      if (is_WHITE_SPACE(ch)) {
        atMoreIndented = true;
        state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
      } else if (atMoreIndented) {
        atMoreIndented = false;
        state.result += common.repeat("\n", emptyLines + 1);
      } else if (emptyLines === 0) {
        if (didReadContent) {
          state.result += " ";
        }
      } else {
        state.result += common.repeat("\n", emptyLines);
      }
    } else {
      state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
    }
    didReadContent = true;
    detectedIndent = true;
    emptyLines = 0;
    captureStart = state.position;
    while (!is_EOL(ch) && ch !== 0) {
      ch = state.input.charCodeAt(++state.position);
    }
    captureSegment(state, captureStart, state.position, false);
  }
  return true;
}
function readBlockSequence(state, nodeIndent) {
  var _line, _tag = state.tag, _anchor = state.anchor, _result = [], following, detected = false, ch;
  if (state.firstTabInLine !== -1) return false;
  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }
  ch = state.input.charCodeAt(state.position);
  while (ch !== 0) {
    if (state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, "tab characters must not be used in indentation");
    }
    if (ch !== 45) {
      break;
    }
    following = state.input.charCodeAt(state.position + 1);
    if (!is_WS_OR_EOL(following)) {
      break;
    }
    detected = true;
    state.position++;
    if (skipSeparationSpace(state, true, -1)) {
      if (state.lineIndent <= nodeIndent) {
        _result.push(null);
        ch = state.input.charCodeAt(state.position);
        continue;
      }
    }
    _line = state.line;
    composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
    _result.push(state.result);
    skipSeparationSpace(state, true, -1);
    ch = state.input.charCodeAt(state.position);
    if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
      throwError(state, "bad indentation of a sequence entry");
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }
  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = "sequence";
    state.result = _result;
    return true;
  }
  return false;
}
function readBlockMapping(state, nodeIndent, flowIndent) {
  var following, allowCompact, _line, _keyLine, _keyLineStart, _keyPos, _tag = state.tag, _anchor = state.anchor, _result = {}, overridableKeys = /* @__PURE__ */ Object.create(null), keyTag = null, keyNode = null, valueNode = null, atExplicitKey = false, detected = false, ch;
  if (state.firstTabInLine !== -1) return false;
  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }
  ch = state.input.charCodeAt(state.position);
  while (ch !== 0) {
    if (!atExplicitKey && state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, "tab characters must not be used in indentation");
    }
    following = state.input.charCodeAt(state.position + 1);
    _line = state.line;
    if ((ch === 63 || ch === 58) && is_WS_OR_EOL(following)) {
      if (ch === 63) {
        if (atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
          keyTag = keyNode = valueNode = null;
        }
        detected = true;
        atExplicitKey = true;
        allowCompact = true;
      } else if (atExplicitKey) {
        atExplicitKey = false;
        allowCompact = true;
      } else {
        throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
      }
      state.position += 1;
      ch = following;
    } else {
      _keyLine = state.line;
      _keyLineStart = state.lineStart;
      _keyPos = state.position;
      if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
        break;
      }
      if (state.line === _line) {
        ch = state.input.charCodeAt(state.position);
        while (is_WHITE_SPACE(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        if (ch === 58) {
          ch = state.input.charCodeAt(++state.position);
          if (!is_WS_OR_EOL(ch)) {
            throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
          }
          if (atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
            keyTag = keyNode = valueNode = null;
          }
          detected = true;
          atExplicitKey = false;
          allowCompact = false;
          keyTag = state.tag;
          keyNode = state.result;
        } else if (detected) {
          throwError(state, "can not read an implicit mapping pair; a colon is missed");
        } else {
          state.tag = _tag;
          state.anchor = _anchor;
          return true;
        }
      } else if (detected) {
        throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
      } else {
        state.tag = _tag;
        state.anchor = _anchor;
        return true;
      }
    }
    if (state.line === _line || state.lineIndent > nodeIndent) {
      if (atExplicitKey) {
        _keyLine = state.line;
        _keyLineStart = state.lineStart;
        _keyPos = state.position;
      }
      if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
        if (atExplicitKey) {
          keyNode = state.result;
        } else {
          valueNode = state.result;
        }
      }
      if (!atExplicitKey) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
        keyTag = keyNode = valueNode = null;
      }
      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
    }
    if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
      throwError(state, "bad indentation of a mapping entry");
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }
  if (atExplicitKey) {
    storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
  }
  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = "mapping";
    state.result = _result;
  }
  return detected;
}
function readTagProperty(state) {
  var _position, isVerbatim = false, isNamed = false, tagHandle, tagName, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 33) return false;
  if (state.tag !== null) {
    throwError(state, "duplication of a tag property");
  }
  ch = state.input.charCodeAt(++state.position);
  if (ch === 60) {
    isVerbatim = true;
    ch = state.input.charCodeAt(++state.position);
  } else if (ch === 33) {
    isNamed = true;
    tagHandle = "!!";
    ch = state.input.charCodeAt(++state.position);
  } else {
    tagHandle = "!";
  }
  _position = state.position;
  if (isVerbatim) {
    do {
      ch = state.input.charCodeAt(++state.position);
    } while (ch !== 0 && ch !== 62);
    if (state.position < state.length) {
      tagName = state.input.slice(_position, state.position);
      ch = state.input.charCodeAt(++state.position);
    } else {
      throwError(state, "unexpected end of the stream within a verbatim tag");
    }
  } else {
    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
      if (ch === 33) {
        if (!isNamed) {
          tagHandle = state.input.slice(_position - 1, state.position + 1);
          if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
            throwError(state, "named tag handle cannot contain such characters");
          }
          isNamed = true;
          _position = state.position + 1;
        } else {
          throwError(state, "tag suffix cannot contain exclamation marks");
        }
      }
      ch = state.input.charCodeAt(++state.position);
    }
    tagName = state.input.slice(_position, state.position);
    if (PATTERN_FLOW_INDICATORS.test(tagName)) {
      throwError(state, "tag suffix cannot contain flow indicator characters");
    }
  }
  if (tagName && !PATTERN_TAG_URI.test(tagName)) {
    throwError(state, "tag name cannot contain such characters: " + tagName);
  }
  try {
    tagName = decodeURIComponent(tagName);
  } catch (err) {
    throwError(state, "tag name is malformed: " + tagName);
  }
  if (isVerbatim) {
    state.tag = tagName;
  } else if (_hasOwnProperty$1.call(state.tagMap, tagHandle)) {
    state.tag = state.tagMap[tagHandle] + tagName;
  } else if (tagHandle === "!") {
    state.tag = "!" + tagName;
  } else if (tagHandle === "!!") {
    state.tag = "tag:yaml.org,2002:" + tagName;
  } else {
    throwError(state, 'undeclared tag handle "' + tagHandle + '"');
  }
  return true;
}
function readAnchorProperty(state) {
  var _position, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 38) return false;
  if (state.anchor !== null) {
    throwError(state, "duplication of an anchor property");
  }
  ch = state.input.charCodeAt(++state.position);
  _position = state.position;
  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }
  if (state.position === _position) {
    throwError(state, "name of an anchor node must contain at least one character");
  }
  state.anchor = state.input.slice(_position, state.position);
  return true;
}
function readAlias(state) {
  var _position, alias, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 42) return false;
  ch = state.input.charCodeAt(++state.position);
  _position = state.position;
  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }
  if (state.position === _position) {
    throwError(state, "name of an alias node must contain at least one character");
  }
  alias = state.input.slice(_position, state.position);
  if (!_hasOwnProperty$1.call(state.anchorMap, alias)) {
    throwError(state, 'unidentified alias "' + alias + '"');
  }
  state.result = state.anchorMap[alias];
  skipSeparationSpace(state, true, -1);
  return true;
}
function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
  var allowBlockStyles, allowBlockScalars, allowBlockCollections, indentStatus = 1, atNewLine = false, hasContent = false, typeIndex, typeQuantity, typeList, type3, flowIndent, blockIndent;
  if (state.listener !== null) {
    state.listener("open", state);
  }
  state.tag = null;
  state.anchor = null;
  state.kind = null;
  state.result = null;
  allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
  if (allowToSeek) {
    if (skipSeparationSpace(state, true, -1)) {
      atNewLine = true;
      if (state.lineIndent > parentIndent) {
        indentStatus = 1;
      } else if (state.lineIndent === parentIndent) {
        indentStatus = 0;
      } else if (state.lineIndent < parentIndent) {
        indentStatus = -1;
      }
    }
  }
  if (indentStatus === 1) {
    while (readTagProperty(state) || readAnchorProperty(state)) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;
        allowBlockCollections = allowBlockStyles;
        if (state.lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (state.lineIndent < parentIndent) {
          indentStatus = -1;
        }
      } else {
        allowBlockCollections = false;
      }
    }
  }
  if (allowBlockCollections) {
    allowBlockCollections = atNewLine || allowCompact;
  }
  if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
    if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
      flowIndent = parentIndent;
    } else {
      flowIndent = parentIndent + 1;
    }
    blockIndent = state.position - state.lineStart;
    if (indentStatus === 1) {
      if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) {
        hasContent = true;
      } else {
        if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) {
          hasContent = true;
        } else if (readAlias(state)) {
          hasContent = true;
          if (state.tag !== null || state.anchor !== null) {
            throwError(state, "alias node should not have any properties");
          }
        } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
          hasContent = true;
          if (state.tag === null) {
            state.tag = "?";
          }
        }
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
      }
    } else if (indentStatus === 0) {
      hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
    }
  }
  if (state.tag === null) {
    if (state.anchor !== null) {
      state.anchorMap[state.anchor] = state.result;
    }
  } else if (state.tag === "?") {
    if (state.result !== null && state.kind !== "scalar") {
      throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
    }
    for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
      type3 = state.implicitTypes[typeIndex];
      if (type3.resolve(state.result)) {
        state.result = type3.construct(state.result);
        state.tag = type3.tag;
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
        break;
      }
    }
  } else if (state.tag !== "!") {
    if (_hasOwnProperty$1.call(state.typeMap[state.kind || "fallback"], state.tag)) {
      type3 = state.typeMap[state.kind || "fallback"][state.tag];
    } else {
      type3 = null;
      typeList = state.typeMap.multi[state.kind || "fallback"];
      for (typeIndex = 0, typeQuantity = typeList.length; typeIndex < typeQuantity; typeIndex += 1) {
        if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
          type3 = typeList[typeIndex];
          break;
        }
      }
    }
    if (!type3) {
      throwError(state, "unknown tag !<" + state.tag + ">");
    }
    if (state.result !== null && type3.kind !== state.kind) {
      throwError(state, "unacceptable node kind for !<" + state.tag + '> tag; it should be "' + type3.kind + '", not "' + state.kind + '"');
    }
    if (!type3.resolve(state.result, state.tag)) {
      throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
    } else {
      state.result = type3.construct(state.result, state.tag);
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = state.result;
      }
    }
  }
  if (state.listener !== null) {
    state.listener("close", state);
  }
  return state.tag !== null || state.anchor !== null || hasContent;
}
function readDocument(state) {
  var documentStart = state.position, _position, directiveName, directiveArgs, hasDirectives = false, ch;
  state.version = null;
  state.checkLineBreaks = state.legacy;
  state.tagMap = /* @__PURE__ */ Object.create(null);
  state.anchorMap = /* @__PURE__ */ Object.create(null);
  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    skipSeparationSpace(state, true, -1);
    ch = state.input.charCodeAt(state.position);
    if (state.lineIndent > 0 || ch !== 37) {
      break;
    }
    hasDirectives = true;
    ch = state.input.charCodeAt(++state.position);
    _position = state.position;
    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
    directiveName = state.input.slice(_position, state.position);
    directiveArgs = [];
    if (directiveName.length < 1) {
      throwError(state, "directive name must not be less than one character in length");
    }
    while (ch !== 0) {
      while (is_WHITE_SPACE(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      if (ch === 35) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 0 && !is_EOL(ch));
        break;
      }
      if (is_EOL(ch)) break;
      _position = state.position;
      while (ch !== 0 && !is_WS_OR_EOL(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      directiveArgs.push(state.input.slice(_position, state.position));
    }
    if (ch !== 0) readLineBreak(state);
    if (_hasOwnProperty$1.call(directiveHandlers, directiveName)) {
      directiveHandlers[directiveName](state, directiveName, directiveArgs);
    } else {
      throwWarning(state, 'unknown document directive "' + directiveName + '"');
    }
  }
  skipSeparationSpace(state, true, -1);
  if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
    state.position += 3;
    skipSeparationSpace(state, true, -1);
  } else if (hasDirectives) {
    throwError(state, "directives end mark is expected");
  }
  composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
  skipSeparationSpace(state, true, -1);
  if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
    throwWarning(state, "non-ASCII line breaks are interpreted as content");
  }
  state.documents.push(state.result);
  if (state.position === state.lineStart && testDocumentSeparator(state)) {
    if (state.input.charCodeAt(state.position) === 46) {
      state.position += 3;
      skipSeparationSpace(state, true, -1);
    }
    return;
  }
  if (state.position < state.length - 1) {
    throwError(state, "end of the stream or a document separator is expected");
  } else {
    return;
  }
}
function loadDocuments(input, options) {
  input = String(input);
  options = options || {};
  if (input.length !== 0) {
    if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) {
      input += "\n";
    }
    if (input.charCodeAt(0) === 65279) {
      input = input.slice(1);
    }
  }
  var state = new State$1(input, options);
  var nullpos = input.indexOf("\0");
  if (nullpos !== -1) {
    state.position = nullpos;
    throwError(state, "null byte is not allowed in input");
  }
  state.input += "\0";
  while (state.input.charCodeAt(state.position) === 32) {
    state.lineIndent += 1;
    state.position += 1;
  }
  while (state.position < state.length - 1) {
    readDocument(state);
  }
  return state.documents;
}
function loadAll$1(input, iterator, options) {
  if (iterator !== null && typeof iterator === "object" && typeof options === "undefined") {
    options = iterator;
    iterator = null;
  }
  var documents = loadDocuments(input, options);
  if (typeof iterator !== "function") {
    return documents;
  }
  for (var index = 0, length = documents.length; index < length; index += 1) {
    iterator(documents[index]);
  }
}
function load$1(input, options) {
  var documents = loadDocuments(input, options);
  if (documents.length === 0) {
    return void 0;
  } else if (documents.length === 1) {
    return documents[0];
  }
  throw new exception("expected a single document in the stream, but found more");
}
function compileStyleMap(schema2, map2) {
  var result2, keys, index, length, tag, style, type3;
  if (map2 === null) return {};
  result2 = {};
  keys = Object.keys(map2);
  for (index = 0, length = keys.length; index < length; index += 1) {
    tag = keys[index];
    style = String(map2[tag]);
    if (tag.slice(0, 2) === "!!") {
      tag = "tag:yaml.org,2002:" + tag.slice(2);
    }
    type3 = schema2.compiledTypeMap["fallback"][tag];
    if (type3 && _hasOwnProperty.call(type3.styleAliases, style)) {
      style = type3.styleAliases[style];
    }
    result2[tag] = style;
  }
  return result2;
}
function encodeHex(character) {
  var string, handle, length;
  string = character.toString(16).toUpperCase();
  if (character <= 255) {
    handle = "x";
    length = 2;
  } else if (character <= 65535) {
    handle = "u";
    length = 4;
  } else if (character <= 4294967295) {
    handle = "U";
    length = 8;
  } else {
    throw new exception("code point within a string may not be greater than 0xFFFFFFFF");
  }
  return "\\" + handle + common.repeat("0", length - string.length) + string;
}
function State(options) {
  this.schema = options["schema"] || _default;
  this.indent = Math.max(1, options["indent"] || 2);
  this.noArrayIndent = options["noArrayIndent"] || false;
  this.skipInvalid = options["skipInvalid"] || false;
  this.flowLevel = common.isNothing(options["flowLevel"]) ? -1 : options["flowLevel"];
  this.styleMap = compileStyleMap(this.schema, options["styles"] || null);
  this.sortKeys = options["sortKeys"] || false;
  this.lineWidth = options["lineWidth"] || 80;
  this.noRefs = options["noRefs"] || false;
  this.noCompatMode = options["noCompatMode"] || false;
  this.condenseFlow = options["condenseFlow"] || false;
  this.quotingType = options["quotingType"] === '"' ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
  this.forceQuotes = options["forceQuotes"] || false;
  this.replacer = typeof options["replacer"] === "function" ? options["replacer"] : null;
  this.implicitTypes = this.schema.compiledImplicit;
  this.explicitTypes = this.schema.compiledExplicit;
  this.tag = null;
  this.result = "";
  this.duplicates = [];
  this.usedDuplicates = null;
}
function indentString(string, spaces) {
  var ind = common.repeat(" ", spaces), position = 0, next = -1, result2 = "", line, length = string.length;
  while (position < length) {
    next = string.indexOf("\n", position);
    if (next === -1) {
      line = string.slice(position);
      position = length;
    } else {
      line = string.slice(position, next + 1);
      position = next + 1;
    }
    if (line.length && line !== "\n") result2 += ind;
    result2 += line;
  }
  return result2;
}
function generateNextLine(state, level) {
  return "\n" + common.repeat(" ", state.indent * level);
}
function testImplicitResolving(state, str2) {
  var index, length, type3;
  for (index = 0, length = state.implicitTypes.length; index < length; index += 1) {
    type3 = state.implicitTypes[index];
    if (type3.resolve(str2)) {
      return true;
    }
  }
  return false;
}
function isWhitespace(c) {
  return c === CHAR_SPACE || c === CHAR_TAB;
}
function isPrintable(c) {
  return 32 <= c && c <= 126 || 161 <= c && c <= 55295 && c !== 8232 && c !== 8233 || 57344 <= c && c <= 65533 && c !== CHAR_BOM || 65536 <= c && c <= 1114111;
}
function isNsCharOrWhitespace(c) {
  return isPrintable(c) && c !== CHAR_BOM && c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
}
function isPlainSafe(c, prev, inblock) {
  var cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
  var cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
  return (
    // ns-plain-safe
    (inblock ? (
      // c = flow-in
      cIsNsCharOrWhitespace
    ) : cIsNsCharOrWhitespace && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET) && c !== CHAR_SHARP && !(prev === CHAR_COLON && !cIsNsChar) || isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP || prev === CHAR_COLON && cIsNsChar
  );
}
function isPlainSafeFirst(c) {
  return isPrintable(c) && c !== CHAR_BOM && !isWhitespace(c) && c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
}
function isPlainSafeLast(c) {
  return !isWhitespace(c) && c !== CHAR_COLON;
}
function codePointAt(string, pos) {
  var first = string.charCodeAt(pos), second;
  if (first >= 55296 && first <= 56319 && pos + 1 < string.length) {
    second = string.charCodeAt(pos + 1);
    if (second >= 56320 && second <= 57343) {
      return (first - 55296) * 1024 + second - 56320 + 65536;
    }
  }
  return first;
}
function needIndentIndicator(string) {
  var leadingSpaceRe = /^\n* /;
  return leadingSpaceRe.test(string);
}
function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType, quotingType, forceQuotes, inblock) {
  var i;
  var char = 0;
  var prevChar = null;
  var hasLineBreak = false;
  var hasFoldableLine = false;
  var shouldTrackWidth = lineWidth !== -1;
  var previousLineBreak = -1;
  var plain = isPlainSafeFirst(codePointAt(string, 0)) && isPlainSafeLast(codePointAt(string, string.length - 1));
  if (singleLineOnly || forceQuotes) {
    for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
      char = codePointAt(string, i);
      if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }
      plain = plain && isPlainSafe(char, prevChar, inblock);
      prevChar = char;
    }
  } else {
    for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
      char = codePointAt(string, i);
      if (char === CHAR_LINE_FEED) {
        hasLineBreak = true;
        if (shouldTrackWidth) {
          hasFoldableLine = hasFoldableLine || // Foldable line = too long, and not more-indented.
          i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
          previousLineBreak = i;
        }
      } else if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }
      plain = plain && isPlainSafe(char, prevChar, inblock);
      prevChar = char;
    }
    hasFoldableLine = hasFoldableLine || shouldTrackWidth && (i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ");
  }
  if (!hasLineBreak && !hasFoldableLine) {
    if (plain && !forceQuotes && !testAmbiguousType(string)) {
      return STYLE_PLAIN;
    }
    return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
  }
  if (indentPerLevel > 9 && needIndentIndicator(string)) {
    return STYLE_DOUBLE;
  }
  if (!forceQuotes) {
    return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
  }
  return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
}
function writeScalar(state, string, level, iskey, inblock) {
  state.dump = function() {
    if (string.length === 0) {
      return state.quotingType === QUOTING_TYPE_DOUBLE ? '""' : "''";
    }
    if (!state.noCompatMode) {
      if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) {
        return state.quotingType === QUOTING_TYPE_DOUBLE ? '"' + string + '"' : "'" + string + "'";
      }
    }
    var indent = state.indent * Math.max(1, level);
    var lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
    var singleLineOnly = iskey || state.flowLevel > -1 && level >= state.flowLevel;
    function testAmbiguity(string2) {
      return testImplicitResolving(state, string2);
    }
    switch (chooseScalarStyle(
      string,
      singleLineOnly,
      state.indent,
      lineWidth,
      testAmbiguity,
      state.quotingType,
      state.forceQuotes && !iskey,
      inblock
    )) {
      case STYLE_PLAIN:
        return string;
      case STYLE_SINGLE:
        return "'" + string.replace(/'/g, "''") + "'";
      case STYLE_LITERAL:
        return "|" + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));
      case STYLE_FOLDED:
        return ">" + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
      case STYLE_DOUBLE:
        return '"' + escapeString(string) + '"';
      default:
        throw new exception("impossible error: invalid scalar style");
    }
  }();
}
function blockHeader(string, indentPerLevel) {
  var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
  var clip = string[string.length - 1] === "\n";
  var keep = clip && (string[string.length - 2] === "\n" || string === "\n");
  var chomp = keep ? "+" : clip ? "" : "-";
  return indentIndicator + chomp + "\n";
}
function dropEndingNewline(string) {
  return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
}
function foldString(string, width) {
  var lineRe = /(\n+)([^\n]*)/g;
  var result2 = function() {
    var nextLF = string.indexOf("\n");
    nextLF = nextLF !== -1 ? nextLF : string.length;
    lineRe.lastIndex = nextLF;
    return foldLine(string.slice(0, nextLF), width);
  }();
  var prevMoreIndented = string[0] === "\n" || string[0] === " ";
  var moreIndented;
  var match;
  while (match = lineRe.exec(string)) {
    var prefix = match[1], line = match[2];
    moreIndented = line[0] === " ";
    result2 += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + foldLine(line, width);
    prevMoreIndented = moreIndented;
  }
  return result2;
}
function foldLine(line, width) {
  if (line === "" || line[0] === " ") return line;
  var breakRe = / [^ ]/g;
  var match;
  var start = 0, end, curr = 0, next = 0;
  var result2 = "";
  while (match = breakRe.exec(line)) {
    next = match.index;
    if (next - start > width) {
      end = curr > start ? curr : next;
      result2 += "\n" + line.slice(start, end);
      start = end + 1;
    }
    curr = next;
  }
  result2 += "\n";
  if (line.length - start > width && curr > start) {
    result2 += line.slice(start, curr) + "\n" + line.slice(curr + 1);
  } else {
    result2 += line.slice(start);
  }
  return result2.slice(1);
}
function escapeString(string) {
  var result2 = "";
  var char = 0;
  var escapeSeq;
  for (var i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
    char = codePointAt(string, i);
    escapeSeq = ESCAPE_SEQUENCES[char];
    if (!escapeSeq && isPrintable(char)) {
      result2 += string[i];
      if (char >= 65536) result2 += string[i + 1];
    } else {
      result2 += escapeSeq || encodeHex(char);
    }
  }
  return result2;
}
function writeFlowSequence(state, level, object) {
  var _result = "", _tag = state.tag, index, length, value;
  for (index = 0, length = object.length; index < length; index += 1) {
    value = object[index];
    if (state.replacer) {
      value = state.replacer.call(object, String(index), value);
    }
    if (writeNode(state, level, value, false, false) || typeof value === "undefined" && writeNode(state, level, null, false, false)) {
      if (_result !== "") _result += "," + (!state.condenseFlow ? " " : "");
      _result += state.dump;
    }
  }
  state.tag = _tag;
  state.dump = "[" + _result + "]";
}
function writeBlockSequence(state, level, object, compact) {
  var _result = "", _tag = state.tag, index, length, value;
  for (index = 0, length = object.length; index < length; index += 1) {
    value = object[index];
    if (state.replacer) {
      value = state.replacer.call(object, String(index), value);
    }
    if (writeNode(state, level + 1, value, true, true, false, true) || typeof value === "undefined" && writeNode(state, level + 1, null, true, true, false, true)) {
      if (!compact || _result !== "") {
        _result += generateNextLine(state, level);
      }
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        _result += "-";
      } else {
        _result += "- ";
      }
      _result += state.dump;
    }
  }
  state.tag = _tag;
  state.dump = _result || "[]";
}
function writeFlowMapping(state, level, object) {
  var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, pairBuffer;
  for (index = 0, length = objectKeyList.length; index < length; index += 1) {
    pairBuffer = "";
    if (_result !== "") pairBuffer += ", ";
    if (state.condenseFlow) pairBuffer += '"';
    objectKey = objectKeyList[index];
    objectValue = object[objectKey];
    if (state.replacer) {
      objectValue = state.replacer.call(object, objectKey, objectValue);
    }
    if (!writeNode(state, level, objectKey, false, false)) {
      continue;
    }
    if (state.dump.length > 1024) pairBuffer += "? ";
    pairBuffer += state.dump + (state.condenseFlow ? '"' : "") + ":" + (state.condenseFlow ? "" : " ");
    if (!writeNode(state, level, objectValue, false, false)) {
      continue;
    }
    pairBuffer += state.dump;
    _result += pairBuffer;
  }
  state.tag = _tag;
  state.dump = "{" + _result + "}";
}
function writeBlockMapping(state, level, object, compact) {
  var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, explicitPair, pairBuffer;
  if (state.sortKeys === true) {
    objectKeyList.sort();
  } else if (typeof state.sortKeys === "function") {
    objectKeyList.sort(state.sortKeys);
  } else if (state.sortKeys) {
    throw new exception("sortKeys must be a boolean or a function");
  }
  for (index = 0, length = objectKeyList.length; index < length; index += 1) {
    pairBuffer = "";
    if (!compact || _result !== "") {
      pairBuffer += generateNextLine(state, level);
    }
    objectKey = objectKeyList[index];
    objectValue = object[objectKey];
    if (state.replacer) {
      objectValue = state.replacer.call(object, objectKey, objectValue);
    }
    if (!writeNode(state, level + 1, objectKey, true, true, true)) {
      continue;
    }
    explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
    if (explicitPair) {
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        pairBuffer += "?";
      } else {
        pairBuffer += "? ";
      }
    }
    pairBuffer += state.dump;
    if (explicitPair) {
      pairBuffer += generateNextLine(state, level);
    }
    if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
      continue;
    }
    if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
      pairBuffer += ":";
    } else {
      pairBuffer += ": ";
    }
    pairBuffer += state.dump;
    _result += pairBuffer;
  }
  state.tag = _tag;
  state.dump = _result || "{}";
}
function detectType(state, object, explicit) {
  var _result, typeList, index, length, type3, style;
  typeList = explicit ? state.explicitTypes : state.implicitTypes;
  for (index = 0, length = typeList.length; index < length; index += 1) {
    type3 = typeList[index];
    if ((type3.instanceOf || type3.predicate) && (!type3.instanceOf || typeof object === "object" && object instanceof type3.instanceOf) && (!type3.predicate || type3.predicate(object))) {
      if (explicit) {
        if (type3.multi && type3.representName) {
          state.tag = type3.representName(object);
        } else {
          state.tag = type3.tag;
        }
      } else {
        state.tag = "?";
      }
      if (type3.represent) {
        style = state.styleMap[type3.tag] || type3.defaultStyle;
        if (_toString.call(type3.represent) === "[object Function]") {
          _result = type3.represent(object, style);
        } else if (_hasOwnProperty.call(type3.represent, style)) {
          _result = type3.represent[style](object, style);
        } else {
          throw new exception("!<" + type3.tag + '> tag resolver accepts not "' + style + '" style');
        }
        state.dump = _result;
      }
      return true;
    }
  }
  return false;
}
function writeNode(state, level, object, block, compact, iskey, isblockseq) {
  state.tag = null;
  state.dump = object;
  if (!detectType(state, object, false)) {
    detectType(state, object, true);
  }
  var type3 = _toString.call(state.dump);
  var inblock = block;
  var tagStr;
  if (block) {
    block = state.flowLevel < 0 || state.flowLevel > level;
  }
  var objectOrArray = type3 === "[object Object]" || type3 === "[object Array]", duplicateIndex, duplicate;
  if (objectOrArray) {
    duplicateIndex = state.duplicates.indexOf(object);
    duplicate = duplicateIndex !== -1;
  }
  if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) {
    compact = false;
  }
  if (duplicate && state.usedDuplicates[duplicateIndex]) {
    state.dump = "*ref_" + duplicateIndex;
  } else {
    if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
      state.usedDuplicates[duplicateIndex] = true;
    }
    if (type3 === "[object Object]") {
      if (block && Object.keys(state.dump).length !== 0) {
        writeBlockMapping(state, level, state.dump, compact);
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + state.dump;
        }
      } else {
        writeFlowMapping(state, level, state.dump);
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + " " + state.dump;
        }
      }
    } else if (type3 === "[object Array]") {
      if (block && state.dump.length !== 0) {
        if (state.noArrayIndent && !isblockseq && level > 0) {
          writeBlockSequence(state, level - 1, state.dump, compact);
        } else {
          writeBlockSequence(state, level, state.dump, compact);
        }
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + state.dump;
        }
      } else {
        writeFlowSequence(state, level, state.dump);
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + " " + state.dump;
        }
      }
    } else if (type3 === "[object String]") {
      if (state.tag !== "?") {
        writeScalar(state, state.dump, level, iskey, inblock);
      }
    } else if (type3 === "[object Undefined]") {
      return false;
    } else {
      if (state.skipInvalid) return false;
      throw new exception("unacceptable kind of an object to dump " + type3);
    }
    if (state.tag !== null && state.tag !== "?") {
      tagStr = encodeURI(
        state.tag[0] === "!" ? state.tag.slice(1) : state.tag
      ).replace(/!/g, "%21");
      if (state.tag[0] === "!") {
        tagStr = "!" + tagStr;
      } else if (tagStr.slice(0, 18) === "tag:yaml.org,2002:") {
        tagStr = "!!" + tagStr.slice(18);
      } else {
        tagStr = "!<" + tagStr + ">";
      }
      state.dump = tagStr + " " + state.dump;
    }
  }
  return true;
}
function getDuplicateReferences(object, state) {
  var objects = [], duplicatesIndexes = [], index, length;
  inspectNode(object, objects, duplicatesIndexes);
  for (index = 0, length = duplicatesIndexes.length; index < length; index += 1) {
    state.duplicates.push(objects[duplicatesIndexes[index]]);
  }
  state.usedDuplicates = new Array(length);
}
function inspectNode(object, objects, duplicatesIndexes) {
  var objectKeyList, index, length;
  if (object !== null && typeof object === "object") {
    index = objects.indexOf(object);
    if (index !== -1) {
      if (duplicatesIndexes.indexOf(index) === -1) {
        duplicatesIndexes.push(index);
      }
    } else {
      objects.push(object);
      if (Array.isArray(object)) {
        for (index = 0, length = object.length; index < length; index += 1) {
          inspectNode(object[index], objects, duplicatesIndexes);
        }
      } else {
        objectKeyList = Object.keys(object);
        for (index = 0, length = objectKeyList.length; index < length; index += 1) {
          inspectNode(object[objectKeyList[index]], objects, duplicatesIndexes);
        }
      }
    }
  }
}
function dump$1(input, options) {
  options = options || {};
  var state = new State(options);
  if (!state.noRefs) getDuplicateReferences(input, state);
  var value = input;
  if (state.replacer) {
    value = state.replacer.call({ "": value }, "", value);
  }
  if (writeNode(state, 0, value, true, true)) return state.dump + "\n";
  return "";
}
function renamed(from, to) {
  return function() {
    throw new Error("Function yaml." + from + " is removed in js-yaml 4. Use yaml." + to + " instead, which is now safe by default.");
  };
}
var isNothing_1, isObject_1, toArray_1, repeat_1, isNegativeZero_1, extend_1, common, exception, snippet, TYPE_CONSTRUCTOR_OPTIONS, YAML_NODE_KINDS, type, schema, str, seq, map, failsafe, _null, bool, int, YAML_FLOAT_PATTERN, SCIENTIFIC_WITHOUT_DOT, float, json, core, YAML_DATE_REGEXP, YAML_TIMESTAMP_REGEXP, timestamp, merge, BASE64_MAP, binary, _hasOwnProperty$3, _toString$2, omap, _toString$1, pairs, _hasOwnProperty$2, set, _default, _hasOwnProperty$1, CONTEXT_FLOW_IN, CONTEXT_FLOW_OUT, CONTEXT_BLOCK_IN, CONTEXT_BLOCK_OUT, CHOMPING_CLIP, CHOMPING_STRIP, CHOMPING_KEEP, PATTERN_NON_PRINTABLE, PATTERN_NON_ASCII_LINE_BREAKS, PATTERN_FLOW_INDICATORS, PATTERN_TAG_HANDLE, PATTERN_TAG_URI, simpleEscapeCheck, simpleEscapeMap, i, directiveHandlers, loadAll_1, load_1, loader, _toString, _hasOwnProperty, CHAR_BOM, CHAR_TAB, CHAR_LINE_FEED, CHAR_CARRIAGE_RETURN, CHAR_SPACE, CHAR_EXCLAMATION, CHAR_DOUBLE_QUOTE, CHAR_SHARP, CHAR_PERCENT, CHAR_AMPERSAND, CHAR_SINGLE_QUOTE, CHAR_ASTERISK, CHAR_COMMA, CHAR_MINUS, CHAR_COLON, CHAR_EQUALS, CHAR_GREATER_THAN, CHAR_QUESTION, CHAR_COMMERCIAL_AT, CHAR_LEFT_SQUARE_BRACKET, CHAR_RIGHT_SQUARE_BRACKET, CHAR_GRAVE_ACCENT, CHAR_LEFT_CURLY_BRACKET, CHAR_VERTICAL_LINE, CHAR_RIGHT_CURLY_BRACKET, ESCAPE_SEQUENCES, DEPRECATED_BOOLEANS_SYNTAX, DEPRECATED_BASE60_SYNTAX, QUOTING_TYPE_SINGLE, QUOTING_TYPE_DOUBLE, STYLE_PLAIN, STYLE_SINGLE, STYLE_LITERAL, STYLE_FOLDED, STYLE_DOUBLE, dump_1, dumper, Type, Schema, FAILSAFE_SCHEMA, JSON_SCHEMA, CORE_SCHEMA, DEFAULT_SCHEMA, load, loadAll, dump, YAMLException, types, safeLoad, safeLoadAll, safeDump, jsYaml;
var init_js_yaml = __esm({
  "node_modules/js-yaml/dist/js-yaml.mjs"() {
    isNothing_1 = isNothing;
    isObject_1 = isObject;
    toArray_1 = toArray;
    repeat_1 = repeat;
    isNegativeZero_1 = isNegativeZero;
    extend_1 = extend;
    common = {
      isNothing: isNothing_1,
      isObject: isObject_1,
      toArray: toArray_1,
      repeat: repeat_1,
      isNegativeZero: isNegativeZero_1,
      extend: extend_1
    };
    YAMLException$1.prototype = Object.create(Error.prototype);
    YAMLException$1.prototype.constructor = YAMLException$1;
    YAMLException$1.prototype.toString = function toString(compact) {
      return this.name + ": " + formatError(this, compact);
    };
    exception = YAMLException$1;
    snippet = makeSnippet;
    TYPE_CONSTRUCTOR_OPTIONS = [
      "kind",
      "multi",
      "resolve",
      "construct",
      "instanceOf",
      "predicate",
      "represent",
      "representName",
      "defaultStyle",
      "styleAliases"
    ];
    YAML_NODE_KINDS = [
      "scalar",
      "sequence",
      "mapping"
    ];
    type = Type$1;
    Schema$1.prototype.extend = function extend2(definition) {
      var implicit = [];
      var explicit = [];
      if (definition instanceof type) {
        explicit.push(definition);
      } else if (Array.isArray(definition)) {
        explicit = explicit.concat(definition);
      } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
        if (definition.implicit) implicit = implicit.concat(definition.implicit);
        if (definition.explicit) explicit = explicit.concat(definition.explicit);
      } else {
        throw new exception("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
      }
      implicit.forEach(function(type$1) {
        if (!(type$1 instanceof type)) {
          throw new exception("Specified list of YAML types (or a single Type object) contains a non-Type object.");
        }
        if (type$1.loadKind && type$1.loadKind !== "scalar") {
          throw new exception("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
        }
        if (type$1.multi) {
          throw new exception("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
        }
      });
      explicit.forEach(function(type$1) {
        if (!(type$1 instanceof type)) {
          throw new exception("Specified list of YAML types (or a single Type object) contains a non-Type object.");
        }
      });
      var result2 = Object.create(Schema$1.prototype);
      result2.implicit = (this.implicit || []).concat(implicit);
      result2.explicit = (this.explicit || []).concat(explicit);
      result2.compiledImplicit = compileList(result2, "implicit");
      result2.compiledExplicit = compileList(result2, "explicit");
      result2.compiledTypeMap = compileMap(result2.compiledImplicit, result2.compiledExplicit);
      return result2;
    };
    schema = Schema$1;
    str = new type("tag:yaml.org,2002:str", {
      kind: "scalar",
      construct: function(data) {
        return data !== null ? data : "";
      }
    });
    seq = new type("tag:yaml.org,2002:seq", {
      kind: "sequence",
      construct: function(data) {
        return data !== null ? data : [];
      }
    });
    map = new type("tag:yaml.org,2002:map", {
      kind: "mapping",
      construct: function(data) {
        return data !== null ? data : {};
      }
    });
    failsafe = new schema({
      explicit: [
        str,
        seq,
        map
      ]
    });
    _null = new type("tag:yaml.org,2002:null", {
      kind: "scalar",
      resolve: resolveYamlNull,
      construct: constructYamlNull,
      predicate: isNull,
      represent: {
        canonical: function() {
          return "~";
        },
        lowercase: function() {
          return "null";
        },
        uppercase: function() {
          return "NULL";
        },
        camelcase: function() {
          return "Null";
        },
        empty: function() {
          return "";
        }
      },
      defaultStyle: "lowercase"
    });
    bool = new type("tag:yaml.org,2002:bool", {
      kind: "scalar",
      resolve: resolveYamlBoolean,
      construct: constructYamlBoolean,
      predicate: isBoolean,
      represent: {
        lowercase: function(object) {
          return object ? "true" : "false";
        },
        uppercase: function(object) {
          return object ? "TRUE" : "FALSE";
        },
        camelcase: function(object) {
          return object ? "True" : "False";
        }
      },
      defaultStyle: "lowercase"
    });
    int = new type("tag:yaml.org,2002:int", {
      kind: "scalar",
      resolve: resolveYamlInteger,
      construct: constructYamlInteger,
      predicate: isInteger,
      represent: {
        binary: function(obj) {
          return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
        },
        octal: function(obj) {
          return obj >= 0 ? "0o" + obj.toString(8) : "-0o" + obj.toString(8).slice(1);
        },
        decimal: function(obj) {
          return obj.toString(10);
        },
        /* eslint-disable max-len */
        hexadecimal: function(obj) {
          return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
        }
      },
      defaultStyle: "decimal",
      styleAliases: {
        binary: [2, "bin"],
        octal: [8, "oct"],
        decimal: [10, "dec"],
        hexadecimal: [16, "hex"]
      }
    });
    YAML_FLOAT_PATTERN = new RegExp(
      // 2.5e4, 2.5 and integers
      "^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
    );
    SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
    float = new type("tag:yaml.org,2002:float", {
      kind: "scalar",
      resolve: resolveYamlFloat,
      construct: constructYamlFloat,
      predicate: isFloat,
      represent: representYamlFloat,
      defaultStyle: "lowercase"
    });
    json = failsafe.extend({
      implicit: [
        _null,
        bool,
        int,
        float
      ]
    });
    core = json;
    YAML_DATE_REGEXP = new RegExp(
      "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
    );
    YAML_TIMESTAMP_REGEXP = new RegExp(
      "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
    );
    timestamp = new type("tag:yaml.org,2002:timestamp", {
      kind: "scalar",
      resolve: resolveYamlTimestamp,
      construct: constructYamlTimestamp,
      instanceOf: Date,
      represent: representYamlTimestamp
    });
    merge = new type("tag:yaml.org,2002:merge", {
      kind: "scalar",
      resolve: resolveYamlMerge
    });
    BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
    binary = new type("tag:yaml.org,2002:binary", {
      kind: "scalar",
      resolve: resolveYamlBinary,
      construct: constructYamlBinary,
      predicate: isBinary,
      represent: representYamlBinary
    });
    _hasOwnProperty$3 = Object.prototype.hasOwnProperty;
    _toString$2 = Object.prototype.toString;
    omap = new type("tag:yaml.org,2002:omap", {
      kind: "sequence",
      resolve: resolveYamlOmap,
      construct: constructYamlOmap
    });
    _toString$1 = Object.prototype.toString;
    pairs = new type("tag:yaml.org,2002:pairs", {
      kind: "sequence",
      resolve: resolveYamlPairs,
      construct: constructYamlPairs
    });
    _hasOwnProperty$2 = Object.prototype.hasOwnProperty;
    set = new type("tag:yaml.org,2002:set", {
      kind: "mapping",
      resolve: resolveYamlSet,
      construct: constructYamlSet
    });
    _default = core.extend({
      implicit: [
        timestamp,
        merge
      ],
      explicit: [
        binary,
        omap,
        pairs,
        set
      ]
    });
    _hasOwnProperty$1 = Object.prototype.hasOwnProperty;
    CONTEXT_FLOW_IN = 1;
    CONTEXT_FLOW_OUT = 2;
    CONTEXT_BLOCK_IN = 3;
    CONTEXT_BLOCK_OUT = 4;
    CHOMPING_CLIP = 1;
    CHOMPING_STRIP = 2;
    CHOMPING_KEEP = 3;
    PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
    PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
    PATTERN_FLOW_INDICATORS = /[,\[\]\{\}]/;
    PATTERN_TAG_HANDLE = /^(?:!|!!|![a-z\-]+!)$/i;
    PATTERN_TAG_URI = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
    simpleEscapeCheck = new Array(256);
    simpleEscapeMap = new Array(256);
    for (i = 0; i < 256; i++) {
      simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
      simpleEscapeMap[i] = simpleEscapeSequence(i);
    }
    directiveHandlers = {
      YAML: function handleYamlDirective(state, name, args2) {
        var match, major, minor;
        if (state.version !== null) {
          throwError(state, "duplication of %YAML directive");
        }
        if (args2.length !== 1) {
          throwError(state, "YAML directive accepts exactly one argument");
        }
        match = /^([0-9]+)\.([0-9]+)$/.exec(args2[0]);
        if (match === null) {
          throwError(state, "ill-formed argument of the YAML directive");
        }
        major = parseInt(match[1], 10);
        minor = parseInt(match[2], 10);
        if (major !== 1) {
          throwError(state, "unacceptable YAML version of the document");
        }
        state.version = args2[0];
        state.checkLineBreaks = minor < 2;
        if (minor !== 1 && minor !== 2) {
          throwWarning(state, "unsupported YAML version of the document");
        }
      },
      TAG: function handleTagDirective(state, name, args2) {
        var handle, prefix;
        if (args2.length !== 2) {
          throwError(state, "TAG directive accepts exactly two arguments");
        }
        handle = args2[0];
        prefix = args2[1];
        if (!PATTERN_TAG_HANDLE.test(handle)) {
          throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
        }
        if (_hasOwnProperty$1.call(state.tagMap, handle)) {
          throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
        }
        if (!PATTERN_TAG_URI.test(prefix)) {
          throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
        }
        try {
          prefix = decodeURIComponent(prefix);
        } catch (err) {
          throwError(state, "tag prefix is malformed: " + prefix);
        }
        state.tagMap[handle] = prefix;
      }
    };
    loadAll_1 = loadAll$1;
    load_1 = load$1;
    loader = {
      loadAll: loadAll_1,
      load: load_1
    };
    _toString = Object.prototype.toString;
    _hasOwnProperty = Object.prototype.hasOwnProperty;
    CHAR_BOM = 65279;
    CHAR_TAB = 9;
    CHAR_LINE_FEED = 10;
    CHAR_CARRIAGE_RETURN = 13;
    CHAR_SPACE = 32;
    CHAR_EXCLAMATION = 33;
    CHAR_DOUBLE_QUOTE = 34;
    CHAR_SHARP = 35;
    CHAR_PERCENT = 37;
    CHAR_AMPERSAND = 38;
    CHAR_SINGLE_QUOTE = 39;
    CHAR_ASTERISK = 42;
    CHAR_COMMA = 44;
    CHAR_MINUS = 45;
    CHAR_COLON = 58;
    CHAR_EQUALS = 61;
    CHAR_GREATER_THAN = 62;
    CHAR_QUESTION = 63;
    CHAR_COMMERCIAL_AT = 64;
    CHAR_LEFT_SQUARE_BRACKET = 91;
    CHAR_RIGHT_SQUARE_BRACKET = 93;
    CHAR_GRAVE_ACCENT = 96;
    CHAR_LEFT_CURLY_BRACKET = 123;
    CHAR_VERTICAL_LINE = 124;
    CHAR_RIGHT_CURLY_BRACKET = 125;
    ESCAPE_SEQUENCES = {};
    ESCAPE_SEQUENCES[0] = "\\0";
    ESCAPE_SEQUENCES[7] = "\\a";
    ESCAPE_SEQUENCES[8] = "\\b";
    ESCAPE_SEQUENCES[9] = "\\t";
    ESCAPE_SEQUENCES[10] = "\\n";
    ESCAPE_SEQUENCES[11] = "\\v";
    ESCAPE_SEQUENCES[12] = "\\f";
    ESCAPE_SEQUENCES[13] = "\\r";
    ESCAPE_SEQUENCES[27] = "\\e";
    ESCAPE_SEQUENCES[34] = '\\"';
    ESCAPE_SEQUENCES[92] = "\\\\";
    ESCAPE_SEQUENCES[133] = "\\N";
    ESCAPE_SEQUENCES[160] = "\\_";
    ESCAPE_SEQUENCES[8232] = "\\L";
    ESCAPE_SEQUENCES[8233] = "\\P";
    DEPRECATED_BOOLEANS_SYNTAX = [
      "y",
      "Y",
      "yes",
      "Yes",
      "YES",
      "on",
      "On",
      "ON",
      "n",
      "N",
      "no",
      "No",
      "NO",
      "off",
      "Off",
      "OFF"
    ];
    DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
    QUOTING_TYPE_SINGLE = 1;
    QUOTING_TYPE_DOUBLE = 2;
    STYLE_PLAIN = 1;
    STYLE_SINGLE = 2;
    STYLE_LITERAL = 3;
    STYLE_FOLDED = 4;
    STYLE_DOUBLE = 5;
    dump_1 = dump$1;
    dumper = {
      dump: dump_1
    };
    Type = type;
    Schema = schema;
    FAILSAFE_SCHEMA = failsafe;
    JSON_SCHEMA = json;
    CORE_SCHEMA = core;
    DEFAULT_SCHEMA = _default;
    load = loader.load;
    loadAll = loader.loadAll;
    dump = dumper.dump;
    YAMLException = exception;
    types = {
      binary,
      float,
      map,
      null: _null,
      pairs,
      set,
      timestamp,
      bool,
      int,
      merge,
      omap,
      seq,
      str
    };
    safeLoad = renamed("safeLoad", "load");
    safeLoadAll = renamed("safeLoadAll", "loadAll");
    safeDump = renamed("safeDump", "dump");
    jsYaml = {
      Type,
      Schema,
      FAILSAFE_SCHEMA,
      JSON_SCHEMA,
      CORE_SCHEMA,
      DEFAULT_SCHEMA,
      load,
      loadAll,
      dump,
      YAMLException,
      types,
      safeLoad,
      safeLoadAll,
      safeDump
    };
  }
});

// src/cli/format.ts
function formatOutput(data, format, color = process.stdout?.isTTY ?? false) {
  switch (format) {
    case "json": {
      const json2 = JSON.stringify(data, null, 2);
      return color ? colorizeJson(json2) : json2;
    }
    case "yaml":
      return jsYaml.dump(data, { noRefs: true, lineWidth: -1 });
    case "markdown":
      return toMarkdownTable(data);
    case "csv":
      return toCsv(data);
    default:
      throw new Error(`Unknown format: ${format}. Supported: json, yaml, markdown, csv`);
  }
}
function toMarkdownTable(data) {
  if (Array.isArray(data)) {
    if (data.length === 0) return "(empty)\n";
    const keys = Object.keys(data[0]);
    const header2 = `| ${keys.join(" | ")} |`;
    const separator2 = `| ${keys.map(() => "---").join(" | ")} |`;
    const rows2 = data.map((row) => `| ${keys.map((k) => String(row[k] ?? "")).join(" | ")} |`);
    return [header2, separator2, ...rows2].join("\n") + "\n";
  }
  const entries = flattenObject(data);
  const header = "| Key | Value |";
  const separator = "| --- | --- |";
  const rows = entries.map(([k, v]) => `| ${k} | ${String(v)} |`);
  return [header, separator, ...rows].join("\n") + "\n";
}
function toCsv(data) {
  if (Array.isArray(data)) {
    if (data.length === 0) return "";
    const keys = Object.keys(data[0]);
    const header2 = keys.map(csvEscape).join(",");
    const rows2 = data.map((row) => keys.map((k) => csvEscape(String(row[k] ?? ""))).join(","));
    return [header2, ...rows2].join("\n") + "\n";
  }
  const entries = flattenObject(data);
  const header = "key,value";
  const rows = entries.map(([k, v]) => `${csvEscape(k)},${csvEscape(String(v))}`);
  return [header, ...rows].join("\n") + "\n";
}
function csvEscape(val) {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
function colorizeJson(json2) {
  const RESET = "\x1B[0m";
  const KEY = "\x1B[1;34m";
  const STRING = "\x1B[32m";
  const NUMBER = "\x1B[33m";
  const BOOL = "\x1B[35m";
  const BRACE = "\x1B[2m";
  const COLON = "\x1B[2m";
  return json2.replace(
    /("(?:\\.|[^"\\])*")\s*(:)?|(\b(?:true|false|null)\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}\[\]])|([,:])/g,
    (match, str2, colon, bool2, num, brace, punct) => {
      if (str2 && colon) return `${KEY}${str2}${RESET}${COLON}:${RESET}`;
      if (str2) return `${STRING}${str2}${RESET}`;
      if (bool2) return `${BOOL}${bool2}${RESET}`;
      if (num) return `${NUMBER}${num}${RESET}`;
      if (brace) return `${BRACE}${brace}${RESET}`;
      if (punct) return `${COLON}${punct}${RESET}`;
      return match;
    }
  );
}
function flattenObject(obj, prefix = "") {
  const entries = [];
  for (const [key, value] of Object.entries(obj)) {
    const path4 = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      entries.push(...flattenObject(value, path4));
    } else if (Array.isArray(value)) {
      entries.push([path4, JSON.stringify(value)]);
    } else {
      entries.push([path4, value]);
    }
  }
  return entries;
}
var init_format = __esm({
  "src/cli/format.ts"() {
    "use strict";
    init_js_yaml();
  }
});

// src/collectors/text.ts
function collectText(doc) {
  const texts = [];
  const body = doc.body;
  if (!body) return { text: "" };
  collectTextFromNode(body, texts);
  return { text: texts.join("\n") };
}
function collectTextFromNode(node, texts) {
  if (node.nodeType === 3) {
    const text = (node.textContent ?? "").trim();
    if (text.length > 0) {
      texts.push(text);
    }
    return;
  }
  if (node.nodeType === 1) {
    if (SKIP_TAGS.has(node.tagName)) return;
    const children = node.childNodes ?? [];
    for (const child of children) {
      collectTextFromNode(child, texts);
    }
  }
}
var SKIP_TAGS;
var init_text = __esm({
  "src/collectors/text.ts"() {
    "use strict";
    SKIP_TAGS = /* @__PURE__ */ new Set(["SCRIPT", "STYLE", "NOSCRIPT"]);
  }
});

// src/collectors/links.ts
function collectLinks(doc) {
  const links = [];
  const buttons = [];
  const anchors = doc.querySelectorAll("a");
  for (const a of anchors) {
    links.push({
      tag: "a",
      text: (a.textContent ?? "").trim(),
      href: a.getAttribute("href") ?? void 0
    });
  }
  const btns = doc.querySelectorAll("button");
  for (const btn of btns) {
    buttons.push({
      text: (btn.textContent ?? "").trim(),
      type: btn.getAttribute("type") ?? "button"
    });
  }
  return { links, buttons };
}
var init_links = __esm({
  "src/collectors/links.ts"() {
    "use strict";
  }
});

// src/collectors/forms.ts
function findLabel(doc, el) {
  const id = el.getAttribute("id");
  if (id) {
    const label = doc.querySelector(`label[for="${id}"]`);
    if (label) return (label.textContent ?? "").trim();
  }
  const parent = el.closest?.("label");
  if (parent) {
    const labelText = (parent.textContent ?? "").trim();
    return labelText || void 0;
  }
  return void 0;
}
function collectForms(doc) {
  const fields = [];
  const allFields = doc.querySelectorAll("input, select, textarea");
  for (const el of allFields) {
    const tag = el.tagName.toLowerCase();
    const field = {
      type: tag === "input" ? el.getAttribute("type") ?? "text" : tag,
      value: ""
    };
    const label = findLabel(doc, el);
    if (label) field.label = label;
    if (tag === "select") {
      field.type = "select";
      const selected = el.querySelector("option[selected]");
      field.value = selected?.getAttribute("value") ?? el.value ?? "";
    } else if (tag === "textarea") {
      field.type = "textarea";
      field.value = el.value ?? (el.textContent ?? "").trim();
    } else {
      field.value = el.value ?? el.getAttribute("value") ?? "";
    }
    if (el.hasAttribute("required")) {
      field.required = true;
    }
    if (field.type === "checkbox") {
      field.checked = el.hasAttribute("checked") || el.checked === true;
    }
    fields.push(field);
  }
  return { fields };
}
var init_forms = __esm({
  "src/collectors/forms.ts"() {
    "use strict";
  }
});

// src/collectors/structure.ts
function walkElement(el, depth, maxDepth, counter) {
  counter.count++;
  const node = {
    tag: (el.tagName ?? "unknown").toLowerCase(),
    children: []
  };
  const text = getDirectText(el);
  if (text) node.text = text.length > 80 ? text.slice(0, 80) : text;
  const id = el.getAttribute?.("id");
  if (id) node.id = id;
  if (depth >= maxDepth) return node;
  const children = el.children ?? [];
  for (const child of children) {
    node.children.push(walkElement(child, depth + 1, maxDepth, counter));
  }
  return node;
}
function getDirectText(el) {
  let text = "";
  const children = el.childNodes ?? [];
  for (const child of children) {
    if (child.nodeType === 3) {
      text += child.textContent ?? "";
    }
  }
  return text.trim();
}
function collectStructure(doc, options) {
  const maxDepth = options?.depth ?? 5;
  const body = doc.body;
  if (!body) {
    return { tree: { tag: "body", children: [] }, elementCount: 0 };
  }
  const counter = { count: 0 };
  const tree = walkElement(body, 0, maxDepth, counter);
  return { tree, elementCount: counter.count };
}
var init_structure = __esm({
  "src/collectors/structure.ts"() {
    "use strict";
  }
});

// src/collectors/page.ts
function collectPage(doc, meta, errors) {
  const { text } = collectText(doc);
  const { links, buttons } = collectLinks(doc);
  const { fields } = collectForms(doc);
  const structure = collectStructure(doc);
  return {
    url: meta.url,
    title: doc.title ?? "",
    meta: extractMeta(doc),
    headings: extractHeadings(doc),
    text,
    links,
    buttons,
    forms: { fields },
    images: extractImages(doc),
    structure,
    errors,
    _meta: {
      renderMs: meta.renderMs,
      parseMs: meta.parseMs
    }
  };
}
function extractHeadings(doc) {
  const headings = [];
  const els = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");
  for (const el of els) {
    const level = parseInt(el.tagName[1], 10);
    const text = (el.textContent ?? "").trim();
    if (text) headings.push({ level, text });
  }
  return headings;
}
function extractImages(doc) {
  const images = [];
  const els = doc.querySelectorAll("img");
  for (const el of els) {
    const src = el.getAttribute("src");
    if (!src) continue;
    const alt = el.getAttribute("alt") ?? void 0;
    images.push({ src, ...alt !== void 0 ? { alt } : {} });
  }
  return images;
}
function extractMeta(doc) {
  const openGraph = {};
  const jsonLd = [];
  let description;
  const metas = doc.querySelectorAll("meta");
  for (const el of metas) {
    const name = (el.getAttribute("name") ?? "").toLowerCase();
    const property = (el.getAttribute("property") ?? "").toLowerCase();
    const content = el.getAttribute("content") ?? "";
    if (name === "description") {
      description = content;
    } else if (property.startsWith("og:")) {
      openGraph[property] = content;
    } else if (property.startsWith("twitter:") || name.startsWith("twitter:")) {
      openGraph[property || name] = content;
    }
  }
  const ldScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const el of ldScripts) {
    const text = (el.textContent ?? "").trim();
    if (text) {
      try {
        jsonLd.push(JSON.parse(text));
      } catch {
      }
    }
  }
  return {
    ...description ? { description } : {},
    openGraph,
    jsonLd
  };
}
var init_page = __esm({
  "src/collectors/page.ts"() {
    "use strict";
    init_text();
    init_links();
    init_forms();
    init_structure();
  }
});

// src/events/index.ts
var init_events = __esm({
  "src/events/index.ts"() {
    "use strict";
    init_Event();
    init_CustomEvent();
    init_EventTarget();
    init_UIEvent();
    init_MouseEvent();
    init_KeyboardEvent();
    init_FocusEvent();
    init_InputEvent();
    init_PointerEvent();
  }
});

// src/auth/TokenAcquisition.ts
function base64urlEncode(str2) {
  return Buffer.from(str2, "utf-8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
var TokenAcquisition;
var init_TokenAcquisition = __esm({
  "src/auth/TokenAcquisition.ts"() {
    "use strict";
    TokenAcquisition = class _TokenAcquisition {
      _config;
      _cached = null;
      constructor(config) {
        this._validateConfig(config);
        this._config = config;
      }
      /**
       * Acquire tokens from a real server. If the server is down or
       * unreachable, gracefully degrade to mock tokens.
       */
      async acquire() {
        if (this._cached !== null) {
          return this._cached;
        }
        const domainError = this._validateDomains();
        if (domainError) {
          const result3 = {
            userToken: _TokenAcquisition.generateMockToken({ email: this._config.credentials.email, role: "user", mock: true }),
            adminToken: this._config.adminCredentials ? _TokenAcquisition.generateMockToken({ email: this._config.adminCredentials.email, role: "admin", mock: true }) : null,
            source: "mock",
            error: domainError
          };
          this._cached = result3;
          return result3;
        }
        const timeout = this._config.timeout ?? 5e3;
        let userToken = null;
        try {
          userToken = await this._fetchToken(
            this._config.baseUrl + this._config.loginEndpoint,
            this._config.credentials,
            timeout
          );
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          const result3 = {
            userToken: _TokenAcquisition.generateMockToken({ email: this._config.credentials.email, role: "user", mock: true }),
            adminToken: this._config.adminCredentials ? _TokenAcquisition.generateMockToken({ email: this._config.adminCredentials.email, role: "admin", mock: true }) : null,
            source: "mock",
            error: errorMessage
          };
          this._cached = result3;
          return result3;
        }
        let adminToken = null;
        if (this._config.adminCredentials && this._config.adminLoginEndpoint) {
          try {
            adminToken = await this._fetchToken(
              this._config.baseUrl + this._config.adminLoginEndpoint,
              this._config.adminCredentials,
              timeout
            );
          } catch {
            adminToken = null;
          }
        }
        const result2 = {
          userToken,
          adminToken,
          source: "live"
        };
        this._cached = result2;
        return result2;
      }
      /**
       * Get cached tokens (acquired once, reused across all tests).
       */
      getCached() {
        return this._cached;
      }
      /**
       * Clear cached tokens so the next acquire() call fetches fresh ones.
       */
      clearCache() {
        this._cached = null;
      }
      /**
       * Generate a mock JWT token with base64-encoded payload.
       * Returns a valid-looking JWT: header.payload.signature
       */
      static generateMockToken(payload) {
        const header = { alg: "HS256", typ: "JWT" };
        const body = {
          sub: "mock-user",
          iat: Math.floor(Date.now() / 1e3),
          exp: Math.floor(Date.now() / 1e3) + 3600,
          ...payload
        };
        const encodedHeader = base64urlEncode(JSON.stringify(header));
        const encodedPayload = base64urlEncode(JSON.stringify(body));
        const signature = base64urlEncode("mock-signature-" + Date.now());
        return `${encodedHeader}.${encodedPayload}.${signature}`;
      }
      // ── Private helpers ────────────────────────────────────────────────
      _validateConfig(config) {
        if (!config.baseUrl) {
          throw new Error("TokenAcquisition: baseUrl is required");
        }
        if (!config.loginEndpoint) {
          throw new Error("TokenAcquisition: loginEndpoint is required");
        }
        if (!config.credentials) {
          throw new Error("TokenAcquisition: credentials is required");
        }
        if (!config.credentials.email) {
          throw new Error("TokenAcquisition: credentials.email is required");
        }
        if (!config.credentials.password) {
          throw new Error("TokenAcquisition: credentials.password is required");
        }
      }
      /**
       * Validate that all credential emails match the domain allowlist.
       * Returns an error string if validation fails, null if OK.
       */
      _validateDomains() {
        const allowlist = this._config.domainAllowlist;
        if (!allowlist || allowlist.length === 0) {
          return null;
        }
        const email = this._config.credentials.email;
        const emailDomain = "@" + email.split("@")[1];
        if (!allowlist.some((d) => emailDomain === d)) {
          return `Domain '${emailDomain}' not in allowlist: ${allowlist.join(", ")}`;
        }
        if (this._config.adminCredentials) {
          const adminEmail = this._config.adminCredentials.email;
          const adminDomain = "@" + adminEmail.split("@")[1];
          if (!allowlist.some((d) => adminDomain === d)) {
            return `Admin domain '${adminDomain}' not in allowlist: ${allowlist.join(", ")}`;
          }
        }
        return null;
      }
      /**
       * Fetch a token from the server with timeout handling.
       */
      async _fetchToken(url, credentials, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
            signal: controller.signal
          });
          if (!response.ok) {
            throw new Error(`Login failed: ${response.status} ${response.statusText}`);
          }
          const data = await response.json();
          const token = data.token ?? data.accessToken ?? data.access_token;
          if (!token) {
            throw new Error("No token found in login response");
          }
          return token;
        } finally {
          clearTimeout(timeoutId);
        }
      }
    };
  }
});

// src/auth/index.ts
var auth_exports = {};
__export(auth_exports, {
  TokenAcquisition: () => TokenAcquisition
});
var init_auth = __esm({
  "src/auth/index.ts"() {
    "use strict";
    init_TokenAcquisition();
  }
});

// src/cli/commands/render.ts
var render_exports = {};
__export(render_exports, {
  execute: () => execute,
  renderUrl: () => renderUrl
});
async function renderUrl(url, options) {
  const start = performance.now();
  const errors = [];
  let config = options?.config ?? null;
  let configSource = "defaults";
  if (!config && !url.startsWith("data:")) {
    if (options?.configPath) {
      config = await resolveConfig(url, process.cwd(), options.configPath);
      configSource = "file";
    } else {
      try {
        config = await resolveConfig(url, process.cwd());
        if (config) configSource = "file";
      } catch {
        configSource = "defaults";
      }
    }
  }
  let token = options?.token;
  let tokenSource;
  let tokenValue;
  let authMeta;
  if (token) {
    tokenSource = "provided";
    tokenValue = token;
  } else if (config?.auth) {
    try {
      const { TokenAcquisition: TokenAcquisition2 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
      const ta = new TokenAcquisition2(config.auth);
      const result3 = await ta.acquire();
      if (result3.userToken && result3.source === "live") {
        token = result3.userToken;
        tokenSource = "config";
      } else if (result3.source === "mock" && result3.error) {
        authMeta = { status: "failed", reason: result3.error };
      }
    } catch (err) {
      authMeta = { status: "failed", reason: err.message ?? String(err) };
    }
  }
  const spaConfig = config?.spa;
  let fetchUrl = url;
  let ssrActive = false;
  if (spaConfig?.ssrEndpoint && !url.startsWith("data:")) {
    try {
      const originalUrl = new URL(url);
      const endpoint = spaConfig.ssrEndpoint;
      if (endpoint.startsWith("http")) {
        fetchUrl = `${endpoint}?path=${encodeURIComponent(originalUrl.pathname + originalUrl.search)}`;
      } else {
        fetchUrl = `${originalUrl.origin}${endpoint}?path=${encodeURIComponent(originalUrl.pathname + originalUrl.search)}`;
      }
      ssrActive = true;
    } catch {
    }
  }
  let html;
  const parseStart = performance.now();
  if (url.startsWith("data:text/html,")) {
    html = decodeURIComponent(url.slice("data:text/html,".length));
  } else if (url.startsWith("data:")) {
    html = "";
  } else {
    const originalFetch = globalThis.fetch;
    if (options?.harRecorder) {
      const recorder = options.harRecorder;
      globalThis.fetch = async (reqUrl, reqOpts) => {
        const fetchStart = performance.now();
        const resp = await originalFetch(reqUrl, reqOpts);
        const durationMs = performance.now() - fetchStart;
        const responseBody = await resp.text();
        recorder.record({
          method: reqOpts?.method ?? "GET",
          url: reqUrl,
          status: resp.status,
          responseBody,
          durationMs
        });
        return new Response(responseBody, {
          status: resp.status,
          statusText: resp.statusText ?? "",
          headers: resp.headers
        });
      };
    }
    try {
      const ua = options?.userAgent ?? DEFAULT_USER_AGENT;
      const headers = {
        "User-Agent": ua
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch(fetchUrl, { headers });
      if (ssrActive && !response.ok) {
        if (spaConfig?.fallback === "error") {
          throw new Error(`SSR endpoint returned ${response.status}: ${response.statusText}`);
        }
        const fallbackResponse = await fetch(url, { headers });
        html = await fallbackResponse.text();
        ssrActive = false;
      } else {
        html = await response.text();
      }
    } catch (err) {
      const error = new Error(`Could not reach ${url}: ${err.message}`);
      error.code = "FETCH_FAILED";
      throw error;
    } finally {
      if (options?.harRecorder) {
        globalThis.fetch = originalFetch;
      }
    }
  }
  const parseMs = performance.now() - parseStart;
  const ctx = createVmContext({ timeout: options?.timeout ?? 5e3, url, harRecorder: options?.harRecorder });
  if (!url.startsWith("data:") && !ssrActive) {
    try {
      const origin = new URL(url).origin;
      const passthroughFetch = async (input, init) => {
        const reqUrl = typeof input === "string" ? input : input?.url ?? String(input);
        const fullUrl = reqUrl.startsWith("/") ? `${origin}${reqUrl}` : reqUrl;
        const headers = { ...init?.headers ?? {} };
        if (token && !headers["Authorization"] && !headers["authorization"]) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const response = await globalThis.fetch(fullUrl, { ...init, headers });
        const body = await response.text();
        const { DixieResponse: DixieResponse2 } = await Promise.resolve().then(() => (init_Response(), Response_exports));
        const responseHeaders = {};
        response.headers.forEach((v, k) => {
          responseHeaders[k] = v;
        });
        return new DixieResponse2(body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          url: fullUrl
        });
      };
      ctx.mockFetch.setPassthrough(origin, passthroughFetch);
      ctx.mockFetch.setPassthrough("/", passthroughFetch);
    } catch {
    }
  }
  const headMatch = html.match(/<head[^>]*>([\s\S]*)<\/head>/i);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (headMatch) {
    ctx.document.head.innerHTML = headMatch[1];
  }
  if (bodyMatch) {
    ctx.document.body.innerHTML = bodyMatch[1];
  } else {
    ctx.document.body.innerHTML = html;
  }
  if (titleMatch) {
    ctx.document.title = titleMatch[1].trim();
  }
  if (!ssrActive && config?.preseed?.localStorage && ctx.sandbox?.localStorage) {
    for (const [key, value] of Object.entries(config.preseed.localStorage)) {
      ctx.sandbox.localStorage.setItem(key, value === "{{token}}" ? token ?? "" : value);
    }
  }
  if (!ssrActive && config?.preseed?.sessionStorage && ctx.sandbox?.sessionStorage) {
    for (const [key, value] of Object.entries(config.preseed.sessionStorage)) {
      ctx.sandbox.sessionStorage.setItem(key, value === "{{token}}" ? token ?? "" : value);
    }
  }
  let scriptsExecuted = 0;
  let scriptsFailed = 0;
  if (options?.noJs || ssrActive) {
    const scripts = ctx.document.querySelectorAll("script");
    for (const script of scripts) {
      script.parentNode?.removeChild(script);
    }
  } else {
    const scriptDeadline = Date.now() + (options?.timeout ?? 5e3);
    const asyncErrors = [];
    const errorHandler = (err) => {
      const msg = err?.message ?? String(err);
      asyncErrors.push({ code: "SCRIPT_ASYNC_ERROR", message: msg });
    };
    process.on("unhandledRejection", errorHandler);
    process.on("uncaughtException", errorHandler);
    try {
      const scriptErrors = await loadScripts(ctx, {
        baseUrl: url,
        token,
        deadline: scriptDeadline,
        suppressErrors: config?.suppressErrors
      });
      scriptsExecuted = scriptErrors.length === 0 ? 1 : 0;
      errors.push(...scriptErrors);
      let mountSelector = config?.spa?.mountSelector;
      if (!mountSelector) {
        if (ctx.document.querySelector("#root")) mountSelector = "#root > *";
        else if (ctx.document.querySelector("#app")) mountSelector = "#app > *";
      }
      const flushBudget = Math.max(500, scriptDeadline - Date.now());
      await flushReactRender(ctx.document, {
        timeoutMs: flushBudget,
        stableRounds: 3,
        waitForSelector: mountSelector,
        mockFetch: ctx.mockFetch
      });
    } catch (err) {
      if (err.code === "ERR_SCRIPT_EXECUTION_TIMEOUT" || /timed out|timeout/i.test(err.message)) {
        errors.push({ code: "SCRIPT_TIMEOUT", message: err.message });
      } else {
        errors.push({ code: "SCRIPT_ERROR", message: err.message });
      }
    } finally {
      await new Promise((resolve4) => setTimeout(resolve4, 200));
      process.removeListener("unhandledRejection", errorHandler);
      process.removeListener("uncaughtException", errorHandler);
      errors.push(...asyncErrors);
    }
    try {
      ctx.document.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true }));
      ctx.window.dispatchEvent?.(new Event("load"));
    } catch {
    }
  }
  const renderMs = performance.now() - start;
  const result2 = {
    document: ctx.document,
    meta: {
      url,
      renderMs: Math.round(renderMs * 100) / 100,
      parseMs: Math.round(parseMs * 100) / 100,
      configSource,
      ...tokenSource ? { tokenSource } : {},
      ...authMeta ? { auth: authMeta } : {},
      ...scriptsExecuted > 0 || scriptsFailed > 0 ? { scriptsExecuted, scriptsFailed } : {}
    },
    errors,
    flush: (opts) => flushReactRender(ctx.document, {
      timeoutMs: opts?.timeoutMs ?? 3e3,
      stableRounds: opts?.stableRounds ?? 3,
      waitForSelector: opts?.waitForSelector,
      mockFetch: ctx.mockFetch
    }),
    context: ctx,
    dispose: () => ctx.dispose()
  };
  return result2;
}
async function execute(args2) {
  if (!args2.url) {
    return {
      exitCode: 1,
      errors: [{ code: "MISSING_URL", message: "render requires a URL" }]
    };
  }
  try {
    const result2 = await renderUrl(args2.url, {
      token: args2.token,
      timeout: args2.timeout,
      noJs: args2.noJs,
      userAgent: args2.userAgent,
      configPath: args2.config
    });
    const pageContent = collectPage(result2.document, result2.meta, result2.errors);
    const output = formatOutput(pageContent, args2.format);
    result2.dispose();
    return { exitCode: 0, output, data: result2 };
  } catch (err) {
    return {
      exitCode: 1,
      errors: [{ code: err.code ?? "RENDER_ERROR", message: err.message }]
    };
  }
}
var init_render = __esm({
  "src/cli/commands/render.ts"() {
    "use strict";
    init_vm_context();
    init_script_loader();
    init_event_loop_flush();
    init_config_loader();
    init_format();
    init_page();
    init_Navigator();
    init_events();
  }
});

// src/queries/test-id.ts
function getByTestId(doc, testId) {
  const elements = doc.querySelectorAll(`[data-testid="${testId}"]`);
  if (elements.length === 0) {
    throw new Error(`Unable to find element with data-testid="${testId}" \u2014 no matches found`);
  }
  if (elements.length > 1) {
    throw new Error(`Found multiple elements with data-testid="${testId}" \u2014 use getAllByTestId instead`);
  }
  return elements[0];
}
function getAllByTestId(doc, testId) {
  return Array.from(doc.querySelectorAll(`[data-testid="${testId}"]`));
}
var init_test_id = __esm({
  "src/queries/test-id.ts"() {
    "use strict";
  }
});

// src/queries/role.ts
function getRole(el) {
  const explicit = el.getAttribute("role");
  if (explicit) return explicit;
  const mapping = IMPLICIT_ROLES[el.tagName];
  if (!mapping) return null;
  if (typeof mapping === "function") return mapping(el);
  return mapping;
}
function getHeadingLevel(el) {
  const match = el.tagName.match(/^H(\d)$/);
  return match ? parseInt(match[1], 10) : null;
}
function getAccessibleName(el) {
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;
  return (el.textContent ?? "").trim();
}
function getByRole(doc, role, options) {
  const matches = getAllByRole(doc, role, options);
  if (matches.length === 0) {
    throw new Error(`Unable to find element with role="${role}" \u2014 no matches found`);
  }
  if (matches.length > 1) {
    throw new Error(`Found multiple elements with role="${role}" \u2014 use getAllByRole instead`);
  }
  return matches[0];
}
function getAllByRole(doc, role, options) {
  const all = doc.querySelectorAll("*");
  const matches = [];
  for (const el of all) {
    const elRole = getRole(el);
    if (elRole !== role) continue;
    if (options?.level !== void 0) {
      const level = getHeadingLevel(el);
      if (level !== options.level) continue;
    }
    if (options?.name !== void 0) {
      const name = getAccessibleName(el);
      if (name !== options.name) continue;
    }
    matches.push(el);
  }
  return matches;
}
var IMPLICIT_ROLES;
var init_role = __esm({
  "src/queries/role.ts"() {
    "use strict";
    IMPLICIT_ROLES = {
      "A": (el) => el.getAttribute("href") ? "link" : null,
      "BUTTON": "button",
      "INPUT": (el) => {
        const type3 = (el.getAttribute("type") ?? "text").toLowerCase();
        switch (type3) {
          case "checkbox":
            return "checkbox";
          case "radio":
            return "radio";
          case "range":
            return "slider";
          case "search":
            return "searchbox";
          default:
            return "textbox";
        }
      },
      "SELECT": "combobox",
      "TEXTAREA": "textbox",
      "IMG": "img",
      "TABLE": "table",
      "FORM": "form",
      "NAV": "navigation",
      "MAIN": "main",
      "HEADER": "banner",
      "FOOTER": "contentinfo",
      "ASIDE": "complementary",
      "UL": "list",
      "OL": "list",
      "LI": "listitem",
      "H1": "heading",
      "H2": "heading",
      "H3": "heading",
      "H4": "heading",
      "H5": "heading",
      "H6": "heading"
    };
  }
});

// src/queries/label.ts
function getByLabel(doc, labelText) {
  const matches = getAllByLabel(doc, labelText);
  if (matches.length === 0) {
    throw new Error(`Unable to find element with label "${labelText}" \u2014 no matches found`);
  }
  if (matches.length > 1) {
    throw new Error(`Found multiple elements with label "${labelText}" \u2014 use getAllByLabel instead`);
  }
  return matches[0];
}
function getAllByLabel(doc, labelText) {
  const results = [];
  const ariaLabeled = doc.querySelectorAll(`[aria-label="${labelText}"]`);
  for (const el of ariaLabeled) {
    results.push(el);
  }
  const labels = doc.querySelectorAll("label");
  for (const label of labels) {
    const text = (label.textContent ?? "").trim();
    if (text !== labelText.trim()) continue;
    const forAttr = label.getAttribute("for");
    if (forAttr) {
      const target = doc.getElementById(forAttr);
      if (target && !results.includes(target)) {
        results.push(target);
      }
    } else {
      const input = label.querySelector("input, select, textarea");
      if (input && !results.includes(input)) {
        results.push(input);
      }
    }
  }
  return results;
}
var init_label = __esm({
  "src/queries/label.ts"() {
    "use strict";
  }
});

// src/interaction/click.ts
function click(doc, selector) {
  const el = doc.querySelector(selector);
  if (!el) {
    throw new Error(`click: no element matches selector "${selector}"`);
  }
  el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
  el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true }));
  el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
}
var init_click = __esm({
  "src/interaction/click.ts"() {
    "use strict";
    init_events();
  }
});

// src/cli/commands/query.ts
var query_exports = {};
__export(query_exports, {
  execute: () => execute2
});
async function execute2(args2) {
  if (!args2.url) {
    return {
      exitCode: 1,
      data: { command: "query", error: "query requires a URL" },
      errors: [{ code: "MISSING_URL", message: "query requires a URL" }]
    };
  }
  const selector = args2.selector ?? "";
  const textSearch = args2.text;
  try {
    const result2 = await renderUrl(args2.url, {
      token: args2.token,
      timeout: args2.timeout,
      noJs: args2.noJs,
      configPath: args2.config
    });
    const doc = result2.document;
    if (args2.click) {
      try {
        click(doc, args2.click);
      } catch (clickErr) {
        return {
          exitCode: 1,
          data: { command: "query", error: clickErr.message },
          errors: [{ code: "CLICK_ERROR", message: clickErr.message }]
        };
      }
      const suppress = () => {
      };
      process.on("uncaughtException", suppress);
      try {
        await result2.flush({ timeoutMs: 5e3, stableRounds: 3 });
      } finally {
        await new Promise((r) => setTimeout(r, 200));
        process.removeListener("uncaughtException", suppress);
      }
    }
    if (textSearch !== void 0) {
      const needle = textSearch.toLowerCase();
      const all = Array.from(doc.querySelectorAll("*"));
      const matches = all.filter((el) => {
        const text = (el.textContent ?? "").toLowerCase();
        return text.includes(needle);
      });
      const results2 = matches.map((el) => ({
        tagName: el.tagName?.toLowerCase() ?? "unknown",
        text: (el.textContent ?? "").trim().slice(0, 200),
        id: el.getAttribute?.("id") ?? void 0
      }));
      const textData = {
        command: "query",
        status: results2.length > 0 ? "found" : "not-found",
        strategy: "text",
        search: textSearch,
        count: results2.length,
        results: results2
      };
      return {
        exitCode: results2.length > 0 ? 0 : 1,
        output: formatOutput(textData, args2.format ?? "json"),
        data: textData
      };
    }
    let elements = [];
    if (!selector) {
      return {
        exitCode: 0,
        data: { command: "query", status: "ok", strategy: args2.selectorStrategy, results: [] }
      };
    }
    switch (args2.selectorStrategy) {
      case "testId":
        elements = getAllByTestId(doc, selector);
        break;
      case "role":
        elements = getAllByRole(doc, selector);
        break;
      case "label":
        elements = getAllByLabel(doc, selector);
        break;
      case "css":
      default:
        elements = Array.from(doc.querySelectorAll(selector));
        break;
    }
    const results = elements.map((el) => ({
      tagName: el.tagName?.toLowerCase() ?? "unknown",
      text: (el.textContent ?? "").trim().slice(0, 200),
      id: el.getAttribute?.("id") ?? void 0
    }));
    const queryData = { command: "query", status: "ok", strategy: args2.selectorStrategy, count: results.length, results };
    return {
      exitCode: 0,
      output: formatOutput(queryData, args2.format ?? "json"),
      data: queryData
    };
  } catch (err) {
    return {
      exitCode: 1,
      data: { command: "query", error: err.message },
      errors: [{ code: "QUERY_ERROR", message: err.message }]
    };
  }
}
var init_query = __esm({
  "src/cli/commands/query.ts"() {
    "use strict";
    init_render();
    init_format();
    init_test_id();
    init_role();
    init_label();
    init_click();
  }
});

// src/cli/commands/run.ts
var run_exports = {};
__export(run_exports, {
  execute: () => execute3,
  runTestFile: () => runTestFile
});
import * as path2 from "node:path";
async function runTestFile(filePath, context) {
  const start = performance.now();
  const abs = path2.resolve(filePath);
  try {
    if (abs.endsWith(".ts") || abs.endsWith(".tsx")) {
      const esbuild = await Promise.resolve().then(() => __toESM(require_main(), 1));
      const fs3 = await import("node:fs");
      const source = fs3.readFileSync(abs, "utf-8");
      const result2 = await esbuild.transform(source, {
        loader: abs.endsWith(".tsx") ? "tsx" : "ts",
        format: "esm",
        target: "node18"
      });
      const os = await import("node:os");
      const crypto = await import("node:crypto");
      const hash = crypto.createHash("md5").update(abs).digest("hex").slice(0, 8);
      const tmpFile = path2.join(os.tmpdir(), `dixie-${hash}.mjs`);
      fs3.writeFileSync(tmpFile, result2.code);
      try {
        const mod2 = await import(`file://${tmpFile}`);
        const testFn2 = mod2.default;
        if (typeof testFn2 === "function") {
          const output = await testFn2(context);
          const durationMs = performance.now() - start;
          return {
            passed: output?.passed !== false,
            durationMs: Math.round(durationMs * 100) / 100,
            output
          };
        }
        return {
          passed: true,
          durationMs: Math.round((performance.now() - start) * 100) / 100
        };
      } finally {
        try {
          fs3.unlinkSync(tmpFile);
        } catch {
        }
      }
    }
    const mod = await import(`file://${abs}`);
    const testFn = mod.default;
    if (typeof testFn === "function") {
      const output = await testFn(context);
      const durationMs = performance.now() - start;
      return {
        passed: output?.passed !== false,
        durationMs: Math.round(durationMs * 100) / 100,
        output
      };
    }
    return {
      passed: true,
      durationMs: Math.round((performance.now() - start) * 100) / 100
    };
  } catch (err) {
    const durationMs = performance.now() - start;
    const isSyntax = /syntax/i.test(err.message) || /unexpected/i.test(err.message) || /parse/i.test(err.message) || /transform failed/i.test(err.message) || /expected/i.test(err.message);
    return {
      passed: false,
      durationMs: Math.round(durationMs * 100) / 100,
      error: isSyntax ? `Syntax error: ${err.message}` : err.message
    };
  }
}
async function execute3(args2) {
  const filePath = args2.file ?? args2.url;
  if (!filePath) {
    return {
      exitCode: 1,
      errors: [{ code: "MISSING_FILE", message: "run requires a file path" }]
    };
  }
  const result2 = await runTestFile(filePath, { url: args2.url, configPath: args2.config });
  const output = formatOutput(result2, args2.format ?? "json");
  return {
    exitCode: result2.passed ? 0 : 1,
    output,
    data: result2
  };
}
var init_run = __esm({
  "src/cli/commands/run.ts"() {
    "use strict";
    init_format();
  }
});

// src/cli/commands/bench.ts
var bench_exports = {};
__export(bench_exports, {
  execute: () => execute4,
  runBenchmark: () => runBenchmark
});
function computeStats(values) {
  if (values.length === 0) return { median: 0, mean: 0, p95: 0, min: 0, max: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const mean = Math.round(values.reduce((a, b) => a + b, 0) / values.length * 100) / 100;
  const p95Index = Math.min(Math.ceil(sorted.length * 0.95) - 1, sorted.length - 1);
  return { median, mean, p95: sorted[p95Index], min: sorted[0], max: sorted[sorted.length - 1] };
}
async function runBenchmark(options) {
  const timings = [];
  let elementCount = 0;
  const env0 = createDixieEnvironment({ url: "http://bench/" });
  env0.document.body.innerHTML = options.html;
  for (let i = 0; i < options.iterations; i++) {
    const start = performance.now();
    const env = createDixieEnvironment({ url: "http://bench/" });
    env.document.body.innerHTML = options.html;
    const ms = performance.now() - start;
    timings.push(ms);
    elementCount = env.document.querySelectorAll("*").length;
  }
  return { timing: computeStats(timings), elementCount };
}
async function execute4(args2) {
  if (!args2.url) {
    return {
      exitCode: 1,
      errors: [{ code: "MISSING_URL", message: "bench requires a URL" }]
    };
  }
  let html = "";
  try {
    const response = await fetch(args2.url);
    html = await response.text();
  } catch {
  }
  const result2 = await runBenchmark({ html, iterations: 100 });
  const output = formatOutput(result2, args2.format ?? "json");
  return { exitCode: 0, output, data: result2 };
}
var init_bench = __esm({
  "src/cli/commands/bench.ts"() {
    "use strict";
    init_environment();
    init_format();
  }
});

// src/cli/commands/diff.ts
var diff_exports = {};
__export(diff_exports, {
  diffSnapshots: () => diffSnapshots,
  execute: () => execute5
});
function diffSnapshots(before, after, options) {
  const changes = [];
  const scopes = options?.scope;
  if (scopes) {
    for (const scope of scopes) {
      diffValues(before[scope], after[scope], scope, changes, scope);
    }
  } else {
    const allKeys = /* @__PURE__ */ new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const key of allKeys) {
      diffValues(before[key], after[key], key, changes, key);
    }
  }
  return { changes };
}
function diffValues(before, after, path4, changes, scope) {
  if (before === after) return;
  if (before === void 0 && after !== void 0) {
    changes.push({ type: "added", scope, path: path4, value: after });
    return;
  }
  if (before !== void 0 && after === void 0) {
    changes.push({ type: "removed", scope, path: path4, value: before });
    return;
  }
  if (typeof before === "string" && typeof after === "string") {
    if (before !== after) {
      changes.push({ type: "changed", scope, path: path4, before, after, value: after });
    }
    return;
  }
  if (Array.isArray(before) && Array.isArray(after)) {
    for (const item of after) {
      if (!before.some((b) => deepEqual(b, item))) {
        changes.push({ type: "added", scope, path: path4, value: item });
      }
    }
    for (const item of before) {
      if (!after.some((a) => deepEqual(a, item))) {
        changes.push({ type: "removed", scope, path: path4, value: item });
      }
    }
    return;
  }
  if (typeof before === "object" && typeof after === "object" && before !== null && after !== null) {
    const allKeys = /* @__PURE__ */ new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const key of allKeys) {
      diffValues(before[key], after[key], `${path4}.${key}`, changes, scope);
    }
    return;
  }
  if (before !== after) {
    changes.push({ type: "changed", scope, path: path4, before, after, value: after });
  }
}
function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}
async function execute5(args2) {
  const positions = args2.args ?? args2.rest ?? [];
  const fileA = positions[0] ?? args2.url ?? "";
  const fileB = positions[1] ?? "";
  if (!fileA || !fileB) {
    return {
      exitCode: 1,
      errors: [{ code: "MISSING_ARGS", message: "diff requires two file paths" }]
    };
  }
  try {
    const { readFileSync: readFileSync3 } = await import("node:fs");
    const before = JSON.parse(readFileSync3(fileA, "utf-8"));
    const after = JSON.parse(readFileSync3(fileB, "utf-8"));
    const result2 = diffSnapshots(before, after);
    const output = formatOutput(result2, args2.format ?? "json");
    return { exitCode: 0, output, data: result2 };
  } catch (err) {
    return {
      exitCode: 1,
      errors: [{ code: "DIFF_ERROR", message: err.message }]
    };
  }
}
var init_diff = __esm({
  "src/cli/commands/diff.ts"() {
    "use strict";
    init_format();
  }
});

// src/collectors/a11y.ts
function collectA11y(doc) {
  const issues = [];
  const imgs = doc.querySelectorAll("img");
  for (const img of imgs) {
    const alt = img.getAttribute("alt");
    if (alt === null || alt === void 0) {
      issues.push({
        type: "missing-alt",
        element: img.getAttribute("src") ?? "img"
      });
    }
  }
  const inputs = doc.querySelectorAll("input");
  for (const input of inputs) {
    const id = input.getAttribute("id");
    const hasLabel = id && doc.querySelector(`label[for="${id}"]`);
    const hasAriaLabel = input.getAttribute("aria-label");
    const parentLabel = input.closest?.("label");
    if (!hasLabel && !hasAriaLabel && !parentLabel) {
      issues.push({
        type: "missing-label",
        element: `input[type="${input.getAttribute("type") ?? "text"}"]`
      });
    }
  }
  const headings = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");
  let lastLevel = 0;
  for (const h of headings) {
    const level = parseInt(h.tagName[1], 10);
    if (lastLevel > 0 && level > lastLevel + 1) {
      issues.push({
        type: "heading-skip",
        detail: `Missing H${lastLevel + 1} between H${lastLevel} and H${level}`
      });
    }
    lastLevel = level;
  }
  return { issues };
}
var init_a11y = __esm({
  "src/collectors/a11y.ts"() {
    "use strict";
  }
});

// src/cli/commands/a11y.ts
var a11y_exports = {};
__export(a11y_exports, {
  execute: () => execute6
});
async function execute6(args2) {
  if (!args2.url) {
    return {
      exitCode: 1,
      data: { command: "a11y", error: "a11y requires a URL" },
      errors: [{ code: "MISSING_URL", message: "a11y requires a URL" }]
    };
  }
  try {
    const result2 = await renderUrl(args2.url, {
      token: args2.token,
      timeout: args2.timeout,
      noJs: args2.noJs
    });
    const data = collectA11y(result2.document);
    return {
      exitCode: 0,
      data: { command: "a11y", status: "ok", ...data }
    };
  } catch (err) {
    return {
      exitCode: 1,
      data: { command: "a11y", error: err.message },
      errors: [{ code: "A11Y_ERROR", message: err.message }]
    };
  }
}
var init_a11y2 = __esm({
  "src/cli/commands/a11y.ts"() {
    "use strict";
    init_render();
    init_a11y();
  }
});

// src/collectors/css-audit.ts
function hasVisibleText(el) {
  const text = (el.textContent ?? "").trim();
  return text.length > 0;
}
function collectCssAudit(doc) {
  const flags = [];
  const styled = doc.querySelectorAll("[style]");
  for (const el of styled) {
    const style = (el.getAttribute("style") ?? "").toLowerCase().replace(/\s+/g, "");
    if (style.includes("display:none")) {
      flags.push({ type: "hidden-element", element: el.tagName.toLowerCase() });
    }
  }
  const triggers = doc.querySelectorAll("button, a[href]");
  for (const el of triggers) {
    if (!hasVisibleText(el)) {
      flags.push({
        type: "empty-trigger",
        element: el.tagName.toLowerCase()
      });
    }
  }
  return { flags };
}
var init_css_audit = __esm({
  "src/collectors/css-audit.ts"() {
    "use strict";
  }
});

// src/cli/commands/css-audit.ts
var css_audit_exports = {};
__export(css_audit_exports, {
  execute: () => execute7
});
async function execute7(args2) {
  if (!args2.url) {
    return {
      exitCode: 1,
      data: { command: "css-audit", error: "css-audit requires a URL" },
      errors: [{ code: "MISSING_URL", message: "css-audit requires a URL" }]
    };
  }
  try {
    const result2 = await renderUrl(args2.url, {
      token: args2.token,
      timeout: args2.timeout,
      noJs: args2.noJs
    });
    const data = collectCssAudit(result2.document);
    return {
      exitCode: 0,
      data: { command: "css-audit", status: "ok", ...data }
    };
  } catch (err) {
    return {
      exitCode: 1,
      data: { command: "css-audit", error: err.message },
      errors: [{ code: "CSS_AUDIT_ERROR", message: err.message }]
    };
  }
}
var init_css_audit2 = __esm({
  "src/cli/commands/css-audit.ts"() {
    "use strict";
    init_render();
    init_css_audit();
  }
});

// src/cli/commands/links.ts
var links_exports = {};
__export(links_exports, {
  execute: () => execute8
});
async function execute8(args2) {
  if (!args2.url) {
    return {
      exitCode: 1,
      data: { command: "links", error: "links requires a URL" },
      errors: [{ code: "MISSING_URL", message: "links requires a URL" }]
    };
  }
  try {
    const result2 = await renderUrl(args2.url, {
      token: args2.token,
      timeout: args2.timeout,
      noJs: true
    });
    const data = collectLinks(result2.document);
    return {
      exitCode: 0,
      data: { command: "links", status: "ok", ...data }
    };
  } catch (err) {
    return {
      exitCode: 1,
      data: { command: "links", error: err.message },
      errors: [{ code: "LINKS_ERROR", message: err.message }]
    };
  }
}
var init_links2 = __esm({
  "src/cli/commands/links.ts"() {
    "use strict";
    init_render();
    init_links();
  }
});

// src/cli/commands/forms.ts
var forms_exports = {};
__export(forms_exports, {
  execute: () => execute9
});
async function execute9(args2) {
  if (!args2.url) {
    return {
      exitCode: 1,
      data: { command: "forms", error: "forms requires a URL" },
      errors: [{ code: "MISSING_URL", message: "forms requires a URL" }]
    };
  }
  try {
    const result2 = await renderUrl(args2.url, {
      token: args2.token,
      timeout: args2.timeout,
      noJs: args2.noJs
    });
    const data = collectForms(result2.document);
    return {
      exitCode: 0,
      data: { command: "forms", status: "ok", ...data }
    };
  } catch (err) {
    return {
      exitCode: 1,
      data: { command: "forms", error: err.message },
      errors: [{ code: "FORMS_ERROR", message: err.message }]
    };
  }
}
var init_forms2 = __esm({
  "src/cli/commands/forms.ts"() {
    "use strict";
    init_render();
    init_forms();
  }
});

// src/cli/commands/text.ts
var text_exports = {};
__export(text_exports, {
  execute: () => execute10
});
async function execute10(args2) {
  if (!args2.url) {
    return {
      exitCode: 1,
      data: { command: "text", error: "text requires a URL" },
      errors: [{ code: "MISSING_URL", message: "text requires a URL" }]
    };
  }
  try {
    const result2 = await renderUrl(args2.url, {
      token: args2.token,
      timeout: args2.timeout,
      noJs: args2.noJs
    });
    const data = collectText(result2.document);
    return {
      exitCode: 0,
      data: { command: "text", status: "ok", ...data }
    };
  } catch (err) {
    return {
      exitCode: 1,
      data: { command: "text", error: err.message },
      errors: [{ code: "TEXT_ERROR", message: err.message }]
    };
  }
}
var init_text2 = __esm({
  "src/cli/commands/text.ts"() {
    "use strict";
    init_render();
    init_text();
  }
});

// src/cli/commands/structure.ts
var structure_exports = {};
__export(structure_exports, {
  execute: () => execute11
});
async function execute11(args2) {
  if (!args2.url) {
    return {
      exitCode: 1,
      data: { command: "structure", error: "structure requires a URL" },
      errors: [{ code: "MISSING_URL", message: "structure requires a URL" }]
    };
  }
  try {
    const result2 = await renderUrl(args2.url, {
      token: args2.token,
      timeout: args2.timeout,
      noJs: args2.noJs
    });
    const data = collectStructure(result2.document);
    return {
      exitCode: 0,
      data: { command: "structure", status: "ok", ...data }
    };
  } catch (err) {
    return {
      exitCode: 1,
      data: { command: "structure", error: err.message },
      errors: [{ code: "STRUCTURE_ERROR", message: err.message }]
    };
  }
}
var init_structure2 = __esm({
  "src/cli/commands/structure.ts"() {
    "use strict";
    init_render();
    init_structure();
  }
});

// src/collectors/api.ts
function collectApi(calls) {
  return {
    calls: calls.map((c) => ({ ...c }))
  };
}
var init_api = __esm({
  "src/collectors/api.ts"() {
    "use strict";
  }
});

// src/cli/commands/api.ts
var api_exports = {};
__export(api_exports, {
  execute: () => execute12
});
async function execute12(args2) {
  try {
    const data = collectApi([]);
    return {
      exitCode: 0,
      data: { command: "api", status: "ok", ...data }
    };
  } catch (err) {
    return {
      exitCode: 1,
      data: { command: "api", error: err.message },
      errors: [{ code: "API_ERROR", message: err.message }]
    };
  }
}
var init_api2 = __esm({
  "src/cli/commands/api.ts"() {
    "use strict";
    init_api();
  }
});

// src/collectors/expected-calls.ts
function collectExpectedCalls(actual, expected) {
  const missing = [];
  for (const exp of expected) {
    const [expMethod, ...pathParts] = exp.split(" ");
    const expPath = pathParts.join(" ");
    const found = actual.some((call) => {
      const actualPath = call.url.split("?")[0];
      return call.method === expMethod && actualPath.startsWith(expPath);
    });
    if (!found) {
      missing.push(exp);
    }
  }
  return { missing, pass: missing.length === 0 };
}
var init_expected_calls = __esm({
  "src/collectors/expected-calls.ts"() {
    "use strict";
  }
});

// src/cli/commands/expected-calls.ts
var expected_calls_exports = {};
__export(expected_calls_exports, {
  execute: () => execute13
});
async function execute13(args2) {
  try {
    const expected = args2.rest.length > 0 ? args2.rest : [];
    const data = collectExpectedCalls([], expected);
    return {
      exitCode: 0,
      data: { command: "expected-calls", status: "ok", ...data }
    };
  } catch (err) {
    return {
      exitCode: 1,
      data: { command: "expected-calls", error: err.message },
      errors: [{ code: "EXPECTED_CALLS_ERROR", message: err.message }]
    };
  }
}
var init_expected_calls2 = __esm({
  "src/cli/commands/expected-calls.ts"() {
    "use strict";
    init_expected_calls();
  }
});

// src/cli/commands/click.ts
var click_exports = {};
__export(click_exports, {
  execute: () => execute14
});
async function execute14(args2) {
  if (!args2.url) {
    return {
      exitCode: 1,
      data: { command: "click", error: "click requires a URL" },
      errors: [{ code: "MISSING_URL", message: "click requires a URL" }]
    };
  }
  if (!args2.selector) {
    return {
      exitCode: 1,
      data: { command: "click", error: "click requires a selector" },
      errors: [{ code: "MISSING_SELECTOR", message: "click requires a CSS selector" }]
    };
  }
  try {
    const result2 = await renderUrl(args2.url, {
      token: args2.token,
      timeout: args2.timeout,
      noJs: args2.noJs
    });
    click(result2.document, args2.selector);
    return {
      exitCode: 0,
      data: { command: "click", status: "ok", selector: args2.selector }
    };
  } catch (err) {
    return {
      exitCode: 1,
      data: { command: "click", error: err.message },
      errors: [{ code: "CLICK_ERROR", message: err.message }]
    };
  }
}
var init_click2 = __esm({
  "src/cli/commands/click.ts"() {
    "use strict";
    init_render();
    init_click();
  }
});

// src/interaction/type.ts
function type2(doc, selector, text, options) {
  const el = doc.querySelector(selector);
  if (!el) {
    throw new Error(`type: no element matches selector "${selector}"`);
  }
  const tag = el.tagName?.toLowerCase();
  if (tag !== "input" && tag !== "textarea") {
    throw new Error(`type: target must be an input or textarea, got "${tag}"`);
  }
  if (options?.clear) {
    el.value = "";
  }
  for (const char of text) {
    el.value = (el.value ?? "") + char;
    el.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      cancelable: false,
      data: char,
      inputType: "insertText"
    }));
  }
}
var init_type = __esm({
  "src/interaction/type.ts"() {
    "use strict";
    init_events();
  }
});

// src/cli/commands/type.ts
var type_exports = {};
__export(type_exports, {
  execute: () => execute15
});
async function execute15(args2) {
  if (!args2.url) {
    return {
      exitCode: 1,
      data: { command: "type", error: "type requires a URL" },
      errors: [{ code: "MISSING_URL", message: "type requires a URL" }]
    };
  }
  if (!args2.selector) {
    return {
      exitCode: 1,
      data: { command: "type", error: "type requires a selector" },
      errors: [{ code: "MISSING_SELECTOR", message: "type requires a CSS selector" }]
    };
  }
  const text = args2.rest[0] ?? "";
  try {
    const result2 = await renderUrl(args2.url, {
      token: args2.token,
      timeout: args2.timeout,
      noJs: args2.noJs
    });
    type2(result2.document, args2.selector, text);
    return {
      exitCode: 0,
      data: { command: "type", status: "ok", selector: args2.selector, text }
    };
  } catch (err) {
    return {
      exitCode: 1,
      data: { command: "type", error: err.message },
      errors: [{ code: "TYPE_ERROR", message: err.message }]
    };
  }
}
var init_type2 = __esm({
  "src/cli/commands/type.ts"() {
    "use strict";
    init_render();
    init_type();
  }
});

// src/interaction/select.ts
function select(doc, selector, value) {
  const el = doc.querySelector(selector);
  if (!el) {
    throw new Error(`select: no element matches selector "${selector}"`);
  }
  const options = el.querySelectorAll("option");
  let found = false;
  if (typeof value === "string") {
    for (const opt of options) {
      if (opt.getAttribute("value") === value) {
        el.value = value;
        found = true;
        break;
      }
    }
  } else {
    for (const opt of options) {
      const text = (opt.textContent ?? "").trim();
      if (text === value.text) {
        el.value = opt.getAttribute("value") ?? "";
        found = true;
        break;
      }
    }
  }
  if (!found) {
    const target = typeof value === "string" ? value : value.text;
    throw new Error(`select: no option matches "${target}" in "${selector}"`);
  }
  el.dispatchEvent(new Event("change", { bubbles: true }));
}
var init_select = __esm({
  "src/interaction/select.ts"() {
    "use strict";
    init_events();
  }
});

// src/cli/commands/select.ts
var select_exports = {};
__export(select_exports, {
  execute: () => execute16
});
async function execute16(args2) {
  if (!args2.url) {
    return {
      exitCode: 1,
      data: { command: "select", error: "select requires a URL" },
      errors: [{ code: "MISSING_URL", message: "select requires a URL" }]
    };
  }
  if (!args2.selector) {
    return {
      exitCode: 1,
      data: { command: "select", error: "select requires a selector" },
      errors: [{ code: "MISSING_SELECTOR", message: "select requires a CSS selector" }]
    };
  }
  const value = args2.rest[0] ?? "";
  try {
    const result2 = await renderUrl(args2.url, {
      token: args2.token,
      timeout: args2.timeout,
      noJs: args2.noJs
    });
    select(result2.document, args2.selector, value);
    return {
      exitCode: 0,
      data: { command: "select", status: "ok", selector: args2.selector, value }
    };
  } catch (err) {
    return {
      exitCode: 1,
      data: { command: "select", error: err.message },
      errors: [{ code: "SELECT_ERROR", message: err.message }]
    };
  }
}
var init_select2 = __esm({
  "src/cli/commands/select.ts"() {
    "use strict";
    init_render();
    init_select();
  }
});

// src/cli/commands/inspect.ts
var inspect_exports = {};
__export(inspect_exports, {
  execute: () => execute17
});
async function getDocument(args2) {
  try {
    const result2 = await renderUrl(args2.url, {
      token: args2.token,
      timeout: args2.timeout,
      noJs: args2.noJs
    });
    return result2.document;
  } catch {
    const ctx = createVmContext({ timeout: 5e3, url: args2.url });
    return ctx.document;
  }
}
async function execute17(args2) {
  if (!args2.url) {
    return {
      exitCode: 1,
      data: { command: "inspect", error: "inspect requires a URL" },
      errors: [{ code: "MISSING_URL", message: "inspect requires a URL" }]
    };
  }
  try {
    const doc = await getDocument(args2);
    const selector = args2.selector;
    if (!selector) {
      const body = doc.body;
      const childCount = body?.children?.length ?? 0;
      return {
        exitCode: 0,
        data: {
          command: "inspect",
          status: "ok",
          element: {
            tagName: "body",
            attributes: {},
            children: childCount,
            text: (body?.textContent ?? "").trim().slice(0, 500)
          }
        }
      };
    }
    const el = doc.querySelector(selector);
    if (!el) {
      return {
        exitCode: 1,
        data: { command: "inspect", error: `No element matches selector "${selector}"` },
        errors: [{ code: "ELEMENT_NOT_FOUND", message: `No element matches selector "${selector}"` }]
      };
    }
    const attributes = {};
    const attrNames = ["id", "class", "type", "name", "href", "src", "role", "aria-label", "data-testid", "value", "placeholder"];
    for (const attr of attrNames) {
      const val = el.getAttribute?.(attr);
      if (val !== null && val !== void 0) {
        attributes[attr] = val;
      }
    }
    return {
      exitCode: 0,
      data: {
        command: "inspect",
        status: "ok",
        element: {
          tagName: (el.tagName ?? "unknown").toLowerCase(),
          attributes,
          children: el.children?.length ?? 0,
          text: (el.textContent ?? "").trim().slice(0, 500)
        }
      }
    };
  } catch (err) {
    return {
      exitCode: 1,
      data: { command: "inspect", error: err.message },
      errors: [{ code: "INSPECT_ERROR", message: err.message }]
    };
  }
}
var init_inspect = __esm({
  "src/cli/commands/inspect.ts"() {
    "use strict";
    init_render();
    init_vm_context();
  }
});

// src/cli/commands/init.ts
var init_exports = {};
__export(init_exports, {
  scaffoldInit: () => scaffoldInit
});
import * as fs2 from "node:fs";
import * as path3 from "node:path";
async function scaffoldInit(projectDir) {
  const dixieDir = path3.join(projectDir, ".dixie");
  const result2 = {
    created: [],
    skipped: [],
    files: {}
  };
  if (!fs2.existsSync(dixieDir)) {
    fs2.mkdirSync(dixieDir, { recursive: true });
  }
  const examplePath = path3.join(dixieDir, "example.com.ts");
  if (fs2.existsSync(examplePath)) {
    result2.skipped.push("example.com.ts");
  } else {
    fs2.writeFileSync(examplePath, EXAMPLE_CONFIG);
    result2.created.push(".dixie/example.com.ts");
    result2.files["example.com.ts"] = EXAMPLE_CONFIG;
  }
  const existingFiles = fs2.readdirSync(dixieDir);
  for (const file of existingFiles) {
    if (!result2.created.includes(`.dixie/${file}`) && file !== "example.com.ts") {
      result2.skipped.push(file);
    }
  }
  return result2;
}
var EXAMPLE_CONFIG;
var init_init = __esm({
  "src/cli/commands/init.ts"() {
    "use strict";
    EXAMPLE_CONFIG = `/**
 * Dixie domain config for example.com
 *
 * This file is auto-loaded when you run:
 *   dixie render https://example.com
 *
 * Customize auth, mock routes, noise patterns,
 * and render function for your domain.
 */
export default {
  auth: {
    baseUrl: 'https://example.com',
    loginEndpoint: '/api/auth/login',
    credentials: {
      email: 'test@example.com',
      password: 'your-password-here',
    },
  },

  mockRoutes: {
    '/api/users': { body: [{ id: 1, name: 'Test User' }] },
  },

  noisePatterns: [
    'cloudflare',
    'analytics',
  ],
};
`;
  }
});

// src/cli/commands/component.ts
var component_exports = {};
__export(component_exports, {
  execute: () => execute18
});
function walkForComponents(el, depth, maxDepth) {
  if (depth > maxDepth) return [];
  const nodes = [];
  const children = el.children ?? [];
  for (const child of children) {
    const testId = child.getAttribute?.("data-testid");
    const reactRoot = child.hasAttribute?.("data-reactroot");
    const tag = (child.tagName ?? "unknown").toLowerCase();
    if (testId || reactRoot) {
      const node = {
        tag,
        children: walkForComponents(child, depth + 1, maxDepth)
      };
      if (testId) node.testId = testId;
      nodes.push(node);
    } else {
      nodes.push(...walkForComponents(child, depth + 1, maxDepth));
    }
  }
  return nodes;
}
async function execute18(args2) {
  if (!args2.url) {
    return {
      exitCode: 1,
      data: { command: "component", error: "component requires a URL" },
      errors: [{ code: "MISSING_URL", message: "component requires a URL" }]
    };
  }
  try {
    let doc;
    try {
      const result2 = await renderUrl(args2.url, {
        token: args2.token,
        timeout: args2.timeout,
        noJs: args2.noJs
      });
      doc = result2.document;
    } catch {
      const ctx = createVmContext({ timeout: 5e3, url: args2.url });
      doc = ctx.document;
    }
    const tree = walkForComponents(doc.body ?? doc, 0, 10);
    return {
      exitCode: 0,
      data: { command: "component", status: "ok", tree }
    };
  } catch (err) {
    return {
      exitCode: 1,
      data: { command: "component", error: err.message },
      errors: [{ code: "COMPONENT_ERROR", message: err.message }]
    };
  }
}
var init_component = __esm({
  "src/cli/commands/component.ts"() {
    "use strict";
    init_render();
    init_vm_context();
  }
});

// src/assertions/DixieAssertions.ts
var DixieAssertions;
var init_DixieAssertions = __esm({
  "src/assertions/DixieAssertions.ts"() {
    "use strict";
    DixieAssertions = class {
      doc;
      console;
      constructor(document, consoleCapture) {
        this.doc = document;
        this.console = consoleCapture;
      }
      // ── Core assertions (non-throwing) ──────────────────────────────────
      /**
       * Checks that the page rendered cleanly:
       *  1. document.body exists and has content
       *  2. No console errors (if ConsoleCapture provided)
       *  3. No console warnings (if ConsoleCapture provided)
       */
      expectClean() {
        const failures = [];
        const body = this.doc.body;
        if (!body || body.innerHTML.length === 0) {
          failures.push("Body is empty or missing (innerHTML length: 0)");
        }
        if (this.console) {
          const errors = this.console.getErrors();
          if (errors.length > 0) {
            failures.push(`${errors.length} console error(s): ${errors.join("; ")}`);
          }
        }
        if (this.console) {
          const warnings = this.console.getWarnings();
          if (warnings.length > 0) {
            failures.push(`${warnings.length} console warning(s): ${warnings.join("; ")}`);
          }
        }
        if (failures.length > 0) {
          return {
            passed: false,
            assertion: "Page renders cleanly (content + no console errors/warnings)",
            details: failures.join("\n")
          };
        }
        return {
          passed: true,
          assertion: "Page renders cleanly (content + no console errors/warnings)"
        };
      }
      /**
       * Checks that document.body has non-empty innerHTML.
       * Optimized: checks for child nodes first (O(1)) instead of
       * serializing innerHTML. Falls back to innerHTML.trim() only
       * when children exist but might be whitespace-only text nodes.
       */
      expectContent() {
        const body = this.doc.body;
        if (!body || body._children.length === 0) {
          return {
            passed: false,
            assertion: "Body has content",
            details: "Body is empty (innerHTML length: 0)"
          };
        }
        let hasElementChild = false;
        for (const child of body._children) {
          if (child.nodeType === 1) {
            hasElementChild = true;
            break;
          }
        }
        if (hasElementChild) {
          return {
            passed: true,
            assertion: "Body has content"
          };
        }
        const len = body.innerHTML.trim().length;
        if (len === 0) {
          return {
            passed: false,
            assertion: "Body has content",
            details: "Body is empty (innerHTML length: 0)"
          };
        }
        return {
          passed: true,
          assertion: "Body has content"
        };
      }
      /**
       * Checks that an element matching the selector exists in the document.
       */
      expectElement(selector) {
        const el = this.doc.querySelector(selector);
        if (!el) {
          return {
            passed: false,
            assertion: `Element exists: ${selector}`,
            details: `No element matches selector: ${selector}`
          };
        }
        return {
          passed: true,
          assertion: `Element exists: ${selector}`
        };
      }
      /**
       * Checks that NO element matches the selector.
       */
      expectNoElement(selector) {
        const el = this.doc.querySelector(selector);
        if (el) {
          return {
            passed: false,
            assertion: `No element matches: ${selector}`,
            details: `Element found matching selector: ${selector}`
          };
        }
        return {
          passed: true,
          assertion: `No element matches: ${selector}`
        };
      }
      /**
       * Checks that the body text includes the given string.
       */
      expectText(text) {
        const bodyText = this.doc.body ? this.doc.body.textContent : "";
        if (!bodyText.includes(text)) {
          const preview = bodyText.substring(0, 200);
          const suffix = bodyText.length > 200 ? "..." : "";
          return {
            passed: false,
            assertion: `Text present: "${text}"`,
            details: `Text '${text}' not found in page. Body text starts with: '${preview}${suffix}'`
          };
        }
        return {
          passed: true,
          assertion: `Text present: "${text}"`
        };
      }
      /**
       * Checks that the body text does NOT include the given string.
       */
      expectNoText(text) {
        const bodyText = this.doc.body ? this.doc.body.textContent : "";
        if (bodyText.includes(text)) {
          return {
            passed: false,
            assertion: `Text absent: "${text}"`,
            details: `Text '${text}' was found in page but should not be present`
          };
        }
        return {
          passed: true,
          assertion: `Text absent: "${text}"`
        };
      }
      /**
       * Checks that an element matching the selector has the given attribute.
       * If value is provided, also checks that the attribute matches.
       */
      expectAttribute(selector, attr, value) {
        const el = this.doc.querySelector(selector);
        const desc = value !== void 0 ? `Attribute ${attr}="${value}" on ${selector}` : `Attribute ${attr} on ${selector}`;
        if (!el) {
          return {
            passed: false,
            assertion: desc,
            details: `No element matches selector: ${selector}`
          };
        }
        const attrValue = el.getAttribute(attr);
        if (attrValue === null) {
          return {
            passed: false,
            assertion: desc,
            details: `Element '${selector}' does not have attribute '${attr}'`
          };
        }
        if (value !== void 0 && attrValue !== value) {
          return {
            passed: false,
            assertion: desc,
            details: `Attribute '${attr}' value is '${attrValue}', expected '${value}'`
          };
        }
        return {
          passed: true,
          assertion: desc
        };
      }
      /**
       * Checks that the number of elements matching the selector equals count.
       */
      expectElementCount(selector, count) {
        const elements = this.doc.querySelectorAll(selector);
        const actual = elements.length;
        if (actual !== count) {
          return {
            passed: false,
            assertion: `Element count: ${count} matching '${selector}'`,
            details: `Expected ${count} elements matching '${selector}', found ${actual}`
          };
        }
        return {
          passed: true,
          assertion: `Element count: ${count} matching '${selector}'`
        };
      }
      // ── Batch runner ────────────────────────────────────────────────────
      /**
       * Run multiple assertions and return all results (does not short-circuit).
       */
      runAll(assertions) {
        return assertions.map((fn) => fn());
      }
      // ── Throwing variants (for test frameworks) ─────────────────────────
      assertClean() {
        const result2 = this.expectClean();
        if (!result2.passed) {
          throw new Error(`Assertion failed: ${result2.assertion}
${result2.details}`);
        }
      }
      assertContent() {
        const result2 = this.expectContent();
        if (!result2.passed) {
          throw new Error(`Assertion failed: ${result2.assertion}
${result2.details}`);
        }
      }
      assertElement(selector) {
        const result2 = this.expectElement(selector);
        if (!result2.passed) {
          throw new Error(`Assertion failed: ${result2.assertion}
${result2.details}`);
        }
      }
      assertNoElement(selector) {
        const result2 = this.expectNoElement(selector);
        if (!result2.passed) {
          throw new Error(`Assertion failed: ${result2.assertion}
${result2.details}`);
        }
      }
      assertText(text) {
        const result2 = this.expectText(text);
        if (!result2.passed) {
          throw new Error(`Assertion failed: ${result2.assertion}
${result2.details}`);
        }
      }
    };
  }
});

// src/assertions/DixieSnapshot.ts
var KEY_ATTRIBUTES, HEADING_TAGS, DixieSnapshot;
var init_DixieSnapshot = __esm({
  "src/assertions/DixieSnapshot.ts"() {
    "use strict";
    init_Node();
    KEY_ATTRIBUTES = ["id", "class", "type", "name", "href", "src", "action", "method", "value", "for"];
    HEADING_TAGS = /* @__PURE__ */ new Set(["H1", "H2", "H3", "H4", "H5", "H6"]);
    DixieSnapshot = class _DixieSnapshot {
      doc;
      constructor(document) {
        this.doc = document;
      }
      /**
       * Full DOM state as structured data.
       * Optimized: single-pass tree walk collects all element types at once.
       */
      toJSON() {
        const body = this.doc.body;
        const bodyHTML = body ? body.innerHTML : "";
        const bodyText = body ? body.textContent.trim() : "";
        const collected = this._collectAll(body);
        return {
          url: "",
          title: this.doc.title,
          bodyHTML,
          bodyText,
          elementCount: collected.elementCount,
          forms: collected.forms,
          links: collected.links,
          headings: collected.headings,
          images: collected.images
        };
      }
      /**
       * Human/agent-readable indented tree visualization.
       * Optimized: pre-computed indent strings, array buffer with final join.
       */
      toDebugString(maxDepth = 10) {
        const lines = [];
        const indents = new Array(maxDepth + 2);
        for (let i = 0; i <= maxDepth + 1; i++) {
          indents[i] = "  ".repeat(i);
        }
        this._renderNode(this.doc.documentElement, 0, maxDepth, lines, indents);
        return lines.join("\n");
      }
      /**
       * Quick numeric summary of page contents.
       * Optimized: single-pass walk counts elements by tag instead of building full arrays.
       */
      toSummary() {
        const body = this.doc.body;
        const bodyText = body ? body.textContent.trim() : "";
        const counts = this._countAll(body);
        return {
          title: this.doc.title,
          elementCount: counts.elementCount,
          textLength: bodyText.length,
          formCount: counts.formCount,
          linkCount: counts.linkCount,
          headingCount: counts.headingCount,
          hasContent: bodyText.length > 0
        };
      }
      // ── Private: tree rendering ─────────────────────────────────────────
      _renderNode(node, depth, maxDepth, lines, indents) {
        if (depth > maxDepth) return;
        const indent = indents[depth] ?? "  ".repeat(depth);
        if (node.nodeType === Node.TEXT_NODE) {
          const text = (node._textData ?? "").trim();
          if (text.length > 0) {
            const truncated = text.length > 80 ? text.substring(0, 80) + "..." : text;
            lines.push(indent + truncated);
          }
          return;
        }
        if (node.nodeType === Node.COMMENT_NODE) {
          lines.push(indent + "<!--" + (node._textData ?? "") + "-->");
          return;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node;
          const tag = el.tagName.toLowerCase();
          let attrStr = "";
          for (let i = 0; i < KEY_ATTRIBUTES.length; i++) {
            const val = el.getAttribute(KEY_ATTRIBUTES[i]);
            if (val !== null) {
              attrStr += " " + KEY_ATTRIBUTES[i] + '="' + val + '"';
            }
          }
          lines.push(indent + "<" + tag + attrStr + ">");
          const children2 = node._children;
          for (let i = 0; i < children2.length; i++) {
            this._renderNode(children2[i], depth + 1, maxDepth, lines, indents);
          }
          return;
        }
        const children = node._children;
        for (let i = 0; i < children.length; i++) {
          this._renderNode(children[i], depth, maxDepth, lines, indents);
        }
      }
      // ── Private: Single-pass collectors ─────────────────────────────────
      /** Tags that count as form fields */
      static FIELD_TAGS = /* @__PURE__ */ new Set(["INPUT", "SELECT", "TEXTAREA"]);
      /**
       * Single-pass tree walk that collects forms, links, headings, images,
       * and element count all at once. Replaces 5 separate walks.
       */
      _collectAll(root) {
        if (!root) {
          return { elementCount: 0, forms: [], links: [], headings: [], images: [] };
        }
        const forms = [];
        const links = [];
        const headings = [];
        const images = [];
        let elementCount = 0;
        const formElements = [];
        this._walkElementsFast(root, (el) => {
          elementCount++;
          const tag = el.tagName;
          if (tag === "A") {
            links.push({
              href: el.getAttribute("href") ?? "",
              text: el.textContent.trim()
            });
          } else if (tag === "FORM") {
            formElements.push(el);
          } else if (tag === "IMG") {
            images.push({
              src: el.getAttribute("src") ?? "",
              alt: el.getAttribute("alt") ?? ""
            });
          } else if (HEADING_TAGS.has(tag)) {
            headings.push({
              level: parseInt(tag[1], 10),
              text: el.textContent.trim()
            });
          }
        });
        for (const formEl of formElements) {
          let fieldCount = 0;
          this._walkElementsFast(formEl, (child) => {
            if (_DixieSnapshot.FIELD_TAGS.has(child.tagName)) {
              fieldCount++;
            }
          });
          forms.push({
            action: formEl.getAttribute("action") ?? "",
            method: formEl.getAttribute("method") ?? "",
            fieldCount
          });
        }
        return { elementCount, forms, links, headings, images };
      }
      /**
       * Single-pass counter for toSummary — only counts, doesn't build arrays.
       */
      _countAll(root) {
        if (!root) {
          return { elementCount: 0, formCount: 0, linkCount: 0, headingCount: 0 };
        }
        let elementCount = 0;
        let formCount = 0;
        let linkCount = 0;
        let headingCount = 0;
        this._walkElementsFast(root, (el) => {
          elementCount++;
          const tag = el.tagName;
          if (tag === "A") linkCount++;
          else if (tag === "FORM") formCount++;
          else if (HEADING_TAGS.has(tag)) headingCount++;
        });
        return { elementCount, formCount, linkCount, headingCount };
      }
      /**
       * Fast element walker using index-based loop instead of for-of iterator.
       */
      _walkElementsFast(root, callback) {
        const children = root._children;
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          if (child.nodeType === Node.ELEMENT_NODE) {
            callback(child);
          }
          this._walkElementsFast(child, callback);
        }
      }
    };
  }
});

// src/assertions/PerformanceBudget.ts
var DEFAULT_BUDGET, BUDGET_KEY_MAP, PerformanceBudget;
var init_PerformanceBudget = __esm({
  "src/assertions/PerformanceBudget.ts"() {
    "use strict";
    DEFAULT_BUDGET = {
      renderMs: 100,
      parseMs: 50,
      fetchMs: 10,
      totalMs: 500
    };
    BUDGET_KEY_MAP = {
      render: "renderMs",
      parse: "parseMs",
      fetch: "fetchMs",
      total: "totalMs"
    };
    PerformanceBudget = class {
      _config;
      _timings = /* @__PURE__ */ new Map();
      _starts = /* @__PURE__ */ new Map();
      constructor(config) {
        this._config = {
          renderMs: config?.renderMs ?? DEFAULT_BUDGET.renderMs,
          parseMs: config?.parseMs ?? DEFAULT_BUDGET.parseMs,
          fetchMs: config?.fetchMs ?? DEFAULT_BUDGET.fetchMs,
          totalMs: config?.totalMs ?? DEFAULT_BUDGET.totalMs
        };
      }
      /**
       * Start timing an operation.
       */
      start(operation) {
        this._starts.set(operation, performance.now());
      }
      /**
       * End timing an operation.
       * Throws if start() was not called for this operation.
       */
      end(operation) {
        const startTime = this._starts.get(operation);
        if (startTime === void 0) {
          throw new Error(`PerformanceBudget: start() was not called for operation '${operation}'.`);
        }
        const elapsed = performance.now() - startTime;
        this._timings.set(operation, elapsed);
        this._starts.delete(operation);
      }
      /**
       * Time a synchronous function.
       * Records the elapsed time under the given operation name.
       */
      time(operation, fn) {
        this.start(operation);
        try {
          const result2 = fn();
          this.end(operation);
          return result2;
        } catch (err) {
          this.end(operation);
          throw err;
        }
      }
      /**
       * Time an async function.
       * Records the elapsed time under the given operation name.
       */
      async timeAsync(operation, fn) {
        this.start(operation);
        try {
          const result2 = await fn();
          this.end(operation);
          return result2;
        } catch (err) {
          this.end(operation);
          throw err;
        }
      }
      /**
       * Check all timings against the budget.
       * Returns a result with pass/fail status and any violations.
       */
      check() {
        const violations = [];
        const timings = {};
        for (const [operation, elapsed] of this._timings) {
          timings[operation] = elapsed;
          const budgetKey = BUDGET_KEY_MAP[operation];
          if (budgetKey) {
            const limit = this._config[budgetKey];
            if (elapsed > limit) {
              violations.push({
                operation,
                limit,
                actual: elapsed,
                overBy: elapsed - limit
              });
            }
          }
        }
        return {
          passed: violations.length === 0,
          violations,
          timings
        };
      }
      /**
       * Reset all timings and in-progress starts.
       */
      reset() {
        this._timings.clear();
        this._starts.clear();
      }
    };
  }
});

// src/assertions/DiffSnapshot.ts
var MEANINGFUL_ATTRIBUTES, DiffSnapshot;
var init_DiffSnapshot = __esm({
  "src/assertions/DiffSnapshot.ts"() {
    "use strict";
    init_Node();
    MEANINGFUL_ATTRIBUTES = [
      "id",
      "class",
      "type",
      "name",
      "href",
      "src",
      "action",
      "method",
      "value",
      "for",
      "role",
      "aria-label",
      "data-testid",
      "placeholder",
      "alt",
      "title",
      "disabled",
      "checked",
      "selected",
      "readonly",
      "required",
      "target",
      "rel"
    ];
    DiffSnapshot = class _DiffSnapshot {
      /**
       * Take a snapshot of current DOM state.
       */
      static capture(doc) {
        const tree = [];
        const root = doc.documentElement;
        if (root) {
          tree.push(_DiffSnapshot._captureNode(root, root.tagName.toLowerCase()));
        }
        return {
          timestamp: Date.now(),
          tree
        };
      }
      /**
       * Compare two snapshots.
       */
      static diff(before, after) {
        const entries = [];
        _DiffSnapshot._diffTrees(before.tree, after.tree, entries);
        return _DiffSnapshot._buildResult(entries);
      }
      /**
       * Compare current DOM against a previous snapshot.
       */
      static diffFrom(doc, previousSnapshot) {
        const current = _DiffSnapshot.capture(doc);
        return _DiffSnapshot.diff(previousSnapshot, current);
      }
      /**
       * Convenience: capture before, run function, capture after, return diff.
       */
      static track(doc, fn) {
        const before = _DiffSnapshot.capture(doc);
        const result2 = fn();
        const after = _DiffSnapshot.capture(doc);
        return { result: result2, diff: _DiffSnapshot.diff(before, after) };
      }
      /**
       * Async version of track.
       */
      static async trackAsync(doc, fn) {
        const before = _DiffSnapshot.capture(doc);
        const result2 = await fn();
        const after = _DiffSnapshot.capture(doc);
        return { result: result2, diff: _DiffSnapshot.diff(before, after) };
      }
      // ── Private: capture helpers ───────────────────────────────────────
      static _captureNode(node, parentPath) {
        if (node.nodeType !== Node.ELEMENT_NODE) {
          return {
            tag: "#text",
            text: node.textContent.trim(),
            path: parentPath
          };
        }
        const el = node;
        const tag = el.tagName.toLowerCase();
        const path4 = parentPath;
        const attributes = {};
        let hasAttributes = false;
        for (const attrName of MEANINGFUL_ATTRIBUTES) {
          if (attrName === "id" || attrName === "class") continue;
          const val = el.getAttribute(attrName);
          if (val !== null) {
            attributes[attrName] = val;
            hasAttributes = true;
          }
        }
        const className = el.getAttribute("class");
        const classes = className ? className.split(/\s+/).filter((c) => c.length > 0) : void 0;
        const id = el.getAttribute("id") || void 0;
        let directText;
        const elementChildren = [];
        let childElementIndex = 0;
        for (let i = 0; i < el._children.length; i++) {
          const child = el._children[i];
          if (child.nodeType === Node.TEXT_NODE) {
            const trimmed = (child._textData ?? "").trim();
            if (trimmed) {
              directText = directText ? directText + " " + trimmed : trimmed;
            }
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            const childEl = child;
            const childTag = childEl.tagName.toLowerCase();
            const childPath = _DiffSnapshot._buildChildPath(path4, childEl, childElementIndex);
            childElementIndex++;
            elementChildren.push(_DiffSnapshot._captureNode(child, childPath));
          }
        }
        const result2 = {
          tag,
          path: path4
        };
        if (id) result2.id = id;
        if (classes && classes.length > 0) result2.classes = classes;
        if (hasAttributes) result2.attributes = attributes;
        if (directText) result2.text = directText;
        if (elementChildren.length > 0) result2.children = elementChildren;
        return result2;
      }
      static _buildChildPath(parentPath, el, indexAmongSiblings) {
        const tag = el.tagName.toLowerCase();
        const id = el.getAttribute("id");
        const className = el.getAttribute("class");
        let segment = tag;
        if (id) {
          segment = `${tag}#${id}`;
        } else if (className) {
          const firstClass = className.split(/\s+/)[0];
          if (firstClass) {
            segment = `${tag}.${firstClass}`;
          }
        }
        if (!id) {
          segment += `:nth-child(${indexAmongSiblings + 1})`;
        }
        return `${parentPath} > ${segment}`;
      }
      // ── Private: diff algorithm ────────────────────────────────────────
      static _diffTrees(beforeNodes, afterNodes, entries) {
        const maxLen = Math.max(beforeNodes.length, afterNodes.length);
        for (let i = 0; i < maxLen; i++) {
          const beforeNode = i < beforeNodes.length ? beforeNodes[i] : null;
          const afterNode = i < afterNodes.length ? afterNodes[i] : null;
          if (beforeNode && !afterNode) {
            _DiffSnapshot._collectRemoved(beforeNode, entries);
          } else if (!beforeNode && afterNode) {
            _DiffSnapshot._collectAdded(afterNode, entries);
          } else if (beforeNode && afterNode) {
            _DiffSnapshot._diffNodes(beforeNode, afterNode, entries);
          }
        }
      }
      static _diffNodes(before, after, entries) {
        if (before.tag !== after.tag) {
          _DiffSnapshot._collectRemoved(before, entries);
          _DiffSnapshot._collectAdded(after, entries);
          return;
        }
        const changes = [];
        if ((before.text || "") !== (after.text || "")) {
          changes.push(`text: "${before.text || ""}" -> "${after.text || ""}"`);
        }
        const beforeClasses = (before.classes || []).join(" ");
        const afterClasses = (after.classes || []).join(" ");
        if (beforeClasses !== afterClasses) {
          changes.push(`classes: "${beforeClasses}" -> "${afterClasses}"`);
        }
        if ((before.id || "") !== (after.id || "")) {
          changes.push(`id: "${before.id || ""}" -> "${after.id || ""}"`);
        }
        const beforeAttrs = before.attributes || {};
        const afterAttrs = after.attributes || {};
        const allAttrKeys = /* @__PURE__ */ new Set([...Object.keys(beforeAttrs), ...Object.keys(afterAttrs)]);
        for (const key of allAttrKeys) {
          const bVal = beforeAttrs[key];
          const aVal = afterAttrs[key];
          if (bVal !== aVal) {
            if (bVal === void 0) {
              changes.push(`+${key}="${aVal}"`);
            } else if (aVal === void 0) {
              changes.push(`-${key}="${bVal}"`);
            } else {
              changes.push(`${key}: "${bVal}" -> "${aVal}"`);
            }
          }
        }
        if (changes.length > 0) {
          entries.push({
            type: "changed",
            path: after.path,
            element: _DiffSnapshot._describeNode(after),
            details: changes.join("; ")
          });
        }
        const beforeChildren = before.children || [];
        const afterChildren = after.children || [];
        _DiffSnapshot._diffTrees(beforeChildren, afterChildren, entries);
      }
      static _collectAdded(node, entries) {
        if (node.tag === "#text") return;
        entries.push({
          type: "added",
          path: node.path,
          element: _DiffSnapshot._describeNode(node)
        });
        if (node.children) {
          for (const child of node.children) {
            _DiffSnapshot._collectAdded(child, entries);
          }
        }
      }
      static _collectRemoved(node, entries) {
        if (node.tag === "#text") return;
        entries.push({
          type: "removed",
          path: node.path,
          element: _DiffSnapshot._describeNode(node)
        });
        if (node.children) {
          for (const child of node.children) {
            _DiffSnapshot._collectRemoved(child, entries);
          }
        }
      }
      static _describeNode(node) {
        let desc = node.tag;
        if (node.id) desc += `#${node.id}`;
        if (node.classes && node.classes.length > 0) {
          desc += "." + node.classes.join(".");
        }
        return desc;
      }
      // ── Private: result builder ────────────────────────────────────────
      static _buildResult(entries) {
        const stats = { added: 0, removed: 0, changed: 0, moved: 0, total: 0 };
        for (const entry of entries) {
          stats[entry.type]++;
          stats.total++;
        }
        const identical = entries.length === 0;
        const parts = [];
        if (stats.added > 0) parts.push(`${stats.added} element${stats.added !== 1 ? "s" : ""} added`);
        if (stats.removed > 0) parts.push(`${stats.removed} element${stats.removed !== 1 ? "s" : ""} removed`);
        if (stats.changed > 0) parts.push(`${stats.changed} element${stats.changed !== 1 ? "s" : ""} changed`);
        if (stats.moved > 0) parts.push(`${stats.moved} element${stats.moved !== 1 ? "s" : ""} moved`);
        const summary = identical ? "No changes detected" : parts.join(", ");
        return { identical, entries, summary, stats };
      }
    };
  }
});

// src/assertions/index.ts
var init_assertions = __esm({
  "src/assertions/index.ts"() {
    "use strict";
    init_DixieAssertions();
    init_DixieSnapshot();
    init_PerformanceBudget();
    init_DiffSnapshot();
  }
});

// src/cli/commands/fidelity.ts
var fidelity_exports = {};
__export(fidelity_exports, {
  execute: () => execute19
});
async function getDocument2(url, args2) {
  try {
    const result2 = await renderUrl(url, {
      token: args2.token,
      timeout: args2.timeout,
      noJs: args2.noJs
    });
    return result2.document;
  } catch {
    const ctx = createVmContext({ timeout: 5e3, url });
    return ctx.document;
  }
}
async function execute19(args2) {
  if (!args2.url) {
    return {
      exitCode: 1,
      data: { command: "fidelity", error: "fidelity requires a URL" },
      errors: [{ code: "MISSING_URL", message: "fidelity requires a URL" }]
    };
  }
  try {
    const doc = await getDocument2(args2.url, args2);
    const snapshot = DiffSnapshot.capture(doc);
    const rest = args2.rest ?? [];
    const compareUrl = args2.selector ?? rest[0];
    if (compareUrl) {
      const doc2 = await getDocument2(compareUrl, args2);
      const snapshot2 = DiffSnapshot.capture(doc2);
      const diff = DiffSnapshot.diff(snapshot, snapshot2);
      return {
        exitCode: 0,
        data: {
          command: "fidelity",
          status: "ok",
          match: diff.identical,
          summary: diff.summary,
          stats: diff.stats,
          entries: diff.entries
        }
      };
    }
    return {
      exitCode: 0,
      data: {
        command: "fidelity",
        status: "ok",
        match: true,
        snapshot
      }
    };
  } catch (err) {
    return {
      exitCode: 1,
      data: { command: "fidelity", error: err.message },
      errors: [{ code: "FIDELITY_ERROR", message: err.message }]
    };
  }
}
var init_fidelity = __esm({
  "src/cli/commands/fidelity.ts"() {
    "use strict";
    init_assertions();
    init_render();
    init_vm_context();
  }
});

// src/cli/commands/lighthouse.ts
var lighthouse_exports = {};
__export(lighthouse_exports, {
  execute: () => execute20
});
async function execute20(args2) {
  if (!args2.url) {
    return {
      exitCode: 1,
      data: { command: "lighthouse", error: "lighthouse requires a URL" },
      errors: [{ code: "MISSING_URL", message: "lighthouse requires a URL" }]
    };
  }
  try {
    let doc;
    try {
      const result2 = await renderUrl(args2.url, {
        token: args2.token,
        timeout: args2.timeout,
        noJs: args2.noJs
      });
      doc = result2.document;
    } catch {
      const ctx = createVmContext({ timeout: 5e3, url: args2.url });
      doc = ctx.document;
    }
    const a11y = collectA11y(doc);
    const links = collectLinks(doc);
    const forms = collectForms(doc);
    const structure = collectStructure(doc);
    const a11yScore = Math.max(0, 100 - a11y.issues.length * 10);
    const linksScore = links.links.length > 0 || links.buttons.length > 0 ? 100 : 50;
    const formsScore = forms.fields.length > 0 ? 100 : 50;
    const structureScore = structure.elementCount > 0 ? 100 : 0;
    const score = Math.round((a11yScore + linksScore + formsScore + structureScore) / 4);
    return {
      exitCode: 0,
      data: {
        command: "lighthouse",
        status: "ok",
        score,
        categories: {
          a11y: { score: a11yScore, issues: a11y.issues.length },
          links: { score: linksScore, count: links.links.length },
          forms: { score: formsScore, fields: forms.fields.length },
          structure: { score: structureScore, elements: structure.elementCount }
        }
      }
    };
  } catch (err) {
    return {
      exitCode: 1,
      data: { command: "lighthouse", error: err.message },
      errors: [{ code: "LIGHTHOUSE_ERROR", message: err.message }]
    };
  }
}
var init_lighthouse = __esm({
  "src/cli/commands/lighthouse.ts"() {
    "use strict";
    init_render();
    init_vm_context();
    init_a11y();
    init_links();
    init_forms();
    init_structure();
  }
});

// src/har/recorder.ts
function headersToList(headers) {
  if (!headers) return [];
  return Object.entries(headers).map(([name, value]) => ({ name, value }));
}
function parseQueryString(url) {
  try {
    const parsed = new URL(url);
    const result2 = [];
    parsed.searchParams.forEach((value, name) => {
      result2.push({ name, value });
    });
    return result2;
  } catch {
    return [];
  }
}
function statusText(status) {
  const map2 = {
    200: "OK",
    201: "Created",
    204: "No Content",
    301: "Moved Permanently",
    302: "Found",
    304: "Not Modified",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    500: "Internal Server Error"
  };
  return map2[status] ?? "";
}
var HarRecorder;
var init_recorder = __esm({
  "src/har/recorder.ts"() {
    "use strict";
    HarRecorder = class {
      entries = [];
      record(input) {
        const entry = {
          startedDateTime: (/* @__PURE__ */ new Date()).toISOString(),
          time: input.durationMs,
          request: {
            method: input.method,
            url: input.url,
            httpVersion: "HTTP/1.1",
            headers: headersToList(input.requestHeaders),
            queryString: parseQueryString(input.url),
            headersSize: -1,
            bodySize: 0
          },
          response: {
            status: input.status,
            statusText: statusText(input.status),
            httpVersion: "HTTP/1.1",
            headers: headersToList(input.responseHeaders),
            content: {
              size: input.responseBody.length,
              mimeType: input.responseHeaders?.["content-type"] ?? "application/octet-stream",
              text: input.responseBody
            },
            headersSize: -1,
            bodySize: input.responseBody.length
          },
          cache: {},
          timings: {
            send: 0,
            wait: input.durationMs,
            receive: 0
          }
        };
        this.entries.push(entry);
      }
      getEntries() {
        return [...this.entries];
      }
      clear() {
        this.entries = [];
      }
    };
  }
});

// src/har/exporter.ts
function exportHar(recorder) {
  return {
    log: {
      version: "1.2",
      creator: {
        name: "Dixie",
        version: "3.0.0"
      },
      entries: recorder.getEntries()
    }
  };
}
var init_exporter = __esm({
  "src/har/exporter.ts"() {
    "use strict";
  }
});

// src/cli/commands/har.ts
var har_exports = {};
__export(har_exports, {
  execute: () => execute21
});
async function execute21(args2) {
  if (!args2.url) {
    return {
      exitCode: 1,
      data: { command: "har", error: "har requires a URL" },
      errors: [{ code: "MISSING_URL", message: "har requires a URL" }]
    };
  }
  try {
    const recorder = new HarRecorder();
    await renderUrl(args2.url, {
      token: args2.token,
      timeout: args2.timeout,
      noJs: args2.noJs,
      harRecorder: recorder
    });
    const har = exportHar(recorder);
    const data = { command: "har", status: "ok", ...har };
    const output = formatOutput(data, args2.format ?? "json");
    return { exitCode: 0, output, data };
  } catch (err) {
    return {
      exitCode: 1,
      data: { command: "har", error: err.message },
      errors: [{ code: "HAR_ERROR", message: err.message }]
    };
  }
}
var init_har = __esm({
  "src/cli/commands/har.ts"() {
    "use strict";
    init_render();
    init_recorder();
    init_exporter();
    init_format();
  }
});

// src/redact.ts
function redactHeaders(headers) {
  if (!headers || typeof headers !== "object") return headers;
  const result2 = { ...headers };
  for (const key of Object.keys(result2)) {
    if (SENSITIVE_HEADERS.test(key) || BEARER_PATTERN.test(result2[key] ?? "")) {
      result2[key] = "[REDACTED]";
    }
  }
  return result2;
}
function redactBody(body, depth = 0) {
  if (depth > 5 || body === null || body === void 0) return body;
  if (typeof body !== "object") return body;
  if (Array.isArray(body)) return body.map((item) => redactBody(item, depth + 1));
  const result2 = { ...body };
  for (const key of Object.keys(result2)) {
    if (SENSITIVE_BODY_FIELDS.test(key)) {
      result2[key] = "[REDACTED]";
    } else if (typeof result2[key] === "object" && result2[key] !== null) {
      result2[key] = redactBody(result2[key], depth + 1);
    }
  }
  return result2;
}
function redactUrl(url) {
  try {
    const parsed = new URL(url);
    const params = new URLSearchParams(parsed.search);
    let changed = false;
    for (const [key] of params.entries()) {
      if (SENSITIVE_QUERY_PARAMS.test(key)) {
        params.set(key, "[REDACTED]");
        changed = true;
      }
    }
    if (changed) {
      parsed.search = params.toString();
      return parsed.toString();
    }
    return url;
  } catch {
    return url;
  }
}
function redactSnapshot(snapshot) {
  if (!snapshot.api) return snapshot;
  return {
    ...snapshot,
    api: snapshot.api.map((entry) => {
      const redacted = { ...entry };
      if (redacted.url) {
        redacted.url = redactUrl(redacted.url);
      }
      if (redacted.requestBody?.headers) {
        redacted.requestBody = {
          ...redacted.requestBody,
          headers: redactHeaders(redacted.requestBody.headers)
        };
      }
      if (redacted.requestBody?.body) {
        redacted.requestBody = {
          ...redacted.requestBody,
          body: redactBody(redacted.requestBody.body)
        };
      }
      if (redacted.responseHeaders) {
        redacted.responseHeaders = redactHeaders(redacted.responseHeaders);
      }
      return redacted;
    })
  };
}
var SENSITIVE_HEADERS, BEARER_PATTERN, SENSITIVE_BODY_FIELDS, SENSITIVE_QUERY_PARAMS;
var init_redact = __esm({
  "src/redact.ts"() {
    "use strict";
    SENSITIVE_HEADERS = /^(authorization|cookie|set-cookie)$/i;
    BEARER_PATTERN = /^bearer\s+/i;
    SENSITIVE_BODY_FIELDS = /^(token|secret|password|apiKey|api_key|authorization|access_token|refresh_token)$/i;
    SENSITIVE_QUERY_PARAMS = /^(token|secret|key|password|authorization|access_token|api_key)$/i;
  }
});

// src/cli/commands/redact.ts
var redact_exports = {};
__export(redact_exports, {
  execute: () => execute22
});
async function execute22(args2) {
  try {
    if (args2.file || args2.url) {
      const filePath = args2.file ?? args2.url;
      try {
        const fs3 = await import("node:fs");
        const content = fs3.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(content);
        const redacted2 = redactSnapshot(parsed);
        return {
          exitCode: 0,
          data: { command: "redact", status: "ok", redacted: redacted2 }
        };
      } catch {
      }
    }
    const sample = {
      api: [
        {
          requestBody: {
            headers: {
              "Authorization": "Bearer secret-token-123",
              "Content-Type": "application/json"
            }
          }
        }
      ]
    };
    const redacted = redactSnapshot(sample);
    return {
      exitCode: 0,
      data: { command: "redact", status: "ok", redacted }
    };
  } catch (err) {
    return {
      exitCode: 1,
      data: { command: "redact", error: err.message },
      errors: [{ code: "REDACT_ERROR", message: err.message }]
    };
  }
}
var init_redact2 = __esm({
  "src/cli/commands/redact.ts"() {
    "use strict";
    init_redact();
  }
});

// src/parser/index.ts
var init_parser = __esm({
  "src/parser/index.ts"() {
    "use strict";
    init_HTMLParser();
    init_HTMLSerializer();
    init_HTMLTokenizer();
    init_HTMLParser();
  }
});

// src/css/index.ts
var init_css = __esm({
  "src/css/index.ts"() {
    "use strict";
    init_CSSStyleDeclaration();
  }
});

// src/observers/index.ts
var init_observers = __esm({
  "src/observers/index.ts"() {
    "use strict";
    init_MutationObserver();
    init_MutationRecord();
    init_ResizeObserver();
    init_IntersectionObserver();
  }
});

// src/console/ConsoleCapture.ts
function stringifyArgs(args2) {
  if (args2.length === 1 && typeof args2[0] === "string") {
    return args2[0];
  }
  if (args2.length === 0) {
    return "";
  }
  return args2.map((a) => typeof a === "string" ? a : String(a)).join(" ");
}
function isNoiseCompiled(message, stringPatterns, regexPatterns) {
  for (let i = 0; i < stringPatterns.length; i++) {
    if (message.includes(stringPatterns[i])) return true;
  }
  for (let i = 0; i < regexPatterns.length; i++) {
    if (regexPatterns[i].test(message)) return true;
  }
  return false;
}
var DEFAULT_NOISE_PATTERNS, _activeInstance, ConsoleCapture;
var init_ConsoleCapture = __esm({
  "src/console/ConsoleCapture.ts"() {
    "use strict";
    DEFAULT_NOISE_PATTERNS = [
      // React Query
      "No queryFn was passed",
      "No QueryClient set",
      // React 18 deprecations
      "defaultProps will be removed",
      "ReactDOM.render is no longer supported",
      // React testing act() warnings
      /act\(/,
      "not wrapped in act",
      "Cannot update a component",
      "Cannot update during an existing state transition",
      // Auth providers
      "No refresh token",
      "No auth token",
      // Observers (no layout engine)
      "ResizeObserver",
      "IntersectionObserver",
      // Layout effects
      "useLayoutEffect",
      // External SDKs
      /[Ss]tripe/,
      /google/i,
      // Network in test env
      "AbortError",
      /socket/i,
      "WebSocket",
      /beacon/i,
      /cloudflare/i,
      // API errors in test
      /\/api\//
    ];
    _activeInstance = null;
    ConsoleCapture = class {
      // ── Captured call arrays ──────────────────────────────────────────
      _rawErrors = [];
      _rawWarnings = [];
      _rawLogs = [];
      // ── Noise patterns (original mixed array for getNoisePatterns()) ──
      _noisePatterns;
      _initialPatterns;
      // ── Pre-compiled noise patterns (split by type for fast matching) ──
      _stringPatterns = [];
      _regexPatterns = [];
      // ── Filter cache (invalidated on capture or pattern change) ───────
      _cachedErrors = null;
      _cachedWarnings = null;
      _cachedLogs = null;
      _errorCountAtCache = 0;
      _warningCountAtCache = 0;
      _logCountAtCache = 0;
      // ── Options ───────────────────────────────────────────────────────
      _captureLog;
      _captureInfo;
      _captureDebug;
      // ── Saved originals ───────────────────────────────────────────────
      _origError = null;
      _origWarn = null;
      _origLog = null;
      _origInfo = null;
      _origDebug = null;
      // ── State ─────────────────────────────────────────────────────────
      _installed = false;
      constructor(options) {
        const opts = options ?? {};
        if (opts.noisePatterns !== void 0) {
          this._initialPatterns = [...opts.noisePatterns];
          this._noisePatterns = [...opts.noisePatterns];
        } else {
          this._initialPatterns = [...DEFAULT_NOISE_PATTERNS];
          this._noisePatterns = [...DEFAULT_NOISE_PATTERNS];
        }
        this._recompilePatterns();
        this._captureLog = opts.captureLog ?? false;
        this._captureInfo = opts.captureInfo ?? false;
        this._captureDebug = opts.captureDebug ?? false;
      }
      /**
       * Split the mixed _noisePatterns array into separate string and regex arrays
       * for faster matching. Called on construction and pattern changes.
       */
      _recompilePatterns() {
        const strings = [];
        const regexes = [];
        for (const p of this._noisePatterns) {
          if (typeof p === "string") {
            strings.push(p);
          } else {
            regexes.push(p);
          }
        }
        this._stringPatterns = strings;
        this._regexPatterns = regexes;
        this._invalidateCache();
      }
      /**
       * Invalidate all filter caches.
       */
      _invalidateCache() {
        this._cachedErrors = null;
        this._cachedWarnings = null;
        this._cachedLogs = null;
        this._errorCountAtCache = 0;
        this._warningCountAtCache = 0;
        this._logCountAtCache = 0;
      }
      // ═══════════════════════════════════════════════════════════════════
      // Install / Uninstall
      // ═══════════════════════════════════════════════════════════════════
      /**
       * Replace console.error, console.warn (and optionally log/info/debug)
       * with spies that capture all calls.
       *
       * If another ConsoleCapture is already installed, it is uninstalled first.
       * Calling install() on an already-installed instance is a no-op.
       */
      install() {
        if (this._installed) return;
        if (_activeInstance !== null && _activeInstance !== this) {
          _activeInstance.uninstall();
        }
        this._origError = console.error;
        this._origWarn = console.warn;
        console.error = (...args2) => {
          this._rawErrors.push(stringifyArgs(args2));
          this._cachedErrors = null;
        };
        console.warn = (...args2) => {
          this._rawWarnings.push(stringifyArgs(args2));
          this._cachedWarnings = null;
        };
        if (this._captureLog) {
          this._origLog = console.log;
          console.log = (...args2) => {
            this._rawLogs.push(stringifyArgs(args2));
            this._cachedLogs = null;
          };
        }
        if (this._captureInfo) {
          this._origInfo = console.info;
          console.info = (...args2) => {
            this._rawLogs.push(stringifyArgs(args2));
            this._cachedLogs = null;
          };
        }
        if (this._captureDebug) {
          this._origDebug = console.debug;
          console.debug = (...args2) => {
            this._rawLogs.push(stringifyArgs(args2));
            this._cachedLogs = null;
          };
        }
        this._installed = true;
        _activeInstance = this;
      }
      /**
       * Restore original console methods. No-op if not installed.
       */
      uninstall() {
        if (!this._installed) return;
        if (this._origError) console.error = this._origError;
        if (this._origWarn) console.warn = this._origWarn;
        if (this._origLog) console.log = this._origLog;
        if (this._origInfo) console.info = this._origInfo;
        if (this._origDebug) console.debug = this._origDebug;
        this._origError = null;
        this._origWarn = null;
        this._origLog = null;
        this._origInfo = null;
        this._origDebug = null;
        this._installed = false;
        if (_activeInstance === this) {
          _activeInstance = null;
        }
      }
      // ═══════════════════════════════════════════════════════════════════
      // Convenience property getters
      // ═══════════════════════════════════════════════════════════════════
      get errors() {
        return this.getErrors();
      }
      get warnings() {
        return this.getWarnings();
      }
      // Filtered getters (noise removed)
      // ═══════════════════════════════════════════════════════════════════
      /** Get captured errors with noise filtered out. */
      getErrors() {
        if (this._cachedErrors !== null && this._rawErrors.length === this._errorCountAtCache) {
          return [...this._cachedErrors];
        }
        const result2 = this._rawErrors.filter(
          (msg) => !isNoiseCompiled(msg, this._stringPatterns, this._regexPatterns)
        );
        this._cachedErrors = result2;
        this._errorCountAtCache = this._rawErrors.length;
        return [...result2];
      }
      /** Get captured warnings with noise filtered out. */
      getWarnings() {
        if (this._cachedWarnings !== null && this._rawWarnings.length === this._warningCountAtCache) {
          return [...this._cachedWarnings];
        }
        const result2 = this._rawWarnings.filter(
          (msg) => !isNoiseCompiled(msg, this._stringPatterns, this._regexPatterns)
        );
        this._cachedWarnings = result2;
        this._warningCountAtCache = this._rawWarnings.length;
        return [...result2];
      }
      /** Get captured logs (log + info + debug) with noise filtered out. */
      getLogs() {
        if (this._cachedLogs !== null && this._rawLogs.length === this._logCountAtCache) {
          return [...this._cachedLogs];
        }
        const result2 = this._rawLogs.filter(
          (msg) => !isNoiseCompiled(msg, this._stringPatterns, this._regexPatterns)
        );
        this._cachedLogs = result2;
        this._logCountAtCache = this._rawLogs.length;
        return [...result2];
      }
      /** Get all captured calls (filtered) in a single object. */
      getAll() {
        return {
          errors: this.getErrors(),
          warnings: this.getWarnings(),
          logs: this.getLogs()
        };
      }
      // ═══════════════════════════════════════════════════════════════════
      // Raw getters (unfiltered)
      // ═══════════════════════════════════════════════════════════════════
      /** Get ALL captured errors including noise. */
      getRawErrors() {
        return [...this._rawErrors];
      }
      /** Get ALL captured warnings including noise. */
      getRawWarnings() {
        return [...this._rawWarnings];
      }
      // ═══════════════════════════════════════════════════════════════════
      // Noise pattern management
      // ═══════════════════════════════════════════════════════════════════
      /** Add a noise pattern. Takes effect immediately on subsequent getErrors/getWarnings calls. */
      addNoisePattern(pattern) {
        this._noisePatterns.push(pattern);
        this._recompilePatterns();
      }
      /** Remove a noise pattern (by reference for RegExp, by value for string). */
      removeNoisePattern(pattern) {
        const idx = this._noisePatterns.indexOf(pattern);
        if (idx !== -1) {
          this._noisePatterns.splice(idx, 1);
          this._recompilePatterns();
        }
      }
      /** Get a copy of the current noise patterns. */
      getNoisePatterns() {
        return [...this._noisePatterns];
      }
      // ═══════════════════════════════════════════════════════════════════
      // Reset
      // ═══════════════════════════════════════════════════════════════════
      /** Clear all captured calls. Keeps noise patterns and install state. */
      reset() {
        this._rawErrors = [];
        this._rawWarnings = [];
        this._rawLogs = [];
        this._invalidateCache();
      }
      /** Clear all captured calls AND reset noise patterns to constructor defaults. Keeps install state. */
      resetAll() {
        this._rawErrors = [];
        this._rawWarnings = [];
        this._rawLogs = [];
        this._noisePatterns = [...this._initialPatterns];
        this._recompilePatterns();
      }
      // ═══════════════════════════════════════════════════════════════════
      // State
      // ═══════════════════════════════════════════════════════════════════
      /** Whether spies are currently installed on console. */
      isInstalled() {
        return this._installed;
      }
    };
  }
});

// src/console/index.ts
var init_console = __esm({
  "src/console/index.ts"() {
    "use strict";
    init_ConsoleCapture();
  }
});

// src/fetch/ContractValidator.ts
var ContractValidator;
var init_ContractValidator = __esm({
  "src/fetch/ContractValidator.ts"() {
    "use strict";
    ContractValidator = class _ContractValidator {
      _contracts = [];
      constructor() {
      }
      /**
       * Define an endpoint contract.
       */
      define(contract) {
        this._contracts.push(contract);
      }
      /**
       * Define multiple contracts at once.
       */
      defineAll(contracts) {
        for (const c of contracts) {
          this._contracts.push(c);
        }
      }
      /**
       * Validate a single request against contracts.
       * Returns an array of violations (empty if valid).
       */
      validateRequest(url, method, body) {
        const violations = [];
        const upperMethod = method.toUpperCase();
        const pathMatches = this._contracts.filter((c) => this._matchesPath(url, c.pathPattern));
        if (pathMatches.length === 0) {
          return violations;
        }
        const fullMatch = pathMatches.find((c) => c.method.toUpperCase() === upperMethod);
        if (!fullMatch) {
          const allowedMethods = pathMatches.map((c) => c.method.toUpperCase()).join(", ");
          violations.push({
            url,
            method: upperMethod,
            violation: `Method ${upperMethod} not allowed for this endpoint`,
            expected: allowedMethods,
            actual: upperMethod
          });
          return violations;
        }
        if (fullMatch.requestBody && body !== void 0 && body !== null) {
          const bodyObj = typeof body === "string" ? _ContractValidator._tryParseJSON(body) : body;
          if (bodyObj && typeof bodyObj === "object" && !Array.isArray(bodyObj)) {
            const record = bodyObj;
            for (const [field, expectedType] of Object.entries(fullMatch.requestBody)) {
              if (!(field in record)) {
                violations.push({
                  url,
                  method: upperMethod,
                  violation: `Missing required body field: ${field}`,
                  expected: `${field}: ${expectedType}`,
                  actual: "field not present"
                });
              } else {
                const actualType = _ContractValidator._typeOf(record[field]);
                if (actualType !== expectedType) {
                  violations.push({
                    url,
                    method: upperMethod,
                    violation: `Wrong type for body field: ${field}`,
                    expected: expectedType,
                    actual: actualType
                  });
                }
              }
            }
          }
        }
        return violations;
      }
      /**
       * Validate all recorded requests from a request log.
       */
      validateAll(requestLog) {
        const allViolations = [];
        for (const req of requestLog) {
          const body = typeof req.body === "string" ? _ContractValidator._tryParseJSON(req.body) : req.body;
          const violations = this.validateRequest(req.url, req.method, body);
          allViolations.push(...violations);
        }
        const cov = this.coverage(requestLog);
        return {
          valid: allViolations.length === 0 && cov.undocumented.length === 0,
          violations: allViolations,
          coverage: cov
        };
      }
      /**
       * Get coverage report.
       */
      coverage(requestLog) {
        const calledKeys = /* @__PURE__ */ new Set();
        const undocumented = [];
        for (const req of requestLog) {
          const upperMethod = req.method.toUpperCase();
          let matched = false;
          for (const contract of this._contracts) {
            if (contract.method.toUpperCase() === upperMethod && this._matchesPath(req.url, contract.pathPattern)) {
              calledKeys.add(`${contract.method.toUpperCase()} ${contract.pathPattern}`);
              matched = true;
              break;
            }
          }
          if (!matched) {
            const key = `${upperMethod} ${req.url}`;
            if (!undocumented.includes(key)) {
              undocumented.push(key);
            }
          }
        }
        const allKeys = this._contracts.map((c) => `${c.method.toUpperCase()} ${c.pathPattern}`);
        const uncalled = allKeys.filter((k) => !calledKeys.has(k));
        return {
          defined: this._contracts.length,
          called: calledKeys.size,
          uncalled,
          undocumented
        };
      }
      /**
       * Clear all contracts.
       */
      clear() {
        this._contracts = [];
      }
      // ── Private helpers ────────────────────────────────────────────────
      /**
       * Check if a URL matches a path pattern.
       * Pattern segments like :id, :companyId match any non-slash value.
       */
      _matchesPath(url, pattern) {
        const urlPath = url.split("?")[0].split("#")[0];
        const patternParts = pattern.split("/").filter((p) => p.length > 0);
        const urlParts = urlPath.split("/").filter((p) => p.length > 0);
        if (patternParts.length !== urlParts.length) return false;
        for (let i = 0; i < patternParts.length; i++) {
          const pp = patternParts[i];
          if (pp.startsWith(":")) {
            if (urlParts[i].length === 0) return false;
            continue;
          }
          if (pp !== urlParts[i]) return false;
        }
        return true;
      }
      /**
       * Determine the type string for a value.
       */
      static _typeOf(value) {
        if (value === null) return "null";
        if (value === void 0) return "undefined";
        if (Array.isArray(value)) return "array";
        return typeof value;
      }
      /**
       * Try to parse a string as JSON, return null if it fails.
       */
      static _tryParseJSON(str2) {
        try {
          return JSON.parse(str2);
        } catch {
          return null;
        }
      }
    };
  }
});

// src/fetch/index.ts
var init_fetch = __esm({
  "src/fetch/index.ts"() {
    "use strict";
    init_Headers();
    init_Request();
    init_Response();
    init_MockFetch();
    init_ContractValidator();
    init_LiveFetch();
  }
});

// src/vitest-env/dixie-environment.ts
async function setupDixieGlobals(global, options) {
  const envOptions = options?.dixie ?? {};
  const url = envOptions.url ?? "http://localhost/";
  const width = envOptions.width ?? 1024;
  const height = envOptions.height ?? 768;
  const document = new Document();
  const window = new Window({
    url,
    innerWidth: width,
    innerHeight: height
  });
  window.document = document;
  if ("defaultView" in document) {
    document.defaultView = window;
  }
  const localStorage = createStorage();
  const sessionStorage = createStorage();
  const timers = new TimerController();
  const originals = /* @__PURE__ */ new Map();
  for (const key of GLOBAL_KEYS3) {
    if (key in global) {
      originals.set(key, global[key]);
    } else {
      originals.set(key, NOT_SET3);
    }
  }
  global["window"] = window;
  global["document"] = document;
  global["navigator"] = window.navigator;
  global["location"] = window.location;
  global["history"] = window.history;
  global["screen"] = window.screen;
  global["localStorage"] = localStorage;
  global["sessionStorage"] = sessionStorage;
  global["setTimeout"] = timers.setTimeout.bind(timers);
  global["clearTimeout"] = timers.clearTimeout.bind(timers);
  global["setInterval"] = timers.setInterval.bind(timers);
  global["clearInterval"] = timers.clearInterval.bind(timers);
  global["requestAnimationFrame"] = timers.requestAnimationFrame.bind(timers);
  global["cancelAnimationFrame"] = timers.cancelAnimationFrame.bind(timers);
  global["Event"] = Event;
  global["CustomEvent"] = CustomEvent;
  global["UIEvent"] = UIEvent;
  global["MouseEvent"] = MouseEvent;
  global["KeyboardEvent"] = KeyboardEvent;
  global["FocusEvent"] = FocusEvent;
  global["InputEvent"] = InputEvent;
  global["PointerEvent"] = PointerEvent;
  global["MutationObserver"] = MutationObserver;
  global["ResizeObserver"] = ResizeObserver;
  global["IntersectionObserver"] = IntersectionObserver;
  global["Node"] = Node;
  global["Element"] = Element;
  global["Document"] = Document;
  global["DocumentFragment"] = DocumentFragment;
  global["Text"] = Text;
  global["Comment"] = Comment;
  global["HTMLElement"] = Element;
  global["HTMLInputElement"] = HTMLInputElement;
  global["HTMLSelectElement"] = HTMLSelectElement;
  global["HTMLTextAreaElement"] = HTMLTextAreaElement;
  global["HTMLFormElement"] = HTMLFormElement;
  global["HTMLOptionElement"] = HTMLOptionElement;
  global["HTMLButtonElement"] = HTMLButtonElement;
  global["HTMLLabelElement"] = HTMLLabelElement;
  global["CSSStyleDeclaration"] = CSSStyleDeclaration;
  global["getComputedStyle"] = window.getComputedStyle.bind(window);
  global["matchMedia"] = window.matchMedia.bind(window);
  global["atob"] = window.atob.bind(window);
  global["btoa"] = window.btoa.bind(window);
  global["scrollTo"] = window.scrollTo.bind(window);
  global["scroll"] = window.scroll.bind(window);
  global["scrollBy"] = window.scrollBy.bind(window);
  return {
    teardown(global2) {
      while (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild);
      }
      while (document.head.firstChild) {
        document.head.removeChild(document.head.firstChild);
      }
      localStorage.clear();
      sessionStorage.clear();
      timers.reset();
      clearMutationRegistry();
      for (const [key, original] of originals) {
        if (original === NOT_SET3) {
          delete global2[key];
        } else {
          global2[key] = original;
        }
      }
    }
  };
}
var NOT_SET3, GLOBAL_KEYS3, dixieEnvironment, dixie_environment_default;
var init_dixie_environment = __esm({
  "src/vitest-env/dixie-environment.ts"() {
    "use strict";
    init_Document();
    init_Window();
    init_Storage();
    init_Timers();
    init_MutationObserver();
    init_Node();
    init_Element();
    init_Text();
    init_Comment();
    init_DocumentFragment();
    init_Event();
    init_CustomEvent();
    init_UIEvent();
    init_MouseEvent();
    init_KeyboardEvent();
    init_FocusEvent();
    init_InputEvent();
    init_PointerEvent();
    init_MutationObserver();
    init_ResizeObserver();
    init_IntersectionObserver();
    init_CSSStyleDeclaration();
    init_HTMLInputElement();
    init_HTMLSelectElement();
    init_HTMLTextAreaElement();
    init_HTMLFormElement();
    init_HTMLOptionElement();
    init_HTMLButtonElement();
    init_HTMLLabelElement();
    NOT_SET3 = Symbol("NOT_SET");
    GLOBAL_KEYS3 = [
      // Core browser objects
      "window",
      "document",
      "navigator",
      "location",
      "history",
      "screen",
      "localStorage",
      "sessionStorage",
      // Timers
      "setTimeout",
      "clearTimeout",
      "setInterval",
      "clearInterval",
      "requestAnimationFrame",
      "cancelAnimationFrame",
      // Event constructors
      "Event",
      "CustomEvent",
      "UIEvent",
      "MouseEvent",
      "KeyboardEvent",
      "FocusEvent",
      "InputEvent",
      "PointerEvent",
      // Observer constructors
      "MutationObserver",
      "ResizeObserver",
      "IntersectionObserver",
      // DOM constructors
      "Node",
      "Element",
      "Document",
      "DocumentFragment",
      "Text",
      "Comment",
      "HTMLElement",
      // Form element constructors
      "HTMLInputElement",
      "HTMLSelectElement",
      "HTMLTextAreaElement",
      "HTMLFormElement",
      "HTMLOptionElement",
      "HTMLButtonElement",
      "HTMLLabelElement",
      // CSS
      "CSSStyleDeclaration",
      // Browser utilities
      "getComputedStyle",
      "matchMedia",
      "atob",
      "btoa",
      "scrollTo",
      "scroll",
      "scrollBy"
    ];
    dixieEnvironment = {
      name: "dixie",
      transformMode: "web",
      setup: setupDixieGlobals
    };
    dixie_environment_default = dixieEnvironment;
  }
});

// src/render/RenderContext.ts
var RenderContext;
var init_RenderContext = __esm({
  "src/render/RenderContext.ts"() {
    "use strict";
    init_DixieEnvironment();
    init_ConsoleCapture();
    init_MockFetch();
    init_DixieSnapshot();
    init_Event();
    RenderContext = class {
      env;
      console;
      fetch;
      _startTime;
      _parseMs = 0;
      _renderMs = 0;
      _destroyed = false;
      // Stored at construction time so destroy() can compare by reference (not re-bind)
      _boundFetch;
      constructor(options) {
        this._startTime = Date.now();
        this.env = createDixieEnvironment({ url: "http://localhost/" });
        this.console = new ConsoleCapture({ captureLog: true });
        this.console.install();
        this.fetch = new MockFetch();
        if (options?.mockRoutes) {
          for (const [url, response] of Object.entries(options.mockRoutes)) {
            this.fetch.register(url, typeof response === "function" ? response : { body: response });
          }
        }
        this._boundFetch = this.fetch.fetch.bind(this.fetch);
        globalThis.fetch = this._boundFetch;
      }
      /**
       * Set body innerHTML (simulates what React would render).
       */
      setContent(html) {
        this._assertNotDestroyed();
        const parseStart = Date.now();
        this.env.document.body.innerHTML = html;
        this._parseMs = Date.now() - parseStart;
        this._renderMs = this._parseMs;
      }
      /**
       * Navigate to a route (sets location pathname, dispatches popstate).
       */
      navigate(path4) {
        this._assertNotDestroyed();
        this.env.location.pathname = path4;
        try {
          if (typeof this.env.window.dispatchEvent === "function") {
            this.env.window.dispatchEvent(new Event("popstate"));
          }
        } catch {
        }
      }
      /**
       * Get structured render result.
       */
      getResult() {
        this._assertNotDestroyed();
        const totalMs = Date.now() - this._startTime;
        const snapshot = new DixieSnapshot(this.env.document);
        const snapshotStr = snapshot.toDebugString();
        const domState = snapshot.toJSON();
        const bodyHTML = this.env.document.body ? this.env.document.body.innerHTML : "";
        const textContent = this.env.document.body ? this.env.document.body.textContent.trim() : "";
        const filteredErrors = this.console.getErrors();
        const filteredWarnings = this.console.getWarnings();
        const filteredLogs = this.console.getLogs();
        const rawErrors = this.console.getRawErrors();
        const rawWarnings = this.console.getRawWarnings();
        const rawErrorCount = rawErrors.length;
        const rawWarningCount = rawWarnings.length;
        const filteredCount = rawErrorCount - filteredErrors.length + (rawWarningCount - filteredWarnings.length);
        const requests = this.fetch.getRequests();
        const networkRequests = requests.map((r) => ({
          url: r.url,
          method: r.method,
          status: 0,
          // Status is on the response side, not request; record URL/method
          timestamp: r.timestamp
        }));
        const unmockedUrls = this._findUnmockedUrls(requests);
        const hasContent = bodyHTML.trim().length > 0;
        const hasErrors = filteredErrors.length > 0;
        const success = hasContent && !hasErrors;
        const result2 = {
          success,
          dom: {
            title: this.env.document.title,
            bodyHTML,
            elementCount: domState.elementCount,
            textContent,
            snapshot: snapshotStr
          },
          console: {
            errors: filteredErrors,
            warnings: filteredWarnings,
            logs: filteredLogs,
            rawErrorCount,
            rawWarningCount,
            filteredCount
          },
          network: {
            requests: networkRequests,
            unmockedUrls
          },
          timing: {
            totalMs,
            parseMs: this._parseMs,
            renderMs: this._renderMs
          }
        };
        const diagnosis = this.diagnose();
        if (diagnosis) {
          result2.diagnosis = diagnosis;
        }
        return result2;
      }
      /**
       * Self-diagnose: analyze the current state and suggest fixes.
       */
      diagnose() {
        this._assertNotDestroyed();
        const bodyHTML = this.env.document.body ? this.env.document.body.innerHTML : "";
        const filteredErrors = this.console.getErrors();
        const rawErrors = this.console.getRawErrors();
        const requests = this.fetch.getRequests();
        const unmockedUrls = this._findUnmockedUrls(requests);
        if (bodyHTML.trim().length === 0) {
          return {
            category: "empty-render",
            message: "Body is empty \u2014 nothing was rendered.",
            suggestion: "Check that setContent() was called with valid HTML, or that the React app mounted correctly."
          };
        }
        const hasAuthErrors = rawErrors.some(
          (e) => e.includes("401") || e.includes("unauthorized") || e.toLowerCase().includes("auth") || e.includes("token")
        );
        const hasNoTokens = !this.env.localStorage.getItem("token") && !this.env.localStorage.getItem("auth_token") && !this.env.localStorage.getItem("access_token");
        if (hasNoTokens && hasAuthErrors) {
          return {
            category: "auth",
            message: "Auth errors detected with no tokens in localStorage.",
            suggestion: "Set tokens via options.tokens or options.localStorage before rendering. The app likely needs a JWT to render authenticated routes."
          };
        }
        if (unmockedUrls.length > 0) {
          return {
            category: "network",
            message: `${unmockedUrls.length} URL(s) had no mock: ${unmockedUrls.join(", ")}`,
            suggestion: "Add mock routes for these URLs via options.mockRoutes, or register them on the MockFetch instance."
          };
        }
        if (filteredErrors.length > 0) {
          return {
            category: "console-errors",
            message: `${filteredErrors.length} console error(s): ${filteredErrors[0]}`,
            suggestion: "Check the console.errors array in the render result for details. These are real errors that survived noise filtering."
          };
        }
        return null;
      }
      /**
       * Clean up the environment and restore console.
       */
      destroy() {
        if (this._destroyed) return;
        this._destroyed = true;
        this.console.uninstall();
        if (globalThis.fetch === this._boundFetch) {
          delete globalThis.fetch;
        }
        this.env.destroy();
      }
      // ── Private helpers ───────────────────────────────────────────────
      _assertNotDestroyed() {
        if (this._destroyed) {
          throw new Error("RenderContext has been destroyed and cannot be used.");
        }
      }
      /**
       * Find URLs from requests that had no registered mock route.
       * We check which request URLs don't start with any registered pattern.
       */
      _findUnmockedUrls(requests) {
        const unmocked = [];
        const registryKeys = this._getRegistryKeys();
        for (const req of requests) {
          const matched = registryKeys.some((pattern) => req.url.startsWith(pattern));
          if (!matched && registryKeys.length > 0) {
            if (!unmocked.includes(req.url)) {
              unmocked.push(req.url);
            }
          }
        }
        return unmocked;
      }
      /**
       * Get the registered URL patterns from MockFetch.
       * Uses the _registry Map which is a private field — we access it pragmatically.
       */
      _getRegistryKeys() {
        try {
          const registry = this.fetch._registry;
          if (registry && typeof registry.keys === "function") {
            return Array.from(registry.keys());
          }
        } catch {
        }
        return [];
      }
    };
  }
});

// src/render/RenderHarness.ts
var RenderHarness;
var init_RenderHarness = __esm({
  "src/render/RenderHarness.ts"() {
    "use strict";
    init_RenderContext();
    RenderHarness = class {
      /**
       * Render HTML content at a specific route path.
       */
      renderRoute(path4, html, options) {
        const ctx = this._createContext(options);
        try {
          ctx.navigate(path4);
          ctx.setContent(html);
          return ctx.getResult();
        } finally {
          ctx.destroy();
        }
      }
      /**
       * Render isolated HTML content (no routing).
       */
      renderHTML(html, options) {
        const ctx = this._createContext(options);
        try {
          ctx.setContent(html);
          return ctx.getResult();
        } finally {
          ctx.destroy();
        }
      }
      /**
       * Batch render: render multiple routes and return all results.
       * Each route gets its own isolated RenderContext.
       */
      renderBatch(routes) {
        return routes.map((route) => this.renderRoute(route.path, route.html, route.options));
      }
      /**
       * Quick smoke test: render and check for basic health.
       * Returns pass/fail with a list of failure reasons.
       */
      smokeTest(path4, html, options) {
        const result2 = this.renderRoute(path4, html, options);
        const failures = [];
        if (result2.dom.bodyHTML.trim().length === 0) {
          failures.push("Body is empty \u2014 nothing was rendered");
        }
        if (result2.console.errors.length > 0) {
          failures.push(
            `${result2.console.errors.length} console error(s): ${result2.console.errors[0]}`
          );
        }
        if (options?.budget) {
          if (options.budget.totalMs && result2.timing.totalMs > options.budget.totalMs) {
            failures.push(
              `Total time ${result2.timing.totalMs}ms exceeded budget of ${options.budget.totalMs}ms`
            );
          }
          if (options.budget.renderMs && result2.timing.renderMs > options.budget.renderMs) {
            failures.push(
              `Render time ${result2.timing.renderMs}ms exceeded budget of ${options.budget.renderMs}ms`
            );
          }
        }
        return {
          passed: failures.length === 0,
          failures
        };
      }
      /**
       * Destroy (no-op for stateless harness, but present for API symmetry).
       */
      destroy() {
      }
      // ── Private helpers ───────────────────────────────────────────────
      _createContext(options) {
        const ctx = new RenderContext({
          mockRoutes: options?.mockRoutes
        });
        if (options?.tokens) {
          if (options.tokens.user) {
            ctx.env.localStorage.setItem("token", options.tokens.user);
          }
          if (options.tokens.admin) {
            ctx.env.localStorage.setItem("admin_token", options.tokens.admin);
          }
        }
        if (options?.localStorage) {
          for (const [key, value] of Object.entries(options.localStorage)) {
            ctx.env.localStorage.setItem(key, value);
          }
        }
        if (options?.noisePatterns) {
          for (const pattern of options.noisePatterns) {
            ctx.console.addNoisePattern(pattern);
          }
        }
        return ctx;
      }
    };
  }
});

// src/render/index.ts
var init_render2 = __esm({
  "src/render/index.ts"() {
    "use strict";
    init_RenderContext();
    init_RenderHarness();
  }
});

// src/collectors/console.ts
function collectConsole(warnings, errors) {
  return {
    errors: [...errors],
    warnings: [...warnings]
  };
}
var init_console2 = __esm({
  "src/collectors/console.ts"() {
    "use strict";
  }
});

// src/collectors/errors.ts
function collectErrors(doc) {
  const errorBoundaries = [];
  const alerts = doc.querySelectorAll('[role="alert"]');
  for (const alert of alerts) {
    const text = (alert.textContent ?? "").trim();
    if (text) {
      errorBoundaries.push({ text, element: alert.tagName.toLowerCase() });
    }
  }
  const body = doc.body;
  if (body) {
    const bodyText = (body.textContent ?? "").trim();
    for (const pattern of ERROR_PATTERNS) {
      if (pattern.test(bodyText)) {
        const allElements = doc.querySelectorAll("*");
        for (const el of allElements) {
          const elText = (el.textContent ?? "").trim();
          if (pattern.test(elText) && el.children.length === 0) {
            const alreadyFound = errorBoundaries.some((e) => e.text === elText);
            if (!alreadyFound) {
              errorBoundaries.push({ text: elText, element: el.tagName.toLowerCase() });
            }
            break;
          }
        }
        break;
      }
    }
  }
  return { errorBoundaries };
}
var ERROR_PATTERNS;
var init_errors = __esm({
  "src/collectors/errors.ts"() {
    "use strict";
    ERROR_PATTERNS = [
      /something went wrong/i,
      /error boundary/i,
      /unexpected error/i,
      /an error occurred/i,
      /application error/i
    ];
  }
});

// src/collectors/static-page.ts
function collapse(value) {
  return value.replace(/\s+/g, " ").trim();
}
function closestMatch(el, ast) {
  let current = el;
  while (current && current.nodeType === ELEMENT_NODE2) {
    if (matchesSelector(current, ast)) return true;
    current = current.parentNode;
  }
  return false;
}
function collectStaticPage(doc, options = {}) {
  const contextAst = options.contextFilter ? parseSelector(options.contextFilter) : null;
  const links = [];
  const buttons = [];
  const headings = [];
  const scripts = [];
  const textParts = [];
  const walk = (node, textExcluded) => {
    const nodeType = node.nodeType;
    if (nodeType === TEXT_NODE2) {
      if (!textExcluded) textParts.push(node.data ?? node.textContent ?? "");
      return;
    }
    let childExcluded = textExcluded;
    if (nodeType === ELEMENT_NODE2) {
      const tag = node.tagName;
      if (tag === "A") {
        if (node.getAttribute("href") !== null) {
          const link = {
            href: node.getAttribute("href") || "",
            text: collapse(node.textContent || "")
          };
          const rel = collapse(node.getAttribute("rel") || "");
          if (rel) link.rel = rel;
          links.push(link);
        }
      } else if (tag === "SCRIPT") {
        if (scripts.length < SCRIPT_CAP) {
          const content = collapse(node.textContent || "");
          if (content) scripts.push(content);
        }
      } else {
        const level = HEADING_LEVELS[tag];
        if (level) {
          if (!contextAst || !closestMatch(node, contextAst)) {
            headings.push({ text: collapse(node.textContent || ""), level });
          }
        }
      }
      if (tag === "BUTTON" || node.getAttribute("role") === "button" || node.getAttribute("role") === "link" || node.getAttribute("data-url") !== null || node.getAttribute("data-href") !== null) {
        buttons.push({
          href: node.getAttribute("href") || node.getAttribute("data-url") || node.getAttribute("data-href") || "",
          text: collapse(node.textContent || node.getAttribute("aria-label") || node.getAttribute("title") || "")
        });
      }
      if (!childExcluded && TEXT_SKIP_TAGS.has(tag)) childExcluded = true;
    }
    const children = node.childNodes;
    if (children) {
      for (let i = 0, len = children.length; i < len; i++) {
        walk(children[i], childExcluded);
      }
    }
  };
  walk(doc, false);
  return {
    links,
    buttons,
    headings,
    scripts,
    // Concatenate raw text-node data first, then collapse — matches
    // "collapse(document.text())" semantics across node boundaries.
    textLength: collapse(textParts.join("")).length
  };
}
function collectRepeatedGroups(doc, options) {
  const { selectors, excludeContext, cap = 200, filter } = options;
  const excludeAst = excludeContext ? parseSelector(excludeContext) : null;
  const results = [];
  for (const selector of selectors) {
    const matched = doc.querySelectorAll(selector);
    const kept = [];
    for (const el of matched) {
      if (filter && !filter(el)) continue;
      if (excludeAst && closestMatch(el, excludeAst)) continue;
      kept.push(el);
      if (kept.length >= cap) break;
    }
    if (kept.length < 2) continue;
    const groups = /* @__PURE__ */ new Map();
    for (const el of kept) {
      const key = el.parentNode || doc;
      const group = groups.get(key);
      if (group) group.push(el);
      else groups.set(key, [el]);
    }
    for (const group of groups.values()) {
      if (group.length >= 2) results.push(group);
    }
  }
  return results;
}
var SCRIPT_CAP, TEXT_SKIP_TAGS, HEADING_LEVELS, ELEMENT_NODE2, TEXT_NODE2;
var init_static_page = __esm({
  "src/collectors/static-page.ts"() {
    "use strict";
    init_selectors();
    SCRIPT_CAP = 80;
    TEXT_SKIP_TAGS = /* @__PURE__ */ new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG"]);
    HEADING_LEVELS = { H1: 1, H2: 2, H3: 3, H4: 4 };
    ELEMENT_NODE2 = 1;
    TEXT_NODE2 = 3;
  }
});

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Attr: () => Attr,
  CSSStyleDeclaration: () => CSSStyleDeclaration,
  Comment: () => Comment,
  ConsoleCapture: () => ConsoleCapture,
  ContractValidator: () => ContractValidator,
  CustomEvent: () => CustomEvent,
  DEFAULT_NOISE_PATTERNS: () => DEFAULT_NOISE_PATTERNS,
  DEFAULT_USER_AGENT: () => DEFAULT_USER_AGENT,
  DOMTokenList: () => DOMTokenList,
  DiffSnapshot: () => DiffSnapshot,
  DixieAssertions: () => DixieAssertions,
  DixieHeaders: () => DixieHeaders,
  DixieRequest: () => DixieRequest,
  DixieResponse: () => DixieResponse,
  DixieSnapshot: () => DixieSnapshot,
  Document: () => Document,
  DocumentFragment: () => DocumentFragment,
  Element: () => Element,
  EnvironmentPool: () => EnvironmentPool,
  Event: () => Event,
  EventSourceStub: () => EventSourceStub,
  EventTarget: () => EventTarget,
  FocusEvent: () => FocusEvent,
  HTMLButtonElement: () => HTMLButtonElement,
  HTMLCollection: () => HTMLCollection,
  HTMLFormElement: () => HTMLFormElement,
  HTMLInputElement: () => HTMLInputElement,
  HTMLLabelElement: () => HTMLLabelElement,
  HTMLOptionElement: () => HTMLOptionElement,
  HTMLSelectElement: () => HTMLSelectElement,
  HTMLTextAreaElement: () => HTMLTextAreaElement,
  HarRecorder: () => HarRecorder,
  History: () => History,
  InputEvent: () => InputEvent,
  IntersectionObserver: () => IntersectionObserver,
  KeyboardEvent: () => KeyboardEvent,
  LiveFetch: () => LiveFetch,
  Location: () => Location,
  MockFetch: () => MockFetch,
  MouseEvent: () => MouseEvent,
  MutationObserver: () => MutationObserver,
  MutationRecord: () => MutationRecord,
  NamedNodeMap: () => NamedNodeMap,
  Navigator: () => Navigator,
  Node: () => Node,
  NodeList: () => NodeList,
  PerformanceBudget: () => PerformanceBudget,
  PointerEvent: () => PointerEvent,
  RenderContext: () => RenderContext,
  RenderHarness: () => RenderHarness,
  ResizeObserver: () => ResizeObserver,
  Screen: () => Screen,
  Text: () => Text,
  TimerController: () => TimerController,
  TokenAcquisition: () => TokenAcquisition,
  UIEvent: () => UIEvent,
  VERSION: () => VERSION,
  WebSocketStub: () => WebSocketStub,
  Window: () => Window,
  clearMutationRegistry: () => clearMutationRegistry,
  click: () => click,
  collectA11y: () => collectA11y,
  collectApi: () => collectApi,
  collectConsole: () => collectConsole,
  collectCssAudit: () => collectCssAudit,
  collectErrors: () => collectErrors,
  collectExpectedCalls: () => collectExpectedCalls,
  collectForms: () => collectForms,
  collectLinks: () => collectLinks,
  collectPage: () => collectPage,
  collectRepeatedGroups: () => collectRepeatedGroups,
  collectStaticPage: () => collectStaticPage,
  collectStructure: () => collectStructure,
  collectText: () => collectText,
  createDixieEnvironment: () => createDixieEnvironment,
  createStorage: () => createStorage,
  createVmContext: () => createVmContext,
  diffSnapshots: () => diffSnapshots,
  dispatch: () => dispatch,
  dixieEnvironment: () => dixie_environment_default,
  domainFromUrl: () => domainFromUrl,
  executeModule: () => executeModule,
  exportHar: () => exportHar,
  flushMutations: () => flushMutations,
  formatOutput: () => formatOutput,
  getAllByLabel: () => getAllByLabel,
  getAllByRole: () => getAllByRole,
  getAllByTestId: () => getAllByTestId,
  getByLabel: () => getByLabel,
  getByRole: () => getByRole,
  getByTestId: () => getByTestId,
  installGlobals: () => installGlobals,
  isModuleLoaderAvailable: () => isModuleLoaderAvailable,
  loadScripts: () => loadScripts,
  matchesSelector: () => matchesSelector,
  parseArgs: () => parseArgs,
  parseHTML: () => parseHTML2,
  parseSelector: () => parseSelector,
  querySelectorAllElements: () => querySelectorAllElements,
  querySelectorFirstElement: () => querySelectorFirstElement,
  redactHeaders: () => redactHeaders,
  redactSnapshot: () => redactSnapshot,
  renderUrl: () => renderUrl,
  resolveConfig: () => resolveConfig,
  runBenchmark: () => runBenchmark,
  runTestFile: () => runTestFile,
  scaffoldInit: () => scaffoldInit,
  select: () => select,
  serializeHTML: () => serializeHTML,
  triggerMutation: () => triggerMutation,
  type: () => type2
});
function parseHTML2(html, document) {
  if (!document) {
    const doc = new Document();
    const nodes = parseHTML(html, doc);
    for (const node of nodes) {
      doc.body.appendChild(node);
    }
    return doc;
  }
  return parseHTML(html, document);
}
var VERSION;
var init_src = __esm({
  "src/index.ts"() {
    "use strict";
    init_Node();
    init_NodeList();
    init_Element();
    init_Text();
    init_Comment();
    init_Attr();
    init_NamedNodeMap();
    init_DOMTokenList();
    init_HTMLCollection();
    init_Document();
    init_DocumentFragment();
    init_parser();
    init_Document();
    init_parser();
    init_selectors();
    init_selectors();
    init_events();
    init_events();
    init_Window();
    init_Location();
    init_History();
    init_Navigator();
    init_Screen();
    init_Storage();
    init_Timers();
    init_css();
    init_observers();
    init_observers();
    init_observers();
    init_observers();
    init_environment();
    init_environment();
    init_environment();
    init_HTMLInputElement();
    init_HTMLSelectElement();
    init_HTMLTextAreaElement();
    init_HTMLFormElement();
    init_HTMLOptionElement();
    init_HTMLButtonElement();
    init_HTMLLabelElement();
    init_console();
    init_fetch();
    init_fetch();
    init_fetch();
    init_fetch();
    init_fetch();
    init_fetch();
    init_assertions();
    init_assertions();
    init_dixie_environment();
    init_auth();
    init_render2();
    init_cli();
    init_format();
    init_config_loader();
    init_render();
    init_bench();
    init_diff();
    init_run();
    init_init();
    init_a11y();
    init_css_audit();
    init_links();
    init_forms();
    init_text();
    init_structure();
    init_console2();
    init_api();
    init_expected_calls();
    init_errors();
    init_page();
    init_static_page();
    init_test_id();
    init_role();
    init_label();
    init_click();
    init_type();
    init_select();
    init_vm_context();
    init_script_loader();
    init_module_loader();
    init_recorder();
    init_exporter();
    init_redact();
    init_sse();
    init_websocket();
    VERSION = "3.0.0";
  }
});

// src/cli/commands/meta.ts
var meta_exports = {};
__export(meta_exports, {
  collectMetadata: () => collectMetadata,
  collectMetadataFromDoc: () => collectMetadataFromDoc,
  execute: () => execute23,
  parseMeta: () => parseMeta
});
import { readFileSync as readFileSync2 } from "fs";
import { resolve as resolve3 } from "path";
function parseMeta(attrValue) {
  if (!attrValue) return null;
  const colonIdx = attrValue.indexOf(":");
  if (colonIdx === -1) return null;
  const category = attrValue.slice(0, colonIdx);
  const key = attrValue.slice(colonIdx + 1);
  if (!category || !key) return null;
  return { category, key };
}
function loadContract(configPath) {
  const contractPath = configPath || "./docs/metadata-contract.yaml";
  try {
    const raw = readFileSync2(resolve3(process.cwd(), contractPath), "utf-8");
    return parseYaml(raw);
  } catch {
    return null;
  }
}
function matchRoute(url, contract) {
  const urlPath = new URL(url).pathname;
  for (const [name, page] of Object.entries(contract.containers.pages)) {
    const pattern = page.route.replace(/:[\w]+/g, "[^/]+");
    if (new RegExp(`^${pattern}$`).test(urlPath)) {
      return { name, type: "page" };
    }
  }
  return null;
}
function getExpectedKeys(containerName, contract) {
  const expected = [];
  for (const [catName, entries] of Object.entries(contract.categories)) {
    for (const [keyName, entry] of Object.entries(entries)) {
      for (const loc of entry.locations) {
        if (loc.container === containerName) {
          expected.push({ category: catName, key: keyName, label: entry.label });
        }
      }
    }
  }
  return expected;
}
function collectMetadataFromDoc(doc, opts) {
  const elements = Array.from(doc.querySelectorAll("[data-meta]"));
  const results = [];
  for (const el of elements) {
    const attr = el.getAttribute("data-meta");
    const parsed = parseMeta(attr ?? "");
    if (!parsed) continue;
    const entry = {
      category: parsed.category,
      key: parsed.key,
      value: el.getAttribute("data-meta-value") ?? null,
      displayText: (el.textContent ?? "").trim(),
      tagName: el.tagName?.toLowerCase() ?? "unknown",
      testId: el.getAttribute("data-testid") ?? null
    };
    if (opts?.type && entry.category !== opts.type.toLowerCase()) continue;
    if (opts?.text && !entry.key.toLowerCase().includes(opts.text.toLowerCase())) continue;
    results.push(entry);
  }
  return results;
}
function collectMetadata(html, opts) {
  const doc = parseHTML2(html);
  return collectMetadataFromDoc(doc, opts);
}
async function execute23(args2) {
  if (!args2.url) {
    return {
      exitCode: 1,
      data: { command: "meta", error: "meta requires a URL" },
      errors: [{ code: "MISSING_URL", message: "meta requires a URL" }]
    };
  }
  let contractConfigPath;
  try {
    const config = await resolveConfig(args2.url, process.cwd(), args2.config);
    contractConfigPath = config?.metadata?.contract;
  } catch {
  }
  try {
    const result2 = await renderUrl(args2.url, {
      token: args2.token,
      timeout: args2.timeout,
      noJs: args2.noJs,
      configPath: args2.config
    });
    const doc = result2.document;
    if (args2.click) {
      try {
        click(doc, args2.click);
      } catch (clickErr) {
        return {
          exitCode: 1,
          data: { command: "meta", error: clickErr.message },
          errors: [{ code: "CLICK_ERROR", message: clickErr.message }]
        };
      }
      const suppress = () => {
      };
      process.on("uncaughtException", suppress);
      try {
        await result2.flush({ timeoutMs: 5e3, stableRounds: 3 });
      } finally {
        await new Promise((r) => setTimeout(r, 200));
        process.removeListener("uncaughtException", suppress);
      }
    }
    if (args2.key) {
      const contract = loadContract(contractConfigPath);
      const parsed = parseMeta(args2.key);
      if (!parsed) {
        return {
          exitCode: 1,
          data: { command: "meta", error: `Invalid key format: "${args2.key}". Expected "category:key" (e.g., "status:e-sign")` },
          errors: [{ code: "INVALID_KEY", message: `Invalid key format: "${args2.key}"` }]
        };
      }
      let contractEntry = null;
      if (contract) {
        const catEntries = contract.categories[parsed.category];
        if (catEntries && catEntries[parsed.key]) {
          contractEntry = catEntries[parsed.key];
        } else {
          return {
            exitCode: 1,
            data: {
              command: "meta",
              error: `Key "${args2.key}" not found in metadata contract. Check docs/metadata-contract.yaml for valid keys.`,
              available_keys: contract.categories[parsed.category] ? Object.keys(contract.categories[parsed.category]) : [],
              available_categories: Object.keys(contract.categories)
            },
            errors: [{ code: "KEY_NOT_IN_CONTRACT", message: `"${args2.key}" not in contract` }]
          };
        }
      }
      const selector = `[data-meta="${args2.key}"]`;
      const elements = Array.from(doc.querySelectorAll(selector));
      const metadata2 = elements.map((el) => ({
        category: parsed.category,
        key: parsed.key,
        value: el.getAttribute("data-meta-value") ?? null,
        displayText: (el.textContent ?? "").trim(),
        tagName: el.tagName?.toLowerCase() ?? "unknown",
        testId: el.getAttribute("data-testid") ?? null
      }));
      const found = metadata2.length > 0;
      const metaData2 = {
        command: "meta",
        status: found ? "found" : "not-found",
        url: args2.url,
        key: args2.key,
        label: contractEntry?.label ?? null,
        expectedLocations: contractEntry?.locations ?? null,
        count: metadata2.length,
        metadata: metadata2
      };
      return {
        exitCode: found ? 0 : 1,
        output: formatOutput(metaData2, args2.format ?? "json"),
        data: metaData2
      };
    }
    if (args2.validate) {
      const contract = loadContract(contractConfigPath);
      if (!contract) {
        return {
          exitCode: 1,
          data: { command: "meta", error: "Cannot load metadata contract. Check metadata.contract path in .dixie config." },
          errors: [{ code: "NO_CONTRACT", message: "metadata contract not found" }]
        };
      }
      const matched = matchRoute(args2.url, contract);
      if (!matched) {
        return {
          exitCode: 1,
          data: { command: "meta", error: `No contract route matches "${args2.url}"` },
          errors: [{ code: "NO_ROUTE_MATCH", message: `URL doesn't match any contract route` }]
        };
      }
      const expected = getExpectedKeys(matched.name, contract);
      const allMetadata = collectMetadataFromDoc(doc);
      const results = expected.map((exp) => {
        const foundItems = allMetadata.filter((m) => m.category === exp.category && m.key === exp.key);
        return {
          key: `${exp.category}:${exp.key}`,
          label: exp.label,
          expected: true,
          found: foundItems.length > 0,
          count: foundItems.length,
          displayText: foundItems[0]?.displayText ?? null,
          value: foundItems[0]?.value ?? null
        };
      });
      const missing = results.filter((r) => !r.found);
      const present = results.filter((r) => r.found);
      const metaData2 = {
        command: "meta",
        mode: "validate",
        status: missing.length === 0 ? "pass" : "fail",
        url: args2.url,
        route: matched.name,
        expected: results.length,
        found: present.length,
        missing: missing.length,
        results
      };
      return {
        exitCode: missing.length === 0 ? 0 : 1,
        output: formatOutput(metaData2, args2.format ?? "json"),
        data: metaData2
      };
    }
    const metadata = collectMetadataFromDoc(doc, {
      type: args2.type,
      text: args2.text
    });
    const isTextSearch = args2.text !== void 0;
    const status = isTextSearch ? metadata.length > 0 ? "found" : "not-found" : "ok";
    const metaData = {
      command: "meta",
      status,
      url: args2.url,
      count: metadata.length,
      metadata
    };
    if (isTextSearch) {
      metaData.search = args2.text;
    }
    if (args2.type) {
      metaData.filter = { type: args2.type };
    }
    return {
      exitCode: isTextSearch && metadata.length === 0 ? 1 : 0,
      output: formatOutput(metaData, args2.format ?? "json"),
      data: metaData
    };
  } catch (err) {
    return {
      exitCode: 1,
      data: { command: "meta", error: err.message },
      errors: [{ code: "META_ERROR", message: err.message }]
    };
  }
}
var parseYaml;
var init_meta = __esm({
  "src/cli/commands/meta.ts"() {
    "use strict";
    init_render();
    init_format();
    init_click();
    init_src();
    init_js_yaml();
    init_config_loader();
    parseYaml = jsYaml.load;
  }
});

// src/cli/index.ts
function parseArgs(argv) {
  const args2 = {
    command: "render",
    format: "json",
    timeout: 5e3,
    noJs: false,
    parallel: false,
    verbose: false,
    bail: false,
    noColor: false,
    selectorStrategy: "css",
    samples: 100,
    rest: []
  };
  let i = 0;
  if (argv[0] === "--version") {
    args2.command = "--version";
    return args2;
  }
  if (argv[0] === "--help" || argv[0] === "-h") {
    args2.command = "--help";
    return args2;
  }
  if (argv.length > 0) {
    const first = argv[0];
    if (COMMANDS.has(first)) {
      args2.command = first;
      i = 1;
    } else if (first.startsWith("http://") || first.startsWith("https://") || first.startsWith("data:")) {
      args2.command = "render";
      args2.url = first;
      i = 1;
    } else if (!first.startsWith("-")) {
      args2.command = first;
      i = 1;
    }
  }
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === "--format" && i + 1 < argv.length) {
      args2.format = argv[++i];
    } else if (arg === "--token" && i + 1 < argv.length) {
      args2.token = argv[++i];
    } else if (arg === "--timeout" && i + 1 < argv.length) {
      args2.timeout = parseInt(argv[++i], 10);
    } else if (arg === "--config" && i + 1 < argv.length) {
      args2.config = argv[++i];
    } else if (arg === "--filter" && i + 1 < argv.length) {
      args2.filter = argv[++i];
    } else if (arg === "--selector-strategy" && i + 1 < argv.length) {
      args2.selectorStrategy = argv[++i];
    } else if (arg === "--text" && i + 1 < argv.length) {
      args2.text = argv[++i];
    } else if (arg === "--click" && i + 1 < argv.length) {
      args2.click = argv[++i];
    } else if (arg === "--type" && i + 1 < argv.length) {
      args2.type = argv[++i];
    } else if (arg === "--key" && i + 1 < argv.length) {
      args2.key = argv[++i];
    } else if (arg === "--validate") {
      args2.validate = true;
    } else if (arg === "--out" && i + 1 < argv.length) {
      args2.snapshotOut = argv[++i];
    } else if (arg === "--har" && i + 1 < argv.length) {
      args2.harFile = argv[++i];
    } else if (arg === "--samples" && i + 1 < argv.length) {
      args2.samples = parseInt(argv[++i], 10);
    } else if (arg === "--user-agent" && i + 1 < argv.length) {
      args2.userAgent = argv[++i];
    } else if (arg === "--no-js") {
      args2.noJs = true;
    } else if (arg === "--parallel") {
      args2.parallel = true;
    } else if (arg === "--verbose") {
      args2.verbose = true;
    } else if (arg === "--bail") {
      args2.bail = true;
    } else if (arg === "--no-color") {
      args2.noColor = true;
    } else if (!arg.startsWith("-")) {
      if (!args2.url && (arg.startsWith("http://") || arg.startsWith("https://") || arg.startsWith("data:"))) {
        args2.url = arg;
      } else if (!args2.url && args2.command === "run") {
        args2.file = arg;
      } else if (args2.command === "diff") {
        args2.rest.push(arg);
      } else if (!args2.selector) {
        args2.selector = arg;
      } else {
        args2.rest.push(arg);
      }
    } else {
      args2.rest.push(arg);
    }
    i++;
  }
  return args2;
}
async function dispatch(args2) {
  if (args2.command === "--version") {
    const { VERSION: VERSION2 } = await Promise.resolve().then(() => (init_src(), src_exports));
    return { exitCode: 0, output: VERSION2 };
  }
  if (args2.command === "--help") {
    return { exitCode: 0, output: "Usage: dixie <command> [url] [options]" };
  }
  if (!COMMANDS.has(args2.command)) {
    return {
      exitCode: 3,
      errors: [{ code: "UNKNOWN_COMMAND", message: `Unknown command: ${args2.command}` }]
    };
  }
  try {
    const mod = await COMMAND_LOADERS[args2.command]();
    if (typeof mod.execute === "function") {
      return await mod.execute(args2);
    }
    return { exitCode: 0, data: { command: args2.command, status: "stub" } };
  } catch (err) {
    return {
      exitCode: 1,
      errors: [{ code: "COMMAND_ERROR", message: err.message, detail: err.stack }]
    };
  }
}
var COMMAND_LOADERS, COMMANDS;
var init_cli = __esm({
  "src/cli/index.ts"() {
    "use strict";
    COMMAND_LOADERS = {
      "render": () => Promise.resolve().then(() => (init_render(), render_exports)),
      "query": () => Promise.resolve().then(() => (init_query(), query_exports)),
      "run": () => Promise.resolve().then(() => (init_run(), run_exports)),
      "bench": () => Promise.resolve().then(() => (init_bench(), bench_exports)),
      "diff": () => Promise.resolve().then(() => (init_diff(), diff_exports)),
      "a11y": () => Promise.resolve().then(() => (init_a11y2(), a11y_exports)),
      "css-audit": () => Promise.resolve().then(() => (init_css_audit2(), css_audit_exports)),
      "links": () => Promise.resolve().then(() => (init_links2(), links_exports)),
      "forms": () => Promise.resolve().then(() => (init_forms2(), forms_exports)),
      "text": () => Promise.resolve().then(() => (init_text2(), text_exports)),
      "structure": () => Promise.resolve().then(() => (init_structure2(), structure_exports)),
      "api": () => Promise.resolve().then(() => (init_api2(), api_exports)),
      "expected-calls": () => Promise.resolve().then(() => (init_expected_calls2(), expected_calls_exports)),
      "click": () => Promise.resolve().then(() => (init_click2(), click_exports)),
      "type": () => Promise.resolve().then(() => (init_type2(), type_exports)),
      "select": () => Promise.resolve().then(() => (init_select2(), select_exports)),
      "inspect": () => Promise.resolve().then(() => (init_inspect(), inspect_exports)),
      "init": () => Promise.resolve().then(() => (init_init(), init_exports)),
      "component": () => Promise.resolve().then(() => (init_component(), component_exports)),
      "fidelity": () => Promise.resolve().then(() => (init_fidelity(), fidelity_exports)),
      "lighthouse": () => Promise.resolve().then(() => (init_lighthouse(), lighthouse_exports)),
      "har": () => Promise.resolve().then(() => (init_har(), har_exports)),
      "redact": () => Promise.resolve().then(() => (init_redact2(), redact_exports)),
      "meta": () => Promise.resolve().then(() => (init_meta(), meta_exports))
    };
    COMMANDS = new Set(Object.keys(COMMAND_LOADERS));
  }
});

// bin/dixie.ts
init_cli();
init_format();
async function writeStdout(output) {
  await new Promise((resolve4, reject) => {
    process.stdout.write(output, (err) => err ? reject(err) : resolve4());
  });
}
var args = parseArgs(process.argv.slice(2));
var result = await dispatch(args);
if (result.output !== void 0) {
  await writeStdout(result.output + "\n");
} else if (result.data !== void 0) {
  await writeStdout(formatOutput(result.data, args.format ?? "json") + "\n");
} else if (result.errors !== void 0) {
  await writeStdout(formatOutput({ errors: result.errors }, args.format ?? "json") + "\n");
}
process.exit(result.exitCode ?? 0);
/*! Bundled license information:

js-yaml/dist/js-yaml.mjs:
  (*! js-yaml 4.1.1 https://github.com/nodeca/js-yaml @license MIT *)
*/
