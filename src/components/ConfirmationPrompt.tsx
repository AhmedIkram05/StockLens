/**
 * ConfirmationPrompt
 *
 * Show a confirmation alert offering Confirm / Enter manually / Rescan options.
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

/** Show a confirmation dialog for the detected amount. */
export function showConfirmationPrompt(displayAmount: string, handlers: Handlers) {
  const buttons: any[] = [
    { text: 'Confirm', onPress: () => { try { handlers.onConfirm(); } catch (e) {} } },
    { text: 'Enter manually', onPress: () => { try { handlers.onEnterManually(); } catch (e) {} } },
    { text: 'Rescan', onPress: () => { try { handlers.onRescan(); } catch (e) {} } },
  ];

  Alert.alert('Confirm scanned total', displayAmount, buttons, { cancelable: true });
}

export default showConfirmationPrompt;
