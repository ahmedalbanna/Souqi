# Security Spec: Souqi (سوقي)

## 1. Data Invariants
- A **PriceReport** must point to valid `cropId` and `marketId` that exist in the database.
- A **PriceReport** `reportedBy` must be the current authenticated user's UID.
- **Users** can only edit their own profile fields (`displayName`, `region`, `phoneNumber`).
- **Crops**, **Markets**, and **Advice** are read-only for general users (admin managed).
- Timestamps must be server-generated (`request.time`).

## 2. The "Dirty Dozen" Payloads (Red Team Test Cases)

1. **Identity Spoofing (Create Report)**: Create a price report with `reportedBy` set to another user's UID.
2. **State Poisoning (Price)**: Report a negative price or a string as a price.
3. **Orphaned Record**: Create a price report for a `cropId` that doesn't exist.
4. **Privilege Escalation (User)**: Create a user with `role: "admin"`.
5. **Unauthorized Update (User)**: Change another user's profile data.
6. **Immutable Field Tampering**: Attempt to change `createdAt` on a user profile.
7. **Resource Exhaustion (ID)**: Attempt to create a document with a 2MB string as an ID.
8. **Shadow Field Injection**: Create a price report with an extra field `isVerified: true` (which should only be set by system).
9. **PII Leak**: Attempt to list all users to scrape phone numbers.
10. **Admin Bypass**: Attempt to create a `crop` as a regular user.
11. **Timestamp Forgery**: Provide a client-side date string instead of `serverTimestamp()`.
12. **Bulk Delete**: Attempt to delete price reports reported by others.

## 3. Audit Result Summary

| Collection | Identity Spoofing | State Shortcutting | Resource Poisoning |
|---|---|---|---|
| users | BLOCKED (isValidUser checks uid) | BLOCKED (affectedKeys) | BLOCKED (isValidId) |
| priceReports | BLOCKED (isValidPriceReport checks reportedBy) | BLOCKED (Price is number > 0) | BLOCKED (exists() on parents) |
| crops | BLOCKED (Admin only) | N/A | BLOCKED |
| markets | BLOCKED (Admin only) | N/A | BLOCKED |
| advice | BLOCKED (Admin only) | N/A | BLOCKED |
