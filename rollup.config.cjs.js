import config from './rollup.config.umd.js';
import {nameLibrary,PATH_DIST,PATH_SRC} from './config-library.js';
import copy from 'rollup-plugin-copy';

config.output.format = "cjs";
config.output.file = PATH_DIST+nameLibrary+".cjs.js";
config.plugins.push(copy({
    [PATH_SRC+nameLibrary + ".css"]: PATH_DIST+ nameLibrary + ".css",
    verbose: true
}));
export default config;
