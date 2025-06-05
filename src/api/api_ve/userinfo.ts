import { extractAlertMessage } from "@/utils";
import { service } from "./instance";
import { type UserInfo } from "@/api/types";

/**
 * 获取用户详细信息，返回统一的用户信息对象。
 * @returns Promise<UserInfo> - 用户详细信息对象。
 */
export const getUserInfo = async (): Promise<UserInfo> => {
    try {
        const response = await getResponse();
        const baseInfo: UserInfo = {
            id: response.ID,
            roleCode: response.CROLECODE,
            roleName: response.CROLENAME,
            department: "",
            name: "",
            avatarPath: "",
            role: [] as string[],
        };
        if (isStudent(response)) {
            const student = response as StudentUserInfo;
            return {
                ...baseInfo,
                avatarPath: `api/download.shtml?p=photo&f=${student.IMG_PATH_1 || student.IMG_PATH_2 || ''}`,
                name: student.STU_NAME,
                department: student.SCHOOL,
                role: createRoleArray(student.CROLENAME)
            };
        }

        const teacher = response as TeacherUserInfo;
        return {
            ...baseInfo,
            avatarPath: `api/download.shtml?p=photo&f=${teacher.CIMG_PATH_1 || teacher.CIMG_PATH_2 || ''}`,
            name: teacher.CPERSONNAME,
            department: teacher.CDEPARNAME,
            role: createRoleArray(teacher.CROLENAME, teacher.CZHIWU_NAME)
        };
    } catch (error) {
        throw error; 
    }
};

// 辅助函数
const isStudent = (res: UserInfoResponse): res is StudentUserInfo =>
    res.CROLECODE.includes('xs');
const createRoleArray = (...roles: (string | undefined)[]) =>
    roles.flatMap(role => role?.split(',') || []).filter(Boolean);

// 接口函数
const getResponse = async (): Promise<UserInfoResponse> => {
    try {
        const response = await service.get('/back/coursePlatform/userInfo.shtml',
            {
                params: {
                    method: 'getUserInfo'
                },
            }
        )
        if (response.headers['content-type'].includes('html') || !response.data?.userInfo) {
            throw (extractAlertMessage(response.data) || undefined)
        }
        return response.data?.userInfo
    } catch (error) {
        throw (error as string)
    }
}

/** 后端响应接口 */
type UserInfoResponse = StudentUserInfo | TeacherUserInfo
interface BaseUserInfo {
    ID: string; // 用户ID（学生/教师唯一标识）
    CROLECODE: "xs" | "ls"; // 角色编码（xs-学生，ls-老师）
    CROLENAME: string;
    IS_BOUND_EMAIL: 1 | 2; // 邮箱绑定状态（1-已绑定，2-未绑定）
    IS_BOUND_TEL: 1 | 2; // 手机绑定状态（1-已绑定，2-未绑定）
    syn: 0 | 1; // 同步状态（0-未同步，1-已同步）
    QXKT_ID: number; // 权限课堂ID
    createCard_time: string | null; // 制卡时间（示例中为空或null）
    card_status: string | null; // 卡状态（示例中为空或null）
}
interface StudentUserInfo extends BaseUserInfo {
    STU_NO: string; // 学号（与ID相同）
    STU_NAME: string; // 学生姓名
    STU_NAME_PY: string | null; // 学生姓名拼音（null表示未填写）
    ORG_ID: string; // 组织ID（校区ID，示例中"01"为主校区）
    ORG_NAME: string; // 组织名称（校区名称，示例中"主校区"）
    SCHOOL: string; // 学院名称（示例中"交通运输学院"）
    SCHOOL_ID: string; // 学院ID（示例中"04"）
    PROFESSION: string; // 专业名称（示例中"智能运输工程"）
    PROFESSION_ID: string; // 专业ID（示例中"677"）
    PROFESSION_STUDY_LEN: string; // 学制（示例中"1"，具体含义需结合业务）
    PROFESSION_STUDY_LEVEL: string | null; // 学历层次（null表示未填写）
    grade_id: string; // 年级ID（示例中"01_2022"）
    GRADE_NAME: string; // 年级名称（示例中"2022年级"）
    CLASS_ID: string; // 班级ID（示例中"zhinengyunshu2201"）
    CLASS_NAME: string; // 班级名称（示例中"智能运输2201"）
    IMG_PATH_1: string; // 照片路径1（示例中有效路径）
    IMG_PATH_2: string; // 照片路径2（示例中与路径1相同）
    SEX: "男" | "女" | null; // 性别（示例中"男"）
    BEFORE_NAME: string | null; // 曾用名（null表示无）
    ID_CARD: string | null; // 身份证号（null表示未填写）
    ZZMM_CODE: string | null; // 政治面貌编码（null表示未填写）
    ZZMM_NAME: string | null; // 政治面貌名称（null表示未填写）
    MZ_CODE: string | null; // 民族编码（null表示未填写）
    MZ_NAME: string | null; // 民族名称（null表示未填写）
    BIRTH_DATE: string | null; // 出生日期（格式如YYYY-MM-DD，null表示未填写）
    P_ID: string | null; // 省ID（null表示未填写）
    C_ID: string | null; // 市ID（null表示未填写）
    A_ID: string | null; // 区ID（null表示未填写）
    P_NAME: string | null; // 省名称（null表示未填写）
    C_NAME: string | null; // 市名称（null表示未填写）
    A_NAME: string | null; // 区名称（null表示未填写）
    ENTRY_DATE: string | null; // 入学日期（null表示未填写）
    XL_CODE: string | null; // 学历编码（null表示未填写）
    XL_NAME: string | null; // 学历名称（null表示未填写）
    HK_TYPE_CODE: string | null; // 户口类型编码（null表示未填写）
    HK_TYPE_NAME: string | null; // 户口类型名称（null表示未填写）
    HK_PLACE: string | null; // 户口所在地（null表示未填写）
    LX_ADDRESS: string | null; // 联系地址（null表示未填写）
    LX_POSTCODE: string | null; // 联系邮编（null表示未填写）
    LX_PERSONNAME: string | null; // 联系人姓名（null表示未填写）
    LX_TEL: string | null; // 联系电话（null表示未填写）
    XS_TEL: string; // 学生电话（示例中为空字符串，非null）
    XS_QQ: string | null; // 学生QQ（null表示未填写）
    XS_EMAIL: string; // 学生邮箱（示例中为空字符串，非null）
    BY_SCHOOL: string | null; // 毕业学校（null表示未填写）
    BY_DATE: string | null; // 毕业日期（null表示未填写）
    JK_REMARK: string | null; // 健康备注（null表示未填写）
    TJ_REMARK: string | null; // 体检备注（null表示未填写）
    TC_REMARK: string | null; // 体测备注（null表示未填写）
    MONEY_LY: string | null; // 经费来源（null表示未填写）
    MONEY_YEAR: string | null; // 经费年度（null表示未填写）
    MONEY_PERSON: string | null; // 经费负责人（null表示未填写）
    IS_FLOW: 0 | 1; // 是否流动人员（0-否，1-是，示例中0）
    IS_LOW: 0 | 1; // 是否低保（0-否，1-是，示例中0）
    IS_TRAIN: 0 | 1; // 是否培训生（0-否，1-是，示例中1）
    BLANK_NO: string | null; // 空白号（null表示未填写）
    IC_CARD: string | null; // 校园卡号（null表示未填写）
    PASSOWRD: string; // 密码（注意接口的拼写错误）
    LAST_LOGIN_TIME: string | null; // 最后登录时间（null表示未登录过）
    LAST_LOGIN_IP: string | null; // 最后登录IP（null表示未登录过）
    IS_DORM: 0 | 1 | 2; // 住宿状态（0-未申请，1-已入住，2-未住宿，示例中2）
    OUT_ADDRESS: string | null; // 校外地址（null表示未填写）
    DORM_ID: string | null; // 宿舍ID（null表示未分配）
    DORM_CODE: string | null; // 宿舍编码（null表示未分配）
    BED_NO: string | null; // 床位号（null表示未分配）
    AUDIT_STATUS: 0 | 1 | 2; // 审核状态（0-未审核，1-审核中，2-已通过，示例中2）
    XJ_STATUS: 0 | 1; // 学籍状态（0-无效，1-有效，示例中1）
    XF: number; // 学分（示例中0）
    XS: number; // 学时（示例中0）
    JF: number; // 积分（示例中0）
    REMARK: string | null; // 备注（null表示无）
    DELETED: 0 | 1 | 2; // 删除状态（0-未删除，1-已删除，2-逻辑删除，示例中2）
    UPDATE_PERSONNAME: string | null; // 最后更新人姓名（null表示未更新）
    UPDATE_TIME: string | null; // 最后更新时间（null表示未更新）
    INPUT_USER_ID: string | null; // 录入用户ID（null表示未录入）
    INPUT_USER_NAME: string | null; // 录入用户姓名（null表示未录入）
    INPUT_TIME: string | null; // 录入时间（null表示未录入）
    STU_TYPE: 0 | 1; // 学生类型（1-普通学生，示例中1）
    stu_code: string; // 学生代码（示例中为空字符串，非null）
    CMEMO3: string | null; // 自定义备注3（null表示未填写）
    boy: string | null; // 预留字段（null表示未使用）
}
interface TeacherUserInfo extends BaseUserInfo {
    CPERSONCODE: string; // 教师工号
    CPERSONNAME: string; // 教师姓名
    CLOGINNAME: string; // 登录用户名
    CLOGINPASSWORD: string; // 登录密码
    CDEPARCODE: string; // 学院编码（"04"对应交通运输学院）
    CDEPARNAME: string; // 学院名称
    CJIGOUCODE: string; // 机构编码（学校唯一标识）
    CJIGOUNAME: string; // 机构名称（"北京交通大学"）
    PASS_INVALIDITY_DATE: string | null; // 密码失效日期（null表示未设置）
    PASS_VALIDITY_DAYS: number; // 密码有效期天数（0表示永久有效）
    PASS_INVALIDITY: 0 | 1 | 2; // 密码失效状态（2-正常）
    CLASTLOGINTIME: string; // 最后登录时间（格式：YYYY-MM-DD HH:mm:ss）
    CLASTLOGINIP: string; // 最后登录IP（"123.121.147.7"）
    MACADDRESS: string | null; // MAC地址（null表示未绑定）
    MAC: 0 | 1 | 2; // MAC绑定状态（2-未绑定，示例中2）
    SYS_LOGIN: 0 | 1 | 2; // 系统登录状态（2-正常，示例中2）
    CTINGYONG: 0 | 1; // 是否启用（1-启用，示例中1）
    CIMG_PATH_1: string; // 照片路径1
    CIMG_PATH_2: string; // 照片路径2
    CSEX: "男" | "女" | null; // 性别（null表示未填写）
    CADDRESS: string | null; // 地址（null表示未填写）
    CEMAIL: string | null; // 邮箱（null表示未填写）
    CBIRTHDAY: string | null; // 出生日期（格式：YYYY-MM）
    CZHIWU_CODE: string; // 职务编码（示例中为空字符串）
    CZHIWU_NAME: string; // 职务名称（示例中为空字符串）
    CGUDINGTEL: string | null; // 固定电话（null表示未填写）
    CMOBILETEL: string | null; // 移动电话（null表示未填写）
    CMEMO1: string; // 自定义备注1（示例中为空字符串）
    CMEMO2: string; // 自定义备注2（示例中为空字符串）
    WEB_INDEX: string | null; // 个人主页（null表示未填写）
    IS_BEST: 0 | 1 | 2; // 是否优秀（2-默认，示例中2）
    DADDTIME: string | null; // 录入时间（null表示未填写）
    CMEMO3: string | null; // 自定义备注3（null表示未填写）
    ICCARD: string | null; // 工卡号（null表示未填写）
    RP_DEFAULT_SIZE: string; // 报表默认尺寸（示例中"1024"）
    DOWNLOAD_RP_AUTH: 0 | 1; // 下载报表权限（0-无，示例中0）
    cloud_auth: 0 | 1; // 云权限（0-无，示例中0）
    download_rp_authc: 0 | 1 | 2; // 下载报表权限（2-默认，示例中2）
    sf_personid: string; // 同步平台用户ID（示例中为空字符串）
    sf_personname: string; // 同步平台用户名（示例中为空字符串）
    grade_id_list: string; // 负责年级ID列表（示例中"2019"）
    grade_name_list: string; // 负责年级名称列表（示例中为空字符串）
    person_sso_id: string | null; // 单点登录ID（null表示未配置）
    tkpowerName: string; // 权限名称（示例中为空字符串）
    tkpowerId: string; // 权限ID（示例中为空字符串）
    ifgld: string; // 预留字段（示例中为空字符串）
    choseCourse: string; // 所选课程（示例中为空字符串）
    person_card: string; // 个人卡信息（示例中为空字符串）
    cloud_auth_set: string | null; // 云权限设置（null表示未配置）
    optionStr: string | null; // 扩展选项（null表示未配置）
    courseNames: string | null; // 课程名称列表（null表示未配置）
    permIds: string | null; // 权限ID列表（null表示未配置）
    politicalFlag: "0" | "1"; // 政治面貌标识（"1"表示党员，示例中"1"）
    permIds_person: string | null; // 个人权限ID（null表示未配置）
    optionStr_person: string | null; // 个人扩展选项（null表示未配置）
    teacherNames_person: string | null; // 关联教师姓名（null表示未配置）
    lgh: string | null; // 预留字段（null表示未使用）
    CZHICHENG_CODE: string; // 职称编码（示例中"11"对应教授）
    CZHICHENG_NAME: string; // 职称名称（示例中"教授"）
    open_voice: 0 | 1; // 语音开关（1-开启，示例中1）
    close_water_mark: 0 | 1; // 水印关闭（1-关闭，示例中1）
    is_young: 0 | 1; // 是否青年教师（1-是，示例中1）
    height: string; // 身高（示例中"0"，单位未知）
    table_height: string; // 桌子高度（示例中"100"，单位未知）
    Pitch_angle: string; // 倾斜角度（示例中"0"，单位未知）
    change_type: string; // 变更类型（示例中"0"）
    change_time: string; // 变更时间（示例中为空字符串）
    ID_CARD: string | null; // 身份证号（null表示未填写）
}
