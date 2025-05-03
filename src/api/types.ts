export interface UserInfo {
    id: string; // 学号/工号
    roleCode: string;
    roleName: string;
    name: string; // 统一姓名（学生：STU_NAME / 教师：CPERSONNAME）
    department: string; // 统一所属部门（学生：学院SCHOOL / 教师：学院CDEPARNAME）
    avatarPath: string; // 统一头像路径1（学生：IMG_PATH_1 / 教师：CIMG_PATH_1）
    role: string[];
    qxkt_id?: string; // qkxtID（可选）
    // 以下为差异化保留字段（可选）
    major?: string; // 学生特有
    lastLoginTime?: string; // 教师特有：最后登录时间（CLASTLOGINTIME）
}


/** 学期信息 */
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


/** 课程基本信息 */
export interface CourseInfo {
    id: number
    name: string
    course_num: string
    pic: string | null
    teacher_id: number
    teacher_name: string
    begin_date: string
    end_date: string
    type: 0 | 1         // 假设 0-必修，1-选修（根据实际值调整）
    selective_course_id: number | null
    fz_id: string
    xq_code: string
    boy: '0' | '1'      // 性别标识
}



/** 1.作业项基础信息getHomeWorkList */
export interface HomeworkItem {
    id: number // 作业ID
    course_id: number // 课程ID
    course_name: string
    title: string
    content: string
    create_date: string // 创建日期
    open_date: string // 开放日期
    end_time: string // 截止日期
    makeup_time: string  | null   // 补交截至时间
    full_score: number // 满分
    subStatus: 0 | 1 | 2       //  0-未截止，1-已截止可补交, 2-已过期
    status: 0 | 1 | 2        // 状态 0-"未提交" | 1-"已提交" | 2-"已批改"
    submitCount: number     // 提交人数
    allCount: number        // 总人数
    is_repeat: 0 | 1        // 重复提交标识
    refAnswer: string | null // 参考答案
    subType: number // 作业子类型
    detail?: {
        courseNoteList?: StudentSubmission[]// 学生提交的作业列表
        my_homework?: number
        topFive?: number[]
        average_score?: number // 平均得分
        is_excellent?: number // 优秀作业标识
        score?: number // 得分
        rank?: number // 排名
        comment?:string
    }
}
export interface HomeWorkDetail {
    id: number // 作业ID 
    create_date: string // 创建日期
    title: string // 标题
    content: string // 内容
    FileList: HomeworkFile[] // 附件列表
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
    is_excellent: "0" | "1"
    stuAvgScore: string
    finalScore: string
}

export interface CourseScheduleItem {
    id: string;
    uuid: string;
    courseId: string;
    courseName: string;
    courseType: string;
    weekDay: string;
    courseNum: string;
    semesterId: string;
    semesterName: string;
    teacherId: string;
    teacherName: string;
    teacherPicUrl: string;
    teacherAcademy: string;
    classroomId: string;
    classroomUuid: string;
    classroomName: string;
    classroomLongitude: string;
    classroomLatitude: string;
    teachBuildId: string;
    teachBuildUuid: string;
    teachBuildName: string;
    storeyId: string;
    storeyName: string;
    teachTime: string;
    signStatus: string;
    classBeginTime: string;
    classEndTime: string;
}

export interface loginParams {
    username: string,
    password: string,
    passcode: string,
    loginType: '1' | '2' 
    captcha_id: string
    csrfmiddlewaretoken: string
}

export interface CaptchaResponse  {
    captchaId: string; // 验证码ID
    captchaUrl: string; // 验证码图片URL
    csrfmiddlewaretoken: string; // CSRF令牌
    captchaText: string; // 验证码文本（可选）
}