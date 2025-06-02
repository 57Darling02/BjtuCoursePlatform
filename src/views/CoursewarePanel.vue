<template>
    <div class="CoursewarePanel">
        <Loading v-if="isLoading && !userStore.isLoading" />
        <div style="flex: 1; display: flex;" v-else-if="coursewareList.length > 0">
            <el-menu default-active="2" class="el-menu-vertical-demo" :collapse="isCollapse">
                <el-menu-item @click="toggleCollapse" index="2">
                    <el-icon class="arrow-icon" :class="{ 'rotate-180': !isCollapse }">
                        <DArrowRight />
                    </el-icon>
                    <template #title>点击{{ isCollapse ? '展开' : '收起' }}菜单</template>
                </el-menu-item>
                <el-menu-item @click="isCollapse = false" index="2">
                    <el-icon>
                        <Files />
                    </el-icon>
                    <span>
                        <el-select-v2 v-model="active_value" :options="options" placeholder="Please select" filterable
                            style="width: 100%" :loading="isLoading">
                            <template #default="{ item }">
                                <el-tooltip class="box-item" effect="dark" :content="item.label" style="width: 50px;"
                                    placement="right">
                                    <el-row>
                                        <el-text truncated>{{ item.label }}</el-text>
                                    </el-row>
                                </el-tooltip>
                            </template>
                        </el-select-v2>
                    </span>
                </el-menu-item>
                <!-- <el-menu-item index="2">
                    <el-icon>
                        <Tools />
                    </el-icon>
                    <span>
                        是否允许下载:
                        {{ coursewareList[active_value]. }}
                    </span>
                </el-menu-item>
                <el-menu-item index="2">
                    <el-icon>
                        <Tools />
                    </el-icon>
                    <span>
                        资源Id:
                        {{ coursewareList[active_value].resId }}
                    </span>
                </el-menu-item> -->
                <el-menu-item index="2">
                    <el-icon>
                        <FolderOpened />
                    </el-icon>
                    <span>
                        资源大小:
                        {{ coursewareList[active_value].rpSize }}MB
                    </span>
                </el-menu-item>
                <el-menu-item index="2">
                    <el-icon>
                        <FolderOpened />
                    </el-icon>
                    <span>
                        资源类型:
                        {{ coursewareList[active_value].extName }}
                    </span>
                </el-menu-item>
                <el-menu-item index="2">
                    <el-icon>
                        <Unlock v-if="coursewareList[active_value].share_type == 2" />
                        <Lock v-else />
                    </el-icon>
                    <span>
                        资源状态:{{ coursewareList[active_value].share_type == 2 ? '公开' : '未公开' }}
                    </span>
                </el-menu-item>
                <el-menu-item index="2">
                    <el-icon>
                        <Avatar />
                    </el-icon>
                    <span>
                        上传人:{{ coursewareList[active_value].teacherName }}
                    </span>
                </el-menu-item>
                <el-menu-item index="2">
                    <el-icon>
                        <Timer />
                    </el-icon>
                    <span>
                        上传时间:{{ coursewareList[active_value].inputTime }}
                        <!-- {{ coursewareList[active_value].res_url }} -->
                    </span>
                </el-menu-item>


                <el-menu-item index="2" @click="downloadFile">
                    <el-icon>
                        <Download />
                    </el-icon>
                    <template #title>
                        下载
                    </template>
                </el-menu-item>
            </el-menu>

            <iframe style="flex: 1;width: 100px;" v-if="!isLoading && pdfUrl" :src="pdfUrl" frameborder="0"
                v-show="isShow" />
            <div style="flex: 1;display: flex;flex-direction: row;justify-content: center;align-items: center;" v-else>
                <div class="a-card"
                    style="display: flex;flex-direction: column;justify-content: center;align-items: center;"
                    @click="downloadFile">
                    <Document style="width: 100px; height: 100px; margin-right: 8px" />
                    {{ coursewareList[active_value].rpName }}
                    <el-text class="text-muted" style="font-size: 12px; margin-top: 8px;">
                        该课件暂无预览功能，请点击此处下载后查看
                    </el-text>
                </div>
            </div>
        </div>
    </div>

</template>
<script lang='ts' setup>
import { Files, FolderOpened, DArrowRight, Download, Timer, Avatar, Document, Unlock, Lock } from '@element-plus/icons-vue'
import Loading from '@/components/Loading.vue';
import { onMounted, ref, watch } from 'vue'
import { type CourseResourceItem } from '@/api';
import { getCourseResourceList } from '@/api/api_ve';
import { useUserStore } from '@/stores/user';
const userStore = useUserStore();
import router from '@/router';
const isLoading = ref(true);
const isShow = ref(true)
const active_value = ref()
const options = ref<{ value: number; label: string }[]>([])
const coursewareList = ref<CourseResourceItem[]>([])
const isCollapse = ref(true)
const toggleCollapse = () => {
    isShow.value = false
    isCollapse.value = !isCollapse.value;
    setTimeout(() => {
        isShow.value = true
    }, 300)

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
    }
})
// 封装数据获取逻辑
const fetchCoursewareList = async () => {
    const { course_num, fz_id, xq_code } = props
    if (!course_num || !fz_id || !xq_code) {
        ElMessage.error({
            message: `参数错误: ${!course_num ? '课程编号' : ''} ${!fz_id ? '分组ID' : ''} ${!xq_code ? '学期代码' : ''}`,
            duration: 3000
        })
        console.error('缺失参数:', { course_num, fz_id, xq_code })
        router.push({ name: 'learnspace' })
        return
    }
    try {
        const data = await getCourseResourceList(course_num, fz_id, xq_code)
        coursewareList.value = data || []
        if (coursewareList.value.length === 0) {
            ElMessage.warning('该课程暂无课件资源')
        }
        // 更新选项列表
        options.value = coursewareList.value.map((item, idx) => ({
            value: idx,
            label: item.rpName
        }))
        active_value.value = 0
    } catch (error) {
        ElMessage.error({
            message: `获取课件列表失败`,
            duration: 3000
        })
        router.push({ name: 'learnspace' })
    } finally {
        isLoading.value = false
        // console.log(coursewareList.value)
    }
}

const getFilePlayUrl = async (resId: string) => {
    try {
        // Make HTTP GET request to the endpoint
        const response = await fetch(`/api/back/coursePlatform/dataSynAction.shtml?method=getFilePlayUrl&id=${resId}&type=2`);

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

// 监听课件变化
watch(active_value, async (newVal) => {
    const currentItem = coursewareList.value[newVal]
    if (currentItem.play_url && (currentItem.extName.endsWith('pdf') || currentItem.extName == 'docx')) {
        pdfUrl.value = `/static/pdfjs-5.2.133-dist/web/viewer.html?file=/api/pdf/${currentItem.play_url}`
    } else if (currentItem?.play_url?.endsWith('pdf') && currentItem.extName != 'pdf') {
        try {
            isLoading.value = true
            const result = await getFilePlayUrl(currentItem.resId.toString())
            pdfUrl.value = result.url.replace('http://123.121.147.7:1936', '/api_server1936')
            const response = await fetch(pdfUrl.value);
            if (!response.ok) {
                throw new Error(`请求失败，状态码: ${response.status}`);
            }
            const htmlContent = await response.text();
            // 使用 DOMParser 解析 HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            // 查找所有 type="text/javascript" 的 script 标签
            const scripts = Array.from(doc.querySelectorAll('script[type="text/javascript"]'));
            let scriptContent = '';
            for (const script of scripts) {
                if (script.textContent && script.textContent.includes('var url =')) {
                    scriptContent = script.textContent;
                    break;
                }
            }

            if (scriptContent) {
                // 使用正则表达式提取 url 的值
                const urlMatch = scriptContent.match(/var url = ['"]([^'"]+)['"]/);
                if (urlMatch && urlMatch[1]) {
                    const extractedUrl = urlMatch[1];

                    const match = extractedUrl.match(/kk\/(.*)$/);
                    if (match && match[1]) {
                        const targetPath = match[0];
                        pdfUrl.value = "/static/pdfjs-5.2.133-dist/web/viewer.html?file=/api_server1936/" + targetPath;
                    } else {
                        console.log('未匹配到 kk/ 后面的内容');
                        pdfUrl.value = '';
                    }
                    // console.log('提取的 PDF URLaa:',pdfUrl.value);
                }
            }

        } catch (error) {
            ElMessage.error('获取PDF地址失败')
        } finally {
            isLoading.value = false
        }
    } else {
        pdfUrl.value = ''
    }
}, { immediate: true })

const downloadFile = () => {
    const item = coursewareList.value[active_value.value];
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

</script>
<style lang="scss" scoped>
.CoursewarePanel {
    width: 100%;
    height: 100%;
    border-color: rgba(234, 228, 228, 0.13);
    backdrop-filter: blur(5px);
    display: flex;
    flex-direction: column;
}

.arrow-icon {
    transition: transform 0.5s;

    &.rotate-180 {
        transform: rotate(180deg);
        transition: transform 0.5s;
    }
}
</style>