import requests
from flask import Flask, request, jsonify, render_template, Response
from flask_socketio import SocketIO, emit
from evolver import evolve
from requests.auth import HTTPBasicAuth

app = Flask(__name__)
socketio = SocketIO(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/raw-events')
def raw_events():
    return render_template('events_raw.html')

@app.route('/manage-connector')
def manage_connector():
    return render_template('manage-connector.html')

# Dictionary to hold the latest state of active loan applications
active_loan_apps = {}

# Events from the loanapp-demo-connector are routed to this function
@app.route('/event', methods=['POST'])
def handle_event():
    event_data = request.json or {}
    # Extract metadata from http headers
    metadata = {key: value for key, value in request.headers.items() if key.startswith('Es-')}
    
    # Construct event object
    event = {
        "event type": metadata.get('Es-Event-Type', 'Unknown'),
        "data": event_data
    }

    # Process the event to get the new state
    new_state = process_event(event)

    # Data to emit
    data_to_emit = {
        'new_state': new_state,
        'metadata': metadata,
        'event': event["data"],
    }

    # Emit the updated state along with event and metadata
    socketio.emit('state_change', data_to_emit, broadcast=True)

    return jsonify({"message": "Event received"}), 200

def process_event(event):
    loan_id = event["data"].get('loanId')
    
    # The latest state of active loans are cached in active_loan_apps dict
    current_state = active_loan_apps.get(loan_id, {})

    # Generate the new state based on the event
    new_state = evolve(current_state, [event])

    # If the loan app is in a terminal state remove it, otherwise update
    if new_state.get("status") in ["ApplicationDenied", "LoanDisbursed"]:
        active_loan_apps.pop(loan_id, None)
    else:
        active_loan_apps[loan_id] = new_state

    return new_state

@app.route('/api/connectors', methods=['GET'])
def get_connectors():
    response = esdb_request('GET', 'connectors/list')
    if response.ok:
        return Response(response.content, status=response.status_code, mimetype='application/json')
    else:
        return jsonify({"error": "Failed to fetch connectors"}), response.status_code

@app.route('/api/connectors/loanapp-connector-demo/enable', methods=['POST'])
def enable_connector():
    response = esdb_request('POST', 'connectors/loanapp-connector-demo/enable')
    return Response(response.content, status=response.status_code, mimetype='application/json')

@app.route('/api/connectors/loanapp-connector-demo/disable', methods=['POST'])
def disable_connector():
    response = esdb_request('POST', 'connectors/loanapp-connector-demo/disable')
    return Response(response.content, status=response.status_code, mimetype='application/json')

@app.route('/api/connectors/loanapp-connector-demo/reset', methods=['POST'])
def reset_connector():
    # Assuming resetting to the beginning; adjust payload as necessary
    data = {}
    response = esdb_request('POST', 'connectors/loanapp-connector-demo/reset', data)
    return Response(response.content, status=response.status_code, mimetype='application/json')

@app.route('/api/connectors/loanapp-connector-demo', methods=['DELETE'])
def delete_connector():
    response = esdb_request('DELETE', 'connectors/loanapp-connector-demo')
    return Response(response.content, status=response.status_code, mimetype='application/json')

@socketio.on('connect')
def test_connect():
    print('Client connected')

@socketio.on('disconnect')
def test_disconnect():
    print('Client disconnected')

if __name__ == '__main__':
    socketio.run(app, debug=True)