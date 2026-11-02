import { parseBusEvent } from '@app/shared-types';
import type { BusEvent, BusEventType } from '@app/shared-types';

type Handler<T extends BusEventType> = (event: Extract<BusEvent, { type: T }>) => void;
type AnyHandler = (event: BusEvent) => void;

/**
 * Pub/Sub tối giản. PHẢI là singleton qua Module Federation (Architecture §2):
 * mỗi Remote nạp một bản riêng thì publish/subscribe không gặp nhau.
 * Event chỉ là tín hiệu; dữ liệu chuẩn luôn lấy lại từ Facade (Constitution #5).
 */
export class EventBus {
  private handlers = new Map<string, Set<AnyHandler>>();

  subscribe<T extends BusEventType>(type: T, handler: Handler<T>): () => void {
    const set = this.handlers.get(type) ?? new Set<AnyHandler>();
    set.add(handler as AnyHandler);
    this.handlers.set(type, set);
    return () => { set.delete(handler as AnyHandler); }; // gọi khi unmount
  }

  /** Trả về true nếu event hợp lệ và đã phát. Payload sai schema bị bỏ + log, không throw. */
  publish(event: unknown): boolean {
    const e = parseBusEvent(event);
    if (!e) { console.warn('[event-bus] bỏ qua event sai schema', event); return false; }
    for (const h of [...(this.handlers.get(e.type) ?? [])]) {
      try { h(e); } catch (err) { console.error('[event-bus] handler lỗi (không ảnh hưởng handler khác)', err); }
    }
    return true;
  }
}

export const eventBus = new EventBus();
