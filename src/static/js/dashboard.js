document.addEventListener('DOMContentLoaded', function () {
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
            socket.on('update_state', function (data) {
                const { updated_state, new_event, es_headers } = data;
                updateLoanApplications(es_headers['Es-Event-Type'], new_event, updated_state);
            });
    });

function updateLoanApplications(eventType, event, state) {
    const loanId = state['loan_id'];
    const activeLoansDiv = document.getElementById('activeLoansGrid'); // Updated ID
    const completedLoansDiv = document.getElementById('completedLoans');

    let loanCard = document.getElementById(`loan-${loanId}`);
    if (loanCard) {
        updateLoanCard(loanCard, state);
        // if this is a terminal event (e.g., LoanDisbursed) then remove from active loans section
        if (isTerminal(eventType) && loanCard.parentNode.id == 'activeLoansGrid') { // Updated ID
            loanCard.remove();
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

    // Create the header but don't set its content here
    const header = document.createElement('div');
    header.className = 'loan-header';
    card.appendChild(header);

    // Create placeholders for loan summary and event expansion
    const loanSummary = document.createElement('div');
    loanSummary.className = 'loan-summary';
    header.appendChild(loanSummary); // Append it to header but don't set innerHTML here

    const expandEvents = document.createElement('div');
    expandEvents.className = 'expand-events';
    expandEvents.textContent = 'Click to view events';
    header.appendChild(expandEvents);

    const eventsList = document.createElement('div');
    eventsList.className = 'loan-events';
    card.appendChild(eventsList);

    // Set the initial content and update as necessary
    updateLoanCard(card, state);

    header.addEventListener('click', function() {
        eventsList.classList.toggle('active');
        expandEvents.textContent = eventsList.classList.contains('active') ? 'Click to hide events' : 'Click to view events';
        if (eventsList.style.display === "none") {
            eventsList.style.display = "block";
        } else {
            eventsList.style.display = "none";
    }
});


    return card;
}

function updateStatusClass(loanCard, status) {
    // Define a mapping of statuses to class names
    const statusClassMap = {
        'ApplicationReceived': 'status-applicationreceived',
        'CreditCheckInitiated': 'status-creditcheckinitiated',
        'CreditCheckCompleted': 'status-creditcheckcompleted',
        'ApplicationApproved': 'status-applicationapproved',
        'ApplicationDenied': 'status-applicationdenied',
        'ManualReviewRequired': 'status-manualreviewrequired',
        'LoanDisbursed': 'status-loandisbursed'
    };

    // Remove all possible status classes first
    Object.values(statusClassMap).forEach(statusClass => {
        loanCard.classList.remove(statusClass);
    });

    // Add the new status class based on the mapping
    const newStatusClass = statusClassMap[status] || 'status-unknown';
    loanCard.classList.add(newStatusClass);
}


// Now, updateLoanCard will handle setting the content for the loan summary right from the start as well as updating it
function updateLoanCard(loanCard, state) {
    const loanSummary = loanCard.querySelector('.loan-summary');
    const formattedLoanAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 
    }).format(state.loan_amount);

    loanSummary.innerHTML = `
        Loan ID: ${state.loan_id}, Purpose: ${state.loan_purpose}, 
        Amount: ${formattedLoanAmount}, 
        Status: <span class="status-${state.status.toLowerCase().replace(/\s/g, '-')}" style="font-weight: bold;">${state.status}</span>
    `;

    updateStatusClass(loanCard, state.status);
}

function addLoanEvent(loanCard, eventType, event) {
    let eventsList = loanCard.querySelector('.loan-events');
    let eventsHeader = loanCard.querySelector('.events-header');

    // Create the events header if it doesn't exist
    if (!eventsHeader) {
        eventsHeader = document.createElement('h2');
        eventsHeader.className = 'events-header';
        eventsHeader.innerText = 'Events:';
        eventsList.insertBefore(eventsHeader, eventsList.firstChild); // Add the header to the top of the events list
    }

    // Create and format the event item
    const eventItem = document.createElement('div');
    eventItem.className = 'loan-event';
    const formattedEvent = formatEventDetails(event);
    eventItem.innerHTML = `${eventType} - ${formattedEvent}`;

    // Insert new event just below the header
    eventsList.insertBefore(eventItem, eventsHeader.nextSibling);
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
