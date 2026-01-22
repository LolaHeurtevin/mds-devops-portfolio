// @ts-nocheck
// This file only runs in Node.js environment, not in Edge Runtime
// @eslint-disable-next-line
// only-allow-nodejs-apis

// Only run this instrumentation in Node.js environment (not Edge Runtime)
if (typeof globalThis !== 'undefined' && typeof globalThis.process === 'object' && globalThis.process.versions && globalThis.process.versions.node) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NodeSDK } = require('@opentelemetry/sdk-node');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Resource } = require('@opentelemetry/resources');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-node');

  const getGrafanaAuthHeaders = () => {
    const token = process.env.GRAFANA_OTLP_API_TOKEN;
    if (!token) return {};
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

  if (typeof process !== 'undefined' && process.on) {
    // eslint-disable-next-line no-undef
    process.on('SIGTERM', () => {
      sdk.shutdown()
        .then(() => console.log('OpenTelemetry SDK shut down'))
        .catch((error) => console.error('Error shutting down SDK', error))
        .finally(() => {
          if (typeof process !== 'undefined' && process.exit) {
            // eslint-disable-next-line no-undef
            process.exit(0);
          }
        });
    });
  }
}
