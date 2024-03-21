document.addEventListener('DOMContentLoaded', function () {
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    socket.on('update_state', function (data) {
        const { updated_state, new_event, es_headers } = data;
        updateLoanApplications(es_headers['Es-Event-Type'], new_event, updated_state);
    });
});

function updateLoanApplications(eventType, event, state) {
    const loanId = state['loan_id'];
    const activeLoansDiv = document.getElementById('activeLoansGrid'); // Make sure this ID matches your HTML
    const completedLoansDiv = document.getElementById('completedLoans'); // Make sure this ID matches your HTML

    let loanCard = document.getElementById(`loan-${loanId}`);
    if (loanCard) {
        updateLoanCard(loanCard, state);
        if (isTerminal(eventType)) {
            loanCard.remove();
            completedLoansDiv.appendChild(loanCard);
        }
    } else {
        loanCard = createLoanCard(state);
        if (isTerminal(eventType)) {
            completedLoansDiv.appendChild(loanCard);
            setTimeout(() => { loanCard.remove(); }, 60000); // Optional: Remove from completed after 60 seconds
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

    const loanSummary = document.createElement('div');
    loanSummary.className = 'loan-summary';
    card.appendChild(loanSummary); 

    const expandEvents = document.createElement('div');
    expandEvents.className = 'expand-events';
    expandEvents.textContent = 'Click to view events';
    card.appendChild(expandEvents);

    const eventsList = document.createElement('div');
    eventsList.className = 'loan-events';
    card.appendChild(eventsList);

    updateLoanCard(card, state);

    expandEvents.addEventListener('click', function() {
        const isEventsListActive = eventsList.style.display === 'block';
        expandEvents.textContent = isEventsListActive ? 'Click to view events' : 'Click to hide events';
        eventsList.style.display = isEventsListActive ? 'none' : 'block';
    });

    return card;
}

function updateLoanCard(loanCard, state) {
    const loanSummary = loanCard.querySelector('.loan-summary');
    const formattedLoanAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2 
    }).format(state.loan_amount);

    loanSummary.innerHTML = `
        <div class="loan-card-header">
            <span><strong>ID:</strong> ${state.loan_id}</span>
            <span class="status-tag"><strong>${state.status}</strong></span>
        </div>
        <div class="loan-details">
            <div><strong>Type:</strong> ${state.loan_purpose} <strong>Amount:</strong> ${formattedLoanAmount}</div>
        </div>
    `;

    updateStatusClass(loanCard, state.status);
}


function updateStatusClass(loanCard, status) {
    const statusClassMap = {
        'ApplicationReceived': 'status-applicationreceived',
        'CreditCheckInitiated': 'status-creditcheckinitiated',
        'CreditCheckCompleted': 'status-creditcheckcompleted',
        'ApplicationApproved': 'status-applicationapproved',
        'ApplicationDenied': 'status-applicationdenied',
        'ManualReviewRequired': 'status-manualreviewrequired',
        'LoanDisbursed': 'status-loandisbursed'
    };

    Object.values(statusClassMap).forEach(statusClass => {
        loanCard.classList.remove(statusClass);
    });

    const newStatusClass = statusClassMap[status] || 'status-unknown';
    loanCard.classList.add(newStatusClass);
}

function addLoanEvent(loanCard, eventType, event) {
    const eventsList = loanCard.querySelector('.loan-events');
    const eventItem = document.createElement('div');
    eventItem.className = 'loan-event';
    eventItem.innerHTML = `${formatEventDetails(event)}`;
    
    // Add new events at the top of the list
    eventsList.insertBefore(eventItem, eventsList.firstChild);
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
