# Transaction service — Technical Documentation

## Overview
The `TransactionService` is a core component of the MidasCore system responsible for executing peer-to-peer financial transfers. It manages the atomic state transition between user balances and orchestrates external incentive calculations to ensure that transactions are processed with integrated loyalty or bonus logic.

## Architecture
This service operates within the Service Layer of the Spring Boot application. 
- **Upstream Dependencies**: It consumes data from the `UserRepository` (User state) and `TransactionRecordRepository` (Audit trail). 
- **External Integration**: It interacts with an external Incentive API (via `RestTemplate`) to calculate transaction-related rewards.
- **Role in Data Flow**: It acts as the primary transaction orchestrator. It receives a `Transaction` DTO, validates the financial state, triggers remote business logic, updates local persistence, and commits the audit log.

## Design Principles
- **Atomicity (ACID)**: The use of `@Transactional` ensures that balance updates and audit logging occur as a single unit of work. If any operation fails, the database state rolls back.
- **Dependency Injection**: Dependencies are injected via constructor-based injection, facilitating easier unit testing and decoupling the service from the concrete implementation of repositories and the REST client.
- **Single Responsibility**: The class is focused strictly on the transaction lifecycle, delegating persistence to repositories and incentive calculation to the external service.

## API Reference

### `processTransaction(Transaction transaction)`
Executes the transfer of funds between two users.

*   **Parameters**: 
    *   `transaction` (`Transaction`): The transaction request object containing `senderId`, `recipientId`, and `amount`.
*   **Returns**: `void`.
*   **Side Effects**: Updates `UserRecord` balances in the database and creates a new `TransactionRecord`.

## Internal Logic
The `processTransaction` method follows a strict sequence:
1. **Validation**: Fetches both sender and recipient entities. If either is non-existent, the process terminates silently.
2. **Liquidity Check**: Validates that the sender's current balance is greater than or equal to the requested transfer amount.
3. **Incentive Integration**: Performs a synchronous POST request to the `incentive` service to determine if an extra reward should be credited.
4. **State Update**:
    *   Debits the sender's balance.
    *   Credits the recipient's balance with the sum of the `amount` and the `incentive`.
5. **Persistence**: Commits the updated entities to the `UserRepository` and stores a permanent record in the `TransactionRecordRepository`.

## Data Flow
1. **Input**: A `Transaction` domain object enters the service.
2. **Transformation**: The service maps the `Transaction` properties against existing `UserRecord` data.
3. **External Call**: A `RestTemplate` call is made to `http://localhost:8080/incentive`.
4. **Output**: Updated state is written to the database; a final `TransactionRecord` is persisted for regulatory/audit purposes.

## Error Handling & Edge Cases
- **Non-existent Users**: If `senderId` or `recipientId` are not found in the `userRepository`, the transaction is dropped silently.
- **Insufficient Funds**: The service performs a guard-clause check on the sender's balance. If the balance is insufficient, the transaction terminates without updating the database.
- **External API Failure**: If the `incentive` service fails or returns null, the system gracefully defaults to an incentive amount of `0f` to prevent the transaction from failing entirely.
- **Transactional Integrity**: Because the method is marked `@Transactional`, any unexpected RuntimeException (e.g., database connectivity issues) will trigger a rollback of all balance changes.

## Usage Example

```java
@Autowired
private TransactionService transactionService;

// Example of executing a transaction
Transaction transfer = new Transaction(senderId, recipientId, 150.0f);
transactionService.processTransaction(transfer);
```

```java
// Example of the Transaction DTO structure implied
public class Transaction {
    private Long senderId;
    private Long recipientId;
    private float amount;
    // Getters and setters...
}
```