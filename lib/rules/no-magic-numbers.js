/**
 * @fileoverview Rule to flag statements that use magic numbers (adapted from https://github.com/danielstjules/buddy.js)
 * @author Vincent Lemeunier
 */

"use strict";

const astUtils = require("../utils/ast-utils");

// Maximum array length by the ECMAScript Specification.
const MAX_ARRAY_LENGTH = 2 ** 32 - 1;
const RGB_LENGTH = 3;
const RGBA_LENGTH = 4;
const MAX_CHANNEL_VALUE = 255;
const MIN_CHANNEL_VALUE = 0;
const MAX_ALPHA_VALUE = 1;
const ALPHA_IDX = 3;

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/**
 * Convert the value to bigint if it's a string. Otherwise return the value as-is.
 * @param {bigint|number|string} x The value to normalize.
 * @returns {bigint|number} The normalized value.
 */
function normalizeIgnoreValue(x) {
    if (typeof x === "string") {
        return BigInt(x.slice(0, -1));
    }
    return x;
}

/** @type {import('../shared/types').Rule} */
module.exports = {
    meta: {
        type: "suggestion",

        docs: {
            description: "Disallow magic numbers",
            recommended: false,
            url: "https://eslint.org/docs/rules/no-magic-numbers"
        },

        schema: [{
            type: "object",
            properties: {
                detectObjects: {
                    type: "boolean",
                    default: false
                },
                enforceConst: {
                    type: "boolean",
                    default: false
                },
                ignore: {
                    type: "array",
                    items: {
                        anyOf: [
                            { type: "number" },
                            { type: "string", pattern: "^[+-]?(?:0|[1-9][0-9]*)n$" }
                        ]
                    },
                    uniqueItems: true
                },
                ignoreArrayIndexes: {
                    type: "boolean",
                    default: false
                },
                ignoreDefaultValues: {
                    type: "boolean",
                    default: false
                },
                allowRGBa: {
                    type: "boolean",
                    default: false
                },
                allowedCalls: {
                    type: "array",
                    default: []
                }
            },
            additionalProperties: false
        }],

        messages: {
            useConst: "Number constants declarations must use 'const'.",
            noMagic: "No magic number: {{raw}}."
        }
    },

    create(context) {
        const config = context.options[0] || {},
            detectObjects = !!config.detectObjects,
            enforceConst = !!config.enforceConst,
            ignore = new Set((config.ignore || []).map(normalizeIgnoreValue)),
            ignoreArrayIndexes = !!config.ignoreArrayIndexes,
            ignoreDefaultValues = !!config.ignoreDefaultValues,
            allowRGBa = !!config.allowRGBa;

        const validArrays = new Set();
        const allowedCalls = new Set(config.allowedCalls)

        const okTypes = detectObjects ? [] : ["ObjectExpression", "Property", "AssignmentExpression"];

        /**
         * Returns whether the rule is configured to ignore the given value
         * @param {bigint|number} value The value to check
         * @returns {boolean} true if the value is ignored
         */
        function isIgnoredValue(value) {
            return ignore.has(value);
        }

        /**
         * Returns whether the number is a default value assignment.
         * @param {ASTNode} fullNumberNode `Literal` or `UnaryExpression` full number node
         * @returns {boolean} true if the number is a default value
         */
        function isDefaultValue(fullNumberNode) {
            const parent = fullNumberNode.parent;

            return parent.type === "AssignmentPattern" && parent.right === fullNumberNode;
        }

        /**
         * Returns whether the given node is used as a radix within parseInt() or Number.parseInt()
         * @param {ASTNode} fullNumberNode `Literal` or `UnaryExpression` full number node
         * @returns {boolean} true if the node is radix
         */
        function isParseIntRadix(fullNumberNode) {
            const parent = fullNumberNode.parent;

            return parent.type === "CallExpression" && fullNumberNode === parent.arguments[1] &&
                (
                    astUtils.isSpecificId(parent.callee, "parseInt") ||
                    astUtils.isSpecificMemberAccess(parent.callee, "Number", "parseInt")
                );
        }

        /**
         * Returns whether the given node is a direct child of a JSX node.
         * In particular, it aims to detect numbers used as prop values in JSX tags.
         * Example: <input maxLength={10} />
         * @param {ASTNode} fullNumberNode `Literal` or `UnaryExpression` full number node
         * @returns {boolean} true if the node is a JSX number
         */
        function isJSXNumber(fullNumberNode) {
            return fullNumberNode.parent.type.indexOf("JSX") === 0;
        }

        /**
         * Returns whether the given node is used as an array index.
         * Value must coerce to a valid array index name: "0", "1", "2" ... "4294967294".
         *
         * All other values, like "-1", "2.5", or "4294967295", are just "normal" object properties,
         * which can be created and accessed on an array in addition to the array index properties,
         * but they don't affect array's length and are not considered by methods such as .map(), .forEach() etc.
         *
         * The maximum array length by the specification is 2 ** 32 - 1 = 4294967295,
         * thus the maximum valid index is 2 ** 32 - 2 = 4294967294.
         *
         * All notations are allowed, as long as the value coerces to one of "0", "1", "2" ... "4294967294".
         *
         * Valid examples:
         * a[0], a[1], a[1.2e1], a[0xAB], a[0n], a[1n]
         * a[-0] (same as a[0] because -0 coerces to "0")
         * a[-0n] (-0n evaluates to 0n)
         *
         * Invalid examples:
         * a[-1], a[-0xAB], a[-1n], a[2.5], a[1.23e1], a[12e-1]
         * a[4294967295] (above the max index, it's an access to a regular property a["4294967295"])
         * a[999999999999999999999] (even if it wasn't above the max index, it would be a["1e+21"])
         * a[1e310] (same as a["Infinity"])
         * @param {ASTNode} fullNumberNode `Literal` or `UnaryExpression` full number node
         * @param {bigint|number} value Value expressed by the fullNumberNode
         * @returns {boolean} true if the node is a valid array index
         */
        function isArrayIndex(fullNumberNode, value) {
            const parent = fullNumberNode.parent;

            return parent.type === "MemberExpression" && parent.property === fullNumberNode &&
                (Number.isInteger(value) || typeof value === "bigint") &&
                value >= 0 && value < MAX_ARRAY_LENGTH;
        }

        /**
         *
         * Returns whether or not given node is a valid RGBA single channel value
         * @param {ASTNode} fullNumberNode a node which has the literal number
         * @returns {boolean} true if the node is a valid channel value
         */
        function isColorRepresentation(fullNumberNode) {
            if (!fullNumberNode) {
                return false;
            }

            return Number.isInteger(fullNumberNode.value) &&
                fullNumberNode.value >= MIN_CHANNEL_VALUE && fullNumberNode.value <= MAX_CHANNEL_VALUE;
        }

        /**
         *
         * Returns whether the given node is used in an array specifying an RGB(A) set
         * @param {ASTNode} fullNumberNode `Literal` or `UnaryExpression` full number node
         * @returns {boolean} true if the node is a valid RGB(A) array
         */
        function isInRGBaArray(fullNumberNode) {
            const parent = fullNumberNode.parent;

            if (!parent) {
                return false;
            }

            const array = parent.elements;

            if (!Array.isArray(array)) {
                return false;
            }

            if (validArrays.has(array)) {
                return true;
            }

            if (array.length !== RGB_LENGTH && array.length !== RGBA_LENGTH) {
                return false;
            }

            const colors = array.slice(0, ALPHA_IDX);

            const validAlpha = array[ALPHA_IDX] ? array[ALPHA_IDX].value >= MIN_CHANNEL_VALUE && array[ALPHA_IDX].value <= MAX_ALPHA_VALUE : true;
            const validArray = validAlpha && colors.every(isColorRepresentation);

            if (validArray) {
                validArrays.add(array);
            }

            return validArray;
        }

        /**
         *
         * Returns whether the given node is used in allowed function call
         * @param {ASTNode} fullNumberNode `Literal` or `UnaryExpression` full number node
         * @returns {boolean} true if the node is a valid function call;
         */

        function isAllowedFunctionParam(fullNumberNode) {
            if(!fullNumberNode.parent){
                return false
            }

            if (fullNumberNode.parent.type === 'CallExpression' && fullNumberNode.parent.callee.name) {

                return allowedCalls.has(fullNumberNode.parent.callee.name)
            }


            const callee = fullNumberNode.parent.callee;

            if(callee && callee.object && callee.property){
                return allowedCalls.has(`${callee.object.name}.${callee.property.name}`)
            }

        }

        /**
         *
         * Returns whether the given node is used in JSON.stringify as spacer
         * @param {ASTNode} fullNumberNode `Literal` or `UnaryExpression` full number node
         * @returns {boolean} true if the node is a valid JSON.stringify;
         */
        function isJsonStringify(fullNumberNode) {
            const parentCallee = fullNumberNode.parent.callee

            if(parentCallee && parentCallee.type === 'MemberExpression'){
                const object = parentCallee.object.name;
                const method = parentCallee.property.name;

                return object === 'JSON' && method === 'stringify'
            }

            return false
        }

        return {
            Literal(node) {
                if (!astUtils.isNumericLiteral(node)) {
                    return;
                }

                let fullNumberNode;
                let value;
                let raw;

                // Treat unary minus as a part of the number
                if (node.parent.type === "UnaryExpression" && node.parent.operator === "-") {
                    fullNumberNode = node.parent;
                    value = -node.value;
                    raw = `-${node.raw}`;
                } else {
                    fullNumberNode = node;
                    value = node.value;
                    raw = node.raw;
                }

                const parent = fullNumberNode.parent;

                // Always allow radix arguments and JSX props
                if (
                    isIgnoredValue(value) ||
                    (ignoreDefaultValues && isDefaultValue(fullNumberNode)) ||
                    isParseIntRadix(fullNumberNode) ||
                    isJSXNumber(fullNumberNode) ||
                    (ignoreArrayIndexes && isArrayIndex(fullNumberNode, value))
                ) {
                    return;
                }

                if (allowRGBa && isInRGBaArray(fullNumberNode)) {
                    return;
                }

                if(allowedCalls.size && isAllowedFunctionParam(fullNumberNode)){
                    return
                }

                if(isJsonStringify(fullNumberNode)){
                    return
                }

                if (parent.type === "VariableDeclarator") {
                    if (enforceConst && parent.parent.kind !== "const") {
                        context.report({
                            node: fullNumberNode,
                            messageId: "useConst"
                        });
                    }
                } else if (
                    !okTypes.includes(parent.type) ||
                    (parent.type === "AssignmentExpression" && parent.left.type === "Identifier")
                ) {
                    context.report({
                        node: fullNumberNode,
                        messageId: "noMagic",
                        data: {
                            raw
                        }
                    });
                }
            }
        };
    }
};
