document.addEventListener('DOMContentLoaded', function () {
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    socket.on('state_change', function (data) {
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
        // Temporarily append to ensure it's part of the DOM for measurement and positioning
        document.body.appendChild(loanCard); 
    }

    // Ensure the card is moved appropriately with shaking effect
    shakeAndMoveLoanCard(loanCard, columnId);
}

function updateCompletedLoans(state) {
    const loanId = state['loan_id'];
    let loanCard = document.getElementById(`loan-${loanId}`);

    if (!loanCard) {
        loanCard = createLoanCard(state);
    }

    shakeAndMoveLoanCard(loanCard, 'completedLoans');
}

function isTerminal(status) {
    return ["LoanDisbursed", "ApplicationDenied"].includes(status);
}

function statusToColumnId(status) {
    const statusMap = {
        'ApplicationReceived': 'applicationReceived',
        'CreditCheckInitiated': 'creditCheckInitiated',
        'CreditCheckCompleted': 'creditCheckCompleted',
        'ManualReviewRequired': 'manualReviewRequired',
        'ApplicationApproved': 'applicationApproved',
    };
    return statusMap[status] || 'unknownStatus';
}

function createLoanCard(state) {
    const card = document.createElement('div');
    card.className = 'loan-container';
    card.id = `loan-${state.loan_id}`;

    // Initial content setup for loan card
    card.innerHTML = `
        <div class="loan-summary">
            <div class="loan-card-header">
                <span><strong>ID:</strong> ${state.loan_id}</span>
            </div>
            <div class="loan-details">
                <div><strong>Type:</strong> ${state.loan_purpose}, <strong>Amount:</strong> ${formatCurrency(state.loan_amount)}</div>
            </div>
        </div>
        <div class="expand-events">Click to view events</div>
        <div class="loan-events" style="display: none;"></div>
    `;

    const expandEvents = card.querySelector('.expand-events');
    expandEvents.addEventListener('click', function() {
        const eventsList = card.querySelector('.loan-events');
        eventsList.style.display = eventsList.style.display === 'block' ? 'none' : 'block';
        expandEvents.textContent = eventsList.style.display === 'block' ? 'Click to hide events' : 'Click to view events';
    });

    return card;
}

function shakeAndMoveLoanCard(loanCard, targetColumnId) {
    loanCard.classList.add('shake');

    loanCard.addEventListener('animationend', () => {
        loanCard.classList.remove('shake'); // Remove shake class to reset animation
        moveLoanCard(loanCard, targetColumnId); // Move card after shaking
        // Optionally: Add a slight delay here before adding the shake class again to make it more noticeable
        setTimeout(() => loanCard.classList.add('shake'), 50); // Shake again in the new position
        loanCard.addEventListener('animationend', () => loanCard.classList.remove('shake'), {once: true});
    }, {once: true});
}

function moveLoanCard(loanCard, targetColumnId) {
    const targetColumn = document.getElementById(targetColumnId);
    if (targetColumn) {
        targetColumn.appendChild(loanCard);
        loanCard.style.visibility = 'visible'; // Ensure the card is visible after moving
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);
}
