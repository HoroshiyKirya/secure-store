var router = require('express').Router()

var v1api = require('./v1')

module.exports = function(app, db) {
  router.use('/v1/', v1api(app, db))
  router.get('/', (req, res) => { res.status(200).send('v1'); })
  return router
}