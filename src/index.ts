import { GlobalDocumentationItem } from './types/Plugin';
import { parse } from './parse/parser';
import evaluateNode from './eval';
import serialize from './serialize';
import { Context, Options } from './types';
import loadPlugins from './utils/plugin-loader';
import trigonometryPlugin from './plugins/core/trigonometry/trigonometry';
import { insertStackObject } from './utils/context-utils';
import nsolvePlugin from './plugins/core/nsolve/nsolve';

export { serializeStack } from './utils/context-utils';

const defaultOptions: Options = {
    decimalPlaces: 6,
    decimalSeparator: '.',
    magnitudeThresholdForScientificNotation: 6,
};

let defaultContext: Context;
let loadingLog: string[] = [];
let documentation: GlobalDocumentationItem[];

export function init() {
    const loadingResult = loadPlugins([trigonometryPlugin, nsolvePlugin], defaultOptions);
    defaultContext = loadingResult.context;
    loadingLog = loadingResult.log;
    documentation = loadingResult.documentation;
}

export function getDocumentation() {
    return documentation;
}

export function getLoadingLog() {
    return loadingLog;
}

export function getDefaultContext() {
    if (!defaultContext) {
        throw 'InitializationError: NumberCruncher was not initialized';
    }

    return defaultContext;
}

export interface EvaluateResult {
    result: string;
    context: Context;
}

export default function evaluate(input: string, context: Context = defaultContext): EvaluateResult {
    if (!context) {
        if (!defaultContext) {
            throw 'InitializationError: NumberCruncher was not initialized';
        }
        context = defaultContext;
    }

    let nodeTree;

    try {
        nodeTree = parse(input);
    } catch (syntaxError) {
        throw syntaxError.message;
    }

    const result = evaluateNode(nodeTree, context);
    const resultString = serialize(result, context.options);

    if (result.type === 'define') {
        const value = result.value;
        return {
            result: resultString,
            context: insertStackObject(result.name, value, context),
        };
    }

    return {
        result: resultString,
        context,
    };
}
