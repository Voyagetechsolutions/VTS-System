Cypress.Commands.add('loginUI', ({ email, password, role = 'booking_officer', companyId = '' } = {}) => {
  cy.visit('/');
  cy.get('input[type="email"]').clear().type(email);
  cy.get('input[type="password"]').clear().type(password);
  cy.contains('Company ID').parent().find('input').clear().type(String(companyId));
  cy.get('div.MuiSelect-select').click();
  cy.contains('li.MuiMenuItem-root', role === '' ? 'Select Role' : role.replace('_', ' ')).click({ force: true });
  cy.contains('button', 'Login').click();
});

// Utility to navigate to a tab by visible label
Cypress.Commands.add('gotoTab', (label) => {
  cy.contains(label).click({ force: true });
});

// Create a booking via UI assuming New Booking form fields exist
Cypress.Commands.add('createBookingUI', ({ passengerName = 'E2E Tester', seatNumber = '1' } = {}) => {
  cy.contains('New Booking').click({ force: true });
  cy.get('input').filter('[name="passenger_name"], [placeholder="Passenger Name"], [aria-label*="Passenger"]').first().clear().type(passengerName);
  cy.get('input').filter('[name="seat_number"], [placeholder*="Seat"], [aria-label*="Seat"]').first().clear().type(String(seatNumber));
  cy.contains('button', 'Create').click({ force: true });
});

// Mark a booking paid via UI placeholder selectors
Cypress.Commands.add('payLatestBookingUI', () => {
  cy.contains('Payments').click({ force: true });
  cy.contains('Mark Paid').first().click({ force: true });
});

// Boarding check-in via UI placeholder selectors
Cypress.Commands.add('boardingCheckinLatestUI', () => {
  cy.visit('/boarding-operator-dashboard');
  cy.contains('Trip Boarding').click({ force: true });
  cy.contains('Check-in').first().click({ force: true });
});


