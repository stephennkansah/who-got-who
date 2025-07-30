/**
 * Async operation helpers to prevent race conditions and timing issues
 */

/**
 * Simple debounce function to prevent rapid successive calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function to limit call frequency
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Retry wrapper for async operations that might fail temporarily
 */
export const retryAsync = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (i === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  
  throw lastError!;
};

/**
 * Timeout wrapper for async operations
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    )
  ]);
};

/**
 * Simple mutex for preventing concurrent operations
 */
export class AsyncMutex {
  private locked = false;
  private queue: (() => void)[] = [];

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release(): void {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.locked = false;
    }
  }

  async runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await operation();
    } finally {
      this.release();
    }
  }
}

/**
 * Safe delay function with cleanup
 */
export const safeDelay = (ms: number): Promise<void> => {
  return new Promise(resolve => {
    const timeoutId = setTimeout(resolve, ms);
    // Store timeout ID for potential cleanup
    (resolve as any)._timeoutId = timeoutId;
  });
};

/**
 * Batch multiple async operations with concurrency control
 */
export const batchAsync = async <T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  concurrency: number = 3
): Promise<R[]> => {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(item => operation(item))
    );
    results.push(...batchResults);
  }
  
  return results;
};

/**
 * Singleton to manage Firebase operation queuing
 */
export class FirebaseOperationQueue {
  private static instance: FirebaseOperationQueue;
  private mutex = new AsyncMutex();
  private pendingOperations = new Map<string, Promise<any>>();

  static getInstance(): FirebaseOperationQueue {
    if (!FirebaseOperationQueue.instance) {
      FirebaseOperationQueue.instance = new FirebaseOperationQueue();
    }
    return FirebaseOperationQueue.instance;
  }

  async queueOperation<T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<T> {
    // If same operation is already pending, return that promise
    if (this.pendingOperations.has(key)) {
      return this.pendingOperations.get(key);
    }

    const promise = this.mutex.runExclusive(async () => {
      try {
        return await operation();
      } finally {
        this.pendingOperations.delete(key);
      }
    });

    this.pendingOperations.set(key, promise);
    return promise;
  }
}