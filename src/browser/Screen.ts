/**
 * Screen — models the display properties of the browser screen.
 *
 * Provides sensible defaults (1920x1080, 24-bit color) that match
 * a typical desktop environment. All properties are read-only in
 * real browsers but we allow construction-time overrides for testing.
 */

export interface ScreenOptions {
  width?: number;
  height?: number;
  availWidth?: number;
  availHeight?: number;
  colorDepth?: number;
  pixelDepth?: number;
}

export class Screen {
  readonly width: number;
  readonly height: number;
  readonly availWidth: number;
  readonly availHeight: number;
  readonly colorDepth: number;
  readonly pixelDepth: number;
  readonly orientation: { type: string; angle: number };

  constructor(options?: ScreenOptions) {
    this.width = options?.width ?? 1920;
    this.height = options?.height ?? 1080;
    this.availWidth = options?.availWidth ?? this.width;
    this.availHeight = options?.availHeight ?? this.height;
    this.colorDepth = options?.colorDepth ?? 24;
    this.pixelDepth = options?.pixelDepth ?? 24;
    this.orientation = { type: 'landscape-primary', angle: 0 };
  }
}
