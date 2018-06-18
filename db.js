module.exports = class DataBase {
  constructor(config) {
    const db = config.client.db(config.name)
    this.models = {
      user: require('./models/user')(db),
      product: require('./models/product')(db),
      shop: require('./models/shop')(db),
    }
  }
}