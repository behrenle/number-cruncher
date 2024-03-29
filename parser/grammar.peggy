{{
    function transformRelationChain(terms, relationSymbols) {
        let relations = [];
        relationSymbols.forEach((relationSymbol, index) => {
            switch (relationSymbol) {
                case "=":
                    relations.push({
                        type: "equals",
                        left: terms[index],
                        right: terms[index + 1]
                    });
                    break;

                case "<":
                    relations.push({
                        type: "less",
                        left: terms[index],
                        right: terms[index + 1]
                    })
                    break;

                case ">":
                    relations.push({
                        type: "greater",
                        left: terms[index],
                        right: terms[index + 1]
                    })
                    break;

                case "<=":
                    relations.push({
                        type: "lessOrEquals",
                        left: terms[index],
                        right: terms[index + 1]
                    })
                    break;

                case ">=":
                    relations.push({
                        type: "greaterOrEquals",
                        left: terms[index],
                        right: terms[index + 1]
                    })
                    break;
            
                default:
                    error("SyntaxError: failed to parse relation chain");
            }
        });

        if (relations.length === 1) {
            return relations[0];
        }

        return relations.reduceRight((right, left) => ({
            type: "and",
            left,
            right
        }));
    }
}}

Start = _ v:(Define / Expression) _ {
    return v;
}

Define = DefineFunction / DefineVariable

DefineVariable = symbol:Symbol _ ":=" _ expr:Expression {
    return {
        type: "define",
        name: symbol.name,
        value: expr
    };
}

// define function with name
SymbolType = _ ":" _ type:("number" / "boolean" / "vector" / "function" / "any") {
    return type;
}
TypedSymbol = symbol:Symbol type:SymbolType? {
    return {
        name: symbol.name,
        type: type ? type : "any",
        evaluate: true
    };
}
SymbolListItem = _ "," _ symbol:TypedSymbol {
    return symbol;
}
SymbolList = first:TypedSymbol _ rest:SymbolListItem* {
    return [first, ...rest];
}
DefineFunction = symbol:Symbol _ "(" _ parameters:SymbolList _ ")" _ ":=" _ expr:Expression {
    return {
        type: "define",
        name: symbol.name,
        value: {
            type: "lambda",
            name: symbol.name,
            header: parameters ? parameters : [],
            expression: expr
        }
    };
}

// define lambda function
DefineLambdaFunction = "(" _ parameters:SymbolList _ ")" _ ("->" / "→") _ expr:Expression {
    return {
        type: "lambda",
        name: "lambda",
        header: parameters ? parameters : [],
        expression: expr
    };
}

Expression = Or

// logic
Or = left:And _ "|" _ right:Or {
    return {
        type: "or",
        left, 
        right
    };
} / And

And = left:RelationChain _ "&" _ right:And {
    return {
        type: "and",
        left, 
        right
    };
} / RelationChain

RelationChain = startTerm:Term chainElements:RelationChainElement+ {
    const terms = [startTerm, ...chainElements.map(chainElement => chainElement.term)];
    const relationSymbols = chainElements.map(chainElement => chainElement.relationSymbol);
    return transformRelationChain(terms, relationSymbols);
} / Term

RelationChainElement = _ relationSymbol:("=" / "<=" / ">=" / "<" / ">") _ term:Term _ {
    return {
        relationSymbol, 
        term
    };
}


// arithmetic
Term = Plus

Plus = left:Minus _ "+" _ right:Plus {
    return {
        type: "plus",
        left, 
        right
    };
} / Minus

// the ugly way to eliminate left recursion 
MinusItem = _ "-" _ item:Times {
    return item;
}
Minus = first:(Times / Negate) rest:MinusItem+ {
    const items = [first, ...rest];
    return items.reduce((left, right) => ({
        type: "minus",
        left, 
        right
    }));
} / Negate

Negate = _ "-" _ value:Negate {
    return {
        type: "negate",
        value
    };
} / Times

Times = left:Divided _ "*" _ right:Times {
    return {
        type: "times",
        left,
        right
    };
} / Divided

// the ugly way to eliminate left recursion 
DividedItem = _ "/" _ item:Power {
    return item;
}
Divided = first:Power rest:DividedItem+ {
    const items = [first, ...rest];
    return items.reduce((left, right) => ({
        type: "divided",
        left, 
        right
    }));
} / Power

Power = left:Value _ "^" _ right:Value {
    return {
        type: "power",
        left, 
        right
    };
} / Value

// values
Value = Boolean 
/ FunctionCall 
/ Symbol 
/ Number
/ Vector 
/ DefineLambdaFunction
/ SubExpression

SubExpression = "(" _ expr:Expression _ ")" {
    return expr;
}

ListElement = _ "," _ item:Expression {
    return item;
}

List = _ first:Expression rest:ListElement* _ {
    return [first, ...rest];
}

Vector = "[" list:List? "]" {
    return {
        type: "vector",
        values: list ? list : []
    };
}

FunctionCall = func:(Symbol / SubExpression) _ "(" parameters:List? ")" {
    return {
        type: "functionCall",
        function: func,
        parameters: parameters ? parameters : []
    }
}

Boolean "boolean" = v:("true" / "false") { 
    return {
        type: "boolean", 
        value: v === "true"
    };
}

Symbol "symbol" = ([a-z] / [A-Z] / "_")+ { 
    if (text() === "__proto__") {
        error("SyntaxError: illegal symbol name '__proto__'")
    }

    return {
        type: "symbol", 
        name: text()
    }; 
}

Number "number" = [0-9]+ ("." [0-9]*)? { 
    return {
        type: "number", 
        value: parseFloat(text(), 10)
    }; 
}

// misc
_ "whitespace"
  	= [ \t\n\r]*