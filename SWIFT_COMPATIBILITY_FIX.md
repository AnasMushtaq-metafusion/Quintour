# Swift Compatibility Linker Errors - iOS Build Fix

## Problem

When building iOS apps (especially React Native apps), you may encounter these linker errors:

```
Undefined symbol: _swift_FORCE_LOAD$_swiftCompatibility56
Undefined symbol: _swift_FORCE_LOAD$_swiftCompatibilityConcurrency
```

These errors occur when the Xcode linker cannot find Swift compatibility libraries, typically when:

- Swift code is present in the project but Swift library paths are not properly configured
- There are version mismatches between Xcode, Swift, and CocoaPods
- The project uses static frameworks with incomplete library search paths

---

## Solution Applied in QuinTour Project

### 1. **Created Dummy Swift File**

Added a dummy Swift file to ensure Swift support is enabled in the project:

**Location:** `ios/File.swift` and `ios/QuinTour/File.swift`

```swift
//
//  File.swift
//  QuinTour
//
//  Dummy Swift file to enable Swift support
//

import Foundation

@objc class DummySwift: NSObject {
}
```

**Why:** This forces Xcode to include Swift libraries in the build even if you don't have other Swift code.

---

### 2. **Updated Podfile Post-Install Hook**

Modified the `ios/Podfile` to configure Swift and library search paths for all CocoaPods targets:

```ruby
post_install do |installer|
  # Ensure correct post-installation configuration for React Native
  react_native_post_install(
    installer,
    config[:reactNativePath],
    :mac_catalyst_enabled => false
  )

  # Fix Swift compatibility and linking issues
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '16.0'
      config.build_settings['SWIFT_VERSION'] = '5.0'

      # Fix linker errors
      config.build_settings['OTHER_LDFLAGS'] ||= ['$(inherited)']
      config.build_settings['OTHER_LDFLAGS'] << '-Wl,-no_compact_unwind'
      config.build_settings['CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER'] = 'NO'
      config.build_settings['ENABLE_BITCODE'] = 'NO'
      config.build_settings['DEAD_CODE_STRIPPING'] = 'YES'

      # Fix command Ld emitted errors
      config.build_settings['LD_RUNPATH_SEARCH_PATHS'] = [
        '$(inherited)',
        '@executable_path/Frameworks',
        '@loader_path/Frameworks'
      ]
      config.build_settings['LIBRARY_SEARCH_PATHS'] = [
        '$(inherited)',
        '$(TOOLCHAIN_DIR)/usr/lib/swift/$(PLATFORM_NAME)',
        '$(TOOLCHAIN_DIR)/usr/lib/swift-5.0/$(PLATFORM_NAME)'
      ]
    end
  end

  # Fix main app target settings
  installer.pods_project.build_configurations.each do |config|
    config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
  end
end
```

**Key Settings:**

- `SWIFT_VERSION` = '5.0' - Ensures consistent Swift version
- `LIBRARY_SEARCH_PATHS` - Adds paths to Swift compatibility libraries
- `LD_RUNPATH_SEARCH_PATHS` - Adds runtime search paths for frameworks

---

### 3. **Updated Xcode Project Build Settings**

In `ios/QuinTour.xcodeproj/project.pbxproj`, ensured these settings are present:

```xml
LIBRARY_SEARCH_PATHS = (
    "$(SDKROOT)/usr/lib/swift",
    "$(TOOLCHAIN_DIR)/usr/lib/swift/$(PLATFORM_NAME)",
    "$(inherited)",
);

LD_RUNPATH_SEARCH_PATHS = (
    /usr/lib/swift,
    "$(inherited)",
);

OTHER_LDFLAGS = (
    "$(inherited)",
    "-Wl",
    "-ld_classic",
);

SWIFT_VERSION = 5.0;
SWIFT_OBJC_BRIDGING_HEADER = "QuinTour-Bridging-Header.h";
```

---

### 4. **Created Bridging Header**

Created `ios/QuinTour-Bridging-Header.h` to bridge Objective-C and Swift:

```objc
//
//  Use this file to import your target's public headers that you would like to expose to Swift.
//
```

---

## Step-by-Step Fix Instructions

### For New Projects Experiencing This Error:

1. **Add Dummy Swift File:**

   ```bash
   # In your ios/ directory
   touch ios/YourProjectName/File.swift
   ```

   Add this content:

   ```swift
   import Foundation
   @objc class DummySwift: NSObject { }
   ```

   **Also create a bridging header:**

   ```bash
   touch ios/YourProjectName-Bridging-Header.h
   ```

   Add this content:

   ```objc
   //
   //  Use this file to import your target's public headers that you would like to expose to Swift.
   //
   ```

2. **Update Podfile:**

   - Add the post_install configuration shown above
   - Ensure `use_frameworks! :linkage => :static` is set (if using Firebase)

3. **Update Xcode Build Settings:**

   - Open `YourProject.xcodeproj` in Xcode
   - Go to Build Settings → Search for "Library Search Paths"
   - Add:
     - `$(TOOLCHAIN_DIR)/usr/lib/swift/$(PLATFORM_NAME)`
     - `$(TOOLCHAIN_DIR)/usr/lib/swift-5.0/$(PLATFORM_NAME)`
   - Search for "Runpath Search Paths" and add:
     - `@executable_path/Frameworks`
     - `@loader_path/Frameworks`

4. **Clean and Rebuild:**

   ```bash
   cd ios
   rm -rf Pods Podfile.lock
   pod install
   cd ..

   # Clean Xcode build
   cd ios
   xcodebuild clean -workspace YourProject.xcworkspace -scheme YourProject

   # Or from React Native root
   npx react-native run-ios
   ```

---

## Additional Troubleshooting

### If the error persists:

1. **Check Xcode Version:**

   - Ensure you're using a compatible Xcode version
   - Swift 5.0 requires Xcode 10.2+

2. **Update CocoaPods:**

   ```bash
   sudo gem install cocoapods
   ```

3. **Verify Swift Bridging Header:**

   - In Xcode Build Settings, ensure `SWIFT_OBJC_BRIDGING_HEADER` points to your bridging header
   - The path should be relative to the project root, e.g., `YourProjectName-Bridging-Header.h`

4. **Use Legacy Linker (if needed):**

   ```ruby
   # In Podfile post_install
   config.build_settings['OTHER_LDFLAGS'] ||= ['$(inherited)']
   config.build_settings['OTHER_LDFLAGS'] << '-Wl,-ld_classic'
   ```

5. **Check for Framework Conflicts:**
   - Review all CocoaPods that might be using Swift
   - Ensure they're all using compatible Swift versions

---

## Environment

This fix was tested and confirmed working with:

- React Native: 0.73.2
- iOS Deployment Target: 16.0
- Swift Version: 5.0
- CocoaPods: Latest
- Xcode: 14.0+

---

## Git Commit Reference

This fix was committed on **March 22, 2026** with commit message: **"build error fixes"**

**Commit:** `5a03000a40839113f65b4e59de66dcc5ee0a7fdc`

### Files Modified:

- `ios/File.swift` (created)
- `ios/QuinTour/File.swift` (created)
- `ios/QuinTour-Bridging-Header.h` (created)
- `ios/Podfile` (modified - added post_install hook)
- `ios/Podfile.lock` (regenerated)
- `ios/QuinTour.xcodeproj/project.pbxproj` (updated build settings)

---

## Status: ✅ FIXED

This issue has been successfully resolved in the QuinTour project with the configurations mentioned above. All changes are committed and tested.

**Last Updated:** April 9, 2026
