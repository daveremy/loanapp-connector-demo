document.addEventListener('DOMContentLoaded', function () {
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    socket.on('state_change', function (data) {
        // Adjustments to match the new data structure
        const eventType = data.metadata['Es-Event-Type'] || 'Unknown';
        const event = data.event;
        const state = data.new_state;
        updateLoanApplications(eventType, event, state);
    });
});

function updateLoanApplications(eventType, event, state) {
    const loanId = state['loan_id'];
    const activeLoansDiv = document.getElementById('activeLoansGrid');
    const completedLoansDiv = document.getElementById('completedLoans');

    let loanCard = document.getElementById(`loan-${loanId}`);
    if (loanCard) {
        updateLoanCard(loanCard, state);
        if (isTerminal(state.status)) {
            loanCard.remove();
            completedLoansDiv.appendChild(loanCard);
        }
    } else {
        loanCard = createLoanCard(state);
        if (isTerminal(state.status)) {
            completedLoansDiv.appendChild(loanCard);
            setTimeout(() => { loanCard.remove(); }, 60000); // Optional: Remove from completed after 60 seconds
        } else {
            activeLoansDiv.appendChild(loanCard);
        }
    }
    addLoanEvent(loanCard, eventType, event);
}

function isTerminal(status) {
    return ["LoanDisbursed", "ApplicationDenied"].includes(status);
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
        eventsList.style.display = eventsList.style.display === 'block' ? 'none' : 'block';
        expandEvents.textContent = eventsList.style.display === 'block' ? 'Click to hide events' : 'Click to view events';
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
    eventItem.innerHTML = formatEventDetails(event);
    
    // Add new events at the top of the list
    eventsList.insertBefore(eventItem, eventsList.firstChild);
}

function formatEventDetails(event) {
    // Assuming the timestamp is provided in the event data
    const formattedTimestamp = new Date(event.timestamp * 1000).toLocaleString();

    // Construct the details string, excluding loanId and timestamp
    let detailsString = Object.entries(event)
                              .filter(([key]) => !['loanId', 'timestamp'].includes(key))
                              .map(([key, value]) => {
                                  // Format any monetary values
                                  if (typeof value === 'number' && (key.toLowerCase().includes('amount') || key.toLowerCase().includes('currency'))) {
                                      value = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
                                  }
                                  return `${key}: ${value}`;
                              })
                              .join(', ');
    if (detailsString.length > 0) {
        detailsString = `{ ${detailsString} }`;
    }

    return `${formattedTimestamp} - ${detailsString}`;
}
