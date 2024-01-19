'use strict';

// parent class
class Workout {
  // #date;
  // #id;

  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, duration, distance) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

// child class
class Running extends Workout {
  type = 'running';
  constructor(coords, duration, distance, cadence) {
    super(coords, duration, distance);
    this.cadence = cadence;
    this.Calcpace();
    this._setDescription();
    // this.type = type;
  }
  Calcpace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
// child class

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, duration, distance, elevationGain) {
    super(coords, duration, distance);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
    // this.type = type;
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const run1 = new Running([23, -34], 4, 5, 178);

///////////////////////////////////////////////////////////////////////////////////////

/////////////  APPLICATION ARCHITECTURE ///////////////////////////////////////////////

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapEvent;
  #workouts = [];
  #mapZoomLevel = 13;
  constructor() {
    // GET USER'S POSITION'S
    this._getposition();

    // GET DATA FROM LOCAL STORAGE
    this._getLocalStorage();
    // ATTACH EVENTE HANDLERS
    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getposition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._getLoadMap.bind(this),
        function () {
          alert('could not get your position');
        }
      );
    }
  }

  _getLoadMap(position) {
    console.log(position);
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel); // 13 is a zoom put view, we can change it as well but it is the most prefered zoomview

    // L is a namespace of the leaflet library , and it is a global variable which can be access by the other scripts and L namespace has some methods which we are using here like tilelayer, marker , map
    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => this._renderWorkoutMarker(work));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid')); // check in css
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    const validInput = (...input) => input.every(inp => Number.isFinite(inp));
    const allPositive = (...input) => input.every(inp => inp > 0);

    // GET DATA FROM FORM
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    // CHECK DATA IS VALID OR NOT

    // IF WORKOUT IS RUNNING, THEN  CREATE RUNNING OBJECT
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // using the guard clause
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInput(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be a positive numbers');

      // ADD NEW OBJECT TO WORKOUT ARRAY
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // IF WORKOUT IS CYCLING, THEN  CREATE CYCLING OBJECT
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // using the guard clause
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(elevation)
        !validInput(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be a positive numbers');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    // ADD NEW OBJECT TO WORKOUT ARRAY

    this.#workouts.push(workout);
    console.log(workout);

    // RENDER WORKOUT ON MAP AS A MARKER
    this._renderWorkoutMarker(workout);

    // RENDER WORKOUT ON LIST
    this._renderWorker(workout);

    //  HIDE FORM  + clear input fields
    this._hideForm();

    // SET LOCAL STORAGE TO ALL WORKOUTS
    this._setLocalStorage();

    // console.log(mapEvent);
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxwidth: 250,
          minwidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorker(workout) {
    let html = `
    <li class="workout ${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

    if (workout.type === 'running')
      html += `<div class="workout__details">
    <span class="workout__icon">⚡️</span>
    <span class="workout__value">${workout.pace.toFixed(1)}</span>
    <span class="workout__unit">min/km</span>
  </div>
  <div class="workout__details">
    <span class="workout__icon">🦶🏼</span>
    <span class="workout__value">${workout.cadence}</span>
    <span class="workout__unit">spm</span>
  </div>
</li>`;

    if (workout.type === 'cycling')
      html += `
<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>`;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // using the public interface
    // workout.click();
  }

  _setLocalStorage() {
    // local storage is an API which is used for storing small amount of data, it stere the data in the url
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    console.log(data);

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(work => {
      this._renderWorker(work);
      // this._renderWorkoutMarker(work); // this will not work as getlocalstorgae start at the very beginning, but at that time , page get current position and then loads so it will take time , so we gonna use this after loading the map
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
