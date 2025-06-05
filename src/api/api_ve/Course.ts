import { service } from "./instance";
import { type CourseInfo, type CourseResourceItem } from "@/api/types";

/**
 * 获取课程列表
 * @param xqCode 学期代码 (必填)
 * @param page 当前页码 (默认1)
 * @param pageSize 每页数量 (默认100)
 */
const getCourseList = async (
    xqCode: string,
    page = 1,
    pageSize = 100
): Promise<CourseListResponse> => {
    try {
        const response = await service.get<CourseListResponse>(
            '/back/coursePlatform/course.shtml',
            {
                params: {
                    method: 'getCourseList',
                    xqCode,
                    page,
                    pagesize: pageSize
                },
                transformResponse: [
                    (data) => {
                        const raw = JSON.parse(data)
                        // 统一处理空值字段
                        raw.courseList?.forEach((course: CourseInfo) => {
                            course.pic = course.pic || null
                            course.selective_course_id = course.selective_course_id || null
                        })
                        return raw
                    }
                ]
            }
        )

        if (response.data.STATUS !== '0') {
            throw new Error(response.data.message || '课程数据获取失败')
        }
        
        return response.data
    } catch (error) {
        console.error('获取课程列表失败:', error)
        throw new Error('无法获取课程信息，请稍后重试')
    }
}

/**
 * 获取所有课程（自动处理分页）
 */
export const getAllCourses = async (xqCode: string): Promise<CourseInfo[]> => {
    let currentPage = 1
    let totalPage = 1
    const allCourses: CourseInfo[] = []
    while (currentPage <= totalPage) {
        const response = await getCourseList(xqCode, currentPage)
        allCourses.push(...response.courseList)
        totalPage = response.totalPage
        currentPage++
    }
    return allCourses
}


/**
 * Get the course resource list
 * @param courseId Course ID (required)
 * @param xkhId Course selection number ID (required)
 * @param xqCode Semester code (required)
 */
export const getCourseResourceList = async (
    courseId: string,
    xkhId: string,
    xqCode: string
): Promise<CourseResourceItem[]> => {
    try {
        
        const response = await service.get<CourseResourceListResponse>(
            '/back/coursePlatform/courseResource.shtml',
            {
                params: {
                    method: 'queryMyUploadResourceForCourseList',
                    courseId,
                    xkhId,
                    xqCode
                }
            }
        );

        if (response.data?.resList === undefined) {
            throw new Error('Course resource data acquisition failed');
        }
        return response.data.resList;
    } catch (error) {
        console.error('Failed to get course resource list:', error);
        throw new Error('Unable to get course resource information, please try again later');
    }
};





/**
 * Course resource information structure
 */
interface CourseResourceItemResponse  {
    rpId: string;
    auditStatus: number;
    rpName: string;
    rpSize: string;
    play_url: string;
    res_url: string;
    isPublic: number;
    inputTime: string;
    clicks: number;
    downloadNum: number;
    resId: number;
    teacherId: string;
    teacherName: string;
    docType: string;
    extName: string;
    share_type: number;
    stu_download: number;
}

/**
 * Course resource list response structure
 */
interface CourseResourceListResponse {
    resList: CourseResourceItemResponse[];
    STATUS: string;
}


/** 课程列表响应结构 */
interface CourseListResponse {
    courseList: CourseInfo[]
    STATUS: '0' | '1'    // 0-成功，1-失败
    message: string
    rows: number         // 每页显示数量
    page: number         // 当前页码
    currentRows: number  // 当前页实际数量
    total: number        // 总记录数
    totalPage: number    // 总页数
}