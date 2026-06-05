# EventNest – Jenkins DevOps Pipeline Project

EventNest is a Node.js and Express web application for browsing events and registering attendees. It is used as the application codebase for a Jenkins DevOps pipeline. The application supports event creation, seat-controlled bookings, duplicate booking prevention, cancellations, a basic administrator summary, a health endpoint and Prometheus metrics.

## Functional Features

- Browse and filter upcoming events.
- Create an event through the organiser section.
- Book one to five seats for an event.
- Prevent duplicate active bookings for the same event and email address.
- Prevent bookings that exceed the remaining event capacity.
- Cancel bookings through the API and restore available seats.
- View a basic administrator summary.
- Check service availability through `/api/health`.
- Export application metrics through `/metrics`.

## Technology Stack

| Purpose | Technology |
| --- | --- |
| Web application | Node.js and Express |
| Front-end | HTML, CSS and JavaScript |
| Local persistence | SQLite database powered by `sql.js` |
| Automated API tests | Jest and Supertest |
| Build artefact | Docker image |
| CI/CD automation | Jenkins |
| Code quality | SonarCloud |
| Security | npm audit and Trivy |
| Monitoring | Prometheus and Grafana |
| Alerting | Alertmanager with an EventNest alert receiver |

## Run the Application Locally

Prerequisites: Node.js 20 or later and npm.

```bash
npm install
npm start
```

Open the application at:

```text
http://localhost:3000
```

Useful endpoints:

- Health: `http://localhost:3000/api/health`
- Metrics: `http://localhost:3000/metrics`
- Admin summary: `http://localhost:3000/api/admin/dashboard`

The application creates a local SQLite database file in `data/eventnest.db` and seeds example events on the first run.

## Run Automated Tests

```bash
npm test
npm run test:ci
```

The CI test command generates:

- JUnit test results in `reports/junit.xml`
- Coverage results in `coverage/`
- LCOV coverage for SonarCloud in `coverage/lcov.info`

## Docker Build and Run

```bash
docker build -t eventnest:local .
docker run --name eventnest-local -p 3000:3000 eventnest:local
```

Check that the container is healthy:

```bash
curl http://localhost:3000/api/health
```

## Jenkins Pipeline

The included `Jenkinsfile` is configured for a local Jenkins setup with Docker available. It runs seven pipeline stages:

| Stage | Implementation |
| --- | --- |
| Build | Installs dependencies, builds a Docker image, saves and archives the Docker artefact. |
| Test | Runs Jest and Supertest tests, publishes JUnit results and archives coverage. |
| Code Quality | Runs SonarCloud analysis and checks the quality gate. |
| Security | Runs `npm audit` and Trivy image scanning, then archives the security reports. |
| Deploy | Starts a staging Docker container and verifies its health endpoint. |
| Release | Tags the validated Docker image with a release version and deploys production. |
| Monitoring | Starts Prometheus, Grafana, Alertmanager and an alert receiver, then checks monitoring availability. |

## Jenkins Requirements

Install or configure the following on the Jenkins machine:

1. Node.js and npm.
2. Docker Desktop with `docker` and `docker compose` available.
3. Trivy installed and available from the command prompt.
4. Jenkins plugins for Pipeline, Git, JUnit and SonarQube Scanner.
5. A SonarCloud project and a Jenkins secret text credential named `SONAR_TOKEN`.
6. A Jenkins SonarQube server configuration named `SonarCloud`.

## Monitoring Services

After a successful pipeline run, the services are available locally:

| Service | Local Address |
| --- | --- |
| Production application | `http://localhost:3001` |
| Staging application | `http://localhost:3002` |
| Grafana | `http://localhost:3003` |
| Alert receiver | `http://localhost:3004/alerts` |
| Prometheus | `http://localhost:9090` |
| Alertmanager | `http://localhost:9093` |

Prometheus collects metrics from the EventNest `/metrics` endpoint. Grafana can be used for dashboard visualisation, and Alertmanager is used for alert handling.

## API Summary

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/events` | List or filter events. |
| POST | `/api/events` | Create an event. |
| GET | `/api/events/:id` | Retrieve an event. |
| POST | `/api/events/:id/bookings` | Register an attendee. |
| GET | `/api/bookings` | List bookings for demonstration or admin use. |
| DELETE | `/api/bookings/:id` | Cancel a booking. |
| GET | `/api/admin/dashboard` | Retrieve summary counts. |
| GET | `/api/health` | Health monitoring endpoint. |
| GET | `/metrics` | Prometheus metrics endpoint. |
