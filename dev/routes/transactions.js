const transactionRouter = require('express').Router();
const fetch = require('node-fetch');

let blockchain;

transactionRouter.all('/*', (req, res, next) => {
  blockchain = req.app.get('blockchain');
  next();
});

transactionRouter.post('/', (req, res) => {
  try {
    const index = blockchain.addTransaction(req.body.transaction);
    res.json({ note: `Transaction will be added in block ${index}` });
  } catch(err) {
    console.log(err);
  }
});

transactionRouter.post('/broadcast', (req, res) => {
  const transaction = blockchain.createTransaction(
    req.body.amount,
    req.body.sender,
    req.body.recipient
  );
  blockchain.addTransaction(transaction);

  const requestPromises = [];
  blockchain.networkNodes.forEach((nodeUrl) => {
    requestPromises.push(
      fetch(nodeUrl + '/transactions', {
        method: 'POST',
        body: JSON.stringify({
          transaction: transaction,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );
  });

  Promise.all(requestPromises)
    .then(() => {
      res.json({ note: 'Transaction created and broadcast successfully' });
    })
    .catch((err) => {
      console.log('/transactions error:\n', err);
    });
});

module.exports = transactionRouter;
