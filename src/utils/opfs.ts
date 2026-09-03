/**
 * OPFSManager
 * Manages staging of large video files using Origin Private File System (OPFS).
 * Provides streaming write support and in-memory fallback when OPFS is unavailable.
 */

export class OPFSManager {
  private static inMemoryStore = new Map<string, Blob>();
  private static folderName = 'video_cut_staging';

  /**
   * Checks if OPFS is natively supported and accessible in the current browser context.
   */
  public static isSupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      Boolean(navigator.storage?.getDirectory)
    );
  }

  /**
   * Gets the root directory handle for staging files.
   */
  private static async getStagingDirectory(): Promise<FileSystemDirectoryHandle | null> {
    if (!this.isSupported()) return null;
    try {
      const root = await navigator.storage.getDirectory();
      return await root.getDirectoryHandle(this.folderName, { create: true });
    } catch (err) {
      console.warn('[OPFS] Failed to access OPFS root directory, falling back to memory:', err);
      return null;
    }
  }

  /**
   * Writes a File or Blob to OPFS via stream to avoid JS heap exhaustion.
   */
  public static async writeFile(name: string, data: Blob | File | ArrayBuffer): Promise<void> {
    const dir = await this.getStagingDirectory();
    const blob = data instanceof ArrayBuffer ? new Blob([data]) : data;

    if (dir) {
      try {
        const fileHandle = await dir.getFileHandle(name, { create: true });
        // Use createWritable if supported for streaming write
        if ('createWritable' in fileHandle) {
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          return;
        }
      } catch (err) {
        console.warn(`[OPFS] Error writing ${name} to OPFS, falling back to memory:`, err);
      }
    }

    // In-memory fallback
    this.inMemoryStore.set(name, blob);
  }

  /**
   * Reads a staged file as an ArrayBuffer.
   */
  public static async readFile(name: string): Promise<ArrayBuffer> {
    const dir = await this.getStagingDirectory();

    if (dir) {
      try {
        const fileHandle = await dir.getFileHandle(name);
        const file = await fileHandle.getFile();
        return await file.arrayBuffer();
      } catch (err) {
        console.warn(`[OPFS] Error reading ${name} from OPFS:`, err);
      }
    }

    const fallbackBlob = this.inMemoryStore.get(name);
    if (fallbackBlob) {
      return await fallbackBlob.arrayBuffer();
    }

    throw new Error(`[OPFS] File not found: ${name}`);
  }

  /**
   * Gets a staged file as a standard File object.
   */
  public static async getFile(name: string): Promise<File | null> {
    const dir = await this.getStagingDirectory();

    if (dir) {
      try {
        const fileHandle = await dir.getFileHandle(name);
        return await fileHandle.getFile();
      } catch {
        // Fall through to memory store
      }
    }

    const fallbackBlob = this.inMemoryStore.get(name);
    if (fallbackBlob) {
      return new File([fallbackBlob], name, { type: fallbackBlob.type });
    }

    return null;
  }

  /**
   * Deletes a staged file from OPFS or memory.
   */
  public static async deleteFile(name: string): Promise<void> {
    const dir = await this.getStagingDirectory();

    if (dir) {
      try {
        await dir.removeEntry(name);
      } catch {
        // File may not exist or already removed
      }
    }

    this.inMemoryStore.delete(name);
  }

  /**
   * Lists all currently staged files.
   */
  public static async listFiles(): Promise<string[]> {
    const dir = await this.getStagingDirectory();
    const results: string[] = [];

    if (dir) {
      try {
        // Async iteration over directory handle entries
        // @ts-expect-error - entries() exists on FileSystemDirectoryHandle in modern browsers
        for await (const [entryName] of dir.entries()) {
          results.push(entryName);
        }
        return results;
      } catch {
        // Fallback to memory
      }
    }

    return Array.from(this.inMemoryStore.keys());
  }

  /**
   * Clears all staged files in the staging directory.
   */
  public static async clearAll(): Promise<void> {
    const files = await this.listFiles();
    await Promise.all(files.map(f => this.deleteFile(f)));
    this.inMemoryStore.clear();
  }

  /**
   * Cleans up stale temp files from crashed or aborted sessions at app startup.
   */
  public static async cleanStaleTempFiles(): Promise<void> {
    await this.clearAll();
  }

  /**
   * Checks storage quota if navigator.storage.estimate is available.
   */
  public static async getAvailableSpace(): Promise<{ quota: number; usage: number }> {
    if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota ?? 0,
          usage: estimate.usage ?? 0,
        };
      } catch {
        // fallback
      }
    }
    return { quota: 0, usage: 0 };
  }
}
