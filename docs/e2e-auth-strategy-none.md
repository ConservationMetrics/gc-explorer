# How Authentication Works with `authStrategy: "none"`

## Overview

When `NUXT_PUBLIC_AUTH_STRATEGY: "none"` is set in `docker-compose.tests.yml`, Auth0 authentication is **disabled**, but **session management still works** for testing purposes.

## Key Concepts

### 1. `authStrategy: "none"` Only Affects Auth0 Redirects

The `authStrategy` setting controls whether the application redirects unauthenticated users to Auth0's login page. When set to `"none"`:

- ✅ **No redirects to `/login`** happen automatically
- ✅ **Sessions still work** - `useUserSession()` from `nuxt-auth-utils` reads sessions regardless of authStrategy
- ✅ **Permission checks still run** - The middleware enforces RBAC even with `authStrategy: "none"`

### 2. How Test Sessions Work

The test authentication flow:

1. **Test fixture calls `/api/test/set-session`** (POST endpoint)
   ```typescript
   await request.post("/api/test/set-session", { data: { role: Role.Member } });
   ```

2. **Server sets session using `setUserSession()`**
   ```typescript
   await setUserSession(event, {
     user: { auth0: "test@example.com", roles: [...], userRole: Role.Member },
     loggedInAt: Date.now(),
   });
   ```
   This creates a **session cookie** that persists across requests.

3. **Middleware reads session via `useUserSession()`**
   ```typescript
   const session = useUserSession();
   const { loggedIn, user } = session;
   ```
   `useUserSession()` reads the session cookie set in step 2, regardless of `authStrategy`.

4. **Permission checks run** based on the session
   ```typescript
   if (!loggedIn.value) {
     if (authStrategy === "auth0") return router.push("/login"); // Skipped when "none"
     // But still blocks member/admin routes in CI/test mode
     if ((process.env.CI || process.env.NODE_ENV === "test") && 
         (permission === "member" || permission === "admin")) {
       return router.push("/?reason=unauthorized");
     }
   }
   ```

## Middleware Flow with `authStrategy: "none"`

Looking at `middleware/oauth.global.ts`:

### For Dataset Routes (`/alerts/*`, `/gallery/*`, `/map/*`)

```typescript
// Line 116-127: Check if user is logged in
if (!loggedIn.value) {
  if (authStrategy === "auth0") return router.push("/login"); // ❌ Skipped when "none"
  
  // ✅ But still enforces permissions in CI/test mode
  if ((process.env.CI || process.env.NODE_ENV === "test") &&
      (permission === "member" || permission === "admin")) {
    return router.push("/?reason=unauthorized"); // Blocks access
  }
  return; // Allows guest/unrestricted routes
}

// Line 129-166: If logged in, check role-based permissions
const userRole = typedUser?.userRole ?? Role.SignedIn;
switch (permission) {
  case "guest":
    if (userRole < Role.Guest) return router.push("/?reason=unauthorized");
    break;
  case "member":
    if (userRole < Role.Member) return router.push("/?reason=unauthorized");
    break;
  case "admin":
    if (userRole < Role.Admin) return router.push("/?reason=unauthorized");
    break;
}
```

### For Non-Dataset Routes

```typescript
// Line 177-179: Only redirects to login if authStrategy is "auth0"
if (authStrategy === "auth0" && !loggedIn.value && to.path !== "/login") {
  return router.push("/login"); // ❌ Skipped when "none"
}

// Line 182-190: Still checks admin access for /config
if (authStrategy === "auth0" && loggedIn.value && user.value) {
  // ... admin check ...
}
// Note: This block is skipped when authStrategy is "none"
```

## Why This Works

1. **`nuxt-auth-utils` sessions are independent of Auth0**
   - `setUserSession()` creates encrypted session cookies
   - `useUserSession()` reads these cookies
   - Works regardless of `authStrategy` setting

2. **Middleware checks `authStrategy` only for redirects**
   - When `authStrategy === "auth0"`: Redirects unauthenticated users to `/login`
   - When `authStrategy === "none"`: Skips redirects but still checks permissions

3. **CI/test mode enforces permissions even without Auth0**
   - Lines 120-125: Blocks member/admin routes for unauthenticated users in CI/test
   - Lines 129-166: Enforces role-based permissions for authenticated users

## Test Flow Example

```typescript
// 1. Test fixture sets session
await request.post("/api/test/set-session", { data: { role: Role.Member } });
// → Creates session cookie with Member role

// 2. Navigate to protected route
await loggedInPageAsMember.goto("/map/bcmform_responses");
// → Middleware reads session cookie
// → Sees loggedIn.value === true, userRole === Role.Member
// → Checks permission: "member" requires Role.Member or higher
// → Member role >= Member role ✅
// → Allows access
```

## Summary

- **`authStrategy: "none"`** = No Auth0 redirects, but sessions still work
- **Test endpoint** (`/api/test/set-session`) = Sets mock sessions for testing
- **Middleware** = Reads sessions and enforces permissions regardless of authStrategy
- **Permission checks** = Still run in CI/test mode even with `authStrategy: "none"`

This allows us to test RBAC without requiring actual Auth0 authentication, while still enforcing the same permission logic that would run in production.

