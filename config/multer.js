var multer = require('multer')

var storage = multer.memoryStorage();

var multerUploads = multer({ storage }).single('image')

module.exports = { multerUploads }