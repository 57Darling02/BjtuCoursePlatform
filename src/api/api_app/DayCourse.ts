import { service } from "./instance";
import type{CourseScheduleItem} from "@/api/types";
// 获取当天课程的函数
export const getDayCourse = async (DateStr: string): Promise<CourseScheduleItem[]> => {
  try {
    const response:CourseScheduleResponse = (await service.get(`/course/get_stu_course_sched.action?id=00000&dateStr=${DateStr}`)).data;
    if(!response.result) throw response
    const data:CourseScheduleItem[] = response.result.map((item:CourseScheduleItemResponse): CourseScheduleItem => ({
      id: item.id,
      uuid: item.uuid,
      courseId: item.courseId,
      courseName: item.courseName,
      courseType: item.courseType,
      weekDay: item.weekDay,
      courseNum: item.courseNum,
      semesterId: item.semesterId,
      semesterName: item.semesterName,
      teacherId: item.teacherId,
      teacherName: item.teacherName,
      teacherPicUrl: item.teacherPicUrl,
      teacherAcademy: item.teacherAcademy,
      classroomId: item.classroomId,
      classroomUuid: item.classroomUuid,
      classroomName: item.classroomName,
      classroomLongitude: item.classroomLongitude,
      classroomLatitude: item.classroomLatitude,
      teachBuildId: item.teachBuildId,
      teachBuildUuid: item.teachBuildUuid,
      teachBuildName: item.teachBuildName,
      storeyId: item.storeyId,
      storeyName: item.storeyName,
      teachTime: item.teachTime,
      signStatus: item.signStatus,
      classBeginTime: item.classBeginTime,
      classEndTime: item.classEndTime,
    }));
    return data; 
  }catch (error) {
    console.log(error);
    return [];
  }
};

// 后端响应接口
interface CourseScheduleResponse {
  STATUS: string;
  total: string;
  result: CourseScheduleItemResponse[];
}
// 课程表项接口
interface CourseScheduleItemResponse  {
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
  evaluateScore: string;
  evaluateStatus: string;
  signAssistantId: string;
  cloudMeetingRoomId: string;
  assistantTeaName: string;
  assistantStuName: string;
  courseSchedType: string;
  classEndTime: string;
}