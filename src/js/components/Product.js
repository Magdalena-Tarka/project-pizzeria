import {select, classNames, templates} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';

class Product {
  constructor(id, data) {
    const thisProduct = this;
        
    thisProduct.id = id;
    thisProduct.data = data;
        
    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();
        
    //console.log('new Product:', thisProduct);
  }
    
  renderInMenu() {
    const thisProduct = this;
        
    /* generate html based on template */
    const generatedHTML = templates.menuProduct(thisProduct.data);
      
    /* create element using utils.createElementFromHtml */
    thisProduct.element = utils.createDOMFromHTML(generatedHTML);
      
    /* find menu container */
    const menuContainer = document.querySelector(select.containerOf.menu);
      
    /* add element to menu */
    menuContainer.appendChild(thisProduct.element);
  }
    
  getElements() {
    const thisProduct = this;
      
    thisProduct.dom = {
      accordionTrigger: thisProduct.element.querySelector(select.menuProduct.clickable),
      form: thisProduct.element.querySelector(select.menuProduct.form),
      formInputs: thisProduct.element.querySelectorAll(select.all.formInputs),
      cartButton: thisProduct.element.querySelector(select.menuProduct.cartButton),
      priceElem: thisProduct.element.querySelector(select.menuProduct.priceElem),
      imageWrapper: thisProduct.element.querySelector(select.menuProduct.imageWrapper),
      amountWidgetElem: thisProduct.element.querySelector(select.menuProduct.amountWidget),
    };
  }
      
  initAccordion() {
    const thisProduct = this;
      
    /* find the clickable trigger (the element that should react to clicking) */  
    //const clickableTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);  --- niepotrzebna juz deklaracja tej zmiennej, bo została ona zdeklarowana ta sama referencja w metodzie powyżej.
      
    /* START: add event listener to clickable trigger on event click */
    thisProduct.dom.accordionTrigger.addEventListener('click', function(event) {
        
      /* prevent default action for event */
      event.preventDefault();
        
      /* find active product (product that has active class) */
      const activeProduct = document.querySelector(select.all.menuProductsActive);
        
      /* if there is active product and it's not thisProduct.element, remove class active from it */
      if (activeProduct !== null && activeProduct !== thisProduct.element) {
        activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
      }
          
      /* toggle active class on thisProduct.element */
      thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
    });
  }
      
  initOrderForm() {
    const thisProduct = this;
        
    thisProduct.dom.form.addEventListener('submit', function(event) {
      event.preventDefault();
      thisProduct.processOrder();
    });
        
    for(let input of thisProduct.dom.formInputs) {
      input.addEventListener('change', function() {
        thisProduct.processOrder();
      });
    }
        
    thisProduct.dom.cartButton.addEventListener('click', function(event) {
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
    //console.log('initOrderForm this to:', thisProduct);
  }
      
  processOrder() {
    const thisProduct = this;
      
    //convert form to object structure e.g. { sauce: ['tomato'], topping: ['olives', 'redPeppers']}
    const formData = utils.serializeFormToObject(thisProduct.dom.form);
        
    //set price to default price
    let price = thisProduct.data.price;
        
    for(let paramId in thisProduct.data.params) {
      //determine param value. e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
      const param = thisProduct.data.params[paramId];
          
      //for every option in this category
      for(let optionId in param.options) {
        const option = param.options[optionId];
            
        // check if there is param with a name of paramId in formData and if it includes optionId
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
            
        if(optionSelected) {
          // check if the option is not default
          if(!option.default) {
            // add option price to price variable
            price = (option.price) + price;
          }
        } else {
          //check if the option is default
          if(option.default) {
            //reduce price variable
            price -= option.price;
          }
        }
            
        //znalezienie obrazka o kl .paramId-optionId w divie z obrazkami
        const optionImage = thisProduct.dom.imageWrapper.querySelector('.' + paramId + '-' + optionId);
            
        //sprawdz czy udało się go znaleźć
        if(optionImage) {
              
          //czy dana opcja jest zaznaczona
          if(optionSelected) {
            //Jeśli jest, to należy pokazać taki obrazek. Jeśli nie jest, to należy go schować.
            optionImage.classList.add(classNames.menuProduct.imageVisible);
          } else {
            optionImage.classList.remove(classNames.menuProduct.imageVisible);
          }
        }
      }
    }
        
    thisProduct.priceSingle = price;
        
    /* multiply price by amount */
    price *= thisProduct.amountWidget.value;
        
    //update calculated price in html
    thisProduct.dom.priceElem.innerHTML = price;
  }
      
  initAmountWidget() {
    const thisProduct = this;
        
    thisProduct.amountWidget = new AmountWidget(thisProduct.dom.amountWidgetElem);
        
    thisProduct.dom.amountWidgetElem.addEventListener('update', function() {
      thisProduct.processOrder();
    });
  }
      
  prepareCartProduct() {
    const thisProduct = this;
        
    const productSummary = {
      id: thisProduct.id,
      name: thisProduct.data.name,
      amount: thisProduct.amountWidget.value,
      priceSingle: thisProduct.priceSingle,
      price: thisProduct.priceSingle * thisProduct.amountWidget.value,
      params: thisProduct.prepareCartProductParams(),
    };
    console.log('productSummary to:', productSummary);
        
    return productSummary;
  }
      
  prepareCartProductParams() {
    const thisProduct = this;
        
    const formData = utils.serializeFormToObject(thisProduct.dom.form);
        
    const params = {};
       
    //for every category (param)
    for(let paramId in thisProduct.data.params) {
      const param = thisProduct.data.params[paramId];
          
      //create category param in params const eg. params = { ingredients: { name: 'Ingredients', options: {}}}
      params[paramId] = {
        label: param.label,
        options: {}
      };
        
      // for every option in this category
      for(let optionId in param.options) {
        const option = param.options[optionId];
            
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
            
        if(optionSelected) {
          //option is selected!
            
          params[paramId].options[optionId] = option.label;
        }
      }
    }
    //console.log('. params to:', params);
        
    return params;
  }
    
  addToCart() {
    const thisProduct = this;
        
    //app.cart.add(thisProduct.prepareCartProduct());
        
    const event = new CustomEvent('add-to-cart', { //drugi argument to obiekt z ustawieniami tego eventu
      bubbles: true,
      detail: {
        product: thisProduct.prepareCartProduct(),
      },
    });
    thisProduct.element.dispatchEvent(event);  // Wywołanie eventu. Na elemencie DOM
  }
}

export default Product;