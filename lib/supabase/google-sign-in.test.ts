import { describe, expect, test } from 'bun:test'
import {
  classifyGoogleSignInError,
  GoogleSignInError,
  makeGoogleSignInNonce,
  signInWithGoogle,
} from './google-sign-in'

describe('classifyGoogleSignInError', () => {
  test('maps native prefixes and message text', () => {
    expect(classifyGoogleSignInError(new Error('GOOGLE_SIGN_IN_CANCELLED: x'))).toBe('cancelled')
    expect(classifyGoogleSignInError(new Error('User cancelled'))).toBe('cancelled')
    expect(classifyGoogleSignInError(new Error('GOOGLE_SIGN_IN_NO_CREDENTIAL: x'))).toBe('no-credential')
    expect(classifyGoogleSignInError(new Error('GOOGLE_SIGN_IN_NOT_CONFIGURED: x'))).toBe('not-configured')
    expect(classifyGoogleSignInError(new Error('GOOGLE_SIGN_IN_UNAVAILABLE: x'))).toBe('unavailable')
    expect(classifyGoogleSignInError(new Error('Google Play services unavailable'))).toBe('unavailable')
    expect(classifyGoogleSignInError(new Error('GOOGLE_SIGN_IN_NETWORK: x'))).toBe('network')
    expect(classifyGoogleSignInError(new Error('Network timeout'))).toBe('network')
    expect(classifyGoogleSignInError(new Error('something else entirely'))).toBe('unknown')
    expect(classifyGoogleSignInError(undefined)).toBe('unknown')
  })
})

describe('makeGoogleSignInNonce', () => {
  test('is unique per call and non-empty', () => {
    const a = makeGoogleSignInNonce()
    const b = makeGoogleSignInNonce()
    expect(a.length).toBeGreaterThan(10)
    expect(a).not.toBe(b)
  })
})

describe('signInWithGoogle configuration guard', () => {
  test('fails fast as not-configured when no web client ID is set', async () => {
    const previous = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
    delete process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
    let caught: unknown
    try {
      await signInWithGoogle()
    } catch (error) {
      caught = error
    } finally {
      if (previous !== undefined) process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = previous
    }
    expect(caught instanceof GoogleSignInError && caught.kind === 'not-configured').toBe(true)
  })
})
