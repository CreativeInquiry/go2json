# [go2json](https://creativeinquiry.github.io/go2json/)

Parse abstract syntax tree from Go source code, and store it in JSON, for transpiling to other programming languages. 

A Go→Haxe transpiler is also included, but it only does syntax translation to help with porting, and does not always generate perfectly equivalent code.

Written to port Fogleman's [ln](https://github.com/fogleman/ln) to Processing/java for prof. Golan Levin. Check out the project [here](https://github.com/CreativeInquiry/LN.pde).

Inspired by [tardisgo](https://github.com/tardisgo/tardisgo), which is unfortunately based on ancient version of Go and Haxe which I was unable to get working. Also, [gopherjs](https://github.com/gopherjs/gopherjs) is a much better choice if your target language is JS.

All the code is written in vanilla JavaScript and works in the browser and node.js (Does not use Go itself). [Check out the browser demo here](https://creativeinquiry.github.io/go2json/)