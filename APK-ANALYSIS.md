# APK-ANALYSIS.md — KADIN Indonesia Android v1.0.9

> **Status:** Static APK archive inspection (initial evidence baseline)  
> **Date:** 2026-11-18  
> **Source:** `Kadin_Indonesia_1.0.9_build_8okt_v_1.apk`  
> **Scope:** Architecture, packaged dependencies, deployment indicators, risks, and follow-up verification.  
> **Confidence convention:** **Confirmed** = observed in APK archive/config; **Indicated** = library packaged, feature use not proven; **Unknown** = requires DEX/manifest parsing, Hermes inspection, or runtime testing.

## 1. Executive summary

The APK packages a **React Native** Android application with **Expo modules**, **Hermes runtime**, and **Expo Updates**. Native libraries are included for both `arm64-v8a` and `armeabi-v7a`. Its main JavaScript payload is `assets/index.android.bundle`, which has a binary header and must **not** be treated as readable plain JavaScript. A clean-room successor should consider **React Native + Expo + TypeScript** as its first architecture candidate; this is a recommendation, not proof of the original TypeScript source or exact dependency versions.

**Evidence limitations:** No full Android binary-manifest decoding, DEX decompilation, Hermes bytecode disassembly, or emulator session was performed in this report. Do not interpret packaged libraries as proof of active product features. This report does not claim access to private backend systems or original source code.

## 2. Artifact inventory and integrity

| Attribute | Observed value | Evidence |
|---|---|---|
| File | `Kadin_Indonesia_1.0.9_build_8okt_v_1.apk` | Input artifact |
| Size | 72,197,773 bytes (68.85 MiB) | Filesystem |
| SHA-256 | `f3308c89705c9a9767b4f2d38c4ca6445ce626033e923ef4ed0a5ed7e5bfc852` | Computed on supplied APK |
| Archive entries | 1,625 | ZIP central directory |
| DEX files | classes.dex, classes2.dex, classes3.dex | Archive |
| App display name | `Kadin Indonesia` | `assets/app.config` |
| App slug | `digicare` | `assets/app.config` |
| App version | `1.0.9` | `assets/app.config` |
| Expo runtimeVersion | `1.0.0` | `assets/app.config` |
| Android package | `com.kadinverse` | `assets/app.config` (not validated against binary manifest) |
| Expo project ID | `[REDACTED – legacy Expo project ID; held in restricted research notes]` | `assets/app.config` |
| Expo Updates URL | `[REDACTED – legacy Expo Updates endpoint; held in restricted research notes]` | `assets/app.config`; configuration, not a tested connection |
| JS bundle | `assets/index.android.bundle` (9,150,276 bytes) | Archive |
| Expo asset manifest | `assets/app.manifest` (43,631 bytes) | Archive |

## 3. Observed high-level architecture

```text
Android APK
├── Android platform layer (classes.dex, classes2.dex, classes3.dex)
├── React Native runtime (libreactnative.so, libjsi.so)
├── Hermes JS engine (libhermesvm.so, libhermestooling.so)
├── Expo modules / Expo Updates (native .so + app.config)
├── Native integrations (VisionCamera, RN Screens, gesture handler, SVG)
├── Hermes-format JS bundle (assets/index.android.bundle)
└── Packaged resources and images (res/, assets/)
```

**Inferred runtime model:** Android Activity/host → React Native bridge/JSI → Hermes bundle → UI and app logic → native modules and network interfaces. Exact application-layer boundaries, screen hierarchy, state management, and backend protocols are **unknown** until additional analysis.

## 4. Framework and native library evidence

| Technology | Evidence | Assessment |
|---|---|---|
| React Native | `libreactnative.so`, `libjsi.so`, `META-INF/ReactAndroid_release.kotlin_module` | **Confirmed packaged** |
| Hermes | `libhermesvm.so`, `libhermestooling.so`; binary JS bundle | **Confirmed packaged; execution path likely** |
| Expo Modules | `libexpo-modules-core.so`, `assets/app.config` | **Confirmed packaged** |
| Expo Updates | `libexpo-updates.so`, `updates.url` | **Confirmed configured; OTA behavior untested** |
| React Native Screens | `librnscreens.so`, `libreact_codegen_rnscreens.so` | **Confirmed packaged; navigation flow unknown** |
| React Native SVG | `libreact_codegen_rnsvg.so` | **Confirmed packaged** |
| Gesture Handler | `libgesturehandler.so` | **Confirmed packaged** |
| VisionCamera | `libVisionCamera.so` | **Confirmed packaged; camera feature unverified** |
| Nitro Modules / Image | `libNitroModules.so`, `libNitroImage.so` | **Confirmed packaged; use unverified** |
| Barcode-related library | `libbarhopper_v3.so` | **Indicates barcode/vision capability; workflow unverified** |
| Firebase / Room / OkHttp | AndroidX/third-party package metadata and/or DEX inspection required | **Do not assume active functionality** |

### 4.1 Native libraries included

There are **48** `.so` archive entries, covering **24** distinct library filenames across the two supported ABI directories.

- `libNitroImage.so`
- `libNitroModules.so`
- `libVisionCamera.so`
- `libappmodules.so`
- `libbarhopper_v3.so`
- `libc++_shared.so`
- `libdatastore_shared_counter.so`
- `libexpo-modules-core.so`
- `libexpo-updates.so`
- `libfbjni.so`
- `libgesturehandler.so`
- `libhermestooling.so`
- `libhermesvm.so`
- `libimage_processing_util_jni.so`
- `libimagepipeline.so`
- `libjsi.so`
- `libnative-filters.so`
- `libnative-imagetranscoder.so`
- `libreact_codegen_rnscreens.so`
- `libreact_codegen_rnsvg.so`
- `libreact_codegen_safeareacontext.so`
- `libreactnative.so`
- `librnscreens.so`
- `libtoolChecker.so`

## 5. Android application configuration

The archive includes `AndroidManifest.xml`, but this file is Android binary XML. **Permission lists, exported components, intent filters, minSdk, targetSdk, debuggable status, deep links, and provider declarations are not verified here.** Decode using `apkanalyzer manifest print`, `aapt dump badging`, or Apktool, then append an evidence-backed manifest table.

## 6. Resource and bundle observations

- `assets/kadin-logo.png` is present: **confirmed packaged branding asset**; reuse requires appropriate rights.
- `assets/index.android.bundle` is a binary Hermes-format payload: ordinary text grep or JADX alone will not reconstruct application-level JavaScript accurately.
- `assets/app.manifest` contains Expo asset metadata; this does not itself enumerate verified user-facing screens.
- React Native UI components, route names, form validations, authentication, member workflows, and network contracts remain **unverified**.

## 7. Dependency discovery evidence

AndroidX `.version` metadata examples (packaged artifacts; exact semantic dependency versions are not necessarily encoded in the filenames):

**room:** `META-INF/androidx.room_room-ktx.version`, `META-INF/androidx.room_room-runtime.version`

**camera:** `META-INF/androidx.camera_camera-camera2.version`, `META-INF/androidx.camera_camera-core.version`, `META-INF/androidx.camera_camera-extensions.version`, `META-INF/androidx.camera_camera-lifecycle.version`, `META-INF/androidx.camera_camera-video.version`

**sqlite:** `META-INF/androidx.sqlite_sqlite-framework.version`, `META-INF/androidx.sqlite_sqlite.version`

**work:** `META-INF/androidx.sqlite_sqlite-framework.version`, `META-INF/androidx.work_work-runtime.version`

**datastore:** `META-INF/androidx.datastore_datastore-core.version`, `META-INF/androidx.datastore_datastore-preferences-core.version`, `META-INF/androidx.datastore_datastore-preferences.version`, `META-INF/androidx.datastore_datastore.version`

**biometric:** `META-INF/androidx.biometric_biometric.version`

## 8. Security and privacy assessment boundaries

| Area | Current status | Next verification |
|---|---|---|
| Permissions | Unknown | Decode binary AndroidManifest.xml |
| Exported components | Unknown | Inspect activities/services/receivers/providers |
| Network security | Unknown | Check manifest config and runtime traffic on authorized test environment |
| Embedded secrets | Not assessed | Inspect approved artifacts offline; redact all findings |
| Authentication | Unknown | Authorized test account, observe login/logout/session expiration |
| Local data protection | Unknown | Inspect storage behavior using synthetic data |
| OTA update controls | Expo Updates configured | Verify code signing and update policy from owner-controlled configuration |
| Third-party SDK inventory | Partial | Complete SBOM using DEX/native/JS evidence |

**Handling rules:** Do not upload decompiled proprietary code or credentials to public repositories or third-party AI services without authorization. Do not reuse proprietary code, assets, API keys, signing material, or customer data. Restrict observation to the APK and test accounts/devices you are authorized to use.

## 9. Recommended clean-room successor architecture (proposal, not APK fact)

```text
React Native + Expo + TypeScript
  ├── Presentation: Expo Router or React Navigation (decision pending)
  ├── State: React Query + local state (decision pending)
  ├── Domain: use cases + typed models
  ├── Data: API client + secure storage + offline cache
  ├── Native: permission-gated camera/notifications as needed
  ├── Quality: Jest + React Native Testing Library + E2E
  └── Delivery: EAS Build or independent Android CI
Backend: independently specified and implemented; do not reuse third-party endpoints.
```

Suggested separation: `reference-analysis/` (restricted evidence) versus `new-app/` (new source code). AI agents receive **sanitized functional specifications**, not raw decompiled code by default.

## 10. Follow-up analysis commands (macOS)

```bash
brew install jadx apktool
# Android SDK build-tools and emulator installed via Android Studio
shasum -a 256 input/reference.apk
apktool d input/reference.apk -o analysis/apktool
jadx -d analysis/jadx input/reference.apk
apkanalyzer manifest print input/reference.apk > analysis/manifest-decoded.xml
# If apkanalyzer is not on PATH, use its location under the Android SDK.
# Review on an authorized emulator; use synthetic accounts/data.
adb devices
adb install input/reference.apk
```

For Hermes bundle analysis, use a **compatible** Hermes bytecode inspection/disassembly tool matching the bundle version; avoid asserting that plain `index.android.bundle` contains readable JS. Preserve checksums and keep analysis output out of the new application's repository.

## 11. Verification backlog and acceptance gates

| Priority | Task | Acceptance evidence |
|---|---|---|
| P0 | Decode AndroidManifest | Package/versionCode, min/target SDK, permissions, exported components documented |
| P0 | Produce Android dependency inventory | DEX package evidence and native module mapping |
| P0 | Inspect Hermes bundle with compatible tooling | Route/component/feature evidence with confidence tags |
| P0 | Emulator UI walkthrough | Screen inventory, screenshots, navigation flows, error states |
| P0 | Capture authorized API contracts | Redacted endpoints/payload schemas or mock equivalents |
| P1 | Generate FEATURE-INVENTORY.md | Each feature linked to observation and confidence |
| P1 | Generate SAD.md / SDD.md | All unverified assumptions marked explicitly |
| P1 | Build clean-room MVP | Test-first implementation and acceptance criteria |
| P2 | Security and performance review | Repeatable test logs and release sign-off |

## 12. Open questions

1. What are the verified Android package ID, `versionCode`, `minSdkVersion`, and `targetSdkVersion`?
2. Which screens, user roles, and workflows exist in the deployed application?
3. Which camera/barcode/notification capabilities are actively used?
4. What backend APIs are authorized for replacement or integration?
5. Does the app rely on Expo OTA updates in production, and what release governance applies?
6. Are offline operation, deep links, and biometric login product requirements?

---

**Conclusion:** The strongest current evidence supports a React Native + Expo + Hermes architecture with Android native integrations. This is a **static baseline**, not a complete reconstruction of the application architecture or feature inventory. Further claims require manifest decoding, Hermes analysis, and authorized runtime observation.
