// ROUTES/USER.JS
//var cookieParser = require('cookie-parser'); //poging

var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var passport = require('passport');
var Order = require('../models/order');
var Cart = require('../models/cart');
var Product = require('../models/product');
var mongoose = require('mongoose');   // maar dit is dan de niet-de-bedoeling-seedermethode?
mongoose.connect('mongodb://localhost:27017/shopping',  { useNewUrlParser: true });   // seedermethode?

csrfProtection = csrf({ cookie: true });    // poging; () was leeg
//var parseForm = express.urlencoded({ extended: false }) //poging
router.use(csrfProtection);

router.get('/profile', isLoggedIn, function(req, res, next) {     // isLoggedIn beschermt deze route; je kunt alleen op /profile komen als je bent ingelogd, zie de functie beneden
  Order.find({user: req.user}, function(err, orders) {            // find: the mongoose way of quering the database, en we zoeken orders met dezelfde user als deze ingelogde user in de req (van passport), waarbij mongoose snugger genoeg is om te beseffen dat ie req.user.id moet hebben
    if (err) {
      return res.write('Er schijnen nog geen bestellingen te zijn');    // Discount Jonas schrijft 'Error!', maar dat lijkt me wat voorbarig als je net een account hebt aangemaakt of hebt ingelogd en je profiel wilt bekijken...
    }
    var cart;       // we gaan weer een nieuwe Cart maken, maar dan voor iedere order apart, en daarna willen we van zo'n order de Cartmethode generateArray kunnen gebruiken om de producten weer net zo weer te geven als in de winkelkar
    orders.forEach(function(order) {
      cart = new Cart(order.cart);    // want cart is ook een van de keys in het Order-object
      order.items = cart.generateArray();   // nieuw veld 'items', met dus de array van items
    });
    res.render('user/profile', { orders: orders });   // render de orders! Wacht - wat als ik de nieuwste order bovenaan wil hebben?
  });
});

router.get('/producterbij', isLoggedIn, function(req, res, next) { 
  res.render('user/producterbij', {csrfToken: req.csrfToken()});
});

router.post('/producterbij', function(req, res, next) {
  var cat = req.body.categorie;
  cat = cat.toLowerCase();      // geen verschil tussen tuinartikelen, Tuinartikelen en tUInarTiKElen. Gelijke tuinartikelen, gelijke kappen.

  var prs = parseFloat(req.body.prijs) / 100;
  console.log(prs);
  var prsOud = parseFloat(req.body.prijsOud) / 100;
  console.log(prsOud);


  var product = new Product({
    categorie: cat,
    imagePath: req.body.plaatje,
    titel: req.body.titel,
    prijs: prs,
    prijsOud: prsOud,
    productDetails: req.body.productDetails
  });

  console.log(product);

  product.save(function (err, ding) {
    if (err) {
      //flashfailure?
      console.log('hier gaat iets mis');
      return res.redirect('/user/producterbij');
    }
    
    console.log(ding.titel + " opgeslagen.");
    req.flash('erbij', 'Product toegevoegd!');
    res.redirect('/geheim');
  });
});

router.get('/producteraf/:id', isLoggedIn, function(req, res, next) {
  console.log('we gaan iets verwijderen...');

  Product.findOneAndDelete({ _id: req.params.id }, function(err) {
    if (err) {
        console.log('het is niet gelukt');      // flash..!
        res.redirect('/:id');
    } else {
        console.log('jaaa, weg met die shit moehahahaha');    // ook flash
        res.redirect('/producten');
    }
  });
});


// > veranderen in functie om bestaande categorieën wel/niet weer te geven (radiobuttons?)
// router.get('/categorieerbij', isLoggedIn, function(req, res, next) { 
//   res.render('user/categorieerbij', {csrfToken: req.csrfToken()});
// });

// router.post('/categorieerbij', function(req, res, next) {
//   var nieuweCategorie = req.body.categorie;
//   var markup = '<li class="nav-item"><a class="nav-link" href="/producten/{{nieuweCategorie}}"><h4>{{nieuweCategorie}}</h4></a></li>';
//   //document.getElementById('sidebar-categorylist').insertAdjacentHTML('beforeend', markup);    // okee dat werkt dus niet zo
// });

router.get('/logout', isLoggedIn, function(req, res, next) { 
  req.logout();
  res.redirect('/');
});

router.use('/', notLoggedIn, function(req, res, next) {     // eerst de enige routes waarbij je wél ingelogd moet zijn (/profile, /logout), daarna dit dingetje dat je naar de homepage stuurt als je ingelogd bent en naar signup of signin probeert te gaan
  next();
});

//   moet er uiteindelijk uit
router.get('/signup', function(req, res, next) {
  var messages = req.flash('error');    // de boodschap over wachtwoord al in gebruik komt binnen onder de vlag 'error', hier wordt ie 'messages'
  res.render('user/signup', {csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0});  // hasErrors omdat we in die {{ quasi-script }} in de hbs beperkte logicamogelijkheden hebben
});
  
router.post('/signup', passport.authenticate('local.signup', {   // bij aanmaak nieuwe user
  // succesRedirect: '/user/profile',
  failureRedirect: '/user/signup',                                    // bij falen blijft ie bij sign up
  failureFlash: true                                                  // en ziet dan die boodschap dat zijn mailadres al in gebruik is
}), function(req, res, next) {
  if (req.session.oldUrl) {              
    var oldUrl = res.session.oldUrl;
    res.session.oldUrl = null;            // waarbij oldUrl dus niet ook meteen op null komt te staan... Deze regel moest boven de volgende omdat... iets met toegang tot session
    res.redirect(oldUrl);                 // (zie volgende POST voor commentaar)
  } else {
    res.redirect('/shopping-cart');                    // bij succes ziet de bezoeker van Discount Jonas' website zijn profiel (? lijkt me stom)
  }
});
//   /moet er uiteindelijk uit

router.get('/signin', function(req, res, next) {
  var messages = req.flash('error');    // kopie signup
  res.render('user/signin', {csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0});
});
  
router.post('/signin', passport.authenticate('local.signin', {
  failureRedirect: '/user/signin',        // bij falen
  failureFlash: true
  }), function(req, res, next) {
  if (req.session.oldUrl) {               // bij het doorverwijzen naar signin vanuit de checkoutpagina, hebben we de checkout opgeslagen als oldUrl
    var oldUrl = res.session.oldUrl;      // inhoud r s oldUrl wordt even geparkeerd
    res.session.oldUrl = null;            // session-oldUrl wordt weer gereset
    res.redirect(oldUrl);                 // bij succesvol inloggen word je nu teruggevoerd naar waar je was: checkout. Zou eigenlijk altijd moeten gebeuren na signin, vind ik, terug naar waar je was...
  } else {
    res.redirect('/geheim');              // Discount Jonas stuurt zijn vers ingelogde bezoekers liever naar hun profiel - alsof je meteen je profielnaam wilt veranderen ofzo tijdens het shoppen
  }
});

module.exports = router;

function isLoggedIn(req, res, next) {     // als je niet bent ingelogd ga je maar lekker naar de homepage
  // if (req.isAuthenticated()) {
  //     return next();
  // }
  // res.redirect('/');
  console.log('ik ben superveilig joh');
  next();
};

function notLoggedIn(req, res, next) {     // als je niet bent ingelogd ga je maar lekker naar de homepage
  // if (!req.isAuthenticated()) {
  //     return next();
  // }
  // res.redirect('/');
  console.log('ow gossie ik ben niet ingelogd');
  next();
};