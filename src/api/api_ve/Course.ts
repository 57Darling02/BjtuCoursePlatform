import { service } from "./instance";
import type {
    CourseInfo,
    CourseReplayDetail,
    CourseReplayKnowledgeItem,
    CourseReplayScheduleItem,
    CourseReplayStreamMap,
    CourseResourceItem
} from "@/api/types";

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

const toCourseReplayScheduleItem = (item: VeCourseReplayScheduleResponse): CourseReplayScheduleItem => ({
    id: String(item.id ?? ''),
    uuid: String(item.uuid ?? ''),
    teacherId: String(item.teacherId ?? item.teacher_id ?? item.params?.teacherId ?? item.params?.teacher_id ?? ''),
    courseBetween: String(item.courseBetween ?? ''),
    courseScheName: String(item.courseScheName ?? ''),
    content: String(item.content ?? ''),
    params: {
        videoId: String(item.params?.videoId ?? ''),
        isCollect: item.params?.isCollect ? String(item.params.isCollect) : undefined,
        support: item.params?.support,
        commentCount: item.params?.commentCount,
        isSupport: item.params?.isSupport ? String(item.params.isSupport) : undefined,
    },
});

const toCourseReplayStreamMap = (
    streamMap: NonNullable<NonNullable<VeCourseReplayDetailResponse['res']>['streamMap']> | undefined
): CourseReplayStreamMap => ({
    haveStream: String(streamMap?.haveStream ?? '0'),
    rpSize: streamMap?.rpSize ? String(streamMap.rpSize) : undefined,
    publicRpType: streamMap?.publicRpType ? String(streamMap.publicRpType) : undefined,
    teaStreamHlsUrl: streamMap?.teaStreamHlsUrl || undefined,
    stuStreamHlsUrl: streamMap?.stuStreamHlsUrl || undefined,
    vgaStreamHlsUrl: streamMap?.vgaStreamHlsUrl || undefined,
    teaCloseUpStreamHlsUrl: streamMap?.teaCloseUpStreamHlsUrl || undefined,
    stuCloseUpStreamHlsUrl: streamMap?.stuCloseUpStreamHlsUrl || undefined,
    movieStreamHlsUrl: streamMap?.movieStreamHlsUrl || undefined,
});

export const getCourseReplayScheduleList = async (
    courseId: string
): Promise<CourseReplayScheduleItem[]> => {
    try {
        const response = await service.get<VeCourseReplayScheduleListResponse>(
            '/back/rp/common/teachCalendar.shtml',
            {
                params: {
                    method: 'toDisplyTeachCourses',
                    courseId
                }
            }
        );
        if (response.data.STATUS !== '0') {
            throw new Error(response.data.message || '课程回放课节列表获取失败');
        }

        const list = response.data.courseSchedList || [];
        return [...list].reverse().map(toCourseReplayScheduleItem);
    } catch (error) {
        console.error('Failed to get course replay schedule list:', error);
        throw new Error('无法获取课程回放课节列表，请稍后重试');
    }
};

export const getCourseReplayDetail = async (
    scheduleId: string,
    options: { userId?: string; userLevel?: string } = {}
): Promise<CourseReplayDetail> => {
    try {
        const response = await service.get<VeCourseReplayDetailResponse>(
            '/back/rp/common/teachCalendar.shtml',
            {
                params: {
                    method: 'toDisplyCourseSchedDetail',
                    courseSchedId: scheduleId,
                    userLevel: options.userLevel ?? '1',
                    ...(options.userId ? { userId: options.userId } : {})
                }
            }
        );

        if (response.data.STATUS !== '0' || !response.data.res?.courseSched) {
            throw new Error(response.data.message || '课程回放详情获取失败');
        }

        return {
            courseSched: {
                id: String(response.data.res.courseSched.id ?? ''),
                uuid: String(response.data.res.courseSched.uuid ?? ''),
                courseBetween: String(response.data.res.courseSched.courseBetween ?? ''),
                classRoom: String(response.data.res.courseSched.classRoom ?? ''),
                params: {
                    videoId: String(response.data.res.courseSched.params?.videoId ?? ''),
                    isCollect: response.data.res.courseSched.params?.isCollect
                        ? String(response.data.res.courseSched.params?.isCollect)
                        : undefined,
                    support: response.data.res.courseSched.params?.support,
                    commentCount: response.data.res.courseSched.params?.commentCount,
                    isSupport: response.data.res.courseSched.params?.isSupport
                        ? String(response.data.res.courseSched.params?.isSupport)
                        : undefined,
                }
            },
            streamMap: toCourseReplayStreamMap(response.data.res.streamMap),
            pointStatus: response.data.res.pointStatus ? String(response.data.res.pointStatus) : undefined
        };
    } catch (error) {
        console.error('Failed to get course replay detail:', error);
        throw new Error('无法获取课程回放详情，请稍后重试');
    }
};

export const getCourseReplayKnowledgeList = async (
    rpId: string
): Promise<CourseReplayKnowledgeItem[]> => {
    if (!rpId) return [];
    try {
        const response = await service.get<VeCourseReplayKnowledgeListResponse>(
            '/webservices/qxkt.shtml',
            {
                params: {
                    method: 'queryVeRpInfoZsd',
                    rpId
                }
            }
        );
        if (response.data.STATUS !== '0') {
            throw new Error(response.data.message || '课程回放知识点获取失败');
        }

        return (response.data.data || []).map(item => ({
            id: String(item.id ?? ''),
            zsd_name: String(item.zsd_name ?? ''),
            sfm: String(item.sfm ?? ''),
            zsd_wait_time: String(item.zsd_wait_time ?? '')
        }));
    } catch (error) {
        console.error('Failed to get course replay knowledge list:', error);
        return [];
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

interface VeCourseReplayScheduleResponse {
    id: string | number
    uuid: string
    teacherId?: string | number
    teacher_id?: string | number
    courseBetween: string
    courseScheName: string
    content: string
    params?: {
        videoId?: string
        teacherId?: string | number
        teacher_id?: string | number
        isCollect?: string | number
        support?: string | number
        commentCount?: string | number
        isSupport?: string | number
    }
}

interface VeCourseReplayScheduleListResponse {
    STATUS: '0' | '1'
    message?: string
    courseSchedList?: VeCourseReplayScheduleResponse[]
}

interface VeCourseReplayDetailResponse {
    STATUS: string
    message?: string
    res?: {
        pointStatus?: string | number
        streamMap?: {
            haveStream?: string | number
            rpSize?: string | number
            publicRpType?: string | number
            teaStreamHlsUrl?: string
            stuStreamHlsUrl?: string
            vgaStreamHlsUrl?: string
            teaCloseUpStreamHlsUrl?: string
            stuCloseUpStreamHlsUrl?: string
            movieStreamHlsUrl?: string
        }
        courseSched?: {
            id?: string | number
            uuid?: string
            courseBetween?: string
            classRoom?: string
            params?: VeCourseReplayScheduleResponse['params']
        }
    }
}

interface VeCourseReplayKnowledgeListResponse {
    STATUS: '0' | '1'
    message?: string
    data?: Array<{
        id?: string | number
        zsd_name?: string
        sfm?: string
        zsd_wait_time?: string | number
    }>
}
