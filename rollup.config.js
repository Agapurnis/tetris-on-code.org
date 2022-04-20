// @ts-check
import { terser } from "rollup-plugin-terser";
import typescript from "rollup-plugin-typescript2";
import eslint from '@rbnlffl/rollup-plugin-eslint';


/** @type {import("rollup").RollupOptions} */
export default {
    input: "./src/entry.ts",
    output: {
        file: "./dist/bundle.js",
        format: /** @type {const} */("iife"),
        banner: `/**
 * @see https://github.com/Agapurnis/tetris-on-code.org
 * @author Katini <agapurnis@outlook.com>
 * @license MIT
 */
`,
    },

    plugins: [
        typescript(),
        eslint({ throwOnError: true }),
        // terser(),
    ]
}