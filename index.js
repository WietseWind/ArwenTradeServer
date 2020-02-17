console.log('Starting server...')

const config = require('./config.json')
const express = require('express')
const app = express()
const { fork } = require('child_process')

const RippledWsClient = require('rippled-ws-client')
const RippledWsClientSign = require('rippled-ws-client-sign')

const tradeTimeoutMinutes = parseFloat(config.tradeTimeout || 5)

let noTrades = false

app.get('/:url(light-on|light-off|trade-' + config.xrpl.currency.toLowerCase() + '-xrp|trade-xrp-' + config.xrpl.currency.toLowerCase() + '|trade)', async (req, res) => {

  if (req.params.url === 'trade') {
    if (noTrades) {
      return res.status(200).send('No trades, timeout...')
    } else {
      try {
        console.log('Trade, check balances')
        const connection = await new RippledWsClient('wss://xrpl.ws')
        const balances = await connection.send({ command: 'account_lines', account: config.xrpl.account })
        const balance = parseFloat(balances.lines.filter(b => b.account === config.xrpl.issuer && b.currency === config.xrpl.currency)[0].balance)

        console.log(config.xrpl.currency + ' balance for ' + config.xrpl.account, balance)

        noTrades = true
        console.log('No more trading for ' + tradeTimeoutMinutes + ' minutes')
        setTimeout(() => {
          console.log('Allow trading again...')
          noTrades = false
        }, 60 * tradeTimeoutMinutes * 1000)

        if (!isNaN(balance) && balance > 0) {
          console.log('Got ' + config.xrpl.currency + ' balance, trade ' + config.xrpl.currency + ' for XRP')
          req.params.url = 'trade-' + config.xrpl.currency.toLowerCase() + '-xrp'
        } else {
          console.log('Got *NO* ' + config.xrpl.currency + ' balance, trade XRP for ' + config.xrpl.currency)
          req.params.url = 'trade-xrp-' + config.xrpl.currency.toLowerCase()
        }
      } catch (e) {
        console.log('Error checking balancesf or trade', e.message)
        return res.status(200).send('Error trading :( ' + e.message)
      }
    }
  }

  console.log('Forking...', req.params.url)
  const child = fork('fork/' + req.params.url + '.js')

  child.on('message', msg => {
    console.log('Child message', msg)
  })

  child.on('exit', code => {
    console.log('Child exit', code)
  })

  return res.status(200).send(req.params.url)
})

app.listen(parseFloat(config.port || 9999))
console.log('Server listening (:' + (config.port || 9999) + ')...')
