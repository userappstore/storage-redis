const Storage = require('./storage.js')
const util = require('util')

module.exports = {
  add: util.promisify(add),
  count: util.promisify(count),
  exists: util.promisify(exists),
  list: util.promisify(list),
  listAll: util.promisify(listAll),
  remove
}

function exists(path, itemid, callback) {
  return Storage.client.hexists(`list/${path}`, itemid, (error, index) => {
    return callback(error, index === 1)
  })
}

function add(path, itemid, callback) {
  return exists(path, itemid, (error, existing) => {
    if (error) {
      return callback(error)
    }
    if (existing) {
      return callback()
    }
    return Storage.client.hset(`list/${path}`, itemid, '1', (error) => {
      if (error) {
        return callback(error)
      }
      return Storage.client.lpush(path, itemid, callback)
    })
  })
}

function count(path, callback) {
  return Storage.client.llen(path, callback)
}

function listAll(path, callback) {
  return Storage.client.lrange(path, 0, -1, callback)
}

function list(path, offset, pageSize, callback) {
  offset = offset || 0
  if (pageSize === null || pageSize === undefined) {
    pageSize = global.pageSize
  }
  if (offset < 0) {
    throw new Error('invalid-offset')
  }
  if (offset && offset >= pageSize) {
    throw new Error('invalid-offset')
  }
  return Storage.client.lrange(path, offset, offset + pageSize - 1, callback)
}

function remove(path, itemid, callback) {
  return Storage.client.lrem(path, 1, itemid, callback)
}
