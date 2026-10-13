// Encrypt / decrypt the private personal cards so they can live in the public repo.
// Usage:
//   node tools/personal.mjs encrypt private/personal-cards.json <key>   -> writes personal.enc.json
//   node tools/personal.mjs decrypt <key>                               -> prints the cards JSON
// The key is the value after #k= in Mendy's personal link. Never commit the key or the plain JSON.
import { readFileSync, writeFileSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";
const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = u => Buffer.from(u).toString("base64");
const unb64 = s => new Uint8Array(Buffer.from(s, "base64"));
const ITER = 200000;
async function keyFrom(pass, salt) {
  const base = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
const [cmd, a, b] = process.argv.slice(2);
if (cmd === "encrypt") {
  const plain = readFileSync(a, "utf8"); JSON.parse(plain);
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await keyFrom(b, salt), enc.encode(plain));
  writeFileSync("personal.enc.json", JSON.stringify({ v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), data: b64(new Uint8Array(ct)) }) + "\n");
  console.log("wrote personal.enc.json");
} else if (cmd === "decrypt") {
  const o = JSON.parse(readFileSync("personal.enc.json", "utf8"));
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(o.iv) }, await keyFrom(a, unb64(o.salt)), unb64(o.data));
  process.stdout.write(dec.decode(pt));
} else { console.log("usage: encrypt <file> <key> | decrypt <key>"); }
