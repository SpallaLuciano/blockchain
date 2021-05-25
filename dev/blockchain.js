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

Blockchain.prototype.createBlock = function(nonce, previousHash, hash) {
  const block = {
    index: this.chain.length + 1,
    timestamp: Date.now(),
    transactions: this.pendingTransactions,
    nonce: nonce,
    hash: hash,
    previousHash: previousHash
  };

  this.pendingTransactions = [];
  this.chain.push(block);

  return block;
}

Blockchain.prototype.getLastBlock = function() {
  return this.chain[this.chain.length - 1];
}

Blockchain.prototype.createTransaction = function(amount, sender, recipient) {
  const transaction = {
    amount: amount,
    sender: sender,
    recipient: recipient,
    id: uuidv4().split('-').join('')
  }

  return transaction;
}

Blockchain.prototype.addTransaction = function(transaction) {
  this.pendingTransactions.push(transaction);
  return this.getLastBlock()['index'] + 1;
}

Blockchain.prototype.hashBlock = function(previousHash, currentBlockData, nonce) {
  const dataAsString = previousHash + nonce.toString() + JSON.stringify(currentBlockData);
  return sha256(dataAsString);
}

Blockchain.prototype.proofOfWork = function(previousHash, currentBlockData) {
  let nonce = 0;
  let hash = this.hashBlock(previousHash, currentBlockData, nonce);
  while(hash.substring(0,4) !== '0000') {
    nonce++;
    hash = this.hashBlock(previousHash, currentBlockData, nonce);
  }
  
  return nonce;
}

module.exports = Blockchain;