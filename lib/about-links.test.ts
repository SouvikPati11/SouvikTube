import { describe, expect, test } from 'bun:test'
import { ABOUT_SOCIAL_LINKS, INSTAGRAM_URL } from './about-links'

// The About screen renders exactly ABOUT_SOCIAL_LINKS, so these tests pin
// the section's content: Instagram only, and none of the removed links.
describe('about social links', () => {
  test('lists the Instagram profile', () => {
    expect(ABOUT_SOCIAL_LINKS).toEqual([{ title: 'Instagram', href: INSTAGRAM_URL }])
    expect(INSTAGRAM_URL).toBe('https://www.instagram.com/souvikpatiofficial')
  })

  test('contains none of the removed links', () => {
    const removed = [
      'https://github.com/nonbili/NouTube',
      'https://github.com/sponsors/rnons',
      'https://liberapay.com/rnons',
      'https://paypal.me/rnons',
    ]
    for (const link of ABOUT_SOCIAL_LINKS) {
      expect(removed).not.toContain(link.href)
    }
  })
})
