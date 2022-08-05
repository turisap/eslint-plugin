declare module 'eslint/lib/rules/no-magic-numbers' {
    import { TSESLint, TSESTree } from '@typescript-eslint/utils';

    const rule: TSESLint.RuleModule<
        'noMagic',
        [
            {
                ignore?: string[];
                ignoreArrayIndexes?: boolean;
                enforceConst?: boolean;
                detectObjects?: boolean;
                ignoreNumericLiteralTypes?: boolean;
                ignoreEnums?: boolean;
                ignoreReadonlyClassProperties?: boolean;
                ignoreTypeIndexes?: boolean;
            },
        ],
        {
            Literal(node: TSESTree.Literal): void;
        }
        >;
    export = rule;
}

