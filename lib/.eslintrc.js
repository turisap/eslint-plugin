module.exports = {
    extends: [
        "eslint:recommended",
        "plugin:eslint-plugin/recommended",
        "plugin:node/recommended",
    ],
    overrides: [
        {
            files: ["tests/**/*.js"],
            env: { mocha: true },
        },
    ],
    rules: {
        indent: ["error", 4]
    }
};
