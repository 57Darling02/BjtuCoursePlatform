<template>
    <div
        v-if="arrangedStreams.length"
        ref="shellRef"
        class="sync-player-shell"
        :class="{ 'is-fullscreen': isFullscreen }"
    >
        <div
            class="streams-board"
            :class="{
                'is-single': arrangedStreams.length === 1 || hideAuxStreams,
                'is-main-only': hideAuxStreams
            }"
        >
            <article
                v-for="stream in arrangedStreams"
                :key="stream.key"
                class="stream-stage"
                :class="[
                    {
                        'is-featured': stream.key === featuredStream?.key,
                        'is-hidden-aux': hideAuxStreams && stream.key !== featuredStream?.key
                    },
                    stream.key === featuredStream?.key ? `featured-span-${featuredSpanRows}` : ''
                ]"
            >
                <button
                    class="stream-stage-media"
                    type="button"
                    @click="handleStreamStageClick(stream.key)"
                >
                    <div class="stream-stage-overlay">
                        <span class="stream-stage-label">
                            {{ resolveDisplayLabel(stream) }}
                        </span>
                        <div class="stream-stage-badges">
                            <span v-if="stream.key === featuredStream?.key" class="stream-badge stream-badge-featured">
                                主视图
                            </span>
                            <span
                                v-if="stream.key === featuredStream?.key && canToggleAuxStreams"
                                class="stream-badge stream-badge-toggle"
                                role="button"
                                tabindex="0"
                                @click.stop="toggleAuxStreams"
                                @keydown.enter.prevent.stop="toggleAuxStreams"
                                @keydown.space.prevent.stop="toggleAuxStreams"
                            >
                                {{ hideAuxStreams ? '还原' : '全屏' }}
                            </span>
                            <span v-if="stream.key === selectedAudioKey" class="stream-badge stream-badge-audio">
                                音源
                            </span>
                        </div>
                    </div>
                    <video
                        :ref="setVideoRef(stream.key)"
                        class="stream-video"
                        playsinline
                        preload="metadata"
                        @loadedmetadata="stream.key === controllerKey && syncControlState()"
                        @durationchange="stream.key === controllerKey && syncControlState()"
                        @timeupdate="stream.key === controllerKey && syncControlState()"
                        @play="stream.key === controllerKey && handleControllerPlay()"
                        @pause="stream.key === controllerKey && handleControllerPause()"
                        @seeking="stream.key === controllerKey && handleControllerSeeking()"
                        @ratechange="stream.key === controllerKey && handleControllerRateChange()"
                    />
                </button>
            </article>
        </div>

        <el-row class="control-dock" :gutter="12">
            <el-col class="control-col control-col-play">
                <div class="control-cluster control-cluster-play">
                    <button class="control-button" type="button" @click="togglePlayback">
                        <i :class="isPaused ? 'fa-solid fa-play' : 'fa-solid fa-pause'" />
                    </button>
                    <div class="timeline-box">
                        <span class="timeline-time">{{ formatTime(scrubTime) }}</span>
                        <input
                            :value="scrubTime"
                            class="timeline-slider"
                            type="range"
                            min="0"
                            :max="safeDuration"
                            step="0.1"
                            @input="handleSeekInput"
                            @mousedown="isScrubbing = true"
                            @touchstart="isScrubbing = true"
                            @change="commitSeek"
                        >
                        <span class="timeline-time">{{ formatTime(duration) }}</span>
                    </div>
                </div>
            </el-col>

            <el-col class="control-col control-col-source">
                <div class="control-cluster control-cluster-source">
                    <div class="control-group control-group-source">
                        <span class="control-label">音源</span>
                        <el-select
                            v-model="selectedAudioKey"
                            size="small"
                            class="toolbar-select"
                            :teleported="true"
                            :append-to="selectAppendTarget"
                            :show-arrow="false"
                            @change="handleAudioSourceChange"
                        >
                            <el-option
                                v-for="stream in orderedStreams"
                                :key="stream.key"
                                :label="stream.label"
                                :value="stream.key"
                            />
                        </el-select>
                    </div>

                    <div class="control-group control-group-speed">
                        <span class="control-label">倍速</span>
                        <el-select
                            v-model="selectedPlaybackRate"
                            size="small"
                            class="toolbar-select toolbar-select--compact"
                            :teleported="true"
                            :append-to="selectAppendTarget"
                            :show-arrow="false"
                            @change="handlePlaybackRateChange"
                        >
                            <el-option
                                v-for="rate in playbackRateOptions"
                                :key="rate"
                                :label="`${rate}x`"
                                :value="rate"
                            />
                        </el-select>
                    </div>
                </div>
            </el-col>

            <el-col class="control-col control-col-volume">
                <div class="control-cluster control-cluster-volume">
                    <button
                        class="control-button control-button-fullscreen"
                        type="button"
                        :title="isFullscreen ? '退出全屏' : '全屏拼盘'"
                        @click="toggleFullscreen"
                    >
                        <i :class="isFullscreen ? 'fa-solid fa-compress' : 'fa-solid fa-expand'" />
                    </button>
                    <button class="control-button control-button-volume" type="button" @click="toggleMute">
                        <i :class="volumeIconClass" />
                    </button>
                    <input
                        :value="effectiveVolume"
                        class="volume-slider"
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        @input="handleVolumeInput"
                    >
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script lang="ts" setup>
import Hls from 'hls.js';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ComponentPublicInstance, PropType } from 'vue';

type ReplayStreamOption = {
    key: string;
    label: string;
    url: string;
};

type PlaybackSnapshot = {
    currentTime: number;
    paused: boolean;
    playbackRate: number;
};

const props = defineProps({
    streams: {
        type: Array as PropType<ReplayStreamOption[]>,
        default: () => []
    }
});

const preferredControllerKeys = ['teacher', 'student', 'courseware', 'teacher-close', 'student-close', 'cinema'];
const playbackRateOptions = [0.75, 1, 1.25, 1.5, 2];

const videoElements = new Map<string, HTMLVideoElement>();
const hlsInstances = new Map<string, Hls>();
const nativeEventCleanup = new Map<string, () => void>();

const syncTimer = ref<number | null>(null);
const suppressSync = ref(false);
const shellRef = ref<HTMLElement | null>(null);
const isFullscreen = ref(false);
const hideAuxStreams = ref(false);
const featuredKey = ref('');
const selectedAudioKey = ref('');
const selectedPlaybackRate = ref(1);
const isPaused = ref(true);
const duration = ref(0);
const currentTime = ref(0);
const scrubTime = ref(0);
const isScrubbing = ref(false);
const volume = ref(1);
const isMuted = ref(false);

const orderedStreams = computed(() => props.streams.filter(stream => !!stream.url));
const streamSignature = computed(() =>
    orderedStreams.value.map(stream => `${stream.key}:${stream.url}`).join('|')
);

const controllerKey = computed(() => {
    for (const key of preferredControllerKeys) {
        if (orderedStreams.value.some(stream => stream.key === key)) {
            return key;
        }
    }
    return orderedStreams.value[0]?.key || '';
});

const featuredStream = computed(() => {
    return orderedStreams.value.find(stream => stream.key === featuredKey.value)
        || orderedStreams.value.find(stream => stream.key === controllerKey.value)
        || orderedStreams.value[0]
        || null;
});

const arrangedStreams = computed(() => {
    if (!featuredStream.value) return orderedStreams.value;
    return [
        featuredStream.value,
        ...orderedStreams.value.filter(stream => stream.key !== featuredStream.value?.key)
    ];
});

const featuredSpanRows = computed(() => {
    if (hideAuxStreams.value) return 1;
    const auxCount = Math.max(orderedStreams.value.length - 1, 0);
    if (auxCount <= 0) return 1;
    return Math.min(auxCount, 3);
});

const safeDuration = computed(() => Math.max(duration.value, 0.1));
const effectiveVolume = computed(() => (isMuted.value ? 0 : volume.value));
const canToggleAuxStreams = computed(() => orderedStreams.value.length > 1);
const selectAppendTarget = computed(() =>
    isFullscreen.value && shellRef.value ? shellRef.value : 'body'
);
const volumeIconClass = computed(() => {
    if (effectiveVolume.value <= 0) return 'fa-solid fa-volume-xmark';
    if (effectiveVolume.value < 0.5) return 'fa-solid fa-volume-low';
    return 'fa-solid fa-volume-high';
});

const supportsNativeHls = (video: HTMLVideoElement) =>
    video.canPlayType('application/vnd.apple.mpegurl') !== '';

const ensureSelectionState = () => {
    const keys = orderedStreams.value.map(stream => stream.key);
    if (!keys.length) {
        hideAuxStreams.value = false;
        featuredKey.value = '';
        selectedAudioKey.value = '';
        return;
    }
    if (keys.length <= 1) {
        hideAuxStreams.value = false;
    }

    if (!keys.includes(selectedAudioKey.value)) {
        selectedAudioKey.value = controllerKey.value || keys[0];
    }

    if (!keys.includes(featuredKey.value)) {
        featuredKey.value = selectedAudioKey.value || keys[0];
    }
};

const setVideoRef = (key: string) => (el: Element | ComponentPublicInstance | null) => {
    if (el instanceof HTMLVideoElement) {
        videoElements.set(key, el);
        return;
    }
    videoElements.delete(key);
};

const getControllerVideo = () => {
    if (!controllerKey.value) return null;
    return videoElements.get(controllerKey.value) || null;
};

const captureControllerState = (): PlaybackSnapshot | null => {
    const controllerVideo = getControllerVideo();
    if (!controllerVideo) return null;
    return {
        currentTime: controllerVideo.currentTime,
        paused: controllerVideo.paused,
        playbackRate: controllerVideo.playbackRate
    };
};

const syncAudioTracks = () => {
    const targetKey = selectedAudioKey.value;
    const targetVolume = effectiveVolume.value;

    for (const stream of orderedStreams.value) {
        const video = videoElements.get(stream.key);
        if (!video) continue;

        const isActiveAudio = stream.key === targetKey;
        video.defaultMuted = !isActiveAudio || targetVolume <= 0;
        video.muted = !isActiveAudio || targetVolume <= 0;
        video.volume = isActiveAudio ? targetVolume : 0;
    }
};

const syncControlState = () => {
    const controllerVideo = getControllerVideo();
    if (!controllerVideo) {
        currentTime.value = 0;
        scrubTime.value = 0;
        duration.value = 0;
        isPaused.value = true;
        return;
    }

    currentTime.value = controllerVideo.currentTime || 0;
    duration.value = Number.isFinite(controllerVideo.duration) ? controllerVideo.duration : 0;
    isPaused.value = controllerVideo.paused;
    selectedPlaybackRate.value = controllerVideo.playbackRate;

    if (!isScrubbing.value) {
        scrubTime.value = currentTime.value;
    }
};

const restoreControllerState = async (snapshot?: PlaybackSnapshot | null) => {
    const controllerVideo = getControllerVideo();
    if (!controllerVideo) return;

    controllerVideo.currentTime = snapshot?.currentTime ?? 0;
    controllerVideo.playbackRate = snapshot?.playbackRate ?? selectedPlaybackRate.value;
    syncAudioTracks();

    if (snapshot?.paused ?? true) {
        controllerVideo.pause();
        syncControlState();
        return;
    }

    try {
        await controllerVideo.play();
    } catch (error) {
        console.warn('回放恢复播放被阻止:', error);
        syncControlState();
    }
};

const syncFollowers = async (forceSeek = false) => {
    const controllerVideo = getControllerVideo();
    if (!controllerVideo) return;

    suppressSync.value = true;
    const tasks = orderedStreams.value.map(async (stream) => {
        const video = videoElements.get(stream.key);
        if (!video || video === controllerVideo) return;

        if (forceSeek || Math.abs(video.currentTime - controllerVideo.currentTime) > 0.35) {
            video.currentTime = controllerVideo.currentTime;
        }

        if (Math.abs(video.playbackRate - controllerVideo.playbackRate) > 0.001) {
            video.playbackRate = controllerVideo.playbackRate;
        }

        if (controllerVideo.paused) {
            video.pause();
            return;
        }

        try {
            await video.play();
        } catch (error) {
            console.warn(`同步画面播放被阻止: ${stream.key}`, error);
        }
    });

    await Promise.all(tasks);
    syncAudioTracks();
    suppressSync.value = false;
};

const startSyncLoop = () => {
    stopSyncLoop();
    syncTimer.value = window.setInterval(() => {
        const controllerVideo = getControllerVideo();
        if (!controllerVideo || controllerVideo.paused || suppressSync.value) return;

        for (const stream of orderedStreams.value) {
            const video = videoElements.get(stream.key);
            if (!video || video === controllerVideo) continue;

            const drift = controllerVideo.currentTime - video.currentTime;
            const absDrift = Math.abs(drift);

            if (absDrift > 0.45) {
                video.currentTime = controllerVideo.currentTime;
                video.playbackRate = controllerVideo.playbackRate;
                continue;
            }

            if (absDrift > 0.08) {
                video.playbackRate = drift > 0
                    ? controllerVideo.playbackRate + 0.08
                    : Math.max(0.75, controllerVideo.playbackRate - 0.08);
            } else if (Math.abs(video.playbackRate - controllerVideo.playbackRate) > 0.001) {
                video.playbackRate = controllerVideo.playbackRate;
            }
        }
    }, 1000);
};

const stopSyncLoop = () => {
    if (syncTimer.value !== null) {
        window.clearInterval(syncTimer.value);
        syncTimer.value = null;
    }
};

const destroyHls = (key: string) => {
    hlsInstances.get(key)?.destroy();
    hlsInstances.delete(key);
};

const destroyAllPlayers = () => {
    stopSyncLoop();

    for (const key of Array.from(hlsInstances.keys())) {
        destroyHls(key);
    }

    for (const cleanup of nativeEventCleanup.values()) {
        cleanup();
    }

    nativeEventCleanup.clear();
};

const bindStreamToVideo = (stream: ReplayStreamOption, video: HTMLVideoElement) => {
    destroyHls(stream.key);
    nativeEventCleanup.get(stream.key)?.();
    nativeEventCleanup.delete(stream.key);

    video.preload = 'metadata';
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.controls = false;

    if (Hls.isSupported()) {
        const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false
        });
        hls.attachMedia(video);
        hls.loadSource(stream.url);
        hlsInstances.set(stream.key, hls);
        return;
    }

    if (supportsNativeHls(video)) {
        video.src = stream.url;
        nativeEventCleanup.set(stream.key, () => {
            video.removeAttribute('src');
            video.load();
        });
        video.load();
        return;
    }

    console.warn(`当前浏览器不支持 HLS 播放: ${stream.key}`);
};

const refreshMediaBindings = async (snapshot?: PlaybackSnapshot | null) => {
    destroyAllPlayers();
    await nextTick();

    for (const stream of orderedStreams.value) {
        const video = videoElements.get(stream.key);
        if (!video) continue;
        bindStreamToVideo(stream, video);
    }

    await nextTick();
    await restoreControllerState(snapshot);
    await syncFollowers(true);
    syncControlState();
    startSyncLoop();
};

const playAll = async () => {
    const controllerVideo = getControllerVideo();
    if (!controllerVideo) return;

    try {
        await controllerVideo.play();
    } catch (error) {
        console.warn('播放被浏览器阻止:', error);
    }
};

const pauseAll = () => {
    const controllerVideo = getControllerVideo();
    if (!controllerVideo) return;

    controllerVideo.pause();
    for (const stream of orderedStreams.value) {
        if (stream.key === controllerKey.value) continue;
        videoElements.get(stream.key)?.pause();
    }
};

const togglePlayback = async () => {
    if (isPaused.value) {
        await playAll();
        return;
    }
    pauseAll();
};

const seekInternal = async (seconds: number, autoplay: boolean) => {
    const controllerVideo = getControllerVideo();
    if (!controllerVideo) return;

    controllerVideo.currentTime = Math.max(0, seconds);
    syncControlState();
    await syncFollowers(true);

    if (autoplay) {
        await playAll();
        return;
    }

    pauseAll();
};

const seekTo = async (seconds: number) => {
    await seekInternal(seconds, true);
};

const handleSeekInput = (event: Event) => {
    const value = Number((event.target as HTMLInputElement).value);
    scrubTime.value = Number.isFinite(value) ? value : 0;
    isScrubbing.value = true;
};

const commitSeek = async () => {
    const shouldResume = !isPaused.value;
    const nextTime = scrubTime.value;
    isScrubbing.value = false;
    await seekInternal(nextTime, shouldResume);
};

const handlePlaybackRateChange = async (rate: number) => {
    const controllerVideo = getControllerVideo();
    if (!controllerVideo) return;

    controllerVideo.playbackRate = rate;
    syncControlState();
    await syncFollowers(false);
};

const handleAudioSourceChange = async () => {
    syncAudioTracks();
    await syncFollowers(true);
};

const handleVolumeInput = (event: Event) => {
    const nextVolume = Number((event.target as HTMLInputElement).value);
    volume.value = Number.isFinite(nextVolume) ? nextVolume : 1;
    isMuted.value = volume.value <= 0;
    syncAudioTracks();
};

const toggleMute = () => {
    isMuted.value = !isMuted.value;
    syncAudioTracks();
};

const syncFullscreenState = () => {
    isFullscreen.value = !!shellRef.value && document.fullscreenElement === shellRef.value;
};

const toggleFullscreen = async () => {
    const shell = shellRef.value;
    if (!shell || !document.fullscreenEnabled) return;

    try {
        if (document.fullscreenElement === shell) {
            await document.exitFullscreen();
            return;
        }

        await shell.requestFullscreen({ navigationUI: 'hide' });
    } catch (error) {
        console.warn('切换全屏失败:', error);
    }
};

const toggleAuxStreams = () => {
    if (!canToggleAuxStreams.value) return;
    hideAuxStreams.value = !hideAuxStreams.value;
};

const setFeaturedStream = (key: string) => {
    if (!orderedStreams.value.some(stream => stream.key === key)) return;
    featuredKey.value = key;
};

const handleStreamStageClick = async (key: string) => {
    if (key === featuredStream.value?.key) {
        await togglePlayback();
        return;
    }
    setFeaturedStream(key);
};

const handleControllerPlay = async () => {
    if (suppressSync.value) return;
    syncControlState();
    await syncFollowers(true);
};

const handleControllerPause = () => {
    if (suppressSync.value) return;
    syncControlState();
    for (const stream of orderedStreams.value) {
        if (stream.key === controllerKey.value) continue;
        videoElements.get(stream.key)?.pause();
    }
};

const handleControllerSeeking = async () => {
    if (suppressSync.value) return;
    syncControlState();
    await syncFollowers(true);
};

const handleControllerRateChange = async () => {
    if (suppressSync.value) return;
    syncControlState();
    await syncFollowers(false);
};

const resolveDisplayLabel = (stream: ReplayStreamOption) => {
    const labels: Record<string, string> = {
        teacher: '教师',
        student: '学生',
        courseware: '课件',
        'teacher-close': '教师特写',
        'student-close': '学生特写',
        cinema: '电影模式'
    };

    return labels[stream.key] || stream.label;
};

const formatTime = (value: number) => {
    const totalSeconds = Math.max(0, Math.floor(value || 0));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

watch(streamSignature, async () => {
    const snapshot = captureControllerState();
    ensureSelectionState();
    await nextTick();
    await refreshMediaBindings(snapshot);
});

watch([selectedAudioKey, volume, isMuted], () => {
    syncAudioTracks();
});

onMounted(async () => {
    document.addEventListener('fullscreenchange', syncFullscreenState);
    syncFullscreenState();
    ensureSelectionState();
    await refreshMediaBindings();
});

onBeforeUnmount(() => {
    document.removeEventListener('fullscreenchange', syncFullscreenState);
    destroyAllPlayers();
});

defineExpose({
    seekTo,
    getMasterVideo: getControllerVideo
});
</script>

<style scoped lang="scss">
.sync-player-shell {
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: hidden;
}

.streams-board {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.95fr);
    grid-auto-rows: minmax(0, 1fr);
    gap: 12px;
    overflow: hidden;
}

.streams-board.is-single {
    grid-template-columns: minmax(0, 1fr);
}

.stream-stage {
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    background: linear-gradient(180deg, rgba(20, 28, 45, 0.96), rgba(10, 14, 24, 0.98));
    overflow: hidden;
}

.stream-stage.is-featured {
    grid-column: 1;
}

.stream-stage.is-featured.featured-span-1 {
    grid-row: 1 / span 1;
}

.stream-stage.is-featured.featured-span-2 {
    grid-row: 1 / span 2;
}

.stream-stage.is-featured.featured-span-3 {
    grid-row: 1 / span 3;
}

.stream-stage-media {
    position: relative;
    min-width: 0;
    min-height: 0;
    flex: 1;
    border: 0;
    padding: 0;
    background: #000;
    cursor: pointer;
}

.stream-stage-overlay {
    position: absolute;
    top: 10px;
    left: 10px;
    right: 10px;
    z-index: 2;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    pointer-events: none;
}

.stream-stage-label {
    max-width: 60%;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(9, 14, 24, 0.64);
    color: rgba(255, 255, 255, 0.96);
    font-size: 13px;
    font-weight: 600;
    line-height: 1;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(6px);
}

.stream-stage-badges {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: flex-end;
    pointer-events: auto;
}

.stream-badge {
    padding: 5px 9px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    backdrop-filter: blur(6px);
}

.stream-badge-featured {
    background: rgba(231, 248, 219, 0.96);
    color: #58a32c;
}

.stream-badge-audio {
    background: rgba(15, 24, 40, 0.72);
    border: 1px solid rgba(96, 170, 255, 0.92);
    color: #72b4ff;
}

.stream-badge-toggle {
    border: 0;
    cursor: pointer;
    background: rgba(13, 23, 40, 0.78);
    color: rgba(223, 238, 255, 0.96);
}

.stream-badge-toggle:hover {
    background: rgba(27, 50, 85, 0.86);
}

.streams-board.is-main-only .stream-stage.is-hidden-aux {
    display: none;
}

.streams-board.is-main-only .stream-stage.is-featured {
    grid-column: 1 / -1;
    grid-row: auto;
}

.stream-video {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: contain;
    background: #000;
}

.control-dock {
    display: flex;
    flex-wrap: wrap;
    align-items: stretch;
    padding: 12px 14px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    background: linear-gradient(180deg, rgba(15, 24, 40, 0.98), rgba(10, 16, 28, 0.98));
}

.control-col {
    min-width: 0;
    display: flex;
    align-items: center;
}

.control-col-play {
    flex: 999 1 420px;
}

.control-col-source {
    flex: 2 1 340px;
}

.control-col-volume {
    flex: 1 1 200px;
}

.control-cluster {
    min-width: 0;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
}

.control-cluster-play {
    justify-content: flex-start;
}

.control-cluster-source {
    justify-content: flex-start;
    gap: 10px;
}

.control-cluster-volume {
    justify-content: flex-end;
}

.control-group {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    white-space: nowrap;
}

.control-group-source {
    flex: 1 1 0;
    min-width: 0;
}

.control-group-speed {
    flex: 0 1 auto;
    min-width: 0;
}

.control-group-source .toolbar-select {
    width: clamp(130px, 18vw, 210px);
}

.control-group-speed .toolbar-select {
    width: clamp(78px, 8vw, 112px);
}

.control-label,
.timeline-time {
    color: rgba(255, 255, 255, 0.74);
    font-size: 12px;
    white-space: nowrap;
}

.control-button {
    width: 38px;
    height: 38px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    cursor: pointer;
    transition: background 0.2s ease;
}

.control-button:hover {
    background: rgba(255, 255, 255, 0.14);
}

.control-button-volume {
    width: 34px;
    height: 34px;
}

.control-button-fullscreen {
    width: 34px;
    height: 34px;
}

.timeline-box {
    min-width: 0;
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
}

.timeline-slider,
.volume-slider {
    flex: 1;
    min-width: 0;
    accent-color: #5da0ff;
    cursor: pointer;
}

.control-cluster-volume .volume-slider {
    min-width: 96px;
}

.sync-player-shell.is-fullscreen {
    background: #030914;
    padding: 8px;
    border-radius: 0;
}

.sync-player-shell.is-fullscreen .streams-board:not(.is-main-only) {
    grid-template-columns: minmax(0, 1.75fr) minmax(320px, 0.95fr);
    grid-auto-rows: minmax(0, 1fr);
    gap: 10px;
    overflow: hidden;
}

.sync-player-shell.is-fullscreen .streams-board:not(.is-main-only) .stream-stage.is-featured {
    grid-column: 1;
}

.sync-player-shell.is-fullscreen .stream-stage {
    min-height: 0;
}

.sync-player-shell.is-fullscreen .stream-stage-media {
    flex: 1;
    aspect-ratio: auto;
}

.sync-player-shell.is-fullscreen .streams-board:not(.is-main-only) .stream-stage:nth-child(n + 4) {
    display: flex;
}

.sync-player-shell.is-fullscreen .control-col-play {
    flex-basis: 460px;
}

.sync-player-shell.is-fullscreen .control-col-source {
    flex-basis: 420px;
    min-width: 360px;
}

.sync-player-shell.is-fullscreen .control-dock {
    display: grid;
    grid-template-columns: minmax(420px, 1fr) minmax(360px, auto) minmax(220px, auto);
    align-items: center;
}

.sync-player-shell.is-fullscreen .control-col {
    width: 100%;
}

.sync-player-shell.is-fullscreen .control-col-source .control-cluster-source {
    justify-content: flex-start;
}

@media (max-width: 1024px) {
    .sync-player-shell {
        height: auto;
        overflow: visible;
    }

    .streams-board {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-auto-rows: minmax(0, auto);
        overflow: visible;
    }

    .streams-board.is-single {
        grid-template-columns: minmax(0, 1fr);
    }

    .streams-board .stream-stage.is-featured {
        grid-column: 1 / -1;
        grid-row: auto;
        min-height: 0;
    }

    .stream-stage {
        min-height: 0;
    }

    .stream-stage-media {
        display: block;
        width: 100%;
        flex: none;
        aspect-ratio: 16 / 9;
    }

    .streams-board {
        gap: 10px;
    }

    .control-cluster-source {
        justify-content: space-between;
    }

    .control-col-play,
    .control-col-source,
    .control-col-volume {
        flex: 1 1 100%;
    }

    .sync-player-shell.is-fullscreen .control-col-play {
        flex: 999 1 460px;
    }

    .sync-player-shell.is-fullscreen .control-col-source {
        flex: 2 1 360px;
        min-width: 300px;
    }

    .sync-player-shell.is-fullscreen .control-col-volume {
        flex: 1 1 220px;
    }

    .sync-player-shell.is-fullscreen .streams-board:not(.is-main-only) {
        grid-template-columns: minmax(0, 1.75fr) minmax(280px, 0.95fr);
        grid-auto-rows: minmax(0, 1fr);
        overflow: hidden;
    }

    .sync-player-shell.is-fullscreen .streams-board:not(.is-main-only) .stream-stage.is-featured {
        grid-column: 1;
    }

    .sync-player-shell.is-fullscreen .stream-stage-media {
        flex: 1;
        aspect-ratio: auto;
    }
}

@media (max-width: 768px) {
    .sync-player-shell {
        height: auto;
        gap: 8px;
        overflow: visible;
    }

    .streams-board {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-auto-rows: auto;
        gap: 8px;
    }

    .stream-stage {
        min-height: 0;
    }

    .stream-stage.is-featured {
        grid-column: 1 / -1;
        grid-row: auto;
        min-height: 0;
    }

    .stream-stage.is-featured .stream-stage-media {
        aspect-ratio: 16 / 9;
    }

    .streams-board .stream-stage:not(.is-featured) .stream-stage-media {
        aspect-ratio: 16 / 9;
    }

    .streams-board .stream-stage:nth-child(n + 4) {
        display: none;
    }

    .control-dock {
        padding: 10px 12px;
    }

    .control-cluster {
        width: 100%;
    }

    .control-cluster-play {
        gap: 8px;
    }

    .control-cluster-source {
        gap: 8px;
        justify-content: flex-start;
    }

    .timeline-box {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 8px;
    }

    .control-group {
        gap: 6px;
    }

    .control-group-source .toolbar-select {
        width: 100%;
    }

    .control-group-speed .toolbar-select {
        width: clamp(84px, 30vw, 124px);
    }

    .timeline-time {
        font-size: 11px;
    }

    .stream-stage-overlay {
        top: 8px;
        left: 8px;
        right: 8px;
    }

    .stream-stage-label {
        max-width: 58%;
        padding: 5px 8px;
        font-size: 12px;
    }

    .stream-badge {
        padding: 4px 8px;
        font-size: 11px;
    }

    .sync-player-shell.is-fullscreen .streams-board:not(.is-main-only) {
        grid-template-columns: minmax(0, 1.75fr) minmax(240px, 0.95fr);
        grid-auto-rows: minmax(0, 1fr);
        gap: 8px;
    }

    .sync-player-shell.is-fullscreen .streams-board:not(.is-main-only) .stream-stage.is-featured {
        grid-column: 1;
    }

    .sync-player-shell.is-fullscreen .stream-stage-media,
    .sync-player-shell.is-fullscreen .stream-stage.is-featured .stream-stage-media {
        flex: 1;
        aspect-ratio: auto;
    }

    .sync-player-shell.is-fullscreen .streams-board:not(.is-main-only) .stream-stage:nth-child(n + 4) {
        display: flex;
    }

    .sync-player-shell.is-fullscreen .control-col-play {
        flex: 999 1 420px;
    }

    .sync-player-shell.is-fullscreen .control-col-source {
        flex: 2 1 320px;
        min-width: 260px;
    }

    .sync-player-shell.is-fullscreen .control-col-volume {
        flex: 1 1 180px;
    }
}

</style>
