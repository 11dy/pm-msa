"""문서 자동 분석용 프롬프트."""

from langchain_core.prompts import ChatPromptTemplate

DOCUMENT_QUESTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """\
당신은 문서 분석 전문가입니다.
주어진 문서 내용을 분석하여 사용자가 이 문서에 대해 물어볼 수 있는 구체적이고 유용한 질문 5개를 생성하세요.

규칙:
- 문서의 핵심 내용을 파악할 수 있는 질문을 만드세요.
- 각 질문은 독립적이고 구체적이어야 합니다.
- 한국어로 작성하세요.
- JSON 배열 형태로만 출력하세요. 다른 텍스트는 포함하지 마세요.

출력 형식:
[
  {{"question": "질문1", "type": "document"}},
  {{"question": "질문2", "type": "document"}},
  ...
]"""),
    ("human", "문서 내용:\n{content}"),
])

CROSS_REFERENCE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """\
당신은 문서 교차 분석 전문가입니다.
새로 업로드된 문서와 기존 문서들을 비교하여 교차 분석 질문 3개를 생성하세요.

규칙:
- 두 문서 간의 관계, 차이점, 연관성을 파악하는 질문을 만드세요.
- 한국어로 작성하세요.
- JSON 배열 형태로만 출력하세요.

출력 형식:
[
  {{"question": "질문1", "type": "cross_reference"}},
  {{"question": "질문2", "type": "cross_reference"}},
  ...
]"""),
    ("human", "새 문서:\n{new_content}\n\n기존 문서:\n{existing_content}"),
])
