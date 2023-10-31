function setCookie(name, value) {
	const currentDate = new Date();
	const expirationDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
	const expires = "expires=" + expirationDate.toUTCString();
	document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
	const cookieName = name + "=";
	const cookies = document.cookie.split(';');
	for (let i = 0; i < cookies.length; i++) {
			let cookie = cookies[i];
			while (cookie.charAt(0) == ' ') {
					cookie = cookie.substring(1);
			}
			if (cookie.indexOf(cookieName) == 0) {
					return cookie.substring(cookieName.length, cookie.length);
			}
	}
	return "";
}

function loadSessionsDataIntoCookies(data) {
  data.dates.forEach(date => {
    const dateKey = `sessions_${date.date}`;
    if (!getCookie(dateKey)) {
      setCookie(dateKey, JSON.stringify(date.sessions));
    }
  });
}

fetch('sessions.json')
  .then(response => response.json())
  .then(data => {
    loadSessionsDataIntoCookies(data);

    const dateSelect = document.getElementById('date');
    const sessionSelect = document.getElementById('session');
    const availableSeatsDiv = document.querySelector('.seats');
    const reservationForm = document.querySelector('.reservation-form form');
    const currentDate = new Date();

    function getSessionDataFromCookies(date, time) {
      const dateKey = `sessions_${date}`;
      const sessionsData = getCookie(dateKey);
      if (sessionsData) {
        const sessions = JSON.parse(sessionsData);
        const session = sessions.find(s => s.time === time);
        return session;
      }
      return null;
    }


    function updateSessions() {
			if (!dateSelect.value) {
				dateSelect.valueAsDate = currentDate;
			}
			const selectedDate = dateSelect.value;
      const errorMessage = document.querySelector('.no-sessions-message');
			const dateKey = `sessions_${selectedDate}`;
			const sessionsData = getCookie(dateKey);
			if (sessionsData) {
				const sessions = JSON.parse(sessionsData);
				sessionSelect.innerHTML = '';

				sessions.forEach(session => {
					const option = document.createElement('option');
					option.value = session.time;
					option.textContent = session.time;
					sessionSelect.appendChild(option);
				});
				if (errorMessage) {
					errorMessage.style.display = 'none';
				}
				updateSeats();
			} else {
				const noSessionsMessage = document.createElement('div');
				noSessionsMessage.className = 'no-sessions-message';
				noSessionsMessage.textContent = 'На вибрану дату немає доступних сеансів.';
				availableSeatsDiv.innerHTML = '';
				sessionSelect.innerHTML = '';
				availableSeatsDiv.appendChild(noSessionsMessage);
			}
    }
		sessionSelect.addEventListener('change', updateSeats);
    dateSelect.addEventListener('change', updateSessions);

    reservationForm.addEventListener('submit', function (event) {
			event.preventDefault();
			const selectedDate = dateSelect.value;
			const selectedSession = sessionSelect.value;
			const name = document.getElementById('name').value;
			const selectedSeats = Array.from(document.querySelectorAll('.available-seat:checked')).map(checkbox => parseInt(checkbox.value, 10));
			const errorBlock = document.querySelector('.error-message');
			const sessionDataFromCookies = getSessionDataFromCookies(selectedDate, selectedSession);
		
			if (sessionDataFromCookies) {
				if (selectedSeats.length > 0) {
					errorBlock.style.display = 'none';
					sessionDataFromCookies.reservedSeats = sessionDataFromCookies.reservedSeats.concat(selectedSeats);
	
					const existingCookie = getCookie(`sessions_${selectedDate}`);
					const sessionsData = existingCookie ? JSON.parse(existingCookie) : {};
					const sessionIndex = sessionsData.findIndex(session => session.time === selectedSession);
					sessionsData[sessionIndex] = sessionDataFromCookies;
					setCookie(`sessions_${selectedDate}`, JSON.stringify(sessionsData));
	
					updateSeats();
	
					alert(`Вы забронировали ${selectedSeats.length} мест(а) на имя ${name}`);
				} else {
					errorBlock.style.display = 'block';
				}
			}
		});
		

    function updateSeats() {
			availableSeatsDiv.innerHTML = '';
			const selectedDate = dateSelect.value;
			const selectedSession = sessionSelect.value;
			const session = getSessionDataFromCookies(selectedDate, selectedSession);
			if (session) {
				session.availableSeats.forEach(seatNumber => {
					const seatContainer = document.createElement('div');
					seatContainer.className = 'available-seats';
		
					const seat = document.createElement('input');
					seat.type = 'checkbox';
					seat.id = `seat${seatNumber}`;
					seat.value = seatNumber;
		
					if (session.reservedSeats.includes(seatNumber)) {
						seat.className = 'reserved-seat';
						seat.disabled = true;
						seatContainer.classList.add('disabled');
					} else {
						seat.className = 'available-seat';
					}
		
					const label = document.createElement('label');
					label.htmlFor = `seat${seatNumber}`;
					label.textContent = seatNumber;
		
					seatContainer.appendChild(seat);
					seatContainer.appendChild(label);
		
					availableSeatsDiv.appendChild(seatContainer);
				});
			}
		}
		

    updateSessions();
  })
  .catch(error => console.error('Помилка завантаження JSON-файлу:', error));
