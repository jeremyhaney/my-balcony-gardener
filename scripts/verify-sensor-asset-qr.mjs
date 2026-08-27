import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

function argument(name) {
  const index = process.argv.indexOf(name);
  if (index < 0 || index + 1 >= process.argv.length) {
    throw new Error(`Missing required argument: ${name}`);
  }
  return process.argv[index + 1];
}

const pngPath = path.resolve(argument("--png"));
const expected = argument("--expected");
const moduleRoot = path.resolve(argument("--module-root"));
const runtimeRequire = createRequire(path.join(moduleRoot, "package.json"));
const { PNG } = runtimeRequire("pngjs");
const jsQR = runtimeRequire("jsqr");

const png = PNG.sync.read(fs.readFileSync(pngPath));
const decoded = jsQR(
  new Uint8ClampedArray(png.data),
  png.width,
  png.height,
  { inversionAttempts: "dontInvert" },
);

if (!decoded) {
  throw new Error("QR decoder found no payload");
}
if (decoded.data !== expected) {
  throw new Error(
    `QR payload mismatch: expected ${JSON.stringify(expected)}, got ${JSON.stringify(decoded.data)}`,
  );
}

console.log(JSON.stringify({ decoded: decoded.data, verified: true }, null, 2));
