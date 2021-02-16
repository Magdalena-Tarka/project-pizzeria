/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input[name="amount"]',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
  };
    
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
      
      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.element.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }
      
    initAccordion() {
      const thisProduct = this;
      
      /* find the clickable trigger (the element that should react to clicking) */  
      //const clickableTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);  --- niepotrzebna juz deklaracja tej zmiennej, bo została ona zdeklarowana ta sama referencja w metodzie powyżej.
      
      /* START: add event listener to clickable trigger on event click */
      thisProduct.accordionTrigger.addEventListener('click', function(event) {
        
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
        
      thisProduct.form.addEventListener('submit', function(event) {
        event.preventDefault();
        thisProduct.processOrder();
      });
        
      for(let input of thisProduct.formInputs) {
        input.addEventListener('change', function() {
          thisProduct.processOrder();
        });
      }
        
      thisProduct.cartButton.addEventListener('click', function(event) {
        event.preventDefault();
        thisProduct.processOrder();
      });
        
      //console.log('initOrderForm this to:', thisProduct);
    }
      
    processOrder() {
      const thisProduct = this;
      
      //convert form to object structure e.g. { sauce: ['tomato'], topping: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.form);
        
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
          const optionImage = thisProduct.imageWrapper.querySelector('.' + paramId + '-' + optionId);
            
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
        
      /* multiply price by amount */
      price *= thisProduct.amountWidget.value;
        
      //update calculated price in html
      thisProduct.priceElem.innerHTML = price;
    }
      
    initAmountWidget() {
      const thisProduct = this;
        
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
        
      thisProduct.amountWidgetElem.addEventListener('update', function() {
        thisProduct.processOrder();
      });
    }
  }
    
  class AmountWidget {
    constructor(element) {
      const thisWidget = this;
        
      thisWidget.getElements(element);
      thisWidget.initActions(event);
      thisWidget.value = thisWidget.input.value;
      thisWidget.setValue(settings.amountWidget.defaultValue);
        
      console.log('1. AmountWidget to:', thisWidget);
      console.log('2. constructor arguments to:', element);
    }
      
    getElements(element) {
      const thisWidget = this;
        
      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }
      
    setValue(value) {
      const thisWidget = this;
        
      const newValue = parseInt(value);
        
      /* TO DO: Add validation */
      if(thisWidget.value !== newValue && !isNaN(newValue) && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax) {
        thisWidget.value = newValue;
        //console.log('thisWidget.value to:', thisWidget.value);
        
      }
      thisWidget.input.value = thisWidget.value;
        
      thisWidget.announce('update'); //wywoałanie event, eventu zmodyfikowanego przez nas 'update'
    }
      
    announce() {
      const thisWidget = this;
        
      const event = new Event('update');
      thisWidget.element.dispatchEvent(event);
    }
      
    initActions() {
      const thisWidget = this;
        
      thisWidget.input.addEventListener('change', function() {
        thisWidget.setValue(thisWidget.input.value);
      });
        
      thisWidget.linkDecrease.addEventListener('click', function(event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });
        
      thisWidget.linkIncrease.addEventListener('click', function(event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });
    }
  }

  const app = {
    
    initMenu: function() {
      const thisApp = this;
      
      //console.log('thisApp.data:', thisApp.data);
      
      for(let productData in thisApp.data.products) {
        new Product(productData, thisApp.data.products[productData]);
      }
    },
      
    initData: function() {
      const thisApp = this;
      
      thisApp.data = dataSource;
    },
    
    init: function() {
      const thisApp = this;
      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);
      
      thisApp.initData();
      thisApp.initMenu();
    },
  };
    
  app.init();
}
