const fs = require('fs')
const path = require('path')
const Redis = require('redis')
const util = require('util')

module.exports = {
  setup: util.promisify((moduleName, callback) => {
    if (!callback) {
      callback = moduleName
      moduleName = null
    }
    const redisHost = process.env[`${moduleName}_REDIS_HOST`] || process.env.REDIS_HOST
    const redisPort = process.env[`${moduleName}_REDIS_PORT`] || process.env.REDIS_PORT
    const redisURL = process.env[`${moduleName}_REDIS_URL`] || process.env.REDIS_URL || 'redis://localhost:6379'
    const dashboardPath1 = path.join(global.applicationPath, 'node_modules/@userdashboard/dashboard/src/log.js')
    let Log
    if (fs.existsSync(dashboardPath1)) {
      Log = require(dashboardPath1)('redis')
    } else {
      const dashboardPath2 = path.join(global.applicationPath, 'src/log.js')
      Log = require(dashboardPath2)('redis')
    }
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
      throw error
    })
    client.on('end', () => {
      client = null
    })
    const container = {
      client,
      exists: util.promisify((file, callback) => {
        if (!file) {
          Log.error('invalid file', file)
          throw new Error('invalid-file')
        }
        return client.exists(file, (error, result) => {
          if (error) {
            Log.error('error checking exists', error)
            return callback(new Error('unknown-error'))
          }
          return callback(null, result)
        })
      }),
      read: util.promisify((file, callback) => {
        if (!file) {
          Log.error('invalid file', file)
          throw new Error('invalid-file')
        }
        return client.get(file, (error, result) => {
          if (error) {
            Log.error('error reading', error)
            return callback(new Error('unknown-error'))
          }
          return callback(null, result)
        })
      }),
      readMany: util.promisify((path, files, callback) => {
        if (!files || !files.length) {
          Log.error('invalid files', files)
          throw new Error('invalid-files')
        }
        const fullPaths = []
        for (const file of files) {
          fullPaths.push(`${path}/${file}`)
        }
        const data = {}
        return client.mget(fullPaths, (error, array) => {
          if (error) {
            Log.error('error reading many', error)
            return callback(new Error('unknown-error'))
          }
          for (const i in files) {
            data[files[i]] = array[i]
          }
          return callback(null, data)
        })
      }),
      readBinary: util.promisify((file, callback) => {
        if (!file) {
          Log.error('invalid file', file)
          throw new Error('invalid-file')
        }
        return client.get(file, (error, result) => {
          if (error) {
            Log.error('error reading binary', error)
            return callback(new Error('unknown-error'))
          }
          return callback(null, result)
        })
      }),
      write: util.promisify((file, contents, callback) => {
        if (!file) {
          Log.error('invalid file', file)
          throw new Error('invalid-file')
        }
        if (!contents && contents !== '') {
          throw new Error('invalid-contents')
        }
        return client.set(file, contents, (error, result) => {
          if (error) {
            Log.error('error writing', error)
            return callback(new Error('unknown-error'))
          }
          return callback(null, result)
        })
      }),
      writeBinary: util.promisify((file, buffer, callback) => {
        if (!file) {
          Log.error('invalid file', file)
          throw new Error('invalid-file')
        }
        if (!buffer || !buffer.length) {
          Log.error('invalid buffer', buffer)
          throw new Error('invalid-buffer')
        }
        return client.set(file, buffer, (error, result) => {
          if (error) {
            Log.error('error writing binary', error)
            return callback(new Error('unknown-error'))
          }
          return callback(null, result)
        })
      }),
      delete: util.promisify((file, callback) => {
        if (!file) {
          Log.error('invalid file')
          throw new Error('invalid-file')
        }
        return client.del(file, (error, result) => {
          if (error) {
            Log.error('error deleting', error)
            return callback(new Error('unknown-error'))
          }
          return callback(null, result)
        })
      })
    }
    if (process.env.NODE_ENV === 'testing') {
      container.flush = util.promisify((callback) => {
        client.flushdb(callback)
      })
    }
    return callback(null, container)
  })
}
