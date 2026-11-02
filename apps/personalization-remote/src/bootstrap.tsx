// Chạy độc lập (standalone) khi dev: Remote có bootstrap riêng (API Contract §2).
import { createRoot } from 'react-dom/client';
import PersonalizationApp from './PersonalizationApp';
createRoot(document.getElementById('root')!).render(<PersonalizationApp />);
