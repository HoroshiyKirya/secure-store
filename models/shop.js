const ObjectId = require('mongodb').ObjectID

module.exports = db => ({
  orders: {
    getUserProductsOrders(userId, cb) {
      db.collection('shop_orders_products').aggregate([
        {$match:{fromUser: new ObjectId(userId)}},
        {$project: {data: '$$ROOT'}},
        {$lookup:{from:'products',localField:'data.products.productId',foreignField:'_id',as:'productsData'}},
      ]).toArray((err, res) => { cb(res) })
    },
    getAllProductsOrders(cb) {
      db.collection('shop_orders_products').aggregate([
        {$project: {data: '$$ROOT'}},
        {$lookup:{from:'products',localField:'data.products.productId',foreignField:'_id',as:'productsData'}},
      ]).toArray((err, res) => { cb(res) })
    },
    createProductOrderFromUserCart(userId, orderData, cb) {
      let _orderData = { ...orderData }
      _orderData.delivery.type = new ObjectId(orderData.delivery.type)
      if(orderData.mount.type) _orderData.mount.type = new ObjectId(orderData.mount.type)
      db.collection('users').aggregate([
        {$match:{_id:new ObjectId(userId)}},
        {$unwind:'$cart'},
        {$project: {cartItem: '$cart'}},
        {$lookup:{from:'products',localField:'cartItem.productId',foreignField:'_id',as:'cartItemData'}},
        {$match:{'cartItemData.accounting.inStock':{$gt:0}}},
        {$unwind:'$cartItemData'},
        {$project:{orderItem:{
          productId: '$cartItem.productId',
          amount:{$cond:{if:{$lte:['$cartItem.amount',"$cartItemData.accounting.inStock"]},then:"$cartItem.amount",else:"$cartItemData.accounting.inStock"}},
        }}},
        {$group:{_id:"$_id", products:{$push:"$orderItem"}}},
        {$addFields:{
          fromUser: new ObjectId(userId),
          info: orderData,
          date: Date.now()
        }},
        {$project:{_id:0}}
      ]).toArray((err,orderResult) => {
        //console.log('createProductOrderFromUserCart->', orderResult)
        db.collection('shop_orders_products').insertOne(orderResult[0], (err2, res2) => {
          //console.log('xx', res2) // res.insertedId
          //db.collection('users').updateOne({_id:new ObjectId(userId)},{$pull:{"cart.$[i]":true},},{arrayFilters:[{'i.productId':{$in:orderResult[0].products.map(e=>new ObjectId(e.productId))}}]})
          db.collection('users').updateOne(
            { _id: new ObjectId(userId)}, 
            {$pull: {cart: {productId: {$in: orderResult[0].products.map(e => new ObjectId(e.productId))}}}},
            (err3, res3) => {
              //console.log('cxcx',res3)
              cb(res2.ops[0])
            }
          )
          ////////////
        })
      })
    },
    createCallOrder(orderData, cb) {
      let od = { ...orderData }
      od.date = Date.now()
      db.collection('shop_orders_calls').insertOne(od, (err, res) => {
        cb()
      })
    },
    createServiceOrder(orderData, cb) {
      let od = { ...orderData }
      od.date = Date.now()
      od.forOrder = new ObjectId(od.forOrder)
      db.collection('shop_orders_service').insertOne(od, (err, res) => {
        cb()
      })
    },
    getAllCallOrders(cb) {
      db.collection('shop_orders_calls').aggregate([]).toArray((err, res) => { cb(res) })
    },
    getAllServiceOrders(cb) {
      db.collection('shop_orders_service').aggregate([
        {$project: {data: '$$ROOT'}},
        {$lookup:{from:'shop_orders_products',localField:'data.forOrder',foreignField:'_id',as:'orderData.data'}},
        {$unwind:'$orderData.data'},
        {$lookup:{from:'products',localField:'orderData.data.products.productId',foreignField:'_id',as:'orderData.productsData'}},
      ]).toArray((err, res) => { cb(res) })
    },
  },
  getServices(cb) {
    db.collection('shop_service').find({}).toArray((err, res) => {
      cb(res)
    })
  }
})