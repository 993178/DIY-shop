var express = require('express');
var router = express.Router();
var Product = require('../models/product');   // productmodel binnenhalen (het schema, niet dat seedergedoe)   
var Cart = require('../models/cart');
var Order = require('../models/order');
var categories

function updateCategoriesForSideBar(){
  Product.find().distinct('categorie', function(err, cats) {
    categories = cats
  });
}

// user

updateCategoriesForSideBar()

// GET home page
router.get('/', function(req, res, next) {
  var successMsg = req.flash('success')[0]; // als er net iets is gekocht, willen we de boodschap hier weergeven; de eerste en enige successboodschap die flash standaard in een array stopt
  res.render('shop/index', { title: 'Coen Doen Doe-het-zelf Outlet', successMsg: successMsg, noMessage: !successMsg, categories: categories });  // renderfunctie met te renderen dingen, aangevuld met de products die hier docs heten. Deze moet in de Products.find, anders gebeurt het renderen (synchronous) voordat find (asynchronous) klaar is
});


router.get('/producten', function(req, res, next) {
  Product.find(function(error, docs) {    // Product.find() zoekt alles wat er aan producten te vinden valt, => docs in de callback
    var productChunks = [];   // ivm de rows in index.hbs willen we de producten in trio's opdelen, dus arrays van 3 stuks in deze array
    var chunkSize = 3;
    for (var i = 0; i < docs.length; i+= chunkSize) {   // met iedere loop gaan we 3 omhoog: eerst 0, dan 3, dan 6 etc
      productChunks.push(docs.slice(i, i + chunkSize)); // in iedere loop snijden we een brok van 3 stuks uit de docs-array, beginnend bij i, eindigend vóór i + 3, en pushen dat brok in de productChunks-array
    }
    res.render('shop/producten', { title: 'Shopping cart', products: productChunks, categories: categories});  // renderfunctie met te renderen dingen, products is de term in de view, die hier wordt gelijkgesteld met die chunks. Deze moet in de Products.find, anders gebeurt het renderen (synchronous) voordat find (asynchronous) klaar is
  });
});

router.get('/producten/:categorie', function(req, res, next) {
  req.session.oldUrl = req.url;
  var categorie = req.params.categorie

  Product.find({ categorie }, function(error, catProducts) {
    var productChunks = [];
    var chunkSize = 3;
    for (var i = 0; i < catProducts.length; i+= chunkSize) {
      productChunks.push(catProducts.slice(i, i + chunkSize));
    }
    res.render('shop/producten', { products: productChunks});
  });
});

// SHOPPING CART
router.get('/add-to-cart/:id', function(req, res, next) {   // Discount Jonas: next kun je altijd weglaten als je die niet gebruikt, hij zet hem neer want conventie
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : { items: {}});  // nieuw karretje maken en daar oud karretje ingooien als argument - ALS die bestaat, anders een leeg object. Je kunt hier ook een mal van maken: {items: {}, totalQty: 0, totalPrice: 0} ipv de pipe operators in cart.js die Discount Jonas prefereert
  Product.findById(productId, function(err, product) {
    if (err) {
      return res.redirect('/');   // nogal summier - er gaat iets fout en je wordt teruggestuurd naar de homepage...
    }
    cart.add(product, product.id);
    req.session.cart = cart;    // wordt ook automatisch opgeslagen

    if (req.session.oldUrl) {
      console.log('er is een oldUrl, joechei');       
      var oldUrl = req.session.oldUrl;
      req.session.oldUrl = null;
      res.redirect(oldUrl);
    } else {
      console.log('er is geen oldUrl, waar heb je het over wtf');
      res.redirect('/producten');
    }
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



// CHECKOUT
router.get('/checkout', function(req, res, next) {    // komt vanaf shopping-cart.hbs
  if (!req.session.cart) {
    return res.redirect('/shopping-cart');
  }
  var cart = new Cart(req.session.cart);
  var errMsg = req.flash('error')[0];   // eerste (want enige) element in error-array die flash maakt hieronder in regel 126
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
    var order = new Order({   // tzt req console.loggen om te zien waar ik user dan wel kan vinden - ook in body?
      naam: req.body.naam,     // wel zorgen dat er een veld is voor naam bij het checkoutproces, net als voor adres! 
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

router.get('/dokken', function(req, res, next) {
  res.render('shop/dokken');
});



// BEHEER
router.get('/geheim', function(req, res, next) {
  var gelukt = req.flash('erbij')[0];
  res.render('shop/geheim', { gelukt: gelukt, noDice: !gelukt });
});

router.get('/:id', function(req, res, next) {   // moet onderaan want meest algemene link
  // req.session.oldUrl = req.url;
  var productId = req.params.id;
  Product.findById(productId, function(err, product) {
    // if (err) {
    //   //flash iets
    //   return res.redirect('/');
    // }
    res.render('shop/product', {product});
  });
});


module.exports = router;

function isLoggedIn(req, res, next) {     // als je niet bent ingelogd ga je maar lekker naar - niet meer de homepage maar de sign in page
  console.log('ja hoor, we zijn ingelogd');
//   if (req.isAuthenticated()) {
//       return next();
//   }
//   req.session.oldUrl = req.url;     // dus we slaan op als OldUrl in de sessie, waar we eerst waren (/checkout)
//   res.redirect('/geheim/signin');
};

// wordt die oldUrl nou nog ergens hier gebruikt??  > nee, in geheim.js




/*


Realiteit: Coen en Ria hebben heel veel, erg verschillende producten. Van de verwachte schroefjes en spijkertjes tot stickers
en ketting en installatiedraad en pluggen en veiligheidssloten en soldeerbouten en toebehoren en van die TV/internetkabels 
aan toe. 
Van veel dingen hebben ze maar een paar exemplaren, dus dat is veel om in te voeren.
Sommige dingen gaan per stuk, andere in kavels voor collegaverkopers, weer andere misschien in (starters?)pakketten.

Denk wel dat het een aanrader is overal de daadwerkelijke foto bij te doen - als je die op de overzichtspagina al ziet, 
ziet de klant ook al meteen de specificaties op de verpakking

Gemene delers: 
-foto
-naam product (bijv Spaanplaatschroeven)
-categorie (bijv IJzerwaren)
-prijs
-oude prijs (afgeprijsd van ... !)
-productdetails (met verder ALLES wat er nog aan onderscheidende dingen te zeggen valt over het product)

Zo'n algemene productdetails is wel het handigst als ze dingen ook op Marktplaats hebben staan - de beschrijving is er dan al, kunnen ze die kopiëren





Gedaan: 

//nieuwe github repository aanmaken   klonen in aparte map voor het daadwerkelijke project      alles uit huidige map erin flikkeren    checken of alles het nog doet, ook mongo enzo    denk het wel     signupfunctie verwijderen (althans uitgecomment - ze moeten nog wel zélf een beheerdersaccount aanmaken...!!)   links naar sign up, sign in, gebruikerspagina en uitloggen verwijderen van homepagina   checkout niet meer terugsturen naar signin als klant niet ingelogd is   in winkelwagentje mogelijkheid toevoegen meer te kopen van een product    in checkout formulier toevoegen voor naam en adres enzo   adresgegevens toevoegen in Order.js   op beheerpaginaview 'product toevoegen' neergezet en een dropdown toegevoegd voor het kiezen van een categorie product om toe te voegen...    checkout houden als plek om adresgegevens in te vullen, maar iDeal op aparte volgende pagina doen (is vooral belangrijk als we de verzendkosten weten te regelen)   view en router.get maken voor nieuwe beheerderspagina (...waarvan de /naam geheim moet blijven... dus dan moet ik hem niet op github zetten... voorlopig maar /geheim)    op /geheim uitlogfunctie ook weer voorwaardelijk tonen    inlog- en uitlogfunctie en profiel verplaatsen van navbar naar /geheim   > ja, maar link werkt niet   kijken wat er nou mis is met die links, want ik kan vanaf /geheim niet meer op profiel en andere pagina's komen en da's niet handig   checken of alles nog steeds werkt als ik de beveiliging weer aan zet (dummyversie isLoggedIn)  > ja, met next(); erin   view met formulier + model + postmethode gemaakt voor ijzerwaren    info uit formulier plukken en opslaan in variabele lukt   views en getmethodes gemaakt, zonder formulier nog, voor overige categorieën (beveiliging, zonwering, gereedschappen, tuinartikelen, sierbeslag)    iets in mongo database zetten via formulier: Functie om ijzerwaar toe te voegen aan mongo database   Laden duurt lang, functie lijkt te lopen,  geslaagd-console.log binnen function(error, result)  loopt ook, maar daarna geeft browser de boodschap dat het mislukt  is en dat localhost niets heeft verzonden  Csrf gaf een error, onzichtbaar token toegevoegd onder formulier, weet niet of dat wel de bedoeling is bij toevoegen producten??! Kan het iets zijn met de connectie met mongo?? > R: Je moet altijd of een response renderen of een redirect geven. Anders denkt de browser dat je het verzoek nog aan het verwerken bent. Wanneer dit te lang duurt, denkt de browser, jaa daaaag! Daar kan ik niet op wachten.. (request timeout) > geredirect naar /geheim   bestellingsformulier > adres met aparte straat, huisnummer, toevoeging, plaatsnaam en postcode, mailadres of telefoonnummer
//homepage productvrij gemaakt (maar die behoudt nog wel flashboodschappen) producten verplaatst naar /producten  view gemaakt voor /producten en relevant gedeelte uit indexview daarheen verplaatst bootstrap zoekfunctiehtml teruggepleurd in de navbar  sidebar in mekaar geflanst met link naar /producten en ul met li's naar de categorieën Tuinartikelen, Voor de Dremel en (moet voorwaardelijk worden) IJzerwaren sidebar geïncluded in layout.hbs. Fokking lelijk maar hij wordt weergegeven Producten allemaal binnen Product houden, met een categorie daarbinnen voor ijzerwaren etc, en algemene velden voor alle producten, en misschien specifiekere info allemaal in één specificatiesveld? Formulier IJzerwaren ombouwen tot algemeen formulier met die velden plus productDetails-veld  functie ijzerwaren omgebouwd tot producterbij model product aangepast, model ijzerwaren verwijderd  flashboodschap toevoegen bij product toegevoegd Zorgen dat klanten niet ingelogd hoeven te zijn om een bestelling te plaatsen /geheim aanpassen aan 1 formulier etc voor product erbij en voor categorie erbij    Productcategorieën renderen via een [automatische] query met :categorie. Render die dingen als products in producten.hbs  Links in sidebar daarop aansluiten  producten.hbs gebruiken als view ook voor categorieën Checken of producterbijformulier werkt > jep, extra producten worden ook gerenderd op Alle producten  renderen categorieën werkt (links ook van fugly sidebar die geen sidebar wil zijn), mits categorie met kleine letter is ingevoerd   router.get maken met query voor 1 specifiek product (zie ook addItem!)  Algemene view maken voor 1 product, met alle velden inclusief het grote detailsveld knop toevoegen aan productthumbnails om naar productview te gaan    zorgen dat ie de categorieën ook verwerkt als ze met een hoofdletter worden ingetypt  Netjes de prijs in euro's weergeven en niet in centen...    Links naar /geheim en /shoppingcart deden raar (onterecht redirecten, user/product renderen) > router.get('/:id' etc)  onderaan op pagina gezet :-)   productverwijderknop alleen beschikbaar voor beheerder > als ik alles weer inschakel zou het net zo goed moeten werken als alle andere csrf-shit  product verwijderen uit database    veld voor oude prijs toegevoegd aan producterbij.hbs, product.hbs, producten.hbs, productmodel en functie /producterbij beide prijzen (weer) in nummers veranderd (raar, want dat waren toch ook nummers??)   Winkelwagentje totaalprijs fixen, kennelijk gebeurt daar iets raars  > shoppingcart had nog price ipv prijs :-)   Erachter gekomen wat er gebeurt als ik per ongeluk de terminator sluit terwijl de server nog loopt  Erachter gekomen hoe ik de server van de gesloten terminator permanent kill zodat ik weer console.logs kan lezen ggggffff$%^&#$%%     > het lijkt goed te gaan als ik het proces kill en dan npm start gebruik, maar dan moet ik steeds stoppen en starten      > nodemon gebruiken via npm run dev werkt niet meer, dan zegt ie dat Port 3000 al in gebruik is       > computer herstarten lijkt te helpen Erachter gekomen dat herstarten computer en npm run dev foutmelding UnhandledPromiseRejection oid oplevert, mbt mongoverbinding     > mongo stoppen en starten helpt  .       uitzoeken hoe die flashboodschappen precies werken en die overal toevoegen aan de errorhandling (producterbij oa)     flash versturen (in POST):        req.flash('error', err.message);      // naam flashboodschaparray, de boodschap zelf      flash ontvangen (in GET):       var errMsg = req.flash('error')[0];   // naam array, eerste item      flash renderen (in GET):        res.render('shop/checkout', {total: cart.totalPrice, errMsg: errMsg, noError: !errMsg});      of:       res.render('user/signup', {csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0});      flash renderen (in de hbs):       <div class="alert alert-danger {{#if noError}}hidden{{/if}}" id="charge-error" >          {{errMsg}}        </div>      of (danger voor errors en success voor positieve meldingen):        {{#if hasErrors}}         <div class="alert alert-danger">            {{#each messages }}           <p>{{this}}</p>           {{/each}}         </div>        {{/if}} .   functie schrijven voor dynamisch toevoegen categorieën in de sidebar...   > ik probeerde document.insertAdjacentHTML(etc).    > Computer: "wtf is 'document'"   > internet: "ExpressJS is server side en kan die client side DOM-elementen niet lezen, het moet via req.params"   > maar ik zie dat alleen werken als je iets wilt toevoegen op een bestaande locatie in de hbs, zoals {{variabele}}      of {{{markup}}}, niet als je juist dat stukje wilt toevoegen    > Inmiddels een lijstje met categorieën doorgemaild gekregen van mijn oom en tante, dus ik kan ze er gewoon in hardcoden  .   dat oldUrl-trucje ook toepassen bij /add-to-cart, want als je iets in je karretje gooit, wil je niet van je pagina gegooid worden   > lukte niet, can't read property oldUrl of undefined..., redirect ook door naar /add-to-cart/<vorige pagina>... Zucht. .     

Gepoogd: 


Doen: 

/geheim moet puur het inlogscherm worden... of eigenlijk, signin moet de standaard /geheim worden en de rest moet daar
aan hangen. 
User (voorlopig) veranderen in geheim
geheim.js > inhoud verplaatsen naar geheim/profile

flash toevoegen bij producteraf

  shop, met alle dingen voor de klant
  /geheim/index, met inlogscherm (en signup in eerste instantie), en uitloglink (die mag wel op navbar? alleen zichtbaar wanneer ingelogd?)
  /geheim/etc, met alle andere dingen (producterbij). Waarbij 'geheim' uiteindelijk iets anders niet-raadbaars moet worden

bij product toevoegen zorgen dat je een plaatje uit je eigen computer kunt toevoegen...

categorieën dynamisch renderen in sidebar, op een manier dat je dat in iedere pagina kunt zien...
  > mustache prestatic?
  > kan dat niet in app??

in app kon je de flashboodschap op iedere pagina weergeven, dat vind ik ook wel chill

voorstel van mijn moeder: categorieën in een dropdown zetten, met mogelijkheid extra categorie toe te voegen...
  > uitzoeken hoe je dan info post, vanuit zo'n li in een dropdown
  > check bootstrap voor voorbeelden

checken wat er gebeurt als product toevoegen niet goed gaat > is dan alle data weer weg?
   > ja > opslaan in local storage
idealiter: mogelijkheid product te klonen en/of aan te passen

Regelen hoe dat werkt met zo'n order, die moet te zien zijn voor zowel de klant als voor de verkoper

checken of alles nog steeds werkt als ik echt de beveiliging weer aan zet (echte versie isLoggedIn met isAuthenticated)

idealiter moeten R&C ergens eenmalig hun account kunnen aanmaken
eventuele testinloggegevens verwijderen



//BESTELLINGEN

Nadenken over hoe afhandelen bestelling moet verlopen... > weten Coen en Ria ook nog niet zo goed. Marktplaatsafhandeling 
  via mail vinden ze ook al best

Voor verkoper: e-mail met bestelling, adres en mailadres/telefoonnummer klant is waarschijnlijk het handigste
    > automatisch e-mail sturen met daarin die informatie

-moeten gebruikers via de website kunnen betalen en hun adresgegevens achterlaten, zodat Ria en Coen het dan standaard opsturen?
      > bij opsturen krijg je met verzendkosten te maken, hoe doen we dat? Die verschillen per grootte/gewicht van het pakje, en zijn bij meerdere items weer minder dan simpelweg de som der delen
-doen we het meer zoals Marktplaats, dat de koper een berichtje stuurt met achterlating van mailadres of telefoonnummer dat ie iets wil kopen en Ria en Coen dan contact opnemen (mailen, bellen?) over hoe en wat?

-klant moet nog steeds winkelwagentje kunnen bekijken en aanpassen, en daarna de lijst met bestellingen zien voor checkout (whatever checkout behelst)


checkout-POST controleren en kijken hoe die nu moet aansluiten op wat er nu in de views gebeurt 

afmaken Stripe-functie voor iDeal?

bestellingsformulier verbeteren: 
-optie om het op te halen en klant niet zijn eigen adres hoeft te geven
-mailadres OF telefoonnummer, niet per se allebei

Superprofessionele homepagetekst: "Omdat deze website is gebouwd door ons nichtje - een ongelooflijke amateur die dit voor 
het eerst doet - en wij evenmin kaas hebben gegeten van automatische berekening van verzendkosten en dergelijke, hebben we 
de betaalmodule maar weggelaten... In plaats daarvan ontvangen wij een mail met uw bestelling en adres en nemen we contact 
met u op over de precieze afhandeling van de bestelling (wanneer afhalen / hoeveel verzendkosten)."



//UITERLIJK en overige functies voor uiteindelijke website

hele kaartje in productoverzicht veranderen in knop voor product zelf

producten renderen met flexbox ipv die idiote productChunks want kom op zeg

netjes de producten naast de sidebar renderen ipv eronder...

netjes de prijzen in euro's met komma's weergeven

verzinnen hoe website eruit moet zien - voortbouwen op bestaand ontwerpje of ... ?
bootstrap eruitwerken, onderbrengen in eigen css-bestand
foto maken van assortimentskast (achtergrond), frontaanzicht laatje, zijaanzicht laatje

Kan ik moderne CSS gebruiken bij node.js? Waarom schijnt node met ES5 te moeten?  > kan kennelijk ook met meeste ES6

media queries...

Kleuren Coendoen:

 #260085 #208 midnightblue hsl(257,100,26) rgb(38,0,133)

 #de0000 #e00 red hsl(0,100,43) rgb(222,0,0)

 #5254a4 #55a darkslateblue hsl(238,33,48) rgb(82,84,164)

 #feab00 #fb0 orange hsl(40,100,49) rgb(254,171,0)

.





De volgende keer dat ik per ongeluk de terminal sluit terwijl de server nog loopt: 

 If there's any other process locking the port, you can find out which PID it has like this:

$ lsof -i :3000
COMMAND     PID USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
Passenger 40466 josh    5u  IPv4 0x7cae9332073ed4df      0t0  TCP *:hbci (LISTEN)
Passenger 40467 josh    5u  IPv4 0x7cae9332073ed4df      0t0  TCP *:hbci (LISTEN)

Then simply kill it/them:

$ kill -9 40466
$ kill -9 40467

Fuck dat - gewoon de computer helemaal uitzetten en herstarten is het enige wat echt helpt. Daarna mongo ook herstarten.
*/