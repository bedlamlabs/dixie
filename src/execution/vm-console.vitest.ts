import { describe, expect, it, vi } from 'vitest';
import { renderUrl } from '../cli/commands/render';

describe('VM console isolation', () => {
  it('does not forward page console output to the host process', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const html = `
      <html><body>
        <script>
          console.log('stdout noise');
          console.warn('stderr noise');
          console.error('stderr error noise');
          document.body.setAttribute('data-script-ran', 'yes');
        </script>
      </body></html>
    `;

    try {
      const result = await renderUrl(`data:text/html,${encodeURIComponent(html)}`, { timeout: 1000 });

      expect(result.document.body.getAttribute('data-script-ran')).toBe('yes');
      expect(logSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    } finally {
      logSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });
});

