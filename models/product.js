var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({                       // de bouwtekeningen die definiëren hoe de data eruit moet zien
    categorie: { type: String, required: true },
    imagePath: {type: String, required: false},
    titel: {type: String, required: true},
    prijs: {type: Number, required: true},
    prijsOud: {type: Number, required: false},
    productDetails: { type: String, required: false }       // we doen nog maar even 1 veld
});

module.exports = mongoose.model('Product', schema); // we exporteren een model 'Product' dat gebaseerd is op dat schema



/*


Voorbeeld Rein van hoe je een formulier kunt maken waarbij de gebruiker zelf meer velden kan toevoegen, die dan als array met objects onder productDetails geschaard wordt
Handig voor unieke dingen, niet voor tig soorten schroefjes

<html>
    <head>
        <link rel="stylesheet" href="index.css">
    </head>
    <body>
        <h1>index.html</h1>
        <form id="productForm">
            <label> Naam Product </label>
            <input name="productName"/>
            <label> Categorie </label>
            <input name="category"/>
            <br/>
            <label> Details </label>
            <br/>
            <div class="productDetail">
                <label> DetailNaam </label>
                <input name="productDetails[0][key]"/>
                <label> DetailWaarde </label>
                <input name="productDetails[0][value]"/>
            </div>
        </form>
        <button id="+detail" onclick="addDetail()">+ detail</button>
        
        <script src="index.pack.js"></script>
        <script>
            // {
            // "naam": "ijsberenvel",    
            // "category": "versiering",
            // "productDetails": [
            //     {
            //     "key": "Grootte",
            //     "value": "4m2"
            //     },
            //     {
            //     "key": "Materiaal",
            //     "value": "IJsberenvacht"
            //     },
            //     {
            //     "key": "bebloed",
            //     "value": "enigszins"
            //     },
            // ]
            // }
            
            const addDetail = () => {
                const productDetailsCount = document.getElementsByClassName('productDetail').length
                console.log(productDetailsCount)
                const html = `
                    <div class="productDetail">
                        <label> DetailNaam </label>
                        <input name="productDetails[${productDetailsCount}][key]"/>
                        <label> DetailWaarde </label>
                        <input name="productDetails[${productDetailsCount}][value]"/>
                    </div>
                `
                document.getElementById('productForm').insertAdjacentHTML('beforeend', html)             
            }
        </script>
    </body>
</html>

*/