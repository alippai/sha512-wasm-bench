let wasm;
const ctx_start = 1000;
const inp_start = 2000;
const out_start = inp_start - 64;

class Sha512_WASM {
  constructor() {
    if (!wasm)
      wasm = fetch("sha512.wasm");
    this.instance = null;
    this.mem = null;
  }

  async init() {
    const code = await wasm;
    const buf = new Uint8Array(await code.arrayBuffer());
    this.mem = new WebAssembly.Memory({initial: 2});
    this.mem_buf = new Uint8Array(this.mem.buffer);
    const x = await WebAssembly.instantiate(buf, { env: { memory: this.mem } });
    this.instance = x.instance.exports;
  }

  reset() {
    if (this.instance === null)
      throw new Error("Not initialized");

    this.instance.SHA512_Init(ctx_start);
  }

  digest(data) {
    if (this.instance === null)
      throw new Error("Not initialized");

    this.mem_buf.set(data, inp_start);
    this.instance.SHA512_Update(ctx_start, inp_start, data.length);
  }

  finish() {
    if (this.instance === null)
      throw new Error("Not initialized");

    this.instance.SHA512_Final(out_start, ctx_start);
    return this.mem_buf.slice(out_start, inp_start);
  }

  getWriteableStream(){
    const a = new WritableStream({
      start: (controller) => { return this.reset(); },
      write: (chunk, controller) => { return this.digest(chunk); },
      close: (controller) => { a.result = this.finish(); return a.result;},
      abort: (reason) => { return this.reset(); }
    }, {
      size: (arr) => arr.length,
      highWaterMark: 1024000
    });

    return a;
  }
}
