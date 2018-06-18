var router = require('express').Router()

const user = require('./user')
const shop = require('./shop')
const kernel = require('./kernel')

module.exports = function(app, db) {
  router.use('/user/', user(app, db))
  router.use('/shop/', shop(app, db))
  router.use('/kernel/', kernel(app, db))
  return router
}