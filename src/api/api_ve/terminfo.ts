import { service } from "./instance";
import { type TermInfo } from "@/api/types";


/**
 * 获取当前学期信息
 * @returns 包含学期列表的响应数据
 */
export const getAllTerm = async (): Promise<TermInfo[]> => {
    try {
        const response = await service.get<TeachCalendarResponse>(
            '/back/rp/common/teachCalendar.shtml',
            {
                params: {
                    method: 'queryCurrentXq'
                },
                transformResponse: [
                    (data) => {
                        const raw = JSON.parse(data)
                        // 统一处理日期格式（可选）
                        raw.result?.forEach((term: TermInfoResponse) => {
                            term.beginDate = term.beginDate.replace(/-/g, '/')
                            term.endDate = term.endDate.replace(/-/g, '/')
                        })
                        return raw
                    }
                ]
            }
        )

        if (response.data.STATUS !== '0') {
            throw ('校历数据获取失败'+ response)
        }
        const result: TermInfo[] = response.data.result.map((term: TermInfoResponse) => ({
            xqId: term.xqId,
            xqCode: term.xqCode,
            CNAME: term.CNAME,
            UP_CCODE: term.UP_CCODE,
            UP_CNAME: term.UP_CNAME,
            beginDate: new Date(term.beginDate),
            endDate: new Date(term.endDate),
            xqName: term.xqName,
            currentFlag: term.currentFlag
        }))
        return result
    } catch (error) {
        throw (error as string)
    }
}

/** 校历查询响应结构 */
interface TeachCalendarResponse {
    result: TermInfoResponse[]
    STATUS: '0' | '1' 
}
interface TermInfoResponse {
    xqId: string
    xqCode: string
    CNAME: string
    UP_CCODE: string
    UP_CNAME: string
    beginDate: string 
    endDate: string
    xqName: string
    currentFlag: number
}