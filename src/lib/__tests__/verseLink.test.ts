import { describe, it, expect } from 'vitest';
import { parseRef, verseUrl, splitCitations } from '../verseLink';

describe('splitCitations', () => {
  it('linkifies plain-text scripture citations, leaving other text alone', () => {
    const parts = splitCitations('Dust and breath. First anchor. (Genesis 2:7)');
    const linked = parts.filter((p) => p.url);
    expect(linked).toHaveLength(1);
    expect(linked[0].text).toBe('Genesis 2:7');
    expect(linked[0].url).toContain('Genesis%202%3A7');
    // the surrounding text is preserved as plain parts
    expect(parts.map((p) => p.text).join('')).toBe('Dust and breath. First anchor. (Genesis 2:7)');
  });

  it('handles a chapter-only citation and multiple verses', () => {
    expect(splitCitations('per Hebrews 4, still ongoing').some((p) => p.text === 'Hebrews 4' && p.url)).toBe(true);
    expect(splitCitations('Genesis 2:2, 3 stated').some((p) => p.text === 'Genesis 2:2, 3' && p.url)).toBe(true);
  });

  it('leaves text with no citation untouched', () => {
    const parts = splitCitations('Work and boundaries before sin.');
    expect(parts).toHaveLength(1);
    expect(parts[0].url).toBeUndefined();
  });
});

describe('verse references', () => {
  it('parses book + chapter + verse', () => {
    expect(parseRef('ge3-15')?.label).toBe('Genesis 3:15');
    expect(parseRef('re4-11')?.label).toBe('Revelation 4:11');
    expect(parseRef('1co15-45')?.label).toBe('1 Corinthians 15:45');
    expect(parseRef('col1-15')?.label).toBe('Colossians 1:15');
  });

  it('parses a whole-chapter reference (no verse)', () => {
    expect(parseRef('isa11')?.label).toBe('Isaiah 11');
  });

  it('handles single-chapter books and both Galatians abbreviations', () => {
    expect(parseRef('jude14')?.label).toBe('Jude 14');
    expect(parseRef('ga3-16')?.label).toBe('Galatians 3:16');
    expect(parseRef('gal3-16')?.label).toBe('Galatians 3:16');
  });

  it('returns null for unknown books or malformed codes', () => {
    expect(parseRef('xx1-1')).toBeNull();
    expect(parseRef('notacode')).toBeNull();
  });

  it('builds an NWT online-reader URL for a known ref, null otherwise', () => {
    expect(verseUrl('ge3-15')).toBe('https://wol.jw.org/en/wol/l/r1/lp-e?q=Genesis%203%3A15');
    expect(verseUrl('xx9-9')).toBeNull();
  });
});
