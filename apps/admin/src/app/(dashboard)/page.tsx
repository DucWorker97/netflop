'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend
} from 'recharts';

interface DashboardStats {
    totalUsers: number;
    totalMovies: number;
    totalRevenue: number;
    viewsLast7Days: { date: string; views: number }[];
    topMovies: { id: string; title: string; views: number; posterUrl: string | null }[];
}

export default function DashboardPage() {
    const { data: stats, isLoading } = useQuery<DashboardStats>({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const { data } = await api.get('/analytics/dashboard-stats');
            return data;
        },
    });

    if (isLoading) {
        return <div className="p-8 text-center text-gray-400">Loading dashboard...</div>;
    }

    if (!stats) {
        return <div className="p-8 text-center text-red-400">Failed to load stats.</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                    <h3 className="text-gray-400 text-sm font-medium">Total Users</h3>
                    <p className="text-3xl font-bold text-white mt-2">{stats.totalUsers.toLocaleString()}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                    <h3 className="text-gray-400 text-sm font-medium">Active Movies</h3>
                    <p className="text-3xl font-bold text-white mt-2">{stats.totalMovies.toLocaleString()}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                    <h3 className="text-gray-400 text-sm font-medium">Total Revenue</h3>
                    <p className="text-3xl font-bold text-green-400 mt-2">
                        ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Views Chart */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                    <h3 className="text-white text-lg font-semibold mb-4">Views (Last 7 Days)</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.viewsLast7Days}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#9CA3AF"
                                    tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { weekday: 'short' })}
                                />
                                <YAxis stroke="#9CA3AF" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="views"
                                    stroke="#3B82F6"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#3B82F6' }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Movies */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                    <h3 className="text-white text-lg font-semibold mb-4">Top 5 Movies</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.topMovies} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" />
                                <XAxis type="number" stroke="#9CA3AF" hide />
                                <YAxis
                                    dataKey="title"
                                    type="category"
                                    stroke="#E5E7EB"
                                    width={100}
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                                />
                                <Bar dataKey="views" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
