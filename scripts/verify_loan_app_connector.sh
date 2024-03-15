#!/bin/bash

# Set your EventStoreDB credentials
USERNAME="admin"
PASSWORD="changeit"

# Set your EventStoreDB URL
EVENTSTOREDB_URL="http://localhost:2113"

# Set the connector name to search for
CONNECTOR_NAME="loanapp-connector-demo"

# Make a GET request to list all connectors, search for the specific connector, and print a message
response=$(curl -s -u "$USERNAME:$PASSWORD" "$EVENTSTOREDB_URL/connectors/list" | jq .)

if echo "$response" | jq '.[] | select(.id == "'$CONNECTOR_NAME'")' | grep -q "$CONNECTOR_NAME"; then
    echo "Connector '$CONNECTOR_NAME' found."
else
    # Print in red if the connector was not found
    echo -e "\e[31mConnector '$CONNECTOR_NAME' was not found.\e[0m"
fi