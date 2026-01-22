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
  // Grafana Cloud OTLP expects Basic auth with user:password
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
