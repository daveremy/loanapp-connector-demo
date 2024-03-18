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
        // if loancard exists then lets update it to the new state
        updateLoanCard(loanCard, state);
        if (isTerminal(eventType) && loanCard.parentNode.id == 'activeLoans') {
            // move to completed loans
            loanCard.remove();
            completedLoansDiv.appendChild(loanCard);
        }
    } else {
        loanCard = createLoanCard(state);
        if (isTerminal(eventType)) {
            completedLoansDiv.appendChild(loanCard);
            setTimeout(() => {
                loanCard.remove();
            }, 29999); // Remove from completed after 30 seconds
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
    header.innerHTML = `Loan ID: ${state.loan_id}, Purpose: ${state.loan_purpose}, Amount: $${state.loan_amount}, Status: <span class="status-${state.status.toLowerCase().replace(/\s/g, '-')}" style="font-weight: bold;">${state.status}</span>`;
}

function addLoanEvent(loanCard, eventType, event) {
    const eventsList = loanCard.querySelector('.loan-events');
    if (!eventsList.querySelector('.loan-event')) {
        const eventsHeader = document.createElement('h2');
        eventsHeader.innerText = 'Events:';
        eventsList.appendChild(eventsHeader);
    }

    const eventItem = document.createElement('div');
    eventItem.className = 'loan-event';
    eventItem.innerHTML = `${eventType} - ${JSON.stringify(event, null, 1)}`;
    eventsList.appendChild(eventItem); 
}