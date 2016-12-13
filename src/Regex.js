/**
 * Copyright Blake Loring <blake_l@parsed.uk> 2015
 * Approximate JavaScript regular expression to Z3 regex parser
 */

function CullOuterRegex(regex) {
    let firstSlash = regex.indexOf('/');
    let lastSlash = regex.lastIndexOf('/');
    return regex.substr(firstSlash + 1, lastSlash - 1);
}

function RegexRecursive(ctx, regex, idx) {

    function more() {
        return idx < regex.length && current() != ')';
    }

    function mk(v) {
        return ctx.mkSeqToRe(ctx.mkString(v));
    }

    function current() {
        return regex[idx];
    }

    function next() {
        return regex[idx++];
    }

    function peek() {
        return regex[idx + 1];
    }

    function Any() {
        let beforeNewline = ctx.mkReRange(ctx.mkString('\\x00'), ctx.mkString('\\x09'));
        let afterNewline = ctx.mkReRange(ctx.mkString('\\x0B'), ctx.mkString('\\xFF'));
        return ctx.mkReUnion(beforeNewline, afterNewline);
    }

    function ParseRangeInner() {

        let union = undefined;

        while (more() && current() != ']') {
            let c1 = ctx.mkString(next());
            let range = undefined;

            if (current() == '-') {
                next();
                let c2 = ctx.mkString(next());
                range = ctx.mkReRange(c1, c2);
            } else {
                range = ctx.mkSeqToRe(c1);
            }

            if (!union) {
                union = range;
            } else {
                union = ctx.mkReUnion(union, range);
            }
        }

        return union;
    }

    function ParseRange() {
        next();

        let negate = false;

        if (current() == '^') {
        	next();
        	negate = true;
        }

        let r = ParseRangeInner();

        if (negate) {
        	let comp = ctx.mkReComplement(r);
        	r = ctx.mkReIntersect(Any(), comp);
        }

        if (next() == ']') {
            return r;
        } else {
            return null;
        }
    }

    let Specials = {
        '.': Any
    }

    function Alpha() {
        let p1 = ctx.mkReRange(ctx.mkString('a'), ctx.mkString('z'));
        let p2 = ctx.mkReRange(ctx.mkString('A'), ctx.mkString('Z'));
        return ctx.mkReUnion(p1, p2);
    }

    function Digit() {
    	return ctx.mkReRange(ctx.mkString('0'), ctx.mkString('9'));
    }

    function Whitespace() {
    	let p1 = mk(' ');
    	let p2 = mk('\t');
    	let p3 = mk('\r');
    	let p4 = mk('\n');
    	let p5 = mk('\f');
    	return ctx.mkReUnion(p1, ctx.mkReUnion(p2, ctx.mkReUnion(p3, ctx.mkReUnion(p4, p5))));
    }

    function AlphaNumeric() {
        return ctx.mkReUnion(Alpha(), Digit());
    }

    function Word() {
        return ctx.mkReUnion(AlphaNumeric(), mk('_'));
    }

    function ParseAtom1() {

        if (current() == '(') {
            next();
            
            let atoms = ParseAtoms();
            
            if (next() != ')') {
            	return null;
            }

            return atoms;
        } else if (current() == '[') {
        	let range = ParseRange();
        	if (!range) { return null; }
            return range;
        } else if (current() == '\\') {
        	next();

        	let c = next();
        	
            if (c == 'd') {
        		return Digit();
        	} else if (c == 'D') {
                return ctx.mkReComplement(Digit());
            } else if (c == 'w') {
        		return Word();
        	} else if (c == 'W') {
                return ctx.mkReComplement(Word());
            } else if (c == 's') {
        		return Whitespace();
        	} else if (c == 'S') {
                return ctx.mkReComplement(Whitespace());
            } else if (c == 'n') {
                return mk('\n');
            } else if (c == 'r') {
                return mk('\r');
            } else if (c == 't') {
                return mk('\t');
            } else if (c == '0') {
                return mk('\\x00');
            }
        	return mk(c);
        } else {
            if (Specials[current()]) {
                let c = next();
                return Specials[c]();
            } else {
                return mk(next());
            }
        }
    }

    function ParseNumber() {

        function digit() {
            return current() >= '0' && current() <= '9';
        }

        let numStr = '';

        if (!digit()) {
            return null;
        }

        while (digit()) {
            numStr += next();
        }

        return parseInt(numStr);
    }

    function ParseLoopCount() {
        let n1 = ParseNumber();

        if (n1 === null) {
            return [null, null];
        }

        if (current() == ',') {
            next();
            let n2 = ParseNumber();
            return [n1, n2];
        } else {
            return [n1, n1];
        }
    }

    function ParseAtom2() {
        
        let atom = ParseAtom1();

        if (!atom) { return null; }

        if (current() == '*') {
            next();
            return ctx.mkReStar(atom);
        } else if (current() == '+') {
            next();
            return ctx.mkRePlus(atom);
        } else if (current() == '?') {
            next();
            return ctx.mkReOption(atom);
        } else if (current() == '|') {
            next();
            let atom2 = ParseAtom2();
            if (!atom2) { return null; }
            return ctx.mkReUnion(atom, atom2);
        } else if (current() == '{') {
            next();

            let [lo, hi] = ParseLoopCount();

            if (lo === null || hi === null) {
                return null;
            }

            if (!next() == '}') {
                return null;
            }

            return ctx.mkReLoop(atom, lo, hi);
        } else {
            return atom;
        }
    }

    function ParseAtoms() {

        let rollup = null;

        while (more()) {

            while (current() == '^' || current() == '$') {
                //TODO: Find out how to handle multiline
                next();
            }

            //TODO: This is horrible, anchors should be better
            if (more()) {
            	let parsed = ParseAtom2();
            	
            	if (!parsed) {
            		return null;
            	}

                rollup = rollup ? ctx.mkReConcat(rollup, parsed) : parsed;
            }
        }

        return rollup.simplify();
    }

    let ast = ParseAtoms();

    if (!ast) {
        return null;
    }

    if (regex[0] !== '^') {
        ast = ctx.mkReUnion(ctx.mkReStar(Any()), ast);
    }

    if (regex[regex.length - 1] !== '$') {
        ast = ctx.mkReUnion(ctx.mkReStar(ast), Any());
    }

    return ast;
}

function RegexOuter(ctx, regex) {
    return RegexRecursive(ctx, CullOuterRegex('' + regex), 0, false).tag('' + regex);
}

export default RegexOuter;