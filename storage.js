const multer = require('multer')

//youtube.com/watch?v=srPXMt1Q0nY
module.exports = {
  products: multer({storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/products')
    },
    //filename: function (req, file, cb) {cb(null, file.filename)}
  })})
}