import { describe, expect, it } from 'vitest';
import { sanitizeHtml } from '../sanitize';

describe('sanitizeHtml', () => {
  it('strips script tags and event-handler attributes while keeping safe markup', () => {
    const result = sanitizeHtml('<p onclick="alert(1)" class="ok">hi</p><script>evil()</script>');

    expect(result).toContain('class="ok"');
    expect(result).toContain('hi');
    expect(result).not.toContain('onclick');
    expect(result).not.toContain('<script');
  });

  it('neutralizes javascript: hrefs but keeps normal links', () => {
    const result = sanitizeHtml('<a href="javascript:evil()">bad</a><a href="/episode/ep2">ok</a>');

    expect(result).not.toContain('javascript:');
    expect(result).toContain('href="/episode/ep2"');
  });
});
