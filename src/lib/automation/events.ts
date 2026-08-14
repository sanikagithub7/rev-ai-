/**
 * Extensible Internal Event Architecture
 */

export type SystemEventType =
  | "LEAD_CREATED"
  | "LEAD_UPDATED"
  | "MESSAGE_RECEIVED"
  | "LEAD_BECAME_HOT"
  | "FOLLOWUP_DUE"
  | "MEETING_BOOKED";

export interface SystemEvent<T = Record<string, unknown>> {
  id: string;
  eventType: SystemEventType;
  organizationId: string;
  payload: T;
  timestamp: string;
}

export interface EventHandler {
  (event: SystemEvent): Promise<void>;
}

class EventBus {
  private handlers: Map<SystemEventType, EventHandler[]> = new Map();

  subscribe(eventType: SystemEventType, handler: EventHandler): void {
    const existing = this.handlers.get(eventType) || [];
    this.handlers.set(eventType, [...existing, handler]);
  }

  async dispatch(event: SystemEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];
    await Promise.all(handlers.map((fn) => fn(event)));
  }
}

export const globalEventBus = new EventBus();
