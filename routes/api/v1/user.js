var router      = require('express').Router()
const ObjectID  = require('mongodb').ObjectID
const passport  = require('passport')

//http://www.passportjs.org/docs/authenticate/
const processAuthentication = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    console.log('3>', err, user, info)
    if (err) {
      console.log('ошибка ввода')
      return res.status(500).send({ error: 'ошибка ввода' })
    }
    if (!user) {
      console.log('user login dont exist')
      return res.status(200).send({ error: 'ошибка входа' })
    }
    req.logIn(user, err => {
      if (err) {
        console.log('login process error')
        return res.status(500).send({ error: 'login process error' })
      }
      console.log('login success: ', user)
      return res.status(200).send({user})
    })
  })(req, res, next)
}

module.exports = (app, db) => {
  router.get('/auth', (req, res) => {
    console.log('user/auth', req.isAuthenticated(), req.user)
    res.status(200).send({ isAuthenticated: req.isAuthenticated(), user: req.user })
  })
  router.post('/login', (req, res, next) => {
    console.log('user/login', req.body)
    console.log('is auth', req.isAuthenticated())
    processAuthentication(req, res, next)
  })
  router.post('/logout', (req, res, next) => {
    console.log('user/logout', req.body)
    req.logOut()
    req.session.destroy()
    res.status(200).send({ success: true })
  })
  router.post('/register', (req, res, next) => {
    console.log('user/register', req.body)
    db.models.user.isLoginTaken(req.body.login, result => {
      console.log('user/register>result', result)
      if(result === null) db.models.user.create({ login: req.body.login, email: req.body.email, password: req.body.password }, (err2, res2) => {
        if(err2) res.status(500).send({ error: 'user insert error' })
        else processAuthentication(req, res, next)
      })
    })
  })
  ////////////////////////////////////////////////////////////////
  router.get('/cart', (req, res, next) => {
    console.log('user/cart/get', req.body)
    db.models.user.cart.get(req.user._id, cart => {
      res.status(200).send({ cart })
    })
  })
  router.post('/cart', (req, res, next) => {
    console.log('user/cart/add', req.body)
    db.models.user.cart.add(req.user._id, req.body.product_id, req.body.amount, cart => {
      res.status(201).send({ cart })
    })
  })
  router.delete('/cart', (req, res, next) => {
    console.log('user/cart/delete', req.body)
    db.models.user.cart.remove(req.user._id, req.body.product_id, cart => {
      res.status(200).send({ cart })
    })
  })
  ////////////////////////////////////////////////////////////////
  router.get('/favorites', (req, res, next) => {
    console.log('user/favorites/get', req.body)
    db.models.user.favorites.get(req.user._id, favorites => {
      res.status(200).send({ favorites })
    })
  })
  router.post('/favorites', (req, res, next) => {
    console.log('user/favorites/add', req.body)
    db.models.user.favorites.add(req.user._id, req.body.product_id, favorites => {
      res.status(201).send({ favorites })
    })
  })
  router.delete('/favorites', (req, res, next) => {
    console.log('user/favorites/delete', req.body)
    db.models.user.favorites.remove(req.user._id, req.body.product_id, favorites => {
      res.status(200).send({ favorites })
    })
  })
  return router
}