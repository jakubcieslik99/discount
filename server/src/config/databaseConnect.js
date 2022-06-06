import mongoose from 'mongoose'
import { config, log } from './utilities'

const databaseConnect = async app => {
  mongoose.connection.on('connected', () => log.info('MongoDB connection established'))
  mongoose.connection.on('disconnected', () => log.warn('MongoDB connection dropped'))

  /*process.on('SIGINT', async () => {
    await mongoose.connection.close()
    process.exit(0)
  })*/

  try {
    await mongoose.connect(config.MONGODB_URI)
    app.emit('ready')
  } catch (error) {
    log.error(error)
  }
}

export default databaseConnect
