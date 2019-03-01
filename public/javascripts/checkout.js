// Create a Stripe client.
// Note: this merchant has been set up for demo purposes.
var stripe = Stripe('pk_test_6pRNASCoBOKtIshFeQd4XMUh');

// Create an instance of Elements.
var elements = stripe.elements();

// Custom styling can be passed to options when creating an Element.
// (Note that this demo uses a wider set of styles than the guide below.)
var style = {
  base: {
    padding: '10px 12px',
    color: '#32325d',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSmoothing: 'antialiased',
    fontSize: '16px',
    '::placeholder': {
      color: '#aab7c4'
    },
  },
  invalid: {
    color: '#fa755a',
  }
};

// Create an instance of the idealBank Element.
var idealBank = elements.create('idealBank', {style: style});

// Add an instance of the idealBank Element into the `ideal-bank-element` <div>.
idealBank.mount('#ideal-bank-element');

var errorMessage = document.getElementById('error-message');

// Handle form submission.
var form = document.getElementById('payment-form');
form.addEventListener('submit', function(event) {
  event.preventDefault();
//   showLoading();

  var sourceData = {
    type: 'ideal',
    amount: 1099,
    currency: 'eur',
    owner: {
      name: document.querySelector('input[name="name"]').value,
    },
    // Specify the URL to which the customer should be redirected
    // after paying.
    redirect: {
      return_url: 'https://shop.example.com/crtA6B28E1',
    },
  };

  function stripeSourceHandler(source){
      document.location.href = source.redirect.url
  }

  // Call `stripe.createSource` with the idealBank Element and additional options.
  stripe.createSource(idealBank, sourceData).then(function(result) {
    console.log(result)
    if (result.error) {
      // Inform the customer that there was an error.
      errorMessage.textContent = result.error.message;
      errorMessage.classList.add('visible');
      stopLoading();
    } else {
      // Redirect the customer to the authorization URL.
      errorMessage.classList.remove('visible');
      stripeSourceHandler(result.source);
    }
  });
});

// var stripe = Stripe('pk_test_oWvq3qZUH3yrFK24DXudUqBK');
// var elements = stripe.elements();

// var options = {
//     // Custom styling can be passed to options when creating an Element.
//     style: {
//         base: {
//         // Add your base input styles here. For example:
//         fontSize: '16px',
//         color: '#32325d',
//         padding: '10px 12px',
//         },
//     }
// }

// Create an instance of the idealBank Element.
// var idealBank = elements.create('idealBank', options);

// Add an instance of the idealBank Element into
// the `ideal-bank-element` <div>.
// idealBank.mount('#ideal-bank-element');

// wat Discount Jonas doet:

// var $form = $('#checkout-form');        // grijp het formulier bij zijn ID

// $form.submit(function(event) {
//     $('#charge-error').addClass('hidden');  // om dat html-element onzichtbaar te maken (...moet je 'hidden' dan niet weghalen in de html zelf? Krijg je anders niet 2 hiddens zodat er niks gebeurt als je er 1 weghaalt??)
//     $form.find('button').prop('disabled', true);    // grijp button (is er maar 1), zet 'disabled' op 'true'
    
//     // copypaste deze functie van de Stripesite van 3 jaar geleden
//     Stripe.card.createToken({
//         number: $('#card-number').val(),            // is dus de jQueryversie van getElementById, met ID-nummer van die html-elementen
//         cvc: $('#card-cvc').val(),
//         exp_month: $('#card-expiry-month').val(),
//         exp_year: $('#card-expiry-year').val(),
//         name: $('#card-name').val()       
//     }, stripeResponseHandler);          // met callback (zie hieronder)
//     return false;           // want we willen dit nog niet naar de server sturen voor het is gevalidatet
// });

// function stripeResponseHandler() {      // stond ook op Stripesite anno 2016
//     if (Response.error) {

//         // show the errors on the form
//         $('#charge-error').text(response.error.message);       // grijp html-element waar errors geshowd moeten worden. Geen form.find, want charge-error staat niet binnen de form
//         $('#charge-error').removeClass('hidden');              // dat html is normaal gesproken niet zichtbaar, en moet dat nu wel worden
//         $form.find('button').prop('disabled', false);   // de submit button moet weer actief gemaakt worden, anders kan de gebruiker geen tweede poging doen na een tikfout oid
//     } else {    // token was created
//         var token = response.id; // get the token ID

//         //insert the token into the form so it gets submitted to the server
//         $form.append($('<input type="hidden" name="stripeToken" />').val(token));       // dus hier wordt dat token als extra info aan de info uit het formulier toegevoegd, en dat is dan... bewijs dat de boel valid is?

//         //submit the form to the server
//         $form.get(0).submit();
//     }
// }
// Discount Jonas doet ook npm install stripe --save
// en zoekt op die stripeAPI site naar Charges > create a charge




// wat Stripe anno 2019 op de site (https://stripe.com/docs/quickstart) heeft staan: 

// Set your secret key: remember to change this to your live secret key in production
// See your keys here: https://dashboard.stripe.com/account/apikeys
// var stripe = require("stripe")("sk_test_pQPtnc49JtVufrg3N1lkccT5");

// Token is created using Checkout or Elements!
// Get the payment token ID submitted by the form:
// const token = request.body.stripeToken; // Using Express

// (async () => {
//   const charge = await stripe.charges.create({
//     amount: 999,
//     currency: 'usd',
//     description: 'Example charge',
//     source: token,
//   });
// })();




// {{!-- <form action="/checkout" method+"post" id="checkout-form">
// {{!-- dit is de post-route /checkout --}}
//     <div class="row">
//         <div class="col-xs-12">
//             <div class="form-group">
//                 <label for="name">Naam</label>
//                 <input type="text" id="name" class="form-control" name="name" required>
//             </div>
//         </div>
//         <div class="col-xs-12">
//             <div class="form-group">
//                 <label for="address">Adres</label>
//                 <input type="text" id="address" class="form-control" name="address" required>
//             </div>
//         </div>
//         <hr>
//         <div class="col-xs-12">
//             <div class="form-group">
//                 <label for="card-name">Naam kaarthouder</label>
//                 <input type="text" id="card-name" class="form-control" required>
//             </div>
//         </div>
//         <div class="col-xs-12">
//             <div class="form-group">
//                 <label for="card-number">Creditcardnummer</label>
//                 <input type="text" id="card-number" class="form-control" required>
//             </div>
//         </div>
//         <div class="col-xs-12">
//             <div class="form-group">
//                 <label for="card-expiry-month">Maand van verloop</label>
//                 <input type="text" id="card-expiry-month" class="form-control" required>
//             </div>
//         </div>
//         <div class="col-xs-12">
//             <div class="form-group">
//                 <label for="card-expiry-year">Jaar van verloop</label>
//                 <input type="text" id="card-expiry-year" class="form-control" required>
//             </div>
//         </div>
//         <div class="col-xs-12">
//             <div class="form-group">
//                 <label for="card-cvc">Beveiligingscode</label>
//                 <input type="text" id="card-cvc" class="form-control" required>
//             </div>
//         </div>

//     </div>
//     <button type="submit" class="btn btn-success">Koop sluiten</button>
// </form> --}}
