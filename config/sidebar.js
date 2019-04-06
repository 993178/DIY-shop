var Product = require('../models/product')

module.exports = function updateCategoriesForSideBar(app){    // zou dit in app kunnen? Overkoepelend?
    Product.find().distinct('categorie', function(err, cats) {
        app.locals.categories = cats 
        console.log(app.locals)
    });
}