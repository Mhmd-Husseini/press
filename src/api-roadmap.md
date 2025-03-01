# Press Website API Roadmap

## Authentication & Users
- POST   /api/auth/register
- POST   /api/auth/login
- POST   /api/auth/logout
- POST   /api/auth/refresh-token
- POST   /api/auth/forgot-password
- POST   /api/auth/reset-password
- GET    /api/auth/verify-email/:token

## User Management
- GET    /api/users
- GET    /api/users/:id
- PUT    /api/users/:id
- DELETE /api/users/:id
- GET    /api/users/me
- PUT    /api/users/me/password

## Roles & Permissions
- GET    /api/roles
- POST   /api/roles
- PUT    /api/roles/:id
- DELETE /api/roles/:id
- POST   /api/roles/:id/permissions
- DELETE /api/roles/:id/permissions/:permissionId

## Categories
- GET    /api/categories
- POST   /api/categories
- GET    /api/categories/:id
- PUT    /api/categories/:id
- DELETE /api/categories/:id
- GET    /api/categories/:id/posts

## Posts
- GET    /api/posts
- POST   /api/posts
- GET    /api/posts/:id
- PUT    /api/posts/:id
- DELETE /api/posts/:id
- PUT    /api/posts/:id/status
- GET    /api/posts/:id/comments
- GET    /api/posts/featured
- GET    /api/posts/by-category/:categoryId
- GET    /api/posts/by-author/:authorId

## Comments
- GET    /api/comments
- POST   /api/posts/:postId/comments
- PUT    /api/comments/:id
- DELETE /api/comments/:id
- GET    /api/comments/:id/replies
- POST   /api/comments/:id/replies

## Media
- POST   /api/media/upload
- GET    /api/media/:id
- DELETE /api/media/:id
- PUT    /api/media/:id
- GET    /api/posts/:postId/media

## Tags
- GET    /api/tags
- POST   /api/tags
- PUT    /api/tags/:id
- DELETE /api/tags/:id
- GET    /api/tags/:id/posts

## Search & Filters
- GET    /api/search/posts
- GET    /api/search/categories
- GET    /api/search/users

## Audit Logs
- GET    /api/audit-logs
- GET    /api/audit-logs/:id
- GET    /api/audit-logs/by-user/:userId
- GET    /api/audit-logs/by-entity/:entityType/:entityId

## Analytics
- GET    /api/analytics/posts/views
- GET    /api/analytics/posts/popular
- GET    /api/analytics/users/active
- GET    /api/analytics/comments/recent

## Language & Localization
- GET    /api/languages
- GET    /api/translations/:locale 