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
      totalNumber: '.cart__total-number',
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
    db: {
      url: '//localhost:3131',
      product: 'product',
      order: 'order',
    },
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
      //console.log('formData to:', formData);
        
      const params = {};
       
      //for every category (param)
      for(let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];
        //console.log('param to:', param);
          
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
        
      app.cart.add(thisProduct.prepareCartProduct());
    }
  }
    
  class AmountWidget {
    constructor(element) {
      const thisWidget = this;
        
      thisWidget.getElements(element);
      thisWidget.initActions();
      thisWidget.value = settings.amountWidget.defaultValue;
      thisWidget.setValue(thisWidget.input.value);
        
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
        
      const event = new CustomEvent('update', {
        bubbles: true //metoda bubbles powoduje, że event bąbelkuje(propagacja) swoim zasięgiem do góry, czyli na rodzica, dziadka itd, w przypadku customowego eventu bąbelkowanie musimy włączyć sami
      });
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

  const app = {
    
    initMenu: function() {
      const thisApp = this;
      
      //console.log('thisApp.data:', thisApp.data);
      
      for(let productData in thisApp.data.products) {
        new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
        //console.log('XX. thisApp.data.products[productData].id, thisApp.data.products[productData]:', thisApp.data.products[productData].id, thisApp.data.products[productData]);
      }
    },
      
    initData: function() {
      const thisApp = this;
      
      thisApp.data = {};
      const url = settings.db.url + '/' + settings.db.product;
      //console.log('1. url to:', url);
        
      fetch(url)
        .then(function(rawResponse) {
          return rawResponse.json();
        })
        .then(function(parsedResponse) {
          //console.log('2. parsedResponse:', parsedResponse);
          /* save parsedResponse as thisApp.data.products */
          thisApp.data.products = parsedResponse;
          /* excute initMenu method */
          thisApp.initMenu();  //przenieśliśmy tutaj wywołanie tej funkcji w związku z asynchronicznością API, inaczej initMenu uruchamiałby się, zanim skrypt otrzymałby listę produktów
        });
        
      //console.log('3. thisApp.data to:', JSON.stringify(thisApp.data));
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
      //thisApp.initMenu();
      thisApp.initCart();
    },
  };
    
  app.init();
}
