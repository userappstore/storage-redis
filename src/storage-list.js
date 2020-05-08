const util = require('util')

module.exports = {
  setup: async (storage) => {
    const container = {
      add: util.promisify((path, itemid, callback) => {
        return storage.exists(path, itemid, (error, existing) => {
          if (error) {
            return callback(error)
          }
          if (existing) {
            return callback()
          }
          return storage.client.hset(`list/${path}`, itemid, '1', (error) => {
            if (error) {
              return callback(error)
            }
            return storage.client.lpush(path, itemid, callback)
          })
        })
      }),
      count: util.promisify((path, callback) => {
        return storage.client.llen(path, callback)
      }),
      exists: util.promisify((path, itemid, callback) => {
        return storage.client.hexists(`list/${path}`, itemid, (error, index) => {
          return callback(error, index === 1)
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
        return storage.client.lrange(path, 0, -1, callback)
      }),
      remove: util.promisify((path, itemid, callback) => {
        return storage.client.lrem(path, 1, itemid, callback)
      }
      )
    }
    return container
  }
}
