const blockchainRouter = require('express').Router();
const fetch = require('node-fetch');

let blockchain;

blockchainRouter.all('/*', (req, res, next) => {
  blockchain = req.app.get('blockchain');
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  next();
});


blockchainRouter.get('/mine', (req, res) => {
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

blockchainRouter.get('/', (req, res) => {
  res.send(blockchain);
});

blockchainRouter.get('/consensus', async (req, res) => {
  Promise.all(
    blockchain.networkNodes.map((url) => {
      return fetch(url + '/blockchain', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .catch(err => console.log(err));
    })
  )
    .then((blockchains) => {
      let maxLength = blockchain.chain.length;
      let longestChain = null;
      let pendingTransactions = null;
      blockchains.forEach((bc) => {
        if (bc.chain.length > maxLength) {
          maxLength = bc.chain.length;
          longestChain = bc.chain;
          pendingTransactions = bc.pendingTransactions;
        }
      });

      if (
        !longestChain ||
        (longestChain && !blockchain.isValidChain(longestChain))
      ) {
        res.json({
          note: 'Current chain has not been replaced',
          chain: blockchain.chain,
          longest: longestChain,
          valid: blockchain.isValidChain(longestChain)
        });
      } else {
        blockchain.chain = longestChain;
        blockchain.pendingTransactions = pendingTransactions;

        res.json({
          note: 'Current chain replaced',
          chain: blockchain.chain,
        });
      }
    })
    .catch((err) => {
      console.log('/blockchain Error:\n' + err);
    });
});

module.exports = blockchainRouter;
