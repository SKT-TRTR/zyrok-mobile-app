# Google Play Store Deployment Guide

## Complete Android Setup Process

Your ZyRok app is configured for automated Google Play Store deployment alongside iOS App Store.

### 1. Google Play Console Setup

**Create Developer Account:**
- Visit: https://play.google.com/console/signup
- One-time fee: $25
- Complete identity verification (24-48 hours)

**Create Application:**
- App name: ZyRok
- Package name: com.zyrok.app
- Category: Social / Video Players & Editors

### 2. Android Keystore Generation

**Generate Release Keystore:**
```bash
keytool -genkey -v -keystore zyrok-release.keystore \
  -alias zyrok-release -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass YOUR_STORE_PASSWORD -keypass YOUR_KEY_PASSWORD
```

**Convert to Base64:**
```bash
base64 -i zyrok-release.keystore | pbcopy
```

### 3. Google Play API Setup

**Enable Google Play Developer API:**
1. Go to Google Cloud Console
2. Create new project: "ZyRok Play Store"
3. Enable "Google Play Developer API"
4. Create service account with "Editor" role
5. Download JSON key file

### 4. GitHub Secrets Configuration

Repository: https://github.com/SKT-TRTR/zyrok-mobile-app/settings/secrets/actions

**Required Android Secrets:**
- `ANDROID_KEYSTORE_BASE64`: Base64-encoded keystore file
- `ANDROID_KEYSTORE_PASSWORD`: Keystore password
- `ANDROID_KEY_PASSWORD`: Key password  
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`: Complete JSON service account key

**Combined with iOS Secrets:**
- `CERTIFICATES_P12`: iOS distribution certificate
- `CERTIFICATES_PASSWORD`: iOS certificate password
- `APPSTORE_KEY_ID`: App Store Connect API Key ID
- `APPSTORE_ISSUER_ID`: App Store Connect Issuer ID
- `APPSTORE_PRIVATE_KEY`: App Store Connect private key

### 5. Automated Dual Deployment

**Deploy to Both Stores:**
```bash
git add .
git commit -m "Deploy ZyRok to iOS App Store and Google Play Store"
git push origin main
```

**Automatic Process:**
- ✅ Build React web application
- ✅ Compile iOS app with AWS Cognito
- ✅ Upload to App Store Connect
- ✅ Build Android APK with AWS Cognito
- ✅ Sign APK for Play Store
- ✅ Upload to Google Play Console
- ✅ Submit both apps for review

### 6. AWS Cognito Mobile Configuration

Both iOS and Android apps use identical AWS Cognito setup:
- **User Pool**: us-east-2_HEgFgpasb
- **Client ID**: 32b6rrbc2bkckbho9ojbqjmcef
- **OAuth Domain**: zyrok-auth.auth.us-east-2.amazoncognito.com
- **Redirect URI**: com.zyrok.app://

### 7. App Store Requirements

**iOS App Store:**
- Bundle ID: com.zyrok.app
- Deployment Target: iOS 12.0+
- Capabilities: Camera, Microphone, Push Notifications

**Google Play Store:**
- Package Name: com.zyrok.app
- Target SDK: 34 (Android 14)
- Min SDK: 24 (Android 7.0)
- Permissions: Camera, Microphone, Storage, Internet

### 8. Review Timeline

**iOS App Store**: 1-7 days review
**Google Play Store**: 1-3 days review (faster than iOS)

Both apps will be live simultaneously with enterprise AWS Cognito authentication.

### 9. Monitoring Deployments

- **GitHub Actions**: Monitor both iOS and Android builds in Actions tab
- **App Store Connect**: Check iOS upload status and review progress
- **Google Play Console**: Check Android upload and review status
- **Email Notifications**: Both Apple and Google send review updates

Your ZyRok TikTok-style platform will be available on both major mobile app stores with zero manual intervention.