# Balance — Technical Documentation

## Overview
The `Balance` module serves as the primary Data Transfer Object (DTO) for representing monetary values within the MidasCore foundation. It provides a standardized container for balance data, ensuring consistent serialization and deserialization across the system's service boundaries and message queues.

## Architecture
`Balance` resides in the `com.jpmc.midascore.foundation` package, acting as a foundational entity. 
*   **Role:** It functions as a lightweight POJO used to transmit financial state between external APIs and internal processing services.
*   **Dependencies:** It relies on the Jackson library for JSON mapping.
*   **Consumers:** It is intended for use by persistence layers, transaction services, and REST controllers that require balance propagation.

## Design Principles
*   **POJO Simplicity:** The class adheres to the Plain Old Java Object pattern to facilitate seamless integration with serialization frameworks.
*   **Decoupling:** By utilizing `@JsonIgnoreProperties(ignoreUnknown = true)`, the class ensures forward compatibility; it gracefully handles incoming JSON payloads that may contain extra metadata not required by this specific domain model.
*   **Encapsulation:** While the fields are simple, access is governed through standardized getters and setters, maintaining compatibility with Java Bean conventions required by many frameworks.

## API Reference

### `class Balance`

| Method | Signature | Description |
| :--- | :--- | :--- |
| **Constructor** | `Balance()` | Default constructor for Jackson deserialization. |
| **Constructor** | `Balance(float amount)` | Initializes a balance with a specific value. |
| `getAmount` | `public float getAmount()` | Returns the current balance amount. |
| `setAmount` | `public void setAmount(float amount)` | Updates the balance amount. |
| `toString` | `public String toString()` | Returns a string representation of the balance. |

## Internal Logic
The module implements a straightforward state-container pattern. The logic is declarative:
1.  **Instantiation:** Can be created via a zero-argument constructor (for framework-driven deserialization) or a parameterized constructor.
2.  **Access:** Mutators and accessors provide direct control over the `amount` primitive.
3.  **Serialization/Deserialization:** Jackson manages the mapping process, relying on the class's lack of strict constraints to remain resilient against schema evolution.

## Data Flow
1.  **Ingress:** Typically enters the system as a JSON object within an HTTP request body or a message queue event.
2.  **Transformation:** Jackson reflection invokes the default constructor and `setAmount()` to hydrate the object.
3.  **Consumption:** The object is passed into business logic services where the `amount` is read via `getAmount()` to calculate transaction feasibility.
4.  **Egress:** Optionally serialized back to JSON for response objects.

## Error Handling & Edge Cases
*   **Missing Fields:** If the JSON source lacks an `amount` field, the value defaults to `0.0f` (Java's default for float).
*   **Unexpected Fields:** The `@JsonIgnoreProperties` annotation prevents the system from throwing an `UnrecognizedPropertyException` if upstream producers add new fields, ensuring system stability during rolling updates.
*   **Precision Note:** As this implementation uses `float`, it is intended for standard reporting or non-ledger-critical calculations. For high-precision financial auditing, consideration should be given to migrating this field to `java.math.BigDecimal` in future iterations to prevent floating-point arithmetic errors.

## Usage Example

### Creating a Balance instance
```java
// Standard instantiation
Balance currentBalance = new Balance(1500.50f);
System.out.println(currentBalance.getAmount());
```

### Typical deserialization context
```java
ObjectMapper mapper = new ObjectMapper();
String json = "{\"amount\": 250.75, \"ignoredField\": \"metadata\"}";

// Jackson successfully ignores 'ignoredField' and hydrates 'amount'
Balance balance = mapper.readValue(json, Balance.class);
```