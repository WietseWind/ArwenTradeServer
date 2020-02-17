const config = require('../config.json')
const log = msg => { process.send(msg) }
process.on('message', msg => { log('Child got message @ ' + __filename, msg) })

setTimeout(() => {
  log('Child timeout exit @ ' + __filename)
  process.exit(1)
}, 30 * 1000)

const nhc2 = require('nhc2-hobby-api')

log('Child light off...')

const main = async () => {
  const service = new nhc2.NHC2('mqtts://' + config.niko.ip, { port: 8884, clientId: config.niko.client, username: 'hobby', password: config.niko.password, rejectUnauthorized: false })
  console.log('Subscribing @ ' + __filename)
  await service.subscribe()
  console.log('Subscribed @ ' + __filename)
  const accessories = await service.getAccessories()
  const device = accessories.filter(a => a.Name.match(config.niko.deviceName))[0]
  log(JSON.stringify(device))
  await service.sendBrightnessChangeCommand(device.Uuid, 0)
  await new Promise(resolve => { setTimeout(() => { resolve() }, 5000) })
  log('Done @ ' + __filename)
  process.exit(0)
}

main()
