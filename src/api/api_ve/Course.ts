import { service } from "./instance";
import type { CourseInfo, CourseResourceItem } from "@/api/types";

const toCourseInfo = (course: VeCourseItemResponse): CourseInfo => ({
    id: course.id,
    name: course.name,
    course_num: course.course_num,
    pic: course.pic || null,
    teacher_id: course.teacher_id,
    teacher_name: course.teacher_name,
    begin_date: course.begin_date,
    end_date: course.end_date,
    type: course.type,
    selective_course_id: course.selective_course_id || null,
    fz_id: course.fz_id,
    xq_code: course.xq_code,
    boy: course.boy,
});

const toCourseResourceItem = (resource: VeCourseResourceItemResponse): CourseResourceItem => ({
    rpId: resource.rpId,
    auditStatus: resource.auditStatus,
    rpName: resource.rpName,
    rpSize: resource.rpSize,
    play_url: resource.play_url,
    res_url: resource.res_url,
    isPublic: resource.isPublic,
    inputTime: resource.inputTime,
    clicks: resource.clicks,
    downloadNum: resource.downloadNum,
    resId: resource.resId,
    teacherId: resource.teacherId,
    teacherName: resource.teacherName,
    docType: resource.docType,
    extName: resource.extName,
    share_type: resource.share_type,
    stu_download: resource.stu_download,
});

const getCourseList = async (
    xqCode: string,
    page = 1,
    pageSize = 100
): Promise<VeCourseListResponse> => {
    try {
        const response = await service.get<VeCourseListResponse>(
            '/back/coursePlatform/course.shtml',
            {
                params: {
                    method: 'getCourseList',
                    xqCode,
                    page,
                    pagesize: pageSize
                },
            }
        );

        if (response.data.STATUS !== '0') {
            throw new Error(response.data.message || '课程数据获取失败');
        }

        return response.data;
    } catch (error) {
        console.error('获取课程列表失败:', error);
        throw new Error('无法获取课程信息，请稍后重试');
    }
};

export const getAllCourses = async (xqCode: string): Promise<CourseInfo[]> => {
    let currentPage = 1;
    let totalPage = 1;
    const allCourses: CourseInfo[] = [];

    while (currentPage <= totalPage) {
        const response = await getCourseList(xqCode, currentPage);
        allCourses.push(...response.courseList.map(toCourseInfo));
        totalPage = response.totalPage;
        currentPage++;
    }

    return allCourses;
};

export const getCourseResourceList = async (
    courseId: string,
    xkhId: string,
    xqCode: string
): Promise<CourseResourceItem[]> => {
    try {
        const response = await service.get<VeCourseResourceListResponse>(
            '/back/coursePlatform/courseResource.shtml',
            {
                params: {
                    method: 'queryMyUploadResourceForCourseList',
                    courseId,
                    cId: courseId,
                    xkhId,
                    xqCode,
                    docType: 1,
                    up_id: 0,
                    searchName: ''
                }
            }
        );

        if (!response.data?.resList) {
            throw new Error('课件资源数据获取失败');
        }

        return response.data.resList.map(toCourseResourceItem);
    } catch (error) {
        console.error('Failed to get course resource list:', error);
        throw new Error('无法获取课件资源信息，请稍后重试');
    }
};

interface VeCourseItemResponse {
    id: number
    name: string
    course_num: string
    pic: string | null
    teacher_id: number
    teacher_name: string
    begin_date: string
    end_date: string
    type: 0 | 1
    selective_course_id: number | null
    fz_id: string
    xq_code: string
    boy: '0' | '1'
}

interface VeCourseListResponse {
    courseList: VeCourseItemResponse[]
    STATUS: '0' | '1'
    message: string
    rows: number
    page: number
    currentRows: number
    total: number
    totalPage: number
}

interface VeCourseResourceItemResponse {
    rpId: string
    auditStatus: number
    rpName: string
    rpSize: string
    play_url: string
    res_url: string
    isPublic: number
    inputTime: string
    clicks: number
    downloadNum: number
    resId: number
    teacherId: string
    teacherName: string
    docType: string
    extName: string
    share_type: number
    stu_download: number
}

interface VeCourseResourceListResponse {
    resList: VeCourseResourceItemResponse[]
    STATUS: string
}
