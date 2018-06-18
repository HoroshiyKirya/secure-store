const ObjectID  = require('mongodb').ObjectID
const bcrypt = require('bcrypt')
const SALT_WORK_FACTOR = 10

module.exports = db => ({
  isLoginTaken(login, cb) {
    db.collection('users').findOne({ "login": login }).then(cb)
  },
  findByLogin(login, callback) {
    db.collection('users').findOne({ "login": login }).then(el => {
      if(el === null) return callback(null)
      this.cart.get(el._id, mappedCart => {
        el.cart = mappedCart
       this.favorites.get(el._id, mappedFavorites => {
         el.favorites = mappedFavorites
        callback(el)
       })
      })
    })
  },
  create(user, callback) {
    db.collection('users').insertOne({
      login:  user.login,
      email:  user.email,
      password: bcrypt.hashSync(user.password, SALT_WORK_FACTOR),
      role:   "user",
      cart: [],
      favorites: [],
    }, callback)
  },
  assertPasswords(pass1, pass2) {
    return bcrypt.compareSync(pass1, pass2)
  },
  favorites: {
    get(userId, cb) {
      db.collection('users').aggregate([
        {$match:{_id:new ObjectID(userId)}},
        {$project:{list:'$favorites'}},
        {$lookup:{from:'products',localField:'list',foreignField:'_id',as:'products'}}
      ]).toArray((err,res) => {
        const result = res[0]
        db.collection('products_params').find({type:'global'}).toArray((errp, resp) => {
          const products = result.products.map(prd => {
            prd.literals = {}
            resp.forEach(e => prd.literals[e.field] = prd.params.find(x => x.paramId.toString() === e._id.toString()).value)
            return prd
          })
          result.products = products
          cb(result)
        })
      })
    },
    add(userId, productId, cb) {
      db.collection('users').updateOne(
        { _id: new ObjectID(userId) },
        { $addToSet: { favorites: new ObjectID(productId) }},
      ).then(res => {
        this.get(userId, cb)
      })
    },
    remove(userId, productId, cb) {
      db.collection('users').updateOne(
        { _id: new ObjectID(userId) },
        { $pull: { favorites: new ObjectID(productId) } }
      ).then(res => {
        this.get(userId, cb)
      })
    }
  },
  cart: {
    get(userId, cb) {
      db.collection('users').aggregate([
        {$match:{_id:new ObjectID(userId)}},
        {$project:{list:'$cart'}},
        {$lookup:{from:'products',localField:'list.productId',foreignField:'_id',as:'products'}}
      ]).toArray((err,res) => {
        const result = res[0]
        db.collection('products_params').find({type:'global'}).toArray((errp, resp) => {
          const products = result.products.map(prd => {
            prd.literals = {}
            resp.forEach(e => prd.literals[e.field] = prd.params.find(x => x.paramId.toString() === e._id.toString()).value)
            return prd
          })
          result.products = products
          cb(result)
        })
      })
    },
    add(userId, productId, productAmount, cb) {
      db.collection('users').updateOne(
        { _id: new ObjectID(userId), 'cart.productId': new ObjectID(productId) },
        { $set: { "cart.$.amount": productAmount } },
      ).then(res => {
        if(res.matchedCount === 0) db.collection('users').updateOne(
          { _id: new ObjectID(userId) },
          { $push: {
            cart: {
              productId: new ObjectID(productId),
              amount: productAmount
            }
          }},
          (err, resl) => this.get(userId, cb)
        )
        else this.get(userId, cb)
      })
    },
    remove(userId, productId, cb) {
      db.collection('users').updateOne(
        { _id: new ObjectID(userId) },
        { $pull: { cart: {productId: new ObjectID(productId) } } }
      ).then(res => {
        this.get(userId, cb)
      })
    }
  },
})