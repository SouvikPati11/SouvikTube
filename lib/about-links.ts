// Social links shown on the About screen. This is the single source of truth
// for the section: the About screen renders exactly this list, so removing a
// link here removes it from the UI. Previously listed donation links
// (GitHub Sponsors, Liberapay, PayPal) and the upstream GitHub repository
// link were deliberately removed; do not re-add them here without a product
// decision, as they point at the upstream author's accounts, not this app's.

export const INSTAGRAM_URL = 'https://www.instagram.com/souvikpatiofficial'

export type AboutSocialLink = {
  title: string
  href: string
}

export const ABOUT_SOCIAL_LINKS: AboutSocialLink[] = [
  { title: 'Instagram', href: INSTAGRAM_URL },
]
