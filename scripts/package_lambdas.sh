#!/bin/bash
set -e

FUNCTIONS=(event_create event_get event_list registration_create registration_get registration_list)
mkdir -p infrastructure/packages

for FUNC in "${FUNCTIONS[@]}"; do
  echo "Packaging $FUNC..."
  cd functions/$FUNC
  pip install -r requirements.txt -t ./package --quiet
  cp handler.py ./package/
  cd package && zip -r ../../../infrastructure/packages/${FUNC}.zip . --quiet
  cd .. && rm -rf package && cd ../..
  echo "$FUNC packaged."
done

echo "All packages created in infrastructure/packages/"
