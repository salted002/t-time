export type StudentStatus = '재원' | '휴원' | '퇴원';

export interface MockStudent {
  id: string;
  name: string;
  className: string | null;
  status: StudentStatus;
  school: string;
  grade: string;
  parentPhone: string;
  enrolledAt: string;
}

// 백엔드 학생 API가 아직 없어 화면 확인용으로 사용하는 정적 목데이터입니다.
export const MOCK_STUDENTS: MockStudent[] = [
  {
    id: '1',
    name: '김도윤',
    className: '중등 심화 A',
    status: '재원',
    school: '부평중',
    grade: '중1',
    parentPhone: '010-3322-5544',
    enrolledAt: '2026-08-30',
  },
  {
    id: '2',
    name: '강시우',
    className: '중등 심화 A',
    status: '재원',
    school: '부평중',
    grade: '중2',
    parentPhone: '010-7711-4422',
    enrolledAt: '2026-08-21',
  },
  {
    id: '3',
    name: '윤채원',
    className: '중등 기초 C',
    status: '휴원',
    school: '산곡중',
    grade: '중3',
    parentPhone: '010-1234-5678',
    enrolledAt: '2026-03-02',
  },
  {
    id: '4',
    name: '문지호',
    className: null,
    status: '퇴원',
    school: '부평고',
    grade: '고1',
    parentPhone: '010-2244-6688',
    enrolledAt: '2025-09-15',
  },
  {
    id: '5',
    name: '이서연',
    className: '고등 내신 B',
    status: '재원',
    school: '부평고',
    grade: '고2',
    parentPhone: '010-5566-7788',
    enrolledAt: '2026-07-14',
  },
  {
    id: '6',
    name: '박준호',
    className: '중등 기초 C',
    status: '재원',
    school: '산곡중',
    grade: '중1',
    parentPhone: '010-9988-2233',
    enrolledAt: '2026-06-02',
  },
  {
    id: '7',
    name: '정하은',
    className: '고등 내신 B',
    status: '휴원',
    school: '부평고',
    grade: '고1',
    parentPhone: '010-4433-1122',
    enrolledAt: '2026-02-18',
  },
  {
    id: '8',
    name: '최민재',
    className: '중등 심화 A',
    status: '재원',
    school: '부평중',
    grade: '중2',
    parentPhone: '010-6677-8899',
    enrolledAt: '2026-05-27',
  },
];
