
var json2hx = new function(){var that = this;
  const RESERVED = [
    "function","class"
  ]

  function validName(x){
    if (RESERVED.includes(x)){
      return "_"+x;
    }
    return x;
  }

  function shortID(){
    var id = "";
    for (var i = 0; i < 5; i++){
      id+=String.fromCharCode(~~(Math.random()*26)+0x61);
    }
    return id;
  }

  function stdmap(x){
    let lookup = {
      "math.Abs"    :"Math.abs",
      "math.Acos"   :"Math.acos",
      "math.Asin"   :"Math.asin",
      "math.Atan"   :"Math.atan",
      "math.Atan2"  :"Math.atan2",
      "math.Ceil"   :"Math.fceil",
      "math.Cos"    :"Math.cos",
      "math.Exp"    :"Math.exp",
      "math.Floor"  :"Math.floor",
      "math.IsNaN"  :"Math.isNaN",
      "math.Log"    :"Math.log",
      "math.Max"    :"Math.max",
      "math.Min"    :"Math.min",
      "math.NaN"    :"Math.NaN",
      "math.Pow"    :"Math.pow",
      "math.Round"  :"Math.fround",
      "math.Sin"    :"Math.sin",
      "math.Sqrt"   :"Math.sqrt",
      "math.Tan"    :"Math.tan",
      "math.Pi"     :"Math.PI",
      "rand.Float32":"Math.random",
      "rand.Float64":"Math.random",
      "rand.Int31n" :"Std.random",
      "rand.Int63n" :"Std.random",
      "rand.Intn"   :"Std.random",
      "fmt.Printf"  :"trace",
      "fmt.Println"  :"trace",
    }
    let y = lookup[x];
    return y || x;
  }

  function type2hx(typ){
    // try{
    let lookup = {
      "int":"Int",
      "byte":"Int",
      "bool":"Bool",
      "float32":"Float",
      "float64":"Float",
      "int8":"Int",
      "int32":"Int",
      "int16":"Int",
      "int64":"Int",
      "uint8":"Int",
      "uint32":"Int",
      "uint16":"Int",
      "uint64":"Int",
      "rune":"Int",
      "string":"String",
      "error":"Void",
    }
    if (typ.tag in lookup){
      return lookup[typ.tag];
    }else if (typ.tag == "array" || typ.tag == "rest"){
      return `Array<${type2hx(typ.item)}>`;

    }else if (typ.tag == "map"){
      return `Map<${type2hx(typ.key)},${type2hx(typ.value)}>`;
    }else if (typ.tag == "ptr"){
      return type2hx(typ.item);
    }else if (typ.tag == "auto"){
      return null;
    }else if (typ.tag == "lambda"){
      let x = typ.args.map(y=>type2hx(y.type)).join("->");
      if (typ.returns.length == 0){
        x += "->Void";
      }else if (typ.returns.length == 1){
        x += "->"+type2hx(typ.returns[0].type);
      }else{
        x += "->Array<Dynamic>"
      }
      return x;
    }else{
      return typ.tag;
    }
    // }catch(e){
    //   console.log("wtf is this?",typ);
    //   return "WTF";
    // }
  }
  function type2zero(typ){
    try{
      let lookup = {
        "int":"0",
        "byte":"0",
        "bool":"false",
        "float32":"0.0",
        "float64":"0.0",
        "int8":"0",
        "int32":"0",
        "int16":"0",
        "int64":"0",
        "uint8":"0",
        "uint32":"0",
        "uint16":"0",
        "uint64":"0",
        "rune":"0",
      }
      if (typ.tag in lookup){
        return lookup[typ.tag];
      }else if (typ.tag == "array"){
        return `[]`;
      }else if (typ.tag == "map"){
        return `[]`;
      }else if (typ.tag == "ptr"){
        return type2zero(typ.item);
      }else if (typ.tag == "auto"){
        return "null";
      }else{
        return "new "+typ.tag+"()";
      }
    }catch(e){
      console.log("wtf is this?",typ);
      return null;
    }
  }

  function expr2hx(expr){
    // if (!expr){
    //   return "WTF"
    // }
    if (expr.tag == "expr"){
      expr = expr.body;
    } else if (expr.tag == "declare" || expr.tag == "assign"){
      let a = ast2hx([expr],-1);
      return a;
    }
    if (expr.tag){
      expr = [expr];
    }
    // console.log(expr)
    let out = "";

    function unwrapSingleton(x){
      if (x.type == "expr"){
        if (x.body.length == 1){
          return unwrapSingleton(x.body[0]);
        }
      }
      return x;
    }
    expr = expr.map(unwrapSingleton);
    for (let i = 0; i < expr.length; i++){
      let x = expr[i];
      // console.log(x.tag);
      if (x.tag == "ident" || x.tag == "op" || x.tag == "number" || x.tag == "string" || x.tag == "char"){
        if (x.value == "nil"){
          out += "null";
        }else if (x.value == "&" && (!expr[i-1] || (expr[i-1].tag != "ident" && expr[i-1].tag != "number" && expr[i+1].tag != "number"))){
          out += "/*&*/";
        }else if (x.value == "*" && (!expr[i-1] || (expr[i-1].tag != "ident" && expr[i-1].tag != "number" && expr[i+1].tag != "number"))){
          if (!expr[i-1]){
            out += "/***/";
          }else{
            out += x.value;
          }
        }else if (RESERVED.includes(x.value)){
          out += "_"+x.value;
        }else{
          out += x.value
        
        }
        
      }else if (x.tag == "access"){
        let lhs = expr2hx(x.struct);
        let rhs = x.member;
        let r = stdmap(lhs + "." + rhs);
        out += r;
      }else if (x.tag == "index"){
        out += expr2hx(x.container);
        out += "[";
        out += expr2hx(x.index);
        out += "]";
      }else if (x.tag == "slice"){
        out += expr2hx(x.container);
        let lo = expr2hx(x.lo);
        let hi = expr2hx(x.hi);
        if (!lo.length){
          lo = 0;
        }
        out += ".slice(";
        out += lo;
        if (hi.length){
          out += ",";
          out += hi;
        }
        out += ")";
      }else if (x.tag == "call"){
        // console.log(x);
        let fn = expr2hx(x.func);
        if (fn == "append"){
          if (x.args[1].tag == "expr" && x.args[1].body[x.args[1].body.length-1].value == "..."){
            out += `${expr2hx(x.args[0])}.concat(${expr2hx(x.args[1])})`
          }else{
            out += `${expr2hx(x.args[0])}.concat([${expr2hx(x.args[1])}])`
          }
        }else if (fn == "len"){
          out += `(${expr2hx(x.args[0])}).length`
        }else{
          out += expr2hx(x.func);
          out += "("
          out += x.args.map(expr2hx).join(",");
          out += ")"
        }
      }else if (x.tag == "invoke"){
        out += `/*go*/`+expr2hx(x.func);
      }else if (x.tag == "lambda"){

        if (x.returns.length == 0){
          rstr = "Void";
        }else if (x.returns.length == 1){
          rstr = type2hx(x.returns[0].type);
        }else{
          rstr = "Array<Dynamic>"
        }
        out += `function (${x.args.map(function(y){
          let t = type2hx(y.type);
          let n = validName(y.name);
          if (t){
            n += ":"+t
          }
          return n;
        }).join(", ")}) : ${rstr} {`+ast2hx(x.body,-1)+"}";

      }else if (x.tag == "defer"){
        out += `/*defer*/`+expr2hx(x.expr);

      }else if (x.tag == "alloc"){
        if (x.type.tag == "array"){
          out += "[]";
        }else{
          out += "new "+type2hx(x.type)+"()";
        }
      }else if (x.tag == "structlit"){
        // console.log(",,,",x.struct)
        if (x.struct){
          out += "new "+expr2hx(x.struct)+"("
        }else{
          out += '['
        }
        let oo = [];
        for (let j = 0; j < x.fields.length; j++){
          if (validName(x.fields[j].name)){
            console.error("unimplemented: struct literal named fields");
          }
          // console.log(x.fields[j].value)
          let e = expr2hx(x.fields[j].value);
          if (e.trim().length){oo.push(e)};
          
        }
        out += oo.join(",")
        out += x.struct?")":"]";
      }else if (x.tag == "cast"){
        out += "(cast "+expr2hx(x.value)+")";
      }else if (x.tag == "expr"){
        out += "("+expr2hx(x)+")";
      }
    }
    return out;
  }

  function ast2hx(tree,ind){

    let defs = {
      G:"",
    }

    function oline(k,ex,str){
      // console.log(k,ex,str);
      if (!defs[k]){
        defs[k] = "";
      }
      defs[k] += " ".repeat(Math.max((ind+ex)*2,0))+str+"\n";
    }
    function unwrapSingleton(x){
      if (x.type == "expr"){
        if (x.body.length == 1){
          return unwrapSingleton(x.body[0]);
        }
      }
      return x;
    }
    for (let i = 0; i < tree.length; i++){
      
      let x = unwrapSingleton(tree[i]);

      if (x.tag == "typedef"){
        oline(validName(x.name),0,`class ${validName(x.name)} {`);
        for (let j = 0; j < x.fields.length; j++){
          oline(validName(x.name),1,`public var ${validName(x.fields[j].name)} : ${type2hx(x.fields[j].type)} = ${type2zero(x.fields[j].type)};`);
        }
        oline(validName(x.name),1,`public function new (${x.fields.map(y=>("_"+validName(y.name)+":"+type2hx(y.type)+"="+type2zero(y.type)))} ){`);
        for (let j = 0; j < x.fields.length; j++){
          oline(validName(x.name),2,`this.${validName(x.fields[j].name)} = _${validName(x.fields[j].name)};`);
        }
        oline(validName(x.name),1,"}")
        oline(validName(x.name),1,`public function _clone (){`);
        
        oline(validName(x.name),2,`return new ${validName(x.name)}(${x.fields.map(y=>"this."+validName(y.name))});`);
        
        oline(validName(x.name),1,"}")
      }else if (x.tag == "typealias"){
        oline(validName(x.name),0,`abstract ${validName(x.name)} (${type2hx(x.value)}){`);
      }else if (x.tag == "interface"){
        oline(validName(x.name),0,`abstract ${validName(x.name)} (Dynamic) {`); //fuck it
      }
    }

    for (let i = 0; i < tree.length; i++){
      let x = tree[i];
      // console.log(x.tag)
      if (x.tag == "func"){

        let ns = "G";
        let ind2 = 0;
        if (x.receiver){
          ns = type2hx(x.receiver.type);
          ind2++;
        }
        let rstr;
        let rnames = [];
        if (x.returns.length == 0){
          rstr = "Void";
        }else if (x.returns.length == 1){
          rstr = type2hx(x.returns[0].type);
          if (x.returns[0].name != null){
            rnames.push(x.returns[0]);
          }
        }else{
          rstr = "Array<Dynamic>"
          if (x.returns[0].name != null){
            for (let j = 0; j < x.returns.length; j++){
              rnames.push(x.returns[j]);
            }
          }
        }
        oline(ns,ind2,`public${(ns=='G')?" static":""} function ${x.name}(${x.args.map(function(y){
          let t = type2hx(y.type);
          let n = validName(y.name);
          if (t){
            n += ":"+t
          }
          return n;
        }).join(", ")}) : ${rstr} {`);
        if (x.receiver){
          if (x.receiver.tag == "ptr"){
            oline(ns,ind2+1,`var ${validName(x.receiver.name)} = this;`);
          }else{
            /* non-pointer-receiver -> pass-by-value */
            oline(ns,ind2+1,`var ${validName(x.receiver.name)} = this._clone();`); 
          }
        }
        if (rnames.length){
          for (let j = 0; j < rnames.length; j++){
            oline(ns,ind2+1,`var ${validName(rnames[j].name)} : ${type2hx(rnames[j].type)} = ${type2zero(rnames[j].type)};`); 
          }
        }
        function recurEditRet(expr){
          if (Array.isArray(expr)){
            for (let j = 0; j < expr.length; j++){
              recurEditRet(expr[j]);
            }
            return;
          }
          if (expr.tag == "return"){

            if (!expr2hx(expr.value).trim().length){

              if (rnames.length == 1){
                expr.value = {tag:"expr",body:[{tag:"ident",value:validName(rnames[0].name)}]}

              }else{
                expr.value = {tag:"tuple",items:rnames.map(y=>{
                  return {tag:"expr",body:[{tag:"ident",value:validName(y.name)}]}
                })};
              }
            }
            return;
          }
          if (expr.body){
            recurEditRet(expr.body);
          }
        }
        let body = x.body;
        if (rnames.length){
          body = JSON.parse(JSON.stringify(body));//deep copy
          recurEditRet(body);
        }

        defs[ns]+=ast2hx(body,ind2+1);

        oline(ns,ind2,"}");
      
      }else if (x.tag == "declare"){
        let t = type2hx(x.type);
        let tz = type2zero(x.type);
        let mod = (ind == 0)?"public static ":"";
        if (x.names.length == 1){
          let name = validName(x.names[0]);
          let l = mod+`var ${name}`;

          
          if (t){
            l += ":"+t;
          }
          if (x.value){
            l+=" = "+expr2hx(x.value);
          }else{
            l+=" = "+tz;
          }
          l+=";"
          oline('G',0,l);
        }else{
          if (x.value == null){
            for (let j = 0; j < x.names.length; j++){
              oline('G',0,mod+`var ${validName(x.names[j])} : ${t} = ${tz};`);
            }
          }else if (x.value.tag == "tuple"){
            for (let j = 0; j < x.names.length; j++){
              oline('G',0,mod+`var ${validName(x.names[j])}${t?(":"+t):""} = ${expr2hx(x.value.items[j])};`);
            }
          }else{
            let tmp = "_"+shortID();
            oline('G',0,mod+`var ${tmp} : Array<Dynamic> = ${expr2hx(x.value)};`);

            for (let j = 0; j < x.names.length; j++){
              oline('G',0,mod+`var ${validName(x.names[j])}${t?(":"+t):""} = ${tmp}[${j}];`);
            }
            // console.error("unimplemented: muti-declare from return value");
          }
        }
      }else if (x.tag == "if"){
        for (let j = 0; j < x.prepare.length; j++){
          oline('G',0,`${expr2hx(x.prepare[j])};`);
        }
        oline('G',0,`if (${expr2hx(x.condition)}){`);
        defs.G+=ast2hx(x.body,ind+1);
        oline('G',0,'}')
      }else if (x.tag == "elseif"){
        oline('G',0,`else if (${expr2hx(x.condition)}){`);
        defs.G+=ast2hx(x.body,ind+1);
        oline('G',0,'}')
      }else if (x.tag == "else"){
        oline('G',0,`else{`);
        defs.G+=ast2hx(x.body,ind+1);
        oline('G',0,'}')
      }else if (x.tag == "foreach"){
        let tmp = "_"+shortID();
        oline('G',0,`var ${tmp} = ${expr2hx(x.container)};`)

        oline('G',0,`for (${validName(x.names[0])} in 0...${tmp}.length){`)
        if (x.names[1]){
          oline('G',1,`var ${validName(x.names[1])} = ${tmp}[${validName(x.names[0])}];`)
        }
        defs.G+=ast2hx(x.body,ind+1);
        oline('G',0,'}')
      }else if (x.tag == "for"){

        if (x.headers.length == 1){
          x.headers = [[],x.headers[0],[]];
        }else if (x.headers.length ==0){
          x.headers = [[],{tag:"ident",value:"true"},[]];
        }
        oline('G',0,expr2hx(x.headers[0])+";")

        oline('G',0,`while (${expr2hx(x.headers[1])}){`)
        defs.G+=ast2hx(x.body,ind+1);
        oline('G',1,expr2hx(x.headers[2])+";");
        oline('G',0,'}')

      }else if (x.tag == "switch"){
        if (!expr2hx(x.condition).trim().length){
          for (let j = 0; j < x.cases.length; j++){
            if (x.cases[j].tag == "case"){
              oline('G',0,`${j?"else ":""}if (${expr2hx(x.cases[j].condition)}){`);
            }else{
              oline('G',0,`else{`);
            }
            defs.G+=ast2hx(x.cases[j].body,ind+1);
            oline('G',0,'}');
          }
        }else{
          oline('G',0,`switch (${expr2hx(x.condition)}) {`);
          for (let j = 0; j < x.cases.length; j++){
            if (x.cases[j].tag == "case"){
              oline('G',0,`case ${expr2hx(x.cases[j].condition)}:`);
            }else{
              oline('G',0,`default:`);
            }
            defs.G+=ast2hx(x.cases[j].body,ind+1);
          }
          oline('G',0,'}');

        }
      }else if (x.tag == "return"){
        if (x.value && x.value.tag == "tuple"){
          let tmp = "_"+shortID();
          oline('G',0,`var ${tmp} : Array<Dynamic> = [`+x.value.items.map(expr2hx).join(",")+"];");
          oline('G',0,`return ${tmp};`);
        }else{
          oline('G',0,`return ${expr2hx(x.value)};`);
        }
      }else if (x.tag == "assign"){
        // console.log(JSON.stringify(x,null,2));
        let lhs = unwrapSingleton(x.lhs);
        let rhs = unwrapSingleton(x.rhs);
        if (lhs.tag == "tuple" && rhs.tag == "tuple"){
          
          let tmps = lhs.items.map(y=>("_"+shortID()));

          for (let j = 0; j < lhs.items.length; j++){
            oline('G',0,`var ${tmps[j]} = ${expr2hx(rhs.items[j])};`);
          }
          for (let j = 0; j < lhs.items.length; j++){
            oline('G',0,`${expr2hx(lhs.items[j])} = ${tmps[j]};`);
          }

        }else if (lhs.tag == "tuple"){
          let tmp = "_"+shortID();
          oline('G',0,`var ${tmp} : Array<Dynamic> = ${expr2hx(rhs)};`);

          for (let j = 0; j < lhs.items.length; j++){
            oline('G',0,`${expr2hx(lhs.items[j])} = ${tmp}[${j}];`);
          }
        }else{
          oline('G',0,`${expr2hx(x.lhs)} = ${expr2hx(x.rhs)};`);
        }
      }else if (x.tag == "comment"){
        oline('G',0,x.text);
      }else if (x.tag == "exec"){
        oline('G',0,expr2hx(x.expr)+";");
      }else if (x.tag == "import"){
        oline('G',0,`//import ${x.value.replace(/["`]/g,"").replace(/\//g,".")};`)
      }else if (x.tag == "package"){
        oline('G',0,`//package ${x.name};`)
      }else if (x.tag == "typedef"){
        // skip since we processed it earlier
      }else if (x.tag == "typealias"){
        // skip since we processed it earlier
        oline('G',0,`//typedef ${x.name} = ${type2hx(x.value)};`);
      }else if (x.tag == "interface"){
        // oline('G',0,`abstract ${x.name} (Dynamic) {}`); //fuck it
      }else if (x.tag == "invoke" || x.tag == "defer"){
        oline('G',0,expr2hx(x)+";");
      }else{
        // oline('G',ind,JSON.stringify(x));
        // console.log(JSON.stringify(x));
        oline('G',0,expr2hx(x)+";//"+JSON.stringify(x))
        
      }
        
    }
    for (var k in defs){
      defs[k] = defs[k].split("\n").filter(x=>(x.trim()!=";")).join("\n");
    }
    if (ind != 0){
      let out = defs.G;
      for (var k in defs){
        if (k != "G"){
          out += defs[k]+"\n}\n";
        }
      }
      return out;
    }else{
      for (var k in defs){
        if (k != "G"){
          defs[k] += "\n}\n";
        }
      }
      return defs;
    }
  }
  this.ast2hx = function(tree){
    return ast2hx(tree,0);
  }
}


var IS_NODE = typeof module !== 'undefined';
var IS_MAIN = (IS_NODE && !module.parent);


if (IS_MAIN){
  const fs = require("fs");
  var tree = JSON.parse(fs.readFileSync(process.argv[2]).toString());
  var hx = json2hx.ast2hx(tree,0);
  // console.log(hx);
  hx = Object.values(hx).join("\n\n")
  fs.writeFileSync(process.argv[3],hx)
}

if (IS_NODE){
  module.exports = json2hx.ast2hx
}





