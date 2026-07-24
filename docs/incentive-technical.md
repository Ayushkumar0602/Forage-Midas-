# Incentive — Technical Documentation

## Overview
The `Incentive` class serves as a fundamental Data Transfer Object (DTO) within the `midascore` foundation layer. Its primary purpose is to encapsulate the monetary value associated with an incentive event. This class acts as a lightweight container used for passing incentive data across service boundaries, ensuring type safety and consistency in financial calculations.

## Architecture
`Incentive.java` resides in the `com.jpmc.midascore.foundation` package, positioning it as a core domain model. 

*   **Role:** It functions as a foundational entity. It is intended to be composed within larger transaction or reward structures.
*   **Dependencies:** This class has zero external dependencies, adhering to a "Plain Old Java Object" (POJO) design to ensure high performance and ease of serialization/deserialization.
*   **Consumers:** It is consumed by service-layer components responsible for calculating rewards, auditing transactions, and potentially by persistence layers for mapping to database schemas.

## Design Principles
*   **Single Responsibility Principle (SRP):** The class is strictly focused on holding the state of an incentive value. It does not contain business logic, ensuring it remains highly reusable.
*   **Encapsulation:** The `amount` field is marked `private`, enforcing access through defined getter and setter methods. This provides a hook for future validation logic (e.g., preventing negative amounts) without breaking the public API.
*   **Low Coupling:** By avoiding dependencies on external libraries (like Lombok or heavy persistence frameworks), the class maintains a minimal footprint and remains framework-agnostic.

## API Reference

### `public class Incentive`

#### `public Incentive()`
*   **Description:** Default constructor for instantiation. Used primarily by frameworks like Jackson or Spring for object mapping.

#### `public float getAmount()`
*   **Returns:** `float` – The current monetary value of the incentive.

#### `public void setAmount(float amount)`
*   **Parameters:** 
    *   `amount` (`float`): The numerical value to assign to the incentive.
*   **Returns:** `void`

## Internal Logic
The logic is straightforward state management. The class maintains a single mutable state property:
1.  **Storage:** `amount` is stored as a primitive `float` to minimize heap overhead.
2.  **Access:** Standard accessor methods provide a thread-safe interface (assuming external synchronization if modified across threads).

## Data Flow
1.  **Ingestion:** Data typically enters this object via the `setAmount` method, often populated by an upstream service or a JSON deserializer.
2.  **Transformation:** The object remains immutable in intent throughout the business logic, though it is technically mutable. It is usually passed into calculation engines or reporting services.
3.  **Egress:** Data is accessed via `getAmount()` when calculating total incentive distributions or persistence to a database.

## Error Handling & Edge Cases
*   **Precision:** As a `float` type, this class is susceptible to floating-point precision issues common in financial applications.
    *   *Note:* It is recommended that callers verify numerical precision before passing values if strict decimal accuracy is required.
*   **Null Safety:** The default constructor initializes the `amount` to `0.0f`. Users should be aware that uninitialized objects will represent a zero-value incentive.

## Usage Example

### Basic Instantiation and Usage
```java
import com.jpmc.midascore.foundation.Incentive;

public class IncentiveManager {
    public void processReward(float value) {
        Incentive incentive = new Incentive();
        incentive.setAmount(value);
        
        System.out.println("Processing incentive of: $" + incentive.getAmount());
    }
}
```

### Usage within a Service
```java
public float calculateTotal(Incentive incentive, float multiplier) {
    // Basic calculation utilizing the incentive DTO
    return incentive.getAmount() * multiplier;
}
```