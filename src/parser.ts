
export function parse(expression: string): Expression {
    let parent = new Group();
    const root = parent;

    let lastType = "operator" as "operator" | "value";

    const tokens = expression.trim().split(/ +/g);

    for(const token of tokens) {
        if(token === "(") {
            if(lastType !== "operator")
                throw new Error("Operator must precede bracket");

            const child = new Group();
            child.parent = parent;
            parent.add(child);
            parent = child;

            lastType = "operator";
        } else if(token === ")") {
            if(lastType === "operator")
                throw new Error("Content inside brackets needs to end with value");

            if(parent === root)
                new Error("Too many closing brackets");

            parent.merge();
            parent = parent.parent!;

            lastType = "value";
        } else if(token === "*") {
            if(lastType !== "value")
                throw new Error("* may only follow number or closing bracket");

            parent.add(new Multiply(null, null));
            lastType = "operator";
        } else if(token === "/") {
            if(lastType !== "value")
                throw new Error("/ may only follow number or closing bracket");
            
            parent.add(new Divide(null, null));
            lastType = "operator";
        } else if(token === "+") {
            if(lastType !== "value")
                throw new Error("+ may only follow number or closing bracket");
            
            parent.add(new Add(null, null));
            lastType = "operator";
        } else if(token === "-") {
            if(lastType !== "value")
                throw new Error("- may only follow number or closing bracket");
            
            parent.add(new Subtract(null, null));
            lastType = "operator";
        } else if(token === "log") {
            if(lastType !== "operator")
                throw new Error("Log is a Monad, it must follow an operator");

            parent.add(new Logarithm(null));

            lastType = "operator";
        } else if(token === "exp") {
            if(lastType !== "value")
                throw new Error("exp is a Diad, it must follow a value");

            parent.add(new Exponentation(null, null));
            lastType = "operator";
        } else {
            // must be number
            if(lastType !== "operator")
                throw new Error("A number may only follow an operator");

            parent.add(new NumberValue(token));
            lastType = "value";
        }
    }

    if(parent !== root)
        throw new Error("Missing closing brackets");

    if(lastType !== "value")
        throw new Error("You can't end with an operator");

    root.merge();

    return root;
}

interface Expression {
    evaluate(): number | never;
}

class Group implements Expression {
    expressions: Expression[] = [];
    parent: Group | null = null;

    add(expression: Expression) {
        this.expressions.push(expression);
    }

    mergeMonads(...Monads: (typeof Monad)[]) {
        for(let i = 0; i < this.expressions.length; i++) {
            if(Monads.some(Mon => this.expressions[i] instanceof Mon)) {
                const monad = this.expressions[i];
                const value = this.expressions.splice(i + 1, 1)[0]; // thus we don't need to increment i twice
                (monad as any as Monad).value = value;
            }
        }
    }

    mergeDiads(...Diads: (typeof Diad)[]) {
        for(let i = 0; i < this.expressions.length; i++) {
            if(Diads.some(Di => this.expressions[i] instanceof Di)) {
                const diad = this.expressions[i];
                const right = this.expressions.splice(i + 1, 1)[0];
                const left = this.expressions.splice(i - 1, 1)[0];
                (diad as any as Diad).left = left;
                (diad as any as Diad).right = right;
                i -= 1;
            }
        }
    }
    merge() {
        // Operator predescendence:
        this.mergeMonads(Logarithm);
        this.mergeDiads(Multiply, Divide);
        this.mergeDiads(Add, Subtract);
        this.mergeDiads(Exponentation);
    }

    evaluate() {
        if(this.expressions.length !== 1)
            throw new Error("Must merge Group before evaluation");

        return this.expressions[0].evaluate();
    }
}

class NumberValue implements Expression {
    constructor(public value: string) {}

    evaluate() {
        const parsed = parseInt(this.value);
        if(isNaN(parsed))
            throw new Error(`Failed to parse NumberValue '${this.value}'`);

        return parsed;
    }

}

class Diad {
    constructor(public left: Expression | null, public right: Expression | null) {}
}

class Monad {
    constructor(public value: Expression | null) {}
}

class Add extends Diad implements Expression { 
    evaluate() {
        return this.left!.evaluate() + this.right!.evaluate();
    }
}

class Subtract extends Diad implements Expression {
    evaluate() {
        return this.left!.evaluate() - this.right!.evaluate();
    }
}

class Multiply extends Diad implements Expression {
    evaluate() {
        return this.left!.evaluate() * this.right!.evaluate();
    }
}
class Divide extends Diad implements Expression {
    evaluate() {
        const right = this.right!.evaluate();
        if(right === 0)
            throw new Error("Division by Zero");

        return this.left!.evaluate() / right;
    }
}

class Exponentation extends Diad implements Expression {
    evaluate() {
        return this.left!.evaluate() ** this.right!.evaluate();
    }
}

class Logarithm extends Monad implements Expression {
    evaluate() {
        return Math.log2(this.value!.evaluate());
    }
}