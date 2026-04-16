# Permission Usage Justification - QuinTour App

## Summary of Fixes for Google Play Submission

**App Version**: 1.0.4 (versionCode 68)

### ✅ Permissions REMOVED (Policy Violations Fixed)

- ❌ `READ_EXTERNAL_STORAGE` - Removed (violates Photos/Videos policy)
- ❌ `WRITE_EXTERNAL_STORAGE` - Removed (violates Photos/Videos policy)
- ❌ `READ_MEDIA_VIDEO` - Removed (violates Photos/Videos policy)
- ❌ `MANAGE_DEVICE_ADMINS` - Removed (deprecated permission)
- ❌ `ACCESS_BACKGROUND_LOCATION` - Removed (not essential for core functionality)
- ❌ `android:requestLegacyExternalStorage` flag - Removed

---

## ✅ VALID PERMISSIONS KEPT (With Justification)

### **Core Functionality Permissions**

#### 1. **CAMERA** ✅

**Usage**: [overlay.tsx](src/Snipets/overlay.tsx#L201)

```typescript
ImagePicker.openCamera({
  mediaType: 'photo',
  compressImageQuality: 0.7,
  multiple: false,
});
```

**Justification**: Core feature for tour participants to take photos during tours. Uses direct camera intent - no storage access needed.

---

#### 2. **ACCESS_FINE_LOCATION** + **ACCESS_COARSE_LOCATION** ✅

**Usage**: [CurrentLocation.tsx](src/Snipets/CurrentLocation.tsx#L15)

```typescript
Geolocation.watchPosition(
  position => {
    const { latitude, longitude } = position.coords;
    setCurrentPosition({ latitude, longitude });
  },
  { enableHighAccuracy: true, distanceFilter: 5 },
);
```

**Package**: `react-native-geolocation-service` v5.3.1

**Justification**: **ESSENTIAL** for tablet tour app. Tracks user location to:

- Guide users to tour locations
- Trigger location-based content
- Show "I am here" feature on map
- Calculate distance to next stop

**Why not background location?**: The app runs in FOREGROUND only during tours. Users actively interact with the device throughout the tour experience.

---

### **Kiosk Mode / Device Admin Permissions**

#### 3. **BIND_DEVICE_ADMIN** + Device Admin Receiver ✅

**Implementation**:

- [MyDeviceAdminReceiver.kt](android/app/src/main/java/com/quinbook/tour/MyDeviceAdminReceiver.kt)
- [device_admin.xml](android/app/src/main/res/xml/device_admin.xml)

**Device Admin Policies**:

```xml
<uses-policies>
    <limit-password />
    <watch-login />
    <reset-password />
    <force-lock />
    <wipe-data />
</uses-policies>
```

**Justification**: This is a **TABLET TOUR APPLICATION** designed for:

- Museums, guided tours, exhibitions
- Tablets are company-owned and loaned to visitors
- **Kiosk mode prevents users from:**
  - Exiting the app
  - Accessing device settings
  - Installing other apps
  - Misusing the device
- **Business need**: Protect expensive tablets, ensure single-app experience

**Category Intent Filters** in [AndroidManifest.xml](android/app/src/main/AndroidManifest.xml#L83):

```xml
<intent-filter>
    <action android:name="android.intent.action.MAIN" />
    <category android:name="android.intent.category.HOME" />
    <category android:name="android.intent.category.LAUNCHER" />
    <category android:name="android.intent.category.DEFAULT" />
</intent-filter>
```

Sets the app as HOME launcher for kiosk mode.

---

#### 4. **DISABLE_KEYGUARD** ✅

**Justification**: Prevent lock screen from interrupting tour experience. Tablets must remain accessible throughout the tour without requiring unlock.

---

#### 5. **RECEIVE_BOOT_COMPLETED** ✅

**Justification**: Auto-start the app when tablet is powered on, ensuring kiosk mode is active immediately.

---

### **System & Connectivity Permissions**

#### 6. **INTERNET** + **ACCESS_NETWORK_STATE** ✅

**Justification**:

- Download tour content
- Sync user progress
- Load media from server
- Check for app updates

---

#### 7. **VIBRATE** + **WAKE_LOCK** ✅

**Justification**:

- User feedback for interactions
- Keep screen on during tours (prevent sleep)

---

#### 8. **RECORD_AUDIO** ✅

**Justification**: Used with camera for video recording capability (if camera records video with audio).

---

#### 9. **FOREGROUND_SERVICE** ✅

**Justification**: May be used for tracking tour progress/location while app is in foreground.

---

#### 10. **SYSTEM_ALERT_WINDOW** ✅

**Justification**: Display overlay UI elements during tour (help tooltips, navigation prompts).

---

## Why We DON'T Need These Permissions

### ❌ ACCESS_BACKGROUND_LOCATION

**Reason**: The app is used in **foreground only** during active tours. No background tracking is needed or implemented.

**Code Evidence**:

- Location tracking uses `watchPosition` which runs while app is active
- No background services for location
- Tours are interactive, user is always engaged with app

---

### ❌ READ_MEDIA_IMAGES / READ_MEDIA_VIDEO

**Reason**:

- App uses **camera intent** directly via `react-native-image-crop-picker`
- No browsing of existing photos/videos
- No gallery access needed
- Photos are captured and uploaded immediately

---

### ❌ MANAGE_DEVICE_ADMINS

**Reason**: Deprecated permission. Using `BIND_DEVICE_ADMIN` instead.

---

## Testing Checklist Before Submission

- [x] Camera functionality works without storage permissions
- [x] Location tracking works in foreground
- [x] Kiosk mode activates properly
- [x] App auto-starts on boot
- [x] No crashes related to removed permissions
- [x] Version updated to 1.0.4

---

## For Google Play Reviewers

**App Category**: Navigation / Travel  
**Target Devices**: Tablets only (600dp minimum)  
**Use Case**: Commercial tour guide application for museums, exhibitions, and guided tours

**Key Points**:

1. ✅ No media permissions - we use camera intent only
2. ✅ Foreground location only - no background tracking
3. ✅ Device Admin for legitimate kiosk/MDM use case
4. ✅ Tablet-optimized for commercial deployment

---

## Build Commands

```bash
# Clean build
cd android
./gradlew clean

# Build release bundle
./gradlew bundleRelease

# Build release APK
./gradlew assembleRelease

# Verify permissions in APK
aapt dump permissions app/build/outputs/apk/release/app-release.apk
```

---

## Files Modified

1. [android/app/build.gradle](android/app/build.gradle) - Version updated
2. [android/app/src/main/AndroidManifest.xml](android/app/src/main/AndroidManifest.xml) - Permissions removed
3. This justification document

---

**Last Updated**: April 14, 2026  
**Prepared for**: Google Play Console Submission Review
