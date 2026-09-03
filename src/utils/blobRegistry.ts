/**
 * BlobRegistry
 * Centralized registry tracking active Object URLs to prevent memory leaks in the browser.
 */

interface RegisteredBlobUrl {
  url: string;
  tag: string;
  createdAt: number;
}

export class BlobRegistry {
  private static registry = new Map<string, RegisteredBlobUrl>();

  /**
   * Creates an Object URL from a Blob/File and registers it.
   * If a previous URL exists for the same unique tag, it is automatically revoked first.
   */
  public static createUrl(blob: Blob | File, tag = 'default'): string {
    if (typeof URL === 'undefined' || !URL.createObjectURL) {
      return '';
    }

    // Auto-revoke previous URL with this unique tag if requested
    if (tag !== 'default') {
      this.revokeByTag(tag);
    }

    const url = URL.createObjectURL(blob);
    this.registry.set(url, {
      url,
      tag,
      createdAt: Date.now(),
    });

    return url;
  }

  /**
   * Revokes a specific Object URL and removes it from the registry.
   */
  public static revokeUrl(url: string | null | undefined): void {
    if (!url || typeof URL === 'undefined' || !URL.revokeObjectURL) return;

    if (this.registry.has(url)) {
      this.registry.delete(url);
    }
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignored
    }
  }

  /**
   * Revokes all Object URLs registered with a specific tag.
   */
  public static revokeByTag(tag: string): void {
    for (const [url, item] of this.registry.entries()) {
      if (item.tag === tag) {
        this.revokeUrl(url);
      }
    }
  }

  /**
   * Revokes all currently tracked Object URLs.
   */
  public static revokeAll(): void {
    for (const url of Array.from(this.registry.keys())) {
      this.revokeUrl(url);
    }
    this.registry.clear();
  }

  /**
   * Returns count of currently active tracked URLs.
   */
  public static getActiveCount(): number {
    return this.registry.size;
  }
}
