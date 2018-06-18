const router    = require('express').Router()
const ObjectID  = require('mongodb').ObjectID
const passport  = require('passport')
const storage   = require('../../../storage')

module.exports = function(app, db) {
  router.post('/products', storage.products.single('image'), (req, res) => {
    console.log('kernel/products/add', req.body)
    let prd = {...req.body,image:req.file.filename}
    prd.params = JSON.parse(prd.params)
    db.models.product.create(prd,() => {
      res.status(201).send('hello users')
    })
  })
  router.post('/products/category', (req, res) => {
    console.log('kernel/products/category post', req.body)
    const response = () => db.models.product.category.map((err, map) => res.status(200).send({ map }))
    if(req.body.parent) 
      db.models.product.category.createSubcategory(req.body.title, req.body.parent, response)
    else 
      db.models.product.category.createCategory(req.body.title, response)
  })
  router.post('/products/params', (req, res) => {
    console.log('kernel/products/params', req.body)
    db.models.product.param.create({ ...req.body }, () => {
      db.models.product.param.map(map => {
        res.status(201).send({ map })
      })
    })
  })
  router.delete('/product/comment/remove', (req, res) => {
    console.log('/product/comment/remove', req.body)
    db.models.product.comments.remove(req.body.productId, req.body.commentId, () => {
      db.models.product.get(req.body.productId, info => {
        res.status(200).send({ info })
      })
    })
  })
  router.post('/shop/accounting', (req, res) => {
    console.log('/shop/kernel/accounting', req.body)
    db.models.product.accounting.setProductAmount(req.body.id, req.body.amount, e => {
      res.status(200).send({ status:true })
    })
  })
  router.get('/shop/orders/products', (req,res) => {
    console.log('/shop/orders/products')
    db.models.shop.orders.getAllProductsOrders(orders => {
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
  router.get('/shop/orders/calls', (req, res) => {
    console.log('/shop/orders/calls')
    db.models.shop.orders.getAllCallOrders(orders => {
      res.status(200).send({ orders  })
    })
  })
  router.get('/shop/orders/service', (req, res) => {
    console.log('/shop/orders/service')
    db.models.shop.orders.getAllServiceOrders(orders => {
      db.models.product.getLiteralWrapper(wrapper => {
        let wrappedOrders = orders.map(e => {
          ne = { ... e }
          ne.orderData.productsData = ne.orderData.productsData.map(prd => wrapper(prd))
          return ne
        })
        res.status(200).send({ orders: wrappedOrders  })
      })
    })
  })
  return router
}
