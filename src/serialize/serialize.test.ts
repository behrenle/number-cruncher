import {evaluateNode, parse, serialize} from "../index.js";
import {Context, Options, SyntaxTreeNode} from "../types.js";

const options: Options = {
    decimalPlaces: 6,
    decimalSeparator: ".",
    magnitudeThresholdForScientificNotation: 4
};

const context: Context = {options, stack: []};

const baseSerializeTest = (input: SyntaxTreeNode, expectedOutput: string) => () => expect(
    serialize(
        input,
        options
    )).toStrictEqual(expectedOutput);

const serializeTest = (input: string, expectedOutput: string) => baseSerializeTest(parse(input), expectedOutput);
const serializeTestWithEvaluation = (input: string, expectedOutput: string) => baseSerializeTest(
    evaluateNode(parse(input), context), expectedOutput
)

const serializeTestEqualOutput = (input: string) => serializeTest(input, input);


describe("serialize-primitives", () => {
    test("serialize-number-1", serializeTestEqualOutput("62.25"));
    test("serialize-number-2", serializeTest("1.1234567", "1.123457"));
    test("serialize-number-3", serializeTest("12345678", "1.234568 * 10^7"));
    test("serialize-number-4", serializeTestWithEvaluation("-12345678", "-1.234568 * 10^7"));
    test("serialize-number-5", serializeTest("0.00001", "1 * 10^(-5)"));
    test("serialize-number-6", serializeTestWithEvaluation("-0.00001", "-1 * 10^(-5)"));

    test("serialize-symbol", serializeTest("xyz", "xyz"));
    test("serialize-boolean-1", serializeTest("true", "true"));
    test("serialize-boolean-2", serializeTest("false", "false"));
});

describe("serialize-boolean-operators", () => {
    test("serialize-relations", serializeTest(
        "a < b > c <= d >= e = f",
        "(a < b) & (b > c) & (c <= d) & (d >= e) & (e = f)"
    ));

    test("serialize-and", serializeTest(
        "(a & b) & (c & d)",
        "a & b & c & d"
    ));

    test("serialize-or", serializeTest(
        "(a | b) | (c | d)",
        "a | b | c | d"
    ));

    test("serialize-and-or-1", serializeTest(
        "(a & b) | (c & d)",
        "a & b | c & d"
    ));

    test("serialize-and-or-2", serializeTest(
        "(a | b) & (c | d)",
        "(a | b) & (c | d)"
    ));
})