# Midas Core

A Spring Boot-based transaction processing system developed for the JPMorgan Chase Advanced Software Engineering Forage program. Midas Core handles real-time transaction processing with Kafka integration, user balance management, and incentive calculation.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

Midas Core is a microservice application that processes financial transactions in real-time. It listens to transaction events from Kafka, processes them with incentive calculations, updates user balances, and maintains transaction records. The system is designed to handle high-throughput transaction processing with ACID guarantees.

### Key Capabilities

- **Real-time Transaction Processing**: Consumes transaction events from Kafka topics
- **Balance Management**: Maintains and updates user balances atomically
- **Incentive Calculation**: Integrates with external incentive service to calculate transaction incentives
- **Transaction History**: Records all processed transactions with metadata
- **RESTful API**: Provides endpoints to query user balances

## ✨ Features

- ✅ Kafka-based event-driven architecture
- ✅ Transaction processing with balance validation
- ✅ External incentive service integration
- ✅ User balance querying via REST API
- ✅ Transaction record persistence
- ✅ H2 in-memory database for development
- ✅ Comprehensive test suite
- ✅ Spring Boot auto-configuration

## 🏗️ Architecture

```
┌─────────────┐
│   Kafka     │───Transaction Events───┐
│   Topic     │                        │
└─────────────┘                        │
                                        ▼
                              ┌──────────────────┐
                              │ Transaction      │
                              │ Listener         │
                              └────────┬─────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │ Transaction      │
                              │ Service          │
                              └────────┬─────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
          ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
          │   User       │  │ Transaction  │  │   Incentive  │
          │ Repository   │  │   Record     │  │    Service   │
          │              │  │ Repository   │  │  (External)  │
          └──────────────┘  └──────────────┘  └──────────────┘
                    │                  │
                    └──────────┬───────┘
                               │
                               ▼
                      ┌──────────────┐
                      │   H2         │
                      │  Database    │
                      └──────────────┘
```

### Component Flow

1. **TransactionListener**: Consumes transaction events from Kafka topics
2. **TransactionService**: Processes transactions with business logic:
   - Validates sender and recipient existence
   - Checks sender balance sufficiency
   - Calls external incentive service
   - Updates balances atomically
   - Persists transaction records
3. **BalanceController**: Exposes REST API for balance queries
4. **Repositories**: Handle data persistence using Spring Data JPA

## 🛠️ Tech Stack

- **Framework**: Spring Boot 3.2.5
- **Language**: Java 17
- **Build Tool**: Maven
- **Messaging**: Apache Kafka (via Spring Kafka)
- **Database**: H2 Database (in-memory)
- **ORM**: Spring Data JPA
- **Testing**: 
  - JUnit 5
  - Spring Boot Test
  - Spring Kafka Test
  - Testcontainers (for Kafka integration tests)

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Java Development Kit (JDK)**: Version 17 or higher
- **Maven**: Version 3.6+ 
- **Kafka**: Apache Kafka (for production) or Docker (for local development)
- **Git**: For version control

### Verify Installation

```bash
java -version    # Should show Java 17+
mvn -version     # Should show Maven 3.6+
```

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Ayushkumar0602/Forage-Midas-.git
cd Forage-Midas-
```

### 2. Build the Project

```bash
mvn clean install
```

This will:
- Download all dependencies
- Compile the source code
- Run tests
- Package the application as a JAR file

### 3. Run Tests

```bash
mvn test
```

## ⚙️ Configuration

The application configuration is managed through `application.yml` files:

### Main Configuration (`src/main/resources/application.yml`)

```yaml
server:
  port: 33400

spring:
  datasource:
    url: jdbc:h2:mem:midasdb
    driverClassName: org.h2.Driver
    username: sa
    password: 
  
  jpa:
    database-platform: org.hibernate.dialect.H2Dialect
    hibernate:
      ddl-auto: update
    show-sql: false
  
  h2:
    console:
      enabled: true
      path: /h2-console

general:
  kafka-topic: transactions
  kafka-bootstrap-servers: localhost:9092
```

### Kafka Configuration

Ensure Kafka is running and accessible at `localhost:9092` (default). For production, update the bootstrap servers configuration.

### External Service Configuration

The application expects an incentive service running at `http://localhost:8080/incentive`. This service should:
- Accept POST requests with `Transaction` objects
- Return `Incentive` objects with an `amount` field

## 🏃 Running the Application

### Option 1: Using Maven

```bash
mvn spring-boot:run
```

### Option 2: Using the JAR File

```bash
java -jar target/midas-core-1.0.0.jar
```

### Option 3: Using IDE

Run the `MidasCoreApplication` class directly from your IDE.

### Verify Application Startup

Once started, you should see:
- Application running on port `33400`
- H2 Console available at `http://localhost:33400/h2-console`
- Kafka listener ready to consume messages

## 📡 API Endpoints

### Get User Balance

Retrieve the current balance for a specific user.

**Endpoint**: `GET /balance`

**Query Parameters**:
- `userId` (required): The ID of the user whose balance you want to query

**Example Request**:
```bash
curl "http://localhost:33400/balance?userId=1"
```

**Example Response**:
```json
{
  "balance": 1500.50
}
```

**Response Codes**:
- `200 OK`: Successfully retrieved balance
- `400 Bad Request`: Missing or invalid userId parameter

## 📁 Project Structure

```
forage-midas/
├── src/
│   ├── main/
│   │   ├── java/com/jpmc/midascore/
│   │   │   ├── component/          # Service components
│   │   │   │   ├── DatabaseConduit.java
│   │   │   │   ├── TransactionListener.java
│   │   │   │   └── TransactionService.java
│   │   │   ├── controller/         # REST controllers
│   │   │   │   └── BalanceController.java
│   │   │   ├── entity/             # JPA entities
│   │   │   │   ├── TransactionRecord.java
│   │   │   │   └── UserRecord.java
│   │   │   ├── foundation/         # Domain models
│   │   │   │   ├── Balance.java
│   │   │   │   ├── Incentive.java
│   │   │   │   └── Transaction.java
│   │   │   ├── repository/         # Data access layer
│   │   │   │   ├── TransactionRecordRepository.java
│   │   │   │   └── UserRepository.java
│   │   │   └── MidasCoreApplication.java
│   │   └── resources/
│   │       └── application.yml
│   └── test/
│       ├── java/com/jpmc/midascore/
│       │   ├── TaskOneTests.java
│       │   ├── TaskTwoTests.java
│       │   ├── TaskThreeTests.java
│       │   ├── TaskFourTests.java
│       │   ├── TaskFiveTests.java
│       │   └── WilburBalanceProbeTest.java
│       └── resources/
│           ├── application.yml
│           └── test_data/
├── pom.xml
└── README.md
```

### Key Components

#### Foundation Classes
- **Transaction**: Represents a transaction with sender, recipient, and amount
- **Balance**: Wrapper for user balance value
- **Incentive**: Represents incentive amount from external service

#### Entities
- **UserRecord**: JPA entity for user data with balance
- **TransactionRecord**: JPA entity storing transaction history

#### Services
- **TransactionService**: Core business logic for processing transactions
- **TransactionListener**: Kafka consumer for transaction events

#### Controllers
- **BalanceController**: REST endpoint for balance queries

## 🧪 Testing

The project includes comprehensive test suites covering various scenarios:

### Running All Tests

```bash
mvn test
```

### Running Specific Test Classes

```bash
mvn test -Dtest=TaskOneTests
mvn test -Dtest=WilburBalanceProbeTest
```

### Test Structure

- **TaskOneTests**: Basic functionality tests
- **TaskTwoTests**: Transaction processing tests
- **TaskThreeTests**: Balance validation tests
- **TaskFourTests**: Integration tests
- **TaskFiveTests**: End-to-end tests
- **WilburBalanceProbeTest**: Balance probe tests

### Test Configuration

Test-specific configuration is in `src/test/resources/application.yml`:
- Uses in-memory H2 database
- Configures test Kafka topics
- Sets up testcontainers for Kafka

## 💻 Development

### Code Style

- Follow Java naming conventions
- Use meaningful variable and method names
- Add Javadoc comments for public APIs
- Maintain consistent indentation (4 spaces)

### Adding New Features

1. Create feature branch: `git checkout -b feature/your-feature-name`
2. Implement changes with tests
3. Run tests: `mvn test`
4. Commit changes: `git commit -m "Add feature description"`
5. Push to remote: `git push origin feature/your-feature-name`
6. Create pull request

### Database Access

During development, access the H2 console:
- URL: `http://localhost:33400/h2-console`
- JDBC URL: `jdbc:h2:mem:midasdb`
- Username: `sa`
- Password: (empty)

### Debugging

Enable SQL logging by updating `application.yml`:
```yaml
spring:
  jpa:
    show-sql: true
```

## 🔧 Troubleshooting

### Common Issues

**Issue**: Kafka connection errors
- **Solution**: Ensure Kafka is running and accessible at the configured bootstrap servers

**Issue**: Port already in use
- **Solution**: Change the port in `application.yml` or stop the process using port 33400

**Issue**: H2 database not persisting data
- **Solution**: H2 is configured as in-memory. For persistence, change the JDBC URL to use a file-based database

**Issue**: External incentive service not responding
- **Solution**: Ensure the incentive service is running at `http://localhost:8080/incentive`

## 📝 Transaction Processing Flow

1. **Event Consumption**: TransactionListener receives transaction event from Kafka
2. **Validation**: TransactionService validates:
   - Sender and recipient exist
   - Sender has sufficient balance
3. **Incentive Calculation**: Calls external incentive service
4. **Balance Update**: Atomically updates sender and recipient balances
5. **Record Persistence**: Saves transaction record to database

### Transaction Safety

- Uses `@Transactional` annotation for ACID guarantees
- Validates balance before processing
- Handles null responses from external services gracefully

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Contribution Guidelines

- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 License

This project is part of the JPMorgan Chase Advanced Software Engineering Forage program.

## 👥 Authors

- **Ayush Kumar** - [Ayushkumar0602](https://github.com/Ayushkumar0602)

## 🙏 Acknowledgments

- JPMorgan Chase for providing the Forage program
- Spring Boot community for excellent documentation
- Apache Kafka for robust messaging infrastructure

## 📞 Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

---

**Note**: This is a learning project developed as part of the JPMorgan Chase Advanced Software Engineering Forage program. It demonstrates enterprise-level Spring Boot application development with Kafka integration, transaction processing, and RESTful API design.
