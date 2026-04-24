tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#1da0d8",
                "primary-dark": "#1682b1",
                "background-light": "#f4f6f8",
                "background-dark": "#1a1f24",
                "column-light": "#e9edf0",
                "column-dark": "#252d35",
                "card-light": "#ffffff",
                "card-dark": "#2e3842",
            },
            fontFamily: {
                "display": ["Space Grotesk", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.5rem",
                "lg": "0.75rem",
                "md": "0.5rem",
                "xl": "1.5rem",
                "full": "9999px"
            },
            boxShadow: {
                'card': '0 2px 4px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
                'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            }
        },
    },
}
