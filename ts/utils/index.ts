import { ESLintUtils } from '@typescript-eslint/utils';

const  { deepMerge } = ESLintUtils;

export const createRule = ESLintUtils.RuleCreator(
    name => `https://typescript-eslint.io/rules/${name}`,
);

interface RuleMap {
    'no-magic-numbers': typeof import('eslint/lib/rules/no-magic-numbers');
}

type RuleId = keyof RuleMap;

const getESLintCoreRule: <R extends RuleId>(ruleId: R) => RuleMap[R] =
         <R extends RuleId>(ruleId: R): RuleMap[R] =>
            require(`eslint/lib/rules/${ruleId}`) as RuleMap[R];

export {
    deepMerge,
    getESLintCoreRule
}
