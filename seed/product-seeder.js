var Product = require('../models/product');
var mongoose = require('mongoose');             // tijdelijk   Dit is niet de normale gang van zaken voor de app, Maximillian doet
mongoose.connect('mongodb://localhost:27017/shopping',  { useNewUrlParser: true });   // tijdelijk    dit tijdens het developpen, handmatig

var products = [     // dus hier vullen we het model in met de daadwerkelijk data
    new Product({
        imagePath: 'https://proxy.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.allesvast.nl%2Fwp-content%2Fuploads%2F2016%2F03%2Fschroeven.jpg&f=1',
        title: 'schroefjes',
        description: 'zitten los',
        price: 4.99
    }),
    new Product({
        imagePath: 'https://proxy.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.allesvast.nl%2Fwp-content%2Fuploads%2F2016%2F03%2Fschroeven.jpg&f=1',
        title: 'meer schroefjes',
        description: 'zitten ook los',
        price: 4.99
    }),
    new Product({
        imagePath: 'https://proxy.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.allesvast.nl%2Fwp-content%2Fuploads%2F2016%2F03%2Fschroeven.jpg&f=1',
        title: 'nog meer schroefjes',
        description: 'zitten allemaal los',
        price: 4.99
    }),
    new Product({
        imagePath: 'https://proxy.duckduckgo.com/iu/?u=https%3A%2F%2Fmoerenbout.nl%2Fmedia%2Fcatalog%2Fcategory%2Fschroeven.png&f=1',
        title: 'losse schroeven',
        description: 'niet om op te staan',
        price: 3.99
    }),
    new Product({
        imagePath: 'https://proxy.duckduckgo.com/iu/?u=https%3A%2F%2Fmoerenbout.nl%2Fmedia%2Fcatalog%2Fcategory%2Fschroeven.png&f=1',
        title: 'losse schroeven',
        description: 'ook niet om op te staan',
        price: 3.99
    }),
    new Product({
        imagePath: 'https://proxy.duckduckgo.com/iu/?u=https%3A%2F%2Fmoerenbout.nl%2Fmedia%2Fcatalog%2Fcategory%2Fschroeven.png&f=1',
        title: 'losse schroeven',
        description: 'ook al niet om op te staan',
        price: 2.99
    })

            
];

var done = 0;
for (var i = 0; i < products.length; i++) {
    products[i].save(function(error, result) {                         // save, waarmee mongoose de producten in de database opslaat
        done++;
        if (done === products.length) {         // hele hulpconstructie om te zorgen dat de forloop, die asynchroon is, klaar is voor de verbinding wordt verbroken
            exit();
        }
    });
};

function exit() {
    mongoose.disconnect();
}
