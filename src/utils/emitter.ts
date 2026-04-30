const eventNames = ['UPDATE_HOMEWORKS'] as const;
type EventName = (typeof eventNames)[number];
type Listener = (...args: unknown[]) => void;

class EventEmitter {
    private listeners: Record<EventName, Set<Listener>>;

    constructor() {
        this.listeners = {} as Record<EventName, Set<Listener>>;
        for (const event of eventNames) {
            this.listeners[event] = new Set();
        }
    }

    on(eventName: EventName, listener: Listener) {
        this.listeners[eventName].add(listener)
    }

    emit(eventName: EventName, ...args: unknown[]) {
        if (this.listeners[eventName]) {
            this.listeners[eventName].forEach((listener) => {
                listener(...args)
            })
        }
    }
}
export const emitter = new EventEmitter();
