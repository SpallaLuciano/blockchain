const sha256 = require('sha256');
const currentNodeUrl = process.argv[3];
const { v4: uuidv4 } = require('uuid');

function Blockchain() {
  this.chain = [];
  this.pendingTransactions = [];

  this.nodeUrl = currentNodeUrl;
  this.networkNodes = [];

  this.createBlock(13, '13', '13');
}

Blockchain.prototype.createBlock = function (nonce, previousHash, hash) {
  const block = {
    index: this.chain.length + 1,
    timestamp: Date.now(),
    transactions: this.pendingTransactions,
    nonce: nonce,
    hash: hash,
    previousHash: previousHash,
  };

  this.pendingTransactions = [];
  this.chain.push(block);

  return block;
};

Blockchain.prototype.getLastBlock = function () {
  return this.chain[this.chain.length - 1];
};

Blockchain.prototype.createTransaction = function (amount, sender, recipient) {
  const transaction = {
    amount: amount,
    sender: sender,
    recipient: recipient,
    id: uuidv4().split('-').join(''),
  };

  return transaction;
};

Blockchain.prototype.addTransaction = function (transaction) {
  this.pendingTransactions.push(transaction);
  return this.getLastBlock()['index'] + 1;
};

Blockchain.prototype.hashBlock = function (
  previousHash,
  currentBlockData,
  nonce
) {
  const dataAsString =
    previousHash + nonce.toString() + JSON.stringify(currentBlockData);
  return sha256(dataAsString);
};

Blockchain.prototype.proofOfWork = function (previousHash, currentBlockData) {
  let nonce = 0;
  let hash = this.hashBlock(previousHash, currentBlockData, nonce);
  while (hash.substring(0, 4) !== '0000') {
    nonce++;
    hash = this.hashBlock(previousHash, currentBlockData, nonce);
  }

  return nonce;
};

Blockchain.prototype.isValidChain = function (chain) {
  let valid = true;
  for (var i = 1; i < chain.length && valid === true; i++) {
    const block = chain[i];
    const prevBlock = chain[i - 1];
    const blockHash = this.hashBlock(
      prevBlock['hash'],
      {
        transactions: block['transactions'],
        index: block['index'],
      },
      block['nonce']
    );

    if (blockHash.substring(0, 4) !== '0000') valid = false;
    if (block['previousHash'] !== prevBlock['hash']) valid = false;
    console.log('PrevHash:  ' + prevBlock['hash'] + '\n');
    console.log('Hash:      ' + blockHash);
  }

  const genesisBlock = chain[0];
  const correctNonce = genesisBlock['nonce'] === 13;
  const correctPreviousHash = genesisBlock['previousHash'] === '13';
  const correctHash = genesisBlock['previousHash'] === '13';
  const correctTransactions = genesisBlock['transactions'].length === 0;

  if (
    !correctNonce ||
    !correctPreviousHash ||
    !correctHash ||
    !correctTransactions
  )
    valid = false;

  return valid;
};

Blockchain.prototype.getBlock = function (blockHash) {
  return this.chain.find((block) => block.hash === blockHash);
};

Blockchain.prototype.getTransaction = function (transactionId) {
  const block = this.chain.find((block) => {
    return block.transactions.some(transaction => transaction.id === transactionId);
  });
  const transaction = block ? block.transactions.find(transaction => transaction.id === transactionId) : null;
  return {
    transaction: transaction,
    block: block ? block : null
  }
};

Blockchain.prototype.getAddressData = function(address) {
  let addressTransactions = [];
  this.chain.forEach(block => {
    const transactions = block.transactions.filter(transaction => transaction.sender == address || transaction.recipient == address);
    addressTransactions.push(...transactions);
    console.log(addressTransactions);
  });

  let balance = 0;
  addressTransactions.forEach(transaction => {
    if(transaction.recipient === address) balance += transaction.amount;
    if(transaction.sender === address) balance -= transaction.amount;
  });

  return {
    addressTransactions: addressTransactions,
    addressBalance: balance
  }

}

module.exports = Blockchain;
