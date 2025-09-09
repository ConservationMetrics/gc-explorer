# Authentication & Access Control

GuardianConnector Explorer uses Auth0 for authentication with role-based access control and configurable dataset visibility.

## User Roles

| Role | Access Level |
|------|-------------|
| **Admin** | Full access including configuration |
| **Member** | Access to restricted datasets |
| **Viewer** | Access to unrestricted datasets only |
| **Public** | Basic logged in access to public views (auto-assigned to new users) |

## Dataset Visibility

Each dataset can be configured with different access levels:

| Level | Description |
|-------|-------------|
| **Public** | Anyone can view (no login required) |
| **Signed-in** | Any authenticated user |
| **Members & Admins** | Member role or higher |
| **Admins only** | Admin role only |

### Configuration

1. Go to **Configuration** (Admin only)
2. Select a dataset
3. Set **Visibility** level
4. Click **Submit**

## Auth0 Setup

### Required Configuration

1. **Enable RBAC** for your API in Auth0 dashboard
2. **Authorize Management API** access with scopes:
   - `read:users`
   - `read:user_idp_tokens` 
   - `update:users`
3. **Create roles** in User Management → Roles

### Role Management

- **Assign roles**: User Management → Users → [User] → Roles tab
- **New users** automatically get "Public" role
- **Multiple roles** supported but not recommended

## Troubleshooting

- **RBAC not working**: Restart the application after Auth0 configuration
- **Public views not working**: Check dataset visibility is set to "Public"
- **Access denied**: Verify user has appropriate role assigned in Auth0