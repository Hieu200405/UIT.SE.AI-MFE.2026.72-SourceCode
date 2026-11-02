// NỘI DUNG MOCK cho demo (chưa kiểm chứng). Câu thoại/ghi chú văn hóa cần người am hiểu tiếng Việt rà soát
// trước khi đưa vào bản demo (Constitution #13). Mọi ghi chú văn hóa đều phát với verified=false (UI gắn "Sample").
export interface Note { title: string; explanation: string }
export interface ScriptReply { vi: string; en: string; note?: Note }
export interface ScenarioScript {
  opening: { vi: string; en: string };
  replies: ScriptReply[];                       // lượt n → replies[min(n, len-1)]
  hints: Array<{ text: string; translation: string }>; // đúng 2 gợi ý
}

export const SCRIPTS: Record<string, ScenarioScript> = {
  renting: {
    opening: { vi: 'Chào cháu, cháu muốn hỏi gì về căn phòng?', en: 'Hello, what would you like to ask about the room?' },
    replies: [
      { vi: 'Điện ba nghìn rưỡi một số. Cháu đặt cọc một tháng nhé?', en: 'Electricity is 3,500 VND per unit. Could you pay one month\u2019s deposit?',
        note: { title: 'Handing over money', explanation: 'Pass cash with both hands, or your right hand supported by the left. It shows respect, especially when the other person is older.' } },
      { vi: 'Cảm ơn cháu. Bác viết giấy nhận tiền cho cháu.', en: 'Thank you. I\u2019ll write you a receipt for the money.' },
      { vi: 'Cháu còn muốn hỏi gì nữa không?', en: 'Is there anything else you\u2019d like to ask?' },
    ],
    hints: [{ text: 'Dạ, cảm ơn bác ạ.', translation: 'Thank you.' }, { text: 'Bác cho cháu xin giấy biên nhận ạ.', translation: 'Could I have a receipt, please?' }],
  },
  doctor: {
    opening: { vi: 'Chào bạn, bạn thấy không khỏe ở đâu?', en: 'Hello, where do you feel unwell?' },
    replies: [
      { vi: 'Bạn bị đau từ bao lâu rồi?', en: 'How long have you been in pain?' },
      { vi: 'Tôi sẽ kê thuốc cho bạn. Bạn uống sau bữa ăn nhé.', en: 'I\u2019ll prescribe medicine. Take it after meals.' },
      { vi: 'Bạn còn thắc mắc gì không?', en: 'Do you have any other questions?' },
    ],
    hints: [{ text: 'Bác sĩ ơi, tôi bị đau đầu.', translation: 'Doctor, I have a headache.' }, { text: 'Tôi bị từ hai ngày nay.', translation: 'For two days now.' }],
  },
  visa: {
    opening: { vi: 'Chào bạn, bạn cần làm thủ tục gì?', en: 'Hello, what procedure do you need?' },
    replies: [
      { vi: 'Bạn cho tôi xem hộ chiếu nhé.', en: 'Please show me your passport.' },
      { vi: 'Bạn nộp thêm hai ảnh và đơn đăng ký. Một tuần sau quay lại nhận kết quả.', en: 'Submit two photos and the form. Come back in a week for the result.' },
      { vi: 'Bạn còn cần hỏi gì nữa không?', en: 'Do you need to ask anything else?' },
    ],
    hints: [{ text: 'Anh ơi, em xin gửi hộ chiếu ạ.', translation: 'Here is my passport.' }, { text: 'Anh ơi, cần nộp thêm giấy tờ gì ạ?', translation: 'What other documents do I need?' }],
  },
  banking: {
    opening: { vi: 'Chào bạn, mình có thể giúp gì cho bạn?', en: 'Hello, how can I help you?' },
    replies: [
      { vi: 'Bạn cho mình xem hộ chiếu để mở tài khoản nhé.', en: 'Please show your passport to open an account.' },
      { vi: 'Phí duy trì tài khoản là mười nghìn đồng một tháng.', en: 'The monthly account fee is 10,000 VND.' },
      { vi: 'Bạn cần mình hỗ trợ thêm gì không?', en: 'Do you need any other help?' },
    ],
    hints: [{ text: 'Mình muốn mở tài khoản.', translation: 'I\u2019d like to open an account.' }, { text: 'Phí mỗi tháng là bao nhiêu?', translation: 'What are the monthly fees?' }],
  },
  market: {
    opening: { vi: 'Chào cháu, cháu mua gì nào?', en: 'Hello, what are you buying?' },
    replies: [
      { vi: 'Cân này năm mươi nghìn một ký.', en: 'These are 50,000 VND per kilo.' },
      { vi: 'Thôi, bớt cho cháu còn bốn mươi lăm nghìn nhé.', en: 'Okay, I\u2019ll lower it to 45,000 for you.' },
      { vi: 'Cháu lấy thêm gì nữa không?', en: 'Anything else you\u2019d like?' },
    ],
    hints: [{ text: 'Cô ơi, bao nhiêu một ký ạ?', translation: 'How much per kilo, ma\u2019am?' }, { text: 'Cô bớt cho cháu được không ạ?', translation: 'Could you lower the price a bit?' }],
  },
  neighbors: {
    opening: { vi: 'Chào cháu, cháu mới chuyển đến đây à?', en: 'Hello, did you just move in?' },
    replies: [
      { vi: 'Cháu ở tầng mấy? Có gì cần giúp thì cứ hỏi cô nhé.', en: 'Which floor are you on? Ask me if you need any help.' },
      { vi: 'Cháu ăn cơm chưa? Qua nhà cô ăn cơm nhé.', en: 'Have you eaten yet? Come over for a meal.',
        note: { title: 'Polite invitations', explanation: '\u201CHave you eaten yet?\u201D is often a friendly greeting rather than a firm invitation. If you can\u2019t join, decline warmly and thank them.' } },
      { vi: 'Cháu cứ tự nhiên nhé.', en: 'Please make yourself at home.' },
    ],
    hints: [{ text: 'Dạ, cháu chào cô ạ. Cháu mới chuyển đến.', translation: 'Hello. I just moved in.' }, { text: 'Cháu ở tầng ba ạ.', translation: 'I\u2019m on the third floor.' }],
  },
  weddings: {
    opening: { vi: 'Chào cháu, cảm ơn cháu đã đến dự.', en: 'Hello, thank you for coming.' },
    replies: [
      { vi: 'Cháu ngồi đây ăn với gia đình chú nhé.', en: 'Please sit here and eat with our family.',
        note: { title: 'Wedding gifts', explanation: 'Guests often give money in a card or envelope rather than a wrapped present.' } },
      { vi: 'Cháu ăn thêm đi, đừng ngại!', en: 'Have some more, don\u2019t be shy!' },
      { vi: 'Hôm nay vui quá, cảm ơn cháu.', en: 'It\u2019s a happy day, thank you.' },
    ],
    hints: [{ text: 'Dạ, cháu chúc mừng gia đình chú ạ.', translation: 'Congratulations to your family.' }, { text: 'Dạ, cháu cảm ơn chú ạ.', translation: 'Thank you.' }],
  },
  street_food: {
    opening: { vi: 'Chào bạn, bạn ăn gì nào?', en: 'Hello, what would you like to eat?' },
    replies: [
      { vi: 'Bạn muốn cay hay không cay?', en: 'Spicy or not spicy?' },
      { vi: 'Của bạn hết ba mươi lăm nghìn.', en: 'That\u2019s 35,000 VND.' },
      { vi: 'Cảm ơn bạn, hẹn gặp lại!', en: 'Thank you, see you again!' },
    ],
    hints: [{ text: 'Cho mình một tô phở, không cay ạ.', translation: 'One bowl of pho, not spicy, please.' }, { text: 'Tính tiền giúp mình ạ.', translation: 'Check, please.' }],
  },
};

// Từ điển dịch tin của NGƯỜI HỌC (mock). LLM thật sẽ dịch bất kỳ câu nào; mock chỉ biết các câu dưới đây.
const norm = (t: string) => t.toLowerCase().replace(/[?.!…\s]+$/u, '').replace(/\s+/g, ' ').trim();
const EXTRA: Record<string, string> = {
  'Bạn ơi, tiền điện bao nhiêu?': 'Hey, how much is the electricity?',
  'Bác ơi, tiền điện bao nhiêu ạ?': 'Excuse me, how much is the electricity?',
  'Bạn ơi, cọc bao nhiêu?': 'Hey, how much is the deposit?',
  'Dạ, cháu gửi bác ạ.': 'Yes, here you go.',
};
const DICT = new Map<string, string>([
  ...Object.entries(EXTRA).map(([k, v]) => [norm(k), v] as [string, string]),
  ...Object.values(SCRIPTS).flatMap((s) => s.hints.map((h) => [norm(h.text), h.translation] as [string, string])),
]);
export const translateLearnerMessage = (text: string): string | null => DICT.get(norm(text)) ?? null;

// ---- Ghi chú văn hóa CÓ KIỂM SOÁT (Constitution #6, #13): LLM KHÔNG tự sinh ghi chú; chỉ chọn từ danh sách nhóm soạn, theo từ khóa.
export interface CulturalNoteDef { id: string; scenarios: string[]; trigger: RegExp; note: Note }
export const CULTURAL_NOTES: CulturalNoteDef[] = [
  { id: 'money', scenarios: ['renting', 'market', 'street_food', 'banking'], trigger: /cọc|tiền|nghìn|đồng|trả|thanh toán/i,
    note: { title: 'Handing over money', explanation: 'Pass cash with both hands, or your right hand supported by the left. It shows respect, especially when the other person is older.' } },
  { id: 'invitation', scenarios: ['neighbors'], trigger: /ăn cơm|mời|qua nhà/i,
    note: { title: 'Polite invitations', explanation: '\u201CHave you eaten yet?\u201D is often a friendly greeting rather than a firm invitation. If you can\u2019t join, decline warmly and thank them.' } },
  { id: 'wedding-gift', scenarios: ['weddings'], trigger: /mừng|quà|phong bì|chúc/i,
    note: { title: 'Wedding gifts', explanation: 'Guests often give money in a card or envelope rather than a wrapped present.' } },
];
/** Chọn tối đa 1 ghi chú chưa hiển thị trong buổi này, theo tình huống + từ khóa trong lời người học và câu trả lời. */
export function pickCulturalNote(scenarioId: string, texts: string[], shown: Set<string>): CulturalNoteDef | null {
  const hay = texts.join(' ');
  return CULTURAL_NOTES.find((n) => n.scenarios.includes(scenarioId) && !shown.has(n.id) && n.trigger.test(hay)) ?? null;
}
