const nodeRouter = require('express').Router();
const fetch = require('node-fetch');

let blockchain;

nodeRouter.all('/*', (req, res, next) => {
  blockchain = req.app.get('blockchain');
  next();
});

nodeRouter.post('/register', (req, res) => {
  try {
    const newNodeUrl = req.body.newNodeUrl;
    const nodeNotAlreadyPresent =
      blockchain.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNode = blockchain.nodeUrl !== newNodeUrl;
    if (nodeNotAlreadyPresent && notCurrentNode)
      blockchain.networkNodes.push(newNodeUrl);
    res.json({ note: 'New node registered successfully.' });
  } catch (err) {
    console.log('/node/register ERROR:\n' + err);
  }
});

// register multiple nodes at once
nodeRouter.post('/register-bulk', (req, res) => {
  try {
    const allNetworkNodes = req.body.allNetworkNodes;
    allNetworkNodes.forEach((networkNodeUrl) => {
      const nodeNotAlreadyPresent =
        blockchain.networkNodes.indexOf(networkNodeUrl) == -1;
      const notCurrentNode = blockchain.nodeUrl !== networkNodeUrl;
      if (nodeNotAlreadyPresent && notCurrentNode)
        blockchain.networkNodes.push(networkNodeUrl);
    });

    res.json({ note: 'Bulk registration successful.' });
  } catch (err) {
    console.log('/nodes/register-bulk ERROR:\n' + err);
  }
});

// register a node and broadcast it the network
nodeRouter.post('/register-and-broadcast', (req, res) => {
  const newNodeUrl = req.body.newNodeUrl;
  if (blockchain.networkNodes.indexOf(newNodeUrl) == -1)
    blockchain.networkNodes.push(newNodeUrl);

  const regNodesPromises = [];
  blockchain.networkNodes.forEach((networkNodeUrl) => {
    regNodesPromises.push(
      fetch(networkNodeUrl + '/nodes/register', {
        method: 'POST',
        body: JSON.stringify({
          newNodeUrl: newNodeUrl,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );
  });

  Promise.all(regNodesPromises)
    .then(() => {
      return fetch(newNodeUrl + '/nodes/register-bulk', {
        method: 'POST',
        body: JSON.stringify({
          allNetworkNodes: [...blockchain.networkNodes, blockchain.nodeUrl],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(() => {
          res.json({ note: 'New node registered with network successfully.' });
        })
        .catch((err) => {
          console.log('/nodes/register-bulk Error:\n' + err);
        });
    })
    .catch((err) => {
      console.log('/nodes/register err:\n' + err);
    });
});

module.exports = nodeRouter;
