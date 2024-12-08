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
    const provider = new NodeTracerProvider({
        resource: new Resource({
            [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
        }),
    });

    const jaegerExporter = new JaegerExporter({
        serviceName: serviceName, 
    });
    provider.addSpanProcessor(new SimpleSpanProcessor(jaegerExporter));

    const consoleExporter = new ConsoleSpanExporter();
    provider.addSpanProcessor(new SimpleSpanProcessor(consoleExporter));

    provider.register();

    registerInstrumentations({
        instrumentations: [
            new HttpInstrumentation(), 
            new ExpressInstrumentation(), 
            new MongoDBInstrumentation({
                enhancedDatabaseReporting: true, 
            }), 
        ],
        tracerProvider: provider,
    });

    console.log("Tracing initialized for service:", serviceName);

    return trace.getTracer(serviceName);
};
