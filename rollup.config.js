// @ts-check
import { __spreadArray  } from "tslib";
import { terser } from "rollup-plugin-terser";
import typescript from "rollup-plugin-typescript2";
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
          return /\*!|@preserve|@license|@cc_on|Copyright|\(c\)|©|cc\w/i.test(comment.value);
        }
    }
}

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
        eslint({ throwOnError: true }),
        terser({
            output,
            mangle: false,
            compress: true,
        }),
    ]
}