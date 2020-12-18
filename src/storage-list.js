const util = require('util')

module.exports = {
  setup: async (storage) => {
    const Log = require('@userdashboard/dashboard/src/log.js')('redis-list')
    const container = {
      add: util.promisify((path, itemid, callback) => {
        return storage.client.hsetnx(`list/map/${path}`, itemid, '1', (error) => {
          if (error) {
            Log.error('error adding item', error)
            return callback(error)
          }
          return storage.client.lpush(`list/${path}`, itemid, (error) => {
            if (error) {
              Log.error('error adding item', error)
              return callback(error)
            }
            return callback()
          })
        })
      }),
      addMany: util.promisify((items, callback) => {
        const paths = Object.keys(items)
        const multi = storage.client.multi()
        for (const path of paths) {
          const itemid = items[path]
          multi.hsetnx(`list/map/${path}`, itemid, '1')
          multi.lpush(`list/${path}`, itemid)
        }
        return multi.exec((error) => {
          if (error) {
            Log.error('error adding many items', error)
            return callback(new Error('unknown-error'))
          }
          return callback()
        })
      }),
      count: util.promisify((path, callback) => {
        return storage.client.llen(`list/${path}`, (error, result) => {
          if (error) {
            Log.error('error adding item', error)
            return callback(new Error('unknown-error'))
          }
          return callback(null, result)
        })
      }),
      exists: util.promisify((path, itemid, callback) => {
        return storage.client.hexists(`list/map/${path}`, itemid, (error, index) => {
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
        return storage.client.lrange(`list/${path}`, offset, offset + pageSize - 1, (error, results) => {
          if (error) {
            Log.error('error listing', error)
            return callback(new Error('unknown-error'))
          }
          return callback(null, results)
        })
      }),
      listAll: util.promisify((path, callback) => {
        return storage.client.lrange(`list/${path}`, 0, -1, (error, results) => {
          if (error) {
            Log.error('error listing all', error)
            return callback(new Error('unknown-error'))
          }
          return callback(null, results)
        })
      }),
      remove: util.promisify((path, itemid, callback) => {
        return storage.client.lrem(`list/${path}`, 1, itemid, (error) => {
          if (error) {
            Log.error('error removing', error)
            return callback(new Error('unknown-error'))
          }
          return callback()
        })
      })
    }
    return container
  }
}
