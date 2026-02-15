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
                sans: ['Open Sans', ...defaultTheme.fontFamily.sans],
                heading: ['Roboto', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                brand: {
                    red: '#e51a2f',
                    dark: '#0a0a0a',
                    darker: '#070707',
                    gray: '#1a1a1a',
                    'gray-light': '#222222',
                    'gray-medium': '#333333',
                    'text-muted': '#999999',
                    'text-light': '#aaaaaa',
                    'border': '#2a2a2a',
                },
            },
        },
    },
    plugins: [typography],
};
