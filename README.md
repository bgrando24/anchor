# Anchor

A website that helps low-income families decide which LGA to relocate to - based on rental affordability and rental stability.

## Setup the project locally

### 1. Prerequisites for your machine

You'll need `node` and `npm` installed on your machine. If you don't already, check out the [npm installation guide here](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

### 2. Clone the repo to your machine

Open your terminal (or for Windows, use the Command Prompt) and navigate to the folder/directory where you want to clone the repo's files to, e.g if I waant to store the project's folder in my "Desktop" directory:

```bash
cd ~/Desktop                        # Linux/MacOS
cd C:\Users\YourUsername\Desktop    # Windows
```

Then, clone the repo to this directory:

```bash
git clone https://github.com/bgrando24/anchor.git
```

This will create a new folder called `anchor` in your current directory.

### 3. Install the project's dependencies

**MAKE SURE YOU'RE INSIDE THE PROJECT'S DIRECTORY FIRST**

```bash
cd anchor
```

Then:

```bash
# npm
npm install
```

`npm install` installs any modules/dependencies the project uses. You'll notice it creates a `node_modules` folder in the project directory. This folder is NOT committed to the repo on purpose to avoid bloating the repo with unnecessary files. Any machine that needs to run/build this project just simply runs `npm install` itself.

### 4. Start a 'local development server' for testing:

This allows you to see the application running locally in your own browser, instead of having to push & build it to a server first to test it/view any changes you're working on.

```bash
# npm
npm run dev
```

You can see the local version by opening `http://localhost:3000` in your browser.

### 5. (Optional)Create a production build

Build the application for production:

```bash
# npm
npm run build
```

Locally preview production build:

```bash
# npm
npm run preview
```
