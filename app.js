var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var expressHbs = require('express-handlebars'); // vanwege toegevoegd pakket...
var mongoose = require('mongoose');   // iets met de server
var session = require('express-session');
var passport = require('passport');   // voor encryptie
var flash = require('connect-flash');  // om boodschappen via de view te kunnen doorgeven
var validator = require('express-validator');
var MongoStore = require('connect-mongo')(session); // voor het winkelwagentje. Na session importeren, want dat is een argument! Is ipv default 'memoryStore' dat alleen voor development bedoeld is

var indexRouter = require('./routes/index');  // bij Discount Jonas heet dit routes
var userRouter = require('./routes/user');    // bij Discount Jonas heet dit UserRoutes


var app = express();
mongoose.connect('mongodb://localhost:27017/shopping', { useNewUrlParser: true });
require('./config/passport');   // pas hierlangs komt index.js te weten dat er een passport.js bestaat met de benodigde info, deze require is in plaats van al die code in dat bestand

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', expressHbs({defaultLayout: 'layout', extname: '.hbs'}));
//app.set('view engine', 'hbs');
app.set('view engine', '.hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(validator());   // altijd na bodyparser... die we niet hebben... maar die twee regels hierboven met express zijn verder exact hetzelfde als zijn bodyparserregels. Iets met data (uit de UI?) die moeten worden omgezet tot iets waar de validator iets mee kan
app.use(cookieParser());
app.use(session({
  secret: 'mysupersecret', 
  resave: false, 
  saveUninitialized: false, 
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
  cookie: { maxAge: 180 * 60 * 1000 }   // hoe lang sessie mag duren, in min * sec * milliseconden. 3 uur voor een webshop?? IK zou me dood ergeren
})); // DiscountJonas zet die middelste twee op false omdat anders de sessie automatisch op de server wordt opgeslagen, ook als er niks veranderd is. Store is om de mongooseverbinding ook hiervoor te gebruiken en niet apart een tweede verbinding te maken (want dat is stom)
app.use(flash());   // altijd ná session
app.use(passport.initialize());
app.use(passport.session());  // ook na session     docs op passportjs.org (althans toen) met een hele zoot strategies; we gebruiken passport-local, maar je kunt dit dus ook gebruiken om mensen via Facebook of Twitter of wat dan ook te laten inloggen
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {            // login status available in all views
  res.locals.login = req.isAuthenticated();
  res.locals.session = req.session;           // sessie beschikbaar in alle views, zonder hem expliciet te moeten rondporteren via routebestanden
  next();
})

app.use('/user', userRouter);   // eerst de /user afvangen, want dit begint ook met /, net als die hieronder! Specifiek voor algemeen.
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
