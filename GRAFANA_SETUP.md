# 📊 Guide Complet: Monitoring Grafana Cloud avec Faro et OpenTelemetry

## Table des matières
1. [Introduction](#introduction)
2. [Architecture](#architecture)
3. [Setup Grafana Cloud](#setup-grafana-cloud)
4. [Configuration Frontend (Faro)](#configuration-frontend-faro)
5. [Configuration Backend (OpenTelemetry)](#configuration-backend-opentelemetry)
6. [Variables d'Environnement](#variables-denvironnement)
7. [Dashboards Grafana](#dashboards-grafana)
8. [Dépannage](#dépannage)
9. [Bonnes Pratiques](#bonnes-pratiques)

---

## Introduction

Ce guide couvre la mise en place du monitoring complet pour une application Next.js using:
- **Faro Web SDK** pour le monitoring frontend (logs, erreurs, interactions utilisateur)
- **OpenTelemetry** pour le monitoring backend (traces, métriques, logs)
- **Grafana Cloud** comme plateforme d'observabilité centralisée

### Stack Utilisé
- **Frontend**: Next.js 16.1.0 + React 19.2.3 + Faro Web SDK
- **Backend**: Node.js 20 + OpenTelemetry SDK
- **Observabilité**: Grafana Cloud (LGTM+ Stack: Logs + Grafana + Tempo + Mimir)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GRAFANA CLOUD                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │     LOKI     │  │   TEMPO      │  │    MIMIR     │           │
│  │  (Logs)      │  │   (Traces)   │  │  (Metrics)   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                   │
│          ┌─────────────────────────────────────┐                │
│          │      GRAFANA DASHBOARDS             │                │
│          │   - Frontend Performance             │                │
│          │   - Backend Health                   │                │
│          │   - Error Rates & Traces             │                │
│          │   - Custom Metrics                   │                │
│          └─────────────────────────────────────┘                │
└────────┬────────────────────────────────────────────────────────┘
         │ OTLP HTTP                         │ OTLP HTTP
         │                                   │
┌────────────────────┐            ┌─────────────────────┐
│   FRONTEND (FARO)  │            │ BACKEND (OpenTel)   │
│                    │            │                     │
│ - Console logs     │            │ - Request traces    │
│ - JS Errors        │            │ - Response times    │
│ - User Interactions│            │ - HTTP requests     │
│ - Performance      │            │ - Custom metrics    │
│ - Custom events    │            │ - Environment info  │
└────────────────────┘            └─────────────────────┘
     Next.js App                     Node.js Runtime
```

---

## Setup Grafana Cloud

### 1. Créer un compte Grafana Cloud

1. Aller à https://grafana.com/auth/sign-up/create-user
2. Créer votre compte (utiliser email professionnel recommandé)
3. Vérifier l'email de confirmation

### 2. Accéder à votre instance

- URL: https://buddiz.grafana.net
- Login avec vos identifiants Grafana Cloud

### 3. Générer les API Tokens

#### **Token Faro (Frontend Monitoring)**

1. Aller dans **Grafana Cloud** → **Logs** (ou Frontend Observability)
2. Chercher **Faro** ou **Frontend Observability**
3. Cliquer sur **Generate API Token** ou **Create API Token**
4. Configurer:
   - **Name**: `portfolio-faro-token`
   - **Role**: `MetricsPublisher` ou `Admin` (pour les traces)
   - **TTL**: Par défaut (90 jours) ou personnalisé
5. **Copier et sauvegarder le token** (format: `glc_xxxxx...`)

#### **Token OTLP (Backend Monitoring)**

1. Aller dans **Administration** (⚙️) → **API tokens** (ou **API Keys**)
2. Cliquer sur **New API token**
3. Configurer:
   - **Name**: `portfolio-otlp-token`
   - **Role**: `MetricsPublisher` (pour traces + métriques)
   - **TTL**: Par défaut ou personnalisé
4. **Copier et sauvegarder le token**

**⚠️ Important**: Sécuriser ces tokens! Les traiter comme des mots de passe.

### 4. Identifier les Endpoints

Dans votre dashboard Grafana Cloud:

- **Faro Endpoint**: 
  ```
  https://telemetry-intake.grafana.net/v1/traces
  ```
  (Reste le même pour tous les clients Grafana Cloud)

- **OTLP Endpoint**:
  ```
  https://otlp-gateway-prod-us-central-0.grafana.net
  ```
  (Peut varier selon votre région, vérifier dans Grafana Cloud)

- **Logs Endpoint** (Loki):
  ```
  https://logs-prod-us-central-0.grafana.net/loki/api/v1/push
  ```

- **Traces Endpoint** (Tempo):
  ```
  https://tempo-blocks-prod-us-central-0.grafana.net:443/v1/traces
  ```

---

## Configuration Frontend (Faro)

### Architecture Faro

Faro collecte:
- ✅ Logs console (info, warn, error, debug)
- ✅ Erreurs JavaScript non capturées
- ✅ Interactions utilisateur (clics, navigation)
- ✅ Web Vitals (LCP, FID, CLS)
- ✅ Performances (temps de chargement)
- ✅ Sessions utilisateur uniques
- ✅ Événements personnalisés

### Code Implementation

**Fichier: `src/components/FaroProvider.tsx`**

```typescript
'use client';

import { useEffect } from 'react';
import { initializeFaro } from '@grafana/faro-web-sdk';
import { getWebInstrumentations, initializeWebTracing } from '@grafana/faro-web-tracing';

let faroInitialized = false;

export function FaroProvider() {
  useEffect(() => {
    if (faroInitialized || typeof window === 'undefined') {
      return;
    }

    try {
      const apiKey = process.env.NEXT_PUBLIC_GRAFANA_FARO_API_KEY;
      
      if (!apiKey) {
        console.warn('Faro SDK not configured');
        return;
      }

      initializeFaro({
        url: process.env.NEXT_PUBLIC_GRAFANA_FARO_URL || 'https://telemetry-intake.grafana.net/v1/traces',
        apiKey,
        app: {
          name: 'portfolio',
          version: '0.1.0',
          environment: process.env.NEXT_PUBLIC_ENV || 'development',
        },
        instrumentations: [
          ...getWebInstrumentations({
            captureConsole: true,
          }),
          initializeWebTracing({
            captureInteractions: true,
          }),
        ],
        sessionSampleRate: process.env.NEXT_PUBLIC_FARO_SAMPLE_RATE 
          ? parseFloat(process.env.NEXT_PUBLIC_FARO_SAMPLE_RATE) 
          : 1.0,
      });

      faroInitialized = true;
      console.log('Faro initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Faro:', error);
    }
  }, []);

  return null;
}
```

### Intégration dans Layout

**Fichier: `src/app/layout.tsx`**

```typescript
import { FaroProvider } from "@/components/FaroProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <FaroProvider />
        {children}
      </body>
    </html>
  );
}
```

### Événements Personnalisés

Pour tracker des événements métier:

```typescript
import { getWebInstrumentations } from '@grafana/faro-web-sdk';

// Dans votre composant
function MyComponent() {
  const handleClick = () => {
    // Faro trackera automatiquement cet événement
    console.log('User clicked button');
  };

  // Ou utiliser l'API Faro directement si disponible
  const trackCustomEvent = () => {
    if (typeof window !== 'undefined' && window.faro) {
      window.faro.api.pushEvent({
        name: 'custom_event',
        attributes: {
          userId: '123',
          action: 'portfolio_view',
        },
      });
    }
  };

  return <button onClick={trackCustomEvent}>Track Event</button>;
}
```

---

## Configuration Backend (OpenTelemetry)

### Architecture OpenTelemetry

OpenTelemetry collecte:
- ✅ Traces distribuées (début/fin requêtes)
- ✅ Métriques (mémoire, CPU, uptime)
- ✅ Spans avec événements personnalisés
- ✅ Contexte d'exécution (environnement, service)
- ✅ Logs structurés avec corrélation

### Code Implementation

**Fichier: `src/instrumentation.ts`**

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';

const getGrafanaAuthHeaders = () => {
  const token = process.env.GRAFANA_OTLP_API_TOKEN;
  if (!token) return {};
  // Grafana Cloud OTLP nécessite Basic auth
  const encoded = Buffer.from(`grafanacloud:${token}`).toString('base64');
  return { Authorization: `Basic ${encoded}` };
};

const resource = Resource.default().merge(
  new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'portfolio',
    [SemanticResourceAttributes.SERVICE_VERSION]: '0.1.0',
    environment: process.env.NODE_ENV || 'development',
  }),
);

const traceExporter = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  ? new OTLPTraceExporter({
      url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
      headers: getGrafanaAuthHeaders(),
    })
  : new ConsoleSpanExporter();

const metricExporter = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  ? new OTLPMetricExporter({
      url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/metrics`,
      headers: getGrafanaAuthHeaders(),
    })
  : undefined;

const sdk = new NodeSDK({
  resource,
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
  ...(metricExporter && {
    metricReader: new PeriodicExportingMetricReader({
      exporter: metricExporter,
    }),
  }),
});

sdk.start();
console.log('OpenTelemetry instrumentation started');

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('OpenTelemetry SDK shut down'))
    .catch((error) => console.error('Error shutting down SDK', error))
    .finally(() => process.exit(0));
});
```

### API Routes pour Santé et Métriques

**Fichier: `src/app/api/health/route.ts`**

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'portfolio',
        version: '0.1.0',
        uptime: process.uptime(),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

**Fichier: `src/app/api/metrics/route.ts`**

```typescript
import { NextResponse } from 'next/server';

const startTime = Date.now();

export async function GET() {
  try {
    const uptime = (Date.now() - startTime) / 1000;
    const memUsage = process.memoryUsage();

    const metrics = `# HELP nodejs_memory_heap_used_bytes Node.js heap memory used in bytes
# TYPE nodejs_memory_heap_used_bytes gauge
nodejs_memory_heap_used_bytes ${memUsage.heapUsed}

# HELP nodejs_memory_heap_total_bytes Node.js total heap memory in bytes
# TYPE nodejs_memory_heap_total_bytes gauge
nodejs_memory_heap_total_bytes ${memUsage.heapTotal}

# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${uptime}

# HELP nodejs_version Node.js version
# TYPE nodejs_version gauge
nodejs_version{version="${process.version}"} 1
`;

    return new Response(metrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate metrics',
      },
      { status: 500 }
    );
  }
}
```

### Instrumentation Docker

**Dockerfile**

```dockerfile
# Enable OpenTelemetry instrumentation for Node.js
ENV NODE_OPTIONS="--require @opentelemetry/auto-instrumentations-node/build/src/instrumentation.js"
```

---

## Variables d'Environnement

### Fichier `.env.local` (Développement)

```env
# Grafana Cloud - Faro Frontend Monitoring
NEXT_PUBLIC_GRAFANA_FARO_URL=https://telemetry-intake.grafana.net/v1/traces
NEXT_PUBLIC_GRAFANA_FARO_API_KEY=glc_eyJvIjogIjYyNTAwMSIsICJuIjogInBvcnRmb2xpbyIsICJrIjogIjB4eHh4In0= 
# ⚠️ À remplacer par votre vrai token Faro depuis https://buddiz.grafana.net

# Faro Configuration
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_FARO_SAMPLE_RATE=1.0  # 100% en dev, réduire en prod pour économiser

# OpenTelemetry Backend Configuration
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway-prod-us-central-0.grafana.net
GRAFANA_OTLP_API_TOKEN=glc_eyJvIjogIjYyNTAwMSIsICJuIjogInBvcnRmb2xpbyIsICJrIjogIjB4eHh4In0=
# ⚠️ À remplacer par votre vrai token OTLP depuis https://buddiz.grafana.net

# Application Settings
NODE_ENV=development
PORT=3000
```

### Fichier `docker-compose.yml` (Production)

```yaml
version: '3.8'

services:
  portfolio:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    restart: always
    environment:
      - NODE_ENV=production
      - OTEL_EXPORTER_OTLP_ENDPOINT=${OTEL_EXPORTER_OTLP_ENDPOINT:-https://otlp-gateway-prod-us-central-0.grafana.net}
      - GRAFANA_OTLP_API_TOKEN=${GRAFANA_OTLP_API_TOKEN}
      - NEXT_PUBLIC_GRAFANA_FARO_URL=${NEXT_PUBLIC_GRAFANA_FARO_URL:-https://telemetry-intake.grafana.net/v1/traces}
      - NEXT_PUBLIC_GRAFANA_FARO_API_KEY=${NEXT_PUBLIC_GRAFANA_FARO_API_KEY}
      - NEXT_PUBLIC_ENV=${NEXT_PUBLIC_ENV:-production}
      - NEXT_PUBLIC_FARO_SAMPLE_RATE=${NEXT_PUBLIC_FARO_SAMPLE_RATE:-0.1}  # 10% en prod
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Variables d'Environnement pour Déploiement

**Avant déploiement en Docker:**

```bash
export GRAFANA_OTLP_API_TOKEN="glc_xxxxx..."
export NEXT_PUBLIC_GRAFANA_FARO_API_KEY="glc_xxxxx..."
export OTEL_EXPORTER_OTLP_ENDPOINT="https://otlp-gateway-prod-us-central-0.grafana.net"
export NEXT_PUBLIC_ENV="production"

# Ensuite lancer
docker-compose up -d
```

---

## Dashboards Grafana

### 1. Créer un Dashboard pour le Frontend

1. Aller dans Grafana → **Dashboards** → **New Dashboard**
2. Ajouter les panneaux suivants:

#### Panneau 1: Sessions Actives
```
Panel: Stat
Query: 
  Datasource: Traces (Tempo)
  Filters: service.name="portfolio"
  Aggregation: Count of sessions
Légende: Sessions actives en temps réel
```

#### Panneau 2: Erreurs JavaScript
```
Panel: Graph
Query:
  Datasource: Logs (Loki)
  LogQL: {service_name="portfolio"} | json | level="error"
Légende: Erreurs JavaScript par heure
```

#### Panneau 3: Page Load Time
```
Panel: Graph
Query:
  Datasource: Traces (Tempo)
  Span name: "document_load"
  Aggregation: p95 duration
Légende: Temps de chargement des pages (P95)
```

#### Panneau 4: User Interactions
```
Panel: Table
Query:
  Datasource: Logs (Loki)
  LogQL: {service_name="portfolio"} | json | event_type="user_interaction"
Colonnes: timestamp, event_type, user_id
```

### 2. Créer un Dashboard pour le Backend

#### Panneau 1: Request Latency
```
Panel: Graph
Query:
  Datasource: Traces (Tempo)
  Service: portfolio
  Span type: server
  Aggregation: p50, p95, p99 duration
Légende: Latence des requêtes HTTP
```

#### Panneau 2: Error Rate
```
Panel: Graph
Query:
  Datasource: Metrics (Mimir)
  Metric: rate(http_server_request_total{service="portfolio",status=~"5.."}[5m])
Légende: Taux d'erreurs 5xx
```

#### Panneau 3: Memory Usage
```
Panel: Graph
Query:
  Datasource: Metrics (Mimir)
  Metric: nodejs_memory_heap_used_bytes{service="portfolio"}
Légende: Mémoire utilisée (bytes)
```

#### Panneau 4: HTTP Status Codes
```
Panel: Pie Chart
Query:
  Datasource: Metrics (Mimir)
  Metric: sum by (status) (rate(http_server_request_total{service="portfolio"}[5m]))
Légende: Distribution des codes HTTP
```

### 3. Alertes Recommandées

Aller dans **Alerting** → **Alert Rules** → **New Alert Rule**

**Alerte 1: Error Rate Élevé**
```
Condition: 
  rate(http_server_request_total{service="portfolio",status=~"5.."}[5m]) > 0.05
Action: 
  Notifier par email/Slack
Sévérité: Critical
```

**Alerte 2: Erreurs Frontend**
```
Condition:
  count(increase({service_name="portfolio"} | json | level="error" [5m])) > 10
Action:
  Notifier par email/Slack
Sévérité: Warning
```

**Alerte 3: Memory Leak**
```
Condition:
  rate(nodejs_memory_heap_used_bytes{service="portfolio"}[30m]) > 100000000
Action:
  Notifier par Slack
Sévérité: Warning
```

---

## Dépannage

### Aucune donnée n'apparaît dans Grafana

**1. Vérifier les tokens**
```bash
# Vérifier que NEXT_PUBLIC_GRAFANA_FARO_API_KEY et GRAFANA_OTLP_API_TOKEN sont définis
echo $NEXT_PUBLIC_GRAFANA_FARO_API_KEY
echo $GRAFANA_OTLP_API_TOKEN
```

**2. Vérifier les endpoints**
- Frontend (Faro): https://telemetry-intake.grafana.net/v1/traces
- Backend (OTLP): https://otlp-gateway-prod-us-central-0.grafana.net

**3. Vérifier les logs**
```bash
# Si développement local
npm run dev

# Chercher dans la console:
# ✅ "Faro initialized successfully"
# ✅ "OpenTelemetry instrumentation started"
```

**4. Vérifier les endpoints API**
```bash
# Health check
curl http://localhost:3000/api/health

# Métriques Prometheus
curl http://localhost:3000/api/metrics
```

### Tokens expirés

Grafana Cloud tokens expire après 90 jours par défaut. Pour renouveler:
1. Aller dans **Administration** → **API tokens**
2. Cliquer sur le token expiré
3. Générer un nouveau token
4. Mettre à jour `.env.local` ou Docker secrets

### Trop de données envoyées

Si vous voyez des coûts élevés:

1. **Réduire le sample rate**
   ```env
   NEXT_PUBLIC_FARO_SAMPLE_RATE=0.1  # 10% au lieu de 100%
   ```

2. **Filtrer les logs**
   Dans `FaroProvider.tsx`:
   ```typescript
   getWebInstrumentations({
     captureConsole: false,  // Désactiver console logs
   })
   ```

3. **Limiter les traces**
   Dans `instrumentation.ts`:
   ```typescript
   traceExporter: new OTLPTraceExporter({
     // ...
     flushIntervalMillis: 30000,  // Envoyer chaque 30s au lieu de 5s
   })
   ```

### Problèmes de performance

Si l'app ralentit après intégration:

1. **Vérifier NODE_OPTIONS** dans Dockerfile
2. **Réduire le nombre d'instrumentations** dans OpenTelemetry
3. **Vérifier la connexion réseau** vers Grafana Cloud

---

## Bonnes Pratiques

### 1. Sécurité

✅ **À FAIRE:**
- Stocker tokens dans des variables d'environnement
- Utiliser `.env.local` en développement (jamais commiter)
- Utiliser Docker secrets ou AWS Secrets Manager en production
- Faire tourner les tokens tous les 90 jours
- Utiliser Basic auth pour OTLP (pas Bearer)

❌ **À ÉVITER:**
- Commiter tokens dans Git
- Passer tokens en URL
- Utiliser des tokens avec permissions "Admin" si non nécessaire
- Partager tokens entre environnements (dev/prod)

### 2. Performance

- **Sample rate en production**: 0.1 à 0.5 (10-50%)
- **Sample rate en développement**: 1.0 (100%)
- **Logs**: Capturer seulement erreurs + warnings en production
- **Batch size**: Garder valeurs par défaut (plus efficace)

### 3. Structuration des Logs

```typescript
// ❌ Mauvais
console.log('User logged in: John');

// ✅ Bon
console.log('user_login', {
  userId: '123',
  email: 'john@example.com',
  timestamp: new Date().toISOString(),
});
```

### 4. Annotations Personnalisées

Pour enrichir vos traces:

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('portfolio');

export function myFunction() {
  const span = tracer.startSpan('my_operation');
  
  try {
    // Votre code
    span.addEvent('operation_start', { step: 1 });
    
    // ...
    span.addEvent('operation_complete', { step: 2 });
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR });
  } finally {
    span.end();
  }
}
```

### 5. Maintenance

- **Mettre à jour les dépendances**: Faro et OpenTelemetry publient régulièrement
- **Monitorer les coûts**: Vérifier mensuellement dans Grafana Cloud
- **Archiver les données**: Configurer retention policies dans Grafana Cloud
- **Tester en staging**: Avant deployer en production

---

## Résumé des Commandes Importantes

### Développement
```bash
# Installer dépendances
npm install

# Lancer en développement
npm run dev

# Construire
npm run build

# Lancer en production locale
npm start
```

### Docker
```bash
# Construire image
docker build -t portfolio:latest .

# Lancer avec compose
docker-compose up -d

# Vérifier logs
docker-compose logs -f portfolio

# Arrêter
docker-compose down
```

### Test des endpoints
```bash
# Health check
curl http://localhost:3000/api/health | jq

# Métriques Prometheus
curl http://localhost:3000/api/metrics
```

---

## Ressources Supplémentaires

- 📚 [Grafana Cloud Docs](https://grafana.com/docs/grafana-cloud/)
- 📚 [Faro Web SDK](https://grafana.com/docs/grafana/latest/frontend-observability/faro/)
- 📚 [OpenTelemetry](https://opentelemetry.io/docs/)
- 📚 [Tempo (Traces)](https://grafana.com/docs/tempo/)
- 📚 [Loki (Logs)](https://grafana.com/docs/loki/)
- 📚 [Mimir (Metrics)](https://grafana.com/docs/mimir/)

---

**Version**: 1.0  
**Date**: Janvier 2026  
**Mainteneur**: DevSecOps Team
