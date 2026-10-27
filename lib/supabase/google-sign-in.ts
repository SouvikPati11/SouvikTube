// Sign in to the app's Supabase account with a Google account that already
// exists on the device, via Android Credential Manager ("Sign in with
// Google"). This is the APP account (sync/subscription), not the YouTube
// session: YouTube sign-in still happens in the WebView and is untouched.
//
// Flow (Android only):
//   1. The native module shows the system credential selector for the
//      device's Google accounts and returns a Google ID token. No password
//      is ever typed into the app, read from the browser, or handled here.
//   2. The ID token (plus a one-time nonce) is exchanged with Supabase via
//      signInWithIdToken. Supabase validates the token against Google's
//      keys; the app never validates Google credentials itself.
//   3. The resulting Supabase session is stored and restored exactly like
//      the existing magic-link session (see MainPage's onAuthStateChange).
//
// Configuration required before this works (see GOOGLE_SIGN_IN_SETUP.md):
//   - EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: the OAuth "Web application"
//     client ID from Google Cloud, registered in Supabase's Google provider.
//   - A Google Cloud Android OAuth client for this app's signing
//     certificate(s), otherwise Credential Manager returns no credential.
//
// The native call is resolved lazily so unit tests can import the pure
// helpers (error classification, nonce) without a native runtime.

import { supabase } from './client'

export type GoogleSignInErrorKind =
  | 'cancelled'
  | 'no-credential'
  | 'unavailable'
  | 'network'
  | 'not-configured'
  | 'unknown'

export class GoogleSignInError extends Error {
  readonly kind: GoogleSignInErrorKind

  constructor(kind: GoogleSignInErrorKind, message: string) {
    super(message)
    this.kind = kind
  }
}

// The native side throws Errors whose messages start with one of these
// prefixes (see NouTubeViewModule.kt). Classify anything else by content so
// a wrapped or reworded native error still maps to the right UX.
export function classifyGoogleSignInError(error: unknown): GoogleSignInErrorKind {
  const message = (error instanceof Error ? error.message : String(error ?? '')).toLowerCase()
  if (message.includes('google_sign_in_cancelled') || message.includes('cancel')) return 'cancelled'
  if (message.includes('google_sign_in_no_credential') || message.includes('no credential')) return 'no-credential'
  if (message.includes('google_sign_in_not_configured') || message.includes('not configured')) return 'not-configured'
  if (
    message.includes('google_sign_in_unavailable') ||
    message.includes('play services') ||
    message.includes('provider configuration')
  ) return 'unavailable'
  if (message.includes('google_sign_in_network') || message.includes('network') || message.includes('timeout')) return 'network'
  return 'unknown'
}

// One-time value bound to the ID token request and the Supabase exchange so
// a captured token cannot be replayed in a different session. This is not a
// secret; randomness only needs to make it unpredictable per attempt.
export function makeGoogleSignInNonce(): string {
  const random = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  return `${Date.now().toString(36)}-${random}`
}

type NativeGoogleSignIn = (serverClientId: string, nonce: string) => Promise<string>

function getNativeSignIn(): NativeGoogleSignIn {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@/modules/nou-tube-view').default as {
    signInWithGoogle?: NativeGoogleSignIn
  }
  if (typeof mod.signInWithGoogle !== 'function') {
    throw new GoogleSignInError(
      'unavailable',
      'Google sign-in is not available in this build (native Credential Manager bridge missing).',
    )
  }
  return mod.signInWithGoogle
}

export async function signInWithGoogle(): Promise<void> {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
  if (!webClientId) {
    throw new GoogleSignInError(
      'not-configured',
      'Google sign-in is not configured: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not set. See GOOGLE_SIGN_IN_SETUP.md.',
    )
  }
  const nonce = makeGoogleSignInNonce()
  let idToken: string
  try {
    idToken = await getNativeSignIn()(webClientId, nonce)
  } catch (error) {
    if (error instanceof GoogleSignInError) throw error
    throw new GoogleSignInError(classifyGoogleSignInError(error), error instanceof Error ? error.message : String(error))
  }
  if (!idToken) {
    throw new GoogleSignInError('unknown', 'Google sign-in returned no ID token.')
  }
  const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken, nonce })
  if (error) {
    throw new GoogleSignInError(classifyGoogleSignInError(error), error.message)
  }
}
