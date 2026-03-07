/**
 * Navigator — provides browser/device identity and capability stubs.
 *
 * Returns Dixie-specific user agent and sensible defaults for all
 * commonly-checked navigator properties. Clipboard and mediaDevices
 * are minimal async stubs.
 */

export class Navigator {
  readonly userAgent: string = 'Dixie/0.1.0';
  readonly language: string = 'en-US';
  readonly languages: readonly string[] = ['en-US', 'en'];
  readonly platform: string = 'Dixie';
  readonly onLine: boolean = true;
  readonly cookieEnabled: boolean = true;
  readonly hardwareConcurrency: number = 1;
  readonly maxTouchPoints: number = 0;

  readonly clipboard: {
    readText(): Promise<string>;
    writeText(text: string): Promise<void>;
  };

  readonly mediaDevices: {
    enumerateDevices(): Promise<never[]>;
  };

  private _clipboardText: string = '';

  constructor() {
    // Clipboard stub — stores text in memory
    this.clipboard = {
      readText: () => Promise.resolve(this._clipboardText),
      writeText: (text: string) => {
        this._clipboardText = text;
        return Promise.resolve();
      },
    };

    // MediaDevices stub
    this.mediaDevices = {
      enumerateDevices: () => Promise.resolve([]),
    };
  }
}
