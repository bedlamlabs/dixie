import type { HarRecorder } from './recorder';

export interface HarLog {
  log: {
    version: string;
    creator: { name: string; version: string };
    entries: ReturnType<HarRecorder['getEntries']>;
  };
}

export function exportHar(recorder: HarRecorder): HarLog {
  return {
    log: {
      version: '1.2',
      creator: {
        name: 'Dixie',
        version: '3.0.0',
      },
      entries: recorder.getEntries(),
    },
  };
}
