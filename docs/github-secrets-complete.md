# Complete GitHub Secrets Configuration

Configure all secrets at: https://github.com/SKT-TRTR/zyrok-mobile-app/settings/secrets/actions

## iOS App Store Secrets

### CERTIFICATES_P12
**iOS Distribution Certificate (Base64)**
1. Xcode → Preferences → Accounts → Manage Certificates
2. Create "iOS Distribution" certificate
3. Export as .p12 with password
4. Convert: `base64 -i certificate.p12`

### CERTIFICATES_PASSWORD
**Certificate Password**
Password used when exporting .p12 certificate

### APPSTORE_KEY_ID
**App Store Connect API Key ID**
From App Store Connect → Users and Access → Keys

### APPSTORE_ISSUER_ID  
**App Store Connect Issuer ID**
UUID from App Store Connect keys page

### APPSTORE_PRIVATE_KEY
**App Store Connect Private Key**
Complete content of downloaded .p8 file

## Google Play Store Secrets

### ANDROID_KEYSTORE_BASE64
**Android Signing Keystore (Base64)**
1. Generate: `keytool -genkey -v -keystore zyrok-release.keystore -alias zyrok-release -keyalg RSA -keysize 2048 -validity 10000`
2. Convert: `base64 -i zyrok-release.keystore`

### ANDROID_KEYSTORE_PASSWORD
**Keystore Password**
Password set when generating keystore

### ANDROID_KEY_PASSWORD
**Key Password**
Key password set when generating keystore

### GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
**Google Play API Service Account JSON**
1. Google Cloud Console → Create project
2. Enable "Google Play Developer API"
3. Create service account with "Editor" role
4. Download JSON key file
5. Copy entire JSON content as secret value

## Required Secrets Summary

| Secret Name | Purpose | Store |
|-------------|---------|-------|
| CERTIFICATES_P12 | iOS code signing | iOS |
| CERTIFICATES_PASSWORD | iOS certificate password | iOS |
| APPSTORE_KEY_ID | App Store Connect API | iOS |
| APPSTORE_ISSUER_ID | App Store Connect API | iOS |
| APPSTORE_PRIVATE_KEY | App Store Connect API | iOS |
| ANDROID_KEYSTORE_BASE64 | Android app signing | Android |
| ANDROID_KEYSTORE_PASSWORD | Android keystore password | Android |
| ANDROID_KEY_PASSWORD | Android key password | Android |
| GOOGLE_PLAY_SERVICE_ACCOUNT_JSON | Play Store API | Android |

## Deployment Trigger

Once all 9 secrets are configured:

```bash
git commit -am "Deploy ZyRok to both app stores"
git push
```

**Automatic Dual Deployment:**
- iOS App Store Connect upload
- Google Play Console upload  
- Both stores submit for review
- Enterprise AWS Cognito authentication ready
- Zero manual intervention required

## Security Notes

- All secrets are encrypted and only accessible to GitHub Actions
- Never commit these values in your code
- Rotate certificates annually (iOS) and keystore as needed (Android)
- Monitor both app store consoles for authentication issues

Your ZyRok TikTok-style platform will be live on both iOS App Store and Google Play Store with enterprise authentication.