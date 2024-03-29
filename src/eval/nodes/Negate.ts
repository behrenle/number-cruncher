import evaluate from '..';
import createBooleanNode from '../../create/BooleanNode';
import createFunctionCall from '../../create/FunctionCall';
import createLambda from '../../create/Lambda';
import createNegate from '../../create/Negate';
import createNumberNode from '../../create/NumberNode';
import createSymbolNode from '../../create/SymbolNode';
import { Negate, Context, SyntaxTreeNode } from '../../types';

export default function evaluateNegate(node: Negate, context: Context): SyntaxTreeNode {
    const value = evaluate(node.value, context);

    if (value.type === 'boolean' && context.options.config.operators.negateBoolean) {
        return createBooleanNode(!value.value);
    } else if (value.type === 'number' && context.options.config.operators.negateNumber) {
        return createNumberNode(-value.value);
    } else if (value.type === 'function' && context.options.config.operators.negateFunction) {
        return evaluate(
            createLambda(
                value.header,
                createNegate(
                    createFunctionCall(
                        value,
                        value.header.map((headerItem) => createSymbolNode(headerItem.name)),
                    ),
                ),
            ),
            context,
        );
    }

    throw `TypeError: - <${value.type}> is not defined`;
}
