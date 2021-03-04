import {select, classNames, settings, templates} from './settings.js';
import utils from './utils.js';
import CartProduct from './components/CartProduct.js';   

class Cart {
  constructor(element) {
    const thisCart = this;
        
    thisCart.products = [];
        
    thisCart.getElements(element);
    thisCart.initActions();
        
    //console.log('new cart to:', thisCart);
  }
      
  getElements(element) {
    const thisCart = this;
        
    thisCart.dom = {
      toggleTrigger: document.querySelector(select.cart.toggleTrigger),
      productList: document.querySelector(select.cart.productList),
      deliveryFee: document.querySelector(select.cart.deliveryFee),
      subtotalPrice: document.querySelector(select.cart.subtotalPrice),
      totalNumber: document.querySelector(select.cart.totalNumber),
      totalPrice: document.querySelectorAll(select.cart.totalPrice),
      form: document.querySelector(select.cart.form),
      phone: document.querySelector(select.cart.phone),
      address: document.querySelector(select.cart.address),
    };
        
    thisCart.dom.wrapper = element;
    //console.log('thisCart.element to:', element);
  }
      
  initActions() {
    const thisCart = this;
        
    thisCart.dom.toggleTrigger.addEventListener('click', function(event) {
      event.preventDefault();
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });
        
    thisCart.dom.productList.addEventListener('update', function(){
      thisCart.update(); //Dodany kod w celu nasłuchania customowego eventu, który idzie bąbelkuje dzięki bubbles na przodków w górę
    });
        
    thisCart.dom.productList.addEventListener('remove', function(event) {
      thisCart.remove(event.detail.cartProduct); //w ten sposób odbieramy teraz instancję thisCartProduct i przekazujemy ją do metody thisCart.remove
    });
        
    thisCart.dom.form.addEventListener('submit', function(event) {
      event.preventDefault(); //aby jego wysyłka nie przeładowywała strony
      thisCart.sendOrder();
    });
  }
      
  add(menuProduct) {
    const thisCart = this;
        
    /* generate html based on template */
    const generatedHTML = templates.cartProduct(menuProduct);
      
    /* create element using utils.createElementFromHtml */
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);
      
    /* add element to menu */
    thisCart.dom.productList.appendChild(generatedDOM);
        
    //console.log('adding product to:', menuProduct);
        
    thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
    //console.log('thisCart.products to:', thisCart.products);
        
    thisCart.update();
  }
    
  update() {
    const thisCart = this;
        
    thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
    //console.log('1. deliveryFee to:', deliveryFee);
        
    thisCart.totalNumber = 0;
    thisCart.subtotalPrice = 0;
      
    //console.log('2. thisCart.products to:', thisCart.products);
      
    for(let product of thisCart.products) {
      //console.log('3a. product.amount to:', product.amount);
      //console.log('3a. product.price to:', product.price);
          
      if(product) {
        thisCart.totalNumber = thisCart.totalNumber + product.amount;
        thisCart.subtotalPrice = thisCart.subtotalPrice + product.price;
        //console.log('3b. totalNumber to:', totalNumber);
        //console.log('3b. subtotalPrice to:', subtotalPrice);
      }
    }
        
    thisCart.totalPrice = thisCart.subtotalPrice;
    //console.log('4. thisCart.totalPrice to:', thisCart.totalPrice);
        
    if(thisCart.totalNumber != 0) {
      thisCart.totalPrice += thisCart.deliveryFee;
      //console.log('5. thisCart.totalPrice to:', thisCart.totalPrice);
    } else {
      thisCart.deliveryFee = 0;
    }
      
    thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
    thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
    thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
    for(let price of thisCart.dom.totalPrice) {
      //console.log('price to:', price);
      price.innerHTML = thisCart.totalPrice;
    }
  }
      
  remove(cartProduct) {
    const thisCart = this;
        
    //console.log('1. cartProduct:', cartProduct);
    //console.log('2. thisCart.products:', thisCart.products);
      
    cartProduct.dom.wrapper.remove();
    thisCart.products.splice(thisCart.products.indexOf(cartProduct), 1);
    thisCart.update();
  }
      
  sendOrder() {
    const thisCart = this;
        
    const url = settings.db.url + '/' + settings.db.order;
        
    const payload = {};
        
    payload.phone = thisCart.dom.phone.value;
    payload.address = thisCart.dom.address.value;
    payload.totalPrice = thisCart.totalPrice;
    payload.subtotalPrice = thisCart.subtotalPrice;
    payload.totalNumber = thisCart.totalNumber;
    payload.deliveryFee = thisCart.deliveryFee;
    payload.products = [];
        
    for(let prod of thisCart.products) {
      payload.products.push(prod.getDate());
    }
        
    console.log('1. payload:', payload);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
        
    fetch(url, options);
  }
}

export default Cart;