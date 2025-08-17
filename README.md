# The Courier (clca-courier)

The Courier @ Conashaugh Lakes.com

## 🚨 CRITICAL DEVELOPMENT RULES

### NEVER DO THESE (USER ENFORCED)

- ❌ **Hash Mode Routing**: Always use history mode (`/archive` not `/#/archive`)
- ❌ **Hardcoded Data Lists**: No static arrays, JSON files for content, or fake data
- ❌ **Assuming Paths**: Always verify file/directory existence before implementation

### MANDATORY PRACTICES

- ✅ **Dynamic Content Discovery**: Generate content from actual files
- ✅ **Path Verification**: Check existence before referencing
- ✅ **History Mode Only**: Application runs in history mode routing

## ⚠️ Important Development Notes

**Google Drive CORS Limitation:** Google Drive URLs cannot be accessed directly from client-side JavaScript due to CORS policies. See [GOOGLE_DRIVE_INTEGRATION.md](./GOOGLE_DRIVE_INTEGRATION.md) for details and workarounds.

## Install the dependencies

```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
quasar dev
```

### Lint the files

```bash
yarn lint
# or
npm run lint
```

### Format the files

```bash
yarn format
# or
npm run format
```

### Build the app for production

```bash
quasar build
```

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).
