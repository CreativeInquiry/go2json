# [go2json](https://creativeinquiry.github.io/go2json/)

Parse abstract syntax tree from Go source code, and store it in JSON, for transpiling to other programming languages. 

A Go→Haxe transpiler is also included, but it only does syntax translation to help with porting, and does not always generate perfectly equivalent code.

Written to port Fogleman's [ln](https://github.com/fogleman/ln) to Processing/java for prof. Golan Levin. Check out the project [here](https://github.com/CreativeInquiry/LN.pde).

Inspired by [tardisgo](https://github.com/tardisgo/tardisgo), which is unfortunately based on ancient version of Go and Haxe which I was unable to get working. Also, [gopherjs](https://github.com/gopherjs/gopherjs) is probably a much better choice if your target language is JS.

All the code is written in vanilla JavaScript with **zero** dependencies and works in the browser and node.js (Does not use Go itself). [Check out the browser demo here](https://creativeinquiry.github.io/go2json/). It has a nice visualization of the AST.

This is an experimental project; Please feel welcome to report any issues.

## Usage

As commandline tool:

```sh
node go2json.js path/to/source.go path/to/output.json
```

(Node needs to be installed, but npm/npm install is not necessary as it's a single script.)

Importing as a library:

Node:

```js
const {go2ast} = require("./go2json");
let ast = go2ast(`
package main
import "fmt"
func main() {
	fmt.Println("hello world")
}`);
console.log(JSON.stringify(ast,null,2));
```

Which will give something like this:

```js
[
  {
    "tag": "package",
    "name": "main"
  },
  {
    "tag": "func",
    "receiver": null,
    "name": "main",
    "args": [],
    "returns": [],
    "body": [
      {
        "tag": "exec",
        "expr": {
          "tag": "expr",
          "body": [
            {
              "tag": "call",
              "func": {
                "tag": "access",
                "struct": {
                  "tag": "ident",
                  "value": "fmt"
                },
                "member": "Println"
              },
              "args": [
                {
                  "tag": "expr",
                  "body": [
                    {
                      "tag": "string",
                      "value": "\"hello world\""
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    ]
  }
]
```

`go2tokens` and `tokens2ast` functions are also available if you need the steps separately.

In browser:

```html
<script src="go2json.js"></script>
<script>
let ast = go2ast(`
package main
import "fmt"
func main() {
	fmt.Println("hello world")
}`);
document.write(JSON.stringify(ast,null,2));
</script>
```

The haxe transpiler works in a similar way:

```
node json2hx.js path/to/ast.json path/to/output.hx
```

As a library, `ast2hx` is the single exported function.


## Notes

Notes about go2json.js:

- It does not parse arithmetic expressions into trees and instead keep the linear structure. e.g. `1 + 2 + 3` does not become `(+ (+ 1 2) 3)` but is kept as `[1, +, 2, +, 3]`. This is because many languages have the identical ways to express math and similar operator precedence, so linear ends up more convenient. Additional processing needs to be added if the target language have different syntax for math etc.
- The `make()` builtin is parsed separately from other builtins, since the first argument is a type. The other builtins are parsed as function calls.


Notes about the AST to haxe compiler:

- groutines/channels/other concurrency stuff are not supported.
- Functions with receivers are parsed into class methods. Methods are placed within the class, unlike in Go where functions are outside of structs. Therefore `ast2hx` returns an object with key value pairs mapping class name to source code for the class. Under the `"G"` key is all functions without receivers. 
- Nuances between pointers and values are sometimes ignored, because Haxe does not have a notion for pointer and every object is a reference. It'll be indicated in generated comments when this happens, for a human to manually inspect and correct if it makes important difference.


