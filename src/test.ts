import { FoxCompiler } from "./compiler";
import { FoxRuntime } from "./runtime";
import { FoxBinary } from "./common/binary";
import fs from "fs";

const input = fs.readFileSync("./test.js", "utf-8");

const program = new FoxCompiler().compile(input, {
  name: "test",
  version: "1.0.0",
  extra: []
})

const binary = new FoxBinary();

binary.parse(program);

fs.writeFileSync("./output.opc", binary.print())

const runtime = new FoxRuntime(program);
runtime.run();

console.log("===== 香草 =====");
eval(input);
