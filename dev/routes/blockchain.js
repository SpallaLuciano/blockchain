const blockchainRouter = require('express').Router();

let blockchain;

blockchainRouter.all('/*', (req, res, next) => {
  blockchain = req.app.get('blockchain');
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  next();
});

blockchainRouter.get('/', (req, res) => {
  res.send(blockchain);
});

module.exports = blockchainRouter;