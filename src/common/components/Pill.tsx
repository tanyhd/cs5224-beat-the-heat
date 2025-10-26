interface PillProps {
    label: string;
}

const Pill = ({ label }: PillProps) => {
    return <div style={{
        display: 'inline-block',
        padding: '8px 16px',
        borderRadius: '16px',
        backgroundColor: '#EFFCFB',
        color: '#064E3B',
        fontWeight: '600',
        fontSize: '14px',
    }}>{label}</div>;
}

export default Pill;