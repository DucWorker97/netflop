import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { isAuthenticated } from '../src/lib/auth';

export default function Index() {
    const [checking, setChecking] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        isAuthenticated().then((auth) => {
            setAuthenticated(auth);
            setChecking(false);
        });
    }, []);

    if (checking) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    if (authenticated) {
        return <Redirect href="/(tabs)" />;
    }

    return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d0d0d',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
