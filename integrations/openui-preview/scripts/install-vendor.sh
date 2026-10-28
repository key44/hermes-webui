#!/usr/bin/env bash
set -euo pipefail
# Invoke from the root of a Hermes WebUI checkout.
ROOT="$(pwd)/integrations/openui-preview"
BASE="https://cdn.jsdelivr.net/npm/@openuidev/browser-bundle@0.2.1/dist"
DEST="$ROOT/genui/vendor"
mkdir -p "$DEST"
for file in openui-bundle.min.js openui-styles.css; do
  curl -fL --retry 3 --connect-timeout 15 --proto '=https' --tlsv1.2 "$BASE/$file" -o "$DEST/$file.tmp"
  test -s "$DEST/$file.tmp"
  mv "$DEST/$file.tmp" "$DEST/$file"
done
(cd "$DEST" && sha256sum openui-bundle.min.js openui-styles.css > SHA256SUMS)
echo 'OpenUI 0.2.1 assets installed locally. Review dependency notices before redistribution.'
