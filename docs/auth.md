# Role-Based Access Control (RBAC) with Auth0

This document describes how Role-Based Access Control (RBAC) is implemented in the GuardianConnector Explorer application using Auth0, including the new route-level visibility permissions.

## Overview

The application uses Auth0's core RBAC functionality to control access to different routes based on user roles. Users are assigned roles in the Auth0 dashboard, and the application fetches these roles during authentication to enforce access control.

Additionally, the application now supports **route-level visibility permissions** that allow administrators to control who can access specific dataset views, independent of user roles.

## Access Control Matrix

| Role         | Access Level                          | Routes                                      |
| ------------ | ------------------------------------- | ------------------------------------------- |
| **Admin**    | Full access                           | All routes including `/config`              |
| **Member**   | Restricted access                     | Restricted routes (cannot access `/config`) |
| **Guest**    | Limited access                        | Guest and unrestricted routes only          |
| **SignedIn** | Logged in but no elevated permissions | Same access as unauthenticated users        |

## Route-Level Visibility Permissions

### Overview

In addition to user role-based access control, the application now supports **route-level visibility permissions** that allow administrators to control access to specific dataset views. This is configured through the Config component for each dataset.

### Permission Levels

Each dataset view can be configured with one of four visibility levels:

| Permission Level | Description   | Access Requirements                                                                  |
| ---------------- | ------------- | ------------------------------------------------------------------------------------ |
| **`anyone`**     | Public access | No authentication required - anyone with the link can view (includes SignedIn users) |
| **`guest`**      | Guest access  | Requires Guest, Member, or Admin role                                                |
| **`member`**     | Member access | Requires Member or Admin role                                                        |
| **`admin`**      | Admin access  | Requires Admin role only                                                             |

### Configuration

Route-level permissions are configured in the **Config** section of the application:

1. Navigate to **Configuration** (Admin only)
2. Select a dataset table
3. In the **"Visibility"** section, choose the appropriate permission level
4. Click **Submit** to save changes

## Auth0 Configuration

### Prerequisites

Before implementing RBAC, ensure:

1. **RBAC is enabled** for your API in Auth0 dashboard
2. **Management API access** is configured for your application
3. **Required scopes** are granted to your application
4. **Public role exists** in Auth0

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

4. **Create Required Roles** (if not exists):
   - Go to **User Management > Roles**
   - Click **"+ Create Role"**
   - Create the following roles:
     - **Name**: `SignedIn` - Description: `User is logged in but not yet approved for higher access`
     - **Name**: `Guest` - Description: `User is logged in with guest-level access`
   - Note the Role IDs for configuration

## Role Management

### Creating Roles

1. Navigate to **User Management > Roles** in the Auth0 dashboard
2. Click **"+ Create Role"** (blue button in the top right)
3. Enter role details:
   - **Name**: Admin, Member, Guest, or SignedIn
   - **Description**: Brief description of permissions

**Required Roles in Auth0:**

- **SignedIn**: "User is logged in but not yet approved for higher access" (assigned automatically)
- **Guest**: "User is logged in with guest-level access"
- **Member**: "User is logged in with member permissions"
- **Admin**: "User is logged in with admin permissions"

![Auth0 Roles Management](roles.png)

_Screenshot showing the existing roles (Admin, Member, Guest, SignedIn) and the "+ Create Role" button in the Auth0 dashboard_

**Existing Roles in the System:**

- **Admin**: "can access anything a member can, plus /config"
- **Member**: "can access member, guest, and unrestricted views routes"
- **Guest**: "can access guest and unrestricted views routes"
- **SignedIn**: "logged in but no elevated permissions (same access as unauthenticated users)"

### Assigning Roles to Users

1. Go to **User Management > Users**
2. Click on the user's name
3. Navigate to the **"Roles"** tab
4. Click **"Assign Role"**
5. Select the appropriate role(s)

**Note**: Users can have multiple roles, but it's recommended to assign only the highest-level role needed (e.g., assign Admin and remove Member role).

**Automatic Role Assignment**: New users with no roles are automatically assigned the "SignedIn" role via the Management API.

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

### Automated Testing

The application includes Playwright e2e tests that verify the visibility system works correctly. See the `e2e/` directory for test specifications.

## API References

### Auth0 Documentation References

- [Configure Core RBAC](https://auth0.com/docs/manage-users/access-control/configure-core-rbac) - Core RBAC setup guide
- [Register APIs](https://auth0.com/docs/get-started/auth0-overview/set-up-apis) - How to register and configure APIs
- [View User Roles](https://auth0.com/docs/manage-users/access-control/configure-core-rbac/rbac-users/view-user-roles) - Managing user roles
- [Get User Roles Endpoint](https://auth0.com/docs/api/management/v2#!/Users/get_user_roles) - Management API reference
- [Assign Roles to Users](https://auth0.com/docs/api/management/v2#!/Users/post_user_roles) - Assign roles via Management API

## Troubleshooting

### Common Issues

1. **"No roles found"**: Check if user has roles assigned in Auth0 dashboard
2. **"Management API configuration missing"**: Verify environment variables are set
3. **"Failed to fetch user roles"**: Check Management API authorization and scopes
4. **"Access denied"**: Verify user has appropriate role assigned
5. **"Public views not working"**: Check that `routeLevelPermission` is set to `'anyone'` in the dataset configuration
6. **"Guest permission not working"**: Verify the Guest role exists in Auth0 and is properly assigned to users
7. **"Role assignment failed"**: Verify Management API has `update:users` scope

### RBAC not working in a GC-Explorer instance despite correct Auth0 configuration

We have seen cases that when setting up RBAC in a GC-Explorer instance, that it is not yet working despite correct Auth0 configuration. The workaround is to restart the GC-Explorer instance _after_ the RBAC configuration has been made.

### Visibility permissions not taking effect

If route-level visibility permissions are not working:

1. **Check configuration**: Verify the dataset has `routeLevelPermission` set correctly
2. **Clear cache**: Restart the application to ensure configuration changes are loaded
3. **Check middleware**: Verify the middleware is correctly reading the permission field
4. **Test with different users**: Ensure the behavior is consistent across different authentication states
