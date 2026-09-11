#!/bin/zsh
# Publier.command — double-clic pour lancer le serveur de publication du placard
# Ne nécessite pas de terminal : Finder → double-clic
DIR="$(cd "$(dirname "$0")" && pwd)"
exec node "$DIR/tools/publish-server.mjs"
