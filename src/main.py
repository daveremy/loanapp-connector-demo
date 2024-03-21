import requests
from flask import Flask, request, jsonify, render_template
from flask_socketio import SocketIO, emit
from evolver import evolve

app = Flask(__name__)
socketio = SocketIO(app)

# Dictionary to hold the state of active loan applications
loan_applications_state = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/raw-events')
def raw_events():
    return render_template('events_raw.html')

@app.route('/manage-connector')
def manage_connector():
    return render_template('manage-connector.html')

@app.route('/event', methods=['POST'])
def handle_event():
    global loan_applications_state  # Assuming this global variable holds the state of all loan applications

    event_data = request.json
    es_headers = {key: value for key, value in request.headers.items() if key.startswith('Es-')}

    print("event_data: ", event_data)
    event_type = es_headers['Es-Event-Type']
    loan_id = event_data['loanId']

    # Prepare event for evolver
    event = {
        "event type": event_type,
        "data": event_data
    }

    # Get the current state for this loan, or start with a new state if it's the first event for this loan
    current_state = loan_applications_state.get(loan_id, {})

    # Evolve the state based on the new event
    updated_state = evolve(current_state, [event])

    # If the updated state indicates a terminal state, remove the loan from active processing
    if updated_state["status"] in ["ApplicationDenied", "LoanDisbursed"]:
        loan_applications_state.pop(loan_id, None)
    else:
        # Save the updated state
        loan_applications_state[loan_id] = updated_state

    # Data to emit includes both the new event and the updated state
    data_to_emit = {
        'updated_state': updated_state,
        'new_event': event_data,
        'es_headers': es_headers  # Optionally include if you need to display these in the UI
    }
    socketio.emit('update_state', data_to_emit, broadcast=True)

    return jsonify(success=True), 200

@app.route('/api/connectors', methods=['GET'])
def get_connectors():
    esdb_url = "http://localhost:2113/connectors/list"
    # Assuming your EventStoreDB uses HTTP Basic Auth
    auth = ('admin', 'changeit')
    # Make a GET request to the EventStoreDB connectors list endpoint
    response = requests.get(esdb_url, auth=auth, verify=False)  # Set verify=True in production
    if response.ok:
        return jsonify(response.json()), 200
    else:
        return jsonify({"error": "Failed to fetch connectors"}), response.status_code


@socketio.on('connect')
def test_connect():
    print('Client connected')

@socketio.on('disconnect')
def test_disconnect():
    print('Client disconnected')

if __name__ == '__main__':
    socketio.run(app, debug=True)