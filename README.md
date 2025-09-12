# Expo GitHub Actions

A collection of reusable GitHub Actions for Expo projects.

## Actions

### setup-node

Setup Node.js with caching for Expo projects.

```yaml
- uses: expo/actions/setup-node@main
  with:
    node-version: '18'  # optional, default: '18'
    cache: 'true'       # optional, default: 'true'
```

### setup-expo

Setup Expo CLI and EAS CLI with authentication.

```yaml
- uses: expo/actions/setup-expo@main
  with:
    expo-version: 'latest'    # optional, default: 'latest'
    eas-version: 'latest'     # optional, default: 'latest'
    expo-token: ${{ secrets.EXPO_TOKEN }}  # optional
    expo-cache: 'true'        # optional, default: 'true'
```

### build-app

Build Expo applications using EAS Build or local builds.

```yaml
- uses: expo/actions/build-app@main
  with:
    platform: 'all'          # optional, default: 'all' (ios, android, all)
    profile: 'development'    # optional, default: 'development'
    local: 'false'           # optional, default: 'false'
    working-directory: '.'    # optional, default: '.'
```

### test-app

Run tests for Expo applications with coverage support.

```yaml
- uses: expo/actions/test-app@main
  with:
    test-command: 'npm test'     # optional, default: 'npm test'
    working-directory: '.'       # optional, default: '.'
    coverage: 'false'           # optional, default: 'false'
    coverage-reporter: 'lcov'   # optional, default: 'lcov'
```

### deploy-app

Deploy Expo applications using EAS Submit or Expo publish.

```yaml
- uses: expo/actions/deploy-app@main
  with:
    platform: 'web'            # optional, default: 'web' (ios, android, web)
    channel: 'default'         # optional, default: 'default'
    submit: 'false'           # optional, default: 'false'
    working-directory: '.'     # optional, default: '.'
```

## Example Workflow

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: expo/actions/setup-node@main
        with:
          node-version: '18'
          
      - name: Setup Expo
        uses: expo/actions/setup-expo@main
        with:
          expo-token: ${{ secrets.EXPO_TOKEN }}
          
      - name: Run tests
        uses: expo/actions/test-app@main
        with:
          coverage: 'true'
          
  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: expo/actions/setup-node@main
        
      - name: Setup Expo
        uses: expo/actions/setup-expo@main
        with:
          expo-token: ${{ secrets.EXPO_TOKEN }}
          
      - name: Build app
        uses: expo/actions/build-app@main
        with:
          platform: 'all'
          profile: 'production'
```

## Contributing

Please read our contributing guidelines before submitting pull requests.

## License

MIT