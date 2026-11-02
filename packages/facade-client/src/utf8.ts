/**
 * Giải mã UTF-8 theo luồng, không dùng TextDecoder (trên React Native `TextDecoder` không đúng chuẩn, đặc biệt `{stream:true}`).
 * Tiếng Việt là UTF-8 nhiều byte: một chunk mạng có thể cắt giữa ký tự → phần dở dang được giữ lại cho chunk sau.
 * Byte sai bị thay bằng U+FFFD (giống TextDecoder).
 */
export class Utf8StreamDecoder {
  private pending: number[] = [];

  decode(chunk: Uint8Array): string {
    const bytes = this.pending.length ? [...this.pending, ...chunk] : Array.from(chunk);
    // tìm điểm cắt: nếu ≤ 3 byte cuối là phần đầu của một chuỗi chưa đủ thì giữ lại
    let end = bytes.length;
    for (let back = 1; back <= Math.min(3, bytes.length); back++) {
      const b = bytes[bytes.length - back];
      if ((b & 0xc0) === 0x80) continue;               // byte tiếp nối: nhìn lùi tiếp
      const need = b >= 0xf0 && b <= 0xf4 ? 4 : b >= 0xe0 ? 3 : b >= 0xc2 && b < 0xe0 ? 2 : 1;
      if (need > back) end = bytes.length - back;       // lead byte chưa đủ byte tiếp nối
      break;
    }
    this.pending = bytes.slice(end);
    return decodeComplete(bytes, end);
  }

  /** Kết thúc luồng: phần dở dang còn lại trở thành ký tự thay thế. */
  flush(): string { const n = this.pending.length; this.pending = []; return '\ufffd'.repeat(n ? 1 : 0); }
}

function decodeComplete(b: number[], end: number): string {
  let out = ''; let i = 0;
  const cont = (k: number) => k < end && (b[k] & 0xc0) === 0x80;
  while (i < end) {
    const c = b[i];
    if (c < 0x80) { out += String.fromCharCode(c); i += 1; }
    else if (c >= 0xc2 && c < 0xe0 && cont(i + 1)) { out += String.fromCharCode(((c & 0x1f) << 6) | (b[i + 1] & 0x3f)); i += 2; }
    else if (c >= 0xe0 && c < 0xf0 && cont(i + 1) && cont(i + 2)) {
      const cp = ((c & 0x0f) << 12) | ((b[i + 1] & 0x3f) << 6) | (b[i + 2] & 0x3f);
      if (cp >= 0x800 && !(cp >= 0xd800 && cp <= 0xdfff)) { out += String.fromCharCode(cp); i += 3; } else { out += '\ufffd'; i += 1; }
    } else if (c >= 0xf0 && c <= 0xf4 && cont(i + 1) && cont(i + 2) && cont(i + 3)) {
      const cp = ((c & 0x07) << 18) | ((b[i + 1] & 0x3f) << 12) | ((b[i + 2] & 0x3f) << 6) | (b[i + 3] & 0x3f);
      if (cp >= 0x10000 && cp <= 0x10ffff) { out += String.fromCodePoint(cp); i += 4; } else { out += '\ufffd'; i += 1; }
    } else { out += '\ufffd'; i += 1; }
  }
  return out;
}
