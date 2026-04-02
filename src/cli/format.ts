import yaml from 'js-yaml';

export function formatOutput(data: any, format: string, color = process.stdout?.isTTY ?? false): string {
  switch (format) {
    case 'json': {
      const json = JSON.stringify(data, null, 2);
      return color ? colorizeJson(json) : json;
    }

    case 'yaml':
      return yaml.dump(data, { noRefs: true, lineWidth: -1 });

    case 'markdown':
      return toMarkdownTable(data);

    case 'csv':
      return toCsv(data);

    default:
      throw new Error(`Unknown format: ${format}. Supported: json, yaml, markdown, csv`);
  }
}

function toMarkdownTable(data: any): string {
  if (Array.isArray(data)) {
    if (data.length === 0) return '(empty)\n';
    const keys = Object.keys(data[0]);
    const header = `| ${keys.join(' | ')} |`;
    const separator = `| ${keys.map(() => '---').join(' | ')} |`;
    const rows = data.map(row => `| ${keys.map(k => String(row[k] ?? '')).join(' | ')} |`);
    return [header, separator, ...rows].join('\n') + '\n';
  }

  // Object → key-value table
  const entries = flattenObject(data);
  const header = '| Key | Value |';
  const separator = '| --- | --- |';
  const rows = entries.map(([k, v]) => `| ${k} | ${String(v)} |`);
  return [header, separator, ...rows].join('\n') + '\n';
}

function toCsv(data: any): string {
  if (Array.isArray(data)) {
    if (data.length === 0) return '';
    const keys = Object.keys(data[0]);
    const header = keys.map(csvEscape).join(',');
    const rows = data.map(row => keys.map(k => csvEscape(String(row[k] ?? ''))).join(','));
    return [header, ...rows].join('\n') + '\n';
  }

  // Object → flatten to rows
  const entries = flattenObject(data);
  const header = 'key,value';
  const rows = entries.map(([k, v]) => `${csvEscape(k)},${csvEscape(String(v))}`);
  return [header, ...rows].join('\n') + '\n';
}

function csvEscape(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

// jq-style JSON syntax highlighting for TTY output
function colorizeJson(json: string): string {
  const RESET = '\x1b[0m';
  const KEY = '\x1b[1;34m';     // bold blue — keys
  const STRING = '\x1b[32m';    // green — string values
  const NUMBER = '\x1b[33m';    // yellow — numbers
  const BOOL = '\x1b[35m';      // magenta — true/false/null
  const BRACE = '\x1b[2m';      // dim — {} []
  const COLON = '\x1b[2m';      // dim — : ,

  return json.replace(
    /("(?:\\.|[^"\\])*")\s*(:)?|(\b(?:true|false|null)\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}\[\]])|([,:])/g,
    (match, str, colon, bool, num, brace, punct) => {
      if (str && colon) return `${KEY}${str}${RESET}${COLON}:${RESET}`;
      if (str) return `${STRING}${str}${RESET}`;
      if (bool) return `${BOOL}${bool}${RESET}`;
      if (num) return `${NUMBER}${num}${RESET}`;
      if (brace) return `${BRACE}${brace}${RESET}`;
      if (punct) return `${COLON}${punct}${RESET}`;
      return match;
    }
  );
}

function flattenObject(obj: any, prefix = ''): [string, any][] {
  const entries: [string, any][] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      entries.push(...flattenObject(value, path));
    } else if (Array.isArray(value)) {
      entries.push([path, JSON.stringify(value)]);
    } else {
      entries.push([path, value]);
    }
  }
  return entries;
}
