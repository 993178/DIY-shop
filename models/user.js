var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var userSchema = new Schema({
    email: {type: String, required: true},
    password: {type: String, required: true},
});

userSchema.methods.encryptPassword = function(password) {           // wachtwoord versleutelen, dus we gooien password erin
    return bcrypt.hashSync(password, bcrypt.genSaltSync(5), null);  // en doen er iets synchroons en zouts mee, mbv bcrypt. Okee dan
};

userSchema.methods.validPassword = function(password) {     // check of wachtwoord klopt
    return bcrypt.compareSync(password, this.password);     // bcrypt vergelijkt nieuw ingetikte wachtwoord met versleuteld exemplaar uit de database (this)
}

module.exports = mongoose.model('User', userSchema);