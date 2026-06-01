import { authorizedRequest } from '../../api/http';

/**
 * Kích hoạt AI phân tích tài năng tiềm ẩn dựa trên lịch sử commit Github.
 * @param {object} session - Phiên đăng nhập hiện tại.
 * @param {string} repoUrl - Đường dẫn Github Repository của học viên.
 */
export function analyzeTalent(session, repoUrl) {
  return authorizedRequest('/api/talent/analyze', session, {
    method: 'POST',
    body: JSON.stringify({ repoUrl }),
  });
}

/**
 * Lấy hồ sơ tài năng (Radar Chart) đã phân tích trước đó của học viên.
 */
export function getTalentProfile(session) {
  return authorizedRequest('/api/talent/profile', session);
}
