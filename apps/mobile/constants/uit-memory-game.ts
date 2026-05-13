import GAME_IMAGE_1_PAST from '../../../assets/game_images/1_a.jpg';
import GAME_IMAGE_1_CURRENT from '../../../assets/game_images/1_b.jpg';
import GAME_IMAGE_2_PAST from '../../../assets/game_images/2_a.jpg';
import GAME_IMAGE_2_CURRENT from '../../../assets/game_images/2_b.jpg';
import GAME_IMAGE_3_PAST from '../../../assets/game_images/3_a.jpg';
import GAME_IMAGE_3_CURRENT from '../../../assets/game_images/3_b.jpg';
import GAME_IMAGE_4_PAST from '../../../assets/game_images/4_a.jpg';
import GAME_IMAGE_4_CURRENT from '../../../assets/game_images/4_b.jpg';

export interface UitMemoryGamePair {
  id: number;
  title: string;
  prompt: string;
  pastImage: number;
  currentImage: number;
}

export const UIT_MEMORY_GAME_PAIRS: UitMemoryGamePair[] = [
  {
    id: 1,
    title: 'Khối giảng đường trung tâm',
    prompt: 'Ghép đúng khối giảng đường trung tâm qua hai giai đoạn.',
    pastImage: GAME_IMAGE_1_PAST,
    currentImage: GAME_IMAGE_1_CURRENT,
  },
  {
    id: 2,
    title: 'Hành lang học tập',
    prompt: 'Tìm góc nhìn hiện tại khớp với hành lang học tập năm xưa.',
    pastImage: GAME_IMAGE_2_PAST,
    currentImage: GAME_IMAGE_2_CURRENT,
  },
  {
    id: 3,
    title: 'Tuyến đường vào campus',
    prompt: 'Chọn ảnh hiện tại khớp với tuyến đường vào campus ngày trước.',
    pastImage: GAME_IMAGE_3_PAST,
    currentImage: GAME_IMAGE_3_CURRENT,
  },
  {
    id: 4,
    title: 'Lối đi bên giảng đường',
    prompt: 'Ghép lại lối đi bên giảng đường từ quá khứ đến hiện tại.',
    pastImage: GAME_IMAGE_4_PAST,
    currentImage: GAME_IMAGE_4_CURRENT,
  },
];

export function getUitMemoryRoundOptions() {
  return [...UIT_MEMORY_GAME_PAIRS];
}
