// In-memory post lock service to prevent concurrent editing
// This service maintains locks in memory without database modifications

export interface PostLock {
  postId: string;
  userId: string;
  userEmail: string;
  userName: string;
  lockedAt: Date;
  lastHeartbeat: Date;
}

class PostLockService {
  private locks: Map<string, PostLock> = new Map();
  private readonly LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  private readonly HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds

  constructor() {
    // Clean up stale locks every minute
    setInterval(() => {
      this.cleanupStaleLocks();
    }, 60 * 1000);
  }

  /**
   * Attempt to acquire a lock on a post
   * Returns the lock if successful, or the existing lock if post is already locked
   */
  acquireLock(postId: string, userId: string, userEmail: string, userName: string): { success: boolean; lock: PostLock | null; existingLock?: PostLock } {
    const existingLock = this.locks.get(postId);

    // If there's an existing lock by a different user, check if it's still valid
    if (existingLock && existingLock.userId !== userId) {
      if (this.isLockValid(existingLock)) {
        return {
          success: false,
          lock: null,
          existingLock
        };
      } else {
        // Lock has expired, remove it
        this.locks.delete(postId);
      }
    }

    // Create or update the lock
    const lock: PostLock = {
      postId,
      userId,
      userEmail,
      userName,
      lockedAt: existingLock?.lockedAt || new Date(),
      lastHeartbeat: new Date()
    };

    this.locks.set(postId, lock);

    return {
      success: true,
      lock
    };
  }

  /**
   * Release a lock on a post
   */
  releaseLock(postId: string, userId: string): { success: boolean } {
    const existingLock = this.locks.get(postId);

    // Only the user who acquired the lock can release it
    if (existingLock && existingLock.userId === userId) {
      this.locks.delete(postId);
      return { success: true };
    }

    return { success: false };
  }

  /**
   * Update the heartbeat for a lock to keep it alive
   */
  updateHeartbeat(postId: string, userId: string): { success: boolean } {
    const existingLock = this.locks.get(postId);

    if (existingLock && existingLock.userId === userId) {
      existingLock.lastHeartbeat = new Date();
      this.locks.set(postId, existingLock);
      return { success: true };
    }

    return { success: false };
  }

  /**
   * Get the current lock status for a post
   */
  getLockStatus(postId: string): { isLocked: boolean; lock: PostLock | null } {
    const lock = this.locks.get(postId);

    if (!lock) {
      return { isLocked: false, lock: null };
    }

    // Check if lock is still valid
    if (this.isLockValid(lock)) {
      return { isLocked: true, lock };
    } else {
      // Lock has expired, remove it
      this.locks.delete(postId);
      return { isLocked: false, lock: null };
    }
  }

  /**
   * Check if a user currently holds a lock
   */
  hasLock(postId: string, userId: string): boolean {
    const lock = this.locks.get(postId);
    return lock !== undefined && lock.userId === userId && this.isLockValid(lock);
  }

  /**
   * Force release a lock (admin only)
   */
  forceReleaseLock(postId: string): { success: boolean } {
    if (this.locks.has(postId)) {
      this.locks.delete(postId);
      return { success: true };
    }
    return { success: false };
  }

  /**
   * Check if a lock is still valid based on heartbeat
   */
  private isLockValid(lock: PostLock): boolean {
    const now = new Date().getTime();
    const lastHeartbeat = lock.lastHeartbeat.getTime();
    return (now - lastHeartbeat) < this.LOCK_TIMEOUT;
  }

  /**
   * Clean up stale locks that haven't received heartbeats
   */
  private cleanupStaleLocks(): void {
    const now = new Date().getTime();
    const locksToRemove: string[] = [];

    this.locks.forEach((lock, postId) => {
      const lastHeartbeat = lock.lastHeartbeat.getTime();
      if ((now - lastHeartbeat) >= this.LOCK_TIMEOUT) {
        locksToRemove.push(postId);
      }
    });

    locksToRemove.forEach(postId => {
      console.log(`[PostLockService] Cleaning up stale lock for post ${postId}`);
      this.locks.delete(postId);
    });
  }

  /**
   * Get all active locks (for debugging/monitoring)
   */
  getAllLocks(): PostLock[] {
    return Array.from(this.locks.values()).filter(lock => this.isLockValid(lock));
  }
}

// Export a singleton instance
export const postLockService = new PostLockService();

