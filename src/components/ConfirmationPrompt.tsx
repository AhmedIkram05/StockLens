import { Alert, Platform } from 'react-native';

type Handlers = {
  onConfirm: () => void | Promise<void>;
  onEnterManually: () => void | Promise<void>;
  onRescan: () => void | Promise<void>;
};

/**
 * Small wrapper that invokes a native confirmation prompt. Kept as a helper
 * so screens can centralise how prompts are shown and tested.
 */
export function showConfirmationPrompt(displayAmount: string, handlers: Handlers) {
  const buttons: any[] = [
    { text: 'Confirm', onPress: () => { try { handlers.onConfirm(); } catch (e) {} } },
    { text: 'Enter manually', onPress: () => { try { handlers.onEnterManually(); } catch (e) {} } },
    { text: 'Rescan', onPress: () => { try { handlers.onRescan(); } catch (e) {} } },
  ];

  // We use Alert.alert to keep native prompt behaviour (and allow existing
  // code paths to remain unchanged). The screen can still provide an iOS
  // prompt handler for manual entry if desired.
  Alert.alert('Confirm scanned total', displayAmount, buttons, { cancelable: true });
}

export default showConfirmationPrompt;
