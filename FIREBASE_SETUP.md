# Firebase Configuration Setup

## ⚠️ Security Notice

Firebase configuration files are NOT included in this repository for security reasons.

## Setup Instructions

### 1. Download Firebase Config Files

Go to [Firebase Console](https://console.firebase.google.com) → Your Project → Project Settings

#### For Android:
1. Download `google-services.json`
2. Place it at: `android/app/google-services.json`

#### For iOS:
1. Download `GoogleService-Info.plist`
2. Place it at: `ios/GoogleService-Info.plist`

### 2. Verify Files Are Ignored

These files should NOT appear in `git status`:
```bash
git status
# Should NOT show:
# - ios/GoogleService-Info.plist
# - android/app/google-services.json
```

### 3. Build the App

After placing the files:
```bash
# Android
npx react-native run-android

# iOS
cd ios && pod install && cd ..
npx react-native run-ios
```

## Template Files

Example templates are provided:
- `ios/GoogleService-Info.plist.example`
- `android/app/google-services.json.example`

Copy and rename these, then replace placeholder values with your actual Firebase config.

## ⚠️ Never Commit These Files

The `.gitignore` is configured to prevent accidental commits of:
- `ios/GoogleService-Info.plist`
- `android/app/google-services.json`

If you accidentally commit them, contact the team lead immediately to rotate the keys.
