#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
process.env.CORE_D_TITLE = 'prettier_d_slim';
process.env.CORE_D_DOTFILE = '.prettier_d_slim';
process.env.CORE_D_SERVICE = require.resolve('../linter');
// Needs to be imported after env vars are set.
var core_d_1 = __importDefault(require("core_d"));
function main() {
    var cmd = process.argv[2];
    if (cmd === '-v' || cmd === '--version') {
        console.log('v%s (prettier_d_slim v%s)', require('prettier/package.json').version, require('../package.json').version);
        return;
    }
    if (cmd === '-h' || cmd === '--help') {
        return;
    }
    if (cmd === 'start' ||
        cmd === 'stop' ||
        cmd === 'restart' ||
        cmd === 'status') {
        core_d_1.default[cmd]();
        return;
    }
    var args = process.argv.slice(2);
    if (args.indexOf('--stdin') > -1) {
        var text_1 = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', function (chunk) {
            text_1 += chunk;
        });
        process.stdin.on('end', function () {
            core_d_1.default.invoke(args, text_1);
        });
        return;
    }
    core_d_1.default.invoke(args);
}
main();
