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
        type: "defineVariable",
        name: symbol.name,
        value: expr
    };
}

SymbolType = _ ":" _ type:("number" / "boolean" / "vector" / "any") {
    return type;
}
TypedSymbol = symbol:Symbol type:SymbolType? {
    return {
        name: symbol.name,
        type: type ? type : "any"
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
        type: "defineFunction",
        name: symbol.name,
        parameters: parameters ? parameters : [],
        value: expr
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

RelationChain = startTerm:Term _ chainElements:RelationChainElement+ {
    const terms = [startTerm, ...chainElements.map(chainElement => chainElement.term)];
    const relationSymbols = chainElements.map(chainElement => chainElement.relationSymbol);
    return transformRelationChain(terms, relationSymbols);
} / Term

RelationChainElement = relationSymbol:("=" / "<" / ">" / "<=" / ">=") _ term:Term _ {
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

Minus = left:Times _ "-" _ right:Minus {
    return {
        type: "minus",
        left, 
        right
    };
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

Divided = left:Power _ "/" _ right:Divided {
    return {
        type: "devided",
        left, 
        right
    };
} / Power

Power = left:Value _ "^" _ right:Value {
    return {
        type: "power",
        left, 
        right
    };
} / Value

// values
Value = Boolean / FunctionCall / Symbol / Number / Vector / "(" _ expr:Expression _ ")" {
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

FunctionCall = symbol:Symbol _ "(" parameters:List? ")" {
    return {
        type: "functionCall",
        name: symbol.name,
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