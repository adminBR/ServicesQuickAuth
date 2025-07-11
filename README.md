# ServicesQuickAuth API Gateway
Centralized authentication and routing solution for a microservices environment. It uses NGINX as a powerful API Gateway to protect backend services by validating user identity through a dedicated Django authentication service before granting access.

This architecture simplifies development by decoupling authentication logic from the individual business services, ensuring consistent and secure access control across the entire system.

# Core Architecture
The system operates as a central gateway. All incoming requests are first intercepted by NGINX. It then performs a subrequest to a dedicated Django service to validate the user's token. Only upon successful validation is the original request forwarded to the appropriate backend microservice.

# Technology Stack
API Gateway: NGINX with the auth_request module.

Authentication Service: Django REST Framework for handling user login, token validation, and permissions.

Frontend: Vite with react router page for user interaction/managanent and login.

Backend Services: Independent applications built on any technology stack, running behind the gateway.

# Summary
This project provides a scalable and maintainable pattern for securing a microservice-based application. By centralizing authentication at the gateway, individual services remain lightweight and focused on their core business logic, while security remains robust and easy to manage.
