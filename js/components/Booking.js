import utils from '../utils.js';
import {classNames, select, settings, templates} from '../settings.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(bookingElem) {
    const thisBooking = this;

    thisBooking.selectedTable = {};

    thisBooking.render(bookingElem);
    thisBooking.initWidgets();
    this.getData();
  }

  getData() { // Będzie ona pobierać dane z API uzywając adresów z parametrami filtrującymi wyniki
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };
    //console.log('getData params', params);

    const urls = {
      booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking.join('&'),   // zawiera adres endpointu API, który zwróci nam listę rezerwacji
      eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent.join('&'),  // zwróci listę wydarzeń jednorazowych
      eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat.join('&'),  // zwróci liste wydarzeń cyklicznych
    };
    //console.log('urls', urls);

    Promise.all([   /// Pobieramy z API listę rezerwacji
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]) {
        //console.log('bookings:', bookings);
        //console.log('eventsCurrent:', eventsCurrent);
        //console.log('eventsRepeat:', eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for(let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate; 

    for(let item of eventsRepeat) {
      if(item.repeat == 'daily') {
        // for(let loopDate = minDate; loopDate <= maxDate; utils.addDays(loopDate, 1)) {  // Jak zostawimy w ten sposób to przeglądarka się zwiesi, bp to niekończąca się pętl, bo ostatniego wyrażenia nigdzie nie zapisujemy
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {  //Kolejna pętla, bo tu są wydarzenia cykliczne, więc nie tylko data jednego dnia, czyli iterujemy po jakimś zakresie dat od min do max date. Na dacie nie możemy zrobić ++ wieć posłuzy do tego funkcja addDays(obiekt daty, liczba dni)
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);  // Korzystamy z dateToStr(), zeby skonwertowac datę na tekst w odpowiednim formacie
        }
      }
    }
    //console.log('thisBooking.booked:', thisBooking.booked);

    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined') {   // Sprawdzamy, czy mamy już jakiś wpis dla tej daty
      thisBooking.booked[date] = {};   // Jeśli nie to chcemy stworzyć pusty obiekt
    }

    const startHour = utils.hourToNumber(hour);   // Konwersja godziny do liczby (12:30 do 12,5)
    
    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {   // hourBlock to 0.5 godzinny blok czasowy. Same as for(index=0; index<3; index++){} //w konsoli będzie index=0, index=1, index=2
      //console.log('loop:', hourBlock);

      if(typeof thisBooking.booked[date][hourBlock] == 'undefined') {   // Wykonujemu podobne sprawdzenie jak wczesniej dla daty
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(table);   // Dodajemy tutaj numery stolików do naszego obiektu z datami i godzinami
    }
  }

  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;   // Razem z kodem poniżej są to wartości wybrane aktualnie przez użytkownika
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailabele = false;   // Ta zmienna oznacza, że tego dnia wszystkie stoliki są dostępne, narazie ma false

    if(   // Jeśli okaże się, że w obiekcie thisBooking.booked dla tej daty nie ma obiektu lub dla tej daty i godziny nie istnieje tablica będzie to oznaczało, że żaden stolik nie jest zajęty, czyli wszystkie stoliki są dostępne, wtedy zmieny wartość allAvailabele na true
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ) {
      allAvailabele = true;
    }

    // uruchamiamy teraz pętlę, kt będzie iterować przez wszystkie stoliki widoczne na mapie na str booking. Pobieramy id aktulnego stolika, zas sprawdzamy czy nr stolika jest liczbą, zaś 
    for(let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if(!allAvailabele   // Sprawdzamy czy nie wszystkie stoliki są dostępne, czyli czy któryś stolik jest zajęty, dalej sprawdzamy czy któryś stolik jest zajęty o tym id
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  selectTable() {
    const thisBooking = this;
    
    if(thisBooking.clickedTable.classList.contains('table')) {

      if(!thisBooking.clickedTable.classList.contains(classNames.booking.tableBooked)) {   // Jest wolny

        if(thisBooking.clickedTable.classList.contains(classNames.booking.tableSelected)) {
          thisBooking.resetTables();
        } else {
          thisBooking.resetTables();
          thisBooking.clickedTable.classList.add(classNames.booking.tableSelected);
          thisBooking.selectedTable = thisBooking.clickedTableId;
        }
      } else {
        alert('Stolik niedostępny');
      }
      console.log('thisBooking.selectedTable to:', thisBooking.selectedTable);
    }
  }

  resetTables() {
    const thisBooking = this;

    for(const table of thisBooking.dom.tables) {
      table.classList.remove(classNames.booking.tableSelected);
      //thisBooking.selectedTable.shift();
    }
  }

  render(element) {
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;

    thisBooking.dom.peopleAmount = element.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = element.querySelector(select.booking.hoursAmount);

    thisBooking.dom.datePicker = element.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = element.querySelector(select.widgets.hourPicker.wrapper);

    thisBooking.dom.tables = element.querySelectorAll(select.booking.tables);
    thisBooking.dom.floorPlan = element.querySelector(select.containerOf.floorPlan);
    thisBooking.dom.phone = element.querySelector(select.booking.phone);
    thisBooking.dom.address = element.querySelector(select.booking.address);
    thisBooking.dom.starters = element.querySelectorAll(select.booking.starters);
    thisBooking.dom.form = element.querySelector(select.booking.form);
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmountWidget = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmountWidget = new AmountWidget(thisBooking.dom.hoursAmount);

    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.peopleAmount.addEventListener('click', function(event) {
      event.preventDefault();
    });
    thisBooking.dom.hoursAmount.addEventListener('click', function(event) {
      event.preventDefault();
    });

    thisBooking.dom.wrapper.addEventListener('update', function() {
      thisBooking.updateDOM();
      thisBooking.resetTables();
    });

    thisBooking.dom.floorPlan.addEventListener('click', function(event) {
      event.preventDefault();
      thisBooking.clickedTable = event.target;
      thisBooking.clickedTableId = thisBooking.clickedTable.getAttribute('data-table');
      thisBooking.selectTable();
    });

    thisBooking.dom.form.addEventListener('submit', function(event) {
      event.preventDefault();
      thisBooking.sendBooking();
    });
  }

  sendBooking() {
    const thisBooking = this;
        
    const url = settings.db.url + '/' + settings.db.booking;
        
    const payload = {};
        
    payload.date = thisBooking.datePicker.value;
    payload.hour = thisBooking.hourPicker.value;
    payload.table = parseInt(thisBooking.selectedTable);
    payload.duration = thisBooking.hoursAmountWidget.value;
    payload.ppl = thisBooking.peopleAmountWidget.value;
    payload.phone = thisBooking.dom.phone.value;
    payload.address = thisBooking.dom.address.value;
    payload.starters = [];

    for(let starter of thisBooking.dom.starters) {
      if(starter.checked) {
        payload.starters.push(starter.value);
      }
    }
    console.log('payload:', payload);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
        
    fetch(url, options)
      .then(function(response){
        return response.json();
      })
      .then(function(parsedResponse){
        thisBooking.makeBooked(parsedResponse.date, parsedResponse.hour, parsedResponse.duration, parsedResponse.table);
        thisBooking.resetTables();
        thisBooking.updateDOM();   // Odświeżamy widok za pomoca tej metody
      });
  }
}

export default Booking;