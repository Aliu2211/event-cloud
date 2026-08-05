#!/bin/bash
set -e

FUNCTIONS=(event_create event_get event_list registration_create registration_get registration_delete registration_list registration_list_all registration_lookup_by_email session_create session_list speaker_create speaker_list speaker_get session_list_by_speaker image_upload_url)
mkdir -p infrastructure/packages

for FUNC in "${FUNCTIONS[@]}"; do
  echo "Packaging $FUNC..."
  cd functions/$FUNC
  python3 -m pip install -r requirements.txt -t ./package --quiet
  cp handler.py ./package/
  cd package && zip -r ../../../infrastructure/packages/${FUNC}.zip . --quiet
  cd .. && rm -rf package && cd ../..
  echo "$FUNC packaged."
done

echo "All packages created in infrastructure/packages/"
