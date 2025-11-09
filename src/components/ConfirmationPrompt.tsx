import { Alert, Platform } from 'react-native';

type Handlers = {
  onConfirm: () => void | Promise<void>;
  onEnterManually: () => void | Promise<void>;
  onRescan: () => void | Promise<void>;
};

export function showConfirmationPrompt(displayAmount: string, handlers: Handlers) {
  const buttons: any[] = [
    { text: 'Confirm', onPress: () => { try { handlers.onConfirm(); } catch (e) {} } },
    { text: 'Enter manually', onPress: () => { try { handlers.onEnterManually(); } catch (e) {} } },
    { text: 'Rescan', onPress: () => { try { handlers.onRescan(); } catch (e) {} } },
  ];

  Alert.alert('Confirm scanned total', displayAmount, buttons, { cancelable: true });
}

export default showConfirmationPrompt;
