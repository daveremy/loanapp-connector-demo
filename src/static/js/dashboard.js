document.addEventListener('DOMContentLoaded', function () {
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
            socket.on('update_state', function (data) {
                const { updated_state, new_event, es_headers } = data;
                updateLoanApplications(es_headers['Es-Event-Type'], new_event, updated_state);
            });
    });

function updateLoanApplications(eventType, event, state) {
    const loanId = state['loan_id'];
    const activeLoansDiv = document.getElementById('activeLoans');
    const completedLoansDiv = document.getElementById('completedLoans');

    let loanCard = document.getElementById(`loan-${loanId}`);
    if (loanCard) {
        updateLoanCard(loanCard, state);
        // if this is a terminal event (e.g., LoanDisbursed) then remove from active loans section
        if (isTerminal(eventType) && loanCard.parentNode.id == 'activeLoans') {
            loanCard.remove();
            // move to completed loans
            completedLoansDiv.appendChild(loanCard);
        }
    } else {
        loanCard = createLoanCard(state);
        if (isTerminal(eventType)) {
            completedLoansDiv.appendChild(loanCard);
            setTimeout(() => {
                loanCard.remove();
            }, 60000); // Remove from completed after 60 seconds
        } else {
            activeLoansDiv.appendChild(loanCard);
        }
    }
    addLoanEvent(loanCard, eventType, event);
}

function isTerminal(eventType) {
    return ["LoanDisbursed", "ApplicationDenied"].includes(eventType);
}

function createLoanCard(state) {
    const card = document.createElement('div');
    card.className = 'loan-container';
    card.id = `loan-${state.loan_id}`;

    const header = document.createElement('div');
    header.className = 'loan-header';
    card.appendChild(header);

    const eventsList = document.createElement('div');
    eventsList.className = 'loan-events';
    card.appendChild(eventsList);

    updateLoanCard(card, state);

    return card;
}

function updateLoanCard(card, state) {
    const header = card.querySelector('.loan-header');
    const formattedLoanAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 
    }).format(state.loan_amount);
    header.innerHTML = `Loan ID: ${state.loan_id}, Purpose: ${state.loan_purpose}, Amount: ${formattedLoanAmount}, Status: <span class="status-${state.status.toLowerCase().replace(/\s/g, '-')}" style="font-weight: bold;">${state.status}</span>`;
}

function addLoanEvent(loanCard, eventType, event) {
    let eventsList = loanCard.querySelector('.loan-events');
    let eventsHeader = loanCard.querySelector('.events-header');

    // Create the events header if it doesn't exist
    if (!eventsHeader) {
        eventsHeader = document.createElement('h2');
        eventsHeader.className = 'events-header';
        eventsHeader.innerText = 'Events:';
        eventsList = document.createElement('div');
        eventsList.className = 'loan-events';
        loanCard.appendChild(eventsHeader); // Add the header to the loan card
        loanCard.appendChild(eventsList); // Re-create the events list container below the header
    }

    // Create and format the event item
    const eventItem = document.createElement('div');
    eventItem.className = 'loan-event';
    const formattedEvent = formatEventDetails(event);
    eventItem.innerHTML = `${eventType} - ${formattedEvent}`;

    // Check if there are any events already, insert new event just below the header
    if (eventsList.firstChild) {
        eventsList.insertBefore(eventItem, eventsList.firstChild);
    } else {
        eventsList.appendChild(eventItem); // If it's the first event, just append it
    }
}

function formatEventDetails(event) {
    // Assuming your timestamp is in Unix time (seconds), convert to milliseconds
    const formattedTimestamp = new Date(event.timestamp * 1000).toLocaleString();

    // Exclude loanId and timestamp from the event details to be displayed
    const { loanId, timestamp, ...details } = event;

    // Format any monetary values
    for (const key in details) {
        if (typeof details[key] === 'number' && (key.toLowerCase().includes('amount') || key.toLowerCase().includes('currency'))) {
            details[key] = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(details[key]);
        }
    }

    // Construct the details string, excluding the loanId and timestamp
    let detailsString = Object.entries(details).map(([key, value]) => `${key}: ${value}`).join(', ');
    if (detailsString.length > 0) {
        detailsString = `{ ${detailsString} }`;
    }

    return `${formattedTimestamp} ${detailsString}`;
}
