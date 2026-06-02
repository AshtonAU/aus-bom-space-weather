# Contributing

Thanks for helping improve AUS BOM Space Weather.

## Before Opening An Issue

- Confirm you are using the latest release.
- Restart Home Assistant after updating the integration.
- Hard refresh the dashboard or mobile app webview if the Lovelace card still looks old.

## Bug Reports

Include:

- Home Assistant version.
- Integration version.
- Browser or Home Assistant mobile app version.
- The card YAML, with secrets removed.
- Relevant Home Assistant logs.
- Diagnostics download from the integration when the issue involves API data.

Do not include BOM SWS API keys, cookies, private URLs, or full unredacted payload captures.

## Development

```bash
npm install
npm run build
```

The built Lovelace card is committed under `custom_components/aus_bom_space_weather/www/` so HACS can install the integration directly from the repository.
