import { service } from "./instance";
import { extractAlertMessage } from "@/utils";
import * as cheerio from "cheerio";
import type { HomeworkItem, StudentSubmission,HomeWorkDetail, HomeworkFile } from "@/api/types";

const submittedLabels = ["已提交", "已完成", "已交"]
const unsubmittedLabels = ["未提交", "未完成", "待提交"]

const inferSubmitStateFromText = (value: unknown): boolean | undefined => {
    const text = String(value ?? "").trim()
    if (!text) return undefined
    if (unsubmittedLabels.some(label => text.includes(label))) return false
    if (submittedLabels.some(label => text.includes(label))) return true
    return undefined
}

const resolveHomeworkSubmitted = (item: CourseNote): boolean => {
    const fromSubStatus = inferSubmitStateFromText(item.subStatus)
    if (fromSubStatus !== undefined) return fromSubStatus

    const fromScoreStatus = inferSubmitStateFromText(item.stu_score)
    if (fromScoreStatus !== undefined) return fromScoreStatus

    return Boolean(String(item.subTime ?? "").trim())
}

const isReturnedHomework = (item: CourseNote): boolean => {
    if (String(item.return_flag ?? "") === "1") return true
    return String(item.subStatus ?? "").trim() === "被打回"
}
/**
 * 1.获取作业列表getHomeWorkList
 * @param cId 课程ID (必填)
 * @param subType 作业子类型 (默认0)
 * @param page 当前页码 (默认1)
 * @param pageSize 每页数量 (默认10)
 */
const getHomeworkList = async (
    cId: number,
    subType = 0,
    page = 1,
    pageSize = 10
): Promise<CourseNoteResponse> => {
    try {
        const response = await service.get<CourseNoteResponse>(
            '/back/coursePlatform/homeWork.shtml',
            {
                params: {
                    method: 'getHomeWorkList',
                    cId,
                    subType,
                    page,
                    pagesize: pageSize
                }
            }
        )
        return response.data as CourseNoteResponse
    } catch (error) {
        console.error('获取作业列表失败:', error)
        throw new Error('作业信息获取失败，请稍后重试')
    }
}
const getHomeworkItemx = async (cId: number, subType = 0): Promise<HomeworkItem[]> => {
    const response = await getHomeworkList(cId, subType, 1, 999999);
    if (!response?.courseNoteList || response.courseNoteList.length === 0) {
        return [] as HomeworkItem[]; // 返回空数组或处理错误逻辑
    }
    const allHomework: HomeworkItem[] = []
    for (const item of response.courseNoteList) {
        const makeup_time = item.makeup_flag === '1' ? item.makeup_time : null;
        const subStatus = new Date() < new Date(item.end_time) ? 0 : ((item.makeup_flag === "1" && new Date()<new Date(item.makeup_time))? 1 : 2);
        const submitted = resolveHomeworkSubmitted(item)
        const returned = isReturnedHomework(item)
        const reviewed = !returned && Boolean(item.scoreId)
        const myHomeworkId = submitted && Number(item.snId) > 0 ? item.snId : undefined
        const hwitem: HomeworkItem = {
            id: item.id,
            title: item.title,
            content: item.content,
            create_date: item.create_date,
            end_time: item.end_time,
            open_date: item.open_date,
            full_score: item.score,
            course_id: item.course_id,
            course_name: item.course_name,
            subStatus: subStatus,
            status: reviewed ? 2 : (submitted && !returned ? 1 : 0),
            submitted_at: item.subTime || null,
            sub_status_text: item.subStatus || '',
            score_id: item.scoreId ?? null,
            return_flag: item.return_flag ?? null,
            return_num: Number(item.return_num || 0),
            returned,
            submitCount: item.submitCount,
            allCount: item.allCount,
            is_repeat: item.is_repeat,
            fz: Number((item as CourseNote & { fz?: number | string }).fz ?? item.is_fz ?? 0),
            refAnswer: item.refAnswer,
            makeup_time: makeup_time,
            subType: subType,
            detail: {
               my_homework: myHomeworkId
            }
        }
        allHomework.push(hwitem)
    }
    
    return allHomework;
}

// 控制并发数量的函数
const asyncPool = async <T>(concurrency: number, tasks: (() => Promise<T>)[]): Promise<T[]> => {
    const results: T[] = [];
    let index = 0;

    const worker = async () => {
        while (index < tasks.length) {
            const currentIndex = index++;
            const task = tasks[currentIndex];
            const result = await task();
            results[currentIndex] = result;
        }
    };

    const workers = Array.from({ length: concurrency }, worker);
    await Promise.all(workers);
    return results;
};

export const getHomeworkItem = async (cId: number): Promise<HomeworkItem[]> => {
    const tasks = Array.from({ length: 3 }, (_, i) => () => getHomeworkItemx(cId, i));
    const results = await asyncPool(3, tasks); // 并发数设置为
    return results.flat();
}

export const getAllHomeworkItem = async (cIdlist: number[]): Promise<HomeworkItem[]> => {
    const tasks = cIdlist.flatMap(cId => 
        Array.from({ length: 3 }, (_, i) => () => getHomeworkItemx(cId, i))
    );
    const results = await asyncPool(3, tasks); // 并发数设置为 3
    return results.flat();
}


/**
 * 获取学生提交作业列表getHomeWorkDetailList
 * @param homeworkId 教师布置的作业ID
 * @param page 当前页码
 * @param pageSize 每页数量
 */
const getStudentSubmissions = async (
    homeworkId: number,
    courseId: number,
    page = 1,
    pageSize = 100
): Promise<SubmissionListResponse> => {
    try {
        const response = await service.get<SubmissionListResponse>(
            '/back/coursePlatform/homeWork.shtml',
            {
                params: {
                    method: 'getHomeWorkDetailList',
                    id: homeworkId,
                    courseId,
                    page,
                    pagesize: pageSize
                }
            }
        )

        // 处理业务状态码
        switch (response.data?.STATUS) {
            case '0':
                return response.data as SubmissionListSuccessResponse
            case '2':
            case '4':
                return {
                    ...response.data,
                    message: response.data.message || '无提交记录'
                } as SubmissionListEmptyResponse
            default:
                throw new Error('未知响应状态')
        }
    } catch (error) {
        console.error('获取学生提交列表失败:', error)
        throw new Error('获取提交记录失败，请检查作业ID是否正确')
    }
}

/**
 * 获取所有学生提交记录（自动分页）
 */
export const getAllStudentSubmissions = async (
    homeworkId: number,
    courseId: number
): Promise<StudentSubmission[]> => {
    let currentPage = 1
    let totalPage = 1
    const allSubmissions: StudentSubmission[] = []

    while (currentPage <= totalPage) {
        const response = await getStudentSubmissions(homeworkId, courseId, currentPage, 100)
        if (response.STATUS === '0') {
            response.courseNoteList.forEach((item) => {
                item.score = !isNaN(Number(item.score)) ? Number(item.score) : null
            })
            allSubmissions.push(...response.courseNoteList)
            totalPage = response.totalPage
        }
        currentPage++
    }

    return allSubmissions
}


/**
 * 获取作业详情getHomeWorkDetail
 * @param id 作业ID（教师作业ID或学生作业ID）
 */
export const getHomeworkDetail = async (
    id: number
): Promise<HomeWorkDetail> => {
    try {
        const response = await service.get<HomeworkDetailResponse>(
            '/back/coursePlatform/homeWork.shtml',
            {
                params: {
                    method: 'queryStudentCourseNote',
                    id,
                    courseId:'666',
                    teacherId:'666'
                }
            }
        )

        if (response.data.STATUS !== '0') {
            throw (response.data.message || '作业详情获取失败')
        }
        const result = !response.data.homeWork.end_time? response.data.homeWork as StudentHomeworkDetail : response.data.homeWork as TeacherHomeworkDetail;
        
        return {
            id: result.id,
            create_date: result.create_date,
            title: result.title,
            content: result.content,
            FileList: response.data.picList,
        }
    } catch (error) {
        console.error('获取作业详情失败:', error)
        throw new Error('作业详情获取失败，请稍后重试')
    }
}

/**
 * 获取作业详情getHomeWorkDetail_pg
 * @param id 作业ID（学生作业ID）
 * @param upid 教师作业ID
 */
export const getHomeworkDetail_pg = async (
    id: number,
    upId: number,
    uLevel: number
): Promise<HomeWorkDetail> => {
    try {
        const response = await service.get(
            '/back/course/courseWorkInfo.shtml',
            {
                params: {
                    method: 'piGaiDiv',
                    id,
                    upId,
                    uLevel
                }
            }
        )
        const html = response.data;
        const $ = cheerio.load(html);

        const escapeHtml = (input: string) =>
            input
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;')

        const extractHomeworkContent = () => {
            const fromLabelBlock = $('.markContentRightNew .commentItem .homeworkContent').first().html()
            if (fromLabelBlock && fromLabelBlock.trim()) return fromLabelBlock.trim()

            const fromLeftBlock = $('.markContentLeft .homeworkContent').first().html()
            if (fromLeftBlock && fromLeftBlock.trim()) return fromLeftBlock.trim()

            return ''
        }

        const extractReviewComment = () => {
            const fromTextarea = String($('#pigaiContent').val() ?? '').trim()
            if (fromTextarea) return fromTextarea

            const commentLabel = $('.markContentRight .labelText').filter((_, element) => $(element).text().includes('评语')).first()
            const fallbackText = commentLabel.closest('.commentItem').find('textarea').val()
            return String(fallbackText ?? '').trim()
        }

        const extractScore = () => {
            const scoreRaw = String($('#score').val() ?? '').trim()
            return scoreRaw || ''
        }

        const FileList: HomeworkFile[] = []
        const fileElements = $('[onclick*="downloadFile("]')
        fileElements.each((_, element) => {
            const onclick = $(element).attr('onclick')
            if (onclick) {
                const match = onclick.match(/downloadFile\(\s*['"]([^'"]*)['"]\s*,\s*['"]([^'"]*)['"]\s*,\s*['"]?([^'")]+)['"]?\s*\)/)

                if (match && match.length === 4) {
                    const rawPath = match[1]
                    const fileName = match[2]
                    const fileId = Number(match[3] || 0)
                    const params = new URLSearchParams({
                        path: rawPath,
                        filename: fileName,
                        id: String(fileId)
                    })
                    const pdfIndex = rawPath.indexOf('/pdf/')
                    const FHomeworkFile: HomeworkFile = {
                        id: fileId,
                        url: `/api//downloadZyFj.shtml?${params.toString()}`,
                        file_name: fileName,
                        convert_url: pdfIndex >= 0 ? rawPath.slice(pdfIndex + 5) : null,
                        pic_size: 0
                    }
                    if (!FileList.some((item) => item.id === FHomeworkFile.id && item.file_name === FHomeworkFile.file_name)) {
                        FileList.push(FHomeworkFile)
                    }
                }
            }
        })

        const homeworkContent = extractHomeworkContent()
        const reviewComment = extractReviewComment()
        const score = extractScore()
        const contentBlocks: string[] = []
        if (homeworkContent) {
            contentBlocks.push(homeworkContent)
        }
        if (reviewComment) {
            contentBlocks.push(`<p><strong>评语：</strong>${escapeHtml(reviewComment)}</p>`)
        }
        if (score) {
            contentBlocks.push(`<p><strong>分数：</strong>${escapeHtml(score)}</p>`)
        }
        const parsedContent = contentBlocks.join('<br />')

        console.log('downloadParams', {
            id,
            create_date: '',
            title: '',
            content: parsedContent,
            FileList,
        })
        return {
            id,
            create_date: '',
            title: '',
            content: parsedContent,
            FileList,
        }
    } catch (error) {
        console.error('获取作业详情失败:', error)
        throw new Error('作业详情获取失败，请稍后重试')
    }
}


type SubmitHomeworkForm = Record<string, string | number | boolean | undefined>

interface SubmitHomeworkResponse {
    flag: string
}

const parseSubmitHomeworkResponse = (payload: unknown): SubmitHomeworkResponse | null => {
    if (payload && typeof payload === 'object') {
        const record = payload as Record<string, unknown>
        if (typeof record.flag === 'string') {
            return { flag: record.flag }
        }
        return null
    }
    if (typeof payload !== 'string') return null
    try {
        const parsed = JSON.parse(payload) as Record<string, unknown>
        if (typeof parsed.flag === 'string') {
            return { flag: parsed.flag }
        }
    } catch {
        return null
    }
    return null
}

export async function submitHomeworkAPI(formData: SubmitHomeworkForm): Promise<SubmitHomeworkResponse> {
    try {
        const normalizedFormData: SubmitHomeworkForm = { ...formData }
        normalizedFormData.isTeacher =
            normalizedFormData.isTeacher === undefined ? "0" : String(normalizedFormData.isTeacher)
        if (typeof normalizedFormData.content === 'string') {
            normalizedFormData.content = encodeURIComponent(normalizedFormData.content)
        }
        if (typeof normalizedFormData.groupName === 'string') {
            normalizedFormData.groupName = encodeURIComponent(normalizedFormData.groupName)
        }

        const body = new URLSearchParams()
        Object.entries(normalizedFormData).forEach(([key, value]) => {
            if (value !== undefined) {
                body.append(key, String(value))
            }
        })

        const response = await service.post('/back/course/courseWorkInfo.shtml',
            body.toString(),
            {
                params: {
                    method: 'sendStuHomeWorks',
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest'
                },
            }
        );
        const parsedResponse = parseSubmitHomeworkResponse(response.data)
        if (parsedResponse?.flag !== "success") {
            const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
            throw new Error(extractAlertMessage(responseText) || '作业提交失败，服务器返回异常状态');
        }
        return parsedResponse;
    } catch (error) {
        throw new Error(`提交作业失败: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function deleteHomework(homeworkId: number): Promise<delectHomeworkResponse> {
    try {
        const formData = new URLSearchParams();
        formData.append('workId', homeworkId.toString());

        const response = await service.post('/back/course/courseWorkInfo.shtml',
            formData.toString(),
            {
                params: { method: 'delHomeWork' },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            }
        );

        if (response?.data?.flag !== "success") {
            throw new Error(extractAlertMessage(response.data) || '作业删除失败');
        }
        return response.data;
    } catch (error) {
        throw new Error(`删除作业失败: ${error instanceof Error ? error.message : String(error)}`);
    }
}



/** 作业项基础信息getHomeWorkList */
interface ReviewMethod {
    type?: string; // 可能包含类型字段，或根据实际数据调整
}

interface CourseNote {
    id: number;
    create_date: string;
    course_id: number;
    course_sched_id: number;
    course_name: string;
    comment_num: number;
    content: string;
    title: string;
    user_id: number;
    praise_num: number;
    is_fz: number; // 0 或 1（是否转发）
    content_type: number; // 内容类型（示例中均为 0）
    calendar_id: null; // 示例中均为 null
    end_time: string;
    open_date: string;
    score: number;
    moudel_id: number; // 可能为模块 ID（注意拼写可能为 module_id）
    isOpen: number; // 0 或 2（开放状态）
    status: string; // 状态字符串（如 "1"）
    submitCount: number; // 提交次数
    allCount: number; // 总次数
    excellentCount: number; // 优秀次数
    is_publish_answer: string | null; // 是否公布答案（"0" 或 null）
    review_method: ReviewMethod | null; // 评审方法（对象或 null）
    makeup_flag: string; // 补考标志（如 "1"）
    is_repeat: 0 | 1; // 是否重复（0 或 1）
    makeup_time: string; // 补考时间
    snId: number; // 序列号 ID
    scoreId: number; // 分数 ID
    subTime: string; // 提交时间
    subStatus: string; // 提交状态（如 "已提交"）
    return_flag: number; // 返回标志
    return_num: number; // 返回次数
    is_excellent: string; // 是否优秀（"1" 或 "0"）
    stu_score: string; // 学生分数状态
    refAnswer: string; // 参考答案状态
    pg_user_id: number; // 评分用户 ID
    pg_user_name: string; // 评分用户姓名
    returnContent: null; // 示例中均为 null
    pyNum: number; // 点赞次数（可能为 "praise_num" 别名）
}

interface CourseNoteResponse {
    courseNoteList: CourseNote[]; // 课程笔记列表
    page: number; // 当前页码
    size: number; // 每页大小
    currentRow: number; // 当前行号（从 0 开始）
    total: number; // 总记录数
    totalPage: number; // 总页数
    STATUS: string; // 状态码（"0" 表示成功，"2" 表示无数据）
    message: string; // 状态信息
}


/** 作业细节接口响应类型getHomeWorkDetailList */

/** 基础作业文件信息 */
interface HomeworkFileResponse {
    id: number
    url: string
    file_name: string
    convert_url: string | null
    pic_size: number
}


/** 作业提交列表响应基础结构 */
interface BaseSubmissionListResponse {
    page: number
    size: number
    currentRow: number
    total: number
    totalPage: number
    STATUS: "0" | "2" | "4"
    message: string
}

/** 成功响应（有数据） */
interface SubmissionListSuccessResponse extends BaseSubmissionListResponse {
    STATUS: "0"
    courseNoteList: StudentSubmission[]
}

/** 无数据响应 */
interface SubmissionListEmptyResponse extends BaseSubmissionListResponse {
    STATUS: "2" | "4"
    courseNoteList?: never
}

/** 联合响应类型 */
type SubmissionListResponse = SubmissionListSuccessResponse | SubmissionListEmptyResponse




/** 基础作业详情响应 */
interface BaseHomeworkDetailResponse {
    STATUS: '0' | '1'   // 0-成功，1-失败
    message: string
    picList: HomeworkFileResponse[]
    answerPicList: HomeworkFileResponse[]
}

/** 教师布置作业详情 */
interface TeacherHomeworkDetail {
    id: number
    create_date: string
    course_id: number
    course_sched_id: number | null
    content: string
    title: string
    end_time: string | null
    open_date: string | null
    is_fz: 0 | 1
    score: string | null
    moudel_id: number | null
    isOpen: 0 | 1 | 2 | null
    status: "1" | "0"
    ref_answer: string | null
    review_method: string | null
    url: string
    file_name: string
    convert_url: string | null
    pic_size: number
    makeup_time: string | null
    is_repeat: 0 | 1 | null
    makeup_flag: string | null
    // ...其他教师作业特有字段
}

/** 学生提交作业详情 */
interface StudentHomeworkDetail {
    id: number
    create_date: string
    course_id: number
    course_sched_id: number | null
    content: string
    title: string
    end_time: never  // 学生作业无截止时间
    open_date: never
    score: never
    // ...其他学生作业特有字段
    url: string
    file_name: string
    convert_url: string | null
    pic_size: number
    
    // ...其他共有字段
}

/** 教师作业详情响应 */
interface TeacherHomeworkResponse extends BaseHomeworkDetailResponse {
    homeWork: TeacherHomeworkDetail
    pgInfo?:StudentSubmission
}

/** 学生作业详情响应 */
interface StudentHomeworkResponse extends BaseHomeworkDetailResponse {
    homeWork: StudentHomeworkDetail
    pgInfo?:StudentSubmission
}

/** 作业详情联合类型 */
type HomeworkDetailResponse = TeacherHomeworkResponse | StudentHomeworkResponse


type delectHomeworkResponse = {
    flag: string; // 状态码，如 "success" 表示成功
}
