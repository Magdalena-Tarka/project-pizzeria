import utils from '../utils.js';
import {select, settings, templates} from '../settings.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(bookingElem) {
    const thisBooking = this;

    thisBooking.render(bookingElem);
    thisBooking.initWidgets();
    this.getData();
  }

  getData() { // Będzie ona pobierać dane z API urzywając adresów z parametrami filtrującymi wyniki
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };
    console.log('getData params', params);

    const urls = {
      booking:      settings.db.url + '/' + settings.db.booking + '?' + params.booking.join('&'),   // zawiera adres endpointu API, który zwróci nam listę rezerwacji
      eventsCurrent: settings.db.url + '/' + settings.db.booking + '?' + params.eventCurrent.join('&'),  // zwróci listę wydarzeń jednorazowych
      eventsRepeat:  settings.db.url + '/' + settings.db.booking + '?' + params.eventRepeat.join('&'),  // zwróci liste wydarzeń cyklicznych
    };
    console.log('urls', urls);

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
        console.log('bookings:', bookings);
        console.log('eventsCurrent:', eventsCurrent);
        console.log('eventsRepeat:', eventsRepeat);
      });
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
  }
}

export default Booking;