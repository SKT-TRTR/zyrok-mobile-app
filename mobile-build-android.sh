#!/bin/bash

# ZyRok Android Build Script with AWS Cognito
# Builds APK/AAB for Google Play Store deployment

set -e

echo "🤖 Starting ZyRok Android build with AWS Cognito..."

# Build configuration
PACKAGE_NAME="com.zyrok.app"
APP_NAME="ZyRok"
BUILD_TYPE="release"
COGNITO_CONFIG="./android-build-config.json"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf platforms/android
rm -rf www

# Install/update Cordova and dependencies
echo "📦 Installing Cordova dependencies..."
npm install -g cordova@latest
npm install

# Build web application
echo "🏗️ Building React application..."
npm run build

# Copy web assets
echo "📁 Copying web assets to www/..."
cp -r dist/* www/ 2>/dev/null || mkdir -p www && cp -r dist/* www/

# Add Android platform
echo "📱 Adding Android platform..."
cordova platform add android@latest

# Configure AWS Cognito for Android
echo "🔐 Configuring AWS Cognito for Android..."
mkdir -p platforms/android/app/src/main/assets/www/js

# Create Cognito configuration for Android
cat > platforms/android/app/src/main/assets/www/js/aws-cognito-config.js << 'EOF'
window.AWS_COGNITO_CONFIG = {
  userPoolId: 'us-east-2_HEgFgpasb',
  userPoolWebClientId: '32b6rrbc2bkckbho9ojbqjmcef',
  region: 'us-east-2',
  oauth: {
    domain: 'zyrok-auth.auth.us-east-2.amazoncognito.com',
    scope: ['email', 'openid', 'profile'],
    redirectSignIn: 'com.zyrok.app://',
    redirectSignOut: 'com.zyrok.app://',
    responseType: 'code'
  }
};
EOF

# Update config.xml with Android-specific settings
echo "⚙️ Configuring Android build settings..."
xmlstarlet ed -L \
  -u "//platform[@name='android']/preference[@name='android-targetSdkVersion']/@value" -v "34" \
  -u "//platform[@name='android']/preference[@name='android-minSdkVersion']/@value" -v "24" \
  config.xml 2>/dev/null || echo "Config.xml updated manually"

# Add required permissions to AndroidManifest.xml after platform add
echo "🔒 Adding Android permissions..."
MANIFEST_PATH="platforms/android/app/src/main/AndroidManifest.xml"
if [ -f "$MANIFEST_PATH" ]; then
  # Add permissions before </manifest>
  sed -i 's|</manifest>|    <uses-permission android:name="android.permission.CAMERA" />\
    <uses-permission android:name="android.permission.RECORD_AUDIO" />\
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />\
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />\
    <uses-permission android:name="android.permission.INTERNET" />\
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />\
    <uses-permission android:name="android.permission.VIBRATE" />\
    <uses-permission android:name="android.permission.WAKE_LOCK" />\
    <uses-feature android:name="android.hardware.camera" android:required="false" />\
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />\
    <uses-feature android:name="android.hardware.microphone" android:required="false" />\
</manifest>|' "$MANIFEST_PATH"
fi

# Install required Cordova plugins
echo "🔌 Installing Cordova plugins..."
cordova plugin add cordova-plugin-camera
cordova plugin add cordova-plugin-media-capture
cordova plugin add cordova-plugin-file
cordova plugin add cordova-plugin-file-transfer
cordova plugin add cordova-plugin-device
cordova plugin add cordova-plugin-network-information
cordova plugin add cordova-plugin-vibration
cordova plugin add cordova-plugin-statusbar
cordova plugin add cordova-plugin-splashscreen
cordova plugin add cordova-plugin-whitelist
cordova plugin add cordova-plugin-inappbrowser

# Build Android application
echo "🏗️ Building Android APK..."
if [ "$GITHUB_ACTIONS" = "true" ]; then
  # Production build for GitHub Actions
  cordova build android --release --device
  
  # Sign APK if keystore is available
  if [ -n "$ANDROID_KEYSTORE_BASE64" ] && [ -n "$ANDROID_KEYSTORE_PASSWORD" ]; then
    echo "🔐 Signing APK for Play Store..."
    echo "$ANDROID_KEYSTORE_BASE64" | base64 -d > zyrok-release.keystore
    
    # Sign APK
    jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
      -keystore zyrok-release.keystore \
      -storepass "$ANDROID_KEYSTORE_PASSWORD" \
      -keypass "$ANDROID_KEY_PASSWORD" \
      platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk \
      zyrok-release
    
    # Align APK
    zipalign -v 4 \
      platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk \
      platforms/android/app/build/outputs/apk/release/zyrok-release.apk
    
    echo "✅ Signed APK: platforms/android/app/build/outputs/apk/release/zyrok-release.apk"
  fi
else
  # Development build
  cordova build android --debug
fi

# Verify build
echo "✅ Android build completed!"
if [ -f "platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk" ]; then
  echo "📦 Release APK: platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk"
elif [ -f "platforms/android/app/build/outputs/apk/debug/app-debug.apk" ]; then
  echo "🛠️ Debug APK: platforms/android/app/build/outputs/apk/debug/app-debug.apk"
fi

echo "🎉 ZyRok Android build with AWS Cognito complete!"