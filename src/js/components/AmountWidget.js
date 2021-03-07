import {select, settings} from '../settings.js';

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
    //console.log('event:', event);
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

export default AmountWidget;