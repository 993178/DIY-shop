var passport = require('passport'); // met de opmerking dat de configuratie in app.js ook in andere files beschikbaar is, dus het zijn geen twee verschillende alleen omdat passport in twee files wordt geïmporteerd
var User = require('../models/user');
var LocalStrategy = require('passport-local').Strategy;

passport.serializeUser(function(user, done) {       // done is een functie...
    done(null, user.id);        // 'gebruik user.id om de gebruiker in de sessie op te slaan'...    Null is zijn error eigenlijk
})

passport.deserializeUser(function(id, done) {       // dus... dit is dan om de user op te halen uit de sessie (sessiedatabase?)
    User.findById(id, function(err, user) {     // we zoeken de user adhv zijn id, weer een callback die error of resultaat oplevert
        done(err, user);                        // en ook dat is dan done... Right.
    });
});

passport.use('local.signup', new LocalStrategy({    // dus dit is om een nieuwe user aan te maken, met naam en nieuw passport-local instance, met configuratie in een object en weer een callback
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true         // zodat deze info ook in de hier volgende callback beschikbaar is
}, 
function(req, email, password, done) {
    req.checkBody('email', 'Invalid email').notEmpty().isEmail();   // Validator checkt of mailadres niet leeg is en of het een mailadres is
    req.checkBody('password', 'Invalid password').notEmpty().isLength({min:4});     // is wachtwoord niet leeg en is het minimaal 4 tekens
    var errors = req.validationErrors();    // goh, is er nog wat uit al die tests gekomen eigenlijk
    if (errors) {
        var messages = [];
        errors.forEach(function(error) {            // gooi message-properties van eventuele errors in variabele messages
            messages.push(error.msg);
        });
        return done(null, false, req.flash('error', messages)); // laat weten dat er wat aan de hand is en toon messages
    }

    User.findOne({'email': email}, function(err, user) {    // we willen een nieuwe gebruiker aanmaken en checken eerst of we de user (mailadres) in de database kunnen vinden
        if (err) {
            return done(err);       // als we die user niet kunnen vinden (jee)
        }
        if (user) {     // huh waarom niet else if
            return done(null, false, {message: 'E-mailadres is al in gebruik'});    // als we hem wél vinden (shit). Null, want geen error, false, want niet succesvol, die boodschap (opgeslagen als error) moet dat flash dan overbrengen, met dus de reden waarom het niet succesvol was
        }
        var newUser = new User();
        newUser.email = email;          // dus email fungeert als gebruikersnaam
        newUser.password = newUser.encryptPassword(password);   // versleutel het wachtwoord
        newUser.save(function(err, result) {                    // sla op in database
            if (err) {
                return done(err);                               // tenzij er iets misgaat
            }
            return done(null, newUser);
        })
    })
})); 

passport.use('local.signin', new LocalStrategy({        // bijna dit hele ding is hetzelfde als de signup hierboven... Full Price Jonas zou hier aparte functies van maken en die twee keer callen
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, 
function(req, email, password, done) {
    req.checkBody('email', 'Invalid email').notEmpty().isEmail();
    req.checkBody('password', 'Invalid password').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        var messages = [];
        errors.forEach(function(error) {
            messages.push(error.msg);
        });
        return done(null, false, req.flash('error', messages));
    }
    User.findOne({'email': email}, function(err, user) {
        if (err) {
            return done(err);
        }
        if (!user) {                                                                       // <-- verschillen! :-O
            return done(null, false, {message: 'Gebruiker niet gevonden'});
        }
        if (!user.validPassword(password)) {
            return done(null, false, {message: 'Dat is niet het wachtwoord dat wij hier hebben...'});
        }
        return done(null, user);
    });
}));