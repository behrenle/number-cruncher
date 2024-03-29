import evaluate, { init, isInitialized } from '..';
import { Context, Options } from '../types';
import { createOptions } from './context-utils';

let lastId = 0;

const testOptions = createOptions();

export function createTestContext(stack: Context['stack'], options: Options = testOptions): Context {
    return {
        stack,
        options,
    };
}

export function integrationTest(input: string, expectedOutput: string, context?: Context) {
    if (!isInitialized()) {
        init();
    }

    test(`integration test #${++lastId}`, () => {
        expect(evaluate(input, context).result).toBe(expectedOutput);
    });
}

export function integrationTestThrow(input: string, context?: Context) {
    if (!isInitialized()) {
        init();
    }

    test(`integration test (throw) #${++lastId}`, () => {
        expect(() => evaluate(input, context)).toThrow();
    });
}
