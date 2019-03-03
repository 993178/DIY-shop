var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    // user: {type: Schema.Types.ObjectId, ref: 'User'},    // verwijst naar de User die we in dat model hebben gemaakt
    cart: {type: Object, required: true},           // is dus Cart
    straat: {type: String, required: true},
    huisnummer: {type: String, required: true},
    toevoeging: {type: String, required: false},
    postcode: {type: String, required: true},
    plaatsnaam: {type: String, required: true},
    name: {type: String, required: true},           // hebben we een veld voor
    // paymentId: {type: String, required: true}       // willen we dit?   elke betaling heeft een ID in Stripe (dus... hoe komt die info hier?)
});

module.exports = mongoose.model('Order', schema);