const blockRouter = require('express').Router();
const fetch = require('node-fetch');

let blockchain;

blockRouter.all('/*', (req, res, next) => {
  blockchain = req.app.get('blockchain');
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  next();
});

blockRouter.get('/:blockHash', (req, res) => {
  const blockHash = req.params.blockHash;
  
  const block = blockchain.getBlock(blockHash);
  res.json({
    block: block ? block : null
  });
});

blockRouter.post('/', (req, res) => {
  const block = req.body.block;
  const lastBlock = blockchain.getLastBlock();
  const sameHash = lastBlock.hash === block.previousHash;
  const sameIndex = lastBlock['index'] + 1 === block['index'];

  if (sameHash && sameIndex) {
    blockchain.chain.push(block);
    blockchain.pendingTransactions = [];

    res.json({
      note: 'Block accepted',
      block: block,
    });
  } else {
    res.json({
      note: 'Block rejected',
      block: block,
    });
  }
});

module.exports = blockRouter;
