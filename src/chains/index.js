const ethereum = require('@getsafle/vault-eth-controller');
const bsc = require('@getsafle/vault-bsc-controller');
const polygon = require('@getsafle/vault-polygon-controller');
const bitcoin = require('@getsafle/vault-bitcoin-controller');
const harmony = require('@getsafle/vault-harmony-controller');

const evmChains = ['bsc', 'polygon', 'harmony'];
const nonEvmChains = ['bitcoin'];

module.exports = {
    ethereum,
    bsc,
    polygon,
    bitcoin,
    evmChains,
    nonEvmChains,
    harmony,
}