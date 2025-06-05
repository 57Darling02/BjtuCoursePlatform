import { service } from "./instance";
import { extractAlertMessage } from "@/utils";

import type { HomeworkItem } from "@/api/types";
export const getAllHomeworkItem = async (courseIdlist: number[], qxkt_id: string): Promise<HomeworkItem[]> => {
    try {
        const requests = courseIdlist.map(async (courseId) => {
            const response = await service.post<CourseResponse>('/choosecourse/get_course_preview_work_new.action', {
                id: qxkt_id,
                courseId: courseId.toString(),
                pageOffset: '0',
                pageSize: '999999'
            });

            return response.data.result?.map(item => ({
                ...item,
                id: item.id, // 作业ID
                course_id: item.courseId, // 课程ID
                course_name: item.courseName,
                title: '',
                content: item.content,
                create_date: item.createDate, // 创建日期
                open_date: item.openDate, // 开放日期
                end_time: item.endDate, // 截止日期
                makeup_time: null,  // 补交截至时间
                full_score: item.score, // 满分
                subStatus: new Date() < new Date(item.endDate) ? 0 : 2,
                status: item.tasks.length == 0 ? 0 : 1, // 作业状态
                submitCount: 0 ,    // 提交人数
                allCount: 0,        // 总人数
                is_repeat: 0,        // 重复提交标识
                subType: 0, // 作业子类型
                detail: {
                    my_homework: item.tasks[0].id 
                 }
            } as unknown as HomeworkItem));
        });

        const results = await Promise.all(requests);
        return results.flat();
    } catch (error) {
        console.error('作业加载失败', error);
        throw new Error('作业加载失败');
    }
};

interface DocumentItem {
    id: number;
    fileSize: number;
    url: string;
    convertUrl: string;
    fileName: string;
}

interface TaskItem {
    id: number;
    createDate: string;
    courseId: number;
    courseSchedId: number;
    courseName: string;
    commentNum: number;
    content: string;
    voiceRecordUrl: string;
    voiceRecordTime: number;
    userNickName: string;
    userPicUrl: string;
    userId: number;
    picNum: number;
    openDate: string;
    endDate: string;
    is_fz: number;
    openStatus: number;
    submitNum: number;
    notSubmitNum: number;
    pgNum: number;
    score: string;
    groupId: string;
    groupName: string;
    pics: any[]; // 图片信息（无具体结构时暂用 any[]）
    documents: DocumentItem[];
    comments: any[]; // 评论信息（无具体结构时暂用 any[]）
    isYes: number;
    isNo: number;
    budong: number;
    stuIsYesType: number;
    isPicType: number;
}

interface CourseItem {
    id: number;
    createDate: string;
    courseId: number;
    courseSchedId: number;
    courseName: string;
    commentNum: number;
    content: string;
    voiceRecordUrl: string;
    voiceRecordTime: number;
    userNickName: string;
    userPicUrl: string;
    userId: number;
    picNum: number;
    openDate: string;
    endDate: string;
    is_fz: number;
    openStatus: number;
    submitNum: number;
    notSubmitNum: number;
    pgNum: number;
    score: string;
    subStatus: string; // 示例中为 "1" 等字符串类型
    groupId: string;
    groupName: string;
    pics: any[]; // 图片信息（无具体结构时暂用 any[]）
    documents: DocumentItem[];
    comments: any[]; // 评论信息（无具体结构时暂用 any[]）
    tasks: TaskItem[];
    isYes: number;
    isNo: number;
    budong: number;
    stuIsYesType: number;
    isPicType: number;
    isOpen: number;
}

export interface CourseResponse {
    STATUS: string;
    total: string;
    currPage: number;
    result: CourseItem[];
    totalPage: number;
}