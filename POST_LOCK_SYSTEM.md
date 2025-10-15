# Post Lock System

## Overview

The Post Lock System prevents concurrent editing conflicts when multiple administrators access the same post simultaneously. It uses an in-memory locking mechanism that doesn't require any database modifications.

## How It Works

### 1. Lock Acquisition
When an admin opens a post for editing:
- The system attempts to acquire a lock for that post
- If successful, the admin can edit the post
- If the post is already locked by another user, the admin sees a warning screen

### 2. Lock Maintenance
While editing:
- The system sends heartbeat signals every 30 seconds
- This keeps the lock active and prevents timeout
- Locks expire after 5 minutes of inactivity

### 3. Lock Release
Locks are released when:
- The admin navigates away from the edit page
- The admin closes the browser (using `sendBeacon` API)
- The lock times out (5 minutes without heartbeat)
- An admin force-releases the lock

## Architecture

### Components

#### 1. **PostLockService** (`src/lib/services/postLock.service.ts`)
- In-memory storage using JavaScript `Map`
- Manages lock lifecycle (acquire, release, heartbeat)
- Automatic cleanup of stale locks
- No database dependencies

#### 2. **Lock API Endpoints** (`src/app/api/admin/posts/lock/[postId]/route.ts`)
- `GET` - Check lock status
- `POST` - Acquire lock
- `PUT` - Update heartbeat
- `DELETE` - Release lock (with optional force parameter)

#### 3. **PostLockGuard Component** (`src/components/admin/posts/PostLockGuard.tsx`)
- React component that wraps the post form
- Handles automatic lock acquisition/release
- Manages heartbeat intervals
- Shows lock status UI

### Lock Structure

```typescript
interface PostLock {
  postId: string;
  userId: string;
  userEmail: string;
  userName: string;
  lockedAt: Date;
  lastHeartbeat: Date;
}
```

## User Experience

### Scenario 1: First User Editing
1. Admin A opens post for editing
2. Lock is acquired immediately
3. Green banner shows: "You have editing access"
4. Admin A can edit and save the post

### Scenario 2: Concurrent Access Attempt
1. Admin A is editing a post (lock acquired)
2. Admin B tries to open the same post
3. Admin B sees a warning screen with:
   - Information about who is editing (Admin A)
   - How long ago they started editing
   - Options to:
     - Go back to posts list
     - Check again (retry lock acquisition)
     - Force take over (admin only)

### Scenario 3: Lock Expiration
1. Admin A is editing but becomes inactive
2. After 5 minutes without heartbeat, lock expires
3. Admin B can now acquire the lock
4. Admin A will see an error when trying to save (lost lock)

## Admin Override

Super Admins and Editor-in-Chief roles can:
- Force release locks held by other users
- Take over editing immediately
- This is useful for emergencies or when a user forgot to close the editor

## Configuration

### Timeouts
```typescript
LOCK_TIMEOUT = 5 * 60 * 1000      // 5 minutes
HEARTBEAT_INTERVAL = 30 * 1000    // 30 seconds
```

These can be adjusted in `postLock.service.ts` if needed.

## Benefits

### ✅ Prevents Data Loss
- No more "last write wins" scenarios
- Users are aware when someone else is editing

### ✅ No Database Changes
- Uses in-memory storage
- No migration needed
- Easy to implement and remove

### ✅ Automatic Cleanup
- Stale locks are automatically removed
- No manual intervention needed

### ✅ User-Friendly
- Clear warning messages
- Multiple recovery options
- Admin override capability

## Limitations

### Server Restart
- All locks are lost when the Node.js server restarts
- This is acceptable as:
  - Locks are short-lived (5 minutes)
  - Server restarts are infrequent
  - Users will just need to reacquire locks

### Load Balancing
- If using multiple server instances, locks are per-instance
- For multi-instance setups, consider:
  - Redis-based locking
  - Database-based locking
  - Sticky sessions

### Memory Usage
- Locks are stored in RAM
- Minimal impact (each lock ~200 bytes)
- Automatic cleanup prevents memory leaks

## API Usage Examples

### Check Lock Status
```javascript
const response = await fetch(`/api/admin/posts/lock/${postId}`);
const { isLocked, lock } = await response.json();
```

### Acquire Lock
```javascript
const response = await fetch(`/api/admin/posts/lock/${postId}`, {
  method: 'POST'
});
const { success, lock, existingLock } = await response.json();
```

### Update Heartbeat
```javascript
const response = await fetch(`/api/admin/posts/lock/${postId}`, {
  method: 'PUT'
});
```

### Release Lock
```javascript
// Normal release
await fetch(`/api/admin/posts/lock/${postId}`, {
  method: 'DELETE'
});

// Force release (admin only)
await fetch(`/api/admin/posts/lock/${postId}?force=true`, {
  method: 'DELETE'
});
```

## Troubleshooting

### Lock Not Released
**Problem:** User closes browser but lock persists

**Solution:** 
- Locks auto-expire after 5 minutes
- Admin can force release
- Check heartbeat interval is working

### Can't Acquire Lock
**Problem:** Lock appears stuck

**Solution:**
1. Wait 5 minutes for auto-expiration
2. Check if another user is actually editing
3. Use admin force release if necessary

### Multiple Tabs
**Problem:** Same user opens post in multiple tabs

**Solution:**
- Each tab tries to acquire lock
- First tab wins
- Other tabs show lock screen (can force take over as same user)

## Future Enhancements

### Possible Improvements
1. **Real-time Updates** - Use WebSockets for instant lock notifications
2. **Lock Queue** - Allow users to queue for lock when it becomes available
3. **Draft Auto-save** - Auto-save drafts even without lock
4. **Collaborative Editing** - Real-time collaborative editing with Yjs/CRDT
5. **Redis Backend** - For multi-instance deployments

## Testing

### Manual Testing Checklist
- [ ] Open same post in two different browsers
- [ ] Verify second browser shows lock warning
- [ ] Wait 5 minutes, verify lock expires
- [ ] Test force release with admin account
- [ ] Close browser, verify lock is released
- [ ] Test heartbeat by monitoring network tab
- [ ] Verify lock survives page refresh in same tab

## Monitoring

Check active locks (add to admin dashboard if needed):
```javascript
import { postLockService } from '@/lib/services/postLock.service';

const activeLocks = postLockService.getAllLocks();
console.log('Active locks:', activeLocks);
```

## Support

For issues or questions:
1. Check this documentation
2. Review console logs (lock service logs cleanup actions)
3. Verify user permissions
4. Test with browser dev tools network tab

---

Last Updated: January 2025

