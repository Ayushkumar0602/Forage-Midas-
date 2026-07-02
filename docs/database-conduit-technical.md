# Database conduit — Technical Documentation

## Overview
The `DatabaseConduit` acts as a dedicated abstraction layer (Data Access Object pattern) for persistence operations related to `UserRecord` entities. It exists to decouple the domain/service logic from the underlying Spring Data JPA repository, providing a controlled gateway for database interactions within the MidasCore system.

## Architecture
This component sits at the persistence layer. 
*   **Role:** It serves as the primary interface between the service layer and the `UserRepository`.
*   **Dependencies:** It has a hard dependency on `UserRepository` (injected via constructor).
*   **Consumers:** Business services and transaction controllers depend on `DatabaseConduit` to persist user-related state changes.

## Design Principles
*   **Single Responsibility Principle (SRP):** This class is exclusively responsible for routing persistence requests. It prevents higher-level services from directly interacting with repository implementation details.
*   **Dependency Injection (DI):** By utilizing constructor-based injection, the class remains testable and immutable. It allows for easy mocking of the repository during unit testing.
*   **Encapsulation:** It hides the specific persistence technology (Spring Data JPA) from the rest of the application, simplifying potential future refactors (e.g., switching from JPA to a different storage mechanism).

## API Reference

### `save(UserRecord userRecord)`
Persists a user entity to the underlying data store.

*   **Signature:** `public void save(UserRecord userRecord)`
*   **Parameters:** 
    *   `userRecord` (`UserRecord`): The entity object containing the user state to be persisted.
*   **Returns:** `void`
*   **Throws:** May propagate `DataAccessException` (or subclasses) if the underlying repository operation fails.

## Internal Logic
1.  **Initialization:** Upon application startup, Spring IoC container injects a concrete implementation of `UserRepository` into the `DatabaseConduit` constructor.
2.  **Delegation:** When `save` is invoked, the component performs no transformations or logging; it strictly delegates the request to the `userRepository.save()` method.
3.  **Persistence:** The repository executes the appropriate SQL `INSERT` or `UPDATE` based on the state and ID presence of the `UserRecord`.

## Data Flow
1.  **Entry:** A service component calls `DatabaseConduit.save()` with a populated `UserRecord` object.
2.  **Transformation:** The object flows directly through the conduit without mutation.
3.  **Persistence:** The data is passed to the JPA provider to be mapped and written to the configured relational database.
4.  **Exit:** Once the repository completes the transaction, control returns to the caller.

## Error Handling & Edge Cases
*   **Null Constraints:** If a `null` entity is passed to the `save` method, the underlying Spring Data repository will throw an `IllegalArgumentException`.
*   **Transaction Integrity:** This component does not declare explicit `@Transactional` boundaries, assuming the calling service manages the transaction context. If the repository operation fails (e.g., database connectivity issues or constraint violations), the exception bubbles up to the caller to be handled or rolled back.

## Usage Example

### Injecting and Saving a User
```java
@Service
public class UserService {
    private final DatabaseConduit databaseConduit;

    public UserService(DatabaseConduit databaseConduit) {
        this.databaseConduit = databaseConduit;
    }

    public void registerUser(UserRecord user) {
        // Business logic here
        databaseConduit.save(user);
    }
}
```

### Testing with Mocks
```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    @Mock
    private DatabaseConduit databaseConduit;

    @Test
    void shouldSaveUserSuccessfully() {
        UserRecord user = new UserRecord("JohnDoe");
        databaseConduit.save(user);
        verify(databaseConduit, times(1)).save(user);
    }
}
```