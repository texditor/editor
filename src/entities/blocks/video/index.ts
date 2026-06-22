import File, { DeleteFileAction, EditFileAction } from '../file';
import type {
  BlockModelConstructor,
  BlockElement,
  FileItem,
  BlockSchema,
  BlockSchemaData,
  FileItemElement,
  VideoItem,
  FileBlockModelConfig,
  FileBlockModel,
} from '@/types';
import { IconPause, IconPlay, IconVideo, IconVolumeHigh, IconVolumeMute } from '@/icons';
import { addClass, append, attr, css, html, make, off, on, query, text } from 'snappykit';
import '@/styles/entities/blocks/video.css';
import { renderIcon } from '@/utils';

export default class Video extends File implements FileBlockModel {
  /**
   * Set up global configuration
   * @param config - Partial configuration
   * @returns Model constructor
   */
  public static setup(config: Partial<FileBlockModelConfig>): BlockModelConstructor {
    return super.setup(config);
  }

  /**
   * Configure block model
   * @returns Partial configuration object
   */
  protected configure(): Partial<FileBlockModelConfig> {
    const { i18n } = this.editor;

    return {
      ...super.configure(),
      ...{
        name: 'video',
        icon: IconVideo,
        className: 'tex-video tex-file',
        translation: 'video',
        groupCode: 'video',
        actions: [EditFileAction, DeleteFileAction],
        mimeTypes: [
          'video/mp4',
          'video/webm',
          'video/ogg',
          'video/x-matroska',
          'video/quicktime',
          'video/x-msvideo',
          'video/x-ms-wmv',
          'video/x-flv',
          'video/MP2T',
          'video/mpeg',
          'video/3gpp',
        ],
        visibleFieldFileName: false,
        requiredFieldFileName: false,
        maxItems: 3,
        actionSkipSelector: '.tex-video-custom-controls',
        uploadMultipleLabelText: i18n.get('uploadVideo', 'Upload video'),
        uploadAddLabelText: i18n.get('addVideo', 'Add video'),
        uploadLabelText: i18n.get('uploadVideo', 'Upload video'),
      },
    };
  }

  /**
   * Default render method for file items
   * @param item - File item data
   * @returns Rendered HTMLElement
   */
  protected renderItem(item: VideoItem, _el?: FileItemElement): HTMLElement {
    const { i18n } = this.editor;

    if (!this.isSupportedItem(item)) {
      return make('div', (div) => {
        addClass(div, 'tex-image-item-bad');
        const line = make('div', (line) => addClass(line, 'tex-image-item-bad-line'));
        const txt = make('div', (cnt) => text(cnt, i18n.get('unsupportedVideoFormat', 'Unsupported video format')));
        append(div, [line, txt]);
      });
    }

    return make('div', (vpw) => {
      addClass(vpw, 'tex-video-player-wrap');

      const videoPlayer = make('video', (video: HTMLVideoElement) => {
        addClass(video, 'tex-video-player');
        attr(video, { src: item.url || '', playsinline: '' });

        if (item?.poster) {
          attr(video, 'poster', item.poster || '');
        }

        const source = make('source', (source: HTMLSourceElement) => {
          attr(source, { src: item.url || '', type: item.type || 'video/mp4' });
        });

        append(video, source);
      });

      const playIcon = renderIcon(IconPlay, { width: 14, height: 14 });
      const pauseIcon = renderIcon(IconPause, { width: 14, height: 14 });
      const volumeHighIcon = renderIcon(IconVolumeHigh, { width: 14, height: 14 });
      const volumeMuteIcon = renderIcon(IconVolumeMute, { width: 14, height: 14 });

      const customControls = make('div', (controls) => {
        addClass(controls, 'tex-video-custom-controls');
        const playPauseBtn = make('div', (btn: HTMLButtonElement) => {
          addClass(btn, 'tex-video-play-pause-btn');
          attr(btn, 'aria-label', 'Play/Pause');
          html(btn, playIcon);

          const updatePlayPauseIcon = () => {
            html(btn, videoPlayer.paused ? playIcon : pauseIcon);
          };

          on(videoPlayer, 'play', updatePlayPauseIcon);
          on(videoPlayer, 'pause', updatePlayPauseIcon);
          on(videoPlayer, 'ended', updatePlayPauseIcon);

          on(btn, 'click', (e: Event) => {
            e.stopPropagation();
            if (videoPlayer.paused) {
              query<HTMLVideoElement>('.tex-video-player', (player) => player.pause());
              videoPlayer.play();
            } else {
              videoPlayer.pause();
            }
          });
        });

        const seekBarContainer = make('div', (container) => {
          addClass(container, ['tex-video-range-container', 'tex-video-seek-container']);

          const track = make('div', (track) => {
            addClass(track, 'tex-video-range-track');
          });

          const fill = make('div', (fill) => {
            addClass(fill, 'tex-video-range-fill');
          });

          const thumb = make('div', (thumb) => {
            addClass(thumb, 'tex-video-range-thumb');
          });

          append(container, [track]);
          append(track, [fill]);
          append(container, [thumb]);

          let isDragging = false;

          const updateSeekBar = (clientX: number) => {
            const containerRect = container.getBoundingClientRect();
            let percentage = (clientX - containerRect.left) / containerRect.width;
            percentage = Math.max(0, Math.min(1, percentage));

            css(fill, 'width', `${percentage * 100}%`);
            css(thumb, 'left', `${percentage * 100}%`);

            if (videoPlayer.duration) {
              videoPlayer.currentTime = percentage * videoPlayer.duration;
            }
          };

          const onMouseMove = (e: MouseEvent) => {
            if (isDragging) {
              updateSeekBar(e.clientX);
            }
          };

          const onMouseUp = () => {
            isDragging = false;
            off(document, 'mousemove');
            off(document, 'mouseup');
          };

          on(container, 'mousedown', (e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            isDragging = true;
            updateSeekBar(e.clientX);

            on(document, 'mousemove', onMouseMove);
            on(document, 'mouseup', onMouseUp);
          });

          on(videoPlayer, 'timeupdate', () => {
            if (!isDragging && videoPlayer.duration) {
              const percentage = videoPlayer.currentTime / videoPlayer.duration;
              css(fill, 'width', `${percentage * 100}%`);
              css(thumb, 'left', `${percentage * 100}%`);
            }
          });

          on(videoPlayer, 'loadedmetadata', () => {
            css(fill, 'width', '0%');
            css(thumb, 'left', '0%');
          });
        });

        const volumeBtn = make('div', (btn: HTMLButtonElement) => {
          addClass(btn, 'tex-video-volume-btn');
          attr(btn, 'aria-label', 'Mute/Unmute');
          html(btn, videoPlayer.muted || videoPlayer.volume === 0 ? volumeMuteIcon : volumeHighIcon);

          const updateVolumeIcon = () => {
            html(btn, videoPlayer.muted || videoPlayer.volume === 0 ? volumeMuteIcon : volumeHighIcon);
          };

          on(videoPlayer, 'volumechange', updateVolumeIcon);

          on(btn, 'click', (e: Event) => {
            e.stopPropagation();
            videoPlayer.muted = !videoPlayer.muted;
          });
        });

        const volumeSliderContainer = make('div', (container) => {
          addClass(container, ['tex-video-range-container', 'tex-video-volume-container']);

          const track = make('div', (track) => {
            addClass(track, 'tex-video-range-track');
          });

          const fill = make('div', (fill) => {
            addClass(fill, 'tex-video-range-fill');
          });

          const thumb = make('div', (thumb) => {
            addClass(thumb, 'tex-video-range-thumb');
          });

          append(container, [track]);
          append(track, [fill]);
          append(container, [thumb]);

          let isDragging = false;

          const initVolume = videoPlayer.muted ? 0 : videoPlayer.volume;
          css(fill, 'width', `${initVolume * 100}%`);
          css(thumb, 'left', `${initVolume * 100}%`);

          const updateVolume = (clientX: number) => {
            const containerRect = container.getBoundingClientRect();
            let percentage = (clientX - containerRect.left) / containerRect.width;
            percentage = Math.max(0, Math.min(1, percentage));

            css(fill, 'width', `${percentage * 100}%`);
            css(thumb, 'left', `${percentage * 100}%`);

            videoPlayer.volume = percentage;
            videoPlayer.muted = percentage === 0;
          };

          const onMouseMove = (e: MouseEvent) => {
            if (isDragging) {
              updateVolume(e.clientX);
            }
          };

          const onMouseUp = () => {
            isDragging = false;
            off(document, 'mousemove');
            off(document, 'mouseup');
          };

          on(container, 'mousedown', (e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            isDragging = true;
            updateVolume(e.clientX);

            on(document, 'mousemove', onMouseMove);
            on(document, 'mouseup', onMouseUp);
          });

          on(videoPlayer, 'volumechange', () => {
            if (!isDragging) {
              const volume = videoPlayer.muted ? 0 : videoPlayer.volume;
              css(fill, 'width', `${volume * 100}%`);
              css(thumb, 'left', `${volume * 100}%`);
            }
          });
        });

        const left = make('div', (left) => {
          addClass(left, 'tex-video-custom-controls-left');
          append(left, [playPauseBtn, seekBarContainer]);
        });

        const right = make('div', (left) => {
          addClass(left, 'tex-video-custom-controls-right');
          append(left, [volumeBtn, volumeSliderContainer]);
        });

        append(controls, [left, right]);
      });

      append(vpw, [videoPlayer, customControls]);
    });
  }

  /**
   * Saves block data to output format
   * @param blockSchema - Block schema
   * @param blockElement - Block element
   * @returns The modified block output
   */
  protected save(blockSchema: BlockSchema, blockElement?: BlockElement): BlockSchema {
    const items = this.prepareItems(blockElement);

    const resultData = this.isLinkStrategy()
      ? items.filter((item) => this.isSupportedItem(item)).map(({ size: _size, name: _name, ...item }) => item)
      : items
          .filter((item) => this.isSupportedItem(item) && item.id && item.id > 0)
          .map(({ id, caption, desc }) => ({ id, caption, desc }) as FileItem);

    return {
      ...blockSchema,
      data: resultData as BlockSchemaData,
    };
  }

  /**
   * Checks whether the given file item is a supported video.
   * @param item - The file item to check.
   * @returns True/False
   */
  private isSupportedItem(item: FileItem): boolean {
    if (!item.type) return false;

    if (!item.type.startsWith('video/')) {
      return false;
    }

    if (!this.getMimeTypes().includes(item.type)) return false;

    return true;
  }
}
