var express = require('express');
var router = express.Router();
var Product = require('../models/product');   // productmodel binnenhalen (het schema, niet dat seedergedoe)   
var Cart = require('../models/cart');
var Order = require('../models/order');

/* GET home page. */
router.get('/', function(req, res, next) {
  var successMsg = req.flash('success')[0]; // als er net iets is gekocht, willen we de boodschap hier weergeven; de eerste en enige successboodschap die flash standaard in een array stopt
  Product.find(function(error, docs) {    // Product.find() zoekt alles wat er aan producten te vinden valt, => docs in de callback
    var productChunks = [];   // ivm de rows in index.hbs willen we de producten in trio's opdelen, dus arrays van 3 stuks in deze array
    var chunkSize = 3;
    for (var i = 0; i < docs.length; i+= chunkSize) {   // met iedere loop gaan we 3 omhoog: eerst 0, dan 3, dan 6 etc
      productChunks.push(docs.slice(i, i + chunkSize)); // in iedere loop snijden we een brok van 3 stuks uit de docs-array, beginnend bij i, eindigend vóór i + 3, en pushen dat brok in de productChunks-array
    }
    res.render('shop/index', { title: 'Shopping cart', products: productChunks, successMsg: successMsg, noMessage: !successMsg });  // renderfunctie met te renderen dingen, aangevuld met de products die hier docs heten. Deze moet in de Products.find, anders gebeurt het renderen (synchronous) voordat find (asynchronous) klaar is
  });
});

router.get('/add-to-cart/:id', function(req, res, next) {   // Discount Jonas: next kun je altijd weglaten als je die niet gebruikt, hij zet hem neer want conventie
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : { items: {}});  // nieuw karretje maken en daar oud karretje ingooien als argument - ALS die bestaat, anders een leeg object. Je kunt hier ook een mal van maken: {items: {}, totalQty: 0, totalPrice: 0} ipv de pipe operators in cart.js die Discount Jonas prefereert
  Product.findById(productId, function(err, product) {
    if (err) {
      return res.redirect('/');   // nogal summier - er gaat iets fout en je wordt teruggestuurd naar de homepage...
    }
    cart.add(product, product.id);
    req.session.cart = cart;    // wordt ook automatisch opgeslagen
    res.redirect('/');          // dus als het goed gaat, wordt je óók teruggestuurd naar de homepage...!! Lekker gebruikersvriendelijk
  });
});

router.get('/increase/:id', function(req, res, next) {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : { items: {}});  // nieuw karretje maken en daar oud karretje ingooien als argument - ALS die bestaat, anders een leeg object. Je kunt hier ook een mal van maken: {items: {}, totalQty: 0, totalPrice: 0} ipv de pipe operators in cart.js die Discount Jonas prefereert

  cart.increaseByOne(productId);
  req.session.cart = cart;
  res.redirect('/shopping-cart');
});

router.get('/reduce/:id', function(req, res, next) {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : { items: {}});  // nieuw karretje maken en daar oud karretje ingooien als argument - ALS die bestaat, anders een leeg object. Je kunt hier ook een mal van maken: {items: {}, totalQty: 0, totalPrice: 0} ipv de pipe operators in cart.js die Discount Jonas prefereert

  cart.reduceByOne(productId);
  req.session.cart = cart;
  res.redirect('/shopping-cart');
});

router.get('/remove/:id', function(req, res, next) {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : { items: {}});  // nieuw karretje maken en daar oud karretje ingooien als argument - ALS die bestaat, anders een leeg object. Je kunt hier ook een mal van maken: {items: {}, totalQty: 0, totalPrice: 0} ipv de pipe operators in cart.js die Discount Jonas prefereert

  cart.removeItem(productId);
  req.session.cart = cart;
  res.redirect('/shopping-cart');
});

router.get('/shopping-cart', function(req, res, next) {
  if (!req.session.cart) {
    return res.render('shop/shopping-cart', {products: null});
  }
  var cart = new Cart(req.session.cart);
  res.render('shop/shopping-cart', {products: cart.generateArray(), totalPrice: cart.totalPrice});
});

router.get('/checkout', function(req, res, next) {    // komt vanaf shopping-cart.hbs
  if (!req.session.cart) {
    return res.redirect('/shopping-cart');
  }
  var cart = new Cart(req.session.cart);
  var errMsg = req.flash('error')[0];   // eerste (want enige) element in error-array die flash maakt hieronder in regel 69
  res.render('shop/checkout', {total: cart.totalPrice, errMsg: errMsg, noError: !errMsg});    // we geven errMsg door en checken in noError of ie falsy is, zo ja, dan is noError truthy en geeft checkout.hbs het error-element niet weer...
});

//deze functie zit nu nog gekoppeld aan /checkout, maar ik heb de betaalmodule zelf op een andere pagina gezet. Wat moet hier blijven en wat moet naar een POST-methode /dokken?
router.post('/checkout', function(req, res, next) {   // isLoggedIn > dat je dus ingelogd moet zijn, zie de uit user.js gekopieerde functie onderaan
  if (!req.session.cart) {
    return res.redirect('/shopping-cart');    // als je geen cart hebt, optiefen
  }
  var cart = new Cart(req.session.cart);      // weer cart recreëren (kun je dat woord nog letterlijk gebruiken?)

  // van de Stripe-site! 2019-proof! Woehoe
  var stripe = require("stripe")("sk_test_pQPtnc49JtVufrg3N1lkccT5");   // I heard there was a secret key that David played and it pleased uhm, me       de geheime key dus - voor het echie heb je een andere (zie Stripe-account)

  stripe.charges.create({
    amount: cart.totalPrice * 100,     // in centen!
    currency: "eur",
    source: req.body.stripeToken, // obtained with Stripe.js  // komt overeen met de naam van het toegevoegde tokenveld in checkout.js
    description: "test charge"
  }, function(err, charge) {
    // asynchronously called (rest van de functie is weer van Discount Jonas)
    if (err) {
      req.flash('error', err.message);
      return res.redirect('/checkout');
    }
    var order = new Order({
      user: req.user,     // passport slaat user op in request... En: dit kan alleen maar omdat we straks gebruikers gaan dwingen om in te loggen voor ze iets kopen...! 
      cart: cart,
      address: req.body.address, // en om hier de adresinfo vandaan te halen, moet er een name-veld zijn in het html-element address in checkout.hbs :-S          req.body is waar Express values opslaat die via een postreq zijn verstuurd...
      name: req.body.name,
      paymentId: charge.id // komt uit het object charge in de callback. Hier rechts (https://stripe.com/docs/api/charges/create) staat ook een voorbeeld van de response met dus dat id-veld erin
    });
    order.save(function(err, result) {          // err wordt niet gehandled!
      req.flash('success', 'Koop gesloten!')    // Wordt op /-pagina weergegeven! zie regel 8
      req.session.cart = null;    // kar leeggooien - ik neem aan dat die ||-operators dit opvatten als 'pak optie 2'
      res.redirect('/');  
    });
  });
});

router.get('/geheim', function(req, res, next) {
  res.render('shop/geheim');
})

router.get('/dokken', function(req, res, next) {
  res.render('shop/dokken');
})

module.exports = router;

// function isLoggedIn(req, res, next) {     // als je niet bent ingelogd ga je maar lekker naar - niet meer de homepage maar de sign in page
//   if (req.isAuthenticated()) {
//       return next();
//   }
//   req.session.oldUrl = req.url;     // dus we slaan op als OldUrl in de sessie, waar we eerst waren (/checkout)
//   res.redirect('/user/signin');
// };

// wordt die oldUrl nou nog ergens hier gebruikt??  > nee, in user.js




/*

Gedaan: 

nieuwe github repository aanmaken
klonen in aparte map voor het daadwerkelijke project
alles uit huidige map erin flikkeren
checken of alles het nog doet, ook mongo enzo    denk het wel
signupfunctie verwijderen (althans uitgecomment - ze moeten nog wel zélf een beheerdersaccount aanmaken...!!)
links naar sign up, sign in, gebruikerspagina en uitloggen verwijderen van homepagina
checkout niet meer terugsturen naar signin als klant niet ingelogd is
in winkelwagentje mogelijkheid toevoegen meer te kopen van een product
in checkout formulier toevoegen voor naam en adres enzo
adresgegevens toevoegen in Order.js
op beheerpaginaview 'product toevoegen' neergezet en een dropdown toegevoegd voor het kiezen van een categorie product om toe te voegen...
checkout houden als plek om adresgegevens in te vullen, maar iDeal op aparte volgende pagina doen (is vooral belangrijk als we de verzendkosten weten te regelen)
view en router.get maken voor nieuwe beheerderspagina (...waarvan de /naam geheim moet blijven... dus dan moet ik hem niet op github zetten... voorlopig maar /geheim)
op /geheim uitlogfunctie ook weer voorwaardelijk tonen
inlog- en uitlogfunctie en profiel verplaatsen van navbar naar /geheim   > ja, maar link werkt niet
kijken wat er nou mis is met die links, want ik kan vanaf /geheim niet meer op profiel en andere pagina's komen en da's niet handig
checken of alles nog steeds werkt als ik de beveiliging weer aan zet (dummyversie isLoggedIn)  > ja, met next(); erin
formulier gemaakt voor ijzerwaren view
model gemaakt voor ijzerwaren
postmethode gemaakt voor ijzerwaren, met new IJzerwaar enzo 

Gepoogd: 

formulier gemaakt voor ijzerwaren view, model gemaakt voor ijzerwaren, postmethode gemaakt voor ijzerwaren 
    > loopt vast op ontbrekend csrf token???! Why
    okee, csrf-token toegevoegd bij formulier??? Lijkt me niet juist. Error weg, nu eeuwig laden

Doen:


//PRODUCTEN BEHEREN
iets in mongo database zetten via formulier
iets uit mongo database verwijderen

producten in categorieën onderbrengen... 
huidige categorieën: beveiliging, zonwering, gereedschappen, ijzerwaren, tuinartikelen, sierbeslag  (slijpservice en sleutels lijken me niet langer van toepassing...)
routes maken voor al die categorieën (nou ja de relevante dan). Ook een overige?
hoe krijg je mongo zover dat ie dingen in categorieën bewaart? Of moet ik de categorie als eigenschap aan het product toevoegen en dan de categoriepagina met een find(categorie-eigenschap) doen ofzo?? 
   Of maak ik aparte Schema's voor al die categorieën? Dat is achter de schermen misschien wel het handigst...! Dat ze bij het toevoegen van een nieuw product meteen al moeten zeggen wat het wordt, met aangepaste velden voor dat product
formulier voor toevoegen van product...
> naam product, categorie (iets met dropdown en beperkte keuzes), grootte, beschrijving, prijs, aantal per verpakking/doosje/etc, foto, aantal producten in voorraad (moet dat nog semi-automatisch omlaag gaan bij een aankoop?)
mogelijkheid product te verwijderen...


checken of alles nog steeds werkt als ik echt de beveiliging weer aan zet (echte versie isLoggedIn met isAuthenticated)

//BESTELLINGEN

checkout-POST controleren en kijken hoe en of die nog aansluit op wat er nu in de views gebeurt
nadenken over hoe afhandelen bestelling moet verlopen... 
 > denk dat een e-mail naar R&C het handigst is voor ze, iets met 'er is op [datum, tijd] een/meerdere [naam producten] besteld, neem contact op via [mailadres of telefoonnummer]'
mezelf een automatisch mail weten te sturen met de adresgegevens van de klant en zijn bestelling zou al heel wat zijn

-moeten gebruikers via de website kunnen betalen en hun adresgegevens achterlaten, zodat Ria en Coen het dan standaard opsturen?
      > bij opsturen krijg je met verzendkosten te maken, hoe doen we dat? Die verschillen per grootte/gewicht van het pakje, en zijn bij meerdere items weer minder dan simpelweg de som der delen
-doen we het meer zoals Marktplaats, dat de koper een berichtje stuurt met achterlating van mailadres of telefoonnummer dat ie iets wil kopen en Ria en Coen dan contact opnemen (mailen, bellen?) over hoe en wat?

afmaken Stripe-functie voor iDeal?
bestellingsformulier verbeteren? > adres met aparte straat, huisnummer, toevoeging, plaatsnaam en postcode, mailadres of telefoonnummer, of de optie om het op te halen (dat Ria en Coen contact opnemen om het adres door te geven?)


//UITERLIJK
zoekfunctie terugbrengen in navbar (bootstrap? hoe werkt zo'n ding)?
verzinnen hoe website eruit moet zien - voortbouwen op bestaand ontwerpje of ... ?
bootstrap eruitwerken, onderbrengen in eigen css-bestand
foto maken van assortimentskast (achtergrond), frontaanzicht laatje, zijaanzicht laatje


Kleuren Coendoen:

 #260085 #208 midnightblue hsl(257,100,26) rgb(38,0,133)

 #de0000 #e00 red hsl(0,100,43) rgb(222,0,0)

 #5254a4 #55a darkslateblue hsl(238,33,48) rgb(82,84,164)

 #feab00 #fb0 orange hsl(40,100,49) rgb(254,171,0)




*/