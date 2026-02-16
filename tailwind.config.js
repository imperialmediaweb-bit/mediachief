import defaultTheme from 'tailwindcss/defaultTheme';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/**/*.blade.php',
        './resources/**/*.js',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-body, "Open Sans")', ...defaultTheme.fontFamily.sans],
                heading: ['var(--font-heading, "Roboto")', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                brand: {
                    red: 'var(--brand-primary, #e51a2f)',
                    dark: 'var(--brand-dark, #0a0a0a)',
                    darker: 'var(--brand-darker, #070707)',
                    gray: 'var(--brand-gray, #1a1a1a)',
                    'gray-light': 'var(--brand-gray-light, #222222)',
                    'gray-medium': 'var(--brand-gray-medium, #333333)',
                    'text-muted': 'var(--brand-text-muted, #999999)',
                    'text-light': 'var(--brand-text-light, #aaaaaa)',
                    'border': 'var(--brand-border, #2a2a2a)',
                },
            },
        },
    },
    plugins: [typography],
};
