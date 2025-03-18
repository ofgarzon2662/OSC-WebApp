# OSC-WebApp

## Recent Updates

In this branch, we have implemented several key features and improvements:

- Added user authentication with reactive forms and validation
- Created a sign-in component with username/password validation
- Implemented "Forgot password" functionality with email contact information
- Fixed navigation and routing to prevent duplicate component rendering
- Improved test coverage for components (reaching 100% for sign-in component)
- Added SonarQube configuration to exclude test files from security hotspots analysis
- Fixed various linter warnings and improved code quality
- Updated Angular to version 19.2.0

This is a web application for Open Science Chain (OSC), developed with [Angular](https://angular.dev/) version 19.2.0.

## Technologies Used

- **Angular 19.2.0**: Frontend development framework
- **Bootstrap**: For responsive design and UI components
- **NgBootstrap**: Bootstrap components implementation for Angular
- **RxJS**: For reactive programming

## Features

- User authentication
- Scientific artifacts visualization
- Workflow exploration
- Responsive and modern interface

## Prerequisites

- Node Version Manager (NVM)
- Node.js version 20.x
- npm (comes with Node.js)
- Angular CLI version 19.x

## Installation Guide

### Step 1: Install NVM (Node Version Manager)

#### For macOS and Ubuntu:

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Activate NVM (or restart your terminal)
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

#### For Windows:

1. Install NVM for Windows from: https://github.com/coreybutler/nvm-windows/releases
2. Download and run the nvm-setup.exe file
3. Follow the installation wizard

### Step 2: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/ofgarzon2662/OSC-WebApp.git

# Navigate to the project directory
cd OSC-WebApp

# Checkout to the develop branch. This branch usually hosts the most current code
git fetch --all
git checkout develop
git pull
```

### Step 3: Set Up Node.js and Angular

```bash
# Install Node.js 20
nvm install 20

# Set it as the default version for all terminals
nvm alias default 20

# Use the newly set default version
nvm use default

# Verify Node.js installation
node -v  # Should show v20.x.x
npm -v   # Should show the npm version

# Install Angular CLI globally
npm install -g @angular/cli@19

# Verify Angular CLI installation
ng version  # Should show Angular CLI: 19.x.x
```

### Step 4: Install Dependencies and Run the Application

```bash
# Make sure you're in the project directory
cd OSC-WebApp

# Install dependencies
npm install

# Start the development server
ng serve
```

### Step 5: Access the Application

Open your browser and navigate to: http://localhost:4200

You should now see the OSC-WebApp running in your browser!

## Development

Run `ng serve` for a development server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code Scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running Unit Tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running End-to-End Tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Code Analysis

This project uses SonarQube for code analysis. Test files (*.spec.ts) are excluded from security hotspots analysis.

## Further Help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
