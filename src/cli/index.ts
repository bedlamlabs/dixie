import type { ParsedArgs, CommandResult } from './types';

const COMMANDS = new Set([
  'render', 'query', 'run', 'bench', 'diff', 'a11y', 'css-audit',
  'links', 'forms', 'text', 'structure', 'api', 'expected-calls',
  'click', 'type', 'select', 'inspect', 'init', 'component',
  'fidelity', 'lighthouse', 'har', 'redact',
]);

export function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {
    command: 'render',
    format: 'json',
    timeout: 5000,
    noJs: false,
    parallel: false,
    verbose: false,
    bail: false,
    noColor: false,
    selectorStrategy: 'css',
    rest: [],
  };

  let i = 0;

  // Check for --version / --help first
  if (argv[0] === '--version') {
    args.command = '--version';
    return args;
  }
  if (argv[0] === '--help' || argv[0] === '-h') {
    args.command = '--help';
    return args;
  }

  // First positional: command or URL
  if (argv.length > 0) {
    const first = argv[0];
    if (COMMANDS.has(first)) {
      args.command = first;
      i = 1;
    } else if (first.startsWith('http://') || first.startsWith('https://') || first.startsWith('data:')) {
      args.command = 'render';
      args.url = first;
      i = 1;
    } else if (!first.startsWith('-')) {
      // Unknown command — set it so dispatch can reject
      args.command = first;
      i = 1;
    }
  }

  // Parse remaining positional and flags
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === '--format' && i + 1 < argv.length) {
      args.format = argv[++i] as any;
    } else if (arg === '--token' && i + 1 < argv.length) {
      args.token = argv[++i];
    } else if (arg === '--timeout' && i + 1 < argv.length) {
      args.timeout = parseInt(argv[++i], 10);
    } else if (arg === '--config' && i + 1 < argv.length) {
      args.config = argv[++i];
    } else if (arg === '--filter' && i + 1 < argv.length) {
      args.filter = argv[++i];
    } else if (arg === '--selector-strategy' && i + 1 < argv.length) {
      args.selectorStrategy = argv[++i] as any;
    } else if (arg === '--text' && i + 1 < argv.length) {
      args.text = argv[++i];
    } else if (arg === '--no-js') {
      args.noJs = true;
    } else if (arg === '--parallel') {
      args.parallel = true;
    } else if (arg === '--verbose') {
      args.verbose = true;
    } else if (arg === '--bail') {
      args.bail = true;
    } else if (arg === '--no-color') {
      args.noColor = true;
    } else if (!arg.startsWith('-')) {
      // Positional arg
      if (!args.url && (arg.startsWith('http://') || arg.startsWith('https://') || arg.startsWith('data:'))) {
        args.url = arg;
      } else if (!args.url && args.command === 'run') {
        args.file = arg;
      } else if (!args.selector) {
        args.selector = arg;
      } else {
        args.rest.push(arg);
      }
    } else {
      args.rest.push(arg);
    }
    i++;
  }

  return args;
}

export async function dispatch(args: ParsedArgs): Promise<CommandResult> {
  if (args.command === '--version') {
    const { VERSION } = await import('../index');
    return { exitCode: 0, output: VERSION };
  }

  if (args.command === '--help') {
    return { exitCode: 0, output: 'Usage: dixie <command> [url] [options]' };
  }

  if (!COMMANDS.has(args.command)) {
    return {
      exitCode: 3,
      errors: [{ code: 'UNKNOWN_COMMAND', message: `Unknown command: ${args.command}` }],
    };
  }

  // Dynamic import of command handler
  try {
    const mod = await import(`./commands/${args.command}`);
    if (typeof mod.execute === 'function') {
      return await mod.execute(args);
    }
    return { exitCode: 0, data: { command: args.command, status: 'stub' } };
  } catch (err: any) {
    return {
      exitCode: 1,
      errors: [{ code: 'COMMAND_ERROR', message: err.message, detail: err.stack }],
    };
  }
}
