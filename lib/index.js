/**
 * @fileoverview no-magic-numbers enhanced
 * @author Kirill Shakirov
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const requireIndex = require("requireindex");

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------


// import all rules in lib/rules

module.exports.rules = requireIndex(__dirname + "/rules");

// custom preset for rules configuration

module.exports.configs = {
    general: {
        plugins:["eslint-plugin-turisap"],
        rules: {
            "eslint-plugin-turisap/no-magic-numbers": [
                "error",
                {
                    ignore: [-1, 0, 1],
                    ignoreArrayIndexes: true,
                    enforceConst: true,
                    allowRGBa: true
                },
            ]
        }
    }
}



