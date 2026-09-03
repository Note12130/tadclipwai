import MP4Box from 'mp4box';
import type { ExtractedSample, TrackMetadata } from './demuxer';

export interface MuxTrackInput {
  metadata: TrackMetadata;
  samples: ExtractedSample[];
}

/**
 * MP4Muxer
 * Packages demuxed raw audio and video samples back into a valid, playable MP4 file.
 */
export class MP4Muxer {
  public static mux(tracks: MuxTrackInput[]): Blob {
    const file = MP4Box.createFile();

    for (const { metadata, samples } of tracks) {
      if (samples.length === 0) continue;

      const trackOptions: any = {
        timescale: metadata.timescale || 1000,
        type: metadata.type,
        brands: ['isom', 'iso2', 'avc1', 'mp41'],
      };

      if (metadata.type === 'video') {
        trackOptions.width = metadata.width || 1920;
        trackOptions.height = metadata.height || 1080;
        trackOptions.avcDecoderConfigRecord = undefined;
      } else if (metadata.type === 'audio') {
        trackOptions.channel_count = metadata.audioDetails?.channelCount || 2;
        trackOptions.samplerate = metadata.audioDetails?.sampleRate || 44100;
      }

      const newTrackId = file.addTrack(trackOptions);

      // Add samples
      let baseDts = samples[0]?.dts || 0;
      for (const sample of samples) {
        file.addSample(newTrackId, sample.data, {
          duration: sample.duration,
          dts: sample.dts - baseDts,
          cts: sample.cts ? sample.cts - baseDts : 0,
          is_sync: sample.isSync,
        });
      }
    }

    const outputBuffer = file.getBuffer();
    return new Blob([outputBuffer], { type: 'video/mp4' });
  }
}
