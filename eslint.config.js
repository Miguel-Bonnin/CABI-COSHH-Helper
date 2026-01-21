import js from '@eslint/js';
import globals from 'globals';

export default [
    js.configs.recommended,
    // ES modules (js/ and tests/)
    {
        files: ['js/**/*.js', 'tests/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
                // PDF.js global loaded from CDN
                pdfjsLib: 'readonly',
                // Functions exported to window from modules
                importFromJsonData: 'readonly',
            },
        },
        rules: {
            'no-unused-vars': 'warn',
            'no-console': 'off',
            semi: ['error', 'always'],
            quotes: ['error', 'single', { avoidEscape: true }],
            'no-prototype-builtins': 'off',
        },
    },
    // CommonJS scripts (admin-scripts/)
    {
        files: ['admin-scripts/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'script',
            globals: {
                ...globals.node,
            },
        },
        rules: {
            'no-unused-vars': 'warn',
            'no-console': 'off',
            semi: ['error', 'always'],
            quotes: ['error', 'single', { avoidEscape: true }],
        },
    },
];
