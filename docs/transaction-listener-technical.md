# Transaction listener — Technical Documentation

## Overview
The `TransactionListener` is a critical entry-point component responsible for bridging the external messaging infrastructure (Apache Kafka) with the core business logic of the MidasCore platform. Its primary function is to consume asynchronous transaction events from a configured Kafka topic and delegate the processing orchestration to the `TransactionService`.

## Architecture
This component acts as the **Adapter** layer in the system's hexagonal architecture. 
*   **Role:** It decouples the messaging transport layer from the domain layer.
*   **Dependencies:** It depends on `TransactionService`, which encapsulates the business rules and state transitions for transactions.
*   **Consumers:** The module is triggered by the Spring Kafka listener container, which monitors the topic defined in the application's environment properties (`general.kafka-topic`).

## Design Principles
*   **Single Responsibility Principle (SRP):** The listener is strictly responsible for message consumption and transport-level bridging. It does not perform validation, calculation, or persistence, delegating these concerns to the `TransactionService`.
*   **Dependency Injection (DI):** Uses constructor-based injection to provide the `TransactionService`. This ensures immutability of the service reference and facilitates easier unit testing by allowing the injection of mock services.
*   **Declarative Configuration:** Leverages Spring Kafka’s `@KafkaListener` annotation to abstract away the boilerplate code required to manage consumer groups, polling loops, and connection handling.

## API Reference

### `TransactionListener`
A Spring-managed component that listens for `Transaction` objects serialized via Kafka.

#### `public void onTransaction(Transaction transaction)`
*   **Annotation:** `@KafkaListener(topics = "${general.kafka-topic}")`
*   **Parameters:** 
    *   `Transaction transaction`: The POJO representation of the transaction event, automatically deserialized by the configured Kafka message converter.
*   **Return Type:** `void`
*   **Behavior:** Invokes the synchronous `processTransaction` method of the `TransactionService`.

## Internal Logic
1.  **Event Ingestion:** The listener container polls the configured topic. Upon receipt of a message, the Kafka message converter attempts to deserialize the payload into a `Transaction` object.
2.  **Delegation:** Once deserialized, the `onTransaction` method is triggered.
3.  **Service Invocation:** The listener immediately hands off the `Transaction` object to the `transactionService.processTransaction(transaction)` method, effectively moving the data from the infrastructure layer to the service layer.

## Data Flow
1.  **Source:** External Kafka Broker (Producer).
2.  **Transport:** Kafka Topic defined by `${general.kafka-topic}`.
3.  **Entry:** `TransactionListener.onTransaction()` receives the event.
4.  **Transformation/Processing:** `TransactionService` processes the domain logic.
5.  **Persistence/Exit:** The `TransactionService` typically commits the transaction state to a database (e.g., Spring Data JPA) or emits further events.

## Error Handling & Edge Cases
*   **Deserialization Failures:** If the Kafka message payload does not conform to the `Transaction` schema, the underlying Spring Kafka error handler (configured at the container level) will trigger. By default, this may log a `ListenerExecutionFailedException` or move the message to a Dead Letter Topic (DLT) if configured.
*   **Service Downstream Failures:** If `transactionService.processTransaction` throws a `RuntimeException`, the Kafka listener container will handle the acknowledgement based on the configured `AckMode`. Typically, this causes the offset not to commit, resulting in a retry of the event.

## Usage Example

### Configuration
The component relies on the `general.kafka-topic` property, which should be defined in `application.properties` or `application.yml`:

```properties
general.kafka-topic=transactions-topic
```

### Manual Trigger (Unit Testing)
Because the class is injected with its dependency, you can easily test the listener in isolation:

```java
@Test
void testTransactionHandling() {
    TransactionService mockService = mock(TransactionService.class);
    TransactionListener listener = new TransactionListener(mockService);
    
    Transaction mockTx = new Transaction(); // setup object
    listener.onTransaction(mockTx);
    
    verify(mockService, times(1)).processTransaction(mockTx);
}
```