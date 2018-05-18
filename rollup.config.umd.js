import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import {nameLibrary, PATH_SRC, PATH_DIST} from './config-library.js';
export default {
    input: PATH_SRC + nameLibrary + '.js',
    output: {
        name: nameLibrary,
        sourcemap: true,
        format: 'umd',
        file: PATH_DIST + nameLibrary + ".umd.js"
    },
    plugins: [
        babel({
            exclude: 'node_modules/**'
        }),
        resolve({
            module: true,
            main: true
        }),
        commonjs({
            include: 'node_modules/**',
        })
    ],
    onwarn: warning => {
        const skip_codes = [
            'THIS_IS_UNDEFINED',
            'MISSING_GLOBAL_NAME'
        ];
        if (skip_codes.indexOf(warning.code) != -1) return;
        console.error(warning);
    }
};