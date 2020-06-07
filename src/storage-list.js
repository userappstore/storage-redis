const fs = require('fs')
const path = require('path')
const util = require('util')

module.exports = {
  setup: async (storage) => {
    const dashboardPath1 = path.join(global.applicationPath, 'node_modules/@userdashboard/dashboard/src/log.js')
    let Log
    if (fs.existsSync(dashboardPath1)) {
      Log = require(dashboardPath1)('redis-list')
    } else {
      const dashboardPath2 = path.join(global.applicationPath, 'src/log.js')
      Log = require(dashboardPath2)('redis-list')
    }
    const container = {
      add: util.promisify((path, itemid, callback) => {
        return storage.client.hsetnx(`list/${path}`, itemid, '1', (error) => {
          if (error) {
            Log.error('error adding item', error)
            return callback(error)
          }
          return storage.client.lpush(path, itemid, callback)
        })
      }),
      addMany: util.promisify((items, callback) => {
        const paths = Object.keys(items)
        function nextItem () {
          if (!paths.length) {
            return callback()
          }
          const path = paths.shift()
          const itemid = items[path]
          return storage.client.hsetnx(`list/${path}`, itemid, '1', (error) => {
            if (error) {
              Log.error('error adding many items', error)
              return callback(new Error('unknown-error'))
            }
            return storage.client.lpush(path, itemid, callback)
          })
        }
        return nextItem()
      }),
      count: util.promisify((path, callback) => {
        return storage.client.llen(path, (error) => {
          if (error) {
            Log.error('error adding item', error)
            return callback(new Error('unknown-error'))
          }
          return callback()
        })
      }),
      exists: util.promisify((path, itemid, callback) => {
        return storage.client.hexists(`list/${path}`, itemid, (error, index) => {
          if (error) {
            Log.error('error adding many items', error)
            return callback(new Error('unknown-error'))
          }
          return callback(null, index === 1)
        })
      }),
      list: util.promisify((path, offset, pageSize, callback) => {
        offset = offset || 0
        if (pageSize === null || pageSize === undefined) {
          pageSize = global.pageSize
        }
        if (offset < 0) {
          throw new Error('invalid-offset')
        }
        return storage.client.lrange(path, offset, offset + pageSize - 1, callback)
      }),
      listAll: util.promisify((path, callback) => {
        return storage.client.lrange(path, 0, -1, (error) => {
          if (error) {
            Log.error('error adding many items', error)
            return callback(new Error('unknown-error'))
          }
          return callback()
        })
      }),
      remove: util.promisify((path, itemid, callback) => {
        return storage.client.lrem(path, 1, itemid, (error) => {
          if (error) {
            Log.error('error adding many items', error)
            return callback(new Error('unknown-error'))
          }
          return callback()
        })
      })
    }
    return container
  }
}
