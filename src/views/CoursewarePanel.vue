<template>

    <div class="CoursewarePanel">
        <div v-if="isLoading">
            <div class="a-card">
                <el-skeleton :rows="2" animated class="skeleton-header" />
            </div>
            <div class="a-card">
                <el-skeleton :rows="1" animated class="skeleton-header" />
                <el-skeleton v-for="m in 2" :key="m" :rows="2" animated class="homework-skeleton"
                    style="margin: 12px 0;" />
            </div>
        </div>
        <div style="flex: 1; display: flex;" v-else>
            <el-menu default-active="2" class="el-menu-vertical-demo" :collapse="isCollapse">
                <el-menu-item @click="toggleCollapse" index="2">
                    <el-icon>
                        <Tools />
                    </el-icon>
                    <span>控制菜单</span>
                </el-menu-item>
                <el-menu-item index="2">
                    <el-icon>
                        <Files />
                    </el-icon>
                    <span>
                        <el-select-v2 v-model="active_value" :options="options" placeholder="Please select" filterable
                            style="width: 100%" :loading="isLoading" />
                    </span>
                </el-menu-item>
                <el-menu-item index="2">
                    <el-icon>
                        <Files />
                    </el-icon>
                    <span>
                        下载次数:
                        {{ coursewareList[active_value].stu_download }}
                    </span>
                </el-menu-item>
                <el-menu-item index="2">
                    <el-icon>
                        <Files />
                    </el-icon>
                    <span>
                        资源Id:
                        {{ coursewareList[active_value].resId }}
                    </span>
                </el-menu-item>
                <el-menu-item index="2">
                    <el-icon>
                        <Files />
                    </el-icon>
                    <span>
                        资源大小:
                        {{ coursewareList[active_value].rpSize }}MB
                    </span>
                </el-menu-item>
                <el-menu-item index="2">
                    <el-icon>
                        <Files />
                    </el-icon>
                    <span>
                        上传人:{{ coursewareList[active_value].teacherName }}
                    </span>
                </el-menu-item>
                <el-menu-item index="2">
                    <el-icon>
                        <Files />
                    </el-icon>
                    <span>
                        上传时间:{{ coursewareList[active_value].inputTime }}
                    </span>
                </el-menu-item>
                <el-menu-item index="2">
                    <el-icon>
                        <Files />
                    </el-icon>
                    <span>
                        状态:{{ coursewareList[active_value].isPublic == 1 ? '公开' : '未公开' }}{{
                            coursewareList[active_value].isPublic}}
                    </span>
                </el-menu-item>

                <el-menu-item index="2"
                    @click="downloadFile">
                    <el-icon>
                        <Files />
                    </el-icon>
                    <template #title>
                        下载
                    </template>
                </el-menu-item>
            </el-menu>
            <iframe style="flex: 1;" v-if="coursewareList[active_value].play_url"
                :src="`/api/pdf/${coursewareList[active_value].play_url}`" frameborder="0"></iframe>
        </div>

    </div>

</template>
<script lang='ts' setup>
import { Files, Tools } from '@element-plus/icons-vue'
import { onMounted, ref, watchEffect } from 'vue'
import { type CourseResourceItem } from '@/api';
import { getCourseResourceList } from '@/api/api_ve';
import download from 'downloadjs';
const isLoading = ref(false)
const active_value = ref()
const options = ref<{ value: number; label: string }[]>([])
const coursewareList = ref<CourseResourceItem[]>([])
const isCollapse = ref(true)
const toggleCollapse = () => {
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
    }
})
// 封装数据获取逻辑
const fetchCoursewareList = async () => {
    const { course_num, fz_id, xq_code } = props

    // 验证参数有效性
    if (!course_num || !fz_id || !xq_code) return

    isLoading.value = true


    try {
        const data = await getCourseResourceList(course_num, fz_id, xq_code)
        coursewareList.value = data || []

        // 更新选项列表
        options.value = coursewareList.value.map((item, idx) => ({
            value: idx,
            label: item.rpName
        }))
        active_value.value = 0
    } catch (error) {
        console.error('获取课件列表失败', error)
    } finally {
        isLoading.value = false
        console.log(coursewareList.value)
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

// 监听 props 变化并重新获取数据
watchEffect(() => {
    const { course_num, fz_id, xq_code } = props
    if (course_num && fz_id && xq_code) {
        fetchCoursewareList()
    }
})



</script>
<style lang="scss" scoped>
.CoursewarePanel {
    width: 100%;
    height: 100%;
    // background-color: antiquewhite;
    display: flex;
    flex-direction: column;
}
</style>