import { describe, expect, it } from 'vitest';
import { extractRefs } from '../refs';

describe('extractRefs', () => {
  it('extracts ref/label pairs from ref spans in the section html', () => {
    const html =
      '<p>In <span class="ref" data-ref="ge1-1">Genesis 1:1</span> we read of the beginning, ' +
      'echoed later in <span class="ref" data-ref="joh1-1">John 1:1-3</span>.</p>';

    const result = extractRefs(html);

    expect(result).toEqual([
      { ref: 'ge1-1', label: 'Genesis 1:1' },
      { ref: 'joh1-1', label: 'John 1:1-3' },
    ]);
  });

  it('dedupes repeated refs, keeping the first occurrence', () => {
    const html =
      '<span class="ref" data-ref="ge1-2">Genesis 1:2</span>' +
      '<span class="ref" data-ref="ge1-2">Genesis 1:2 (again)</span>';

    const result = extractRefs(html);

    expect(result).toEqual([{ ref: 'ge1-2', label: 'Genesis 1:2' }]);
  });

  it('returns an empty array when there are no ref spans', () => {
    expect(extractRefs('<p>No references here.</p>')).toEqual([]);
  });
});
