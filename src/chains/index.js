const ethereum = require('@getsafle/vault-eth-controller');
const bsc = require('@getsafle/vault-bsc-controller');
const polygon = require('@getsafle/vault-polygon-controller');
const bitcoin = require('@getsafle/vault-bitcoin-controller');
const harmony = require('@getsafle/vault-harmony-controller');
const avalanche = require('@getsafle/vault-avalanche-controller');

const evmChains = ['bsc', 'polygon', 'harmony', 'avalanche'];
const nonEvmChains = ['bitcoin'];

module.exports = {
    ethereum,
    bsc,
    polygon,
    bitcoin,
    evmChains,
    nonEvmChains,
    harmony,
    avalanche,
}