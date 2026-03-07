/**
 * Tests for interactive surface discovery in journey benchmarks.
 * Covers acceptance criteria 3: "Journey benchmark must discover all 18 interactive surfaces."
 */
import { describe, it, expect, vi } from 'vitest';
import { Document, Element, MouseEvent } from '../src';

// Helper: simulate a DOM with nested interactive surfaces
function createAppWithNestedSurfaces(): Document {
  const doc = new Document();

  doc.body.innerHTML = `
    <div id="app">
      <nav>
        <a id="nav-projects" href="/projects">Projects</a>
        <a id="nav-clients" href="/clients">Clients</a>
        <button id="btn-new">New Project</button>
      </nav>
      <table id="project-list">
        <tr id="row-1" data-clickable="true"><td>Project Alpha</td></tr>
        <tr id="row-2" data-clickable="true"><td>Project Beta</td></tr>
        <tr id="row-3" data-clickable="true"><td>Project Gamma</td></tr>
      </table>
    </div>
  `;

  // Simulate: clicking row-1 reveals a slideout with MORE interactive elements
  const row1 = doc.getElementById('row-1')!;
  row1.addEventListener('click', () => {
    const slideout = doc.createElement('div');
    slideout.id = 'slideout';
    slideout.innerHTML = `
      <button id="slideout-edit">Edit</button>
      <button id="slideout-delete">Delete</button>
      <a id="slideout-link" href="/project/1">View Details</a>
    `;
    doc.body.appendChild(slideout);
  });

  return doc;
}

describe('surface discovery — Element.click() enables nested discovery', () => {
  it('clicking a row dispatches real MouseEvent that triggers DOM mutation', () => {
    const doc = createAppWithNestedSurfaces();
    const row1 = doc.getElementById('row-1')!;

    expect(doc.getElementById('slideout')).toBeNull();

    row1.click();

    const slideout = doc.getElementById('slideout');
    expect(slideout).not.toBeNull();
    expect(doc.getElementById('slideout-edit')).not.toBeNull();
    expect(doc.getElementById('slideout-delete')).not.toBeNull();
    expect(doc.getElementById('slideout-link')).not.toBeNull();
  });

  it('nested surfaces are discoverable after click reveals them', () => {
    const doc = createAppWithNestedSurfaces();

    const initialButtons = doc.querySelectorAll('button');
    const initialLinks = doc.querySelectorAll('a');
    const initialRows = doc.querySelectorAll('tr[data-clickable]');

    const initialCount = initialButtons.length + initialLinks.length + initialRows.length;
    expect(initialCount).toBe(6);

    const row1 = doc.getElementById('row-1')!;
    row1.click();

    const afterButtons = doc.querySelectorAll('button');
    const afterLinks = doc.querySelectorAll('a');
    const afterRows = doc.querySelectorAll('tr[data-clickable]');

    const afterCount = afterButtons.length + afterLinks.length + afterRows.length;
    expect(afterCount).toBe(9);
    expect(afterCount).toBeGreaterThan(initialCount);
  });

  it('multiple row clicks each reveal their own surfaces', () => {
    const doc = new Document();
    doc.body.innerHTML = `
      <table>
        <tr id="r1" data-clickable="true"><td>Row 1</td></tr>
        <tr id="r2" data-clickable="true"><td>Row 2</td></tr>
      </table>
    `;

    doc.getElementById('r1')!.addEventListener('click', () => {
      const el = doc.createElement('div');
      el.id = 'surface-from-r1';
      el.innerHTML = '<button id="btn-r1">Action 1</button>';
      doc.body.appendChild(el);
    });

    doc.getElementById('r2')!.addEventListener('click', () => {
      const el = doc.createElement('div');
      el.id = 'surface-from-r2';
      el.innerHTML = '<button id="btn-r2">Action 2</button>';
      doc.body.appendChild(el);
    });

    doc.getElementById('r1')!.click();
    doc.getElementById('r2')!.click();

    expect(doc.getElementById('btn-r1')).not.toBeNull();
    expect(doc.getElementById('btn-r2')).not.toBeNull();
  });

  it('click events bubble from child to parent (enabling row click via cell)', () => {
    const doc = new Document();
    doc.body.innerHTML = `<table><tr id="row"><td id="cell">Data</td></tr></table>`;

    const discovered: string[] = [];
    doc.getElementById('row')!.addEventListener('click', () => {
      discovered.push('row-clicked');
    });

    doc.getElementById('cell')!.click();

    expect(discovered).toContain('row-clicked');
  });

  it('click on anchor element dispatches all three events', () => {
    const doc = new Document();
    doc.body.innerHTML = '<a id="link" href="/test">Link</a>';
    const link = doc.getElementById('link')!;

    const events: string[] = [];
    link.addEventListener('mousedown', () => events.push('mousedown'));
    link.addEventListener('mouseup', () => events.push('mouseup'));
    link.addEventListener('click', () => events.push('click'));

    link.click();

    expect(events).toEqual(['mousedown', 'mouseup', 'click']);
  });
});
