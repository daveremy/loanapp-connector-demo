def application_received(state, data):
    state.update({
        "applicant_name": data["applicantName"],
        "loan_purpose": data["loanPurpose"],
        "loan_amount": data["loanAmount"],
        "status": "ApplicationReceived"
    })
    return state

def credit_check_initiated(state, data):
    state["status"] = "CreditCheckInitiated"
    return state

def credit_check_completed(state, data):
    state.update({
        "credit_score": data["creditScore"],
        "credit_status": data["creditStatus"],
        "status": "CreditCheckCompleted"
    })
    return state

def application_approved(state, data):
    state.update({
        "loan_officer": data["reviewer"],
        "decision_reason": data["decisionReason"],
        "status": "ApplicationApproved"
    })
    return state

def application_denied(state, data):
    state.update({
        "loan_officer": data["reviewer"],
        "decision_reason": data["decisionReason"],
        "status": "ApplicationDenied"
    })
    return state

def manual_review_required(state, data):
    state.update({
        "review_reason": data["reviewReason"],
        "status": "ManualReviewRequired"
    })
    return state

def loan_disbursed(state, data):
    state.update({
        "disbursement_amount": data["disbursementAmount"],
        "disbursement_date": data["disbursementDate"],
        "status": "LoanDisbursed"
    })
    return state

event_type_to_apply_function = {
    "ApplicationReceived": application_received,
    "CreditCheckInitiated": credit_check_initiated,
    "CreditCheckCompleted": credit_check_completed,
    "ApplicationApproved": application_approved,
    "ApplicationDenied": application_denied,
    "ManualReviewRequired": manual_review_required,
    "LoanDisbursed": loan_disbursed
}

def evolve(state, events):
    for event in events:
        apply_function = event_type_to_apply_function.get(event["event type"])
        if apply_function:
            state = apply_function(state, event["data"])
    return state
