export type Section = 'user_en' | 'vi' | 'en';
export interface Piece { section: Section; text: string }

const OPEN = /^<(user_en|vi|en)>/;
const OPENERS = ['<user_en>', '<vi>', '<en>'];
const partialOpener = (s: string) => OPENERS.some((o) => o.startsWith(s));
/** Độ dài hậu tố dài nhất của `s` là tiền tố của `closing` (để không cắt giữa thẻ đóng). */
function holdBack(s: string, closing: string): number {
  for (let n = Math.min(closing.length - 1, s.length); n > 0; n--) if (closing.startsWith(s.slice(s.length - n))) return n;
  return 0;
}

/**
 * Tách luồng văn bản của LLM theo định dạng `<user_en>…</user_en><vi>…</vi><en>…</en>`, chịu được thẻ bị cắt giữa chunk.
 * Model nhỏ hay lệch định dạng: nếu không có thẻ nào, toàn bộ văn bản được coi là câu trả lời tiếng Việt; chữ nằm ngoài thẻ bị bỏ.
 */
export class ReplyParser {
  private buf = ''; private section: Section | null = null; private sawTag = false; private plain = false; private fresh = false;

  private emit(out: Piece[], section: Section, text: string) {
    if (this.fresh) { text = text.trimStart(); if (text) this.fresh = false; }
    if (text) out.push({ section, text });
  }

  push(chunk: string): Piece[] {
    const out: Piece[] = [];
    this.buf += chunk;
    for (;;) {
      if (this.plain) { this.emit(out, 'vi', this.buf); this.buf = ''; return out; }
      if (this.section === null) {
        const t = this.buf.trimStart();
        if (!t) return out;
        const m = t.match(OPEN);
        if (m) { this.section = m[1] as Section; this.sawTag = true; this.fresh = true; this.buf = t.slice(m[0].length); continue; }
        if (t[0] === '<' && partialOpener(t)) { this.buf = t; return out; }      // chờ thêm để biết có phải thẻ
        if (this.sawTag) { const i = t.indexOf('<', 1); if (i < 0) { this.buf = ''; return out; } this.buf = t.slice(i); continue; } // chữ ngoài thẻ: bỏ
        this.plain = true; this.fresh = true; this.buf = t; continue;                // không có thẻ: coi là tiếng Việt
      }
      const closing = `</${this.section}>`;
      const i = this.buf.indexOf(closing);
      if (i >= 0) { this.emit(out, this.section, this.buf.slice(0, i)); this.buf = this.buf.slice(i + closing.length); this.section = null; continue; }
      const keep = holdBack(this.buf, closing);
      this.emit(out, this.section, this.buf.slice(0, this.buf.length - keep)); this.buf = this.buf.slice(this.buf.length - keep);
      return out;
    }
  }
  /** Gọi khi luồng kết thúc: xả phần còn lại (thẻ đóng bị thiếu vẫn lấy được nội dung). */
  end(): Piece[] {
    const out: Piece[] = [];
    if (this.section) this.emit(out, this.section, this.buf);
    else if (this.plain) this.emit(out, 'vi', this.buf);
    this.buf = ''; return out;
  }
}
