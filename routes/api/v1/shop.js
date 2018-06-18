var router = require('express').Router()

module.exports = function(app, db) {
  router.get('/map', (req, res) => {
    console.log('shop/map')
    db.models.product.category.map((err, map) => {
      console.log('shop/map>map', map)
      res.status(200).send({ map })
    })
  })
  router.get('/params', (req, res) => {
    console.log('shop/params', req.body)
    db.models.product.param.map(map => {
      res.status(200).send({ map })
    })
  })
  router.get('/products', (req, res) => {
    console.log('shop/products/available', req.query)
    db.models.product.findAvailable({
      subcategory: req.query.subcategory,
      query: req.query.query,
    }, products => {
      console.log(products)
      res.status(200).send({ products })
    })
  })
  router.get('/products/all', (req, res) => {
    console.log('shop/products/all', req.query)
    db.models.product.findAll({
      subcategory: req.query.subcategory
    }, products => {
      console.log(products)
      res.status(200).send({ products })
    })
  })
  router.get('/product/:productId', (req, res) => {
    console.log('/shop/product-get', req.params)
    db.models.product.get(req.params.productId, info => {
      res.status(200).send({ info })
    })
  })
  router.post('/product/comment', (req, res) => {
    console.log('/shop/product-comment', req.body)
    db.models.product.comments.create(req.body.productId, req.body.data, () => {
      db.models.product.get(req.body.productId, info => {
        res.status(200).send({ info })
      })
    })
  })
  router.get('/orders', (req, res) => {
    console.log('/shop/orders get', req.params)
    db.models.shop.orders.getUserProductsOrders(req.user._id, orders => {
      db.models.product.getLiteralWrapper(wrapper => {
        let wrappedOrders = orders.map(e => {
          ne = { ... e }
          ne.productsData = e.productsData.map(prd => wrapper(prd))
          return ne
        })
        res.status(200).send({ orders: wrappedOrders  })
      })
    })
  })
  router.post('/orders', (req, res) => {
    console.log('/shop/orders/make-product', req.body)
    //res.status(200).send({ })
    db.models.shop.orders.createProductOrderFromUserCart(req.user._id, req.body, order => {// req.user._id
      db.models.user.cart.get(req.user._id, cart => {
        res.status(201).send({ cart, order })
      })
    })
  })
  router.post('/orders/call', (req, res) => {
    console.log('/shop/orders/make-call', req.body)
    db.models.shop.orders.createCallOrder(req.body, e => {
      res.status(200).send({ })
    })
  })
  router.post('/orders/service', (req, res) => {
    console.log('/shop/orders/make-service', req.body)
    db.models.shop.orders.createServiceOrder(req.body, e => {
      res.status(200).send({ })
    })
  })
  router.get('/services', (req, res) => {
    db.models.shop.getServices(services => {
      res.status(200).send({ services })
    })
  })
  return router
}