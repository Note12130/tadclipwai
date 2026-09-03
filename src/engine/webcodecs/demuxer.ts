import MP4Box from 'mp4box';
import type { KeyframeInfo } from '../../types';

export interface ExtractedSample {
  trackId: number;
  data: Uint8Array;
  isSync: boolean; // keyframe
  dts: number;
  cts: number;
  duration: number;
  timeSeconds: number;
}

export interface TrackMetadata {
  id: number;
  type: 'video' | 'audio';
  codec: string;
  timescale: number;
  durationSeconds: number;
  width?: number;
  height?: number;
  nbSamples: number;
  audioDetails?: {
    channelCount: number;
    sampleRate: number;
  };
}

export interface DemuxResult {
  tracks: TrackMetadata[];
  samplesByTrack: Map<number, ExtractedSample[]>;
  keyframes: KeyframeInfo[];
  durationSeconds: number;
}

/**
 * MP4Demuxer
 * Uses mp4box.js to demux video and audio tracks, index keyframe timestamps,
 * and extract sample buffers without decoding them.
 */
export class MP4Demuxer {
  public static demux(buffer: ArrayBuffer, timeoutMs = 2000): Promise<DemuxResult> {
    return new Promise((resolve, reject) => {
      let isSettled = false;

      const timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          reject(new Error('MP4Demuxer timeout: unable to parse container samples within time limit'));
        }
      }, timeoutMs);

      try {
        const mp4boxfile = MP4Box.createFile();
        const samplesByTrack = new Map<number, ExtractedSample[]>();
        const keyframes: KeyframeInfo[] = [];
        let tracks: TrackMetadata[] = [];
        let durationSeconds = 0;

        mp4boxfile.onError = (err: unknown) => {
          if (!isSettled) {
            isSettled = true;
            clearTimeout(timer);
            reject(err);
          }
        };

        mp4boxfile.onReady = (info: any) => {
          durationSeconds = info.duration && info.timescale
            ? info.duration / info.timescale
            : 0;

          tracks = (info.tracks || []).map((t: any) => {
            const isVideo = Boolean(t.video);
            const isAudio = Boolean(t.audio);
            const type: 'video' | 'audio' = isVideo ? 'video' : isAudio ? 'audio' : 'video';

            const metadata: TrackMetadata = {
              id: t.id,
              type,
              codec: t.codec || '',
              timescale: t.timescale || 1000,
              durationSeconds: t.duration ? t.duration / (t.timescale || 1) : 0,
              width: t.video?.width || t.track_width,
              height: t.video?.height || t.track_height,
              nbSamples: t.nb_samples || 0,
            };

            if (isAudio) {
              metadata.audioDetails = {
                channelCount: t.audio?.channel_count || 2,
                sampleRate: t.audio?.sample_rate || 44100,
              };
            }

            samplesByTrack.set(t.id, []);
            return metadata;
          });

          // Request sample extraction for all tracks
          for (const track of tracks) {
            mp4boxfile.setExtractionOptions(track.id, null, {
              nbSamples: track.nbSamples || 10000,
            });
          }

          mp4boxfile.start();
        };

        mp4boxfile.onSamples = (trackId: number, _user: any, samples: any[]) => {
          const trackList = samplesByTrack.get(trackId);
          if (!trackList) return;

          const trackMeta = tracks.find(t => t.id === trackId);
          const timescale = trackMeta?.timescale || 1000;

          for (let i = 0; i < samples.length; i++) {
            const s = samples[i];
            const timeSeconds = s.dts / timescale;
            const isSync = Boolean(s.is_sync);

            if (isSync && trackMeta?.type === 'video') {
              keyframes.push({
                timeSeconds,
                sampleNumber: i,
                offset: s.offset || 0,
              });
            }

            trackList.push({
              trackId,
              data: s.data,
              isSync,
              dts: s.dts,
              cts: s.cts,
              duration: s.duration,
              timeSeconds,
            });
          }

          // Check if all tracks have gathered their samples
          const allCollected = tracks.every(t => {
            const collected = samplesByTrack.get(t.id)?.length || 0;
            return collected >= t.nbSamples;
          });

          if (allCollected && !isSettled) {
            isSettled = true;
            clearTimeout(timer);
            resolve({
              tracks,
              samplesByTrack,
              keyframes,
              durationSeconds,
            });
          }
        };

        const fileBuffer = buffer as any;
        fileBuffer.fileStart = 0;
        mp4boxfile.appendBuffer(fileBuffer);
        mp4boxfile.flush();
      } catch (err) {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timer);
          reject(err);
        }
      }
    });
  }
}
