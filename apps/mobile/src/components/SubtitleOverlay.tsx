import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SubtitleOverlayProps {
    text: string | null;
    visible: boolean;
}

/**
 * Subtitle overlay component for displaying captions on video
 */
export function SubtitleOverlay({ text, visible }: SubtitleOverlayProps) {
    if (!visible || !text) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.textContainer}>
                <Text style={styles.text}>{text}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 80, // Above the controls
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    textContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 4,
        maxWidth: '90%',
    },
    text: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '500',
    },
});
