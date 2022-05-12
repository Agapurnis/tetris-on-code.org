// @ts-check
import { terser } from "rollup-plugin-terser";
import typescript from "rollup-plugin-typescript2";
import replace from '@rollup/plugin-replace';
import eslint from '@rbnlffl/rollup-plugin-eslint';

const license = `/**
* @see https://github.com/Agapurnis/tetris-on-code.org
* @author Katini <agapurnis@outlook.com>
* @license MIT
*/
`

const output = {
    comments (_, comment) {
        if (comment.type == "comment2") {
          return /\*!|@preserve|@license|@cc_on|Copyright|\(c\)|©/i.test(comment.value);
        }
    }
}

const _package = require("./package.json");
const replacements = {
    "_VERSION": JSON.stringify(_package.version),
    "_LICENSE": JSON.stringify(_package.license),
    "_BUILD_ENVIRONMENT": JSON.stringify(process.env.NODE_ENV),
    "_BUILD_TIMESTAMP": JSON.stringify(Date.now())
}

const PROD_PLUGINS = [ terser({ output, mangle: false, compress: true }) ]
const  DEV_PLUGINS = []

/** @type {import("rollup").RollupOptions} */
export default {
    input: "./src/entry.ts",
    output: {
        file: "./dist/bundle.js",
        format: /** @type {const} */("iife"),
        banner: license,
    },

    plugins: [
        typescript(),
        replace({ preventAssignment: false, values: replacements }),
        eslint({ throwOnError: true }),
        ...(process.env.NODE_ENV.toLowerCase() === "production"  ? PROD_PLUGINS : []),
        ...(process.env.NODE_ENV.toLowerCase() === "development" ? DEV_PLUGINS  : []),
    ]
}