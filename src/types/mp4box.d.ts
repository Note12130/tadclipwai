declare module 'mp4box' {
  export interface MP4File {
    onReady?: (info: any) => void;
    onError?: (err: any) => void;
    appendBuffer: (data: ArrayBuffer) => number;
    flush: () => void;
    // other MP4Box methods
    [key: string]: any;
  }

  export function createFile(): MP4File;
}
