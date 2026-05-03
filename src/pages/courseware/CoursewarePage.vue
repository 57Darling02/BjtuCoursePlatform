<template>
    <AppLoading v-if="listLoading && !userStore.isLoading" />
    <div class="courseware-layout" v-else-if="hasCourseware">
        <el-menu
            ref="menuRef"
            default-active="2"
            class="el-menu-vertical-demo courseware-menu"
            :collapse="isCollapse"
            popper-class="courseware-menu-popper"
        >
            <el-menu-item @click="toggleCollapse" index="2">
                <i class="fa-solid fa-angles-right menu-icon arrow-icon" :class="{ 'rotate-180': !isCollapse }" />
                <template #title>点击{{ isCollapse ? '展开' : '收起' }}菜单</template>
            </el-menu-item>
            <el-menu-item @click="isCollapse = false" index="2">
                <i class="fa-solid fa-book-open menu-icon" />
                <template #title>
                    <span v-if="isCollapse">选择{{ resourceLabel }}</span>
                    <el-select-v2
                        v-else
                        class="courseware-select"
                        v-model="selectedIndex"
                        :options="options"
                        :placeholder="`请选择${resourceLabel}`"
                        filterable
                        :loading="listLoading"
                        :show-arrow="false"
                        @click.stop
                    >
                        <template #default="{ item }">
                            <el-tooltip
                                effect="dark"
                                :content="item.label"
                                placement="right"
                                :show-arrow="false"
                                popper-class="courseware-option-tooltip"
                            >
                                <div class="courseware-option">
                                    <el-text truncated>{{ item.label }}</el-text>
                                </div>
                            </el-tooltip>
                        </template>
                    </el-select-v2>
                </template>
            </el-menu-item>
            <el-menu-item index="2">
                <i class="fa-solid fa-hard-drive menu-icon" />
                <template #title>{{ resourceSizeText }}</template>
            </el-menu-item>
            <el-menu-item index="2">
                <i class="fa-solid fa-tag menu-icon" />
                <template #title>{{ resourceTypeText }}</template>
            </el-menu-item>
            <el-menu-item index="2">
                <i
                    class="fa-solid menu-icon"
                    :class="currentItem?.share_type == 2 ? 'fa-unlock' : 'fa-lock'"
                />
                <template #title>{{ resourceStatusText }}</template>
            </el-menu-item>
            <el-menu-item index="2">
                <i class="fa-solid fa-user-pen menu-icon" />
                <template #title>{{ resourceTeacherText }}</template>
            </el-menu-item>
            <el-menu-item index="2">
                <i class="fa-solid fa-calendar-days menu-icon" />
                <template #title>{{ resourceTimeText }}</template>
            </el-menu-item>
            <el-menu-item index="2" @click="downloadFile">
                <i class="fa-solid fa-download menu-icon" />
                <template #title>
                    下载
                </template>
            </el-menu-item>
        </el-menu>

        <iframe
            class="courseware-preview-frame"
            v-if="!previewLoading && pdfUrl"
            v-show="!previewFrozen"
            :src="pdfUrl"
            frameborder="0"
        />
        <div class="preview-freeze-mask" v-else-if="previewFrozen">
            <el-text type="info">正在调整布局...</el-text>
        </div>
        <div class="courseware-empty-state" v-else>
            <div class="courseware-fallback-card" @click="downloadFile">
                <i class="fa-solid fa-file courseware-file-icon" />
                {{ currentItem?.rpName }}
                <el-text class="text-muted courseware-fallback-tip">
                    该课件暂无预览功能，请点击此处下载后查看
                </el-text>
            </div>
        </div>
    </div>
</template>
<script lang='ts' setup>
import AppLoading from '@/shared/ui/AppLoading.vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { type CourseResourceItem } from '@/api';
import { getCourseResourceList } from '@/api/api_ve';
import { useUserStore } from '@/stores/user';
const userStore = useUserStore();
import router from '@/router';

const listLoading = ref(true);
const previewLoading = ref(false);
const selectedIndex = ref(0);
const coursewareList = ref<CourseResourceItem[]>([])
const isCollapse = ref(true)
const previewFrozen = ref(false)
const menuRef = ref<any>(null)
let previewUnfreezeTimer: number | null = null
let releaseTransitionListener: (() => void) | null = null

const options = computed(() =>
    coursewareList.value.map((item, idx) => ({
        value: idx,
        label: item.rpName
    }))
)
const hasCourseware = computed(() => coursewareList.value.length > 0)
const currentItem = computed(() => coursewareList.value[selectedIndex.value] ?? null)
const resourceSizeText = computed(() => `资源大小: ${currentItem.value?.rpSize ?? '--'}MB`)
const resourceTypeText = computed(() => `资源类型: ${currentItem.value?.extName ?? '--'}`)
const resourceStatusText = computed(() => `资源状态: ${currentItem.value?.share_type == 2 ? '公开' : '未公开'}`)
const resourceTeacherText = computed(() => `上传人: ${currentItem.value?.teacherName ?? '--'}`)
const resourceTimeText = computed(() => `上传时间: ${currentItem.value?.inputTime ?? '--'}`)
const resourceLabel = computed(() => props.docType === '5' ? '教案' : '课件')

const clearPreviewFreezeResources = () => {
    if (previewUnfreezeTimer !== null) {
        window.clearTimeout(previewUnfreezeTimer)
        previewUnfreezeTimer = null
    }
    releaseTransitionListener?.()
    releaseTransitionListener = null
}

const unfreezePreview = () => {
    clearPreviewFreezeResources()
    previewFrozen.value = false
}

const getMenuElement = () => {
    const maybeComponent = menuRef.value
    if (!maybeComponent) return null
    const element = maybeComponent.$el ?? maybeComponent
    return element instanceof HTMLElement ? element : null
}

const freezePreviewDuringMenuTransition = async () => {
    clearPreviewFreezeResources()
    previewFrozen.value = true
    await nextTick()

    const menuElement = getMenuElement()
    const finish = () => unfreezePreview()
    if (!menuElement) {
        previewUnfreezeTimer = window.setTimeout(finish, 320)
        return
    }

    const onTransitionEnd = (event: TransitionEvent) => {
        if (event.propertyName && event.propertyName !== 'width') return
        finish()
    }
    menuElement.addEventListener('transitionend', onTransitionEnd, true)
    releaseTransitionListener = () => {
        menuElement.removeEventListener('transitionend', onTransitionEnd, true)
    }

    // Fallback: avoid permanent freeze when transitionend is skipped.
    previewUnfreezeTimer = window.setTimeout(finish, 420)
}

const toggleCollapse = () => {
    void freezePreviewDuringMenuTransition()
    isCollapse.value = !isCollapse.value;
};

const props = defineProps({
    course_num: {
        type: String,
        required: true
    },
    fz_id: {
        type: String,
        required: true
    },
    xq_code: {
        type: String,
        required: true
    },
    docType: {
        type: String,
        default: '1',
    }
})

const handleUnavailableCourseware = () => {
    ElMessage.warning(`当前课程无${resourceLabel.value}或登入已过期，正在返回主页`)
    router.replace({ name: 'home' })
}

// 封装数据获取逻辑
const fetchCoursewareList = async () => {
    const { course_num, fz_id, xq_code, docType } = props
    if (!course_num || !fz_id || !xq_code) {
        ElMessage.error(`参数错误: ${!course_num ? '课程编号' : ''} ${!fz_id ? '分组ID' : ''} ${!xq_code ? '学期代码' : ''}`)
        console.error('缺失参数:', { course_num, fz_id, xq_code })
        handleUnavailableCourseware()
        return
    }
    try {
        const data = await getCourseResourceList(course_num, fz_id, xq_code, docType)
        coursewareList.value = data || []
        if (coursewareList.value.length === 0) {
            handleUnavailableCourseware()
            return
        }
        selectedIndex.value = 0
    } catch (error) {
        handleUnavailableCourseware()
    } finally {
        listLoading.value = false
    }
}

const getFilePlayUrl = async (resId: string) => {
    try {
        const headers = new Headers({
            Accept: '*/*',
            'X-Requested-With': 'XMLHttpRequest',
        })
        const sessionId = localStorage.getItem('sessionId')
        if (sessionId) {
            headers.set('sessionId', sessionId)
        }

        const response = await fetch(
            `/api/back/coursePlatform/dataSynAction.shtml?method=getFilePlayUrl&id=${resId}&type=2`,
            {
                credentials: 'include',
                headers,
            }
        );

        // Validate response status
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        // Parse and return JSON response
        return await response.json();
    } catch (error) {
        console.error('Error fetching file play URL:', error);
        throw error; // Re-throw to allow caller to handle the error
    }
};

const pdfUrl = ref('')
let previewRequestId = 0
const previewUrlCache = new Map<string, string>()

const canPreviewDirectly = (item: CourseResourceItem) => {
    const extName = (item.extName || '').toLowerCase()
    return !!item.play_url && (extName.endsWith('pdf') || extName === 'docx')
}

const needsServerResolvedPdf = (item: CourseResourceItem) => {
    const extName = (item.extName || '').toLowerCase()
    return !!item.play_url?.endsWith('pdf') && extName !== 'pdf'
}

const extractViewerUrlFromHtml = (htmlContent: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const scripts = Array.from(doc.querySelectorAll('script[type="text/javascript"]'));
    let scriptContent = '';
    for (const script of scripts) {
        if (script.textContent && script.textContent.includes('var url =')) {
            scriptContent = script.textContent;
            break;
        }
    }
    if (!scriptContent) return ''

    const urlMatch = scriptContent.match(/var url = ['"]([^'"]+)['"]/);
    const extractedUrl = urlMatch?.[1];
    if (!extractedUrl) return ''

    const match = extractedUrl.match(/kk\/(.*)$/);
    if (!match || !match[0]) return ''

    return `/static/pdfjs-5.2.133-dist/web/viewer.html?file=/api_server1936/${match[0]}`
}

const resolvePreviewUrl = async (item: CourseResourceItem): Promise<string> => {
    if (canPreviewDirectly(item)) {
        return `/static/pdfjs-5.2.133-dist/web/viewer.html?file=/api/pdf/${item.play_url}`
    }
    if (!needsServerResolvedPdf(item)) {
        return ''
    }

    const cacheKey = String(item.resId)
    const cachedUrl = previewUrlCache.get(cacheKey)
    if (cachedUrl !== undefined) {
        return cachedUrl
    }

    const result = await getFilePlayUrl(cacheKey)
    const remoteHtmlUrl = result.url.replace('http://123.121.147.7:1936', '/api_server1936')
    const response = await fetch(remoteHtmlUrl);
    if (!response.ok) {
        throw new Error(`请求失败，状态码: ${response.status}`);
    }
    const htmlContent = await response.text();
    const viewerUrl = extractViewerUrlFromHtml(htmlContent)
    previewUrlCache.set(cacheKey, viewerUrl)
    return viewerUrl
}

// 监听课件变化
watch(currentItem, async (item) => {
    const requestId = ++previewRequestId
    if (!item) {
        pdfUrl.value = ''
        return
    }
    previewLoading.value = true
    try {
        const url = await resolvePreviewUrl(item)
        if (requestId !== previewRequestId) return
        pdfUrl.value = url
    } catch (error) {
        if (requestId !== previewRequestId) return
        pdfUrl.value = ''
        ElMessage.error('获取PDF地址失败')
    } finally {
        if (requestId === previewRequestId) {
            previewLoading.value = false
        }
    }
}, { immediate: true })

const downloadFile = () => {
    const item = currentItem.value;
    if (!item) return
    const encodedName = encodeURIComponent(item.rpName);
    const url = `api/download.shtml?userId=null&id=${item.rpId}&p=rp&g=${encodedName}`;
    fetch(url)
        .then(response => {
            // 构建带扩展名的文件名
            const fileName = item.extName
                ? `${item.rpName}.${item.extName}`
                : item.rpName;

            return response.blob().then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            });
        })
        .catch(error => {
            console.error('下载失败:', error);
        });
};

// 初始化时获取数据
onMounted(async () => {
    await fetchCoursewareList()
})
onBeforeUnmount(() => {
    clearPreviewFreezeResources()
})

</script>
<style lang="scss" scoped>
.courseware-layout {
    --cw-accent: #2f7fca;
    --cw-accent-soft: rgba(47, 127, 202, 0.09);
    --cw-border: rgba(101, 142, 197, 0.16);
    --cw-text: #2d3d50;
    width: 100%;
    height: 100%;
    display: flex;
    overflow: hidden;
    border: 1px solid var(--cw-border);
    border-radius: 20px;
    background: linear-gradient(180deg, rgba(252, 254, 255, 0.88), rgba(241, 248, 255, 0.76));
    backdrop-filter: blur(5px);
}

.courseware-menu {
    flex-shrink: 0;
    border-right: 1px solid var(--cw-border);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.74), rgba(239, 248, 255, 0.66));
    --el-menu-bg-color: transparent;
    --el-menu-hover-bg-color: var(--cw-accent-soft);
    --el-menu-active-color: var(--cw-accent);
    --el-menu-text-color: var(--cw-text);
}

.courseware-preview-frame {
    flex: 1;
    width: 100px;
    background: rgba(255, 255, 255, 0.88);
}

.courseware-empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.courseware-fallback-card {
    max-width: 420px;
    padding: 20px;
    border-radius: 20px;
    border: 1px solid var(--cw-border);
    background: rgba(255, 255, 255, 0.8);
    color: var(--cw-text);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 16px rgba(43, 92, 156, 0.1);
    }
}

.courseware-fallback-tip {
    font-size: 12px;
    margin-top: 8px;
}

.arrow-icon {
    transition: transform 0.5s;

    &.rotate-180 {
        transform: rotate(180deg);
        transition: transform 0.5s;
    }
}

.menu-icon {
    width: 1em;
    margin-right: 8px;
    text-align: center;
    color: rgba(45, 71, 103, 0.8);
}

.courseware-file-icon {
    margin: 2px 0 12px;
    font-size: 68px;
    color: var(--cw-accent);
}

.el-menu-vertical-demo:not(.el-menu--collapse) {
    width: 260px;
}

:global(.el-menu-vertical-demo .el-menu-item.is-active) {
    color: var(--cw-accent) !important;
    background: var(--cw-accent-soft) !important;
}

:global(.el-menu-vertical-demo .el-menu-item.is-active .menu-icon) {
    color: var(--cw-accent) !important;
}

.courseware-select {
    width: 100%;
}

.courseware-option {
    width: 100%;
    min-width: 0;
    display: flex;
    align-items: center;
}

.preview-freeze-mask {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(237, 246, 255, 0.72);
}

:global(.courseware-menu-popper .el-popper__arrow) {
    display: none !important;
}

:global(.courseware-option-tooltip) {
    max-width: min(80vw, 560px);
    white-space: normal;
    word-break: break-all;
    line-height: 1.45;
}
</style>
