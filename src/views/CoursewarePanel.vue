<template>
    <div class="CoursewarePanel">
        <div v-if="isLoading" v-loading="isLoading" element-loading-text="Loading..." :element-loading-spinner="svg"
            element-loading-svg-view-box="-10, -10, 50, 50" element-loading-background="rgba(122, 122, 122, 0.8)"
            style="flex:1;">
        </div>
        <div style="flex: 1; display: flex;" v-else-if="coursewareList.length > 0">
            <el-menu default-active="2" class="el-menu-vertical-demo" :collapse="isCollapse">
                <el-menu-item @click="toggleCollapse" index="2">
                    <el-icon class="arrow-icon" :class="{ 'rotate-180': !isCollapse }">
                        <DArrowRight />
                    </el-icon>
                    <template #title>控制菜单</template>
                </el-menu-item>
                <el-menu-item index="2">
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
            <iframe style="flex: 1;transition-delay: 2s;" v-if="!isLoading && coursewareList[active_value].play_url"
                :src="`/api/pdf/${coursewareList[active_value].play_url}`" frameborder="0" v-show="isShow"></iframe>
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
import { onMounted, ref } from 'vue'
import { type CourseResourceItem } from '@/api';
import { getCourseResourceList } from '@/api/api_ve';
import router from '@/router';
const isLoading = ref(true)
const svg = `
        <path class="path" d="
          M 30 15
          L 28 17
          M 25.61 25.61
          A 15 15, 0, 0, 1, 15 30
          A 15 15, 0, 1, 1, 27.99 7.5
          L 15 15
        " style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"/>
      `
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
onMounted(() => {
    fetchCoursewareList()
})

</script>
<style lang="scss" scoped>
.CoursewarePanel {
    width: 100%;
    height: 100%;
    // background-color: antiquewhite;
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