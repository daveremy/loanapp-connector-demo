# Loan Application Connector Demo

This project demonstrates a Flask web application that simulates loan application processing events, leveraging EventStoreDB's new connector preview capability for real-time event streaming and handling.

## Features

- Real-time simulation of loan application events.
- Use of EventStoreDB connectors for event handling.
- Flask-SocketIO for real-time communication between the server and clients.

## Setup

Follow the instructions below to set up the project locally.

### Prerequisites

- Python 3.7 or higher
- EventStoreDB commercial version installed and running with the connector plugin enabled

### Installation

1. Clone the repository and navigate into the project directory.
2. Create a virtual environment: `python -m venv venv` and activate it.
3. Install dependencies: `pip install -r requirements.txt`.

### Running the Application

1. Start the Flask application: `flask run`.
2. In a separate terminal, run the event generator script: `python src/event_generator.py`.

For detailed instructions and more information, please refer to the individual files and scripts provided within the project structure.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
