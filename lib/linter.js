"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatus = exports.cache = exports.invoke = void 0;
var path_1 = __importDefault(require("path"));
var camelize_1 = __importDefault(require("camelize"));
var minimist_1 = __importDefault(require("minimist"));
var nanolru_1 = __importDefault(require("nanolru"));
var resolve_1 = __importDefault(require("resolve"));
var prettierCache = new nanolru_1.default(10);
function createCache(cwd) {
    var prettierPath;
    try {
        prettierPath = resolve_1.default.sync('prettier', { basedir: cwd });
    }
    catch (e) {
        // module not found
        prettierPath = resolve_1.default.sync('prettier');
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    var prettier = require(prettierPath);
    var configPath = prettier.resolveConfigFile.sync(cwd);
    var ignorePath = path_1.default.join(cwd, '.prettierignore');
    var options = prettier.resolveConfig.sync(cwd, {
        useCache: false,
        editorconfig: true,
    }) || {};
    var cacheInstance = {
        prettier: prettier,
        options: options,
        ignorePath: ignorePath,
        hasConfig: Boolean(configPath),
    };
    return prettierCache.set(cwd, cacheInstance);
}
function clearRequireCache(cwd) {
    Object.keys(require.cache)
        .filter(function (key) { return key.startsWith(cwd); })
        .forEach(function (key) {
        delete require.cache[key];
    });
}
function parseArguments(args) {
    var parsedOptions = camelize_1.default(minimist_1.default(args, {
        boolean: [
            'use-tabs',
            'semi',
            'single-quote',
            'jsx-single-quote',
            'bracket-spacing',
            'jsx-bracket-same-line',
            'require-pragma',
            'insert-pragma',
            'vue-indent-script-and-style',
            'config',
            'editorconfig',
            // Added by prettier_d_slim.
            'color',
            'stdin',
        ],
        default: {
            editorconfig: true,
            config: true,
            'print-width': 80,
            'tab-width': 2,
            'use-tabs': false,
            semi: true,
            'single-quote': false,
            'quote-props': 'as-needed',
            'jsx-single-quote': false,
            'trailing-comma': 'none',
            'bracket-spacing': true,
            'jsx-bracket-same-line': false,
            'arrow-parens': 'avoid',
            'range-start': 0,
            'range-end': Infinity,
            'require-pragma': false,
            'insert-pragma': false,
            'prose-wrap': 'preserve',
            'html-whitespace-sensitivity': 'css',
            'vue-indent-script-and-style': false,
            'end-of-line': 'auto',
        },
    }));
    if (parsedOptions.stdinFilepath) {
        parsedOptions.filepath = parsedOptions.stdinFilepath;
    }
    if (parsedOptions.configPrecedence == null) {
        parsedOptions.configPrecedence = 'file-override';
    }
    return parsedOptions;
}
/**
 * The core_d service entry point.
 */
var invoke = function (cwd, args, text, mtime) {
    process.chdir(cwd);
    var cache = prettierCache.get(cwd);
    if (!cache) {
        cache = createCache(cwd);
    }
    else if (mtime > (cache.lastRun || 0)) {
        clearRequireCache(cwd);
        cache = createCache(cwd);
    }
    cache.lastRun = Date.now();
    // Skip if there is no prettier config.
    if (!cache.hasConfig) {
        return text;
    }
    var parsedOptions = parseArguments(args);
    var filePath = parsedOptions.filepath;
    if (!filePath) {
        throw new Error('set filePath with `--stdin-filepath`');
    }
    var fileInfo = cache.prettier.getFileInfo.sync(filePath, {
        ignorePath: cache.ignorePath,
        pluginSearchDirs: parsedOptions.pluginSearchDir
            ? parsedOptions.pluginSearchDir.split(':')
            : undefined,
        plugins: parsedOptions.plugin ? parsedOptions.plugin.split(':') : undefined,
    });
    // Skip if file is ignored.
    if (fileInfo.ignored) {
        return text;
    }
    var options = {};
    switch (parsedOptions.configPrecedence) {
        case 'cli-override':
            options = Object.assign({}, cache.options, parsedOptions);
            break;
        case 'file-override':
            options = Object.assign({}, parsedOptions, cache.options);
            break;
    }
    if (parsedOptions.stdin && parsedOptions.filepath) {
        options.filepath = parsedOptions.filepath;
    }
    return cache.prettier.format(parsedOptions.text || text, options);
};
exports.invoke = invoke;
exports.cache = prettierCache;
/**
 * The core_d status hook.
 */
var getStatus = function () {
    var keys = prettierCache.keys;
    if (keys.length === 0) {
        return 'No instances cached.';
    }
    if (keys.length === 1) {
        return 'One instance cached.';
    }
    return keys.length + " instances cached.";
};
exports.getStatus = getStatus;
