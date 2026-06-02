# EventNest – Jenkins DevOps Pipeline Project

EventNest is a Node.js and Express web application for discovering events and registering attendees. It was designed as a complete application codebase for the SIT753 Jenkins DevOps Pipeline task. The application includes event creation, seat-controlled bookings, duplicate booking prevention, cancellations, an administrator summary, a health endpoint and Prometheus metrics.

## Functional Features

- Browse and filter upcoming events.
- Create an event through the organiser section.
- Book one to five seats for an event.
- Prevent duplicate active bookings for the same event and email address.
- Prevent bookings that exceed remaining capacity.
- Cancel bookings through the API and restore available seats.
- View an administrator dashboard summary.
- Monitor service availability through `/api/health`.
- Export operational metrics through `/metrics`.

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

Open the application at `http://localhost:3000`.

Useful operational endpoints:

- Health: `http://localhost:3000/api/health`
- Metrics: `http://localhost:3000/metrics`
- Admin summary: `http://localhost:3000/api/admin/dashboard`

The application creates a local SQLite database file in `data/eventnest.db` and seeds four example events on the first run.

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

## Jenkins Pipeline Design

The included `Jenkinsfile` is prepared for a local Windows Jenkins installation with Docker Desktop available. It performs the seven assessed stages:

| Stage | Implementation |
| --- | --- |
| Build | Installs dependencies, builds a Docker image, saves and archives the versioned Docker artefact. |
| Test | Runs Jest/Supertest tests, publishes JUnit feedback and archives coverage. |
| Code Quality | Sends source and coverage results to SonarCloud and applies a quality gate. |
| Security | Runs `npm audit` and a Trivy image scan, failing on high or critical vulnerabilities. |
| Deploy | Starts a staging Docker container and verifies its health endpoint. |
| Release | Tags the validated Docker image with a release version and deploys production. |
| Monitoring | Starts Prometheus, Grafana, Alertmanager and an independent alert receiver, then checks availability. |

### Jenkins Requirements

Install or configure the following on the Jenkins machine:

1. Node.js and npm.
2. Docker Desktop with the `docker` and `docker compose` commands available.
3. Trivy installed and available from the command prompt.
4. Jenkins plugins: Pipeline, Git, JUnit, SonarQube Scanner and Quality Gates support.
5. A SonarCloud project and a Jenkins secret text credential named `SONAR_TOKEN`.
6. A Jenkins SonarQube server configuration named `SonarCloud`.

Before running the quality stage, replace the two placeholder values in `sonar-project.properties`:

```properties
sonar.projectKey=REPLACE_WITH_YOUR_SONARCLOUD_PROJECT_KEY
sonar.organization=REPLACE_WITH_YOUR_SONARCLOUD_ORGANIZATION
```

## Monitoring and Alert Demonstration

After a successful pipeline execution, the services are exposed as follows:

| Service | Local Address |
| --- | --- |
| Production application | `http://localhost:3001` |
| Staging application | `http://localhost:3002` |
| Grafana dashboard interface | `http://localhost:3003` |
| Local alert notification receiver | `http://localhost:3004/alerts` |
| Prometheus | `http://localhost:9090` |
| Alertmanager | `http://localhost:9093` |

To demonstrate a meaningful monitoring incident after the monitoring stage has completed:

```bash
docker stop eventnest-production
```

After approximately 30–60 seconds, the `EventNestApplicationDown` rule will fire in Prometheus and appear in Alertmanager. Alertmanager sends the notification to the separate EventNest alert receiver, where it can be shown at `http://localhost:3004/alerts`.

Restart production after the demonstration:

```bash
docker start eventnest-production
```

## API Summary

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/events` | List or filter events. |
| POST | `/api/events` | Create an event. |
| GET | `/api/events/:id` | Retrieve an event. |
| POST | `/api/events/:id/bookings` | Register an attendee. |
| GET | `/api/bookings` | List bookings for demonstration/admin use. |
| DELETE | `/api/bookings/:id` | Cancel a booking. |
| GET | `/api/admin/dashboard` | Retrieve summary counts. |
| GET | `/api/health` | Health monitoring endpoint. |
| GET | `/metrics` | Prometheus metrics endpoint. |

## Repository Submission Notes

Push this folder to a GitHub repository and grant the marker and unit chair access before submission. The final report should include the repository link, video link, screenshot of the seven Jenkins pipeline stages, screenshots of SonarCloud and the monitoring dashboard, and a brief interpretation of the security scan result.
