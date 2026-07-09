import type { ParsedArgs, CommandResult } from './types';

// Literal import specifiers per command — bundlers cannot resolve
// runtime-computed `import('./commands/' + name)` paths, which broke the
// single-file build. Commands stay lazily loaded (fast startup).
const COMMAND_LOADERS: Record<string, () => Promise<any>> = {
  'render': () => import('./commands/render'),
  'query': () => import('./commands/query'),
  'run': () => import('./commands/run'),
  'bench': () => import('./commands/bench'),
  'diff': () => import('./commands/diff'),
  'a11y': () => import('./commands/a11y'),
  'css-audit': () => import('./commands/css-audit'),
  'links': () => import('./commands/links'),
  'forms': () => import('./commands/forms'),
  'text': () => import('./commands/text'),
  'structure': () => import('./commands/structure'),
  'api': () => import('./commands/api'),
  'expected-calls': () => import('./commands/expected-calls'),
  'click': () => import('./commands/click'),
  'type': () => import('./commands/type'),
  'select': () => import('./commands/select'),
  'inspect': () => import('./commands/inspect'),
  'init': () => import('./commands/init'),
  'component': () => import('./commands/component'),
  'fidelity': () => import('./commands/fidelity'),
  'lighthouse': () => import('./commands/lighthouse'),
  'har': () => import('./commands/har'),
  'redact': () => import('./commands/redact'),
  'meta': () => import('./commands/meta'),
};

const COMMANDS = new Set(Object.keys(COMMAND_LOADERS));

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
    samples: 100,
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
    } else if (arg === '--click' && i + 1 < argv.length) {
      args.click = argv[++i];
    } else if (arg === '--type' && i + 1 < argv.length) {
      args.type = argv[++i];
    } else if (arg === '--key' && i + 1 < argv.length) {
      args.key = argv[++i];
    } else if (arg === '--validate') {
      args.validate = true;
    } else if (arg === '--out' && i + 1 < argv.length) {
      args.snapshotOut = argv[++i];
    } else if (arg === '--har' && i + 1 < argv.length) {
      args.harFile = argv[++i];
    } else if (arg === '--samples' && i + 1 < argv.length) {
      args.samples = parseInt(argv[++i], 10);
    } else if (arg === '--user-agent' && i + 1 < argv.length) {
      args.userAgent = argv[++i];
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
      } else if (args.command === 'diff') {
        // diff takes two file path positionals — route both to rest, not selector
        args.rest.push(arg);
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

  // Load through COMMAND_LOADERS — literal specifiers, bundler-safe.
  try {
    const mod = await COMMAND_LOADERS[args.command]();
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
