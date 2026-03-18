# spweather

Simple Angular app that fetches and displays forecasts from https://api.weather.gov.

Setup

```bash
# install deps
npm install

# run dev server
npm start

# open http://localhost:4200
```

Notes

- Browsers forbid setting the `User-Agent` header from client-side JavaScript. To comply with api.weather.gov's request for a contact `User-Agent`, run a small server-side proxy or configure your dev proxy to add that header when forwarding requests to `https://api.weather.gov`.
- For development, `proxy.conf.json` can be used to route `/api` to the weather API and inject headers at the proxy. For production, use a server-side proxy (e.g. an express route) that sets a proper `User-Agent` value with your contact email.
# SpweatherApp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.2.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
