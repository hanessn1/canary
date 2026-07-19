# Canary Backend

The Canary backend is a Spring Boot REST API. It intentionally owns API and application concerns only; AI implementation remains outside this module.

## Packages

- `config`: configuration properties, infrastructure beans, and MVC registrations.
- `controller`: HTTP endpoints and request/response orchestration.
- `service`: focused application services used by controllers.
- `repository`: future persistence ports and implementations; empty until storage is introduced.
- `domain`: future business objects such as `Document`, `Conversation`, `Message`, `Chunk`, `Embedding`, and `User`.
- `dto`: immutable API request and response representations.
- `mapper`: future explicit conversion between domain, transport, and persistence representations.
- `exception`: API exception-to-response translation.
- `validation`: future reusable validation annotations and validators.
- `util`: small stateless utility classes.
- `client.ai`: the future external-AI client boundary; it contains interfaces only at this stage.
- `health`: future custom Spring Boot health contributors.

## Commands

Run from this directory with a Java 25 Maven runtime:

```bash
mvn spotless:apply
mvn verify
mvn spring-boot:run
```

The public API endpoints are `GET /api/v1/health` and `GET /api/v1/version`. Operational Actuator endpoints are available under `/actuator`.
