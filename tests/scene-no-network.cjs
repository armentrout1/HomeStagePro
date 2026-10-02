// Preload for the offline scene suites: node --require ./tests/scene-no-network.cjs --import tsx --test ...
const deny = () => { throw new Error("SCENE_TEST_NETWORK_FORBIDDEN"); };
globalThis.fetch = deny;
globalThis.WebSocket = class { constructor() { deny(); } };
require("node:net").Socket.prototype.connect = deny;
require("node:net").Server.prototype.listen = deny;
require("node:tls").connect = deny;
for (const name of ["node:http", "node:https"]) {
    require(name).request = deny;
    require(name).get = deny;
}
require("node:dgram").createSocket = deny;
require("node:module").syncBuiltinESMExports();
