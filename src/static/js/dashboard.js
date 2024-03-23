document.addEventListener('DOMContentLoaded', function () {
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    socket.on('state_change', function (data) {
        const eventType = data.metadata['Es-Event-Type'] || 'Unknown';
        const event = data.event;
        const state = data.new_state;
        if (isTerminal(state.status)) {
            updateCompletedLoans(state);
        } else {
            updateDashboardColumns(state);
        }
    });
});

function updateDashboardColumns(state) {
    const loanId = state['loan_id'];
    const columnId = statusToColumnId(state.status);
    let loanCard = document.getElementById(`loan-${loanId}`);

    if (!loanCard) {
        loanCard = createLoanCard(state);
    } else {
        // Remove and re-add the card to trigger the animation
        loanCard.classList.remove('shake');
        // Use setTimeout to ensure the class removal has been processed
        setTimeout(() => loanCard.classList.add('shake'), 0);
    }

    const column = document.getElementById(columnId);
    if (column) {
        column.appendChild(loanCard);
        updateLoanCard(loanCard, state);
    }
}

function updateCompletedLoans(state) {
    const loanId = state['loan_id'];
    const completedLoansDiv = document.getElementById('completedLoans');
    let loanCard = document.getElementById(`loan-${loanId}`);

    if (!loanCard) {
        loanCard = createLoanCard(state);
    }

    completedLoansDiv.appendChild(loanCard);
    updateLoanCard(loanCard, state);
}

function isTerminal(status) {
    return ["LoanDisbursed", "ApplicationDenied"].includes(status);
}

function statusToColumnId(status) {
    // Maps loan application status to the corresponding dashboard column ID.
    // Ensure these IDs match exactly with those in your HTML.
    const statusMap = {
        'ApplicationReceived': 'applicationReceived',
        'CreditCheckInitiated': 'creditCheckInitiated',
        'CreditCheckCompleted': 'creditCheckCompleted',
        'ManualReviewRequired': 'manualReviewRequired',
        'ApplicationApproved': 'applicationApproved',
        // Add any other statuses as needed
    };
    return statusMap[status] || 'unknownStatus'; // Adjust as needed for default or error handling
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

    // Start constructing the HTML with the loan ID
    let loanDetailsHTML = `<div class="loan-card-header"><span><strong>ID:</strong> ${state.loan_id}</span>`;

    // Use the isTerminal function to check if the status should be included
    if (isTerminal(state.status)) {
        loanDetailsHTML += `<span class="status-tag"><strong>&nbsp;${state.status}</strong></span>`;
    }

    loanDetailsHTML += `</div><div class="loan-details">
                         <div><strong>Type:</strong> ${state.loan_purpose}, <strong>Amount:</strong> ${formattedLoanAmount}</div>
                         </div>`;

    loanSummary.innerHTML = loanDetailsHTML;

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
    const formattedTimestamp = new Date(event.timestamp * 1000).toLocaleString();

    let detailsString = Object.entries(event)
        .filter(([key]) => !['loanId', 'timestamp'].includes(key))
        .map(([key, value]) => {
            if (typeof value === 'number' && (key.toLowerCase().includes('amount') || key.toLowerCase().includes('currency'))) {
                value = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
            }
            return `${key}: ${value}`;
        })
        .join(', ');
    return `${formattedTimestamp} - ${detailsString}`;
}
