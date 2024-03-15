from flask import Flask, request, jsonify, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
socketio = SocketIO(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/raw-events')
def raw_events():
    return render_template('events_raw.html')

@app.route('/event', methods=['POST'])
def handle_event():
    event_data = request.json
    # Extract headers starting with 'es-'
    print("Received Headers:")
    for header, value in request.headers.items():
        print(f"{header}: {value}")
    es_headers = {key: value for key, value in request.headers.items() if key.startswith('Es-')}
    # print("ES Headers:", es_headers) 
    # Include these headers in the data to be emitted
    data_to_emit = {
        'event_data': event_data,
        'es_headers': es_headers
    }
    socketio.emit('event', data_to_emit, broadcast=True)
    return jsonify(success=True), 200

@socketio.on('connect')
def test_connect():
    print('Client connected')

@socketio.on('disconnect')
def test_disconnect():
    print('Client disconnected')

if __name__ == '__main__':
    socketio.run(app, debug=True)