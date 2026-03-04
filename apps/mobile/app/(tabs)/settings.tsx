import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    getApiBaseUrl,
    setApiBaseUrl,
    API_PRESETS,
    getDiagnostics,
} from '../../src/lib/env';
import { clearTokens, isAuthenticated } from '../../src/lib/auth';
import { api } from '../../src/lib/api';

export default function SettingsScreen() {
    const router = useRouter();
    const [baseUrl, setBaseUrl] = useState('');
    const [customUrl, setCustomUrl] = useState('');
    const [selectedPreset, setSelectedPreset] = useState<string>('');
    const [diagnostics, setDiagnostics] = useState(getDiagnostics());
    const [healthStatus, setHealthStatus] = useState<{
        status: 'idle' | 'loading' | 'success' | 'error';
        message?: string;
        latency?: number;
    }>({ status: 'idle' });
    const [hasToken, setHasToken] = useState(false);

    const loadSettings = useCallback(async () => {
        const url = await getApiBaseUrl();
        setBaseUrl(url);
        setDiagnostics(getDiagnostics());

        // Determine which preset matches
        if (url === API_PRESETS.simulator) {
            setSelectedPreset('simulator');
        } else if (url === API_PRESETS.androidEmulator) {
            setSelectedPreset('androidEmulator');
        } else {
            setSelectedPreset('custom');
            setCustomUrl(url);
        }

        const authenticated = await isAuthenticated();
        setHasToken(authenticated);
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const handlePresetChange = async (preset: string) => {
        setSelectedPreset(preset);
        let url = '';

        if (preset === 'simulator') {
            url = API_PRESETS.simulator;
        } else if (preset === 'androidEmulator') {
            url = API_PRESETS.androidEmulator;
        } else {
            url = customUrl || 'http://192.168.1.100:3000';
            setCustomUrl(url);
        }

        await setApiBaseUrl(url);
        setBaseUrl(url);
    };

    const handleCustomUrlSave = async () => {
        if (!customUrl.startsWith('http')) {
            Alert.alert('Invalid URL', 'URL must start with http:// or https://');
            return;
        }
        await setApiBaseUrl(customUrl);
        setBaseUrl(customUrl);
        Alert.alert('Saved', 'API Base URL updated');
    };

    const handlePingHealth = async () => {
        setHealthStatus({ status: 'loading' });
        const result = await api.pingHealth();
        setHealthStatus({
            status: result.ok ? 'success' : 'error',
            message: result.message,
            latency: result.latencyMs,
        });
    };

    const handleLogout = async () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    await clearTokens();
                    router.replace('/login');
                },
            },
        ]);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
            </View>

            {/* Network Configuration */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Network Configuration</Text>

                <Text style={styles.label}>Current API Base URL</Text>
                <Text style={styles.value}>{baseUrl}</Text>

                <Text style={styles.label}>Environment Presets</Text>
                <View style={styles.presets}>
                    <TouchableOpacity
                        style={[
                            styles.presetBtn,
                            selectedPreset === 'simulator' && styles.presetActive,
                        ]}
                        onPress={() => handlePresetChange('simulator')}
                    >
                        <Text style={styles.presetText}>iOS Simulator</Text>
                        <Text style={styles.presetUrl}>localhost:3000</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.presetBtn,
                            selectedPreset === 'androidEmulator' && styles.presetActive,
                        ]}
                        onPress={() => handlePresetChange('androidEmulator')}
                    >
                        <Text style={styles.presetText}>Android Emulator</Text>
                        <Text style={styles.presetUrl}>10.0.2.2:3000</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.presetBtn,
                            selectedPreset === 'custom' && styles.presetActive,
                        ]}
                        onPress={() => handlePresetChange('custom')}
                    >
                        <Text style={styles.presetText}>Custom (LAN)</Text>
                        <Text style={styles.presetUrl}>Enter IP below</Text>
                    </TouchableOpacity>
                </View>

                {selectedPreset === 'custom' && (
                    <View style={styles.customInput}>
                        <TextInput
                            style={styles.input}
                            placeholder="http://192.168.1.100:3000"
                            placeholderTextColor="#666"
                            value={customUrl}
                            onChangeText={setCustomUrl}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity style={styles.saveBtn} onPress={handleCustomUrlSave}>
                            <Text style={styles.saveBtnText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Health Check */}
                <View style={styles.healthSection}>
                    <TouchableOpacity
                        style={styles.healthBtn}
                        onPress={handlePingHealth}
                        disabled={healthStatus.status === 'loading'}
                    >
                        {healthStatus.status === 'loading' ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.healthBtnText}>Ping /health</Text>
                        )}
                    </TouchableOpacity>

                    {healthStatus.status !== 'idle' && healthStatus.status !== 'loading' && (
                        <View
                            style={[
                                styles.healthResult,
                                healthStatus.status === 'success'
                                    ? styles.healthSuccess
                                    : styles.healthError,
                            ]}
                        >
                            <Text style={styles.healthResultText}>
                                {healthStatus.status === 'success' ? '✅' : '❌'} {healthStatus.message}
                            </Text>
                            {healthStatus.latency !== undefined && (
                                <Text style={styles.healthLatency}>{healthStatus.latency}ms</Text>
                            )}
                        </View>
                    )}
                </View>
            </View>

            {/* Diagnostics */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Diagnostics</Text>

                <View style={styles.diagItem}>
                    <Text style={styles.diagLabel}>Token Present</Text>
                    <Text style={[styles.diagValue, hasToken ? styles.diagOk : styles.diagWarn]}>
                        {hasToken ? 'Yes' : 'No'}
                    </Text>
                </View>

                {diagnostics.lastError && (
                    <View style={styles.diagItem}>
                        <Text style={styles.diagLabel}>Last Error</Text>
                        <Text style={styles.diagError}>
                            [{diagnostics.lastError.status}] {diagnostics.lastError.code}
                        </Text>
                        <Text style={styles.diagErrorMsg}>{diagnostics.lastError.message}</Text>
                        {diagnostics.lastError.requestId && (
                            <Text style={styles.diagMuted}>
                                RequestID: {diagnostics.lastError.requestId}
                            </Text>
                        )}
                    </View>
                )}

                {diagnostics.lastPlaybackUrl && (
                    <View style={styles.diagItem}>
                        <Text style={styles.diagLabel}>Last Playback URL</Text>
                        <Text style={styles.diagMuted} numberOfLines={2}>
                            {diagnostics.lastPlaybackUrl}
                        </Text>
                    </View>
                )}

                <TouchableOpacity style={styles.refreshBtn} onPress={loadSettings}>
                    <Text style={styles.refreshBtnText}>Refresh Diagnostics</Text>
                </TouchableOpacity>
            </View>

            {/* Account */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutBtnText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.spacer} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d0d0d',
    },
    header: {
        padding: 16,
        paddingTop: 60,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    section: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#888',
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        color: '#888',
        marginBottom: 4,
        marginTop: 12,
    },
    value: {
        fontSize: 14,
        color: '#fff',
        fontFamily: 'monospace',
    },
    presets: {
        gap: 8,
        marginTop: 8,
    },
    presetBtn: {
        padding: 12,
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    presetActive: {
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(229, 9, 20, 0.1)',
    },
    presetText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    presetUrl: {
        color: '#666',
        fontSize: 12,
        marginTop: 2,
    },
    customInput: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    input: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        fontSize: 14,
    },
    saveBtn: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
    healthSection: {
        marginTop: 16,
    },
    healthBtn: {
        backgroundColor: '#333',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    healthBtnText: {
        color: '#fff',
        fontWeight: '500',
    },
    healthResult: {
        marginTop: 8,
        padding: 12,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    healthSuccess: {
        backgroundColor: 'rgba(46, 204, 113, 0.1)',
    },
    healthError: {
        backgroundColor: 'rgba(229, 9, 20, 0.1)',
    },
    healthResultText: {
        color: '#fff',
        fontSize: 14,
    },
    healthLatency: {
        color: '#888',
        fontSize: 12,
    },
    diagItem: {
        marginBottom: 12,
    },
    diagLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    diagValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    diagOk: {
        color: '#2ecc71',
    },
    diagWarn: {
        color: '#e74c3c',
    },
    diagError: {
        color: '#e74c3c',
        fontSize: 14,
    },
    diagErrorMsg: {
        color: '#888',
        fontSize: 12,
    },
    diagMuted: {
        color: '#555',
        fontSize: 11,
        fontFamily: 'monospace',
    },
    refreshBtn: {
        backgroundColor: '#1a1a1a',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    refreshBtnText: {
        color: '#fff',
    },
    logoutBtn: {
        backgroundColor: '#3b82f6',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    logoutBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    spacer: {
        height: 40,
    },
});
