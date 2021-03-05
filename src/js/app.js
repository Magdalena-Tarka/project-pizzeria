import {select, classNames, settings, templates} from './settings.js';
import Product from './components/Product.js'; 
import Cart from './components/Cart.js';  

const app = {
    
  initPages: function() {
    const thisApp = this;
    
    thisApp.pages = document.querySelector(select.containerOf.pages).children;  // Dzięki temu w tej właściwości znajdą sie wszystkie dzieci contenera stron
    thisApp.navLinks = document.querySelectorAll(select.nav.links);
      
    const idFromHash = window.location.hash.replace('#/', '');
      
    let pageMatchingHash = thisApp.pages[0].id;
      
    for(let page of thisApp.pages) {
      if(page.id == idFromHash) {
        pageMatchingHash = page.id;
        break;
      }
    }
    //console.log('pageMatchingHash:', pageMatchingHash);
    thisApp.activatePage(pageMatchingHash);
      
    for(let link of thisApp.navLinks) {
      link.addEventListener('click', function(event) {
        const clickedElement = this;
        event.preventDefault();
        
        /* get page id from href attribute */
        const id = clickedElement.getAttribute('href').replace('#', '');
          
        /* run thisApp.activatePage with that id */
        thisApp.activatePage(id);
          
        /* change URL hash */
        window.location.hash = '#/' + id;
      });
    }
  },
    
  activatePage: function(pageId) {
    const thisApp = this;
      
    /* add class "active" to matching pages,remove from non-matching */
      
    for(let page of thisApp.pages) {   // W .toggle za pomoca drugiego argumentu możemy kontrolować to czy klasa zostanie nadana, czy nie!! Możemy tu użyć warunku takiego jak w bloku if!!
      page.classList.toggle(classNames.pages.active, page.id == pageId);
    }
      
    /* add class "active" to matching links,remove from non-matching */
    for(let link of thisApp.navLinks) {
      link.classList.toggle(  // Możemy to rozbić na taki zapis
        classNames.nav.active,
        link.getAttribute('href') == '#' + pageId
      );
    }
  },
    
  initMenu: function() {
    const thisApp = this;
      
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
        
    thisApp.productList = document.querySelector(select.containerOf.menu);
    thisApp.productList.addEventListener('add-to-cart', function(event) {
      app.cart.add(event.detail.product);
    });
  },
    
  init: function() {
    const thisApp = this;
    console.log('*** App starting ***');
    console.log('thisApp:', thisApp);
    console.log('classNames:', classNames);
    console.log('settings:', settings);
    console.log('templates:', templates);
    
    thisApp.initPages();
    thisApp.initData();
    //thisApp.initMenu();
    thisApp.initCart();
  },
};
    
app.init();
