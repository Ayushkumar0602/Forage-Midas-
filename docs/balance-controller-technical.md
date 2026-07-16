# Balance controller — Technical Documentation

## Overview
The `BalanceController` serves as the primary external interface for querying account balances within the MidasCore system. It provides a lightweight, read-only endpoint that facilitates real-time balance retrieval for specified users, acting as a bridge between the persistence layer (`UserRepository`) and the client-facing API.

## Architecture
This controller resides in the presentation layer of the Spring Boot application. It functions as a specialized gateway:
*   **Dependency:** It depends on `UserRepository` for data access.
*   **Role:** It encapsulates the logic for mapping database-persisted `UserRecord` entities into domain-specific `Balance` response objects.
*   **Context:** It is intended to be invoked by front-end services or upstream microservices requiring current account state.

## Design Principles
*   **Single Responsibility Principle (SRP):** The controller is strictly limited to handling HTTP orchestration for balance lookups. It does not contain business logic regarding transaction validation or ledger updates.
*   **Constructor Injection:** By using constructor-based dependency injection, the controller promotes immutability and facilitates easier unit testing by allowing the injection of `UserRepository` mocks.
*   **Domain Segregation:** It explicitly separates the database model (`UserRecord`) from the API response format (`Balance`), preventing potential leaks of internal database schema details to external consumers.

## API Reference

### `GET /balance`
Retrieves the current balance for a specified user.

*   **Signature:** `public Balance getBalance(@RequestParam("userId") long userId)`
*   **Parameters:**
    *   `userId` (`long`): The unique identifier of the user account.
*   **Return Type:** `Balance` (A data transfer object containing the user's current balance).
*   **Throws:** N/A (Handles non-existent users gracefully).

## Internal Logic
1.  **Request Reception:** The framework extracts the `userId` query parameter from the incoming HTTP request.
2.  **Data Retrieval:** The controller queries the `UserRepository` via `findById(userId)`.
3.  **Sanitization/Defaulting:**
    *   If the repository returns a valid `UserRecord`, the controller extracts the current balance.
    *   If the repository returns `null` (indicating the user does not exist), the controller defaults the return balance to `0.0f`.
4.  **Response Construction:** The balance value is wrapped in a `Balance` object and serialized to JSON by the Spring `MappingJackson2HttpMessageConverter`.

## Data Flow
1.  **Input:** Client sends `GET /balance?userId=123`.
2.  **Processing:** `BalanceController` interacts with the JPA repository to fetch the corresponding entity from the underlying database.
3.  **Transformation:** The raw entity data is converted into a `Balance` DTO instance.
4.  **Output:** JSON payload returned to the client: `{"balance": 1500.50}`.

## Error Handling & Edge Cases
*   **Non-existent User:** Rather than throwing a 404 or a 500 error, the controller employs a "soft-fail" pattern by returning a balance of `0f`. This assumes that an unknown account effectively holds no funds, preventing system crashes on lookup attempts for invalid IDs.
*   **Database Connectivity:** As no explicit exception handling is implemented, standard Spring Framework behavior applies; connection timeouts or database failures will propagate as 500 Internal Server Error responses to the client.

## Usage Example

### HTTP Request
```http
GET /balance?userId=5501 HTTP/1.1
Host: api.midascore.com
Content-Type: application/json
```

### JSON Response
```json
{
  "balance": 2500.75
}
```

### Programmatic Invocation (Test)
```java
// Example of injecting the controller for a unit test
@Autowired
private BalanceController balanceController;

@Test
void testBalanceRetrieval() {
    Balance balance = balanceController.getBalance(123L);
    assertNotNull(balance);
    assertTrue(balance.getBalance() >= 0f);
}
```