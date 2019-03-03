var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    imagePath: {type: String, required: false},
    soort: {type: String, required: true},
    beschrijving: {type: String, required: true},
    grootte: {type: String, required: true},
    materiaal: {type: String, required: false},
    aantal: {type: String, required: true},
    prijs: {type: Number, required: true}
});

module.exports = mongoose.model('IJzerwaar', schema);