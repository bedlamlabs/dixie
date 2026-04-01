/**
 * Navigator — provides browser/device identity and capability stubs.
 *
 * Returns a realistic Chrome user agent by default so websites serve
 * standard content. Provides sensible defaults for all commonly-checked
 * navigator properties. Clipboard and mediaDevices are minimal async stubs.
 */

export const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export class Navigator {
  readonly userAgent: string = DEFAULT_USER_AGENT;
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
