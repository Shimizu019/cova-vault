# Android release signing — Cova Vault

Android replaces an installed app with a new APK only when **all three** of these
match:

| Requirement | Cova Vault value |
| ----------- | ---------------- |
| applicationId | `com.cova.vault` (never change it) |
| versionCode | strictly greater than the installed build |
| signing certificate | identical to the installed build |

If any one of them differs, Android reports the app already exists /
`INSTALL_FAILED_UPDATE_INCOMPATIBLE` and the install is refused.

## Why releases used to fail to update

The release workflow used to compile `assembleDebug`. A debug build is signed
with the Android debug keystore, which the SDK generates **fresh on every
machine and every CI run**. So every released APK had a different certificate,
and Android could never treat a new download as an update.

## Required GitHub secrets

Add these four repository secrets (Settings → Secrets and variables → Actions).
Nothing secret is stored in the repository.

| Secret | Contents |
| ------ | -------- |
| `ANDROID_KEYSTORE_BASE64` | the release keystore file, base64 encoded |
| `ANDROID_KEYSTORE_PASSWORD` | keystore password |
| `ANDROID_KEY_ALIAS` | key alias |
| `ANDROID_KEY_PASSWORD` | key password (often the same as the keystore password) |

Repository **variable** (Settings → Secrets and variables → Actions →
Variables) — also required; the workflow fails *before* publishing when it is
missing:

| Variable | Contents |
| -------- | -------- |
| `ANDROID_RELEASE_CERT_SHA256` | the release certificate's SHA-256 fingerprint (colons optional) |

The verify step fails if the variable is missing or if the release APK is signed
by a different certificate — exactly the condition that makes Android refuse an
update. Read the fingerprint from the release keystore (or from a locally built,
release-signed APK) with:

```bash
keytool -list -v -keystore cova-release.keystore -alias cova-release
# copy the SHA256: value (colons optional) — or, from an APK:
apksigner verify --print-certs app-release.apk
```

## One-time keystore creation

Run this once, on a trusted machine, and keep the file backed up somewhere safe.
Losing it means future APKs can no longer update existing installs.

```bash
keytool -genkeypair -v \
  -keystore cova-release.keystore \
  -alias cova-release \
  -keyalg RSA -keysize 4096 -validity 10950 \
  -dname "CN=Cova Vault, O=Cova Vault, C=PH"
```

Then encode it for the secret:

```bash
# macOS / Linux
base64 -w 0 cova-release.keystore > cova-release.keystore.b64

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("cova-release.keystore")) | Set-Content cova-release.keystore.b64
```

Paste the contents of `cova-release.keystore.b64` into `ANDROID_KEYSTORE_BASE64`
and delete the temp `.b64` file. Never commit the keystore or its passwords.

## How CI supplies the values

The `Release` workflow (`.github/workflows/release.yml`):

1. `Resolve Android version` derives the values from the tag through
   `scripts/android-version.mjs`
   (`v0.1.8-beta` → name `0.1.8-beta`, code `108`; `v0.1.9-beta` → `0.1.9-beta` / `109`).
2. `Decode release keystore` writes the secret to a temp file and fails the job
   if the secret is missing — a release is never silently debug-signed.
3. `Build release APK` runs `./gradlew assembleRelease` with
   `COVA_REQUIRE_RELEASE_SIGNING=1`, so Gradle refuses to build a release when
   the signing values or the version code are missing.
4. `Verify APK identity` reads the built APK and fails the job unless the
   applicationId is `com.cova.vault`, the versionCode/versionName match the tag,
   `apksigner` accepts the signature, the `ANDROID_RELEASE_CERT_SHA256` variable
   is present, and the signer certificate matches that pinned fingerprint.
5. `Create GitHub Release` only runs when all of the above succeeded, so an
   unsigned or mismatched APK can never be published.

## Version code scheme

`versionCode = major * 10000 + minor * 100 + patch`

- `0.1.8-beta` → `108`
- `0.1.9-beta` → `109`
- `0.2.0` → `200`
- `1.0.0` → `10000`

This is monotonic, so it always increases across releases, including across minor
versions (a bare patch-based scheme would reset to `0` at `0.2.0` and break
updates). An explicit `COVA_VERSION_CODE` environment variable or
`-PcovaVersionCode=` Gradle property still overrides the derived value.

## Local builds

- `./gradlew assembleDebug` — debug-signed for local development
  (`versionName 0.0.0-dev`, `versionCode 1`).
- `./gradlew assembleRelease` — needs `COVA_VERSION_NAME`, `COVA_VERSION_CODE`
  and the four `COVA_*` signing variables in the environment; without them a
  release build produces an unsigned APK that cannot be installed.

## Existing installs built before this change

APKs released before this fix were debug-signed with per-run certificates, so the
key that signed them no longer exists. Those installations cannot be updated in
place by any newly signed APK; they need a **one-time** manual reinstall:

- If the currently installed APK was built on your own machine, you can keep
  updating in place by signing with that same debug keystore
  (`%USERPROFILE%\.android\debug.keystore`, alias `androiddebugkey`,
  password `android`) via `COVA_KEYSTORE_PATH` / `COVA_KEY_ALIAS` /
  `COVA_KEY_PASSWORD` / `COVA_KEYSTORE_PASSWORD`.
- Otherwise uninstall once and install the new release. Export/back up any vault
  data you need first, because uninstalling removes the local app data.

Every release built after this change uses the persistent release certificate, so
all future updates install in place with local data preserved.
