const test_vectors = [ // From: https://www.di-mgt.com.au/sha_testvectors.html
  ["616263", /* abc */ "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f"],
  ["", "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e"],
  ["6162636462636465636465666465666765666768666768696768696a68696a6b696a6b6c6a6b6c6d6b6c6d6e6c6d6e6f6d6e6f706e6f7071", /* abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq */ "204a8fc6dda82f0a0ced7beb8e08a41657c16ef468b228a8279be331a703c33596fd15c13b1b07f9aa1d3bea57789ca031ad85c7a71dd70354ec631238ca3445"],
  ["61626364656667686263646566676869636465666768696a6465666768696a6b65666768696a6b6c666768696a6b6c6d6768696a6b6c6d6e68696a6b6c6d6e6f696a6b6c6d6e6f706a6b6c6d6e6f70716b6c6d6e6f7071726c6d6e6f707172736d6e6f70717273746e6f707172737475", /*abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu*/ "8e959b75dae313da8cf4f72814fc143f8f7779c6eb9f7fa17299aeadb6889018501d289e4900f7e4331b99dec4b5433ac7d329eeb6dd26545e96e55b874be909"],
  ["61".repeat(1000000) /* "a".repeat(1000000) */, "e718483d0ce769644e2e42c7bc15b4638e1f98b13b2044285632a803afa973ebde0ff244877ea60a4cb0432ce577c31beb009c5c2c49aa2e4eadb217ad8cc09b"],
  // ["abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmno".repeat(16777216), "b47c933421ea2db149ad6e10fce6c7f93d0752380180ffd7f4629a712134831d77be6091b819ed352c2967a2e2d4fa5050723c9630691f1a05a7281dbe6c1086"],
];

function tohex(s) {
  return Array.prototype.map.call(s, x => ('00' + x.toString(16)).slice(-2)).join('');
}

function fromhex(s) {
  const result = [];
  for (let i = 0; i < s.length; i += 2) {
    result.push(parseInt(s.substring(i, i + 2), 16));
  }
  return Uint8Array.from(result);
}

function log(msg) {
  const logContainer = document.getElementById("log");
  const item = document.createElement("pre");
  const text = document.createTextNode(`${(new Date()).toISOString()}(${performance.now()}):    ${msg}`);
  item.appendChild(text);
  logContainer.appendChild(item);
}

let a;
async function setup() {
  log('Starting');
  a = new Sha512_WASM();
  await a.init();
  log('Inited');
}

const chunksize = 10240;
async function test(inp, expected_output) {
  log('Resetting');
  await a.reset();
  log('Starting digests');
  if(inp.length > chunksize) {
    log('Chunked digests');
    for (let i = 0; i < inp.length; i += chunksize) {
      await a.digest(inp.subarray(i, i + chunksize));
      log('Added chunk');
    }
  } else a.digest(inp);


  const result = tohex(await a.finish());
  if(result === expected_output)
    log("Success");
  else
    log("Failure");
}

setup().then(() =>
  test_vectors.reduce((prom, val) => prom.then(() => test(fromhex(val[0]), val[1])).catch(log),
                      Promise.resolve())
).then(() => {
  log('All done!')
});
