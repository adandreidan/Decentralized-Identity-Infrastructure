# ──────────────────────────────────────────────────────────────────────────
# did-agent/Dockerfile
#
# Builds the container that runs ACA-Py (Aries Cloud Agent Python) — the
# software that actually understands DIDComm, manages the wallet, and
# performs SSI operations (connections, credentials, proofs, etc).
#
# We deliberately do NOT patch the agent's source code or add custom
# plugins here. Stock upstream ACA-Py already does everything a learning
# project needs — patches/plugins are how production deployments add
# very specific behaviour (multi-tenant routing, mediator quirks, custom
# transports), which is exactly the complexity we're avoiding for now.
# ──────────────────────────────────────────────────────────────────────────

# Official ACA-Py image, published by the OpenWallet Foundation (the group
# that maintains the Aries/ACA-Py project). Pinning an exact tag (rather
# than ":latest") means this build behaves the same way every time you
# run it, even months from now.
FROM ghcr.io/openwallet-foundation/acapy-agent:py3.12-1.3.1

# The base image already creates and runs as a non-root "aries" user —
# we don't need to override that. Just make sure our working directory
# matches where that user's home is, so relative paths behave predictably.
WORKDIR /home/aries

# Document which ports this container expects to use:
#   8020 = inbound DIDComm transport (where other agents reach this one)
#   8021 = admin API (where YOU control this agent via REST calls)
# This line is informational only — the actual port mapping happens in
# docker-compose.yml's `ports:` section.
EXPOSE 8020 8021

# No CMD/ENTRYPOINT override needed: the base image's entrypoint already
# runs the `aca-py` CLI, and docker-compose.yml supplies the exact
# arguments (start --inbound-transport ... etc.) via its `command:` field.
