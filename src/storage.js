const Redis = require('redis')
const util = require('util')

let client = Redis.createClient(global.redisURL)
client.on('error', (error) => {
  if (process.env.DEBUG_ERRORS) {
    console.log('redis.storage', error)
  }
  process.exit(1)
})

client.on('end', () => {
  client = null
})

module.exports = {
  client,
  exists: util.promisify(exists),
  read: util.promisify(read),
  readMany: util.promisify(readMany),
  readImage: util.promisify(readImage),
  write: util.promisify(write),
  writeImage: util.promisify(writeImage),
  deleteFile: util.promisify(deleteFile)
}

function exists (path, callback) {
  if (!path) {
    throw new Error('invalid-file')
  }
  if (path.indexOf('/') === path.length - 1) {
    throw new Error('invalid-file')
  }
  return client.exists(path, callback)
}

function deleteFile(path, callback) {
  if (!path) {
    throw new Error('invalid-file')
  }
  if (path.indexOf('/') === path.length - 1) {
    throw new Error('invalid-file')
  }
  return client.del(path, callback)
}

function write(file, contents, callback) {
  if (!file) {
    throw new Error('invalid-file')
  }
  if (!contents && contents !== '') {
    throw new Error('invalid-contents')
  }
  return client.set(file, contents, callback)
}

function writeImage(file, buffer, callback) {
  if (!file) {
    throw new Error('invalid-file')
  }
  if (!buffer || !buffer.length) {
    throw new Error('invalid-buffer')
  } 
  return client.set(file, buffer, callback)
}

function read(file, callback) {
  if (!file) {
    throw new Error('invalid-file')
  }
  return client.get(file, callback)
}

function readMany(path, files, callback) {
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
}

function readImage(file, callback) {
  if (!file) {
    throw new Error('invalid-file')
  }
  return client.get(file, callback)
}
