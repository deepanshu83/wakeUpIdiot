import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface MemeTextProps {
  text: string;
}

export default function MemeText({ text }: MemeTextProps) {
  return (
    <Text style={styles.meme}>{text}</Text>
  );
}

const styles = StyleSheet.create({
  meme: {
    color: '#00ffcc',
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 24,
    paddingHorizontal: 28,
    lineHeight: 26,
    fontWeight: '600',
  },
});
