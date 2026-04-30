import type { HomeworkItem } from '@/api';

export interface HomeworkGroup {
    courseName: string;
    items: HomeworkItem[];
}

export const countUncompleted = (list: HomeworkItem[]) =>
    list.filter(hw => hw.status === 0 && hw.subStatus === 0).length;

export const countExpired = (list: HomeworkItem[]) =>
    list.filter(hw => hw.status === 0 && hw.subStatus === 2).length;

export const countWaitMakeup = (list: HomeworkItem[]) =>
    list.filter(hw => hw.status === 0 && hw.subStatus === 1).length;

export const sortTodoHomeworks = (homeworkList: HomeworkItem[]) => {
    return [...homeworkList].sort((a, b) => {
        const aUncompleted = a.status === 0;
        const bUncompleted = b.status === 0;

        const aIsOverdueButCanMakeup = aUncompleted && a.subStatus === 1;
        const bIsOverdueButCanMakeup = bUncompleted && b.subStatus === 1;

        const aIsNotOverdue = aUncompleted && a.subStatus === 0;
        const bIsNotOverdue = bUncompleted && b.subStatus === 0;

        const aIsExpiredOrCompleted = !aUncompleted || a.subStatus === 2;
        const bIsExpiredOrCompleted = !bUncompleted || b.subStatus === 2;

        if (aIsOverdueButCanMakeup !== bIsOverdueButCanMakeup) {
            return aIsOverdueButCanMakeup ? -1 : 1;
        }

        if (aIsOverdueButCanMakeup) {
            const aMakeupTime = a.makeup_time ? new Date(a.makeup_time).getTime() : Infinity;
            const bMakeupTime = b.makeup_time ? new Date(b.makeup_time).getTime() : Infinity;
            return aMakeupTime - bMakeupTime;
        }

        if (aIsNotOverdue !== bIsNotOverdue) {
            return aIsNotOverdue ? -1 : 1;
        }

        if (aIsNotOverdue) {
            const aEndTime = new Date(a.end_time).getTime();
            const bEndTime = new Date(b.end_time).getTime();
            return aEndTime - bEndTime;
        }

        if (aIsExpiredOrCompleted !== bIsExpiredOrCompleted) {
            return aIsExpiredOrCompleted ? 1 : -1;
        }

        if (aIsExpiredOrCompleted) {
            const aCreateTime = new Date(a.create_date).getTime();
            const bCreateTime = new Date(b.create_date).getTime();
            return bCreateTime - aCreateTime;
        }

        return 0;
    }).filter(hw => hw.status === 0 && hw.subStatus !== 2);
};

export const groupHomeworksByCourse = (homeworkList: HomeworkItem[]): Record<string, HomeworkGroup> => {
    const groups: Record<string, HomeworkGroup> = {
        '0': {
            courseName: '待办作业',
            items: sortTodoHomeworks(homeworkList),
        },
    };

    return homeworkList.reduce((acc, hw) => {
        if (!acc[hw.course_id]) {
            acc[hw.course_id] = {
                courseName: hw.course_name,
                items: [],
            };
        }
        acc[hw.course_id].items.push(hw);
        return acc;
    }, groups);
};
