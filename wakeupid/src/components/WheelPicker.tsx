import React, {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { ScrollView, View, Text } from 'react-native';

export const ITEM_H = 58;
const VISIBLE   = 5;
const PAD_COUNT = Math.floor(VISIBLE / 2); // 2 items above/below center

export interface WheelRef {
  scrollToIndex: (index: number, animated?: boolean) => void;
}

interface Props {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  width?: number;
  accent?: string;
}

// ─── WheelColumn ─────────────────────────────────────────────────────────────
export const WheelColumn = forwardRef<WheelRef, Props>(
  ({ items, selectedIndex, onSelect, width = 90, accent = '#00ffcc' }, ref) => {
    const scrollRef = useRef<ScrollView>(null);

    // Expose scroll method to parent via ref
    useImperativeHandle(ref, () => ({
      scrollToIndex: (index: number, animated = true) => {
        scrollRef.current?.scrollTo({ y: index * ITEM_H, animated });
      },
    }));

    // Initial scroll on mount ONLY — no deps on selectedIndex
    useEffect(() => {
      const t = setTimeout(() => {
        scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: false });
      }, 80);
      return () => clearTimeout(t);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // ← intentionally empty: only run once on mount

    const handleScrollEnd = (e: any) => {
      const y   = e.nativeEvent.contentOffset.y;
      const idx = Math.round(y / ITEM_H);
      const clamped = Math.max(0, Math.min(idx, items.length - 1));
      onSelect(clamped);
    };

    return (
      <View style={{ width, height: ITEM_H * VISIBLE, overflow: 'hidden' }}>

        {/* Selection highlight band — sits at centre row */}
        <View
          pointerEvents="none"
          style={{
            position:        'absolute',
            top:             ITEM_H * PAD_COUNT,
            width,
            height:          ITEM_H,
            backgroundColor: accent + '18',
            borderTopWidth:  1.5,
            borderBottomWidth: 1.5,
            borderColor:     accent + '66',
            borderRadius:    12,
            zIndex:          10,
          }}
        />

        {/* Top fade mask */}
        <View
          pointerEvents="none"
          style={{
            position:        'absolute',
            top:             0,
            width,
            height:          ITEM_H * PAD_COUNT,
            backgroundColor: '#060606',
            opacity:         0.72,
            zIndex:          9,
          }}
        />
        {/* Bottom fade mask */}
        <View
          pointerEvents="none"
          style={{
            position:        'absolute',
            bottom:          0,
            width,
            height:          ITEM_H * PAD_COUNT,
            backgroundColor: '#060606',
            opacity:         0.72,
            zIndex:          9,
          }}
        />

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_H}
          decelerationRate="fast"
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={handleScrollEnd}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingVertical: ITEM_H * PAD_COUNT }}
        >
          {items.map((item, i) => {
            const dist       = Math.abs(i - selectedIndex);
            const isSelected = dist === 0;
            return (
              <View
                key={String(i)}
                style={{
                  height:          ITEM_H,
                  justifyContent:  'center',
                  alignItems:      'center',
                }}
              >
                <Text
                  style={{
                    fontSize:      isSelected ? 48 : dist === 1 ? 30 : 20,
                    fontWeight:    isSelected ? 'bold' : '400',
                    color:         isSelected ? '#ffffff' : dist === 1 ? '#4a4a4a' : '#1e1e1e',
                    letterSpacing: isSelected ? -2 : 0,
                  }}
                >
                  {item}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  }
);
