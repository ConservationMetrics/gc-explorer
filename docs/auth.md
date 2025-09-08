# Role-Based Access Control (RBAC) with Auth0

This document describes how Role-Based Access Control (RBAC) is implemented in the GuardianConnector Explorer application using Auth0, including the new route-level visibility permissions.

## Overview

The application uses Auth0's core RBAC functionality to control access to different routes based on user roles. Users are assigned roles in the Auth0 dashboard, and the application fetches these roles during authentication to enforce access control.

Additionally, the application now supports **route-level visibility permissions** that allow administrators to control who can access specific dataset views, independent of user roles.

## Access Control Matrix

| Role | Access Level | Routes |
|------|-------------|---------|
| **Admin** | Full access | All routes including `/config` |
| **Member** | Restricted access | Restricted routes (cannot access `/config`) |
| **Viewer** | Limited access | Unrestricted routes only |
| **Public** | Logged in but no permissions | Basic access only |

> [!NOTE]
> 
> The "Viewer" role is nominal only — it is equivalent to users who have no roles assigned in Auth0. Users without any assigned roles are treated as having Viewer-level access i.e. they can only access the unrestricted routes.

## Route-Level Visibility Permissions

### Overview

In addition to user role-based access control, the application now supports **route-level visibility permissions** that allow administrators to control access to specific dataset views. This is configured through the Config component for each dataset.

### Permission Levels

Each dataset view can be configured with one of three visibility levels:

| Permission Level | Description | Access Requirements |
|------------------|-------------|-------------------|
| **`anyone`** | Public access | No authentication required - anyone with the link can view |
| **`signed-in`** | Authenticated users | Requires login - any authenticated user (Viewer, Member, or Admin) can view |
| **`member`** | Member access | Requires Member or Admin role |
| **`admin`** | Admin access | Requires Admin role only |

### Configuration

Route-level permissions are configured in the **Config** section of the application:

1. Navigate to **Configuration** (Admin only)
2. Select a dataset table
3. In the **"Visibility"** section, choose the appropriate permission level
4. Click **Submit** to save changes

### Implementation Details

The visibility system works as follows:

1. **Middleware Check**: The global middleware (`middleware/oauth.global.ts`) checks `routeLevelPermission` for all dataset routes
2. **Public Access**: Views with `anyone` permission bypass authentication completely
3. **Protected Access**: Views with `signed-in`, `member`, or `admin` require appropriate authentication/authorization
4. **Meta Tags**: Public views automatically get `<meta name="robots" content="noindex, nofollow">` to prevent search engine indexing

### Example Use Cases

- **Public Datasets**: Set to `anyone` for datasets that should be accessible without login (e.g., public alerts, open data)
- **Internal Datasets**: Set to `signed-in` for datasets that require authentication but are accessible to all staff
- **Restricted Datasets**: Set to `member` for data that requires Member+ role, or `admin` for Admin-only data

## Implementation Details

### 1. Role Fetching Process

When a user logs in, the application:

1. **Receives basic user info** from Auth0 OAuth (email, sub, etc.)
2. **Fetches user ID** by email using Auth0 Management API
3. **Retrieves user roles** using the user ID
4. **Assigns Public role** to new users with no roles via Management API
5. **Stores roles in session** for route protection

### 2. Management API Integration

The application uses Auth0's Management API to fetch user roles and assign default roles. This requires:

- **Management API authorization** for the application
- **Required scopes**: `read:users`, `read:user_idp_tokens`, `update:users`
- **Access token generation** with client credentials flow

### 3. Route Protection

Route protection is implemented in the global middleware (`middleware/oauth.global.ts`):

```typescript
// Check route-level permissions for dataset routes
if (isDatasetRoute) {
  const permission = viewConfig?.routeLevelPermission ?? 'member';
  
  // If view is accessible to anyone, allow access without authentication
  if (permission === 'anyone') {
    return; // Allow access
  }
  
  // Check authentication and role requirements
  if (!loggedIn.value) {
    return router.push("/login");
  }
  
  // Verify user has sufficient permissions
  if (permission === 'member' && userRole < Role.Member) {
    return router.push("/");
  }
}
```

### 4. API Response Integration

Dataset API endpoints now include the `routeLevelPermission` field in their responses, allowing frontend components to:

- Determine if the view is public
- Add appropriate meta tags (e.g., robots: noindex, nofollow)
- Adjust UI behavior based on visibility level

### 5. API-Level Visibility Enforcement

All dataset API endpoints (`/api/[table]/alerts`, `/api/[table]/gallery`, `/api/[table]/map`) now enforce the same visibility rules as the middleware:

- **Public Access** (`anyone`): No authentication required, data served without restrictions
- **Signed-in Access** (`signed-in`): Requires any authenticated user
- **Member Access** (`member`): Requires Member or Admin role
- **Admin Access** (`admin`): Requires Admin role only

**HTTP Status Codes:**
- **`401 Unauthorized`**: Returned when unauthenticated users try to access protected routes
- **`403 Forbidden`**: Returned when users with insufficient roles try to access member or admin routes
- **`200 OK`**: Successful access for public or authorized users

**Implementation Example:**
```typescript
// Check visibility permissions
const permission = viewsConfig[table]?.routeLevelPermission ?? 'member';

// For public access, no authentication required
if (permission === 'anyone') {
  // Allow access without authentication
} else {
  // Check if user is authenticated
  const { user, loggedIn } = useUserSession();
  
  if (!loggedIn.value) {
    throw createError({ 
      statusCode: 401, 
      statusMessage: 'Unauthorized - Authentication required' 
    });
  }
  
  // For member permission, check user role
  if (permission === 'member') {
    const typedUser = user.value as User;
    const userRole = typedUser?.userRole || Role.Viewer;
    
    if (userRole < Role.Member) {
      throw createError({ 
        statusCode: 403, 
        statusMessage: 'Forbidden - Insufficient permissions' 
      });
    }
  }
  // For signed-in permission, any authenticated user can access
}
```

## Auth0 Configuration

### Prerequisites

Before implementing RBAC, ensure:

1. **RBAC is enabled** for your API in Auth0 dashboard
2. **Management API access** is configured for your application
3. **Required scopes** are granted to your application
4. **Public role exists** in Auth0 (ID: `rol_ZPOcr12ORHZOF2Tk`)

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

> [!NOTE]
>
> For the Auth0 Management API that is added by default, it is not necessary to enable RBAC; the previous step can be skipped.

3. **Authorize Management API Access**:
   - Go to **Dashboard > Applications > APIs > Auth0 Management API**
   - Navigate to **"Machine to Machine Applications"** tab
   - Find your application in the list
   - **Authorize** your application
   - Select the required scopes:
     - `read:users` - to fetch user information
     - `read:user_idp_tokens` - to read user roles
     - `update:users` - to assign roles to users

4. **Create Public Role** (if not exists):
   - Go to **User Management > Roles**
   - Click **"+ Create Role"**
   - Name: `Public`
   - Description: `User is logged in but not yet approved for higher access`
   - Note the Role ID for configuration

## Role Management

### Creating Roles

1. Navigate to **User Management > Roles** in the Auth0 dashboard
2. Click **"+ Create Role"** (blue button in the top right)
3. Enter role details:
   - **Name**: Admin, Member, Viewer, or Public
   - **Description**: Brief description of permissions

![Auth0 Roles Management](roles.png)

*Screenshot showing the existing roles (Admin, Member, Viewer) and the "+ Create Role" button in the Auth0 dashboard*

**Existing Roles in the System:**
- **Admin**: "can access anything a member can, plus /config"
- **Member**: "can access both unrestricted and restricted views routes"
- **Viewer**: "can access unrestricted views only"
- **Public**: "logged in but no special permissions (assigned automatically)"

### Assigning Roles to Users

1. Go to **User Management > Users**
2. Click on the user's name
3. Navigate to the **"Roles"** tab
4. Click **"Assign Role"**
5. Select the appropriate role(s)

**Note**: Users can have multiple roles, but it's recommended to assign only the highest-level role needed (e.g., assign Admin and remove Member role).

**Automatic Role Assignment**: New users with no roles are automatically assigned the "Public" role via the Management API.

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

## Testing the Visibility System

### Manual Testing

1. **Set a dataset to public**:
   - Go to Configuration → Select a dataset → Set Visibility to "Public — no sign-in required"
   - Save the configuration

2. **Test public access**:
   - Open an incognito/private browser window
   - Navigate to the dataset route (e.g., `/alerts/fake_alerts`)
   - Verify no login redirect occurs
   - Check that the page renders correctly

3. **Test protected access**:
   - Set the dataset to "Members & Admins"
   - Try accessing without authentication
   - Verify redirect to login page

4. **Test API-level enforcement**:
   - Try accessing API endpoints directly (e.g., `/api/fake_alerts/alerts`)
   - Verify public datasets return data without authentication
   - Verify protected datasets return appropriate HTTP status codes:
     - `401` for unauthenticated access
     - `403` for insufficient role access
     - `200` for authorized access

### Automated Testing

The application includes Playwright e2e tests that verify the visibility system works correctly. See the `e2e/` directory for test specifications.

## API References

### Auth0 Documentation References

- [Configure Core RBAC](https://auth0.com/docs/manage-users/access-control/configure-core-rbac) - Core RBAC setup guide
- [Register APIs](https://auth0.com/docs/get-started/auth0-overview/set-up-apis) - How to register and configure APIs
- [View User Roles](https://auth0.com/docs/manage-users/access-control/configure-core-rbac/rbac-users/view-user-roles) - Managing user roles
- [Get User Roles Endpoint](https://auth0.com/docs/api/management/v2#!/Users/get_user_roles) - Management API reference
- [Assign Roles to Users](https://auth0.com/docs/api/management/v2#!/Users/post_user_roles) - Assign roles via Management API

### Management API Endpoints Used

1. **Get User by Email**:
   ```
   GET /api/v2/users-by-email?email={email}
   ```

2. **Get User Roles**:
   ```
   GET /api/v2/users/{user_id}/roles
   ```

3. **Assign Roles to User**:
   ```
   POST /api/v2/users/{user_id}/roles
   ```

4. **Get Management API Token**:
   ```
   POST /oauth/token
   ```

## Troubleshooting

### Common Issues

1. **"No roles found"**: Check if user has roles assigned in Auth0 dashboard
2. **"Management API configuration missing"**: Verify environment variables are set
3. **"Failed to fetch user roles"**: Check Management API authorization and scopes
4. **"Access denied"**: Verify user has appropriate role assigned
5. **"Public views not working"**: Check that `routeLevelPermission` is set to `'anyone'` in the dataset configuration
6. **"Role assignment failed"**: Verify Management API has `update:users` scope

### RBAC not working in a GC-Explorer instance despite correct Auth0 configuration

We have seen cases that when setting up RBAC in a GC-Explorer instance, that it is not yet working despite correct Auth0 configuration. The workaround is to restart the GC-Explorer instance _after_ the RBAC configuration has been made.

### Visibility permissions not taking effect

If route-level visibility permissions are not working:

1. **Check configuration**: Verify the dataset has `routeLevelPermission` set correctly
2. **Clear cache**: Restart the application to ensure configuration changes are loaded
3. **Check middleware**: Verify the middleware is correctly reading the permission field
4. **Test with different users**: Ensure the behavior is consistent across different authentication states