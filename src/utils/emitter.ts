// 预定义允许的事件名称（类型安全）
// 白名单事件列表
const eventNames = ['ALERT_E','ALERT_S','ALERT','UPDATE_HOMEWORKS','API:UN_AUTH','UPDATE_HOMEWORKS_DETAIL','UPDATE_INFO'] as const; // 使用as const将数组转换为只读元组，确保类型安全
type EvenNames =(typeof eventNames)[number];      
class EventEmitter {
    // 使用Record类型约束事件存储结构，限定为预定义的事件名称
    private listeners: Record<EvenNames, Set<Function>>;

    constructor() {
        this.listeners = {} as Record<EvenNames, Set<Function>>;
        for (const event of eventNames) {
            this.listeners[event] = new Set();
        }
    }
    
    // 事件订阅方法（存在类型问题）
    on(eventName: EvenNames, listener: Function) {
        this.listeners[eventName].add(listener)
    }
    
    // 事件触发方法
    emit(eventName: EvenNames, ...args: any[]) {
        if (this.listeners[eventName]) {
            this.listeners[eventName].forEach((listener) => {
                listener(...args) // 执行回调
            })
        }
    }
}
export const emitter = new EventEmitter();
