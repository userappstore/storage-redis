const Log = require('@userdashboard/src/log.js')('storage-redis')
const Redis = require('redis')
const util = require('util')

module.exports = {
  setup: async (moduleName) => {
    const redisHost = process.env[`${moduleName}_REDIS_HOST`] || process.env.REDIS_HOST
    const redisPort = process.env[`${moduleName}_REDIS_PORT`] || process.env.REDIS_PORT
    const redisURL = process.env[`${moduleName}_REDIS_URL`] || process.env.REDIS_URL || 'redis://localhost:6379'
    let client
    if (redisHost && redisPort) {
      client = Redis.createClient(redisPort, redisHost)
    } else {
      client = Redis.createClient(redisURL)
    }
    if (redisURL) {
      let db = redisURL.split('/').pop()
      if (db.length && db.length < 3) {
        try {
          db = parseInt(db)
          client.select(db)
        } catch (error) {
        }
      }
    }
    client.on('error', (error) => {
      Log.error('redis storage error', error)
      process.exit(1)
    })
    client.on('end', () => {
      client = null
    })
    const container = {
      client,
      exists: util.promisify((file, callback) => {
        if (!file) {
          throw new Error('invalid-file')
        }
        return client.exists(file, callback)
      }
      ),
      read: util.promisify((file, callback) => {
        if (!file) {
          throw new Error('invalid-file')
        }
        return client.get(file, callback)
      }),
      readMany: util.promisify((path, files, callback) => {
        if (!files || !files.length) {
          throw new Error('invalid-files')
        }
        const fullPaths = []
        for (const file of files) {
          fullPaths.push(`${path}/${file}`)
        }
        const data = {}
        return client.mget(fullPaths, (error, array) => {
          if (error) {
            return callback(error)
          }
          for (const i in files) {
            data[files[i]] = array[i]
          }
          return callback(null, data)
        })
      }),
      readBinary: util.promisify((file, callback) => {
        if (!file) {
          throw new Error('invalid-file')
        }
        return client.get(file, callback)
      }),
      write: util.promisify((file, contents, callback) => {
        if (!file) {
          throw new Error('invalid-file')
        }
        if (!contents && contents !== '') {
          throw new Error('invalid-contents')
        }
        return client.set(file, contents, callback)
      }),
      writeBinary: util.promisify((file, buffer, callback) => {
        if (!file) {
          throw new Error('invalid-file')
        }
        if (!buffer || !buffer.length) {
          throw new Error('invalid-buffer')
        }
        return client.set(file, buffer, callback)
      }),
      delete: util.promisify((file, callback) => {
        if (!file) {
          throw new Error('invalid-file')
        }
        return client.del(file, callback)
      })
    }
    if (process.env.NODE_ENV === 'testing') {
      container.flush = util.promisify((callback) => {
        client.flushdb(callback)
      })
    }
    return container
  }
}
