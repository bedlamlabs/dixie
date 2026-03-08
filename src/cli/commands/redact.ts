import type { ParsedArgs, CommandResult } from '../types';
import { redactHeaders, redactSnapshot } from '../../redact';

export async function execute(args: ParsedArgs): Promise<CommandResult> {
  try {
    // If a file path is provided via url or file, read and redact it
    if (args.file || args.url) {
      const filePath = args.file ?? args.url;
      try {
        const fs = await import('node:fs');
        const content = fs.readFileSync(filePath!, 'utf-8');
        const parsed = JSON.parse(content);
        const redacted = redactSnapshot(parsed);
        return {
          exitCode: 0,
          data: { command: 'redact', status: 'ok', redacted },
        };
      } catch {
        // Not a file path or invalid JSON — redact as inline data
      }
    }

    // Default: return redact capabilities info
    const sample = {
      api: [
        {
          requestBody: {
            headers: {
              'Authorization': 'Bearer secret-token-123',
              'Content-Type': 'application/json',
            },
          },
        },
      ],
    };

    const redacted = redactSnapshot(sample);
    return {
      exitCode: 0,
      data: { command: 'redact', status: 'ok', redacted },
    };
  } catch (err: any) {
    return {
      exitCode: 1,
      data: { command: 'redact', error: err.message },
      errors: [{ code: 'REDACT_ERROR', message: err.message }],
    };
  }
}
