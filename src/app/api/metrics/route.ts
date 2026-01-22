import { NextResponse } from 'next/server';

// Simple metrics endpoint for Prometheus
// In production, you would use prom-client or similar library

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
