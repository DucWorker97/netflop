
import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

interface GlassButtonProps {
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
    label?: string;
    style?: ViewStyle;
}

export function GlassButton({ onPress, icon, label, style }: GlassButtonProps) {
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [styles.container, style, pressed && styles.pressed]}>
            <BlurView intensity={20} tint="dark" style={styles.blur}>
                {icon && <Ionicons name={icon} size={20} color="#fff" style={label ? styles.icon : undefined} />}
                {label && <Text style={styles.label}>{label}</Text>}
            </BlurView>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    blur: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    pressed: {
        opacity: 0.8,
    },
    icon: {
        marginRight: 6,
    },
    label: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
});
