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
- EventStoreDB, currently the commercial version is needed since connectors are in "private preview" however, it is expected that the http connector (webhook) will be available in open source soon.

### Installation

1. Clone the repository and navigate into the project directory.
2. Create a virtual environment: `python -m venv venv` and activate it.
3. Install dependencies: `pip install -r requirements.txt`.
4. Install EventStoreDB (see eventstore.com for installation instructions for your platform).

### Setup the ESDB connector

1. Start ESDB locally if it is not already started.
2. Navigate to the project directory, run `./scripts/setup_connector.sh` to setup the loan-apps-demo connector in ESDB.

### Running the Application

1. Start ESDB locally if it is not already started.
2. Start the Flask application: `python src/main.py`.
3. In a separate terminal, run the event generator script: `python src/event_generator.py`.

For detailed instructions and more information, please refer to the individual files and scripts provided within the project structure.
