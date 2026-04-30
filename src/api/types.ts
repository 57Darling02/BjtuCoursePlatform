export type LoginType = '1' | '2'

export interface UserInfo {
    id: string
    roleCode: string
    roleName: string
    name: string
    department: string
    avatarPath: string
    role: string[]
    qxkt_id?: string
    major?: string
    lastLoginTime?: string
}

export interface TermInfo {
    xqId: string
    xqCode: string
    CNAME: string
    UP_CCODE: string
    UP_CNAME: string
    beginDate: Date
    endDate: Date
    xqName: string
    currentFlag: number
}

export interface CourseInfo {
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

export interface HomeworkItem {
    id: number
    course_id: number
    course_name: string
    title: string
    content: string
    create_date: string
    open_date: string
    end_time: string
    makeup_time: string | null
    full_score: number
    subStatus: 0 | 1 | 2
    status: 0 | 1 | 2
    submitCount: number
    allCount: number
    is_repeat: 0 | 1
    refAnswer: string | null
    subType: number
    detail?: {
        courseNoteList?: StudentSubmission[]
        my_homework?: number
        topFive?: number[]
        average_score?: number
        is_excellent?: number
        score?: number
        rank?: number
        comment?: string
    }
}

export interface HomeWorkDetail {
    id: number
    create_date: string
    title: string
    content: string
    FileList: HomeworkFile[]
}

export interface HomeworkFile {
    id: number
    url: string
    file_name: string
    convert_url: string | null
    pic_size: number
}

export interface StudentSubmission {
    id: number
    groupName: string
    createTime: string
    return_flag: string
    return_num: number
    title: string | null
    content: string
    courseNoteLevel: string
    score: string | null | number
    pgFlag: string
    stu_id: number
    stu_name: string
    stu_num: string
    review_method: string
    is_excellent: '0' | '1'
    stuAvgScore: string
    finalScore: string
}

export interface CourseScheduleItem {
    id: string
    uuid: string
    courseId: string
    courseName: string
    courseType: string
    weekDay: string
    courseNum: string
    semesterId: string
    semesterName: string
    teacherId: string
    teacherName: string
    teacherPicUrl: string
    teacherAcademy: string
    classroomId: string
    classroomUuid: string
    classroomName: string
    classroomLongitude: string
    classroomLatitude: string
    teachBuildId: string
    teachBuildUuid: string
    teachBuildName: string
    storeyId: string
    storeyName: string
    teachTime: string
    signStatus: string
    classBeginTime: string
    classEndTime: string
}

export interface LoginParams {
    username: string
    password: string
    passcode: string
    loginType: LoginType
    captcha_id: string
    csrfmiddlewaretoken: string
}

export type loginParams = LoginParams

export interface CaptchaResponse {
    captchaId: string
    captchaUrl: string
    csrfmiddlewaretoken: string
    captchaText: string
}

export interface CourseResourceItem {
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
