import requests
from flask import Flask, request, jsonify, render_template, Response
from flask_socketio import SocketIO, emit
from evolver import evolve
from requests.auth import HTTPBasicAuth

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
    # Print raw request data to the console
    print("Raw request data:", request.data.decode('utf-8'))
    
    # Attempt to parse JSON and print to console
    try:
        event_data = request.json
        print("Parsed JSON data:", event_data)
    except Exception as e:
        print("Error parsing JSON:", str(e))
        event_data = {}
    es_headers = {key: value for key, value in request.headers.items() if key.startswith('Es-')}
#     event_type = es_headers['Es-Event-Type']
    loan_id = event_data.get('loanId', None)
    print("loan_id:", loan_id)
    event_type = es_headers['Es-Event-Type']
    print("event_type:", event_type)
    event = {
        "event type": event_type,
        "data": event_data
    }
    # Get the current state for this loan, or start with a new state if it's the first event for this loan
    current_state = loan_applications_state.get(loan_id, {})
    print("current_state:", current_state)

    # Evolve the state based on the new event
    updated_state = evolve(current_state, [event])

    if updated_state["status"] in ["ApplicationDenied", "LoanDisbursed"]:
        loan_applications_state.pop(loan_id, None)
    else:
        loan_applications_state[loan_id] = updated_state

    # Data to emit includes both the new event and the updated state
    data_to_emit = {
        'updated_state': updated_state,
        'new_event': event_data,
        'es_headers': es_headers  # Optionally include if you need to display these in the UI
    }
    socketio.emit('update_state', data_to_emit, broadcast=True)
 
    return jsonify({"message": "Event received"}), 200

# ESDB Connector management routes/functionality below
ESDB_USER = 'admin'
ESDB_PASS = 'changeit'
ESDB_URL = 'http://localhost:2113'

# Utility function for ESDB requests
def esdb_request(method, endpoint, data=None):
    url = f"{ESDB_URL}/{endpoint}"
    auth = HTTPBasicAuth(ESDB_USER, ESDB_PASS)
    headers = {'Content-Type': 'application/json'}
    response = requests.request(method, url, auth=auth, headers=headers, json=data, verify=False)
    return response

@app.route('/api/connector', methods=['POST'])
def create_connector():
    data = request.get_json()
    connector_name = data.get('id')
    sink_url = data.get('Sink')
    
    payload = {
        "Sink": sink_url
    }
    
    response = esdb_request('POST', f'connectors/{connector_name}', data=payload)
    
    if response.ok:
        return Response(response.content, status=response.status_code, mimetype='application/json')
    else:
        error_message = response.json().get('Message', 'Failed to create connector')
        return jsonify({"error": error_message}), response.status_code


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