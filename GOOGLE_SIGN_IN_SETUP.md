# Google Sign-In setup (Tou2 app account)

The app's own account (sync/subscription) can be signed into with a Google
account already on the Android device, via Android Credential Manager
("Sign in with Google"). The code is in place; the flow does **not** work
until the external configuration below is completed, and it has **not**
been verified on a physical device yet.

Scope note: this is the **app account** (Supabase). Signing in to YouTube
itself still happens in the WebView, exactly as before — that flow is
unchanged, and no YouTube/Google password is ever typed into the app.

## 1. Google Cloud project

1. Create (or reuse) a Google Cloud project and configure the OAuth
   consent screen (app name "Tou2", user support email, developer contact).
   For testing, add your Google account as a test user; for production,
   publish the consent screen.
2. In **APIs & Services → Credentials**, create an **OAuth client ID**
   of type **Web application**. Note its client ID and client secret.
   This is the "Web client ID" used below.
3. In the same section, create an **OAuth client ID** of type
   **Android** for each signing certificate the app will use:
   - package name: `com.souvikpati.souviktube`
   - SHA-1 certificate fingerprint of the signing certificate.
   - Debug builds use the debug keystore, typically
     `~/.android/debug.keystore` (alias `androiddebugkey`, passwords
     `android`):
     `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`
   - For a release build, use the SHA-1 of the release keystore instead
     (and add a second Android client if both certificates are used).
   Without a matching Android client, Credential Manager returns no
   credential and the app reports "no credential" — this is the most
   common setup failure.

## 2. Supabase

1. In the Supabase dashboard for the project at
   `pgukcvgypvjwtibzlvhr.supabase.co`, open **Authentication →
   Providers → Google** and enable it.
2. Enter the **Web application** client ID and client secret from step 1.
3. Save. No code change is needed: the app calls
   `supabase.auth.signInWithIdToken({ provider: 'google', ... })`, and
   Supabase validates the ID token against Google's keys. The same
   nonce is sent to Credential Manager and to Supabase to bind the
   token to one attempt.

## 3. App configuration

Set the environment variable used at build time:

```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<the Web application client ID>
```

If it is unset, the sign-in button fails fast with a "not configured"
error instead of opening the account selector. Do not commit the client
secret anywhere in the app or repository — the secret lives only in the
Supabase dashboard.

## 4. Verify on a device

1. Build and install a debug APK from the `tou2-rebrand` branch (or a
   later build from `main` after merge).
2. Open Settings → Sync while signed out and tap **Sign in with
   Google**.
3. Expected: the system account selector lists the device's Google
   accounts; picking one signs the app account in and the Sync screen
   shows the account email and plan.
4. Failure modes and what they mean:
   - Selector dismissed with no message: the user cancelled — intended.
   - "No credential": no Google account on the device, or the Android
     OAuth client / SHA-1 in step 1 does not match the installed APK's
     certificate.
   - "Google Play services unavailable": the device lacks current Play
     services; the web magic-link login remains available as fallback.
   - Network error: connectivity; retry.
   - "Not configured": `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` was not set
     at build time.
5. Returning users: the Supabase session is persisted and refreshed
   exactly like the existing magic-link session, so a signed-in user
   stays signed in across restarts without re-picking an account.

## Permissions

No new Android permission is required: Credential Manager runs through
Google Play services. The existing `INTERNET` permission covers the
Supabase token exchange. No Google password, browser cookie, or OAuth
refresh token is collected, stored, or logged by the app.
