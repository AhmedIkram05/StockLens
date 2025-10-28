import React from 'react';
import IconButton from './IconButton';

type Props = {
  onPress?: () => void;
  accessibilityLabel?: string;
};

export default function BackButton({ onPress, accessibilityLabel = 'Go back' }: Props) {
  return <IconButton name="chevron-back" onPress={onPress} accessibilityLabel={accessibilityLabel} />;
}
