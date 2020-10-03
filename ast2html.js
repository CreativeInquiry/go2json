
function ast2html(ast){
  var render = new function(){var $ = this;
    let BRL = `<b style="font-style:normal">[</b>`
    let BRR = `<b style="font-style:normal">]</b>`
    $.kv = function(k,v,t){
      
      return `<div class="astsp"><div class="astlbl">${k.toUpperCase()}</div>${
        (v==undefined||((typeof v) == "string"))?v:$.dispatcher(v)
      }</div>`
    }
    $.type = function(x){
      if (x == undefined || x.tag == undefined){
        return `<span style="color:red">WTF?</span>`
      }
      if (x.tag == "ptr"){
        return `<div class="astrsp"><b>${x.tag}</b> <div class="astrspb">${$.type(x.item)}</div></div>`
      }else if (x.tag == "array"){
        if (x.size != null && x.size.tag == "expr" && x.size.body.length){
          return `<div class="astrsp"><b>${x.tag}</b>${BRL}${$.dispatcher(x.size)}${BRR}<div class="astrspb">${$.type(x.item)}</div></div>`
          
        }else{
          return `<div class="astrsp"><b>${x.tag}</b> <div class="astrspb">${$.type(x.item)}</div></div>`
        }
      }else if (x.tag == "map"){

        return `<div class="astrsp"><b>${x.tag}</b><div class="astsp">${$.type(x.key)}</div>&rarr;<div class="astsp">${$.type(x.value)}</div></div>`

      }else if (x.tag == "auto"){
        return `<div class="astrsp">(implicit)</div>`

      }else if (x.tag == "namespaced"){
        return `<div class="astrsp"><div class="astisp">${x.namespace}</div> &bull; <div class="astisp">${$.type(x.item)}</div></div>`

      }else if (x.tag == "channel"){
        return `<div class="astrsp"><b>${x.tag}</b> <div class="astrspb">${$.type(x.item)}</div></div>`

      }else if (Object.keys(x).length==1){
        return `<div class="astrsp">${x.tag}</div>`


      }else{
        let o = `<div class="astrsp"><b>${x.tag}</b>`

        for (var k in x){
          if (k == "tag"){
            continue;
          }
          if (x[k] == undefined){
            continue;
          }
          o += $.kv(k,x[k]);
        }
        o+=`</div>`;
        return o;
      }
    }
    $.nametype = function(x){
      return `<div class="ast astisp">${x.name}</div> <span style="font-style:normal">:</span> <div class="ast astisp">${$.type(x.type)}</div>`
    }
    $.optnametype = function(x){
      if (x.name){
        return $.nametype(x);
      }
      return `<div class="ast astisp">${$.type(x.type)}</div>`
    }
    $.namevalue = function(x){
      let o = "";
      if (x.name){
        o+=`${$.kv('KEY',x.name)} <span style="font-style:normal">=</span>`
      }
      o+=$.kv('VALUE',x.value)
      return o
    }
    $.args = function(x){
      if (!x.length){
        return `<div class="ast astisp"></div>`
      }
      let o = `<div class="ast astrsp">`;
      for (var k in x){
        if (k != 0){
          o+="<b>,</b>";
        }
        o+=$.kv('argument '+k,$.nametype(x[k]),3);
      }
      o += `</div>`
      return o
    }
    $.rets = function(x){
      if (!x.length){
        return `<div class="ast astisp"></div>`
      }
      let o = `<div class="ast astrsp">`;
      for (var k in x){
        if (k != 0){
          o+="<b>,</b>";
        }
        o+=$.kv('return '+k,$.optnametype(x[k]),3);
      }
      o += `</div>`
      return o
    }
    $.func = function(x){
      let o = "";
      o += $.kv('name',x.name,0);
      if (x.receiver){
        o += $.kv('receiver',$.nametype(x.receiver),0);
      }
      return `
      <div class="ast asttdv">
        <div class="ast asttag">func</div>${o}
        <div class="ast asttag">args</div>${$.args(x.args)}
        <div class="ast asttag">returns</div>${$.rets(x.returns)}
        <div class="astdv">
          <div>
            <div class="astlbl">BODY</div>
          </div>
          ${$.dispatcher(x.body)}
        </div>
      </div>
      `
    }
    $.declare = function(x){
      let o = `<div class="ast astdv"><div class="ast asttag">declare</div>`;
      for (var k in x.names){
        if (k != 0){
          o+="<b>,</b>";
        }
        o += $.kv('name',x.names[k],0);
      }
      
      o+=`<span style="font-style:normal">:</span>`;
      o += $.kv('type',$.type(x.type),0);
      
      if (x.value){
        o+="<b>=</b>";
        o += $.dispatcher(x.value);
      }
      o += "</div>"
      return o;
    }
    $.expr = function(x){
      let o = `<div class="ast astsp"><div class="ast asttag">expr</div>`;
      for (var k in x.body){
        o += `${$.dispatcher(x.body[k])}`;
      }
      o += "</div>"
      return o;
    }
    $.if = function(x){
      let o = `<div class="ast astdv"><div class="ast asttag">if</div>`;
      if (x.prepare.length){
        for (var k in x.prepare){
          o += `<div class="astdv"><div><div class="astlbl">PREPARE</div></div>${$.dispatcher(x.prepare[k])}</div>`
        }
      }
      o += $.kv('condition',x.condition);

      o += `<div class="astdv"><div><div class="astlbl">BODY</div></div>${$.dispatcher(x.body)}</div>`
      o += "</div>"
      return o;
    }
    $.call = function(x){
      let o = `<div class="ast astsp"><div class="ast asttag">call</div>`;

      o += `<div class="astsp"><div><div class="astlbl">FUNC</div></div>${$.dispatcher(x.func)}</div>`
      if (x.args.length){
        o += "<b> on </b>"
        for (var k in x.args){
          o += $.kv('argument',x.args[k]);
        }
      }
      
      o += "</div>"
      return o;
    }
    $.ident = function(x){
      return $.kv('identifier',x.value);
    }
    $.op = function(x){
      return $.kv('op',`<span class="ast astnum">${x.value}</span>`)
    }
    $.sigil = function(x){
      return $.kv('op',`<span class="ast astnum">${x.value}</span>`)
    }
    $.number = function(x){
      return $.kv('number',`<span class="ast astnum">${x.value}</span>`)
    }
    $.string = function(x){
      function escapeHTML(y) {
          return y.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      }
      return $.kv('string',`<span class="ast astnum">${escapeHTML(x.value)}</span>`)
    }
    $.access = function(x){
      return $.kv('access',`<div>${$.dispatcher(x.struct)} <b>&bull;</b> ${$.kv('member',x.member)}</div>`);
    }
    $.index = function(x){
      return $.kv('subscript',`<div>${$.dispatcher(x.container)} ${BRL}${$.kv('index',x.index)}${BRR}</div>`);
    }
    $.return = function(x){
      return `<div class="ast astdv"><div class="ast asttag">return</div>${$.dispatcher(x.value)}</div>`;
    }
    $.structlit = function(x){

      let o = `<div class="ast astsp"><div class="ast asttag">struct-literal</div>${x.struct?$.kv('struct',$.dispatcher(x.struct)):"<div class=\"astisp\"></div>"}<div class="ast asttag">fields</div>`;
      for (var k in x.fields){
        if (k != 0){
          o += "<b> , </b>"
        }
        o += $.namevalue(x.fields[k]);
      }
      o += `</div>`;
      return o
    }
    $.alloc = function(x){
      let o = `<div class="ast astdv"><div class="ast asttag">alloc</div>${$.kv('type',$.type(x.type))}`;
      if (x.size){
        o += `${BRL}${$.kv('size',$.dispatcher(x.size))}${BRR}`;
      }
      o += `</div>`;
      return o
    }
    $.foreach = function(x){
      let o = `<div class="ast astdv"><div class="ast asttag">foreach</div>`;


      o += $.kv('ITERATOR',x.names.map(y=>`<div class="astisp">${y}</div>`).join("<b> , </b>"))
      o += `<b> in </b>`;
      o += $.kv('CONTAINER',x.container)
      o += `<div class="astdv"><div><div class="astlbl">BODY</div></div>${$.dispatcher(x.body)}</div>`

      o += "</div>"
      return o;
    }
    $.for = function(x){
      let o = `<div class="ast astdv"><div class="ast asttag">for</div>`;


      o += $.kv('HEADERS',""+x.headers.map(y=>$.dispatcher(y)).join("<b>;</b> ")+"")

      o += `<div class="astdv"><div><div class="astlbl">BODY</div></div>${$.dispatcher(x.body)}</div>`

      o += "</div>"
      return o;
    }
    $.assign = function(x){
      let o = `<div class="ast astdv"><div class="ast asttag">assign</div>`;

      o += $.kv('lhs',x.lhs);
      o+="<b>=</b>";
      o += $.kv('rhs',x.rhs);
      o += "</div>"
      return o;
    }
    $.exec = function(x){
      return `<div class="astdv"><div><div class="astlbl">EXEC</div></div>${$.dispatcher(x.expr)}</div>`

    }
    $.typedef = function(x){
      let o = `<div class="ast asttdv"><div class="ast asttag">typedef</div>`;

      o += $.kv('name',x.name,0);
      o += "<div>"
      o += x.fields.map(y=>$.kv('field',$.nametype(y))).join("<b>; </b>")
      o += x.embeds.map(y=>$.kv('embed',y)).join("<b>; </b>")

      o += "</div></div>"
      return o;
    }
    $.tuple = function(x){
      let o = `<div class="ast astsp"><div class="ast asttag">tuple</div>`;

      o += x.items.map(x=>$.kv('item',$.dispatcher(x))).join("<b>, </b>");
      o += `</div>`
      return o;
    }
    $.package = function(x){
      return `<div class="ast asttdv"><div class="ast asttag">${x.tag}</div>`+$.kv('name',x.name)+"</div>";
    }
    $.typealias = function(x){
      let o = `<div class="ast astdv"><div class="ast asttag">${x.tag}</div>`+$.kv('name',x.name);
      o += "<b>=</b>"

      o += $.kv('value',$.type(x.value))
      o += `</div>`
      return o
    }
    // $.import = function(x){
    //  return `<div class="ast asttdv"><div class="ast asttag">${x.tag}</div>`+$.kv('value',x.value)+"</div>";
    // }
    $.fallback = function(x){
      let o = `<div class="ast astsp">`;
      if (x.tag){
        o += `<div class="ast asttag">${x.tag}</div>`
      }
      for (var k in x){
        if (k == "tag"){
          continue;
        }else if (k == "type"){
          o += $.kv(k,$.type(x[k]));
        }else if (x[k] == undefined){
          continue;
        }else{
          o += $.kv(k,x[k]);
        }
      }
      o += `</div>`;
      return o;
    }
    $.dispatcher = function(ast){
      if (Array.isArray(ast)){
        let out = ``;
        for (let i = 0; i < ast.length; i++){
          out += $.dispatcher(ast[i]);
        }
        return out;
      }else{
        if (render[ast.tag]){
          return render[ast.tag](ast);
        }else{
          return $.fallback(ast)
        }
      }
    }
  }

  let o= render.dispatcher(ast)
  return `
    <div>
    <style>
      .ast{
        font-family:serif;
        font-style:italic;
        font-size:16px;
      }

      .astlbl{
        font-size:8px;
        font-family:sans-serif;
        font-style:normal;
      }
      .astdv{
        border:1px solid black;
        border-radius: 3px;
        margin:5px;
        display:block;
        padding:5px;
      }
      .asttdv{
        border:2px solid black;
        border-radius: 5px;
        margin:5px;
        margin-top:20px;
        margin-bottom:20px;
        display:block;
        padding:5px;
      }
      .astsp{
        border:1px solid black;
        border-radius: 3px;
        margin:5px;
        display:inline-block;
        padding:5px;
        
      }
      .asttag{
        display:inline-block;
        margin:5px;
        padding:5px;
        font-weight:bold;
      }
      .astisp{
        display:inline-block;
        border-radius: 3px;
        border:1px solid black;
        padding:2px;

      }
      .astrsp{
        display:inline-block;
        padding:1px;
      }
      .astrspb{
        display:inline-block;
        border-radius: 3px;
        border:1px solid black;
        padding:1px;
      }
      .astnum{
        font-family:monospace;
        font-style:normal;
        font-weight:normal;
      }
    </style>
    ${o}
    </div>
  `
}





var IS_NODE = typeof module !== 'undefined';
var IS_MAIN = (IS_NODE && !module.parent);

if (IS_NODE){
  module.exports = ast2html;
}

if (IS_MAIN){
  const fs = require('fs')
  const {go2ast} = require("./go2json");
  let src = fs.readFileSync(process.argv[2]).toString();
  let tree = go2ast(src);
  // console.log(tree);
  let html = ast2html(tree);
  fs.writeFileSync(process.argv[3],html);

}