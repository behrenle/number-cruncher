import { SyntaxTreeNode } from './../types/SyntaxTreeNodes';
import { Vector } from '../types';

type VectorShape = number | (number | VectorShape)[];

export function getShape(vector: Vector): VectorShape {
    const containsVectors = vector.values.reduce((acc, value) => acc || value.type === 'vector', false);

    if (!containsVectors) {
        return vector.values.length;
    }

    return vector.values.map((value) => (value.type === 'vector' ? getShape(value) : 1));
}

function compareShapes(shapeA: VectorShape, shapeB: VectorShape): boolean {
    if (typeof shapeA === 'number' && typeof shapeB === 'number') {
        return shapeA === shapeB;
    }

    if (shapeA instanceof Array && shapeB instanceof Array && shapeA.length === shapeB.length) {
        return shapeA.reduce((acc, _, index) => compareShapes(shapeA[index], shapeB[index]) && acc, true);
    }

    return false;
}

export function compareShapesOfVectors(vectorA: Vector, vectorB: Vector): boolean {
    return compareShapes(getShape(vectorA), getShape(vectorB));
}

function isShapeHomogeneous(shape: VectorShape): boolean {
    if (typeof shape === 'number') {
        return true;
    }

    const childShapesHomogeneous = shape.every(isShapeHomogeneous);
    if (!childShapesHomogeneous) {
        return false;
    }

    for (let i = 1; i < shape.length; i++) {
        if (!compareShapes(shape[i], shape[0])) {
            return false;
        }
    }

    return true;
}

function getShapeRank(shape: VectorShape): number {
    if (typeof shape === 'number') {
        return 1;
    }

    return getShapeRank(shape[0]) + 1;
}

export function isVectorHomogeneous(vector: Vector): boolean {
    return isShapeHomogeneous(getShape(vector));
}

export function getVectorRank(vector: Vector): number {
    const shape = getShape(vector);

    if (!isShapeHomogeneous(shape)) {
        throw `TypeError: can not get rank of inhomogeneous vector`;
    }

    return getShapeRank(shape);
}

function getShapeDimensions(shape: VectorShape): number[] {
    if (typeof shape === 'number') {
        return [shape];
    }

    return [shape.length, ...getShapeDimensions(shape[0])];
}

export function getVectorDimensions(vector: Vector): number[] {
    const shape = getShape(vector);

    if (!isShapeHomogeneous(shape)) {
        throw `TypeError: can not get dimensions of inhomogeneous vector`;
    }

    return getShapeDimensions(shape);
}

export function getVectorElement(vector: Vector, index: number[]): SyntaxTreeNode {
    if (index.length === 0) {
        throw 'RuntimeError: empty vector index';
    }

    if (vector.values.length <= index[0]) {
        throw `RuntimeError: vector index out of bounds`;
    }

    if (index.length === 1) {
        return vector.values[index[0]];
    } else {
        const value = vector.values[index[0]];
        if (value.type !== 'vector') {
            throw 'RuntimeError: incompatible vector index';
        }
        return getVectorElement(value, index.slice(1));
    }
}
