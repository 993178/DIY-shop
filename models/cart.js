// Discount Jonas (die ik misschien niet zo zou moeten noemen, hmmm...) wil de winkelwagen niet in de sessie opslaan om voor later te bewaren, dus gebruikt ie geen mongoose model.

module.exports = function Cart(oldCart) {     // oldCart is het winkelwagentje so far. (Bij eerste sessie is oldCart een leeg object, zie index.js)
    this.items = oldCart.items || {};     // wou ie eerst een array van maken, toen liever een object, en toen werd het dit. Maar het is dus een object, met, denk ik, daarin steeds de product id als key en weer een object als value.
    this.totalQty = oldCart.totalQty || 0;
    this.totalPrice = oldCart.totalPrice || 0;  // dus || is... een soort ternary operator die checkt of iets bestaat. Ja: prima. Undefined > gebruik 0.
    
    this.add = function(item, id) {         // dus hier komt een nieuw item met id binnen
        var storedItem = this.items[id];    // en die slaan we op als storedItem
        if (!storedItem) {                  // bestaat storedItem niet al?
            storedItem = this.items[id] = {item: item, qty: 0, price: 0};   // eerste stuk vat ik niet; nieuw item is een object met naam, aantal en prijs
        }
        storedItem.qty++;                   // eentje erbij tov die 0 in het nieuw toegevoegde product (en zelf aanpassen in het winkelwagentje?)
        storedItem.price = storedItem.item.price * storedItem.qty;  // direct prijs maal aantal - is dat slim     nee
        this.totalQty++;
        this.totalPrice += storedItem.item.price;   // met item ertussen, anders is dat oude bedrag ook al vermenigvuldigd met het aantal
    };

    this.increaseByOne = function(id) {
      this.items[id].qty++;
      this.items[id].price += this.items[id].item.price;
      this.totalQty++;
      this.totalPrice += this.items[id].item.price;
  };

    this.reduceByOne = function(id) {
        this.items[id].qty--;
        this.items[id].price -= this.items[id].item.price;
        this.totalQty--;
        this.totalPrice -= this.items[id].item.price;

        if (this.items[id].qty <= 0) {              // als we 0 exemplaren kopen, hoeft ie niet meer in dat lijstje (om het over -1 exemplaar nog maar niet te hebben!)
            delete this.items[id];
        }
    };

    this.removeItem = function(id) {
        this.totalQty -= this.items[id].qty;
        this.totalPrice -= this.items[id].price;
        delete this.items[id];
    }

    this.generateArray = function() {   // en hier wil hij een array maken van de items, maar ik kan niet volgen wat het daarvoor dan was!
        var arr = [];
        for (var id in this.items) {
            arr.push(this.items[id]);
        }
        return arr;
    };
};
// wat ie probeert te doen, is een winkelwagentje creëren dat bij toevoeging van een product zichzelf opnieuw creëert met dat nieuwe product, zodat dubbele items gegroepeerd worden en je dus '2 brood, melk, suiker, eieren' te zien krijgt en niet 'brood, melk, suiker, brood, eieren'

// (tip bij dev problems: Ctrl+Shift+J > Resources > Cookies > delete connect-dinges cookie. Anders onthoudt ie de sessie waarbij er dingen niet klopten (NaN enzo))







/* <li class="nav-item dropdown">
<a href="#" class="nav-link dropdown-toggle" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
  <i class="fa fa-user" aria-hidden="true"></i> User
</a>
<div class="dropdown-menu" aria-labelledby="navbarDropdown">
  {{!-- bij Discount Jonas is dit een ul met li's, hier dus een div met a's --}}
  {{# if login}}
    <a class="dropdown-item" href="/user/profile">Gebruikersprofiel</a>
    <div class="dropdown-divider"></div>
    <a class="dropdown-item" href="/user/logout">Uitloggen</a>
  {{ else }}
    <a class="dropdown-item" href="/user/signin">Inloggen</a>
    <a class="dropdown-item" href="/user/signup">Account aanmaken</a>
  {{/if}}
</div>
</li>
<li class="nav-item">
<a class="nav-link disabled" href="#" tabindex="-1" aria-disabled="true">Disabled</a>
</li>



buiten de ul:

<form class="form-inline my-2 my-lg-0">
<input class="form-control mr-sm-2" type="search" placeholder="Search" aria-label="Search">
<button class="btn btn-outline-success my-2 my-sm-0" type="submit">Search</button>
</form> */
