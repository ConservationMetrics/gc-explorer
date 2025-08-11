# Role-Based Access Control (RBAC) with Auth0

This document describes how Role-Based Access Control (RBAC) is implemented in the GuardianConnector Explorer application using Auth0.

## Overview

The application uses Auth0's core RBAC functionality to control access to different routes based on user roles. Users are assigned roles in the Auth0 dashboard, and the application fetches these roles during authentication to enforce access control.

## Access Control Matrix

| Role | Access Level | Routes |
|------|-------------|---------|
| **Admin** | Full access | All routes including `/config` |
| **Member** | Restricted access | Unrestricted routes (cannot access `/config`) |
| **Viewer** | Limited access | Unrestricted routes only |

## Implementation Details

### 1. Role Fetching Process

When a user logs in, the application:

1. **Receives basic user info** from Auth0 OAuth (email, sub, etc.)
2. **Fetches user ID** by email using Auth0 Management API
3. **Retrieves user roles** using the user ID
4. **Stores roles in session** for route protection

### 2. Management API Integration

The application uses Auth0's Management API to fetch user roles. This requires:

- **Management API authorization** for the application
- **Required scopes**: `read:users`, `read:user_idp_tokens`
- **Access token generation** with client credentials flow

### 3. Route Protection

Route protection is implemented in the global middleware (`middleware/oauth.global.ts`):

```typescript
// Check role-based access for /config route
if (to.path === "/config" && loggedIn.value && user.value) {
  const typedUser = user.value as User;
  const userRoles = typedUser.roles || [];
  const hasAdminRole = userRoles.some((role) => role.name === "Admin");
  
  if (!hasAdminRole) {
    // Redirect back to previous page
    return router.push(redirectPath);
  }
}
```

## Auth0 Configuration

### Prerequisites

Before implementing RBAC, ensure:

1. **RBAC is enabled** for your API in Auth0 dashboard
2. **Management API access** is configured for your application
3. **Required scopes** are granted to your application

### Required Auth0 Setup

1. **Register Your API** (if not already done):
   - Go to **Dashboard > Applications > APIs**
   - Click **"+ Create API"**
   - Provide API details:
     - **Name**: Your API name (e.g., "GuardianConnector Explorer")
     - **Identifier**: `https://your-domain.com` (unique identifier)
     - **Signing Algorithm**: HS256 (recommended)
   - Click **"Create"**

2. **Enable RBAC for Your API**:
   - Go to **Dashboard > Applications > APIs > Your API**
   - In the **Settings** tab, enable:
     - **"Add Permissions in the Access Token"**
     - **"RBAC"** (Role-Based Access Control)
     - **"Add Roles in the Access Token"**

3. **Authorize Management API Access**:
   - Go to **Dashboard > Applications > APIs > Auth0 Management API**
   - Navigate to **"Machine to Machine Applications"** tab
   - Find your application in the list
   - **Authorize** your application
   - Select the required scopes:
     - `read:users` - to fetch user information
     - `read:user_idp_tokens` - to read user roles

## Role Management

### Creating Roles

1. Navigate to **User Management > Roles** in the Auth0 dashboard
2. Click **"+ Create Role"** (blue button in the top right)
3. Enter role details:
   - **Name**: Admin, Member, or Viewer
   - **Description**: Brief description of permissions

![Auth0 Roles Management](roles.png)

*Screenshot showing the existing roles (Admin, Member, Viewer) and the "+ Create Role" button in the Auth0 dashboard*

**Existing Roles in the System:**
- **Admin**: "can access anything a member can, plus /config"
- **Member**: "can access both unrestricted and restricted views routes"  
- **Viewer**: "can access only unrestricted views routes"

### Assigning Roles to Users

1. Go to **User Management > Users**
2. Click on the user's name
3. Navigate to the **"Roles"** tab
4. Click **"Assign Role"**
5. Select the appropriate role(s)

**Note**: Users can have multiple roles, but it's recommended to assign only the highest-level role needed (e.g., assign Admin and remove Member role).

### Viewing User Roles

You can view assigned roles using the Auth0 dashboard or Management API:

**Dashboard Method**:
1. User Management → Users → [User Name] → Roles tab

**Management API Method**:
```bash
curl --request GET \
  --url 'https://{yourDomain}/api/v2/users/USER_ID/roles' \
  --header 'authorization: Bearer MGMT_API_ACCESS_TOKEN'
```

## Testing RBAC

### Testing Unauthorized Access

To test that unauthorized users are properly redirected:

1. **Assign Member role only** to a test user
2. **Attempt to access `/config`** route
3. **Verify redirect** back to previous page

### Testing Admin Access

To test that Admin users can access protected routes:

1. **Navigate to Admin roles page** in Auth0 dashboard
2. **Assign Admin role** to your user
3. **Access `/config`** route
4. **Verify successful access**

## Error Handling

The implementation includes comprehensive error handling:

- **No roles assigned**: User treated as having no permissions
- **API failures**: Graceful degradation with empty role arrays
- **Token expiration**: Automatic token regeneration
- **Network issues**: Fallback to basic authentication

## API References

### Auth0 Documentation References

- [Configure Core RBAC](https://auth0.com/docs/manage-users/access-control/configure-core-rbac) - Core RBAC setup guide
- [Register APIs](https://auth0.com/docs/get-started/auth0-overview/set-up-apis) - How to register and configure APIs
- [View User Roles](https://auth0.com/docs/manage-users/access-control/configure-core-rbac/rbac-users/view-user-roles) - Managing user roles
- [Get User Roles Endpoint](https://auth0.com/docs/api/management/v2#!/Users/get_user_roles) - Management API reference

### Management API Endpoints Used

1. **Get User by Email**:
   ```
   GET /api/v2/users-by-email?email={email}
   ```

2. **Get User Roles**:
   ```
   GET /api/v2/users/{user_id}/roles
   ```

3. **Get Management API Token**:
   ```
   POST /oauth/token
   ```

## Security Considerations

- **Token caching**: Management API tokens are cached for 24 hours
- **Role validation**: Server-side validation of all role-based decisions
- **Session security**: Roles stored in secure server-side sessions
- **Audit logging**: Comprehensive logging of access decisions

## Troubleshooting

### Common Issues

1. **"No roles found"**: Check if user has roles assigned in Auth0 dashboard
2. **"Management API configuration missing"**: Verify environment variables are set
3. **"Failed to fetch user roles"**: Check Management API authorization and scopes
4. **"Access denied"**: Verify user has appropriate role assigned

