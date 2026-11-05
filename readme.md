# TMAR-Cert Backend

Backend API for TMAR-Cert, a vehicle and passenger permit management system integrated with TMAR-Travel.

TMAR-Cert allows authenticated TMAR-Travel users to browse available locations, check permit availability and estimated fees, create and manage permits, manage account balances, deposit funds through Parsian payment gateway, and request withdrawals.

Administrators manage users, financial operations, locations, permit settings, permits, notifications, and website content.

---

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Application Modules](#application-modules)
- [Authentication and Authorization](#authentication-and-authorization)
- [User and Balance Lifecycle](#user-and-balance-lifecycle)
- [Payment and Deposit Flow](#payment-and-deposit-flow)
- [Withdrawal Flow](#withdrawal-flow)
- [Location Management](#location-management)
- [Permit Availability and Pricing](#permit-availability-and-pricing)
- [Permit Lifecycle](#permit-lifecycle)
- [Financial Integrity](#financial-integrity)
- [Notifications](#notifications)
- [Audit Logging](#audit-logging)
- [Background Jobs](#background-jobs)
- [API Security](#api-security)
- [Project Structure](#project-structure)
- [Environment Configuration](#environment-configuration)
- [Development](#development)
- [Database and Migrations](#database-and-migrations)
- [Important Design Decisions](#important-design-decisions)

---

## Overview

TMAR-Cert is responsible for the permit and financial domain, while TMAR-Travel remains the identity provider and source of available locations.

The two systems have separate responsibilities:

**TMAR-Travel**

- User authentication and identity.
- User credentials and login sessions.
- User's external account and role.
- Source of available locations.

**TMAR-Cert**

- Local user records linked to TMAR-Travel identities.
- User balances and financial transactions.
- Deposits and withdrawals.
- Permit creation, verification, updates, and revocation.
- Location-specific capacity, fees, and date overrides.
- Notifications and audit logs.
- Administrative operations.

TMAR-Cert does not implement an independent password-based registration or login system.

## Technology Stack

| Technology      | Responsibility                          |
| --------------- | --------------------------------------- |
| Node.js         | Runtime                                 |
| TypeScript      | Application language                    |
| NestJS          | Application framework                   |
| PostgreSQL      | Persistent database                     |
| TypeORM         | ORM and database access                 |
| JWT             | TMAR-Travel authentication verification |
| SOAP            | Parsian payment gateway integration     |
| Nodemailer      | Email notifications                     |
| Joi             | Environment validation                  |
| class-validator | DTO validation                          |
| Swagger         | API documentation                       |
| Helmet          | HTTP security headers                   |
| Jest            | Automated testing                       |

---

## Architecture

The project follows a four-layer Clean Architecture approach.

The dependency direction is:

`API → Application → Domain`

`Infrastructure → Application / Domain`

The Domain layer does not depend on NestJS, TypeORM, HTTP controllers, or external providers.

### 1. Domain

`src/domain`

Contains the business model and rules.

Responsibilities:

- Domain entities.
- Enums and statuses.
- Repository contracts.
- Domain exceptions.
- Financial decimal utilities.
- Business state transitions.

Examples:

- `User`
- `UserBalance`
- `Deposit`
- `Withdrawal`
- `Ledger`
- `Permit`
- `Passenger`
- `Vehicle`
- `Location`
- `Notification`
- `AuditLog`

Domain entities control their own state transitions. Application services should use entity methods instead of directly modifying business state.

### 2. Application

`src/application`

Contains use cases and application contracts.

Responsibilities:

- Business workflows.
- Coordination between repositories.
- Transaction boundaries through `UnitOfWork`.
- External service interfaces.
- Application-level validation and orchestration.

Examples:

- `CreateDepositUseCase`
- `VerifyDepositUseCase`
- `CreatePermitUseCase`
- `CreateWithdrawalUseCase`
- `UpdateUserRoleUseCase`
- `SyncLocationsUseCase`

Use cases depend on repository abstractions and service interfaces, not directly on TypeORM repositories or external provider implementations.

### 3. Infrastructure

`src/infrastructure`

Contains technical implementations.

Responsibilities:

- PostgreSQL and TypeORM configuration.
- ORM entities.
- Repository implementations.
- Unit of Work implementation.
- Parsian payment provider.
- SMTP notification service.
- TMAR-Travel JWT verification.
- TMAR-Travel locations client.
- HTML sanitization.
- Background schedulers.

Infrastructure implements the contracts defined by the Application and Domain layers.

### 4. API

`src/api`

Contains the HTTP interface.

Responsibilities:

- Controllers and routes.
- Request DTOs.
- Authentication and authorization guards.
- HTTP exception translation.
- Request validation.

Controllers should remain thin. They validate and translate HTTP requests into use-case inputs, then return the result.

Controllers must not contain financial calculations, permit capacity calculations, or database transaction logic.

---

## Application Modules

`AppModule` composes the application.

`ApplicationModule` registers application use cases.

`InfrastructureModule` registers technical implementations and repository bindings. It is global.

Individual API modules expose their respective HTTP endpoints.

The two background schedulers are registered in `AppModule`:

- `LocationSyncScheduler`
- `PermitExpirationScheduler`

`AppModule` imports `ApplicationModule` because the schedulers depend directly on application use cases.

---

## Authentication and Authorization

TMAR-Travel is the identity provider.

TMAR-Cert authenticates requests using the `accessToken` cookie issued by TMAR-Travel.

### Authentication flow

1. The user logs in through TMAR-Travel.
2. TMAR-Travel issues an access token.
3. The frontend sends the `accessToken` cookie with requests to TMAR-Cert.
4. `TmarAuthGuard` extracts the cookie.
5. `TmarJwtService` verifies the JWT signature and identity.
6. `TmarAuthUseCase` synchronizes the authenticated identity with the local database.
7. The local user is attached to the request.
8. The controller executes the requested use case.

The backend does not accept a user ID supplied by the frontend as proof of identity. The authenticated local user ID is obtained from the verified request identity.

### First authentication

When a valid TMAR-Travel identity is seen for the first time:

- A local user is created.
- The external TMAR-Travel user ID is stored.
- Profile information is synchronized.
- Email verification is inherited from the trusted TMAR-Travel identity.
- A default balance is created using `DEFAULT_CURRENCY`.

The user does not need a separate TMAR-Cert registration.

### Subsequent authentication

On subsequent requests:

- The existing local user is retrieved by external user ID.
- The local user is locked during synchronization.
- Restricted local users are rejected.
- Profile changes are synchronized.
- A missing default-currency balance is created.

A blocked TMAR-Travel identity is rejected.

### Authorization

There are two sources of administrator privileges:

1. Local TMAR-Cert role: `UserRole.ADMIN`.
2. External TMAR-Travel role: `admin`.

A user is considered an effective administrator if either condition is true.

External role comparison is case-insensitive.

`AdminAuthGuard` first authenticates the user and then checks administrator privileges.

The local role is useful for TMAR-Cert-specific administration. External administrator privileges remain controlled by TMAR-Travel.

---

## User and Balance Lifecycle

Users are created automatically during their first successful authentication.

Each user can have balances in supported currencies.

The default balance is initialized using `DEFAULT_CURRENCY`.

Balances represent available funds, not a transaction history.

Every financial balance mutation must be accompanied by a ledger entry.

A balance should never be changed through a direct controller or an unrelated repository operation.

All financial mutations are performed inside a Unit of Work transaction.

---

## Payment and Deposit Flow

TMAR-Cert supports multiple payment providers through a provider abstraction.

The active provider is selected using `PaymentProviderResolver`.

Current implementations include:

- Parsian payment provider.
- Fake payment provider for development and testing.

### Deposit creation

1. The authenticated user submits a deposit request.
2. The API passes the request to `CreateDepositUseCase`.
3. The provider is resolved.
4. The requested currency is checked against provider-supported currencies.
5. The amount is validated.
6. A local deposit is created with `PENDING` status.
7. A provider payment request is sent.
8. The provider returns a payment identifier and payment URL.
9. The provider information is stored on the deposit.
10. The frontend redirects the user to the returned payment URL.

The local deposit is created before calling the external payment provider so that the operation has a local reference.

If the provider request fails, the deposit may remain pending and should be investigated or reconciled rather than silently discarded.

### Parsian payment flow

Parsian uses its SOAP payment services.

**Sale request**

TMAR-Cert sends:

- Terminal/PIN (`PARSIAN_PIN`).
- Numeric provider order ID.
- Payment amount in Rial.
- Backend callback URL.

Internal IRT amounts are stored in Toman.

The amount is converted to Rial when communicating with Parsian.

After a successful sale request, Parsian returns a payment token.

The token is stored as `providerPaymentId`, and the frontend receives a payment URL.

**Payment callback**

After the user completes the payment on Parsian's payment page:

1. Parsian sends a callback to `/deposits/parsian/callback`.
2. `ParsianCallbackController` passes the callback data to `HandleParsianCallbackUseCase`.
3. The use case finds the deposit using the provider order ID.
4. It checks the payment provider and currency.
5. It checks the returned token against the stored provider payment ID.
6. It checks the callback status.
7. It checks that the callback amount matches the expected Rial amount.
8. It calls `VerifyDepositUseCase`.

A successful browser redirect or callback status alone is not considered proof of payment.

**Server-side confirmation**

`VerifyDepositUseCase` calls Parsian's confirmation service.

Only after successful provider confirmation does the application:

- Lock the deposit.
- Lock the user's balance.
- Credit the balance.
- Create the deposit ledger entry.
- Mark the deposit as `COMPLETED`.
- Create the audit log.

These database changes happen within one Unit of Work transaction.

Repeated verification of an already completed deposit does not credit the balance again.

### Frontend redirect

After processing the callback, the backend redirects the browser to `FRONTEND_URL`.

Successful processing includes:

- `depositId`
- `depositStatus`

If callback processing fails, the frontend receives:

- `depositStatus=verification_failed`

The frontend redirect is informational. The database deposit status remains the authoritative payment result.

### Manual verification endpoint

`POST /deposits/:id/verify` is also available to the authenticated user.

It provides an additional way to trigger server-side verification, for example if the browser callback was interrupted.

The frontend does not need to ask the user to manually enter a provider token or order ID.

---

## Withdrawal Flow

Withdrawals are initiated by authenticated users and processed by administrators.

### User withdrawal request

1. The user submits an amount, currency, and destination.
2. The backend validates the amount.
3. The user's balance is locked.
4. The requested amount is debited.
5. A withdrawal record is created with `PENDING` status.
6. A ledger entry records the debit.
7. An audit log records the request.

All these operations are committed together.

The withdrawal amount is reserved immediately by reducing the available balance.

### Administrator processing

Administrators can change withdrawal status.

Supported statuses:

- `PENDING`
- `APPROVED`
- `REJECTED`
- `COMPLETED`

**Approval**

The withdrawal is marked as approved. The reserved amount remains deducted.

**Rejection**

The withdrawal is rejected.

The reserved amount is returned to the user's balance, and a refund ledger entry is created.

The rejection reason is retained.

**Completion**

The withdrawal is marked as completed, and the transaction ID can be stored.

Completion does not create another balance debit because the amount was already reserved when the user requested the withdrawal.

### Notifications

After the financial transaction commits, the application sends the appropriate in-app and email notifications for approval or rejection.

Notification failures must not roll back a successfully committed financial operation.

---

## Location Management

TMAR-Travel is the source of available locations.

TMAR-Cert periodically synchronizes those locations into its local database.

The synchronization process:

1. Fetches available locations from TMAR-Travel.
2. Validates the response.
3. Checks the returned total against the number of received items.
4. Validates location IDs and fields.
5. Rejects duplicate external IDs.
6. Synchronizes the records locally.

Location synchronization runs immediately on application startup and every 15 minutes.

### Local location configuration

TMAR-Cert maintains local configuration for synchronized locations.

Administrators can manage:

- Location availability.
- Enabled/disabled state.
- Capacity.
- Fee per vehicle.
- Date-specific capacity and fee overrides.

Synchronization updates externally sourced location information. Local operational configuration should remain under TMAR-Cert administration.

### Date overrides

A date override allows administrators to change the capacity or fee for a specific location on a specific date.

For a given date, the effective values are:

- Capacity: date override capacity, otherwise location capacity.
- Fee: date override fee, otherwise location fee, otherwise global default permit fee.

---

## Permit Availability and Pricing

The availability endpoint estimates permit capacity and fees before permit creation.

The request includes:

- Location ID.
- Start date.
- End date.
- Vehicle count.
- Passenger count.

The response provides daily availability and estimated fees.

### Capacity calculation

Capacity is measured by the number of reserved passengers, not the number of vehicles.

For each date:

`Remaining capacity = Effective capacity - Reserved passengers`

A date is available when:

`Remaining capacity >= Requested passenger count`

The calculation considers permits that still reserve capacity according to their status and date range.

### Fee calculation

The fee is calculated per vehicle, per day.

`Daily fee = Effective fee per vehicle × Vehicle count`

`Total estimated fee = Sum of daily fees`

All amounts are represented using decimal-safe string calculations.

### Important availability rule

Availability is an estimate, not a reservation.

Another user may create a permit after the availability request.

Therefore, `CreatePermitUseCase` repeats the capacity and pricing checks inside the creation transaction.

The frontend must treat the result as an estimate and use the actual permit creation response as authoritative.

---

## Permit Lifecycle

A permit contains:

- Owner.
- Location.
- Start and end dates.
- Passengers.
- Vehicles.
- Total amount.
- Currency.
- QR verification token.
- Status.

### Permit creation

The user submits:

- Location.
- Date range.
- Passenger information.
- Vehicle information.

The backend validates the input, including:

- At least one passenger.
- At least one passenger marked as leader.
- At least one vehicle.
- Valid passenger and vehicle fields.
- Unique passenger national IDs within the permit.
- Unique vehicle plate IDs within the permit.
- Valid date range.
- Booking horizon.

The creation workflow then:

1. Locks the location.
2. Loads permit settings and date overrides.
3. Recalculates daily capacity.
4. Recalculates the total fee.
5. Locks the user's IRT balance when payment is required.
6. Debits the balance.
7. Creates a permit with a unique QR token.
8. Creates passenger and vehicle records.
9. Creates the ledger entry when the amount is non-zero.
10. Creates the audit log.

All database operations are performed inside one transaction.

A zero-fee permit does not require a balance debit or ledger entry.

### Permit statuses

| Status      | Meaning                                |
| ----------- | -------------------------------------- |
| `CONFIRMED` | Permit is active and reserves capacity |
| `EXPIRED`   | Permit's scheduled end date has passed |
| `ENDED`     | Permit was manually ended              |
| `REVOKED`   | Permit was revoked by an administrator |

### Permit verification

The QR code contains the permit's verification token.

The public verification endpoint uses the token to retrieve permit information.

The verification response includes:

- Permit ID.
- Status.
- Date range.
- Location information.
- Passenger count.
- Passenger leaders.

A QR token is a lookup credential and should not be treated as proof that a permit is currently valid for entry. The status and date range must be checked.

### Permit ending

The permit owner can end an eligible permit.

Ending a permit changes its status to `ENDED`.

The operation is audited.

### Permit expiration

The expiration scheduler runs every five minutes.

It finds confirmed permits whose end dates are before the current Tehran date and changes their status to `EXPIRED`.

### Administrator permit management

Administrators can:

- List and inspect permits.
- Update passenger and vehicle information.
- Revoke permits.

Permit updates are restricted to confirmed permits and are processed transactionally.

When permit information changes, the backend recalculates the relevant financial differences and capacity constraints.

Revocation is a separate administrative status transition.

**Revocation does not automatically mean a refund.** Refund decisions are an administrative business decision and must be handled explicitly rather than assumed from the status change.

---

## Financial Integrity

Financial correctness is a core system requirement.

The following rules apply throughout the application.

### Decimal-safe arithmetic

Financial amounts are represented as decimal strings and calculated using the shared decimal utilities.

JavaScript floating-point arithmetic must not be used for money calculations.

### Balance locking

Operations that modify a balance use pessimistic database locking.

This prevents concurrent operations from spending the same available funds.

### Unit of Work

`UnitOfWork` executes a group of repository operations inside one database transaction.

It is used for operations such as:

- Deposit verification.
- Withdrawal creation.
- Withdrawal rejection.
- Permit creation.
- Permit updates.
- Role changes.

Repositories supplied to a Unit of Work use the same TypeORM transaction manager.

### Ledger

The ledger is the financial history of balance changes.

Examples of ledger types:

- Deposit.
- Withdrawal.
- Refund.
- Permit payment.

Each entry records:

- User.
- Currency.
- Amount.
- Balance before.
- Balance after.
- Reference.
- Additional metadata.

The ledger should not be used as a replacement for the current balance. The balance is the current available amount; the ledger explains how it changed.

### Transaction boundaries

Financial state changes must be atomic.

For example, a successful deposit must not be able to credit a balance without also completing the deposit and recording the corresponding ledger entry.

Likewise, a rejected withdrawal must not be able to refund the balance without recording the refund and changing the withdrawal status.

External provider calls are not part of PostgreSQL transactions. They are handled separately, with local state and provider confirmation used to reconcile the operation.

---

## Notifications

Notifications are persisted in the database.

Supported channels include:

- In-app.
- Email.
- SMS (provider not currently configured).
- Telegram (provider not currently configured).

The current operational delivery workflow uses in-app notifications and SMTP email.

Each channel has its own notification record and delivery status.

Notification failures are recorded rather than silently ignored.

Email delivery uses the configured SMTP provider.

---

## Audit Logging

Important business and administrative operations create audit records.

Audit logs capture the actor, target user, action, and relevant metadata.

Examples include:

- Deposit completion.
- Withdrawal requests.
- Withdrawal approval or rejection.
- Permit creation.
- Permit ending.
- User role changes.

Audit logs provide an operational history and should not be treated as ordinary editable application records.

---

## Background Jobs

The application currently has two in-process schedulers.

| Scheduler                   |   Interval | Responsibility                              |
| --------------------------- | ---------: | ------------------------------------------- |
| `LocationSyncScheduler`     | 15 minutes | Synchronizes locations from TMAR-Travel     |
| `PermitExpirationScheduler` |  5 minutes | Expires permits whose end dates have passed |

Both run once during application startup.

They prevent overlapping executions within the same application instance.

These are in-process schedulers, not distributed job queues. If multiple application instances are deployed, each instance can execute the jobs. Production deployments with multiple replicas should account for that before relying on these schedulers for exactly-once execution.

---

## API Security

The application includes several HTTP security controls.

- Global request throttling: 60 requests per 60 seconds.
- Helmet security headers.
- CORS restricted to the configured frontend origin.
- Credentialed requests.
- Origin validation for state-changing requests.
- Exact callback exemption for the Parsian payment endpoint.
- Global DTO validation.
- Unknown DTO properties are rejected.
- Request IDs are generated and returned in `X-Request-Id`.
- HTTP requests are logged with status and duration.
- Global exception translation.

The Parsian callback is intentionally exempted from frontend Origin validation because it is sent by the payment provider.

The callback still performs its own provider, order, token, status, and amount validation.

---

## Project Structure

```text
src/
├── api/
│   ├── admin/
│   ├── auth/
│   ├── deposits/
│   ├── health/
│   ├── locations/
│   ├── pages/
│   ├── permits/
│   ├── users/
│   ├── withdrawals/
│   └── http-exception.filter.ts
│
├── application/
│   ├── interfaces/
│   ├── use-cases/
│   └── application.module.ts
│
├── domain/
│   ├── entities/
│   ├── enums/
│   ├── exceptions/
│   ├── repositories/
│   └── utils/
│
├── infrastructure/
│   ├── config/
│   ├── database/
│   │   ├── migrations/
│   │   ├── orm-entities/
│   │   ├── repositories/
│   │   └── unit-of-work.typeorm.ts
│   ├── services/
│   └── infrastructure.module.ts
│
├── shared/
│   └── pagination/
│
├── app.module.ts
└── main.ts
```

---

## Environment Configuration

The application validates environment variables at startup using Joi.

The following variables are used by the current implementation.

### Application

| Variable           | Description                                                |
| ------------------ | ---------------------------------------------------------- |
| `NODE_ENV`         | `development`, `test`, or `production`                     |
| `PORT`             | HTTP port                                                  |
| `TRUST_PROXY`      | Number of trusted proxy hops                               |
| `FRONTEND_URL`     | Frontend origin and callback redirect destination          |
| `BACKEND_URL`      | Public backend URL used to construct payment callback URLs |
| `SWAGGER_ENABLED`  | Enable or disable Swagger                                  |
| `DEFAULT_CURRENCY` | Default user balance currency                              |

### PostgreSQL

| Variable      | Description       |
| ------------- | ----------------- |
| `DB_HOST`     | Database host     |
| `DB_PORT`     | Database port     |
| `DB_USERNAME` | Database username |
| `DB_PASSWORD` | Database password |
| `DB_NAME`     | Database name     |

### TMAR-Travel

| Variable              | Description                            |
| --------------------- | -------------------------------------- |
| `TMAR_JWT_SECRET`     | Secret used to verify TMAR-Travel JWTs |
| `TMAR_TRAVEL_API_URL` | TMAR-Travel API base URL               |

### Parsian

| Variable              | Description                        |
| --------------------- | ---------------------------------- |
| `PARSIAN_PIN`         | Parsian terminal/PIN               |
| `PARSIAN_SALE_URL`    | Parsian sale SOAP endpoint         |
| `PARSIAN_CONFIRM_URL` | Parsian confirmation SOAP endpoint |

Parsian configuration is optional when the provider is not enabled. The provider is registered only when the required Parsian settings are available.

### SMTP

| Variable        | Description                           |
| --------------- | ------------------------------------- |
| `SMTP_HOST`     | SMTP host                             |
| `SMTP_PORT`     | SMTP port                             |
| `SMTP_SECURE`   | Whether SMTP uses a secure connection |
| `SMTP_USER`     | SMTP username                         |
| `SMTP_PASSWORD` | SMTP password                         |
| `SMTP_FROM`     | Sender email address                  |

Never commit production secrets to the repository.

---

## Development

### Requirements

- Node.js 20+
- npm
- PostgreSQL

### Install dependencies

```bash
npm install
```

### Configure environment

Create a `.env` file in the project root.

Configure PostgreSQL, TMAR-Travel integration, SMTP, and the payment provider as needed.

### Start development server

```bash
npm run start:dev
```

### Build

```bash
npm run build
```

### Type checking

```bash
npm run typecheck
```

### Run tests

```bash
npm test
```

### Swagger

When `SWAGGER_ENABLED=true`, API documentation is available at:

```text
/api/docs
```

---

## Database and Migrations

TypeORM is used for database access.

There are two database configuration entry points:

- `typeorm.config.ts`: NestJS application configuration.
- `data-source.ts`: TypeORM CLI configuration.

Development schema synchronization is enabled only in development mode.

Production schema changes should be handled through migrations.

### Migration commands

Generate a migration:

```bash
npm run migration:generate -- src/infrastructure/database/migrations/MigrationName
```

Run migrations:

```bash
npm run migration:run
```

Revert the latest migration:

```bash
npm run migration:revert
```

Run production migrations:

```bash
npm run migration:run:prod
```

Production deployments must not rely on TypeORM automatic schema synchronization.

---

## Important Design Decisions

### TMAR-Travel owns identity

TMAR-Cert does not own passwords, login sessions, or independent user registration.

The local user is a business-domain record linked to an external identity.

### Financial operations are transactional

Balances, ledger entries, and corresponding business records must remain consistent.

All related database changes belong in the same Unit of Work transaction.

### Availability is not a reservation

The availability endpoint provides an estimate.

Permit creation repeats all relevant checks while holding the required database locks.

### Capacity is passenger-based

Location capacity measures passengers, not vehicles.

Pricing is calculated per vehicle per day.

### Administrators control refunds

Permit revocation and financial refunds are separate decisions.

A revoked permit does not automatically imply a refund.

### Provider integrations are replaceable

Payment providers are accessed through interfaces and a resolver.

Application use cases should not depend directly on Parsian SOAP implementation details.

### Notifications do not control financial success

A notification delivery failure must not undo a completed financial transaction.

### External data and local configuration are separate

TMAR-Travel provides available location information.

TMAR-Cert manages local capacity, fees, enabled state, and date overrides.

### The API layer is not the business layer

Controllers should delegate to use cases.

Business rules should remain in domain entities and application workflows, not be duplicated across HTTP endpoints.

---

## Core Principle

TMAR-Cert is the system of record for permits and its own financial operations.

TMAR-Travel is the system of record for user identity and source location data.

The backend must preserve financial consistency, validate external payment confirmations independently, and enforce permit capacity at the moment of creation—not merely when availability is queried.
