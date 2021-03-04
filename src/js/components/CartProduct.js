import {select} from '../settings.js';
import AmountWidget from './AmountWidget.js';

class CartProduct {
  constructor(menuProduct, element) {
    const thisCartProduct = this;
        
    thisCartProduct.id = menuProduct.id;
    thisCartProduct.name = menuProduct.name;
    thisCartProduct.amount = menuProduct.amount;
    thisCartProduct.priceSingle = menuProduct.priceSingle;
    thisCartProduct.price = menuProduct.price;
    thisCartProduct.params = menuProduct.params;
        
    //console.log('thisCartProduct to:', thisCartProduct);
        
    thisCartProduct.getElements(element);
    thisCartProduct.initAmountWidget();
    thisCartProduct.initActions();
  }
      
  getElements(element) {
    const thisCartProduct = this;
        
    thisCartProduct.dom = {};
        
    thisCartProduct.dom.wrapper = element;
    //console.log('1. thisCartProduct.element to:', element); 
    thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
    thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
    thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
    thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
  }
      
  initAmountWidget() {
    const thisCartProduct = this;
        
    thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
        
    thisCartProduct.dom.amountWidget.addEventListener('update', function() {
      //console.log('X1. thisCartProduct.price:', thisCartProduct.price);
        
      thisCartProduct.amount = thisCartProduct.amountWidget.value;
      //console.log('X2. thisCartProduct.amount:', thisCartProduct.amount);
        
      thisCartProduct.price = thisCartProduct.amount * thisCartProduct.priceSingle;
      //console.log('X3. thisCartProduct.price:', thisCartProduct.price);
      thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
    });
  }
      
  remove() {
    const thisCartProduct = this;
        
    const event = new CustomEvent('remove', {
      bubbles: true,
      detail: {
        cartProduct: thisCartProduct,
      },
    });
        
    thisCartProduct.dom.wrapper.dispatchEvent(event);
  }
      
  initActions() {
    const thisCartProduct = this;
        
    thisCartProduct.dom.edit.addEventListener('click', function(event) {
      event.preventDefault();
    });
        
    thisCartProduct.dom.remove.addEventListener('click', function(event) {
      event.preventDefault();
      thisCartProduct.remove();
      console.log('Działa metoda remove!');
    });
  }
      
  getDate() {
    const thisCartProduct = this;
        
    const orderData = {};
        
    orderData.id = thisCartProduct.id;
    orderData.name = thisCartProduct.name;
    orderData.amount = thisCartProduct.amount;
    orderData.priceSingle = thisCartProduct.priceSingle;
    orderData.price = thisCartProduct.price;
    orderData.params = thisCartProduct.params;
      
    console.log('2. orderData to:', orderData);
        
    return orderData;
  }
}

export default CartProduct;