#!/bin/bash

# The URL where EventStoreDB is running
EVENTSTOREDB_URL="http://localhost:2113"

# The connector name you want to delete
CONNECTOR_NAME="my-connector"

# EventStoreDB admin credentials
USERNAME="admin"
PASSWORD="changeit"

# Delete the connector
curl -i -X DELETE \
  -u "$USERNAME:$PASSWORD" \
  "$EVENTSTOREDB_URL/connectors/$CONNECTOR_NAME" \
  -k

echo "Connector deletion request sent."
