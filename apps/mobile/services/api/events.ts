import { apiClient } from './client';

export interface EventListItem {
  slug: string;
  title: string;
  url: string;
  dateLabel: string;
  excerpt: string;
  thumbnailUrl: string;
}

export interface ListEventsResponse {
  items: EventListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EventDetail {
  slug: string;
  title: string;
  publishedAtLabel: string;
  contentHtml: string;
}

export const EVENTS_PAGE_SIZE = 12;

const MOCK_THUMBNAIL =
  'https://www.uit.edu.vn/sites/vi/files/banner_uit_1.png';

const MOCK_EVENTS_SEED: EventListItem[] = [
  {
    slug: 'hoi-nghi-ra-soat-danh-gia-5-nam-cong-tac-khao-sat',
    title:
      'Hội nghị rà soát, đánh giá 5 năm công tác khảo sát tại UIT: khẳng định tinh thần cải tiến liên tục',
    url: 'https://www.uit.edu.vn/bai-viet/hoi-nghi-ra-soat-danh-gia-5-nam-cong-tac-khao-sat',
    dateLabel: '17-04-2026',
    excerpt:
      'Sáng ngày 17/4/2026, Hội nghị rà soát, đánh giá 5 năm công tác khảo sát giai đoạn 2021 - 2025 đã được tổ chức trong không khí nghiêm túc, cởi mở và đầy tinh thần xây dựng.',
    thumbnailUrl: MOCK_THUMBNAIL,
  },
  {
    slug: 'uitseminar-worldquant-x-uit-xu-huong-viec-lam-trong-linh-vuc-cntt',
    title: '#UITSEMINAR - WORLDQUANT X UIT - Xu hướng việc làm trong lĩnh vực CNTT',
    url: 'https://www.uit.edu.vn/bai-viet/uitseminar-worldquant-x-uit-xu-huong-viec-lam-trong-linh-vuc-cntt',
    dateLabel: '17-04-2026',
    excerpt:
      'Bạn quan tâm đến xu hướng việc làm trong lĩnh vực CNTT hiện nay? Career Orientation Seminar 2026 mang đến góc nhìn thực tế từ các diễn giả nhiều kinh nghiệm.',
    thumbnailUrl: MOCK_THUMBNAIL,
  },
  {
    slug: 'ngay-hoi-sinh-vien-uit-2026',
    title: 'Ngày hội sinh viên UIT 2026: kết nối học thuật, công nghệ và cộng đồng',
    url: 'https://www.uit.edu.vn/bai-viet/ngay-hoi-sinh-vien-uit-2026',
    dateLabel: '15-04-2026',
    excerpt:
      'Chương trình quy tụ nhiều câu lạc bộ, hoạt động trải nghiệm và các gian hàng công nghệ, tạo không gian giao lưu năng động cho sinh viên UIT.',
    thumbnailUrl: MOCK_THUMBNAIL,
  },
  {
    slug: 'workshop-ai-trong-giao-duc-dai-hoc',
    title: 'Workshop AI trong giáo dục đại học và định hướng ứng dụng tại UIT',
    url: 'https://www.uit.edu.vn/bai-viet/workshop-ai-trong-giao-duc-dai-hoc',
    dateLabel: '12-04-2026',
    excerpt:
      'Các chuyên gia chia sẻ về cách AI hỗ trợ học tập, nghiên cứu, quản trị đào tạo và những lưu ý khi triển khai trong môi trường đại học.',
    thumbnailUrl: MOCK_THUMBNAIL,
  },
  {
    slug: 'uit-open-day-2026',
    title: 'UIT Open Day 2026: trải nghiệm môi trường học tập công nghệ thông tin',
    url: 'https://www.uit.edu.vn/bai-viet/uit-open-day-2026',
    dateLabel: '09-04-2026',
    excerpt:
      'Học sinh tham quan khuôn viên, tìm hiểu ngành học, gặp gỡ giảng viên và sinh viên để có thêm thông tin trước mùa tuyển sinh.',
    thumbnailUrl: MOCK_THUMBNAIL,
  },
  {
    slug: 'clb-hoc-thuat-uit-tuyen-thanh-vien',
    title: 'Các câu lạc bộ học thuật UIT tuyển thành viên cho học kỳ mới',
    url: 'https://www.uit.edu.vn/bai-viet/clb-hoc-thuat-uit-tuyen-thanh-vien',
    dateLabel: '05-04-2026',
    excerpt:
      'Sinh viên có thể đăng ký tham gia các nhóm học thuật, nghiên cứu và hoạt động cộng đồng để phát triển kỹ năng chuyên môn lẫn kỹ năng mềm.',
    thumbnailUrl: MOCK_THUMBNAIL,
  },
  {
    slug: 'cuoc-thi-lap-trinh-sinh-vien-uit',
    title: 'Cuộc thi lập trình sinh viên UIT: sân chơi thuật toán và sản phẩm sáng tạo',
    url: 'https://www.uit.edu.vn/bai-viet/cuoc-thi-lap-trinh-sinh-vien-uit',
    dateLabel: '02-04-2026',
    excerpt:
      'Cuộc thi khuyến khích sinh viên rèn luyện tư duy giải quyết vấn đề, làm việc nhóm và xây dựng sản phẩm có giá trị thực tiễn.',
    thumbnailUrl: MOCK_THUMBNAIL,
  },
  {
    slug: 'talkshow-an-toan-thong-tin-trong-ky-nguyen-so',
    title: 'Talkshow an toàn thông tin trong kỷ nguyên số',
    url: 'https://www.uit.edu.vn/bai-viet/talkshow-an-toan-thong-tin-trong-ky-nguyen-so',
    dateLabel: '30-03-2026',
    excerpt:
      'Diễn giả trao đổi về bảo mật dữ liệu cá nhân, an toàn hệ thống và định hướng nghề nghiệp trong lĩnh vực an toàn thông tin.',
    thumbnailUrl: MOCK_THUMBNAIL,
  },
  {
    slug: 'ket-noi-doanh-nghiep-va-sinh-vien-uit',
    title: 'Kết nối doanh nghiệp và sinh viên UIT qua chuỗi hoạt động hướng nghiệp',
    url: 'https://www.uit.edu.vn/bai-viet/ket-noi-doanh-nghiep-va-sinh-vien-uit',
    dateLabel: '28-03-2026',
    excerpt:
      'Chuỗi hoạt động giúp sinh viên hiểu nhu cầu tuyển dụng, chuẩn bị hồ sơ, luyện phỏng vấn và định hướng lộ trình phát triển nghề nghiệp.',
    thumbnailUrl: MOCK_THUMBNAIL,
  },
  {
    slug: 'chuong-trinh-tinh-nguyen-cong-nghe-vi-cong-dong',
    title: 'Chương trình tình nguyện công nghệ vì cộng đồng',
    url: 'https://www.uit.edu.vn/bai-viet/chuong-trinh-tinh-nguyen-cong-nghe-vi-cong-dong',
    dateLabel: '25-03-2026',
    excerpt:
      'Sinh viên UIT tham gia xây dựng giải pháp số, hỗ trợ chuyển đổi số và tổ chức các hoạt động phục vụ cộng đồng địa phương.',
    thumbnailUrl: MOCK_THUMBNAIL,
  },
  {
    slug: 'seminar-nghien-cuu-khoa-hoc-sinh-vien',
    title: 'Seminar nghiên cứu khoa học sinh viên: từ ý tưởng đến công bố',
    url: 'https://www.uit.edu.vn/bai-viet/seminar-nghien-cuu-khoa-hoc-sinh-vien',
    dateLabel: '22-03-2026',
    excerpt:
      'Buổi seminar chia sẻ quy trình hình thành đề tài, phương pháp nghiên cứu, viết báo cáo và trình bày kết quả khoa học.',
    thumbnailUrl: MOCK_THUMBNAIL,
  },
  {
    slug: 'uit-career-fair-2026',
    title: 'UIT Career Fair 2026: cơ hội thực tập và việc làm cho sinh viên công nghệ',
    url: 'https://www.uit.edu.vn/bai-viet/uit-career-fair-2026',
    dateLabel: '20-03-2026',
    excerpt:
      'Ngày hội việc làm kết nối sinh viên với các doanh nghiệp công nghệ, mang đến cơ hội thực tập, tuyển dụng và tư vấn nghề nghiệp.',
    thumbnailUrl: MOCK_THUMBNAIL,
  },
  {
    slug: 'le-trao-hoc-bong-khuyen-khich-hoc-tap-uit',
    title: 'Lễ trao học bổng khuyến khích học tập UIT',
    url: 'https://www.uit.edu.vn/bai-viet/le-trao-hoc-bong-khuyen-khich-hoc-tap-uit',
    dateLabel: '18-03-2026',
    excerpt:
      'Nhà trường vinh danh sinh viên có thành tích học tập, nghiên cứu và hoạt động phong trào nổi bật trong năm học.',
    thumbnailUrl: MOCK_THUMBNAIL,
  },
];

const MOCK_EXTRA_EVENTS = 48;

const generatedMockEvents: EventListItem[] = Array.from({ length: MOCK_EXTRA_EVENTS }, (_, i) => {
  const n = i + 1;
  const slug = `mock-uit-hoat-dong-${n}`;
  return {
    slug,
    title: `Hoạt động sinh viên UIT (dữ liệu mẫu ${n})`,
    url: `https://www.uit.edu.vn/bai-viet/${slug}`,
    dateLabel: '01-04-2026',
    excerpt: `Bản tin mẫu số ${n} để kiểm thử phân trang danh sách sự kiện và cộng đồng trên mobile.`,
    thumbnailUrl: MOCK_THUMBNAIL,
  };
});

/** Full mock list for offline / EXPO_PUBLIC_USE_MOCK_EVENTS */
const mockEvents: EventListItem[] = [...MOCK_EVENTS_SEED, ...generatedMockEvents];

const mockDetails: Record<string, EventDetail> = Object.fromEntries(
  mockEvents.map((event) => [
    event.slug,
    {
      slug: event.slug,
      title: event.title,
      publishedAtLabel: event.dateLabel,
      contentHtml: `
        <p>${event.excerpt}</p>
        <p>Đây là dữ liệu mẫu dùng để dựng giao diện mobile khi API thật chưa sẵn sàng hoặc thiết bị không kết nối được backend.</p>
        <p>Nội dung chi tiết mô phỏng cấu trúc bài viết UIT với đoạn văn, chữ <strong>nhấn mạnh</strong>, liên kết và hình ảnh trong bài.</p>
        <p><a href="${event.url}">Xem bài viết gốc trên UIT</a></p>
        <img src="${event.thumbnailUrl}" alt="${event.title}" />
        <h2>Nội dung chính</h2>
        <ul>
          <li>Cập nhật thông tin sự kiện và hoạt động cộng đồng.</li>
          <li>Hiển thị đúng kích thước mobile, không tràn ngang.</li>
          <li>Hỗ trợ kiểm thử luồng danh sách và chi tiết bài viết.</li>
        </ul>
      `,
    },
  ]),
);

function shouldUseMockEvents() {
  return process.env.EXPO_PUBLIC_USE_MOCK_EVENTS === '1';
}

async function getMockList({
  page: pageInput,
  limit,
}: {
  page?: number;
  limit: number;
}): Promise<ListEventsResponse> {
  const total = mockEvents.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pageRaw = pageInput ?? 1;
  const page = Math.min(Math.max(1, pageRaw), totalPages);
  const offset = (page - 1) * limit;
  const items = mockEvents.slice(offset, offset + limit);

  return {
    items,
    total,
    page,
    limit,
    totalPages,
  };
}

async function getMockDetail(slug: string): Promise<EventDetail> {
  return mockDetails[slug] ?? mockDetails[mockEvents[0].slug];
}

export const eventsApi = {
  list: async ({
    page = 1,
    limit = EVENTS_PAGE_SIZE,
  }: {
    page?: number;
    limit?: number;
  } = {}): Promise<ListEventsResponse> => {
    if (shouldUseMockEvents()) {
      return getMockList({ page, limit });
    }

    try {
      return (await apiClient.get('/events', {
        params: {
          page,
          limit,
        },
      })) as ListEventsResponse;
    } catch {
      return getMockList({ page, limit });
    }
  },

  detail: async (slug: string): Promise<EventDetail> => {
    if (shouldUseMockEvents()) {
      return getMockDetail(slug);
    }

    try {
      return (await apiClient.get(`/events/${encodeURIComponent(slug)}`)) as EventDetail;
    } catch {
      return getMockDetail(slug);
    }
  },
};
