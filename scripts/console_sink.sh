#!/bin/bash

# The URL where EventStoreDB is running
EVENTSTOREDB_URL="http://localhost:2113"

# The connector name
CONNECTOR_NAME="loanapp-connector-demo"

# EventStoreDB admin credentials
USERNAME="admin"
PASSWORD="changeit"

# JSON configuration for the connector with a console sink
JSON_CONFIG=$(cat <<EOF
{
  "Sink": "console://"
}
EOF
)

# Create or update the connector
curl -i \
  -H "Content-Type: application/json" \
  -u "$USERNAME:$PASSWORD" \
  -d "$JSON_CONFIG" \
  "$EVENTSTOREDB_URL/connectors/$CONNECTOR_NAME" \
  -k

echo "Connector setup completed."
