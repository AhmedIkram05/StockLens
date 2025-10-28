import React from 'react';
import { FlatList, StyleProp, ViewStyle } from 'react-native';

type Props<T> = {
  data: T[];
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement | null;
  keyExtractor?: (item: T, index: number) => string;
  snapInterval?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  showsHorizontalScrollIndicator?: boolean;
  decelerationRate?: 'normal' | 'fast' | number;
  snapToAlignment?: 'start' | 'center' | 'end';
};

export default function Carousel<T>({
  data,
  renderItem,
  keyExtractor,
  snapInterval,
  contentContainerStyle,
  style,
  showsHorizontalScrollIndicator = false,
  decelerationRate = 'fast',
  snapToAlignment = 'start',
}: Props<T>) {
  return (
    <FlatList
      data={data}
      horizontal
      keyExtractor={keyExtractor as any}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      contentContainerStyle={contentContainerStyle}
      snapToAlignment={snapToAlignment}
      decelerationRate={decelerationRate}
      snapToInterval={snapInterval}
      renderItem={({ item, index }) => renderItem({ item: item as T, index })}
      style={style}
    />
  );
}
