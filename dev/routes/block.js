const blockRouter = require('express').Router();
const fetch = require('node-fetch');

let blockchain;

blockRouter.all('/*', (req, res, next) => {
  blockchain = req.app.get('blockchain');
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  next();
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

blockRouter.get('/mine', (req, res) => {
  const lastBlock = blockchain.getLastBlock();
  const previousHash = lastBlock['hash'];

  const currentBlockData = {
    transactions: blockchain.pendingTransactions,
    index: lastBlock['index'] + 1,
  };
  const nonce = blockchain.proofOfWork(previousHash, currentBlockData);

  const hashBlock = blockchain.hashBlock(previousHash, currentBlockData, nonce);

  const block = blockchain.createBlock(nonce, previousHash, hashBlock);

  const requestPromises = [];
  blockchain.networkNodes.forEach((nodeUrl) => {
    requestPromises.push(
      fetch(nodeUrl + '/block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          block: block,
        }),
      })
    );
  });

  Promise.all(requestPromises).then(() => {
    fetch(blockchain.nodeUrl + '/transactions/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 12.5,
        sender: '00',
        recipient: req.app.get('nodeAddress'),
      }),
    })
      .then(() => {
        res.json({
          note: 'New block mined and broadcasted successfully',
          block: block,
        });
      })
      // .catch((err) => {
      //   console.log('/transactions/broadcast Error:\n' + err);
      // });
  });
});

module.exports = blockRouter;
