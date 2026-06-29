# Midas core application — Technical Documentation

## Overview
The `MidasCoreApplication` class serves as the foundational entry point for the Midas Core microservice. Built on the Spring Boot framework, this module initializes the application context, manages component scanning, and provides core infrastructure beans required for external service communication.

## Architecture
This file resides at the root of the package hierarchy (`com.jpmc.midascore`), acting as the primary orchestrator for the JVM process. 

*   **Role:** It functions as the **Bootstrap Module**. It configures the application environment and registers shared infrastructure beans into the Spring IoC (Inversion of Control) container.
*   **Dependencies:** It depends on the `spring-boot-starter` and `spring-boot-starter-web` (implied by the inclusion of `RestTemplate`), providing the skeletal structure for the service.
*   **Consumers:** All other layers (controllers, services, repositories) depend on this context to inject dependencies via Spring's dependency injection mechanisms.

## Design Principles
*   **Convention over Configuration:** By utilizing the `@SpringBootApplication` meta-annotation, the module leverages Spring Boot's auto-configuration, reducing boilerplate setup.
*   **Dependency Injection (IoC):** The `restTemplate()` method explicitly defines a bean to be managed by the container. This promotes loose coupling, allowing the `RestTemplate` to be injected into service classes rather than instantiated manually, which is critical for unit testing and mocking.
*   **Single Responsibility:** The class is restricted solely to application initialization and cross-cutting infrastructure definition, keeping the business logic encapsulated in separate domain-specific packages.

## API Reference

### `main(String[] args)`
*   **Signature:** `public static void main(String[] args)`
*   **Description:** The standard JVM entry point. Delegates execution to the Spring Boot `SpringApplication` runner.
*   **Parameters:** `args` - Command-line arguments passed at startup.

### `restTemplate()`
*   **Signature:** `@Bean public RestTemplate restTemplate()`
*   **Returns:** `RestTemplate`
*   **Description:** Produces a singleton instance of `RestTemplate`. This bean is made available throughout the application for performing synchronous HTTP requests to external APIs.

## Internal Logic
The startup sequence follows the standard Spring Boot lifecycle:
1.  **Context Creation:** `SpringApplication.run()` initializes the `ApplicationContext`.
2.  **Component Scanning:** The `@SpringBootApplication` annotation triggers a recursive scan of the `com.jpmc.midascore` package for classes annotated with `@Component`, `@Service`, `@Repository`, or `@RestController`.
3.  **Bean Registration:** The `restTemplate()` method is invoked by the container during the initialization phase to register the HTTP client bean in the internal registry.

## Data Flow
While this class does not process business data, it manages the **Infrastructure Flow**:
*   **Entry:** JVM execution triggers the `main` method.
*   **Transformation:** The Spring framework transforms class-level annotations into active objects (beans).
*   **Exit:** The application becomes ready to accept incoming web requests or trigger scheduled tasks.

## Error Handling & Edge Cases
*   **Startup Failure:** If the application fails to start (e.g., port conflict, invalid configuration), the `SpringApplication` runner catches the exception, logs the stack trace, and shuts down the JVM to prevent an unstable "zombie" state.
*   **Bean Dependencies:** If the `RestTemplate` fails to initialize, the application context fails to load, preventing the system from running with incomplete infrastructure dependencies.

## Usage Example

### Injecting the RestTemplate
Because the `restTemplate` is defined as a `@Bean`, it can be injected into any managed component:

```java
@Service
public class TransactionService {

    private final RestTemplate restTemplate;

    // Dependency Injection via Constructor
    public TransactionService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public void fetchData(String url) {
        String result = restTemplate.getForObject(url, String.class);
        // ... process data
    }
}
```