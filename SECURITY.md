# Security Policy

## Supported Versions

Only the latest released version is supported for security fixes.

## Reporting A Vulnerability

Please do not open public issues with secrets, API keys, cookies, private Home Assistant URLs, or unredacted diagnostics.

For now, report security-sensitive findings privately to the repository owner. Once GitHub private vulnerability reporting is enabled for the public repository, use that channel.

## Sensitive Data

The integration stores the BOM SWS API key in Home Assistant config entry data and keeps BOM API calls in the backend. The bundled Lovelace card must not require or expose a BOM SWS API key.

Diagnostics are designed to redact the BOM SWS API key and common credential fields. If you find a redaction gap, treat it as security-sensitive.
