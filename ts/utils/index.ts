import { ESLintUtils } from '@typescript-eslint/utils';
import * as path from 'path'

const  { deepMerge } = ESLintUtils;

export const createRule = ESLintUtils.RuleCreator(
    name => `https://typescript-eslint.io/rules/${name}`,
);

interface RuleMap {
    'no-magic-numbers': typeof import('eslint/lib/rules/no-magic-numbers');
}

type RuleId = keyof RuleMap;

const getRulePath = (ruleId: string): string => path.join(__dirname, `../../lib/rules/${ruleId}`)

const getESLintCoreRule: <R extends RuleId>(ruleId: R) => RuleMap[R] =
         <R extends RuleId>(ruleId: R): RuleMap[R] =>
            require(getRulePath(ruleId)) as RuleMap[R];

export {
    deepMerge,
    getESLintCoreRule
}
