# Hermes WebUI + OpenUI Chat Preview — Phase 1

Optional, read-only OpenUI renderer for the **existing** Hermes WebUI chat.
Messages, provider/model selection, Skills, Memory, server tools, approvals
and session execution remain owned by Hermes WebUI.

## Implemented

- Detects finished fenced OpenUI Lang blocks in the existing message transcript.
- Displays the generated UI in a sandboxed iframe using Thesys OpenUI.
- Preserves a reversible View source option and reacts to DOM rerenders.
- Uses bounded payload sizes and does not forward any UI action to Hermes.

## Not implemented

Automatic model prompting / GenUI generation, typed persisted UI parts,
token-by-token UI streaming, bidirectional actions, server-side action validation
and production browser/LLM integration testing. **This is a PoC, not full GenUI.**

## Enable

From the checkout root on the **Hermes WebUI server**:

    bash integrations/openui-preview/scripts/install-vendor.sh

The script downloads pinned \`@openuidev/browser-bundle@0.2.1\` assets.
Review license notices / SHA256SUMS before redistribution. The extension
loads those files locally, rather than loading CDN scripts in user browsers.

Set these environment variables in the Hermes WebUI service, then restart:

    HERMES_WEBUI_EXTENSION_DIR=/absolute/path/to/hermes-webui/integrations/openui-preview
    HERMES_WEBUI_EXTENSION_MANIFEST=extensions.json

Retain your normal password/auth configuration; if exposing the server
through Cloudflare/Tailscale, keep WebUI authentication enabled.
Where another extension directory is configured, copy/merge this manifest
and its assets into that directory instead of replacing existing extensions.

## Try an OpenUI block

Ask Hermes for an OpenUI Lang fenced code block. For a minimal example:

    ```openui
    root = TextContent("Hello from Hermes OpenUI")
    ```

OpenUI component syntax and availability depend on the pinned component
catalog. Incompatible syntax falls back to the View source control.

## Design and trust

The parent adapter observes \`#msgInner\` and recognizes \`language-openui\`
and \`language-openui-lang\` code elements. The preview uses
\`sandbox=allow-scripts\` with **no** \`allow-same-origin\`, top navigation,
form submission, cookie access or agent action bridge.
The existing Hermes transcript stores the original fenced text; iframe UI
state is not independently persisted. Refresh reconstructs the preview.

Do not let model-generated buttons or JS invoke host commands, files, or
authenticated APIs. A future interactive implementation requires explicit
per-session ownership, authorization, CSRF checks and user approvals.

See: https://github.com/nesquena/hermes-webui/blob/master/docs/EXTENSIONS.md
OpenUI browser bundle: https://github.com/thesysdev/openui/tree/main/packages/browser-bundle
