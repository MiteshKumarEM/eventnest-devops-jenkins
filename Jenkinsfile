pipeline {
    agent any

    environment {
        APP_NAME = 'eventnest'
        APP_IMAGE = 'eventnest'
        STAGING_CONTAINER = 'eventnest-staging'
        PRODUCTION_CONTAINER = 'eventnest-production'
        STAGING_PORT = '3002'
        PRODUCTION_PORT = '3001'
        SONAR_TOKEN = credentials('SONAR_TOKEN')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('1. Build') {
            steps {
                bat 'if not exist artifacts mkdir artifacts'
                bat 'if not exist reports mkdir reports'
                bat 'npm ci'
                bat 'docker build -t %APP_IMAGE%:%BUILD_NUMBER% -t %APP_IMAGE%:latest .'
                bat 'docker save -o artifacts\\eventnest-%BUILD_NUMBER%.tar %APP_IMAGE%:%BUILD_NUMBER%'
                archiveArtifacts artifacts: 'artifacts/*.tar', fingerprint: true
            }
        }

        stage('2. Test') {
            steps {
                bat 'npm run test:ci'
                junit testResults: 'reports/junit.xml', allowEmptyResults: false
                archiveArtifacts artifacts: 'coverage/**/*', fingerprint: true
            }
        }

        stage('3. Code Quality') {
            steps {
                withSonarQubeEnv('SonarCloud') {
                    bat 'npx sonar-scanner -Dsonar.token=%SONAR_TOKEN%'
                }
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('4. Security') {
            steps {
                bat 'npm audit --audit-level=high --json > reports\\npm-audit.json'
                bat 'trivy image --exit-code 1 --severity HIGH,CRITICAL --format json --output reports\\trivy-image.json %APP_IMAGE%:%BUILD_NUMBER%'
                archiveArtifacts artifacts: 'reports/*.json', fingerprint: true
            }
        }

        stage('5. Deploy to Staging') {
            steps {
                bat 'docker network inspect eventnest-network >nul 2>&1 || docker network create eventnest-network'
                bat 'docker rm -f %STAGING_CONTAINER% >nul 2>&1 || exit /b 0'
                bat 'docker run -d --name %STAGING_CONTAINER% --network eventnest-network -p %STAGING_PORT%:3000 -e NODE_ENV=staging -e DB_PATH=/app/data/staging.db %APP_IMAGE%:%BUILD_NUMBER%'
                bat 'powershell -Command "Start-Sleep -Seconds 6; (Invoke-WebRequest -UseBasicParsing http://localhost:%STAGING_PORT%/api/health).StatusCode -eq 200"'
            }
        }

        stage('6. Release to Production') {
            steps {
                script {
                    env.RELEASE_TAG = "v1.0.${env.BUILD_NUMBER}"
                }
                bat 'docker tag %APP_IMAGE%:%BUILD_NUMBER% %APP_IMAGE%:%RELEASE_TAG%'
                bat 'docker rm -f %PRODUCTION_CONTAINER% >nul 2>&1 || exit /b 0'
                bat 'docker run -d --name %PRODUCTION_CONTAINER% --network eventnest-network -p %PRODUCTION_PORT%:3000 -e NODE_ENV=production -e DB_PATH=/app/data/production.db %APP_IMAGE%:%RELEASE_TAG%'
                bat 'powershell -Command "Start-Sleep -Seconds 6; (Invoke-WebRequest -UseBasicParsing http://localhost:%PRODUCTION_PORT%/api/health).StatusCode -eq 200"'
            }
        }

        stage('7. Monitoring and Alerting') {
            steps {
                bat 'set RELEASE_TAG=%RELEASE_TAG%&& docker compose -f docker-compose.monitoring.yml up -d'
                bat 'powershell -Command "Start-Sleep -Seconds 8; (Invoke-WebRequest -UseBasicParsing http://localhost:%PRODUCTION_PORT%/metrics).StatusCode -eq 200"'
                bat 'powershell -Command "(Invoke-WebRequest -UseBasicParsing http://localhost:9090/-/healthy).StatusCode -eq 200"'
                echo 'Monitoring enabled: Prometheus http://localhost:9090, Grafana http://localhost:3003, Alertmanager http://localhost:9093, alert receiver http://localhost:3004/alerts'
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'reports/**/*, coverage/**/*', allowEmptyArchive: true
        }
        success {
            echo 'EventNest passed all seven DevOps pipeline stages and is released to production.'
        }
        failure {
            echo 'Pipeline stopped because a build, quality, security, deployment or monitoring gate failed.'
        }
    }
}
