import { useEffect } from 'react';
import { NativeModules, Platform } from 'react-native';

/**
 * KeepAwake component - Prevents device screen from sleeping
 * Uses native APIs to keep the screen awake while app is in foreground
 */
const KeepAwake = () => {
  useEffect(() => {
    // Activate keep awake on mount
    activateKeepAwake();

    // Deactivate on unmount
    return () => {
      deactivateKeepAwake();
    };
  }, []);

  return null;
};

/**
 * Activate keep awake - prevents screen from sleeping
 */
export const activateKeepAwake = () => {
  if (Platform.OS === 'android') {
    try {
      NativeModules.StatusBarManager?.setKeepScreenOn?.(true);
    } catch (error) {
      console.warn('Failed to activate keep awake:', error);
    }
  }
  // iOS: Use react-native-screens keepAwake prop on screens
};

/**
 * Deactivate keep awake - allows screen to sleep normally
 */
export const deactivateKeepAwake = () => {
  if (Platform.OS === 'android') {
    try {
      NativeModules.StatusBarManager?.setKeepScreenOn?.(false);
    } catch (error) {
      console.warn('Failed to deactivate keep awake:', error);
    }
  }
};

export default KeepAwake;
