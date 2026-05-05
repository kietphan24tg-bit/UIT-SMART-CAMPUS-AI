#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
PASSWORD_FILE="$SCRIPT_DIR/mosquitto_passwords"
USERNAME="${1:-smartcampus_esp32}"
PASSWORD="${2:-change-me}"

touch "$PASSWORD_FILE"

docker run --rm \
  -v "$PASSWORD_FILE:/mosquitto/config/passwords" \
  eclipse-mosquitto:2 \
  mosquitto_passwd -b /mosquitto/config/passwords "$USERNAME" "$PASSWORD"

echo "Updated $PASSWORD_FILE for user $USERNAME"
