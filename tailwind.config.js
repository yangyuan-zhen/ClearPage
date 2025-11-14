module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            colors: {
                primary: '#4F46E5',
                secondary: '#64748B',
                accent: '#10B981',
                success: '#22C55E',
                danger: '#EF4444',
                warning: '#F59E0B',
                muted: '#F1F5F9',
                border: '#E5E7EB',
            },
            boxShadow: {
                soft: '0 1px 3px rgba(0,0,0,0.08)',
                elevated: '0 10px 15px rgba(0,0,0,0.08)'
            },
            borderRadius: {
                xl: '0.75rem',
                '2xl': '1rem'
            }
        },
    },
    plugins: [],
    darkMode: "class",
};
