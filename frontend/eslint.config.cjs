const globals = require('globals');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const reactHooks = require('eslint-plugin-react-hooks');
const reactRefresh = require('eslint-plugin-react-refresh');

const browserGlobals = Object.fromEntries(
    Object.entries(globals.browser).map(([key, value]) => [key.trim(), value])
);

module.exports = [
    {
        ignores: ['dist', '.tanstack', 'src/routeTree.gen.ts'],
    },
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2020,
            sourceType: 'module',
            globals: {
                ...browserGlobals,
                ...globals.es2020,
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            '@typescript-eslint/no-explicit-any': 'off',
            'react-refresh/only-export-components': [
                'warn',
                {allowConstantExport: true},
            ],
        },
    },
];
