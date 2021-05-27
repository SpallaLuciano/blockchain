const express = require('express');
const app = express();
const { v4: uuidv4 } = require('uuid');

const Blockchain = require('./blockchain');
const port = process.argv[2];

const nodeAddress = uuidv4().split('-').join('');
const blockchain = new Blockchain();

const nodeRouter = require('./routes/nodes');
const transactionRouter = require('./routes/transactions');
const blockRouter = require('./routes/block');
const blockchainRouter = require('./routes/blockchain');

app.set('blockchain',blockchain);
app.set('nodeAddress', nodeAddress);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/nodes', nodeRouter);
app.use('/transactions', transactionRouter);
app.use('/block', blockRouter);
app.use('/blockchain', blockchainRouter);

app.get('/block-explorer', (req, res) => {
  res.sendFile('./block-explorer/index.html', {root: __dirname});
})

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});


module.exports = app;