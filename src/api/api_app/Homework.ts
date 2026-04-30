import { service } from "./instance";
import type { HomeworkItem } from "@/api/types";

const toHomeworkItem = (item: AppCourseWorkItem): HomeworkItem => ({
    id: item.id,
    course_id: item.courseId,
    course_name: item.courseName,
    title: item.groupName || item.courseName,
    content: item.content,
    create_date: item.createDate,
    open_date: item.openDate,
    end_time: item.endDate,
    makeup_time: null,
    full_score: Number(item.score) || 0,
    subStatus: new Date() < new Date(item.endDate) ? 0 : 2,
    status: item.tasks.length === 0 ? 0 : 1,
    submitCount: item.submitNum,
    allCount: item.submitNum + item.notSubmitNum,
    is_repeat: 0,
    refAnswer: null,
    subType: 0,
    detail: {
        my_homework: item.tasks[0]?.id
    }
});

export const getAllHomeworkItem = async (
    courseIdlist: number[],
    qxkt_id: string
): Promise<HomeworkItem[]> => {
    try {
        const requests = courseIdlist.map(async (courseId) => {
            const response = await service.post<AppCourseWorkResponse>(
                '/choosecourse/get_course_preview_work_new.action',
                {
                    id: qxkt_id,
                    courseId: courseId.toString(),
                    pageOffset: '0',
                    pageSize: '999999'
                }
            );

            return response.data.result?.map(toHomeworkItem) || [];
        });

        const results = await Promise.all(requests);
        return results.flat();
    } catch (error) {
        console.error('作业加载失败', error);
        throw new Error('作业加载失败');
    }
};

interface AppDocumentItem {
    id: number
    fileSize: number
    url: string
    convertUrl: string
    fileName: string
}

interface AppTaskItem {
    id: number
    createDate: string
    courseId: number
    courseSchedId: number
    courseName: string
    commentNum: number
    content: string
    voiceRecordUrl: string
    voiceRecordTime: number
    userNickName: string
    userPicUrl: string
    userId: number
    picNum: number
    openDate: string
    endDate: string
    is_fz: number
    openStatus: number
    submitNum: number
    notSubmitNum: number
    pgNum: number
    score: string
    groupId: string
    groupName: string
    pics: unknown[]
    documents: AppDocumentItem[]
    comments: unknown[]
    isYes: number
    isNo: number
    budong: number
    stuIsYesType: number
    isPicType: number
}

interface AppCourseWorkItem extends AppTaskItem {
    subStatus: string
    tasks: AppTaskItem[]
    isOpen: number
}

interface AppCourseWorkResponse {
    STATUS: string
    total: string
    currPage: number
    result: AppCourseWorkItem[]
    totalPage: number
}
