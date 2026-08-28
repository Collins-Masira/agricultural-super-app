import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown'

describe('renderMarkdown', () => {
  it('renders plain text as a paragraph', () => {
    const html = renderMarkdown('Hello farmers, welcome to the community.')
    expect(html).toContain('<p>Hello farmers, welcome to the community.</p>')
  })

  it('renders multiple paragraphs separated by a blank line', () => {
    const html = renderMarkdown('First paragraph.\n\nSecond paragraph.')
    expect(html).toContain('<p>First paragraph.</p>')
    expect(html).toContain('<p>Second paragraph.</p>')
  })

  it('renders a single line break within a paragraph', () => {
    const html = renderMarkdown('Line one\nLine two')
    expect(html).toContain('<br>')
  })

  it('renders bold text', () => {
    const html = renderMarkdown('**Clear Debris and Weeds**')
    expect(html).toContain('<strong>Clear Debris and Weeds</strong>')
  })

  it('renders italic text', () => {
    const html = renderMarkdown('*important*')
    expect(html).toContain('<em>important</em>')
  })

  it('renders an ATX heading', () => {
    const html = renderMarkdown('# Clear Debris and Weeds')
    expect(html).toContain('<h1>Clear Debris and Weeds</h1>')
  })

  it('renders a bullet list', () => {
    const html = renderMarkdown('* Remove rocks.\n* Remove weeds.')
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>Remove rocks.</li>')
    expect(html).toContain('<li>Remove weeds.</li>')
  })

  it('renders a numbered list', () => {
    const html = renderMarkdown('1. Dig into the ground.\n2. Break up compacted areas.')
    expect(html).toContain('<ol>')
    expect(html).toContain('<li>Dig into the ground.</li>')
  })

  it('renders a markdown link with safe target and rel attributes', () => {
    const html = renderMarkdown('[Example website](https://example.com)')
    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('autolinks a bare URL', () => {
    const html = renderMarkdown('Visit https://example.com for details.')
    expect(html).toContain('href="https://example.com"')
  })

  it('renders the full worked example with headings, bullets, and numbered steps', () => {
    const input = [
      '**Clear Debris and Weeds**',
      '',
      '* Remove all rocks, sticks, and large roots that can block plant growth.',
      '* Pull out visible weeds completely.',
      '',
      '**Loosen and Aerate the Soil**',
      '',
      '1. Dig into the ground using a garden fork or shovel.',
      '2. Break large dirt clumps into smaller pieces.',
    ].join('\n')

    const html = renderMarkdown(input)

    expect(html).toContain('<strong>Clear Debris and Weeds</strong>')
    expect(html).toContain('<strong>Loosen and Aerate the Soil</strong>')
    expect(html).toContain('<ul>')
    expect(html).toContain('<ol>')
    expect(html).toContain('Remove all rocks, sticks, and large roots that can block plant growth.')
    expect(html).toContain('Dig into the ground using a garden fork or shovel.')
  })

  it('strips script tags entirely', () => {
    const html = renderMarkdown('Hello <script>alert("xss")</script> world')
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('alert(')
  })

  it('strips inline event handler attributes', () => {
    const html = renderMarkdown('<img src=x onerror="alert(1)">')
    expect(html).not.toContain('onerror')
    expect(html).not.toContain('<img')
  })

  it('strips javascript: URLs from links', () => {
    const html = renderMarkdown('[click me](javascript:alert(1))')
    expect(html).not.toContain('javascript:')
  })

  it('strips disallowed tags like iframe', () => {
    const html = renderMarkdown('<iframe src="https://evil.example"></iframe>')
    expect(html).not.toContain('<iframe')
  })

  it('handles empty content without throwing', () => {
    expect(() => renderMarkdown('')).not.toThrow()
    expect(() => renderMarkdown(undefined)).not.toThrow()
    expect(() => renderMarkdown(null)).not.toThrow()
  })
})
