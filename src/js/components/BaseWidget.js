class BaseWidget {
  constructor(wrapperElement, initialValue) {
  // Chcemy,żeby przyjmował 2 argumenty: element DOM, w kt znajduje się ten widget i początkową wartość widgetu
    const thisWidget = this;

    thisWidget.dom = {};
    thisWidget.dom.wrapper = wrapperElement;

    thisWidget.correctValue = initialValue;
  }

  get value() {   // To jest GETTER, czyli metoda wykonywana przy każdej próbie odczytania wartości właściwości value!!
    const thisWidget = this;

    return thisWidget.correctValue;
  }

  set value(value) {   // to jest SETTER, czyli metoda. kt jest wykonywana przy każdej próbie ustawienia nowej wartości właściwości value!!
    const thisWidget = this;
        
    const newValue = thisWidget.parseValue(value);
        
    /* Add validation */
    if(newValue !== thisWidget.correctValue && thisWidget.isValid(newValue)) {  // Spr. czy nowa value jest rózna od dotychczasowej value
      thisWidget.correctValue = newValue;
      // na filmiku to wywołanie: 'thisWidget.announce()'; jest w tym miejscu
    }
    thisWidget.renderValue();
        
    thisWidget.announce('update'); //wywoałanie event, eventu zmodyfikowanego przez nas 'update'
  }

  setValue(value) {   // Wprowadzając GETery i SETery, czyli wywalając starą metodę setValue, możemy zostawić taki zapis, żebyśmy sie nie martwili czy jakiś fragment naszej aplikacji korzysta ze starej składni i teraz przestanie działać
    const thisWidget = this;

    thisWidget.value = value;
  }

  parseValue(value) {  // Wydzieliliśmy metodę parseInt
    return parseInt(value);
  }

  isValid(value) {
    return !isNaN(value);  // Spr. czy value jest liczbą
  }

  renderValue() {   // Ta metoda służy temu, żeby bierząca wartość widgetu została wyświetlona na stronie
    const thisWidget = this;

    thisWidget.dom.wrapper.innerHTML = thisWidget.value; // Jest bezpieczniej przypisać .value, a nie .correctValue, żeby został wykonany SETTER
  }

  announce() {
    const thisWidget = this;
        
    const event = new CustomEvent('update', {
      bubbles: true //metoda bubbles powoduje, że event bąbelkuje(propagacja) swoim zasięgiem do góry, czyli na rodzica, dziadka itd, w przypadku customowego eventu bąbelkowanie musimy włączyć sami
    });
    thisWidget.dom.wrapper.dispatchEvent(event);
    //console.log('event:', event);
  }
}

export default BaseWidget;