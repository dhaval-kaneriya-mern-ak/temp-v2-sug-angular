# SugAngular - Micro-Frontend Application

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

A sophisticated Angular micro-frontend application built with **Nx**, **Module Federation**, and **Angular 20**. This project demonstrates modern micro-frontend architecture patterns with a host application that orchestrates multiple independent micro-applications.

## 🏗️ Architecture Overview

This is a **Module Federation** based micro-frontend architecture consisting of:

- **Host Application** (`host`) - The host application that loads and orchestrates all micro-frontends
- **Messages Application** (`messages`) - Handles messaging functionality (compose, drafts, sent, schedule)
- **Reports Application** (`reports`) - Manages reporting features (payments, signups, volunteers, state)

### Module Federation Setup

- **Host**: `host` - Consumes remote modules
- **Remotes**: `messages` and `reports` - Expose their route modules to the host

## 📁 Project Structure

```
sug-angular/
├── apps/
│   ├── host/              # Host application (Module Federation Host)
│   │   ├── src/
│   │   │   └── app/
│   │   │       ├── components/
│   │   │       └── app.routes.ts
│   │   └── module-federation.config.ts
│   ├── messages/           # Messages micro-frontend (Remote)
│   │   ├── src/
│   │   │   └── app/
│   │   │       ├── components/
│   │   │       │   ├── compose/
│   │   │       │   ├── dashboard/
│   │   │       │   ├── draft/
│   │   │       │   ├── schedule/
│   │   │       │   └── sent/
│   │   │       └── remote-entry/
│   │   └── module-federation.config.ts
│   └── reports/            # Reports micro-frontend (Remote)
│       ├── src/
│       │   └── app/
│       │       ├── components/
│       │       │   ├── payment/
│       │       │   ├── signup/
│       │       │   ├── state/
│       │       │   └── volunteers/
│       │       └── remote-entry/
│       └── module-federation.config.ts
├── ssl-certs/              # HTTPS certificates for local development
├── nx.json                 # Nx workspace configuration
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18.16.9 or higher)
- **npm** or **yarn**
- **Angular CLI** (v20.1.0)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd sug-angular
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

   > **📝 Note: @lumaverse/sug-ui Component Library**
   >
   > This project uses the **@lumaverse/sug-ui** component library which requires authentication to access. Before running the project, you need to:
   >
   > 1. **Generate a GitHub Personal Access Token** with package read permissions
   > 2. **Create a `.npmrc` file** in your project root with the token configuration
   >
   > **Complete installation instructions are available at:**  
   > 📖 [https://github.com/lumaverse/signupgenius-ui-resources/blob/main/INSTALLATION.md](https://github.com/lumaverse/signupgenius-ui-resources/blob/main/INSTALLATION.md)
   >
   > ⚠️ **Important**: Without proper authentication setup, the npm install will fail when trying to access the @lumaverse/sug-ui package.

3. **Start development servers**

   **Option 1: Start all applications together**

   ```bash
   npm run dev:all
   ```

   **Option 2: Start applications individually**

   ```bash
   # Terminal 1 - Host (Host)
   npm run dev:host

   # Terminal 2 - Messages
   npm run dev:messages

   # Terminal 3 - Reports
   npm run dev:reports
   ```

### Development URLs

- **Host Application**: http://localhost:4200
- **Messages Application**: http://localhost:4201
- **Reports Application**: http://localhost:4202

### HTTPS Development

This project supports HTTPS development with custom domains for production-like testing. Follow the setup instructions below for your operating system.

#### 🔐 HTTPS Setup Instructions

##### Prerequisites

Before setting up HTTPS, you need to install `mkcert` and generate SSL certificates.

##### Step 1: Install mkcert

**macOS (using Homebrew):**

```bash
brew install mkcert
```

**Windows (using Chocolatey):**

```bash
choco install mkcert
```

**Windows (using Scoop):**

```bash
scoop bucket add extras
scoop install mkcert
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt install libnss3-tools
curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
chmod +x mkcert-v*-linux-amd64
sudo cp mkcert-v*-linux-amd64 /usr/local/bin/mkcert
```

**Linux (Using Go - Alternative):**

```bash
go install filippo.io/mkcert@latest
```

##### Step 2: Install mkcert Root Certificate

Install the local CA (Certificate Authority) in your system's trust store:

```bash
mkcert -install
```

This creates and installs a local certificate authority that your browser will trust.

##### Step 3: Create SSL Certificates Directory

Create a directory to store your SSL certificates:

```bash
mkdir ssl-certs
cd ssl-certs
```

##### Step 4: Generate SSL Certificates

Generate certificates for the custom domains used in this project:

```bash
mkcert "*.sug.rocks" localhost 127.0.0.1 ::1
```

This creates a wildcard certificate for:

- `*.sug.rocks` (covers host.sug.rocks, messages.sug.rocks, reports.sug.rocks)
- `localhost`
- `127.0.0.1` (IPv4 loopback)
- `::1` (IPv6 loopback)

##### Step 5: Rename Certificate Files

For consistency, rename the generated certificate files:

```bash
# macOS/Linux
mv "_wildcard.sug.rocks+3.pem" "sug-rocks.crt"
mv "_wildcard.sug.rocks+3-key.pem" "sug-rocks.key"
```

```powershell
# Windows (PowerShell)
Rename-Item "_wildcard.sug.rocks+3.pem" "sug-rocks.crt"
Rename-Item "_wildcard.sug.rocks+3-key.pem" "sug-rocks.key"
```

##### Step 6: Update Hosts File

Add the custom domains to your system's hosts file:

**macOS/Linux:**

```bash
echo "127.0.0.1 host.sug.rocks messages.sug.rocks reports.sug.rocks" | sudo tee -a /etc/hosts
```

**Windows (Run as Administrator):**

```powershell
Add-Content -Path C:\Windows\System32\drivers\etc\hosts -Value "127.0.0.1 host.sug.rocks messages.sug.rocks reports.sug.rocks"
```

Or manually edit the hosts file:

- **macOS/Linux**: `/etc/hosts`
- **Windows**: `C:\Windows\System32\drivers\etc\hosts`

Add this line:

```
127.0.0.1 host.sug.rocks messages.sug.rocks reports.sug.rocks
```

##### Step 7: Verify Setup

Test that the domains resolve correctly:

```bash
ping host.sug.rocks
```

You should see responses from `127.0.0.1`.

#### 🚀 Running with HTTPS

Once the certificates are set up, start the applications with HTTPS:

```bash
# Start all applications with HTTPS
npm run dev:all:https

# Or individually
npm run dev:host:https
npm run dev:messages:https
npm run dev:reports:https
```

#### 🌐 HTTPS URLs

After setup, access your applications via:

- **Host Application**: https://host.sug.rocks:4200
- **Messages Application**: https://messages.sug.rocks:4202
- **Reports Application**: https://reports.sug.rocks:4201

#### 🔧 Certificate Management

**Certificate Location:**

```
ssl-certs/
├── sug-rocks.crt    # SSL certificate
└── sug-rocks.key    # Private key
```

**Certificate Expiration:**

- mkcert certificates expire after 10 years
- To check expiration: `openssl x509 -in ssl-certs/sug-rocks.crt -text -noout | grep "Not After"`

**Regenerating Certificates:**
If you need to regenerate certificates:

```bash
cd ssl-certs
rm sug-rocks.crt sug-rocks.key
mkcert "*.sug.rocks" localhost 127.0.0.1 ::1
mv "_wildcard.sug.rocks+3.pem" "sug-rocks.crt"
mv "_wildcard.sug.rocks+3-key.pem" "sug-rocks.key"
```

#### 🛠️ Troubleshooting HTTPS

**Common Issues:**

1. **Certificate Not Trusted**

   - Ensure `mkcert -install` was run successfully
   - Restart your browser after installing the root CA
   - Check browser security settings

2. **Domain Not Resolving**

   - Verify hosts file was updated correctly
   - Clear DNS cache:
     - **macOS**: `sudo dscacheutil -flushcache`
     - **Windows**: `ipconfig /flushdns`
     - **Linux**: `sudo systemctl restart systemd-resolved`

3. **Permission Errors**

   - Ensure SSL certificates have correct permissions
   - Run certificate generation with appropriate user permissions

4. **Module Federation Issues with HTTPS**
   - Ensure all apps are running with HTTPS configuration
   - Check browser console for mixed content warnings
   - Verify CORS headers are properly configured

**Browser Trust Issues:**

- Chrome: Go to `chrome://settings/security` and check certificate settings
- Firefox: Go to `about:preferences#privacy` and view certificates
- Safari: Check Keychain Access for the mkcert root certificate

## 🔧 Available Scripts

### Development

| Script                  | Description                         |
| ----------------------- | ----------------------------------- |
| `npm run dev`           | Start host application (default)    |
| `npm run dev:host`      | Start host application only         |
| `npm run dev:messages`  | Start messages application only     |
| `npm run dev:reports`   | Start reports application only      |
| `npm run dev:all`       | Start all applications concurrently |
| `npm run dev:all:https` | Start all applications with HTTPS   |

### Building

| Script                   | Description                     |
| ------------------------ | ------------------------------- |
| `npm run build`          | Build host application          |
| `npm run build:all`      | Build all applications          |
| `npm run build:host`     | Build host application only     |
| `npm run build:messages` | Build messages application only |
| `npm run build:reports`  | Build reports application only  |

### Testing

| Script                  | Description                                  |
| ----------------------- | -------------------------------------------- |
| `npm run test`          | Run tests for all applications               |
| `npm run test:host`     | Run host application tests                   |
| `npm run test:messages` | Run messages application tests               |
| `npm run test:reports`  | Run reports application tests                |
| `npm run test:ci`       | Run tests with CI configuration and coverage |

### Code Quality

| Script               | Description                        |
| -------------------- | ---------------------------------- |
| `npm run lint`       | Lint all applications              |
| `npm run lint:fix`   | Lint and auto-fix all applications |
| `npm run format`     | Check code formatting              |
| `npm run format:fix` | Auto-fix code formatting           |
| `npm run format:all` | Format and lint fix everything     |
| `npm run check:all`  | Run formatting and linting checks  |

### Production & Preview

| Script                | Description                         |
| --------------------- | ----------------------------------- |
| `npm run preview`     | Preview built host application      |
| `npm run preview:all` | Preview all built applications      |
| `npm run ci:build`    | CI build command                    |
| `npm run ci:all`      | Complete CI pipeline (lint + build) |

### Nx Utilities

| Script                   | Description                 |
| ------------------------ | --------------------------- |
| `npm run dep-graph`      | View dependency graph       |
| `npm run clean`          | Reset Nx cache              |
| `npm run affected:build` | Build affected applications |
| `npm run affected:test`  | Test affected applications  |
| `npm run affected:lint`  | Lint affected applications  |

## 🏗️ Development Workflow

### 1. **Understanding Module Federation**

- The **host** app is the host that loads remote modules
- **messages** and **reports** are remote applications that expose routes
- Each remote app can be developed and deployed independently
- The host dynamically loads remote modules at runtime

### 2. **Adding New Features**

**To add a new component to Messages app:**

```bash
npx nx g @nx/angular:component new-feature --project=messages --path=apps/messages/src/app/components
```

**To add a new component to Reports app:**

```bash
npx nx g @nx/angular:component new-feature --project=reports --path=apps/reports/src/app/components
```

**To add a new service:**

```bash
npx nx g @nx/angular:service shared/my-service --project=host
```

### 3. **Testing Strategy**

- **Unit Tests**: Each application has its own test suite
- **Integration Tests**: Test module federation integration
- **E2E Tests**: Test complete user workflows across micro-frontends

```bash
# Run specific tests
npm run test:host
npm run test:messages
npm run test:reports

# Run all tests
npm run test

# Run tests with coverage
npm run test:ci
```

### Reports Application (Remote)

```typescript
// apps/reports/module-federation.config.ts
const config: ModuleFederationConfig = {
  name: 'reports',
  exposes: {
    './Routes': 'apps/reports/src/app/remote-entry/entry.routes.ts',
  },
};
```

## 🛠️ Tech Stack

| Technology            | Version | Purpose                           |
| --------------------- | ------- | --------------------------------- |
| **Angular**           | ~20.1.0 | Frontend framework                |
| **Nx**                | 21.3.11 | Monorepo tooling and build system |
| **Module Federation** | ~0.17.0 | Micro-frontend orchestration      |
| **TypeScript**        | ~5.8.2  | Type-safe development             |
| **Vite**              | ^6.0.0  | Fast build tool and dev server    |
| **Vitest**            | ^3.0.0  | Unit testing framework            |
| **ESLint**            | ^9.8.0  | Code linting                      |
| **Prettier**          | ^2.6.2  | Code formatting                   |
| **Husky**             | ^9.1.7  | Git hooks                         |

## 🔐 HTTPS Development

This project includes comprehensive HTTPS support for local development with custom domains.

**Key Features:**

- Custom domains (`host.sug.rocks`, `messages.sug.rocks`, `reports.sug.rocks`)
- Wildcard SSL certificates for development
- Production-like testing environment
- Proper CORS configuration for cross-domain communication

**Certificate Location:**

```
ssl-certs/
├── sug-rocks.crt    # SSL certificate (wildcard for *.sug.rocks)
├── sug-rocks.key    # Private key
└── .gitignore       # Certificates are excluded from version control
```

See the [HTTPS Development](#-https-development) section above for complete setup instructions.

## 📈 Performance Considerations

### Module Federation Benefits

- **Independent Deployment**: Each micro-frontend can be deployed separately
- **Team Autonomy**: Different teams can work on different applications
- **Technology Diversity**: Each app can use different versions of libraries
- **Lazy Loading**: Remote modules are loaded on-demand
- **Shared Dependencies**: Common libraries are shared to reduce bundle size

### Build Optimization

- **Tree Shaking**: Unused code is automatically removed
- **Code Splitting**: Applications are split into smaller chunks
- **Caching**: Nx provides intelligent build caching
- **Parallel Execution**: Tasks run in parallel when possible

## 🚨 Troubleshooting

### Common Issues

**1. Module Federation Loading Errors**

```bash
# Ensure all applications are running
npm run dev:all

# Check for port conflicts
netstat -an | grep LISTEN | grep :420
```

**2. Build Failures**

```bash
# Clear Nx cache
npm run clean

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**3. HTTPS Certificate Issues**

- Ensure certificates in `ssl-certs/` are valid
- Trust the certificate in your browser/system
- Check certificate permissions

**4. Linting Errors**

```bash
# Auto-fix most linting issues
npm run lint:fix

# Check and fix formatting
npm run format:all
```

### Development Tips

1. **Use Nx Console**: Install the VS Code extension for better DX
2. **Dependency Graph**: Run `npm run dep-graph` to visualize dependencies
3. **Affected Commands**: Use `nx affected` to only test/build changed code
4. **Component Generation**: Always use Nx generators for consistency

## 🤝 Contributing

### Code Standards

- Follow Angular style guide
- Use TypeScript strict mode
- Write unit tests for new features
- Follow conventional commit messages
- Ensure all linting passes

### Pre-commit Hooks

The project uses Husky and lint-staged to enforce:

- Code formatting (Prettier)
- Linting (ESLint)
- Type checking (TypeScript)

### Pull Request Process

1. Create feature branch from `main`
2. Implement changes with tests
3. Run `npm run check:all` to verify quality
4. Submit PR with clear description
5. Ensure CI passes

## � Scaling the Architecture

### Adding New Host Applications

To create a new host application that can consume remote modules:

#### Step 1: Generate New Host Application

```bash
# Generate a new Angular application with Module Federation host setup
npx nx g @nx/angular:host my-new-host --routing=true --style=scss

# Alternative: Generate with specific configurations
npx nx g @nx/angular:host my-new-host \
  --routing=true \
  --style=scss \
  --prefix=myapp \
  --port=4300 \
  --remotes=existing-remote1,existing-remote2
```

#### Step 2: Configure Module Federation

Update the generated `apps/my-new-host/module-federation.config.ts`:

```typescript
import { ModuleFederationConfig } from '@nx/module-federation';

const config: ModuleFederationConfig = {
  name: 'my-new-host',
  remotes: [
    'messages', // Existing remote
    'reports', // Existing remote
    'new-remote', // New remote you'll create
  ],
};

export default config;
```

#### Step 3: Add Development Scripts

Update `package.json` with new scripts:

```json
{
  "scripts": {
    "dev:my-new-host": "nx serve my-new-host",
    "dev:my-new-host:https": "nx serve my-new-host --configuration=https",
    "build:my-new-host": "nx build my-new-host"
  }
}
```

#### Step 4: Configure HTTPS (Optional)

Add HTTPS configuration to `apps/my-new-host/project.json`:

```json
{
  "serve": {
    "configurations": {
      "https": {
        "buildTarget": "my-new-host:build:development",
        "port": 4300,
        "host": "my-new-host.sug.rocks",
        "publicHost": "https://my-new-host.sug.rocks:4300",
        "ssl": true,
        "sslCert": "../../ssl-certs/sug-rocks.crt",
        "sslKey": "../../ssl-certs/sug-rocks.key"
      }
    }
  }
}
```

Don't forget to add the new domain to your hosts file:

```bash
echo "127.0.0.1 my-new-host.sug.rocks" | sudo tee -a /etc/hosts
```

### Adding New Remote Applications

To create a new remote application that exposes modules to host applications:

#### Step 1: Generate New Remote Application

```bash
# Generate a new Angular remote application
npx nx g @nx/angular:remote my-new-remote --routing=true --style=scss --host=host

# Alternative: Generate with specific configurations
npx nx g @nx/angular:remote my-new-remote \
  --routing=true \
  --style=scss \
  --prefix=myapp \
  --port=4203 \
  --host=host
```

#### Step 2: Configure Module Federation

The generated `apps/my-new-remote/module-federation.config.ts` should look like:

```typescript
import { ModuleFederationConfig } from '@nx/module-federation';

const config: ModuleFederationConfig = {
  name: 'my-new-remote',
  exposes: {
    './Routes': 'apps/my-new-remote/src/app/remote-entry/entry.routes.ts',
    // Add more exposed modules as needed
    './Components': 'apps/my-new-remote/src/app/components/index.ts',
    './Services': 'apps/my-new-remote/src/app/services/index.ts',
  },
};

export default config;
```

#### Step 3: Update Host Application

Add the new remote to the host's module federation config:

```typescript
// apps/host/module-federation.config.ts (for HTTP)
const config: ModuleFederationConfig = {
  name: 'host',
  remotes: ['reports', 'messages', 'my-new-remote'], // Add new remote
};

// apps/host/module-federation.https.config.ts (for HTTPS)
const config: ModuleFederationConfig = {
  name: 'host',
  remotes: [
    ['reports', 'https://reports.sug.rocks:4201'],
    ['messages', 'https://messages.sug.rocks:4202'],
    ['my-new-remote', 'https://my-new-remote.sug.rocks:4203'], // Add new remote
  ],
};
```

#### Step 4: Add Development Scripts

Update `package.json`:

```json
{
  "scripts": {
    "dev:my-new-remote": "nx serve my-new-remote",
    "dev:my-new-remote:https": "nx serve my-new-remote --configuration=https",
    "build:my-new-remote": "nx build my-new-remote",
    "dev:all": "concurrently \"npm run dev:host\" \"npm run dev:messages\" \"npm run dev:reports\" \"npm run dev:my-new-remote\"",
    "dev:all:https": "concurrently \"npm run dev:host:https\" \"npm run dev:messages:https\" \"npm run dev:reports:https\" \"npm run dev:my-new-remote:https\""
  }
}
```

#### Step 5: Configure HTTPS for Remote

Add HTTPS configuration to `apps/my-new-remote/project.json`:

```json
{
  "serve": {
    "configurations": {
      "https": {
        "buildTarget": "my-new-remote:build:development",
        "port": 4203,
        "host": "my-new-remote.sug.rocks",
        "publicHost": "https://my-new-remote.sug.rocks:4203",
        "ssl": true,
        "sslCert": "../../ssl-certs/sug-rocks.crt",
        "sslKey": "../../ssl-certs/sug-rocks.key",
        "headers": {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      }
    },
    "dependsOn": ["host:serve"]
  }
}
```

Add the new domain to your hosts file:

```bash
echo "127.0.0.1 my-new-remote.sug.rocks" | sudo tee -a /etc/hosts
```

### Advanced Module Federation Patterns

#### Creating Shared Libraries

Create shared libraries that can be consumed by multiple applications:

```bash
# Generate a shared library
npx nx g @nx/angular:lib shared-ui --buildable=true

# Generate a shared service library
npx nx g @nx/angular:lib shared-services --buildable=true

# Generate components, services, etc. in the shared library
npx nx g @nx/angular:component button --project=shared-ui
npx nx g @nx/angular:service api --project=shared-services
```

#### Exposing Shared Libraries

Update remote's module federation config to expose shared libraries:

```typescript
const config: ModuleFederationConfig = {
  name: 'my-new-remote',
  exposes: {
    './Routes': 'apps/my-new-remote/src/app/remote-entry/entry.routes.ts',
    './SharedUI': 'libs/shared-ui/src/index.ts',
    './SharedServices': 'libs/shared-services/src/index.ts',
  },
};
```

#### Dynamic Module Loading

For advanced scenarios, you can load modules dynamically:

```typescript
// In your host application component
async loadRemoteModule() {
  const { ComponentModule } = await import('my-new-remote/Components');
  // Use the dynamically loaded module
}
```

### Best Practices for Scaling

#### 1. **Naming Conventions**

- **Hosts**: Use descriptive names like `admin-host`, `customer-portal`, `dashboard-host`
- **Remotes**: Use feature-based names like `user-management`, `billing`, `analytics`
- **Ports**: Use logical port sequences (4200-4299 for hosts, 4300-4399 for remotes)

#### 2. **Module Federation Structure**

```
apps/
├── hosts/                 # Host applications
│   ├── admin-shell/       # Admin interface host
│   ├── customer-shell/    # Customer interface host
│   └── mobile-shell/      # Mobile interface host
├── remotes/               # Remote applications
│   ├── user-management/   # User-related features
│   ├── billing/           # Billing features
│   ├── analytics/         # Analytics features
│   └── notifications/     # Notification features
└── shared/                # Shared libraries
    ├── ui-components/     # Reusable UI components
    ├── services/          # Shared services
    └── models/            # Data models
```

#### 3. **Development Workflow**

```bash
# Start specific micro-frontend stack
npm run dev:admin-stack    # Admin shell + related remotes
npm run dev:customer-stack # Customer shell + related remotes

# Start all applications
npm run dev:all            # All hosts and remotes

# Build specific applications
npm run build:admin-stack
npm run build:customer-stack
```

#### 4. **HTTPS Domain Strategy**

For multiple applications, use subdomain patterns:

```
# Admin applications
admin.sug.rocks:4200        # Admin shell
admin-users.sug.rocks:4301  # User management remote
admin-billing.sug.rocks:4302 # Billing remote

# Customer applications
app.sug.rocks:4201          # Customer shell
app-profile.sug.rocks:4303  # Profile remote
app-dashboard.sug.rocks:4304 # Dashboard remote
```

## �📚 Additional Resources

### Nx Documentation

- [Nx Angular Tutorial](https://nx.dev/getting-started/tutorials/angular-monorepo-tutorial)
- [Module Federation with Nx](https://nx.dev/recipes/module-federation)
- [Nx Console Extension](https://nx.dev/getting-started/editor-setup)

### Module Federation Resources

- [Module Federation Docs](https://module-federation.github.io/)
- [Webpack Module Federation](https://webpack.js.org/concepts/module-federation/)

### Angular Resources

- [Angular Documentation](https://angular.io/docs)
- [Angular CLI](https://angular.io/cli)
- [Angular Style Guide](https://angular.io/guide/styleguide)
  // Test change to trigger hooks

## 📌 Dependency Pinning and Module Federation Notes

This section documents the dependency pinning we applied, why it was required, and how to upgrade safely later.

### What broke

- After regenerating the lockfile, dev servers failed with:
  - `compiler.__internal__registerBuiltinPlugin is not a function`
- Cause: transitive upgrades pulled a Module Federation/Rspack/Webpack combination that routed Nx’s MF through an Rspack-only plugin while Angular builders used Webpack, breaking startup of static remotes.

### What we pinned (exact)

- Angular core (20.1.6): `@angular/common`, `@angular/compiler`, `@angular/core`, `@angular/forms`, `@angular/router`, `@angular/platform-browser`
- Angular toolchain:
  - 20.1.5: `@angular/cli`, `@angular/build`, `@angular-devkit/build-angular`, `@angular-devkit/core`, `@angular-devkit/schematics`, `@schematics/angular`
  - 20.1.6: `@angular/compiler-cli`, `@angular/language-service`
- Extras: `rxjs@7.8.2`, `zone.js@0.15.1`
- Nx MF/Webpack: `@nx/module-federation@21.3.11`, `@nx/webpack@21.3.11`

### npm overrides (to freeze transitive deps)

- `@module-federation/node: 2.7.12`
- `@module-federation/enhanced: 0.17.1`
- `@rspack/core: 1.4.11`
- `webpack: 5.99.9`

Note: if a package is also a direct dependency, it must match the override or npm throws `EOVERRIDE`.

### Why we pinned

- Patch drift within 20.1.x pulled newer MF/Rspack/Webpack internals that triggered the Rspack-only plugin path and the startup error.
- Pinning restores the Webpack-based MF integration used by Angular builders/Nx and keeps dev stable.

### Repro-safe install

- Normal: `npm install`
- Clean rebuild (only when intentionally changing pins):
  - `rm -rf node_modules package-lock.json`
  - `npm install`
- Avoid `--force` / `--legacy-peer-deps` in normal operation.

### Safe upgrade playbook

1. Decide scope (e.g., Angular 20.1.x patch, Nx MF minor, MF libs).
2. Relax/remove one pin/override at a time.
3. `npm install` → `npm run dev:all` → verify remotes start.
4. If the MF error returns, revert that single change and note the incompatibility.
5. Commit `package.json` + `package-lock.json` together once stable.

### Troubleshooting

- Error `compiler.__internal__registerBuiltinPlugin is not a function`:
  - Check `package.json` overrides are present and aligned with any direct dependencies.
  - Verify versions above are installed.
  - Ensure `@nx/module-federation` and `@nx/webpack` are `21.3.11`.
