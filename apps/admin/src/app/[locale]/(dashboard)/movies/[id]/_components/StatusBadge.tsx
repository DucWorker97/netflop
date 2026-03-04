
interface StatusBadgeProps {
    status: string;
    type: 'publish' | 'encode';
}

function getBadgeStyle(status: string, type: 'publish' | 'encode'): { className: string; label: string; style: React.CSSProperties } {
    if (type === 'publish') {
        if (status === 'published') {
            return {
                className: 'badge badge-neon-green',
                label: 'Published',
                style: {},
            };
        }
        return {
            className: 'badge badge-neon-cyan',
            label: 'Draft',
            style: {},
        };
    }

    // encode type
    switch (status) {
        case 'ready':
            return { className: 'badge badge-neon-green glow-green', label: 'Ready', style: {} };
        case 'processing':
        case 'pending':
            return { className: 'badge badge-neon-cyan', label: status === 'processing' ? 'Processing' : 'Pending', style: {} };
        case 'failed':
            return { className: 'badge', label: 'Failed', style: { background: 'rgba(239,68,68,0.15)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.3)' } };
        default:
            return { className: 'badge badge-outline-mono', label: 'Idle', style: {} };
    }
}

export default function StatusBadge({ status, type }: StatusBadgeProps) {
    const { className, label, style } = getBadgeStyle(status, type);

    return (
        <span className={className} style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.03em', ...style }}>
            {type === 'encode' && (status === 'processing' || status === 'pending') && (
                <span className="spinner spinner-sm" style={{ width: 10, height: 10, marginRight: 4, borderTopColor: 'var(--neon-cyan)' }}></span>
            )}
            {label}
        </span>
    );
}
