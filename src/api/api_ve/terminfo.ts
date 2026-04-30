import { service } from "./instance";
import type { TermInfo } from "@/api/types";

const toTermInfo = (term: VeTermInfoResponse): TermInfo => ({
    xqId: term.xqId,
    xqCode: term.xqCode,
    CNAME: term.CNAME,
    UP_CCODE: term.UP_CCODE,
    UP_CNAME: term.UP_CNAME,
    beginDate: new Date(term.beginDate.replace(/-/g, '/')),
    endDate: new Date(term.endDate.replace(/-/g, '/')),
    xqName: term.xqName,
    currentFlag: term.currentFlag
});

export const getAllTerm = async (): Promise<TermInfo[]> => {
    try {
        const response = await service.get<VeTeachCalendarResponse>(
            '/back/rp/common/teachCalendar.shtml',
            {
                params: {
                    method: 'queryCurrentXq'
                }
            }
        );

        if (response.data.STATUS !== '0') {
            throw new Error('校历数据获取失败');
        }

        return response.data.result.map(toTermInfo);
    } catch (error) {
        throw error;
    }
};

interface VeTeachCalendarResponse {
    result: VeTermInfoResponse[]
    STATUS: '0' | '1'
}

interface VeTermInfoResponse {
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
