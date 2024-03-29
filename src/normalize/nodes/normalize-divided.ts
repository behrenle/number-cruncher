import normalize from '..';
import createDivided from '../../create/Divided';
import createNegate from '../../create/Negate';
import createNumberNode from '../../create/NumberNode';
import createPlus from '../../create/Plus';
import createPower from '../../create/Power';
import createTimes from '../../create/Times';
import evaluate from '../../eval';
import { combineNormalizers, PartialNormalizer } from '../../utils/normalize-utils';
import { containsVariables } from '../../utils/symbolic-utils';

const evaluateIfPossible: PartialNormalizer = (node, context) => {
    if (!containsVariables(node, context)) {
        return evaluate(node, context);
    }
};

const normalizeChildren: PartialNormalizer = (node, context) => {
    if (node.type !== 'divided') {
        return;
    }

    return createDivided(normalize(node.left, context), normalize(node.right, context));
};

const distributeLeftChildPlus: PartialNormalizer = (node, context) => {
    if (node.type !== 'divided' || node.left.type !== 'plus') {
        return;
    }

    return normalize(
        createPlus(createDivided(node.left.left, node.right), createDivided(node.left.right, node.right)),
        context,
    );
};

const flipRightChildDivided: PartialNormalizer = (node, context) => {
    if (node.type !== 'divided' || node.right.type !== 'divided') {
        return;
    }

    return normalize(createTimes(node.left, createDivided(node.right.right, node.right.left)), context);
};

const moveLeftNegateOut: PartialNormalizer = (node, context) => {
    if (node.type !== 'divided' || node.left.type !== 'negate') {
        return;
    }

    return normalize(createNegate(createDivided(node.left.value, node.right)), context);
};

const moveRightNegateOut: PartialNormalizer = (node, context) => {
    if (node.type !== 'divided' || node.right.type !== 'negate') {
        return;
    }

    return normalize(createNegate(createDivided(node.left, node.right.value)), context);
};

const splitTimesDenominator: PartialNormalizer = (node, context) => {
    if (node.type !== 'divided' || node.right.type !== 'times') {
        return;
    }

    return normalize(
        createTimes(createDivided(node.left, node.right.left), createDivided(createNumberNode(1), node.right.right)),
        context,
    );
};

const convertSymbolDenominatorToPower: PartialNormalizer = (node, context) => {
    if (node.type !== 'divided' || node.right.type !== 'symbol') {
        return;
    }

    return normalize(createTimes(node.left, createPower(node.right, createNumberNode(-1))), context);
};

const negatePowerDenominatorAndMoveToNumerator: PartialNormalizer = (node, context) => {
    if (node.type !== 'divided' || node.right.type !== 'power') {
        return;
    }

    return normalize(createTimes(node.left, createPower(node.right.left, createNegate(node.right.right))), context);
};

const normalizeDivided = combineNormalizers([
    evaluateIfPossible,
    flipRightChildDivided,
    normalizeChildren,
    distributeLeftChildPlus,
    moveLeftNegateOut,
    moveRightNegateOut,
    splitTimesDenominator,
    convertSymbolDenominatorToPower,
    negatePowerDenominatorAndMoveToNumerator,
]);

export default normalizeDivided;
