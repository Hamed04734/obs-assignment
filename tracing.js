const { Resource } = require("@opentelemetry/resources");
const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");
const { SimpleSpanProcessor } = require("@opentelemetry/sdk-trace-base");
const { ConsoleSpanExporter } = require("@opentelemetry/sdk-trace-base");
const { JaegerExporter } = require("@opentelemetry/exporter-jaeger");
const { trace } = require("@opentelemetry/api");

// Instrumentations
const { ExpressInstrumentation } = require("opentelemetry-instrumentation-express");
const { MongoDBInstrumentation } = require("@opentelemetry/instrumentation-mongodb");
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");
const { registerInstrumentations } = require("@opentelemetry/instrumentation");

module.exports = (serviceName) => {
    // Initialize the tracer provider
    const provider = new NodeTracerProvider({
        resource: new Resource({
            [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
        }),
    });

    // Configure the Jaeger exporter
    const jaegerExporter = new JaegerExporter({
        serviceName: serviceName, // Name of your service
    });
    provider.addSpanProcessor(new SimpleSpanProcessor(jaegerExporter));

    // (Optional) Add a Console exporter for debugging
    const consoleExporter = new ConsoleSpanExporter();
    provider.addSpanProcessor(new SimpleSpanProcessor(consoleExporter));

    // Register the tracer provider
    provider.register();

    // Register instrumentations
    registerInstrumentations({
        instrumentations: [
            new HttpInstrumentation(), // Captures HTTP requests
            new ExpressInstrumentation(), // Captures Express requests
            new MongoDBInstrumentation({
                enhancedDatabaseReporting: true, // Enables detailed MongoDB queries
            }), // Captures MongoDB operations
        ],
        tracerProvider: provider,
    });

    // Debug Logging
    console.log("Tracing initialized for service:", serviceName);

    // Return the tracer
    return trace.getTracer(serviceName);
};
