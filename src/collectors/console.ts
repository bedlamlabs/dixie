export interface ConsoleResult {
  errors: string[];
  warnings: string[];
}

export function collectConsole(warnings: string[], errors: string[]): ConsoleResult {
  return {
    errors: [...errors],
    warnings: [...warnings],
  };
}
