import random
import json
from esdbclient import EventStoreDBClient, NewEvent, StreamState
import uuid
import time

# Settings for the EventStoreDB connection
EVENTSTOREDB_URI = "esdb://localhost:2113?tls=false"
STREAM_PREFIX = "loanApplication-"

# Initialize the EventStoreDB client
client = EventStoreDBClient(uri=EVENTSTOREDB_URI)

def create_event_data(event_type, loan_id):
    """
    Creates specific event data based on the event type.
    """
    data = {"loanId": str(loan_id), "timestamp": time.time()}
    if event_type == "ApplicationReceived":
        data.update({
            "applicantName": "John Doe",
            "loanAmount": random.randint(5000, 50000),
            "loanPurpose": "Home Renovation"
        })
    elif event_type == "CreditCheckInitiated":
        data.update({
            "creditCheckAgency": "Credit Bureau"
        })
    elif event_type == "CreditCheckCompleted":
        data.update({
            "creditScore": random.randint(300, 850),
            "creditStatus": random.choice(["Good", "Fair", "Poor"])
        })
    elif event_type in ["ApplicationApproved", "ApplicationDenied"]:
        data.update({
            "reviewer": "Loan Officer",
            "decisionReason": "Satisfactory Credit Score" if event_type == "ApplicationApproved" else "Unsatisfactory Credit Score"
        })
    elif event_type == "ManualReviewRequired":
        data.update({
            "reviewReason": "Incomplete Application Details"
        })
    elif event_type == "LoanDisbursed":
        data.update({
            "disbursementAmount": random.randint(5000, 50000),
            "disbursementDate": time.strftime('%Y-%m-%d', time.gmtime())
        })

    return data

def create_loan_application_events(loan_id):
    """
    Creates a sequence of events for a loan application process, with specific event data.
    """
    events_sequence = [
        "ApplicationReceived",
        "CreditCheckInitiated",
        "CreditCheckCompleted"
    ]
    
    outcome = random.choice(["ApplicationApproved", "ApplicationDenied", "ManualReviewRequired"])
    events_sequence.append(outcome)

    final_outcome = outcome

    if outcome == "ManualReviewRequired":
        final_outcome = random.choice(["ApplicationApproved", "ApplicationDenied"])
        events_sequence.append(final_outcome)
    
    if final_outcome == "ApplicationApproved":
        events_sequence.append("LoanDisbursed")

    return [
        NewEvent(
            type=event_type,
            data=json.dumps(create_event_data(event_type, loan_id)).encode('utf-8')
        )
        for event_type in events_sequence
    ]

def continuous_event_generation():
    """
    Continuously generates loan application event sequences with meaningful event data.
    """
    while True:
        loan_id = STREAM_PREFIX + str(uuid.uuid4())
        events = create_loan_application_events(loan_id)

        for event in events:
            client.append_to_stream(
                stream_name=loan_id,
                current_version=StreamState.ANY,
                events=[event]
            )
            print(f"Generated event '{event.type}' for loan {loan_id}.")
            time.sleep(random.randint(1, 3))

        time.sleep(random.randint(5, 10))

if __name__ == "__main__":
    continuous_event_generation()
