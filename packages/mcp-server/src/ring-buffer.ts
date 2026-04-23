export class RingBuffer<T> {
  private readonly items: T[] = [];
  constructor(private readonly capacity: number) {
    if (capacity <= 0) throw new Error("capacity must be positive");
  }
  push(item: T): void {
    this.items.push(item);
    if (this.items.length > this.capacity) this.items.shift();
  }
  toArray(): readonly T[] {
    return this.items.slice();
  }
  sliceAfter(pred: (t: T) => boolean): readonly T[] {
    const idx = this.items.findIndex(pred);
    if (idx < 0) return [];
    return this.items.slice(idx + 1);
  }
  get length(): number {
    return this.items.length;
  }
  last(): T | undefined {
    return this.items[this.items.length - 1];
  }
}
