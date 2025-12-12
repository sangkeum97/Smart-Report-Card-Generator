export interface DifficultyStat {
  label: string;
  total: number;
  correct: number;
}

export interface AssessmentStat {
  name: string;
  maxScore: number;
  earnedScore: number;
}

export interface RadarStat {
  subject: string;
  student: number;
  fullMark: number;
}

export interface IncorrectAnswer {
  questionNumber: string;
  topic: string;
  reason: string;
  solution: string;
}

export interface ReportData {
  examTitle: string;
  studentName: string;
  score: number;
  examDate: string;
  
  // Textual Analysis
  summary: string;
  difficultyAnalysis: string; // Analyzes exam difficulty vs regional standards
  radarAnalysis: string; // New: Specific analysis of the 5 core competencies
  strengths: string[];
  weaknesses: string[];
  parentMessage: string;

  // Stats
  difficultyStats: DifficultyStat[]; // High, Mid, Low
  questionTypeStats: DifficultyStat[]; // Objective, Subjective
  assessmentStats: AssessmentStat[]; 
  radarStats: RadarStat[];
  
  // Incorrect Answer Analysis
  incorrectAnswers: IncorrectAnswer[];
}

export const INITIAL_DATA: ReportData = {
  examTitle: "2025학년도 2학기 수학 기말고사",
  studentName: "김단우",
  score: 88,
  examDate: "2025년 12월 10일",
  summary: "총 100점 만점 중 88점을 획득했습니다. 기본적인 연산 능력과 이해력은 매우 우수하나, 서술형 문제에서의 부분 감점과 응용 심화 문제에서 다소 어려움을 겪었습니다.",
  difficultyAnalysis: "이번 시험은 지역 내 일반적인 기출 문제들과 비교했을 때 난이도가 '중상' 수준으로 출제되었습니다. 특히 함수 단원에서의 그래프 활용 문제들이 복합적인 사고를 요구하여 변별력을 높였으며, 서술형 문항의 경우 정확한 풀이 과정을 요하는 까다로운 문제들이 다수 포함되어 있었습니다.",
  radarAnalysis: "계산력과 개념이해 역량이 매우 뛰어난 반면, 응용력 부분에서는 다소 편차가 보입니다. 기본기는 훌륭하지만 복합적인 문제 상황을 해결하는 추론 능력을 보완한다면 더욱 균형 잡힌 육각형 인재로 성장할 것입니다.",
  strengths: [
    "수와 연산 단원에서의 정답률이 매우 높음 (배점 30점 중 30점 득점)",
    "기본 개념에 대한 이해도가 탄탄함",
    "계산 실수가 거의 없음"
  ],
  weaknesses: [
    "함수 그래프 작성 시 절편 표기 누락으로 인한 감점",
    "도형의 응용 심화 문제에 대한 접근 방식 보완 필요"
  ],
  parentMessage: "단우는 기본기가 매우 튼튼하고 성실한 학생입니다. 수와 연산 문항에서는 압도적인 실력을 보여주었으나, 함수와 기하 영역의 심화 문제에서 아쉬운 감점이 있었습니다. 다양한 유형의 문제를 접하며 응용력을 기른다면 다음 시험에서는 만점을 기대해볼 수 있습니다.",
  difficultyStats: [
    { label: "상", total: 4, correct: 2 },
    { label: "중", total: 7, correct: 6 },
    { label: "하", total: 9, correct: 9 },
  ],
  questionTypeStats: [
    { label: "객관식", total: 14, correct: 13 },
    { label: "서술형", total: 6, correct: 4 },
  ],
  assessmentStats: [
    { name: "수와 연산", maxScore: 30, earnedScore: 30 },
    { name: "문자와 식", maxScore: 20, earnedScore: 18 },
    { name: "함수", maxScore: 30, earnedScore: 25 },
    { name: "기하", maxScore: 20, earnedScore: 15 },
  ],
  radarStats: [
    { subject: "계산력", student: 95, fullMark: 100 },
    { subject: "문제해결", student: 85, fullMark: 100 },
    { subject: "개념이해", student: 100, fullMark: 100 },
    { subject: "응용력", student: 80, fullMark: 100 },
    { subject: "정확성", student: 90, fullMark: 100 },
  ],
  incorrectAnswers: [
    {
      questionNumber: "서술형 2번",
      topic: "도형의 성질",
      reason: "풀이 과정 중 합동 조건 명시 누락",
      solution: "합동/닮음 조건(SSS, SAS 등)을 반드시 기호로 표기하는 연습 필요"
    }
  ]
};