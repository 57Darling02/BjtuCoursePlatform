<template>
    <AppLoading v-if="initialLoading && !userStore.isLoading" />
    <div
        v-else
        class="replay-layout"
        :class="{
            'is-narrow': isNarrowLayout,
            'is-schedule-collapsed': !isNarrowLayout && !schedulePanelOpen,
            'is-knowledge-collapsed': !isNarrowLayout && !knowledgePanelOpen
        }"
    >
        <aside v-if="showSchedulePane" class="replay-pane replay-schedule-pane">
            <div class="pane-header">
                <div>
                    <p class="pane-title">课程回放</p>
                    <p class="pane-subtitle">共 {{ scheduleList.length }} 个课节</p>
                </div>
                <div v-if="!isNarrowLayout" class="pane-header-actions">
                    <el-button size="small" text @click="schedulePanelOpen = false">收起</el-button>
                </div>
            </div>
            <el-scrollbar class="schedule-scroll">
                <button
                    v-for="item in scheduleList"
                    :key="item.id"
                    class="schedule-item"
                    :class="{ active: item.id === selectedScheduleId }"
                    type="button"
                    @click="selectSchedule(item)"
                >
                    <p class="schedule-name">{{ item.courseScheName || item.courseBetween }}</p>
                    <p class="schedule-meta">{{ item.courseBetween || '时间待定' }}</p>
                    <p class="schedule-desc" :title="item.content || '暂无节次简介'">
                        {{ item.content || '暂无节次简介' }}
                    </p>
                </button>
                <div v-if="!scheduleList.length && !initialLoading" class="empty-tip">
                    暂无回放课节
                </div>
            </el-scrollbar>
        </aside>

        <main class="replay-pane replay-main-pane">
            <section class="main-header">
                <div class="main-header-text">
                    <p class="main-title">{{ currentScheduleTitle || '请选择课节' }}</p>
                    <p v-if="scheduleMetaText" class="main-subtitle">
                        {{ scheduleMetaText }}
                    </p>
                </div>
                <div class="main-header-actions">
                    <el-button-group v-if="!isNarrowLayout" class="pane-toggle-group">
                        <el-button
                            size="small"
                            :type="schedulePanelOpen ? 'primary' : 'default'"
                            plain
                            @click="schedulePanelOpen = !schedulePanelOpen"
                        >
                            {{ schedulePanelOpen ? '隐藏课节' : '显示课节' }}
                        </el-button>
                        <el-button
                            size="small"
                            :type="knowledgePanelOpen ? 'primary' : 'default'"
                            plain
                            @click="knowledgePanelOpen = !knowledgePanelOpen"
                        >
                            {{ knowledgePanelOpen ? '隐藏知识点' : '显示知识点' }}
                        </el-button>
                    </el-button-group>
                    <template v-else>
                        <el-button
                            size="small"
                            plain
                            class="mobile-pane-trigger"
                            @click="scheduleDrawerVisible = true"
                        >
                            课节列表
                        </el-button>
                        <el-button
                            size="small"
                            plain
                            class="mobile-pane-trigger"
                            @click="knowledgeDrawerVisible = true"
                        >
                            知识点
                        </el-button>
                    </template>
                    <el-button
                        circle
                        size="small"
                        :loading="initialLoading"
                        @click="refreshSchedules"
                    >
                        <i class="fa-solid fa-rotate-right" />
                    </el-button>
                    <el-tag :type="hasPlaybackPermission ? 'success' : 'warning'" round>
                        {{ hasPlaybackPermission ? '可播放' : '无播放权限' }}
                    </el-tag>
                </div>
            </section>

            <section class="player-card">
                <p v-if="hasPlayableStreams" class="player-note">
                    点击任意画面可切换主视图，多画面共享同一时间轴。
                </p>
                <div class="video-shell" v-loading="detailLoading">
                    <CourseReplaySyncPlayer
                        v-if="hasPlayableStreams"
                        ref="playerRef"
                        :streams="streamOptions"
                    />
                    <div v-else class="video-empty">
                        {{ playbackTipText }}
                    </div>
                </div>
            </section>
        </main>

        <aside v-if="showKnowledgePane" class="replay-pane replay-knowledge-pane">
            <div class="pane-header">
                <div>
                    <p class="pane-title">知识点</p>
                    <p class="pane-subtitle">点击可跳转时间点</p>
                </div>
                <div v-if="!isNarrowLayout" class="pane-header-actions">
                    <el-button size="small" text @click="knowledgePanelOpen = false">收起</el-button>
                </div>
            </div>
            <el-scrollbar class="knowledge-scroll" v-loading="knowledgeLoading">
                <button
                    v-for="point in knowledgeList"
                    :key="point.id"
                    class="knowledge-item"
                    type="button"
                    @click="seekToKnowledgePoint(point)"
                >
                    <p class="knowledge-name">{{ point.zsd_name || '未命名知识点' }}</p>
                    <p class="knowledge-meta">{{ point.sfm || '--' }} · {{ formatWaitTime(point.zsd_wait_time) }}</p>
                </button>
                <div v-if="!knowledgeLoading && !knowledgeList.length" class="empty-tip">
                    当前课节暂无知识点
                </div>
            </el-scrollbar>
        </aside>

        <el-drawer
            v-model="scheduleDrawerVisible"
            direction="ltr"
            size="88%"
            :with-header="false"
            class="mobile-pane-drawer"
        >
            <div class="mobile-drawer-pane">
                <div class="pane-header pane-header--drawer">
                    <div>
                        <p class="pane-title">课程回放</p>
                        <p class="pane-subtitle">共 {{ scheduleList.length }} 个课节</p>
                    </div>
                </div>
                <el-scrollbar class="schedule-scroll">
                    <button
                        v-for="item in scheduleList"
                        :key="item.id"
                        class="schedule-item"
                        :class="{ active: item.id === selectedScheduleId }"
                        type="button"
                        @click="selectSchedule(item)"
                    >
                        <p class="schedule-name">{{ item.courseScheName || item.courseBetween }}</p>
                        <p class="schedule-meta">{{ item.courseBetween || '时间待定' }}</p>
                        <p class="schedule-desc" :title="item.content || '暂无节次简介'">
                            {{ item.content || '暂无节次简介' }}
                        </p>
                    </button>
                    <div v-if="!scheduleList.length && !initialLoading" class="empty-tip">
                        暂无回放课节
                    </div>
                </el-scrollbar>
            </div>
        </el-drawer>

        <el-drawer
            v-model="knowledgeDrawerVisible"
            direction="rtl"
            size="88%"
            :with-header="false"
            class="mobile-pane-drawer"
        >
            <div class="mobile-drawer-pane">
                <div class="pane-header pane-header--drawer">
                    <div>
                        <p class="pane-title">知识点</p>
                        <p class="pane-subtitle">点击可跳转时间点</p>
                    </div>
                </div>
                <el-scrollbar class="knowledge-scroll" v-loading="knowledgeLoading">
                    <button
                        v-for="point in knowledgeList"
                        :key="point.id"
                        class="knowledge-item"
                        type="button"
                        @click="seekToKnowledgePoint(point)"
                    >
                        <p class="knowledge-name">{{ point.zsd_name || '未命名知识点' }}</p>
                        <p class="knowledge-meta">{{ point.sfm || '--' }} · {{ formatWaitTime(point.zsd_wait_time) }}</p>
                    </button>
                    <div v-if="!knowledgeLoading && !knowledgeList.length" class="empty-tip">
                        当前课节暂无知识点
                    </div>
                </el-scrollbar>
            </div>
        </el-drawer>
    </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { getCourseReplayDetail, getCourseReplayKnowledgeList, getCourseReplayScheduleList } from '@/api/api_ve';
import type { CourseReplayDetail, CourseReplayKnowledgeItem, CourseReplayScheduleItem } from '@/api';
import CourseReplaySyncPlayer from '@/features/replay/components/CourseReplaySyncPlayer.vue';
import AppLoading from '@/shared/ui/AppLoading.vue';
import router from '@/router';
import { useUserStore } from '@/stores/user';

type CourseReplaySyncPlayerExpose = {
    seekTo: (seconds: number) => Promise<void>;
    getMasterVideo: () => HTMLVideoElement | null;
};

const userStore = useUserStore();

const props = defineProps({
    courseId: {
        type: String,
        default: ''
    },
    cId: {
        type: String,
        default: ''
    },
    xkhId: {
        type: String,
        default: ''
    },
    xqCode: {
        type: String,
        default: ''
    },
    teacherId: {
        type: String,
        default: ''
    },
    rpId: {
        type: String,
        default: ''
    },
    timeTableId: {
        type: String,
        default: ''
    },
    userLevel: {
        type: String,
        default: '1'
    },
    courseToPage: {
        type: String,
        default: '10480'
    },
    dataSource: {
        type: String,
        default: '1'
    }
});

const normalizedCourseId = computed(() => String(props.cId || props.courseId || ''));

const initialLoading = ref(true);
const detailLoading = ref(false);
const knowledgeLoading = ref(false);
const isNarrowLayout = ref(false);
const schedulePanelOpen = ref(true);
const knowledgePanelOpen = ref(true);
const scheduleDrawerVisible = ref(false);
const knowledgeDrawerVisible = ref(false);
const scheduleList = ref<CourseReplayScheduleItem[]>([]);
const knowledgeList = ref<CourseReplayKnowledgeItem[]>([]);
const selectedScheduleId = ref('');
const activeDetail = ref<CourseReplayDetail | null>(null);
const playerRef = ref<CourseReplaySyncPlayerExpose | null>(null);

let detailRequestId = 0;

const updateLayoutMode = () => {
    const nextIsNarrow = window.matchMedia('(max-width: 1200px)').matches;
    isNarrowLayout.value = nextIsNarrow;
    if (!nextIsNarrow) {
        scheduleDrawerVisible.value = false;
        knowledgeDrawerVisible.value = false;
    }
};

const currentSchedule = computed(
    () => scheduleList.value.find(item => item.id === selectedScheduleId.value) || null
);
const showSchedulePane = computed(() => !isNarrowLayout.value && schedulePanelOpen.value);
const showKnowledgePane = computed(() => !isNarrowLayout.value && knowledgePanelOpen.value);

const currentScheduleTitle = computed(
    () => currentSchedule.value?.courseScheName || currentSchedule.value?.courseBetween || ''
);

const scheduleMetaText = computed(() => {
    const courseSched = activeDetail.value?.courseSched;
    if (!courseSched) return '';

    return [courseSched.courseBetween, courseSched.classRoom]
        .filter(Boolean)
        .join(' · ');
});

const streamOptions = computed(() => {
    const streamMap = activeDetail.value?.streamMap;
    if (!streamMap) return [];

    return [
        { key: 'teacher', label: '教师主画面', url: streamMap.teaStreamHlsUrl || '' },
        { key: 'student', label: '学生主画面', url: streamMap.stuStreamHlsUrl || '' },
        { key: 'courseware', label: '课件画面', url: streamMap.vgaStreamHlsUrl || '' },
        { key: 'teacher-close', label: '教师特写', url: streamMap.teaCloseUpStreamHlsUrl || '' },
        { key: 'student-close', label: '学生特写', url: streamMap.stuCloseUpStreamHlsUrl || '' },
        { key: 'cinema', label: '电影模式', url: streamMap.movieStreamHlsUrl || '' }
    ].filter(stream => !!stream.url);
});

const hasPlaybackPermission = computed(() => {
    if (!activeDetail.value) return false;
    return activeDetail.value.streamMap.haveStream !== '0';
});
const hasPlayableStreams = computed(() => hasPlaybackPermission.value && streamOptions.value.length > 0);

const playbackTipText = computed(() => {
    if (detailLoading.value) return '正在加载回放...';
    if (!currentSchedule.value) return '请先从课节列表中选择课节';
    if (!hasPlaybackPermission.value) return '当前视频无观看权限，请联系老师';
    return '当前节次暂无可用视频流';
});

const parseWaitTime = (value: string) => {
    if (!value) return 0;

    const pureNumber = Number(value);
    if (!Number.isNaN(pureNumber)) return pureNumber;

    const parts = value.split(':').map(part => Number(part));
    if (parts.length === 3 && parts.every(part => !Number.isNaN(part))) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    if (parts.length === 2 && parts.every(part => !Number.isNaN(part))) {
        return parts[0] * 60 + parts[1];
    }

    return 0;
};

const formatWaitTime = (value: string) => {
    const seconds = Math.max(0, Math.floor(parseWaitTime(value)));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainSeconds = seconds % 60;

    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainSeconds).padStart(2, '0')}`;
    }

    return `${String(minutes).padStart(2, '0')}:${String(remainSeconds).padStart(2, '0')}`;
};

const seekToKnowledgePoint = async (point: CourseReplayKnowledgeItem) => {
    const seconds = parseWaitTime(point.zsd_wait_time);
    if (isNarrowLayout.value) {
        knowledgeDrawerVisible.value = false;
    }
    if (!playerRef.value || Number.isNaN(seconds)) return;
    await playerRef.value.seekTo(seconds);
};

const fetchKnowledgeList = async (rpId: string) => {
    knowledgeLoading.value = true;
    try {
        knowledgeList.value = await getCourseReplayKnowledgeList(rpId);
    } finally {
        knowledgeLoading.value = false;
    }
};

const resolveUserLevel = () => {
    if (props.userLevel) return props.userLevel;
    const roleCode = String(userStore.userinfo?.roleCode || '');
    return roleCode === 'teacher' ? '3' : '1';
};

const fetchScheduleDetail = async (schedule: CourseReplayScheduleItem) => {
    const requestId = ++detailRequestId;
    detailLoading.value = true;

    try {
        const detailUserId = String(schedule.teacherId || props.teacherId || '').trim();
        const detail = await getCourseReplayDetail(schedule.id, {
            userId: detailUserId || undefined,
            userLevel: resolveUserLevel()
        });

        if (requestId !== detailRequestId) return;

        activeDetail.value = detail;
        await fetchKnowledgeList(schedule.params.videoId || props.rpId);
    } catch (error) {
        if (requestId !== detailRequestId) return;
        activeDetail.value = null;
        knowledgeList.value = [];
        ElMessage.error('获取回放详情失败');
    } finally {
        if (requestId === detailRequestId) {
            detailLoading.value = false;
        }
    }
};

const selectSchedule = (schedule: CourseReplayScheduleItem) => {
    if (isNarrowLayout.value) {
        scheduleDrawerVisible.value = false;
    }
    if (schedule.id === selectedScheduleId.value && activeDetail.value) return;
    selectedScheduleId.value = schedule.id;
    void fetchScheduleDetail(schedule);
};

const refreshSchedules = async () => {
    const courseId = normalizedCourseId.value;
    if (!courseId) {
        ElMessage.warning('缺少课程参数，正在返回主页');
        router.replace({ name: 'home' });
        return;
    }

    initialLoading.value = true;

    try {
        scheduleList.value = await getCourseReplayScheduleList(courseId);

        if (!scheduleList.value.length) {
            selectedScheduleId.value = '';
            activeDetail.value = null;
            knowledgeList.value = [];
            return;
        }

        const target = scheduleList.value.find(item => item.id === selectedScheduleId.value)
            || scheduleList.value.find(item => item.uuid === props.timeTableId)
            || scheduleList.value[0];

        selectedScheduleId.value = target.id;
        await fetchScheduleDetail(target);
    } catch (error) {
        scheduleList.value = [];
        selectedScheduleId.value = '';
        activeDetail.value = null;
        knowledgeList.value = [];
        ElMessage.error('获取回放课节失败');
    } finally {
        initialLoading.value = false;
    }
};

watch(normalizedCourseId, (nextCourseId, prevCourseId) => {
    if (!nextCourseId || nextCourseId === prevCourseId) return;
    void refreshSchedules();
});

onMounted(() => {
    updateLayoutMode();
    window.addEventListener('resize', updateLayoutMode);
    void refreshSchedules();
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', updateLayoutMode);
});
</script>

<style lang="scss" scoped>
.replay-layout {
    --cw-accent: #2f7fca;
    --cw-accent-soft: rgba(47, 127, 202, 0.09);
    --cw-border: rgba(101, 142, 197, 0.16);
    --cw-text: #2d3d50;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    display: grid;
    grid-template-areas: 'schedule main knowledge';
    grid-template-columns: 300px minmax(0, 1fr) 320px;
    gap: 14px;
    padding: 14px;
    border: 1px solid var(--cw-border);
    border-radius: 20px;
    background: linear-gradient(180deg, rgba(252, 254, 255, 0.88), rgba(241, 248, 255, 0.76));
    backdrop-filter: blur(5px);
    overflow: hidden;
}

.replay-layout.is-schedule-collapsed {
    grid-template-areas: 'main knowledge';
    grid-template-columns: minmax(0, 1fr) 320px;
}

.replay-layout.is-knowledge-collapsed {
    grid-template-areas: 'schedule main';
    grid-template-columns: 300px minmax(0, 1fr);
}

.replay-layout.is-schedule-collapsed.is-knowledge-collapsed {
    grid-template-areas: 'main';
    grid-template-columns: minmax(0, 1fr);
}

.replay-layout.is-narrow {
    height: 100%;
    min-height: 0;
    grid-template-areas: 'main';
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
    overflow: hidden;
}

.replay-pane {
    min-width: 0;
    min-height: 0;
    border: 1px solid var(--cw-border);
    border-radius: 16px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(240, 248, 255, 0.66));
    display: flex;
    flex-direction: column;
}

.replay-schedule-pane {
    grid-area: schedule;
}

.replay-main-pane {
    grid-area: main;
}

.replay-knowledge-pane {
    grid-area: knowledge;
}

.pane-header,
.main-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px 12px;
    border-bottom: 1px solid var(--cw-border);
}

.pane-title,
.main-title {
    margin: 0;
    color: var(--cw-text);
    font-weight: 600;
}

.pane-title {
    font-size: 15px;
}

.main-title {
    font-size: 18px;
}

.pane-subtitle,
.main-subtitle {
    margin: 4px 0 0;
    color: rgba(45, 61, 80, 0.68);
    font-size: 12px;
    line-height: 1.5;
}

.main-subtitle {
    font-size: 13px;
}

.main-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.pane-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.pane-toggle-group {
    flex-wrap: wrap;
}

.mobile-pane-trigger {
    min-width: 72px;
}

.schedule-scroll,
.knowledge-scroll {
    flex: 1;
    min-height: 0;
}

.schedule-item,
.knowledge-item {
    width: calc(100% - 16px);
    margin: 8px;
    padding: 10px 12px;
    border: 1px solid transparent;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.78);
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
}

.schedule-item:hover,
.knowledge-item:hover {
    border-color: rgba(47, 127, 202, 0.3);
    background: rgba(255, 255, 255, 0.98);
}

.schedule-item.active {
    border-color: rgba(47, 127, 202, 0.52);
    background: var(--cw-accent-soft);
    box-shadow: 0 6px 16px rgba(47, 127, 202, 0.12);
}

.schedule-name,
.knowledge-name {
    margin: 0;
    color: var(--cw-text);
    font-size: 14px;
    font-weight: 600;
    line-height: 1.45;
}

.schedule-meta,
.knowledge-meta,
.schedule-desc {
    margin: 6px 0 0;
    color: rgba(45, 61, 80, 0.68);
    font-size: 12px;
    line-height: 1.5;
}

.schedule-desc {
    color: rgba(45, 61, 80, 0.6);
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.player-card {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px;
}

.player-note {
    margin: 0;
    color: rgba(45, 61, 80, 0.72);
    font-size: 13px;
    line-height: 1.5;
}

.video-shell {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 1px solid var(--cw-border);
    border-radius: 14px;
    background: #0f1828;
}

.video-empty {
    padding: 24px;
    color: rgba(255, 255, 255, 0.72);
    font-size: 14px;
    text-align: center;
}

.empty-tip {
    margin: 18px 12px;
    color: rgba(45, 61, 80, 0.6);
    font-size: 13px;
    text-align: center;
}

@media (max-width: 1200px) {
    .replay-layout {
        height: auto;
        min-height: 0;
        padding: 12px;
        gap: 12px;
        border-radius: 18px;
    }

    .replay-main-pane {
        min-height: 0;
        height: 100%;
    }

    .replay-layout.is-narrow {
        height: 100%;
    }
}

@media (max-width: 768px) {
    .replay-layout {
        padding: 10px;
        gap: 10px;
        border-radius: 16px;
        padding-bottom: calc(10px + env(safe-area-inset-bottom));
    }

    .pane-header,
    .main-header {
        padding: 12px;
        flex-wrap: wrap;
    }

    .main-header-text {
        min-width: 0;
        flex: 1 1 220px;
    }

    .main-header-actions {
        width: 100%;
        justify-content: space-between;
    }

    .main-title {
        font-size: 15px;
        line-height: 1.4;
    }

    .main-subtitle,
    .pane-subtitle,
    .player-note {
        font-size: 12px;
    }

    .player-card {
        padding: 8px;
        gap: 8px;
    }

    .replay-main-pane {
        min-height: 0;
    }

    .video-shell {
        min-height: clamp(210px, 42vw, 280px);
        overflow: hidden;
    }

    .mobile-pane-trigger {
        flex: 1 1 calc(50% - 8px);
        min-width: 0;
    }

    .video-shell {
        border-radius: 12px;
    }
}

.mobile-drawer-pane {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: #f8fbff;
}

.pane-header--drawer {
    border-bottom-color: rgba(101, 142, 197, 0.2);
    background: rgba(255, 255, 255, 0.9);
}

:deep(.mobile-pane-drawer .el-drawer__body) {
    padding: 0;
}
</style>
