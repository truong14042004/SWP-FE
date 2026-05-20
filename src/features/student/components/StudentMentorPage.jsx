import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import '../../../styles/mentor.css';
import {
  getMentorSessionById,
  getMentorSessions,
  sendMentorMessage,
} from '../mentorApi';
import { getStudentProfile } from '../studentApi';
import { getLatestSkillGap, getUserSkills } from '../skillsApi';

const QUICK_PROMPTS = [
  {
    title: 'Phân tích kỹ năng',
    question: 'Hãy phân tích kỹ năng hiện tại của tôi và chỉ ra 3 điểm cần cải thiện nhất.',
  },
  {
    title: 'Gợi ý thực hành',
    question: 'Hãy gợi ý cho tôi 3 dự án thực hành phù hợp với mục tiêu nghề nghiệp hiện tại.',
  },
  {
    title: 'Chuẩn bị phỏng vấn',
    question: 'Tôi nên chuẩn bị gì cho buổi phỏng vấn vị trí mục tiêu?',
  },
  {
    title: 'Cải thiện portfolio',
    question: 'Portfolio của tôi nên bổ sung những gì để tăng cơ hội được tuyển?',
  },
];

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatDate(value) {
  if (!value) return '';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function formatTime(value) {
  if (!value) return '';

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
}

function getSessionTitle(session) {
  const question = session?.question || 'Cuộc tư vấn mới';

  if (question.length <= 42) return question;

  return `${question.slice(0, 42)}...`;
}

function parseContextJson(value) {
  if (!value) return null;

  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function buildContextJson({ profile, userSkills, skillGapReport }) {
  return JSON.stringify({
    profile: profile
      ? {
          school: profile.school,
          major: profile.major,
          year: profile.year,
          gpa: profile.gpa,
          targetRoleId: profile.targetRoleId,
          careerGoal: profile.careerGoal,
          githubUsername: profile.githubUsername,
          preferredLearningHoursPerWeek: profile.preferredLearningHoursPerWeek,
        }
      : null,
    userSkills: safeArray(userSkills).map((item) => ({
      skillName: item.skillName,
      skillCategory: item.skillCategory,
      level: item.level,
      evidenceType: item.evidenceType,
      isVerified: item.isVerified,
    })),
    skillGap: skillGapReport
      ? {
          id: skillGapReport.id,
          careerRoleId: skillGapReport.careerRoleId,
          careerRoleName: skillGapReport.careerRoleName,
          matchScore:
            skillGapReport.matchScore ??
            skillGapReport.score ??
            skillGapReport.overallScore ??
            skillGapReport.readinessScore ??
            skillGapReport.progress,
          status: skillGapReport.status,
        }
      : null,
  });
}

export function StudentMentorPage({ session }) {
  const [profile, setProfile] = useState(null);
  const [userSkills, setUserSkills] = useState([]);
  const [skillGapReport, setSkillGapReport] = useState(null);

  const [mentorSessions, setMentorSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);

  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingSessionId, setLoadingSessionId] = useState('');
  const [sending, setSending] = useState(false);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const groupedSessions = useMemo(() => {
    const sorted = safeArray(mentorSessions).slice().sort((a, b) => {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return sorted.reduce((groups, item) => {
      const key = formatDate(item.createdAt) || 'Không rõ ngày';

      if (!groups[key]) groups[key] = [];
      groups[key].push(item);

      return groups;
    }, {});
  }, [mentorSessions]);

  const contextJson = useMemo(() => {
    return buildContextJson({
      profile,
      userSkills,
      skillGapReport,
    });
  }, [profile, userSkills, skillGapReport]);

  const profileName = session?.user?.fullName || 'Sinh viên';
  const initials = getInitials(profileName);
  const targetRole =
    skillGapReport?.careerRoleName ||
    profile?.targetRoleName ||
    profile?.careerGoal ||
    'Chưa xác định';

  async function loadInitialData() {
    setLoading(true);
    setError('');
    setNotice('');

    try {
      const [profileResult, userSkillResult, latestGapResult, sessionResult] = await Promise.all([
        getStudentProfile(session).catch(() => null),
        getUserSkills(session).catch(() => []),
        getLatestSkillGap(session).catch(() => null),
        getMentorSessions(session).catch(() => []),
      ]);

      const sessions = safeArray(sessionResult).sort((a, b) => {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

      setProfile(profileResult);
      setUserSkills(safeArray(userSkillResult));
      setSkillGapReport(latestGapResult);
      setMentorSessions(sessions);

      if (sessions.length > 0) {
        setSelectedSession(sessions[0]);
        setMessages(sessionToMessages(sessions[0]));
      } else {
        setMessages([
          {
            id: 'welcome-ai',
            role: 'assistant',
            content:
              'Chào bạn! Tôi là AI Mentor. Tôi có thể giúp bạn phân tích kỹ năng, cải thiện roadmap, chuẩn bị phỏng vấn và gợi ý dự án thực hành.',
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (requestError) {
      const message = requestError.message || 'Không tải được dữ liệu AI Mentor.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function sessionToMessages(item) {
    if (!item) return [];

    return [
      {
        id: `${item.id}-question`,
        role: 'user',
        content: item.question || '',
        createdAt: item.createdAt,
      },
      {
        id: `${item.id}-answer`,
        role: 'assistant',
        content: item.answer || 'Mentor chưa có phản hồi.',
        createdAt: item.createdAt,
        tokensUsed: item.tokensUsed,
        model: item.model,
        context: parseContextJson(item.contextJson),
      },
    ];
  }

  async function handleSelectSession(id) {
    if (!id) return;

    setLoadingSessionId(id);
    setError('');
    setNotice('');

    try {
      const result = await getMentorSessionById(session, id);
      setSelectedSession(result);
      setMessages(sessionToMessages(result));
    } catch (requestError) {
      const message = requestError.message || 'Không tải được phiên tư vấn.';
      setError(message);
      toast.error(message);
    } finally {
      setLoadingSessionId('');
    }
  }

  function startNewChat() {
    setSelectedSession(null);
    setQuestion('');
    setError('');
    setNotice('');
    setMessages([
      {
        id: 'new-ai',
        role: 'assistant',
        content:
          'Bạn muốn được tư vấn về vấn đề gì? Hãy hỏi về kỹ năng, roadmap, portfolio, GitHub hoặc phỏng vấn.',
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  function applyQuickPrompt(prompt) {
    setQuestion(prompt.question);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const finalQuestion = question.trim();

    if (!finalQuestion) {
      const message = 'Vui lòng nhập câu hỏi cho AI Mentor.';
      setError(message);
      toast.warn(message);
      return;
    }

    const optimisticUserMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: finalQuestion,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimisticUserMessage]);
    setQuestion('');
    setSending(true);
    setError('');
    setNotice('');

    try {
      const result = await sendMentorMessage(session, {
        question: finalQuestion,
        contextJson,
      });

      const assistantMessage = {
        id: `${result.id || Date.now()}-answer`,
        role: 'assistant',
        content: result.answer || 'AI Mentor chưa có phản hồi.',
        createdAt: result.createdAt || new Date().toISOString(),
        tokensUsed: result.tokensUsed,
        model: result.model,
        context: parseContextJson(result.contextJson),
      };

      setMessages((current) => [...current, assistantMessage]);
      setSelectedSession(result);

      setMentorSessions((current) => {
        const exists = current.some((item) => item.id === result.id);
        if (exists) {
          return current.map((item) => (item.id === result.id ? result : item));
        }

        return [result, ...current];
      });
      setNotice('AI Mentor đã phản hồi.');
      toast.success('AI Mentor đã phản hồi.');
    } catch (requestError) {
      const message = requestError.message || 'Không gửi được câu hỏi cho AI Mentor.';
      setError(message);
      toast.error(message);
    } finally {
      setSending(false);
    }
  }
function cleanGithubUsername(value) {
  return String(value || '').trim().replace(/^@+/, '');
}
  return (
    <section className="mentor-page">
      <aside className="mentor-session-panel">
        <div className="mentor-session-head">
          <div>
            <h2>Lịch sử tư vấn</h2>
            <p>{mentorSessions.length} phiên</p>
          </div>

          <button type="button" onClick={startNewChat} title="Tạo cuộc tư vấn mới">
            +
          </button>
        </div>

        {loading ? (
          <div className="mentor-session-empty">Đang tải lịch sử...</div>
        ) : mentorSessions.length === 0 ? (
          <div className="mentor-session-empty">
            Chưa có phiên tư vấn nào.
          </div>
        ) : (
          <div className="mentor-session-list">
            {Object.entries(groupedSessions).map(([date, items]) => (
              <div key={date} className="mentor-session-group">
                <span>{date}</span>

                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={selectedSession?.id === item.id ? 'active' : ''}
                    onClick={() => handleSelectSession(item.id)}
                    disabled={loadingSessionId === item.id}
                  >
                    {loadingSessionId === item.id ? 'Đang tải...' : getSessionTitle(item)}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </aside>

      <main className="mentor-chat-panel">
        <header className="mentor-chat-header">
          <div className="mentor-bot-avatar">🤖</div>

          <div>
            <h1>AI Mentor</h1>
            <p>
              Tư vấn học tập, roadmap, kỹ năng, portfolio và phỏng vấn dựa trên hồ sơ của bạn.
            </p>
          </div>

          <button type="button" onClick={loadInitialData}>
            Tải lại
          </button>
        </header>

        {error && <div className="mentor-alert error">{error}</div>}
        {notice && <div className="mentor-alert success">{notice}</div>}

        <section className="mentor-quick-prompts">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt.title}
              type="button"
              onClick={() => applyQuickPrompt(prompt)}
            >
              <strong>{prompt.title}</strong>
              <span>{prompt.question}</span>
            </button>
          ))}
        </section>

        <section className="mentor-message-list">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              userInitials={initials}
            />
          ))}

          {sending && (
            <div className="mentor-message-row assistant">
              <div className="mentor-message-avatar">🤖</div>
              <div className="mentor-message-bubble typing">
                AI Mentor đang suy nghĩ...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </section>

        <form className="mentor-input-bar" onSubmit={handleSubmit}>
          <button type="button" className="mentor-attach-btn" title="Đính kèm">
            📎
          </button>

          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Nhập câu hỏi của bạn..."
            rows={1}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSubmit(event);
              }
            }}
          />

          <button type="submit" disabled={sending}>
            {sending ? '...' : '➤'}
          </button>
        </form>

        <p className="mentor-disclaimer">
          AI có thể mắc sai lầm. Hãy kiểm tra lại các thông tin quan trọng.
        </p>
      </main>

      <aside className="mentor-context-panel">
        <h2>Ngữ cảnh Profile</h2>

        <section className="mentor-profile-card">
          <div className="mentor-profile-avatar">{initials}</div>

          <div>
            <h3>{profileName}</h3>
            <p>
              {profile?.school || 'Chưa có trường'} · {profile?.major || 'Chưa có ngành'}
            </p>

            <div className="mentor-profile-tags">
              {profile?.year && <span>Năm {profile.year}</span>}
              {profile?.gpa && <span>GPA {profile.gpa}</span>}
             {profile?.githubUsername && (
  <span>{cleanGithubUsername(profile.githubUsername)}</span>
)}
            </div>
          </div>
        </section>

        <section className="mentor-context-card">
          <span>Mục tiêu hiện tại</span>
          <h3>{targetRole}</h3>
          <p>{profile?.careerGoal || 'Chưa có mục tiêu nghề nghiệp trong hồ sơ.'}</p>

          <div className="mentor-match-line">
            <span
              style={{
                width: `${Math.min(
                  Math.max(
                    Number(
                      skillGapReport?.matchScore ??
                        skillGapReport?.score ??
                        skillGapReport?.progress ??
                        0
                    ),
                    0
                  ),
                  100
                )}%`,
              }}
            />
          </div>
        </section>

        <section className="mentor-context-card">
          <span>Kỹ năng gần đây</span>

          {safeArray(userSkills).length === 0 ? (
            <p>Chưa có kỹ năng nào trong hồ sơ.</p>
          ) : (
            <div className="mentor-skill-list">
              {safeArray(userSkills).slice(0, 6).map((skill) => (
                <div key={skill.id || skill.skillId}>
                  <strong>{skill.skillName || 'Kỹ năng'}</strong>
                  <small>{skill.level || 'Chưa có level'}</small>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mentor-context-card warning">
          <span>Gợi ý câu hỏi</span>
          <button type="button" onClick={() => applyQuickPrompt(QUICK_PROMPTS[0])}>
            Làm sao cải thiện skill gap?
          </button>
          <button type="button" onClick={() => applyQuickPrompt(QUICK_PROMPTS[1])}>
            Tôi nên làm dự án nào?
          </button>
        </section>
      </aside>
    </section>
  );
}

function ChatMessage({ message, userInitials }) {
  const isUser = message.role === 'user';

  return (
    <div className={isUser ? 'mentor-message-row user' : 'mentor-message-row assistant'}>
      {!isUser && <div className="mentor-message-avatar">🤖</div>}

      <div>
        <div className="mentor-message-label">
          {isUser ? 'Bạn' : 'AI Mentor'}
          {message.createdAt && <span>{formatTime(message.createdAt)}</span>}
        </div>

        <div className="mentor-message-bubble">
          {message.content}
        </div>

        {!isUser && (message.model || message.tokensUsed) && (
          <div className="mentor-message-meta">
            {message.model && <span>Model: {message.model}</span>}
            {message.tokensUsed !== undefined && <span>Tokens: {message.tokensUsed}</span>}
          </div>
        )}
      </div>

      {isUser && <div className="mentor-user-avatar">{userInitials}</div>}
    </div>
  );
}
