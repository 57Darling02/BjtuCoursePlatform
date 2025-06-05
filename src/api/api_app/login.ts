import { service } from "./instance";
import { type UserInfo } from "@/api/types";
export async function login_app(username: string, password: string): Promise<boolean> {
  try {
    // const userInfo = await getUserInfo(username, password)
    return true
  } catch (error) {
    console.log('login_app', error)
    throw error;
  }
}

export const getUserInfo = async (username: string, password: string): Promise<UserInfo> => {
  const response = await service.post('/user/login.action',
    new URLSearchParams({
      phone: username,
      password,
    }));
  if (!response.data?.result?.sessionId) throw new Error('登录失败')
  service.defaults.headers.common['sessionId'] = response.data?.result?.sessionId
  const result: UserInfoResponse = response.data
  const userInfo: UserInfo = {
    id: result.result.studentNo,
    roleCode: result.roleCodes,
    roleName: result.roleNames,
    department: result.result.academyName,
    name: result.result.realName,
    avatarPath: result.result.picUrl.replace('http://123.121.147.7:8081/', 'api_app/'),
    role: createRoleArray(result.roleNames),
    qxkt_id :result.result.id
  };
  return userInfo
}
const createRoleArray = (...roles: (string | undefined)[]) =>
  roles.flatMap(role => role?.split(',') || []).filter(Boolean);
interface UserInfoResponse {
  STATUS: string;
  downloadType: string;
  smartOperationIp: string;
  districtLevelUrl: string;
  schoolCode: string;
  bigDataIp: string;
  playerType: string;
  calendarType: string;
  videoDownType: string;
  userOrgName: string;
  ifHuiWuPerson: string;
  cloudAuth: string;
  inviteFlag: string;
  tencentMeeting: string;
  roleCodes: string;
  roleNames: string;
  result: {
    id: string;
    sessionId: string;
    phone: string;
    userName: string;
    nickName: string;
    realName: string;
    gender: string;
    userLevel: string;
    picUrl: string;
    friendAuth: string;
    searchAuth: string;
    noteAuth: string;
    academyId: string;
    academyName: string;
    priSubject: string;
    priSubjectName: string;
    classId: string;
    classInfoName: string;
    classUUID: string;
    userUUID: string;
    description: string;
    cloudIp: string;
    cloudFlag: string;
    studentNo: string;
  };
}