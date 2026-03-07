export interface ExpectedCallsResult {
  missing: string[];
  pass: boolean;
}

export function collectExpectedCalls(
  actual: Array<{ method: string; url: string }>,
  expected: string[],
): ExpectedCallsResult {
  const missing: string[] = [];

  for (const exp of expected) {
    const [expMethod, ...pathParts] = exp.split(' ');
    const expPath = pathParts.join(' ');

    const found = actual.some(call => {
      const actualPath = call.url.split('?')[0];
      return call.method === expMethod && actualPath.startsWith(expPath);
    });

    if (!found) {
      missing.push(exp);
    }
  }

  return { missing, pass: missing.length === 0 };
}
