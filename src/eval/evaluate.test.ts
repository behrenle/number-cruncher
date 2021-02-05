import { SyntaxTreeNode } from "../types.js";
import evaluate from "./evaluate.js";
import { parse } from "../parse/parser.js";
import { transform } from "../parse/transform.js";
import { createBoolean, createNumber } from "../create/create.js";

const evalTest = (input: string, expected: SyntaxTreeNode) => () => expect(evaluate(transform(parse(input)))).toStrictEqual(expected);

describe("evaluate-primitives", () => {
    test("evaluate-boolean", evalTest(
        "true", createBoolean(true)
    ));

    test("evaluate-number", evalTest(
        "1.2", createNumber(1.2)
    ));
});

describe("evaluate-boolean-expression", () => {
    test("evaluate-and-1", evalTest(
        "true & true", createBoolean(true)
    ));

    test("evaluate-and-2", evalTest(
        "true & false", createBoolean(false)
    ));

    test("evaluate-and-3", evalTest(
        "false & true", createBoolean(false)
    ));

    test("evaluate-and-4", evalTest(
        "false & false", createBoolean(false)
    ));

    describe("evaluate-relation", () => {
        test("evaluate-equal-1", evalTest(
            "true = false", createBoolean(false)
        ));

        test("evaluate-equal-2", evalTest(
            "a = a", createBoolean(true)
        ));

        test("evaluate-equal-3", evalTest(
            "true & true = false | true", createBoolean(true)
        ));
    });
});