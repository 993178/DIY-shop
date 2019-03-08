var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({                       // de bouwtekeningen die definiëren hoe de data eruit moet zien
    category: { type: String, required: true },
    imagePath: {type: String, required: true},
    title: {type: String, required: true},
    description: {type: String, required: true},
    price: {type: Number, required: true},
    productDetails: [{ key: String, value: String }]
});

module.exports = mongoose.model('Product', schema); // we exporteren een model 'Product' dat gebaseerd is op dat schema



