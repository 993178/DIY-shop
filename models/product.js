var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({                       // de bouwtekeningen die definiëren hoe de data eruit moet zien
    imagePath: {type: String, required: true},
    title: {type: String, required: true},
    description: {type: String, required: true},
    price: {type: Number, required: true}
});

module.exports = mongoose.model('Product', schema); // we exporteren een model 'Product' dat gebaseerd is op dat schema