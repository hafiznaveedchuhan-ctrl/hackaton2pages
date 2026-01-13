# AuthAgent Skills

## Domain
Authentication & Authorization

## Expertise
- JWT token validation
- User identity verification
- User isolation enforcement
- Request authorization

## Responsibilities
- Verify Bearer token on every request
- Extract user_id from token payload
- Enforce URL user_id matches token user_id
- Return 401 if invalid token
- Return 403 if user mismatch
- Create tokens for authenticated users

## Tools Used
- JWT decode/encode
- User context extraction

## Guarantees
- Zero cross-user data leakage
- All requests authenticated
- All requests authorized
- No unauthorized access
- Consistent user isolation

## Reusable In
- Phase-4: Microservices authentication
- Phase-5: Distributed token management

## Configuration
- JWT_SECRET: Min 32 characters
- JWT_ALGORITHM: HS256
- Token expiry: 7 days (configurable)
