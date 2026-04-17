import Sound from 'react-native-sound';

export type AudioQueueItem = {
  url: string;
  onEnd?: (success: boolean) => void | Promise<void>;
  onError?: (error: unknown) => void | Promise<void>;
};

class AudioManagerImpl {
  private currentSound: Sound | null = null;
  private currentUrl: string | null = null;
  private isStopped = false;

  private queue: AudioQueueItem[] = [];
  private isProcessingQueue = false;
  private didInit = false;

  private ensureInit() {
    if (this.didInit) return;
    this.didInit = true;
    // Allow playback even when the phone is on silent (iOS).
    // Also allow mixing with other audio sessions (e.g. video).
    (Sound as any).setCategory('Playback', true);
  }

  stop() {
    this.isStopped = true;
    this.queue = [];
    this.isProcessingQueue = false;

    if (this.currentSound) {
      try {
        this.currentSound.stop(() => {
          this.currentSound?.release();
          this.currentSound = null;
          this.currentUrl = null;
        });
      } catch {
        try {
          this.currentSound.release();
        } catch {
          // ignore
        }
        this.currentSound = null;
        this.currentUrl = null;
      }
    }
  }

  pause() {
    try {
      this.currentSound?.pause();
    } catch {
      // ignore
    }
  }

  resume() {
    try {
      this.currentSound?.play();
    } catch {
      // ignore
    }
  }

  async playQueue(items: AudioQueueItem[]) {
    this.ensureInit();

    // Replace any existing queue, but keep currently playing sound unless we want to interrupt.
    // For tour flow, interrupting is safer (avoid multiple overlapping voiceovers).
    this.stop();

    this.isStopped = false;
    this.queue = [...items];

    await this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (!this.isStopped && this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item?.url) continue;

      await this.playOne(item);
    }

    this.isProcessingQueue = false;
  }

  private playOne(item: AudioQueueItem): Promise<void> {
    return new Promise(resolve => {
      if (this.isStopped) {
        resolve();
        return;
      }

      try {
        // Defensive: some native modules (e.g. video) may change the audio session.
        (Sound as any).setCategory('Playback', true);

        const sound = new Sound(item.url, '', async error => {
          if (error) {
            try {
              await item.onError?.(error);
            } finally {
              resolve();
            }
            return;
          }

          this.currentSound = sound;
          this.currentUrl = item.url;

          sound.play(async success => {
            try {
              await item.onEnd?.(success);
            } finally {
              try {
                sound.release();
              } catch {
                // ignore
              }
              if (this.currentSound === sound) {
                this.currentSound = null;
                this.currentUrl = null;
              }
              resolve();
            }
          });
        });

        // If the constructor throws, handle below.
        if (!sound) {
          resolve();
        }
      } catch (error) {
        Promise.resolve(item.onError?.(error)).finally(resolve);
      }
    });
  }

  getNowPlayingUrl() {
    return this.currentUrl;
  }
}

export const AudioManager = new AudioManagerImpl();
