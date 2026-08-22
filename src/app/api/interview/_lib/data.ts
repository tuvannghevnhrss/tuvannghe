export type InterviewRole = {
  id: number;
  name: string;
};

export type InterviewDifficultyLevel = {
  id: number;
  name: string;
};

export type InterviewExperienceLevel = {
  id: number;
  name: string;
};

export type InterviewQuestion = {
  id: number;
  content: string;
  category: string;
  role_id: number;
  difficulty_level_id: number;
  experience_level_id: number;
  generated?: boolean;
  interview_roles?: { name: string } | null;
  interview_difficulty_levels?: { name: string } | null;
  interview_experience_levels?: { name: string } | null;
};

export type InterviewPersonalization = {
  jobTitle?: string;
  jobDescription?: string;
  candidateSummary?: string;
  cvFileName?: string;
};

const vietnameseLabelMap: Record<string, string> = {
  // ASCII-normalized Vietnamese (from old DB seeds)
  "Nhan su": "Nhân sự",
  "Ke toan": "Kế toán",
  "Kinh doanh / Ban hang": "Kinh doanh / Bán hàng",
  "Cong nghe thong tin": "Công nghệ thông tin",
  "Cham soc khach hang": "Chăm sóc khách hàng",
  "Chăm soc khach hang": "Chăm sóc khách hàng",
  "Hanh chinh / Van phong": "Hành chính / Văn phòng",
  "Logistics / Chuoi cung ung": "Logistics / Chuỗi cung ứng",
  "Tai chinh / Dau tu": "Tài chính / Đầu tư",
  "Thiet ke / Sang tao": "Thiết kế / Sáng tạo",
  "Luat / Phap ly": "Luật / Pháp lý",
  "Nha hang / Khach san": "Nhà hàng / Khách sạn",
  "De": "Dễ",
  "Trung binh": "Trung bình",
  "Kho": "Khó",
  "Sinh vien / Thuc tap sinh": "Sinh viên / Thực tập sinh",
  "Moi tot nghiep": "Mới tốt nghiệp",
  "Nhan vien": "Nhân viên",
  "Truong nhom / Giam sat": "Trưởng nhóm / Giám sát",
  "Quan ly": "Quản lý",
  "Quan ly cap cao": "Quản lý cấp cao",
  "Dieu hanh cap cao": "Điều hành cấp cao",
  // English role names (from early DB seeds)
  "Frontend Developer": "Lập trình Frontend",
  "Backend Developer": "Lập trình Backend",
  "Fullstack Developer": "Lập trình Fullstack",
  // English difficulty names (safety net)
  "Easy": "Dễ",
  "Medium": "Trung bình",
  "Hard": "Khó",
};

export function normalizeVietnameseInterviewLabel(value?: string | null) {
  if (!value) return value ?? "";
  return vietnameseLabelMap[value] ?? value;
}

export const fallbackRoles: InterviewRole[] = [
  { id: 1, name: "Nhân sự" },
  { id: 2, name: "Kế toán" },
  { id: 3, name: "Kinh doanh / Bán hàng" },
  { id: 4, name: "Marketing" },
  { id: 5, name: "Công nghệ thông tin" },
  { id: 6, name: "Chăm sóc khách hàng" },
  { id: 7, name: "Hành chính / Văn phòng" },
  { id: 8, name: "Logistics / Chuỗi cung ứng" },
  { id: 9, name: "Tài chính / Đầu tư" },
  { id: 10, name: "Thiết kế / Sáng tạo" },
  { id: 11, name: "Luật / Pháp lý" },
  { id: 12, name: "Nhà hàng / Khách sạn" },
];

type RoleInterviewBlueprint = {
  roleId: number;
  roleName: string;
  domain: string;
  coreSkill: string;
  scenario: string;
  pressureScenario: string;
};

const roleInterviewBlueprints: RoleInterviewBlueprint[] = [
  {
    roleId: 1,
    roleName: "Nhân sự",
    domain: "tuyển dụng, đào tạo, chính sách nhân sự",
    coreSkill: "đánh giá ứng viên, phối hợp hiring manager và xử lý quan hệ lao động",
    scenario: "nhu cầu tuyển gấp nhưng ngân sách và tiêu chí chưa thống nhất",
    pressureScenario: "hiring manager yêu cầu tuyển nhanh dù JD chưa rõ và ứng viên phù hợp đang đòi mức lương cao",
  },
  {
    roleId: 2,
    roleName: "Kế toán",
    domain: "hạch toán, đối chiếu công nợ, báo cáo tài chính",
    coreSkill: "kiểm soát chứng từ, phát hiện sai lệch và tuân thủ quy định",
    scenario: "số liệu công nợ cuối tháng lệch với bộ phận kinh doanh",
    pressureScenario: "sếp yêu cầu khóa sổ ngay trong khi bạn phát hiện một khoản chi chưa đủ chứng từ",
  },
  {
    roleId: 3,
    roleName: "Kinh doanh / Bán hàng",
    domain: "tìm kiếm khách hàng, tư vấn giải pháp, chốt doanh số",
    coreSkill: "khai thác nhu cầu, xử lý từ chối và quản lý pipeline",
    scenario: "khách hàng quan tâm nhưng liên tục trì hoãn quyết định mua",
    pressureScenario: "bạn còn thiếu 30% chỉ tiêu tháng trong khi hai deal lớn vừa bị hoãn",
  },
  {
    roleId: 4,
    roleName: "Marketing",
    domain: "chiến dịch truyền thông, performance marketing, nội dung và thương hiệu",
    coreSkill: "đọc dữ liệu, tối ưu kênh và phối hợp sales/product",
    scenario: "chiến dịch có nhiều lượt xem nhưng tỉ lệ chuyển đổi thấp",
    pressureScenario: "ngân sách bị cắt 40% nhưng mục tiêu lead vẫn giữ nguyên",
  },
  {
    roleId: 5,
    roleName: "Công nghệ thông tin",
    domain: "phát triển phần mềm, vận hành hệ thống, xử lý sự cố",
    coreSkill: "phân tích nguyên nhân, thiết kế giải pháp và giao tiếp kỹ thuật",
    scenario: "một tính năng quan trọng lỗi trên production sau khi release",
    pressureScenario: "hệ thống đang downtime, khách hàng phàn nàn và bạn chưa xác định được root cause",
  },
  {
    roleId: 6,
    roleName: "Chăm sóc khách hàng",
    domain: "tiếp nhận phản hồi, xử lý khiếu nại, duy trì trải nghiệm khách hàng",
    coreSkill: "lắng nghe, làm dịu tình huống và theo dõi cam kết xử lý",
    scenario: "khách hàng bức xúc vì vấn đề lặp lại nhiều lần chưa được giải quyết",
    pressureScenario: "khách hàng đòi hủy dịch vụ công khai trên mạng xã hội trong khi nội bộ chưa thống nhất phương án",
  },
  {
    roleId: 7,
    roleName: "Hành chính / Văn phòng",
    domain: "vận hành văn phòng, quản lý hồ sơ, điều phối lịch và mua sắm nội bộ",
    coreSkill: "sắp xếp ưu tiên, quản lý nhà cung cấp và đảm bảo quy trình",
    scenario: "nhiều phòng ban cùng yêu cầu hỗ trợ gấp trong cùng một ngày",
    pressureScenario: "sự kiện nội bộ diễn ra trong 24 giờ tới nhưng nhà cung cấp chính báo không đáp ứng kịp",
  },
  {
    roleId: 8,
    roleName: "Logistics / Chuỗi cung ứng",
    domain: "kho vận, vận tải, tồn kho, mua hàng và chuỗi cung ứng",
    coreSkill: "tối ưu luồng hàng, quản trị rủi ro và phối hợp đa bên",
    scenario: "đơn hàng quan trọng có nguy cơ giao trễ vì thiếu hàng hoặc tắc vận chuyển",
    pressureScenario: "nhà cung cấp báo tăng giá và giao chậm ngay trước mùa cao điểm",
  },
  {
    roleId: 9,
    roleName: "Tài chính / Đầu tư",
    domain: "phân tích tài chính, ngân sách, dòng tiền và quyết định đầu tư",
    coreSkill: "đọc số liệu, đánh giá rủi ro và trình bày khuyến nghị",
    scenario: "một phương án đầu tư có lợi nhuận kỳ vọng cao nhưng rủi ro dòng tiền lớn",
    pressureScenario: "ban lãnh đạo muốn phê duyệt nhanh một khoản đầu tư dù dữ liệu còn thiếu",
  },
  {
    roleId: 10,
    roleName: "Thiết kế / Sáng tạo",
    domain: "thiết kế hình ảnh, trải nghiệm người dùng, sáng tạo nội dung",
    coreSkill: "khai thác brief, bảo vệ ý tưởng và tối ưu theo phản hồi",
    scenario: "brief từ khách hàng mơ hồ nhưng deadline rất gấp",
    pressureScenario: "khách hàng bác toàn bộ concept trước ngày bàn giao dù trước đó đã duyệt hướng thiết kế",
  },
  {
    roleId: 11,
    roleName: "Luật / Pháp lý",
    domain: "hợp đồng, tuân thủ, tư vấn pháp lý và quản trị rủi ro",
    coreSkill: "phân tích điều khoản, cảnh báo rủi ro và đưa phương án tuân thủ",
    scenario: "một điều khoản hợp đồng có lợi thương mại nhưng tiềm ẩn rủi ro pháp lý",
    pressureScenario: "đối tác gây sức ép ký nhanh trong khi bạn phát hiện điều khoản bất lợi cho công ty",
  },
  {
    roleId: 12,
    roleName: "Nhà hàng / Khách sạn",
    domain: "vận hành dịch vụ, trải nghiệm khách, ca kíp và tiêu chuẩn chất lượng",
    coreSkill: "xử lý tình huống, điều phối nhân sự và duy trì chất lượng dịch vụ",
    scenario: "khách VIP không hài lòng với trải nghiệm trong giờ cao điểm",
    pressureScenario: "thiếu nhân sự đột xuất trong ca đông khách và có khách phàn nàn trực tiếp tại quầy",
  },
];

function createQuestionForCombination(
  blueprint: RoleInterviewBlueprint,
  difficulty: InterviewDifficultyLevel,
  experience: InterviewExperienceLevel,
  variant: number
): { content: string; category: string } {
  const levelName = normalizeVietnameseInterviewLabel(experience.name);
  const isJunior = experience.id <= 2;   // Sinh viên / Mới tốt nghiệp
  const isMid    = experience.id === 3 || experience.id === 4; // Nhân viên / Trưởng nhóm
  const isSenior = experience.id >= 5;   // Quản lý trở lên

  // ─── DỄ (8 câu) ──────────────────────────────────────────────────────────
  if (difficulty.id === 1) {
    switch (variant) {
      case 0: return {
        content: `Hãy giới thiệu bản thân và chia sẻ lý do bạn chọn theo đuổi lĩnh vực ${blueprint.domain}.`,
        category: "behavioral",
      };
      case 1: return {
        content: `Điểm mạnh nổi trội của bạn khi làm việc trong lĩnh vực ${blueprint.domain} là gì? Hãy minh họa bằng một ví dụ cụ thể.`,
        category: "behavioral",
      };
      case 2: return {
        content: isJunior
          ? `Bạn đã chuẩn bị gì trong quá trình học tập để sẵn sàng bước vào vị trí ${blueprint.roleName}?`
          : isMid
          ? `Hãy kể về thành tích bạn tự hào nhất trong giai đoạn ${levelName} của mình.`
          : `Ở cấp ${levelName}, điều gì tiếp tục thúc đẩy bạn phát triển trong lĩnh vực ${blueprint.domain}?`,
        category: "behavioral",
      };
      case 3: return {
        content: isJunior
          ? `Hãy chia sẻ một trải nghiệm thực tập, dự án học thuật hoặc tự học liên quan đến ${blueprint.domain}.`
          : isMid
          ? `Bạn định hướng phát triển bản thân như thế nào ở giai đoạn ${levelName} trong lĩnh vực ${blueprint.domain}?`
          : `Bạn đã xây dựng và phát triển đội nhóm trong lĩnh vực ${blueprint.domain} như thế nào?`,
        category: "behavioral",
      };
      case 4: return {
        content: `Khi nhận một nhiệm vụ mới trong lĩnh vực ${blueprint.domain}, bạn làm gì để hiểu rõ yêu cầu và hoàn thành đúng kỳ vọng?`,
        category: "behavioral",
      };
      case 5: return {
        content: `Bạn đã từng bất đồng ý kiến với đồng nghiệp hoặc cấp trên chưa? Hãy kể tình huống đó và cách bạn xử lý.`,
        category: "behavioral",
      };
      case 6: return {
        content: isJunior
          ? `Bạn tự nhận thấy điểm nào cần cải thiện nhất để làm tốt vai trò ${blueprint.roleName}?`
          : `Nếu cộng sự của bạn gặp khó khăn trong công việc, bạn thường hỗ trợ như thế nào?`,
        category: "behavioral",
      };
      default: return { // variant 7
        content: `Mục tiêu nghề nghiệp trong 2–3 năm tới của bạn trong lĩnh vực ${blueprint.domain} là gì?`,
        category: "behavioral",
      };
    }
  }

  // ─── TRUNG BÌNH (8 câu) ──────────────────────────────────────────────────
  if (difficulty.id === 2) {
    switch (variant) {
      case 0: return {
        content: `Hãy kể về một lần bạn gặp tình huống ${blueprint.scenario}. Bạn đã xử lý như thế nào và kết quả cụ thể là gì?`,
        category: "behavioral",
      };
      case 1: return {
        content: `Khi đối mặt với ${blueprint.scenario}, bạn thường tiếp cận vấn đề theo thứ tự ưu tiên nào và vì sao?`,
        category: "situational",
      };
      case 2: return {
        content: `Bạn đánh giá hiệu quả công việc của mình trong lĩnh vực ${blueprint.domain} bằng tiêu chí hoặc chỉ số nào? Cho ví dụ cụ thể.`,
        category: "situational",
      };
      case 3: return {
        content: isJunior
          ? `Nếu bạn không biết cách giải quyết một vấn đề mới trong ${blueprint.domain}, bạn sẽ làm gì để tìm ra hướng xử lý?`
          : isMid
          ? `Hãy mô tả một dự án phức tạp trong ${blueprint.domain} mà bạn đã đóng vai trò chính. Bạn điều phối và xử lý vướng mắc thế nào?`
          : `Ở cấp ${levelName}, khi thông tin chưa đầy đủ và áp lực thời gian cao, bạn ra quyết định như thế nào trong lĩnh vực ${blueprint.domain}?`,
        category: "situational",
      };
      case 4: return {
        content: isSenior
          ? `Bạn đã thiết lập quy trình hoặc cải tiến hệ thống nào trong lĩnh vực ${blueprint.domain} ảnh hưởng đến cả đội nhóm?`
          : `Hãy kể về một lần bạn phải thuyết phục người khác thay đổi cách làm việc trong ${blueprint.domain}. Bạn tiếp cận như thế nào?`,
        category: "behavioral",
      };
      case 5: return {
        content: `Bạn xử lý như thế nào khi phải hoàn thành nhiều việc cùng lúc với deadline chồng chéo trong ${blueprint.domain}?`,
        category: "situational",
      };
      case 6: return {
        content: `Hãy chia sẻ một sai lầm trong công việc ${blueprint.roleName} mà bạn đã mắc. Bạn học được gì và làm khác đi thế nào?`,
        category: "behavioral",
      };
      default: return { // variant 7
        content: isJunior
          ? `Bạn tự học hoặc phát triển kỹ năng ${blueprint.coreSkill} như thế nào ngoài công việc chính thức?`
          : `Nếu bạn phải cải thiện một quy trình trong lĩnh vực ${blueprint.domain}, bạn sẽ bắt đầu từ đâu và đo lường thành công như thế nào?`,
        category: "situational",
      };
    }
  }

  // ─── KHÓ (8 câu) ─────────────────────────────────────────────────────────
  switch (variant) {
    case 0: return {
      content: `Tình huống: ${blueprint.pressureScenario}. Thời gian rất hạn chế — bạn sẽ ưu tiên hành động nào trước tiên và tại sao?`,
      category: "pressure_case",
    };
    case 1: return {
      content: `Nếu ${blueprint.pressureScenario} và cấp trên không đồng ý với hướng xử lý của bạn, bạn sẽ phản hồi và thuyết phục như thế nào?`,
      category: "pressure_behavioral",
    };
    case 2: return {
      content: `Chia sẻ một quyết định thực sự khó trong lĩnh vực ${blueprint.domain} mà bạn đã từng phải đưa ra. Bạn đã cân nhắc những yếu tố nào?`,
      category: "pressure_behavioral",
    };
    case 3: return {
      content: isSenior
        ? `Ở cấp ${levelName}, khi nào bạn sẵn sàng bất đồng với quyết định của lãnh đạo cấp cao và bạn thực hiện điều đó như thế nào?`
        : `Nếu bạn phát hiện đồng nghiệp đang đưa ra quyết định sai trong lĩnh vực ${blueprint.domain}, bạn sẽ xử lý thế nào?`,
      category: "pressure_behavioral",
    };
    case 4: return {
      content: `Hãy mô tả một tình huống buộc bạn phải thay đổi hoàn toàn kế hoạch vào phút chót trong ${blueprint.domain}. Kết quả và bài học là gì?`,
      category: "pressure_behavioral",
    };
    case 5: return {
      content: isSenior
        ? `Với vai trò ${levelName} trong ${blueprint.domain}, bạn đã xây dựng năng lực đội nhóm và quản lý hiệu suất cá nhân như thế nào?`
        : `Khi phải cân bằng giữa chất lượng và tốc độ trong ${blueprint.domain}, bạn xác định ngưỡng chấp nhận được như thế nào?`,
      category: isSenior ? "pressure_behavioral" : "pressure_case",
    };
    case 6: return {
      content: `Nếu nguồn lực bị cắt giảm đáng kể nhưng mục tiêu vẫn giữ nguyên trong lĩnh vực ${blueprint.domain}, bạn sẽ làm gì?`,
      category: "pressure_case",
    };
    default: return { // variant 7
      content: `Điều gì khiến bạn thực sự khác biệt so với các ứng viên cùng cấp ${levelName} trong lĩnh vực ${blueprint.domain}?`,
      category: "pressure_behavioral",
    };
  }
}

function buildInterviewQuestionBank() {
  const generatedQuestions = roleInterviewBlueprints.flatMap((blueprint) =>
    fallbackDifficultyLevels.flatMap((difficulty) =>
      fallbackExperienceLevels.flatMap((experience) =>
        [0, 1, 2, 3, 4, 5, 6, 7].map((variant) => {
          const generated = createQuestionForCombination(blueprint, difficulty, experience, variant);

          return {
            // ID tổng hợp — KHÔNG phải hàng thật trong bảng interview_questions,
            // chỉ dùng để phân biệt câu hỏi trong bộ nhớ. Phải đánh dấu `generated`
            // để client không gửi id này lên server tra DB (gây lỗi kiểu dữ liệu).
            id: 100000 + blueprint.roleId * 10000 + difficulty.id * 1000 + experience.id * 10 + variant,
            content: generated.content,
            category: generated.category,
            role_id: blueprint.roleId,
            difficulty_level_id: difficulty.id,
            experience_level_id: experience.id,
            generated: true,
            interview_roles: { name: blueprint.roleName },
            interview_difficulty_levels: { name: normalizeVietnameseInterviewLabel(difficulty.name) },
            interview_experience_levels: { name: normalizeVietnameseInterviewLabel(experience.name) },
          } satisfies InterviewQuestion;
        })
      )
    )
  );

  const seen = new Set<string>();
  return [...baseFallbackQuestions, ...generatedQuestions]
    .filter((question) => {
      const key = `${question.role_id}-${question.difficulty_level_id}-${question.experience_level_id}-${question.content}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    // Toàn bộ ngân hàng câu hỏi này chỉ tồn tại trong bộ nhớ server, KHÔNG có
    // hàng thật trong bảng interview_questions — id chỉ để phân biệt trong
    // mảng. Đánh dấu `generated: true` để client không gửi id này lên server
    // tra DB (từng gây lỗi "invalid input syntax for type uuid").
    .map((question) => ({ ...question, generated: true }));
}

export const fallbackDifficultyLevels: InterviewDifficultyLevel[] = [
  { id: 1, name: "Dễ" },
  { id: 2, name: "Trung bình" },
  { id: 3, name: "Khó" },
];

export const fallbackExperienceLevels: InterviewExperienceLevel[] = [
  { id: 1, name: "Sinh viên / Thực tập sinh" },
  { id: 2, name: "Mới tốt nghiệp" },
  { id: 3, name: "Nhân viên" },
  { id: 4, name: "Trưởng nhóm / Giám sát" },
  { id: 5, name: "Quản lý" },
  { id: 6, name: "Quản lý cấp cao" },
  { id: 7, name: "Điều hành cấp cao" },
];

const baseFallbackQuestions: InterviewQuestion[] = [
  {
    id: 101,
    content: "Hãy giới thiệu ngắn gọn về bản thân và lý do bạn chọn ngành Nhân sự.",
    category: "behavioral",
    role_id: 1,
    difficulty_level_id: 1,
    experience_level_id: 2,
    interview_roles: { name: "Nhân sự" },
    interview_difficulty_levels: { name: "De" },
    interview_experience_levels: { name: "Mới tốt nghiệp" },
  },
  {
    id: 102,
    content: "Bạn xử lý như thế nào khi có xung đột giữa nhu cầu tuyển dụng và ngân sách lương?",
    category: "technical",
    role_id: 1,
    difficulty_level_id: 2,
    experience_level_id: 4,
    interview_roles: { name: "Nhân sự" },
    interview_difficulty_levels: { name: "Trung bình" },
    interview_experience_levels: { name: "Trưởng nhóm / Giám sát" },
  },
  {
    id: 103,
    content: "Bạn mô tả quy trình lập và kiểm soát bảng đối chiếu công nợ cuối tháng.",
    category: "technical",
    role_id: 2,
    difficulty_level_id: 2,
    experience_level_id: 3,
    interview_roles: { name: "Kế toán" },
    interview_difficulty_levels: { name: "Trung bình" },
    interview_experience_levels: { name: "Nhân viên" },
  },
  {
    id: 201,
    content: "Nếu khách hàng từ chối 3 lần liên tiếp, bạn sẽ xử lý như thế nào để mở lại cơ hội chốt deal?",
    category: "technical",
    role_id: 3,
    difficulty_level_id: 2,
    experience_level_id: 3,
    interview_roles: { name: "Kinh doanh / Bán hàng" },
    interview_difficulty_levels: { name: "Trung bình" },
    interview_experience_levels: { name: "Nhân viên" },
  },
  {
    id: 202,
    content: "Bạn đánh giá hiệu quả một chiến dịch performance marketing bằng các chỉ số nào?",
    category: "system_design",
    role_id: 4,
    difficulty_level_id: 2,
    experience_level_id: 3,
    interview_roles: { name: "Marketing" },
    interview_difficulty_levels: { name: "Trung bình" },
    interview_experience_levels: { name: "Nhân viên" },
  },
  {
    id: 203,
    content: "Hãy mô tả một bug production bạn đã xử lý và cách bạn giao tiếp với stakeholder trong quá trình đó.",
    category: "system_design",
    role_id: 5,
    difficulty_level_id: 3,
    experience_level_id: 4,
    interview_roles: { name: "Công nghệ thông tin" },
    interview_difficulty_levels: { name: "Khó" },
    interview_experience_levels: { name: "Trưởng nhóm / Giám sát" },
  },
  {
    id: 301,
    content: "Khi khách hàng phàn nàn gay gắt, bạn sẽ làm gì để giải quyết và giữ trải nghiệm tích cực?",
    category: "behavioral",
    role_id: 6,
    difficulty_level_id: 1,
    experience_level_id: 3,
    interview_roles: { name: "Chăm sóc khách hàng" },
    interview_difficulty_levels: { name: "Dễ" },
    interview_experience_levels: { name: "Nhân viên" },
  },
  {
    id: 302,
    content: "Hãy mô tả cách bạn sắp xếp và ưu tiên công việc trong một ngày có nhiều đầu mục hạn gấp.",
    category: "system_design",
    role_id: 7,
    difficulty_level_id: 1,
    experience_level_id: 2,
    interview_roles: { name: "Hành chính / Văn phòng" },
    interview_difficulty_levels: { name: "Dễ" },
    interview_experience_levels: { name: "Mới tốt nghiệp" },
  },
  {
    id: 303,
    content: "Nếu kho vận giao chậm nhiều ngày liên tiếp, bạn sẽ phân tích nguyên nhân và đề xuất cách sửa ra sao?",
    category: "system_design",
    role_id: 8,
    difficulty_level_id: 3,
    experience_level_id: 4,
    interview_roles: { name: "Logistics / Chuỗi cung ứng" },
    interview_difficulty_levels: { name: "Khó" },
    interview_experience_levels: { name: "Trưởng nhóm / Giám sát" },
  },
  {
    id: 304,
    content: "Bạn sẽ tư vấn sản phẩm tài chính như thế nào cho một khách hàng thiếu kiến thức chuyên môn?",
    category: "behavioral",
    role_id: 9,
    difficulty_level_id: 2,
    experience_level_id: 3,
    interview_roles: { name: "Tài chính / Đầu tư" },
    interview_difficulty_levels: { name: "Trung bình" },
    interview_experience_levels: { name: "Nhân viên" },
  },
  {
    id: 305,
    content: "Hãy mô tả một brief thiết kế mơ hồ và cách bạn khai thác thêm thông tin để trình bày phương án hợp lý.",
    category: "behavioral",
    role_id: 10,
    difficulty_level_id: 2,
    experience_level_id: 3,
    interview_roles: { name: "Thiết kế / Sáng tạo" },
    interview_difficulty_levels: { name: "Trung bình" },
    interview_experience_levels: { name: "Nhân viên" },
  },
  {
    id: 306,
    content: "Bạn xử lý thế nào khi khách hàng muốn điều chỉnh hợp đồng nhưng vấn đề pháp lý không cho phép?",
    category: "technical",
    role_id: 11,
    difficulty_level_id: 3,
    experience_level_id: 5,
    interview_roles: { name: "Luật / Pháp lý" },
    interview_difficulty_levels: { name: "Khó" },
    interview_experience_levels: { name: "Quản lý" },
  },
  {
    id: 307,
    content: "Nếu hôm nay nhà hàng bị thiếu nhân sự trong giờ cao điểm, bạn sẽ phân bổ và xử lý ra sao?",
    category: "behavioral",
    role_id: 12,
    difficulty_level_id: 2,
    experience_level_id: 4,
    interview_roles: { name: "Nhà hàng / Khách sạn" },
    interview_difficulty_levels: { name: "Trung bình" },
    interview_experience_levels: { name: "Trưởng nhóm / Giám sát" },
  },
];

export const fallbackQuestions: InterviewQuestion[] = buildInterviewQuestionBank();

export function getFallbackQuestions(
  roleId?: number,
  difficultyLevelId?: number,
  experienceLevelId?: number
) {
  const exactMatches = fallbackQuestions.filter((question) => {
    const matchesRole = roleId ? question.role_id === roleId : true;
    const matchesDifficulty = difficultyLevelId
      ? question.difficulty_level_id === difficultyLevelId
      : true;
    const matchesExperience = experienceLevelId
      ? question.experience_level_id === experienceLevelId
      : true;
    return matchesRole && matchesDifficulty && matchesExperience;
  });

  if (exactMatches.length) {
    return exactMatches;
  }

  const roleAndDifficultyMatches = fallbackQuestions.filter((question) => {
    const matchesRole = roleId ? question.role_id === roleId : true;
    const matchesDifficulty = difficultyLevelId
      ? question.difficulty_level_id === difficultyLevelId
      : true;
    return matchesRole && matchesDifficulty;
  });

  if (roleAndDifficultyMatches.length) {
    return roleAndDifficultyMatches;
  }

  const roleOnlyMatches = fallbackQuestions.filter((question) =>
    roleId ? question.role_id === roleId : true
  );

  if (roleOnlyMatches.length) {
    return roleOnlyMatches;
  }

  return fallbackQuestions;
}

export function hasPersonalizationContext(personalization?: InterviewPersonalization | null) {
  return Boolean(
    personalization?.jobTitle?.trim() ||
      personalization?.jobDescription?.trim() ||
      personalization?.candidateSummary?.trim() ||
      personalization?.cvFileName?.trim()
  );
}

export function createPersonalizedFallbackQuestions(params: {
  roleId: number;
  difficultyLevelId: number;
  experienceLevelId: number;
  roleName?: string;
  difficultyName?: string;
  experienceLevelName?: string;
  personalization?: InterviewPersonalization | null;
}) {
  const roleName = normalizeVietnameseInterviewLabel(
    params.roleName || getFallbackRoleName(params.roleId)
  );
  const difficultyName = normalizeVietnameseInterviewLabel(
    params.difficultyName || getFallbackDifficultyName(params.difficultyLevelId)
  );
  const experienceLevelName =
    normalizeVietnameseInterviewLabel(
      params.experienceLevelName || getFallbackExperienceName(params.experienceLevelId)
    );
  const personalization = params.personalization ?? {};
  const targetTitle = personalization.jobTitle?.trim() || roleName;
  const jdHint = personalization.jobDescription?.trim()
    ? "dựa trên mô tả công việc bạn đã nhập"
    : "dựa trên yêu cầu phổ biến của vị trí";
  const cvHint = personalization.candidateSummary?.trim()
    ? "liên hệ với kinh nghiệm cá nhân của bạn"
    : "nêu thêm ví dụ từ kinh nghiệm của bạn";

  const contents = [
    `Hãy giới thiệu bản thân và cho biết điều gì thúc đẩy bạn ứng tuyển vào vị trí ${targetTitle}.`,
    `Kể về thành tích bạn tự hào nhất trong sự nghiệp hoặc quá trình học tập, ${cvHint}. Điều đó thể hiện năng lực gì liên quan đến vị trí này?`,
    `Nếu được nhận vào ${targetTitle}, bạn sẽ tập trung làm gì trong 30 ngày đầu để nhanh chóng tạo ra giá trị, ${jdHint}?`,
    `Hãy kể về một tình huống bạn phải làm việc dưới áp lực cao. Bạn đã xử lý như thế nào và kết quả ra sao?`,
    `Điểm nào bạn đang cải thiện để đáp ứng tốt hơn yêu cầu của ${targetTitle}? Bạn đang làm gì cụ thể để phát triển điểm đó?`,
  ];

  if (personalization.jobDescription?.trim()) {
    contents.push(
      `Trong bản mô tả công việc, yêu cầu nào bạn cảm thấy thách thức nhất? Bạn sẽ chứng minh năng lực đáp ứng yêu cầu đó như thế nào?`
    );
  }

  if (personalization.candidateSummary?.trim()) {
    contents.push(
      `Từ những kinh nghiệm bạn đã chia sẻ, điều gì chứng tỏ bạn có thể đóng góp giá trị sớm nhất cho đội nhóm tại vị trí ${targetTitle}?`
    );
  }

  return contents.map((content, index) => ({
    id: -1000 - index,
    content,
    category: "personalized",
    role_id: params.roleId,
    difficulty_level_id: params.difficultyLevelId,
    experience_level_id: params.experienceLevelId,
    generated: true,
    interview_roles: { name: roleName },
    interview_difficulty_levels: { name: difficultyName },
    interview_experience_levels: { name: experienceLevelName },
  })) satisfies InterviewQuestion[];
}

export function createFallbackSessionId(
  roleId: string | number | null,
  difficultyLevelId: string | number | null,
  experienceLevelId: string | number | null
) {
  return `local-${roleId ?? 1}-${difficultyLevelId ?? 1}-${experienceLevelId ?? 1}`;
}

export function parseFallbackSessionId(sessionId: string) {
  const match = /^local-(\d+)-(\d+)-(\d+)$/.exec(sessionId);
  if (!match) return null;

  return {
    roleId: Number(match[1]),
    difficultyLevelId: Number(match[2]),
    experienceLevelId: Number(match[3]),
  };
}

export function isLocalInterviewSessionId(sessionId: string) {
  return sessionId.startsWith("local-");
}

export function getFallbackRoleName(roleId?: number) {
  return fallbackRoles.find((item) => item.id === roleId)?.name ?? "Unknown";
}

export function getFallbackDifficultyName(difficultyLevelId?: number) {
  return (
    fallbackDifficultyLevels.find((item) => item.id === difficultyLevelId)?.name ?? "Unknown"
  );
}

export function getFallbackExperienceName(experienceLevelId?: number) {
  return (
    fallbackExperienceLevels.find((item) => item.id === experienceLevelId)?.name ?? "Unknown"
  );
}

/**
 * Bộ câu hỏi phỏng vấn truyền thống — phân theo cấp bậc.
 * Không phụ thuộc ngành nghề, phù hợp với mọi vị trí.
 */
export function createClassicInterviewQuestions(experienceLevelId: number): InterviewQuestion[] {
  const levelName = normalizeVietnameseInterviewLabel(
    fallbackExperienceLevels.find((l) => l.id === experienceLevelId)?.name ?? "Nhân viên"
  );
  const isJunior = experienceLevelId <= 2;  // Sinh viên / Mới tốt nghiệp
  const isSenior = experienceLevelId >= 5;  // Quản lý trở lên

  let contents: string[];

  if (isJunior) {
    contents = [
      "Hãy giới thiệu ngắn gọn về bản thân bạn.",
      "Điểm mạnh và điểm yếu lớn nhất của bạn là gì? Bạn đang cải thiện điểm yếu đó như thế nào?",
      "Tại sao bạn muốn ứng tuyển vào vị trí này và lý do bạn chọn công ty chúng tôi?",
      "Tại sao bạn chọn ngành học của mình và nó liên quan thế nào đến công việc bạn đang ứng tuyển?",
      "Bạn có kinh nghiệm thực tập, làm thêm, hoặc tham gia dự án nào chưa? Hãy kể về trải nghiệm đó.",
      "Trong công việc, bạn thích làm việc độc lập hay theo nhóm hơn? Hãy cho ví dụ cụ thể.",
      "Bạn xử lý thế nào khi gặp áp lực hoặc khi công việc không đúng theo kế hoạch?",
      "Mục tiêu nghề nghiệp trong 2–3 năm tới của bạn là gì?",
      "Ngoài kỹ năng chuyên môn, bạn có thể đóng góp gì khác cho đội nhóm?",
      "Bạn có câu hỏi gì muốn hỏi chúng tôi không?",
    ];
  } else if (isSenior) {
    contents = [
      "Hãy giới thiệu bản thân và hành trình sự nghiệp của bạn đến nay.",
      "Mô tả phong cách lãnh đạo của bạn và cho một ví dụ cụ thể bạn đã áp dụng.",
      "Tại sao bạn muốn rời vị trí hiện tại để gia nhập tổ chức của chúng tôi?",
      "Kỳ vọng về mức lương và đãi ngộ của bạn ở cấp độ này? Cơ sở nào để bạn đưa ra con số đó?",
      "Thành tích lớn nhất bạn đạt được trong vai trò quản lý hoặc lãnh đạo?",
      "Khi đối mặt với xung đột nội bộ hoặc thay đổi lớn trong tổ chức, bạn tiếp cận như thế nào?",
      "Bạn xây dựng và phát triển năng lực của đội nhóm như thế nào?",
      "Trong 12 tháng đầu, bạn muốn tạo ra tác động gì cụ thể cho công ty?",
      "Điểm yếu trong phong cách lãnh đạo của bạn là gì? Bạn đang cải thiện nó như thế nào?",
      "Bạn có câu hỏi gì muốn hỏi ban lãnh đạo chúng tôi không?",
    ];
  } else {
    // Nhân viên / Trưởng nhóm (id 3–4)
    contents = [
      "Hãy giới thiệu bản thân và tóm tắt quá trình làm việc của bạn.",
      "Tại sao bạn muốn rời công ty hiện tại (hoặc trước đây)?",
      "Mức lương kỳ vọng của bạn là bao nhiêu? Cơ sở nào để bạn đưa ra con số đó?",
      "Điểm mạnh và điểm yếu của bạn trong công việc là gì? Bạn đang khắc phục điểm yếu đó ra sao?",
      "Hãy kể về thành tích nổi bật nhất trong sự nghiệp vừa qua của bạn.",
      "Bạn xử lý thế nào khi không đồng ý với quyết định của cấp trên hoặc công ty?",
      "Tại sao chúng tôi nên tuyển bạn thay vì các ứng viên khác cho vị trí này?",
      "Bạn mô tả phong cách làm việc và phối hợp nhóm của mình như thế nào?",
      "Bạn sẽ làm gì trong 30 ngày đầu tiên nếu được nhận vào vị trí này?",
      "Bạn có câu hỏi gì muốn hỏi chúng tôi không?",
    ];
  }

  return contents.map((content, index) => ({
    id: -2000 - index,
    content,
    category: "classic",
    role_id: 0,
    difficulty_level_id: 0,
    experience_level_id: experienceLevelId,
    generated: true,
    interview_roles: { name: "Phỏng vấn truyền thống" },
    interview_difficulty_levels: { name: "Phổ biến" },
    interview_experience_levels: { name: levelName },
  })) satisfies InterviewQuestion[];
}
