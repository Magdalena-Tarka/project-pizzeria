/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product', // CODE ADDED
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
        input: 'input.amount', // CODE CHANGED
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    // CODE ADDED START
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
    // CODE ADDED END
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    // CODE ADDED START
    cart: {
      wrapperActive: 'active',
    },
    // CODE ADDED END
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }, // CODE CHANGED
    // CODE ADDED START
    cart: {
      defaultDeliveryFee: 20,
    },
    // CODE ADDED END
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    // CODE ADDED START
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
    // CODE ADDED END
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
      //console.log('1. formData to:', formData);
        
      //set price to default price
      let price = thisProduct.data.price;
        
      for(let paramId in thisProduct.data.params) {
        //determine param value. e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
        //console.log('2. paramId to:', paramId, '2a. i params to:', param);
          
        //for every option in this category
        for(let optionId in param.options) {
          const option = param.options[optionId];
          //console.log('3. optionId to:', optionId, '3a. option to:', option);
    
            
          // check if there is param with a name of paramId in formData and if it includes optionId
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
          //console.log('4. formData[paramId] to:', formData[paramId], '4a. i optionSelected to:', optionSelected);
            
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
        
      /* multiply price by amount */
      price *= thisProduct.amountWidget.value;
        
      thisProduct.priceSingle = price;
        
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
      //console.log('1. formData to:', formData);
        
      const params = {};
       
      //for every category (param)
      for(let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];
        //console.log('2. paramId to:', paramId);
          
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
      //console.log('params to:', params);
        
      return params;
    }
    
    addToCart() {
      const thisProduct = this;
        
      app.cart.add(thisProduct.prepareCartProduct());
    }
  }
    
  class AmountWidget {
    constructor(element) {
      const thisWidget = this;
        
      thisWidget.getElements(element);
      thisWidget.initActions();
      thisWidget.value = thisWidget.input.value;
      thisWidget.setValue(settings.amountWidget.defaultValue);
        
      //console.log('AmountWidget to:', thisWidget);
      //console.log('constructor arguments to:', element);
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
    
  class Cart {
    constructor(element) {
      const thisCart = this;
        
      thisCart.products = [];
        
      thisCart.getElements(element);
      thisCart.initActions();
        
      console.log('new cart to:', thisCart);
    }
      
    getElements(element) {
      const thisCart = this;
        
      thisCart.dom = {
        toggleTrigger: document.querySelector(select.cart.toggleTrigger),
        productList: document.querySelector(select.cart.productList),
      };
        
      thisCart.dom.wrapper = element;
      console.log('element to:', element);
    }
      
    initActions() {
      const thisCart = this;
        
      thisCart.dom.toggleTrigger.addEventListener('click', function(event) {
        event.preventDefault();
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
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
        
      console.log('adding product to:', menuProduct);
        
      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
      console.log('thisCart.products to:', thisCart.products);
    }
  }
    
  class CartProduct {
    constructor(menuProduct, element) {
      const thisCartProduct = this;
        
      thisCartProduct.id = menuProduct.id;
      //console.log('thisCartProduct.id to:', thisCartProduct.id);
      thisCartProduct.name = menuProduct.name;
      //console.log('thisCartProduct.name to:', thisCartProduct.name);
      thisCartProduct.amount = menuProduct.amount;
      console.log('thisCartProduct.amount to:', thisCartProduct.amount);
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      console.log('thisCartProduct.priceSingle to:', thisCartProduct.priceSingle);
      thisCartProduct.price = menuProduct.price;
      console.log('thisCartProduct.price to:', thisCartProduct.price);
      thisCartProduct.params = menuProduct.params;
      console.log('thisCartProduct.params to:', thisCartProduct.params);
        
      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      console.log('thisCartProduct to:', thisCartProduct);
    }
      
    getElements(element) {
      const thisCartProduct = this;
        
      thisCartProduct.dom = {};
        
      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.AmountWidget);
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
    }
      
    initAmountWidget() {
      const thisCartProduct = this;
        
      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
      console.log('XX. thisCartProduct.amountWidget to:', thisCartProduct.amountWidget);
        
      thisCartProduct.dom.amountWidget.addEventListener('update', function() {
        //thisCartProduct.amount = thisCartProduct.amountWidget.value;
        //thisCartProduct.price *= thisCartProduct.amount;
        //thisCartProduct.dom.price.innerHTML
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
      
    initCart: function() {
      const thisApp = this;
        
      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
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
      thisApp.initCart();
    },
  };
    
  app.init();
}
