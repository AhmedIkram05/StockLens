/**
 * ConfirmationPrompt Component
 * 
 * A utility function that displays a native Alert dialog for confirming scanned receipt amounts.
 * Provides three action options: Confirm, Enter manually, or Rescan.
 * 
 * Used in the ScanScreen after OCR processing to let users verify or correct detected amounts.
 * Wraps handler callbacks in try-catch for error safety.
 */

import { Alert, Platform } from 'react-native';

type Handlers = {
  /** Callback triggered when user confirms the detected amount */
  onConfirm: () => void | Promise<void>;
  /** Callback triggered when user chooses to manually enter the amount */
  onEnterManually: () => void | Promise<void>;
  /** Callback triggered when user wants to rescan the receipt */
  onRescan: () => void | Promise<void>;
};

/**
 * Displays a native alert dialog with the detected amount and three action buttons.
 * All button handlers are wrapped in try-catch to prevent crashes from handler errors.
 * 
 * @param displayAmount - The formatted amount detected from OCR (e.g., "$45.99")
 * @param handlers - Object containing three callback functions for user actions
 */
export function showConfirmationPrompt(displayAmount: string, handlers: Handlers) {
  const buttons: any[] = [
    { text: 'Confirm', onPress: () => { try { handlers.onConfirm(); } catch (e) {} } },
    { text: 'Enter manually', onPress: () => { try { handlers.onEnterManually(); } catch (e) {} } },
    { text: 'Rescan', onPress: () => { try { handlers.onRescan(); } catch (e) {} } },
  ];

  Alert.alert('Confirm scanned total', displayAmount, buttons, { cancelable: true });
}

export default showConfirmationPrompt;
