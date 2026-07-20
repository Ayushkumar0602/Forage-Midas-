# User record — Technical Documentation

## Overview
The `UserRecord` entity represents the core domain model for user identity and financial state within the MidasCore system. It serves as the persistent data structure for storing user profiles and their associated account balances, acting as the primary point of truth for transaction reconciliation and ledger management.

## Architecture
`UserRecord` is a JPA-annotated entity residing in the persistence layer. 
*   **System Role:** It maps directly to the underlying relational database table, providing the schema for user data.
*   **Dependencies:** It depends on `jakarta.persistence` for Object-Relational Mapping (ORM).
*   **Consumers:** This class is utilized by `UserRepository` (via Spring Data JPA) for CRUD operations and is injected into Service-layer components responsible for processing balance updates and transaction validation.

## Design Principles
*   **Encapsulation:** While fields are annotated for JPA, direct access is strictly controlled via getter and setter methods, ensuring that state changes (specifically `balance`) can be audited or validated in the future.
*   **Single Responsibility:** The class is strictly a POJO/Entity; it does not contain business logic or transaction processing code, adhering to the separation of concerns between data modeling and business services.
*   **Persistence Compliance:** Includes a `protected` no-argument constructor to satisfy JPA specification requirements regarding entity instantiation during proxy creation.

## API Reference

### `UserRecord(String name, float balance)`
*   **Description:** Constructs a new `UserRecord` instance.
*   **Parameters:**
    *   `name` (String): The legal name of the user.
    *   `balance` (float): The initial monetary balance.

### `getId()`
*   **Return:** `Long` - The database-generated unique identifier.

### `getName()`
*   **Return:** `String` - The user's name.

### `getBalance()`
*   **Return:** `float` - The current account balance.

### `setBalance(float balance)`
*   **Parameters:** `balance` (float) - The new balance to be persisted.

## Internal Logic
The class relies on standard Hibernate/JPA lifecycle management. The `id` field is marked with `@GeneratedValue`, delegating the identity generation strategy (typically `AUTO` or `IDENTITY` depending on the configured dialect) to the database layer. The `balance` field is constrained with `nullable = false` at the database schema level to ensure data integrity during transaction persistence.

## Data Flow
1.  **Ingestion:** Data enters the system via external API requests, which are deserialized into this entity.
2.  **Transformation:** During financial operations (e.g., balance adjustments), the `setBalance()` method is invoked by the service layer.
3.  **Persistence:** The entity is passed to the `JpaRepository`, which flushes the state changes to the database.
4.  **Retrieval:** The database returns the record to the application, which is then re-instantiated as a `UserRecord` object for use in the business logic layer.

## Error Handling & Edge Cases
*   **Persistence Failures:** Because `name` and `balance` are marked `nullable = false`, attempts to persist an incomplete entity will throw a `DataIntegrityViolationException`.
*   **Concurrency:** This implementation does not utilize `@Version` for optimistic locking. Concurrent updates to the same `UserRecord` may lead to lost updates; it is assumed the calling service layer manages transaction synchronization (e.g., via `@Transactional` read-write locks).

## Usage Example

### Creating a new User
```java
UserRecord newUser = new UserRecord("Alice Smith", 1000.0f);
userRepository.save(newUser);
```

### Updating a balance
```java
UserRecord user = userRepository.findById(1L).orElseThrow();
float newBalance = user.getBalance() - 50.0f;
user.setBalance(newBalance);
userRepository.save(user); // Persists the updated balance to DB
```