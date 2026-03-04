import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
    const icons: Record<string, string> = {
        home: '🏠',
        search: '🔍',
        list: '📋',
        history: '📺',
        downloads: '📥',
        notifications: '🔔',
        settings: '⚙️',
    };
    return (
        <Text style={[styles.icon, focused && styles.iconFocused]}>
            {icons[name] || '●'}
        </Text>
    );
}

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarStyle: {
                    backgroundColor: '#0d0d0d',
                    borderTopColor: '#1a1a1a',
                    height: 60,
                    paddingBottom: 8,
                },
                tabBarActiveTintColor: '#fff',
                tabBarInactiveTintColor: '#666',
                headerStyle: { backgroundColor: '#0d0d0d' },
                headerTintColor: '#fff',
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    headerShown: false,
                    tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: 'Search',
                    headerShown: false,
                    tabBarIcon: ({ focused }) => <TabIcon name="search" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="my-list"
                options={{
                    title: 'My List',
                    headerShown: false,
                    tabBarIcon: ({ focused }) => <TabIcon name="list" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: 'History',
                    headerShown: false,
                    tabBarIcon: ({ focused }) => <TabIcon name="history" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="downloads"
                options={{
                    title: 'Downloads',
                    headerShown: false,
                    tabBarIcon: ({ focused }) => <TabIcon name="downloads" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="notifications"
                options={{
                    title: 'Alerts',
                    headerShown: false,
                    tabBarIcon: ({ focused }) => <TabIcon name="notifications" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    headerShown: false,
                    tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} />,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    icon: {
        fontSize: 20,
        opacity: 0.6,
    },
    iconFocused: {
        opacity: 1,
    },
});
