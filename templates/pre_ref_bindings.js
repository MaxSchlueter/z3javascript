"use strict";

// The core of the node.js API for Z3. This file could be mostly autogenerated by Z3 scripts. Currently
// only the function bindings are, not the types.
import ref from 'ref';
import ArrayType from 'ref-array';
import ffi from 'ffi';
import config from './config';

let libPath = config.Z3_DIR;

// Manually defined types (from Z3 Python API). Could possibly be simplified to just Voidp
// but maybe we'll need the distinction later
let Void  = ref.types.void,
    Voidp = ref.refType(Void);

let Z3Exception = Voidp;
let ContextObj = Voidp;
let TheoryObj = Voidp;
let Config = Voidp;
let Symbol = Voidp;
let Sort = Voidp;
let FuncDecl = Voidp;
let Ast = Voidp;
let Pattern = Voidp;
let Model = Voidp;
let Literals = Voidp;
let Constructor = Voidp;
let ConstructorList = Voidp;
let GoalObj = Voidp;
let TacticObj = Voidp;
let ProbeObj = Voidp;
let ApplyResultObj = Voidp;
let StatsObj = Voidp;
let SolverObj = Voidp;
let FixedpointObj = Voidp;
let ModelObj = Voidp;
let AstVectorObj = Voidp;
let AstMapObj = Voidp;
let Params = Voidp;
let ParamDescrs = Voidp;
let FuncInterpObj = Voidp;
let FuncEntryObj = Voidp;
let RCFNumObj = Voidp;

// Names for standard types
let CUInt = ref.types.uint32;
let CInt = ref.types.int32;
let CBool = ref.types.bool;
let CULong = ref.types.uint64;
let CLong = ref.types.int64;
let CDouble = ref.types.double;
let CString = ref.types.CString;

// Array types. Not all of these may be valid (check over time)
let AstArray = ArrayType(Ast);
let CUIntArray = ArrayType(CUInt);
let SymbolArray = ArrayType(Symbol);
let SortArray = ArrayType(Symbol);
let FuncDeclArray = ArrayType(FuncDecl);
let ConstructorArray = ArrayType(Constructor);
let ConstructorListArray = ArrayType(ConstructorList);
let PatternArray = ArrayType(Pattern);
let TacticObjArray = ArrayType(TacticObj);
let RCFNumObjArray = ArrayType(RCFNumObj);

