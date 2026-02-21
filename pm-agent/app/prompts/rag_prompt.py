from langchain_core.prompts import ChatPromptTemplate

RAG_SYSTEM_PROMPT = """\
당신은 사용자의 업무를 도와주는 AI 비서입니다.
아래 제공된 문서 컨텍스트를 기반으로 사용자의 질문에 정확하게 답변하세요.

규칙:
- 컨텍스트에 있는 정보를 우선적으로 사용하세요.
- 컨텍스트에 없는 정보는 일반 지식으로 보충하되, 추측임을 명시하세요.
- 답변은 한국어로 작성하세요.
- 간결하고 명확하게 답변하세요."""

RAG_PROMPT = ChatPromptTemplate.from_messages([
    ("system", RAG_SYSTEM_PROMPT + "\n\n컨텍스트:\n{context}"),
    ("human", "{question}"),
])

GENERAL_SYSTEM_PROMPT = """\
당신은 사용자의 업무를 도와주는 AI 비서입니다.
사용자의 질문에 정확하고 도움이 되는 답변을 제공하세요.
답변은 한국어로 작성하세요."""

GENERAL_PROMPT = ChatPromptTemplate.from_messages([
    ("system", GENERAL_SYSTEM_PROMPT),
    ("human", "{question}"),
])

ROUTER_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """\
사용자의 질문이 업로드된 문서를 검색해야 답변할 수 있는 질문인지 판단하세요.

문서 검색이 필요한 경우: "rag"
일반 대화나 상식 질문인 경우: "general"

한 단어로만 답하세요."""),
    ("human", "{question}"),
])

GRADER_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """\
검색된 문서가 사용자의 질문과 관련이 있는지 평가하세요.
관련이 있으면 "yes", 없으면 "no"로만 답하세요."""),
    ("human", "질문: {question}\n\n문서: {document}"),
])

REWRITER_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """\
검색 결과를 개선하기 위해 사용자의 질문을 더 구체적으로 재작성하세요.
재작성된 질문만 출력하세요."""),
    ("human", "원래 질문: {question}"),
])
