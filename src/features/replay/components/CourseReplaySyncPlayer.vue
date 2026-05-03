<template>
    <div v-if="arrangedStreams.length" ref="shellRef" class="sync-player-shell"
        :class="{ 'is-fullscreen': isFullscreen }">
        <div class="streams-board" :class="{
            'is-single': arrangedStreams.length === 1 || hideAuxStreams,
            'is-main-only': hideAuxStreams
        }">
            <article v-for="stream in arrangedStreams" :key="stream.key" class="stream-stage" :class="[
                {
                    'is-featured': stream.key === featuredStream?.key,
                    'is-hidden-aux': hideAuxStreams && stream.key !== featuredStream?.key
                },
                stream.key === featuredStream?.key ? `featured-span-${featuredSpanRows}` : ''
            ]">
                <button class="stream-stage-media" type="button" @click="handleStreamStageClick(stream.key)">
                    <div class="stream-stage-overlay">
                        <span class="stream-stage-label">
                            {{ resolveDisplayLabel(stream) }}
                        </span>
                        <div class="stream-stage-badges">
                            <span v-if="stream.key === featuredStream?.key" class="stream-badge stream-badge-featured">
                                主视图
                            </span>
                            <span v-if="stream.key === selectedAudioKey" class="stream-badge stream-badge-audio">
                                音源
                            </span>
                        </div>
                    </div>
                    <video :ref="setVideoRef(stream.key)" class="stream-video" playsinline preload="metadata"
                        @loadedmetadata="stream.key === controllerKey && syncControlState()"
                        @durationchange="stream.key === controllerKey && syncControlState()"
                        @timeupdate="stream.key === controllerKey && syncControlState()"
                        @play="stream.key === controllerKey && handleControllerPlay()"
                        @pause="stream.key === controllerKey && handleControllerPause()"
                        @seeking="stream.key === controllerKey && handleControllerSeeking()"
                        @ratechange="stream.key === controllerKey && handleControllerRateChange()" />
                </button>
            </article>
        </div>

        <div class="control-dock">
            <div class="control-row control-row-timeline" :style="timelineProgressStyle">
                <input :value="scrubTime" class="timeline-slider timeline-slider--boundary" type="range" min="0"
                    :max="safeDuration"
                    step="0.1" @input="handleSeekInput" @mousedown="isScrubbing = true"
                    @touchstart="isScrubbing = true" @change="commitSeek">
            </div>

            <div class="control-row control-row-actions">
                <div class="control-row-group control-row-group-primary">
                    <button class="control-button" type="button" @click="togglePlayback">
                        <i :class="isPaused ? 'fa-solid fa-play' : 'fa-solid fa-pause'" />
                    </button>
                    <span class="timeline-summary">{{ formatTime(scrubTime) }} / {{ formatTime(duration) }}</span>
                    <div class="control-row-group control-row-group-views">
                        <div class="control-menu">
                            <transition name="control-menu-fade">
                                <div v-if="activeControlMenu === 'featured'" class="control-menu-panel control-menu-panel--align-start"
                                    role="menu" aria-label="主视图选择">
                                    <div class="control-menu-list">
                                        <button v-for="stream in orderedStreams" :key="stream.key" class="control-menu-option"
                                            :class="{ 'is-active': stream.key === featuredStream?.key }" type="button"
                                            @click="handleFeaturedStreamChange(stream.key)">
                                            <span>{{ resolveDisplayLabel(stream) }}</span>
                                        </button>
                                    </div>
                                </div>
                            </transition>
                            <button class="control-pill control-pill--view"
                                :class="{ 'is-active': activeControlMenu === 'featured' }" type="button"
                                title="主视图选择" @click="toggleControlMenu('featured')">
                                <i class="control-pill-icon fa-solid fa-display" />
                                <span class="control-pill-value control-pill-value--truncate">{{ selectedFeaturedLabel }}</span>
                            </button>
                        </div>

                        <button v-if="canToggleAuxStreams" class="control-pill control-pill--view"
                            :class="{ 'is-active': hideAuxStreams }" type="button"
                            :title="auxStreamsButtonLabel" @click="toggleAuxStreams">
                            <i :class="['control-pill-icon', auxStreamsToggleIconClass]" />
                            <span class="control-pill-value">{{ auxStreamsButtonLabel }}</span>
                        </button>
                    </div>
                </div>

                <div class="control-row-group control-row-group-secondary">
                    <div class="control-menu">
                        <transition name="control-menu-fade">
                            <div v-if="activeControlMenu === 'audio'" class="control-menu-panel control-menu-panel--align-start" role="menu"
                                aria-label="音源选择">
                                <div class="control-menu-list">
                                    <button v-for="stream in orderedStreams" :key="stream.key" class="control-menu-option"
                                        :class="{ 'is-active': stream.key === selectedAudioKey }" type="button"
                                        @click="handleAudioSourceChange(stream.key)">
                                        <span>{{ resolveDisplayLabel(stream) }}</span>
                                    </button>
                                </div>
                            </div>
                        </transition>
                        <button class="control-pill" :class="{ 'is-active': activeControlMenu === 'audio' }" type="button"
                            title="音源选择" @click="toggleControlMenu('audio')">
                            <i class="control-pill-icon fa-solid fa-music" />
                            <span class="control-pill-value control-pill-value--truncate">{{ selectedAudioLabel }}</span>
                        </button>
                    </div>

                    <div class="control-menu">
                        <transition name="control-menu-fade">
                            <div v-if="activeControlMenu === 'speed'" class="control-menu-panel" role="menu"
                                aria-label="倍速选择">
                                <div class="control-menu-list">
                                    <button v-for="rate in playbackRateOptions" :key="rate" class="control-menu-option"
                                        :class="{ 'is-active': rate === selectedPlaybackRate }" type="button"
                                        @click="handlePlaybackRateChange(rate)">
                                        <span>{{ rate }}x</span>
                                    </button>
                                </div>
                            </div>
                        </transition>
                        <button class="control-pill" :class="{ 'is-active': activeControlMenu === 'speed' }" type="button"
                            title="倍速选择" @click="toggleControlMenu('speed')">
                            <i class="control-pill-icon fa-solid fa-gauge-high" />
                            <span class="control-pill-value">{{ selectedPlaybackRateLabel }}</span>
                        </button>
                    </div>

                    <div class="control-menu">
                        <transition name="control-menu-fade">
                            <div v-if="activeControlMenu === 'volume'" class="control-menu-panel control-menu-panel--volume"
                                role="group" aria-label="音量控制">
                                <div class="volume-popover-slider-box">
                                    <input :value="effectiveVolume" class="volume-slider volume-slider--popover"
                                        type="range" min="0" max="1" step="0.05" @input="handleVolumeInput">
                                </div>
                            </div>
                        </transition>
                        <button class="control-pill" :class="{ 'is-active': activeControlMenu === 'volume' }" type="button"
                            title="音量控制" @click="toggleControlMenu('volume')">
                            <i :class="['control-pill-icon', volumeIconClass]" />
                            <span class="control-pill-value">{{ volumeValueLabel }}</span>
                        </button>
                    </div>
                    <button class="control-pill" type="button" :title="isFullscreen ? '退出全屏' : '全屏拼盘'"
                        @click="toggleFullscreen">
                        <i :class="['control-pill-icon', isFullscreen ? 'fa-solid fa-compress' : 'fa-solid fa-expand']" />
                        <span class="control-pill-value">{{ fullscreenLabel }}</span>
                    </button>
                </div>
            </div>
        </div>
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

type ControlMenuKey = 'featured' | 'audio' | 'speed' | 'volume' | null;

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
const activeControlMenu = ref<ControlMenuKey>(null);

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
const effectiveVolume = computed(() => volume.value);
const canToggleAuxStreams = computed(() => orderedStreams.value.length > 1);
const volumeIconClass = computed(() => {
    if (volume.value <= 0) return 'fa-solid fa-volume-xmark';
    if (volume.value < 0.5) return 'fa-solid fa-volume-low';
    return 'fa-solid fa-volume-high';
});
const auxStreamsButtonLabel = computed(() => (hideAuxStreams.value ? '还原辅视图' : '隐藏辅视图'));
const auxStreamsToggleIconClass = computed(() =>
    hideAuxStreams.value ? 'fa-solid fa-table-cells-large' : 'fa-solid fa-table-cells'
);
const timelineProgressStyle = computed(() => {
    const max = safeDuration.value;
    const current = Math.min(Math.max(scrubTime.value, 0), max);
    const percent = max > 0 ? (current / max) * 100 : 0;

    return {
        '--timeline-progress': `${percent}%`
    };
});
const selectedAudioLabel = computed(() => {
    const stream = orderedStreams.value.find(item => item.key === selectedAudioKey.value);
    return stream ? resolveDisplayLabel(stream) : '音源';
});
const selectedFeaturedLabel = computed(() => {
    const stream = orderedStreams.value.find(item => item.key === featuredStream.value?.key);
    return stream ? resolveDisplayLabel(stream) : '主视图';
});
const selectedPlaybackRateLabel = computed(() => `${selectedPlaybackRate.value}x`);
const volumeValueLabel = computed(() => `${Math.round(effectiveVolume.value * 100)}%`);
const fullscreenLabel = computed(() => (isFullscreen.value ? '退出' : '全屏'));

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
    const targetVolume = volume.value;

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

    selectedPlaybackRate.value = rate;
    controllerVideo.playbackRate = rate;
    syncControlState();
    await syncFollowers(false);
    activeControlMenu.value = null;
};

const handleAudioSourceChange = (key: string) => {
    selectedAudioKey.value = key;
    activeControlMenu.value = null;
};

const handleFeaturedStreamChange = (key: string) => {
    setFeaturedStream(key);
    activeControlMenu.value = null;
};

const handleVolumeInput = (event: Event) => {
    const nextVolume = Number((event.target as HTMLInputElement).value);
    volume.value = Number.isFinite(nextVolume) ? nextVolume : 1;
};

const syncFullscreenState = () => {
    isFullscreen.value = !!shellRef.value && document.fullscreenElement === shellRef.value;
};

const closeControlMenu = () => {
    activeControlMenu.value = null;
};

const toggleControlMenu = (menu: Exclude<ControlMenuKey, null>) => {
    activeControlMenu.value = activeControlMenu.value === menu ? null : menu;
};

const handleDocumentPointerDown = (event: PointerEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('.control-menu')) return;
    closeControlMenu();
};

const handleDocumentKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
        closeControlMenu();
    }
};

const toggleFullscreen = async () => {
    const shell = shellRef.value;
    if (!shell || !document.fullscreenEnabled) return;
    closeControlMenu();

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

watch([selectedAudioKey, volume], () => {
    syncAudioTracks();
});

onMounted(async () => {
    document.addEventListener('fullscreenchange', syncFullscreenState);
    document.addEventListener('pointerdown', handleDocumentPointerDown);
    document.addEventListener('keydown', handleDocumentKeydown);
    syncFullscreenState();
    ensureSelectionState();
    await refreshMediaBindings();
});

onBeforeUnmount(() => {
    document.removeEventListener('fullscreenchange', syncFullscreenState);
    document.removeEventListener('pointerdown', handleDocumentPointerDown);
    document.removeEventListener('keydown', handleDocumentKeydown);
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
    max-height: 100%;
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
    background: #000;
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
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 16px 14px 10px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0 0 14px 14px;
    background: linear-gradient(180deg, rgba(15, 24, 40, 0.98), rgba(10, 16, 28, 0.98));
    overflow: visible;
}

.control-row {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 10px;
}

.control-row-timeline {
    --timeline-hit-height: 14px;
    --timeline-track-height: 4px;
    --timeline-thumb-size: 10px;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: var(--timeline-track-height);
    gap: 0;
    overflow: visible;
}

.control-row-timeline::before,
.control-row-timeline::after {
    content: '';
    position: absolute;
    top: 0;
    height: var(--timeline-track-height);
    pointer-events: none;
}

.control-row-timeline::before {
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.2);
}

.control-row-timeline::after {
    left: 0;
    width: var(--timeline-progress);
    background: #5da0ff;
}

.control-row-actions {
    width: 100%;
    justify-content: space-between;
    gap: 12px;
}

.control-row-group {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 10px;
}

.control-row-group-primary {
    flex: 0 1 auto;
}

.control-row-group-views {
    min-width: 0;
    flex: 1;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
}

.control-row-group-views .control-menu,
.control-row-group-views .control-pill {
    min-width: 0;
    width: 100%;
}

.control-row-group-views .control-menu > .control-pill {
    width: 100%;
}

.control-row-group-secondary {
    flex: 1;
    justify-content: flex-end;
    flex-wrap: wrap;
}

.control-menu {
    position: relative;
}

.control-menu-panel {
    position: absolute;
    right: 0;
    bottom: calc(100% + 10px);
    z-index: 20;
    min-width: 148px;
    max-width: min(240px, calc(100vw - 24px));
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    background: linear-gradient(180deg, rgba(16, 25, 42, 0.98), rgba(8, 13, 24, 0.98));
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28);
    backdrop-filter: blur(10px);
}

.control-menu-panel--volume {
    min-width: 164px;
}

.control-menu-panel--align-start {
    left: 0;
    right: auto;
}

.control-menu-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.control-menu-option {
    width: 100%;
    border: 1px solid transparent;
    border-radius: 10px;
    padding: 8px 10px;
    color: rgba(255, 255, 255, 0.9);
    background: rgba(255, 255, 255, 0.06);
    text-align: left;
    font: inherit;
    cursor: pointer;
    transition: background 0.18s ease, border-color 0.18s ease;
}

.control-menu-option:hover,
.control-menu-option.is-active {
    border-color: rgba(93, 160, 255, 0.4);
    background: rgba(93, 160, 255, 0.16);
}

.control-pill {
    min-width: 0;
    height: 34px;
    padding: 0 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    border: 0;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    font: inherit;
    cursor: pointer;
    transition: background 0.18s ease;
}

.control-pill--view {
    justify-content: center;
}

.control-pill:hover,
.control-pill.is-active {
    background: rgba(255, 255, 255, 0.14);
}

.control-pill-icon {
    width: 14px;
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.control-pill-value {
    min-width: 0;
    color: rgba(255, 255, 255, 0.86);
    font-size: 12px;
    line-height: 1;
    white-space: nowrap;
}

.control-pill-value--truncate {
    overflow: hidden;
    text-overflow: ellipsis;
}

.control-button {
    width: 32px;
    height: 32px;
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

.timeline-summary {
    color: rgba(255, 255, 255, 0.78);
    font-size: 12px;
    line-height: 1;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
}

.timeline-slider,
.volume-slider {
    flex: 1;
    min-width: 0;
    cursor: pointer;
}

.volume-slider {
    accent-color: #5da0ff;
}

.timeline-slider {
    -webkit-appearance: none;
    appearance: none;
}

.timeline-slider--boundary {
    position: absolute;
    top: calc((var(--timeline-track-height) - var(--timeline-hit-height)) / 2);
    left: 0;
    width: 100%;
    height: var(--timeline-hit-height);
    margin: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
}

.timeline-slider--boundary::-webkit-slider-runnable-track {
    height: var(--timeline-track-height);
    border-radius: 999px;
    background: transparent;
}

.timeline-slider--boundary::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: var(--timeline-thumb-size);
    height: var(--timeline-thumb-size);
    margin-top: calc((var(--timeline-track-height) - var(--timeline-thumb-size)) / 2);
    border: 2px solid #d6ebff;
    border-radius: 50%;
    background: #5da0ff;
    box-shadow: 0 0 0 0 rgba(93, 160, 255, 0);
    opacity: 0;
    transform: scale(0.72);
    transition: opacity 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease;
}

.timeline-slider--boundary::-moz-range-track {
    height: var(--timeline-track-height);
    border: 0;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.22);
}

.timeline-slider--boundary::-moz-range-progress {
    height: var(--timeline-track-height);
    border-radius: 999px;
    background: #5da0ff;
}

.timeline-slider--boundary::-moz-range-thumb {
    width: var(--timeline-thumb-size);
    height: var(--timeline-thumb-size);
    border: 2px solid #d6ebff;
    border-radius: 50%;
    background: #5da0ff;
    box-shadow: 0 0 0 0 rgba(93, 160, 255, 0);
    opacity: 0;
    transform: scale(0.72);
    transition: opacity 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease;
}

.control-row-timeline:hover .timeline-slider--boundary::-webkit-slider-thumb,
.timeline-slider--boundary:active::-webkit-slider-thumb,
.timeline-slider--boundary:focus-visible::-webkit-slider-thumb {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 0 0 3px rgba(93, 160, 255, 0.18);
}

.control-row-timeline:hover .timeline-slider--boundary::-moz-range-thumb,
.timeline-slider--boundary:active::-moz-range-thumb,
.timeline-slider--boundary:focus-visible::-moz-range-thumb {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 0 0 3px rgba(93, 160, 255, 0.18);
}

.volume-slider--popover {
    width: 88px;
    min-width: 88px;
}

.volume-popover-slider-box {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
}

.volume-popover-value {
    color: rgba(255, 255, 255, 0.72);
    font-size: 11px;
    white-space: nowrap;
}

.control-menu-fade-enter-active,
.control-menu-fade-leave-active {
    transition: opacity 0.16s ease, transform 0.16s ease;
}

.control-menu-fade-enter-from,
.control-menu-fade-leave-to {
    opacity: 0;
    transform: translateY(6px) scale(0.96);
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

@media (max-width: 1024px) {
    .sync-player-shell {
        min-height: 0;
    }

    .streams-board {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-auto-rows: minmax(0, 1fr);
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
        height: 100%;
        flex: 1;
        aspect-ratio: auto;
    }

    .streams-board {
        gap: 10px;
    }

    .control-row-group-primary,
    .control-row-group-secondary {
        min-width: 0;
    }

    .control-row-group-views {
        min-width: 0;
    }

    .control-pill {
        justify-content: center;
        padding-inline: 8px;
    }

    .sync-player-shell.is-fullscreen .streams-board:not(.is-main-only) {
        grid-template-columns: minmax(0, 1.75fr) minmax(280px, 0.95fr);
        grid-auto-rows: minmax(0, 1fr);
        overflow: hidden;
    }

    .sync-player-shell.is-fullscreen .streams-board:not(.is-main-only) .stream-stage.is-featured {
        grid-column: 1;
    }

    .sync-player-shell.is-fullscreen .streams-board:not(.is-main-only) .stream-stage.is-featured.featured-span-1 {
        grid-row: 1 / span 1;
    }

    .sync-player-shell.is-fullscreen .streams-board:not(.is-main-only) .stream-stage.is-featured.featured-span-2 {
        grid-row: 1 / span 2;
    }

    .sync-player-shell.is-fullscreen .streams-board:not(.is-main-only) .stream-stage.is-featured.featured-span-3 {
        grid-row: 1 / span 3;
    }

    .sync-player-shell.is-fullscreen .stream-stage-media {
        flex: 1;
        aspect-ratio: auto;
    }
}

@media (max-width: 768px) {
    .sync-player-shell {
        gap: 8px;
    }

    .streams-board {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-auto-rows: minmax(0, 1fr);
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

    .stream-stage-media,
    .stream-stage.is-featured .stream-stage-media {
        height: 100%;
        flex: 1;
        aspect-ratio: auto;
    }

    .streams-board .stream-stage:nth-child(n + 4) {
        display: none;
    }

    .control-dock {
        padding: 10px 12px;
    }

    .control-row-timeline {
        --timeline-hit-height: 12px;
    }

    .control-row-group-primary {
        justify-content: space-between;
        gap: 8px;
    }

    .control-row-group-primary .control-button {
        flex: none;
    }

    .control-row-group-views {
        gap: 8px;
    }

    .control-row-group-views .control-menu,
    .control-row-group-views .control-pill {
        min-width: 0;
    }

    .control-row-group-views .control-pill {
        width: 100%;
    }

    .control-row-actions {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
    }

    .control-row-group-primary,
    .control-row-group-secondary {
        width: 100%;
    }

    .control-row-group-secondary {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        justify-content: stretch;
    }

    .control-row-group-views .control-pill-value {
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .control-row-group-primary .control-pill,
    .control-row-group-secondary .control-pill {
        width: 100%;
    }

    .control-menu-panel {
        bottom: calc(100% + 8px);
        padding: 8px;
        gap: 8px;
    }

    .control-menu-panel--volume {
        min-width: 148px;
    }

    .volume-slider--popover {
        width: 72px;
        min-width: 72px;
    }

    .timeline-summary {
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

    .sync-player-shell.is-fullscreen .streams-board:not(.is-main-only) .stream-stage.is-featured.featured-span-1 {
        grid-row: 1 / span 1;
    }

    .sync-player-shell.is-fullscreen .streams-board:not(.is-main-only) .stream-stage.is-featured.featured-span-2 {
        grid-row: 1 / span 2;
    }

    .sync-player-shell.is-fullscreen .streams-board:not(.is-main-only) .stream-stage.is-featured.featured-span-3 {
        grid-row: 1 / span 3;
    }

    .sync-player-shell.is-fullscreen .stream-stage-media,
    .sync-player-shell.is-fullscreen .stream-stage.is-featured .stream-stage-media {
        flex: 1;
        aspect-ratio: auto;
    }

    .sync-player-shell.is-fullscreen .streams-board:not(.is-main-only) .stream-stage:nth-child(n + 4) {
        display: flex;
    }

}
</style>
