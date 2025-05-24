import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
    {
        ignores: ['**/dist/*'],
    },
    eslint.configs.recommended,
    tseslint.configs.strict,
    tseslint.configs.stylistic,
    {
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    ignoreRestSiblings: true,
                },
            ],
            'no-magic-numbers': [
                'error',
                {
                    ignore: [0, 1, -1, 2],
                },
            ],
        },
    },
    prettierConfig,
);
