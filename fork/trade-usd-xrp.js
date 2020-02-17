const config = require('../config.json')
const log = msg => { process.send(msg) }
process.on('message', msg => { log('Child got message @ ' + __filename, msg) })

setTimeout(() => {
  log('Child timeout exit @ ' + __filename)
  process.exit(1)
}, 30 * 1000)

const RippledWsClient = require('rippled-ws-client')
const RippledWsClientSign = require('rippled-ws-client-sign')

const Transaction = {
  TransactionType: 'Payment',
  Account: config.xrpl.account,
  Destination: config.xrpl.account,
  Fee: '20',
  Flags: 131072,
  Amount: '1000000000',
  SendMax: {
    currency: config.xrpl.currency,
    issuer: config.xrpl.issuer',
    value: '10000'
  }
}

log('Connecting @ ' + __filename)
new RippledWsClient('wss://xrpl.ws').then(Connection => {
  log('Connected @ ' + __filename) 
  new RippledWsClientSign(Transaction, config.xrpl.secret, Connection).then(TransactionSuccess => {
    log('TransactionSuccess @ ' + __filename + ' = ' + JSON.stringify(TransactionSuccess))
    process.exit(0)
  }).catch(SignError => {
    log('TransactionError @ ' + __filename + ' = ' + JSON.stringify(SignError.details))
    process.exit(1)
  })
}).catch(ConnectionError => {
  log('ConnectionError @ ' + __filename + ' = ' + JSON.stringify(ConnectionError))
  process.exit(1)
})
