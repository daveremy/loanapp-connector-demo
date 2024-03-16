import random
import json
from esdbclient import EventStoreDBClient, NewEvent, StreamState
import time
import string

# Settings for the EventStoreDB connection
EVENTSTOREDB_URI = "esdb://localhost:2113?tls=false"
STREAM_PREFIX = "loanApplication-"

# Initialize the EventStoreDB client
client = EventStoreDBClient(uri=EVENTSTOREDB_URI)

def generate_unique_loan_id():
    """
    Generates a unique loan identifier with 10 uppercase characters, formatted with a hyphen after the first 4 characters.
    """
    identifier = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
    return f"{identifier[:4]}-{identifier[4:]}"

# Event-specific data generation functions
def application_received(unique_loan_identifier):
    return {
        "applicantName": "John Doe",
        "loanAmount": random.randint(5000, 50000),
        "loanPurpose": "Home Renovation"
    }

def credit_check_initiated(unique_loan_identifier):
    return {
        "creditCheckAgency": "Credit Bureau"
    }

def credit_check_completed(unique_loan_identifier):
    return {
        "creditScore": random.randint(300, 850),
        "creditStatus": random.choice(["Good", "Fair", "Poor"])
    }

def decision_event(unique_loan_identifier, event_type):
    return {
        "reviewer": "Loan Officer",
        "decisionReason": "Satisfactory Credit Score" if event_type == "ApplicationApproved" else "Unsatisfactory Credit Score"
    }

def manual_review_required(unique_loan_identifier):
    return {
        "reviewReason": "Incomplete Application Details"
    }

def loan_disbursed(unique_loan_identifier):
    return {
        "disbursementAmount": random.randint(5000, 50000),
        "disbursementDate": time.strftime('%Y-%m-%d', time.gmtime())
    }

# Mapping of event types to their corresponding data generation function
event_type_to_function = {
    "ApplicationReceived": application_received,
    "CreditCheckInitiated": credit_check_initiated,
    "CreditCheckCompleted": credit_check_completed,
    "ApplicationApproved": lambda uid: decision_event(uid, "ApplicationApproved"),
    "ApplicationDenied": lambda uid: decision_event(uid, "ApplicationDenied"),
    "ManualReviewRequired": manual_review_required,
    "LoanDisbursed": loan_disbursed
}

def create_event_data(event_type, unique_loan_identifier):
    """
    Creates specific event data based on the event type, including the unique loan identifier as the loan_id.
    """
    event_data_function = event_type_to_function[event_type]
    data = {
        "loanId": unique_loan_identifier, 
        "timestamp": time.time(),
        **event_data_function(unique_loan_identifier)
    }
    return data

def create_loan_application_events(unique_loan_identifier):
    """
    Creates a sequence of events for a loan application process, including event-specific data.
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
            data=json.dumps(create_event_data(event_type, unique_loan_identifier)).encode('utf-8')
        )
        for event_type in events_sequence
    ]

def continuous_event_generation():
    """
    Continuously generates loan application events with meaningful data.
    """
    while True:
        unique_loan_identifier = generate_unique_loan_id()
        stream_name = STREAM_PREFIX + unique_loan_identifier
        events = create_loan_application_events(unique_loan_identifier)

        for event in events:
            client.append_to_stream(
                stream_name=stream_name,
                current_version=StreamState.ANY,
                events=[event]
            )
            print(f"Generated event '{event.type}' for loan {unique_loan_identifier} in stream {stream_name}.")
            time.sleep(random.randint(1, 3))

        time.sleep(random.randint(5, 10))

if __name__ == "__main__":
    continuous_event_generation()
