const ObjectId = require('mongodb').ObjectID
const slugify = require('transliteration').slugify

module.exports = db => ({
  category: {
    map(callback) {
      db.collection('products_category').aggregate([{$lookup:{
        from:'products_category_subcategory',
        localField: '_id',
        foreignField: 'parent',
        as: 'subcategories'
      }}]).toArray((err, res) => callback(err, res))
    },
    createCategory(title, cb) {
      const path = slugify(title)
      db.collection('products_category')
      .insertOne({title:title.trim().toLowerCase(),path}, cb)
    },
    createSubcategory(title, parent, cb) {
      const path = slugify(title)
      db.collection('products_category_subcategory')
      .insertOne({title:title.trim().toLowerCase(), parent: new ObjectId(parent), path}, cb)
    }
  },
  param: {
    create(prm, cb) {
      let _prm = { ...prm }
      _prm.title = _prm.title.trim().toLowerCase()
      if(!prm.forSubcategory) delete _prm.forSubcategory
      else _prm.forSubcategory = new ObjectId(_prm.forSubcategory)
      if(!_prm.field) delete _prm.field
      else _prm.field = _prm.field.toString().trim().toLowerCase()
      db.collection('products_params').insertOne(_prm, cb)
    },
    map(cb) {
      db.collection('products_category_subcategory').aggregate([{$lookup:{
        from:'products_params',
        localField:'_id',
        foreignField:'forSubcategory',
        as:'params'
      }}]).toArray((err, paramsLocal) => {
        db.collection('products_params').find({type:'global'}).toArray((errr, paramsGlobal) => {
          cb({ local: paramsLocal, global: paramsGlobal })
        })
      })
    }
  },
  accounting: {
    setProductAmount(id, value, cb) {
      db.collection('products').updateOne({"_id":new ObjectId(id)},{$set:{"accounting.inStock":value}})
      cb()
    }
  },
  comments: {
    create(id, data, cb) {
      let ndata = {...data}
      ndata.date = Date.now()
      ndata._id = new ObjectId()
      db.collection('products').updateOne({"_id":new ObjectId(id)},{$push:{"comments":ndata}}, (err, res) => {
        cb()
      })
    },
    remove(id, cid, cb) {
      db.collection('products').updateOne({"_id":new ObjectId(id)},{$pull:{"comments":{_id:new ObjectId(cid)}}}, (err, res) => {
        cb()
      })
    }
  },
  create(prd, cb) {
    let _prd = {...prd}
    _prd.title = _prd.title.toString().trim()
    _prd.fromSubcategory = new ObjectId(_prd.fromSubcategory)
    _prd.accounting = { inStock:0 }
    _prd.comments = []
    _prd.params = _prd.params.map(e => ({
      paramId: new ObjectId(e.paramId),
      value: e.value.toString().trim().toLowerCase()
    }))
    db.collection('products').insertOne(_prd, cb)
  },
  get(id, cb) {
    db.collection('products').findOne({ _id: new ObjectId(id) }).then(el => {
      this._mapLiteralParams([el], nel => { cb(nel[0]) })
    })
  },
  findAll(config, cb) {
    db.collection('products')
    .aggregate([
      {$match:{fromSubcategory:new ObjectId(config.subcategory)}},
    ])
    .toArray((err, res) => this._mapLiteralParams(res, cb))
  },
  findAvailable(config, cb) {
    let searchConfig = { 'accounting.inStock':{ $gt: 0 } }
    if(config.subcategory) searchConfig.fromSubcategory = new ObjectId(config.subcategory)
    //if(config.query) searchConfig.$or = [{title:`/${config.query}/`}]
    if(config.query) searchConfig.title = {'$regex':`${config.query}`,$options: 'i'}
    console.log(searchConfig)
    db.collection('products').find(searchConfig).toArray((err, res) => this._mapLiteralParams(res, cb))
  },
  _mapLiteralParams(products, cb) {
    db.collection('products_params').find({type:'global'}).toArray((err, res) => {
      cb(products.map(prd => {
        prd.literals = {}
        res.forEach(e => prd.literals[e.field] = prd.params.find(x => x.paramId.toString() === e._id.toString()).value)
        return prd
      }))
    })
  },
  getLiteralWrapper(cb) {
    db.collection('products_params').find({type:'global'}).toArray((err, res) => {
      const wrap = prd => {
        prd.literals = {}
        res.forEach(e => prd.literals[e.field] = prd.params.find(x => x.paramId.toString() === e._id.toString()).value)
        return prd
      }
      cb(wrap)
    })
  }
})