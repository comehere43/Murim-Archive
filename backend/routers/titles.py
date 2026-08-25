import os

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from openai import OpenAI

from schemas.titles import TitleGenerateRequest, TitleGenerateResponse

load_dotenv()

router = APIRouter(
    prefix="/titles",
    tags=["titles"],
)

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
)


@router.post("/generate")
def generate_titles(request: TitleGenerateRequest):
    try:
        source_type_text = (
            "원전 제목" if request.source_type == "title" else "책의 내용 설명"
        )

        if request.force_generate:
            prompt = f"""
너는 무협 세계관의 서고지기다.

사용자가 입력한 원전 제목의 의미를 파악하기 어렵지만,
사용자가 자유로운 작명을 직접 요청했다.

사용자가 입력한 문자열:
{request.source_text}

중요한 규칙:
- 입력 문자열의 의미를 억지로 추측하지 않는다.
- 입력 문자열에 존재하지 않는 뜻이나 배경을 만들어내지 않는다.
- 입력 문자열과 의미적으로 연결하려 하지 않는다.
- 독립적인 무협 비급명을 자유롭게 정확히 3개 만든다.

반드시:
- valid_input은 true
- error_code는 null
- titles에는 정확히 3개의 후보를 넣는다.

각 후보에는 다음 내용을 포함한다.

- title: 무협 세계관의 비급서 또는 고서처럼 느껴지는 책 제목
- hanja: 자연스러운 한자 표기
- meaning: 새로 만든 비급서 제목의 뜻
- reason: 이 비급서 제목의 분위기와 작명 의도를 설명

reason은 반드시 존댓말로 작성한다.
"""

        else:
            prompt = f"""
너는 무협 세계관의 서고지기다.

사용자가 작명에 사용할 정보를 제공했다.

입력 종류:
{source_type_text}

입력 내용:
{request.source_text}

입력 종류가 "원전 제목"이라면:

먼저 입력의 실제 의미나 주제를 파악할 수 있는지 판단한다.

1. 의미를 파악할 수 있는 경우:
- 원전 제목의 실제 의미와 주제를 바탕으로 무협풍 비급명을 만든다.
- 원전의 핵심 개념을 무협 세계관의 표현으로 자연스럽게 재해석한다.

2. 실제 의미를 명확하게 파악하기 어려운 경우:
- 즉시 실패 처리하지 않는다.
- 입력 문자열 자체에서 객관적으로 관찰할 수 있는 특징을 찾아 작명 소재로 활용한다.
- 활용 가능한 특징에는 발음과 어감, 음절이나 문자의 반복, 반복 횟수,
  리듬, 문자 구성, 숫자, 기호, 형태적 패턴 등이 포함될 수 있다.
- 이러한 특징을 무협 세계관의 상징, 개념, 비유, 표현 방식으로
  창의적으로 재해석하여 비급서의 제목을 만든다.
- 모든 특징을 억지로 사용할 필요는 없으며,
  입력에서 실제로 두드러지는 특징만 선택한다.

중요:
- 이 서비스에서 만드는 것은 무공 기술명이 아니라
  무협 세계관의 서고에 실제로 꽂혀 있을 법한 비급서 또는 고서의 제목이다.
- 결과가 단순한 기술명, 초식명, 무공명처럼 느껴지지 않도록 한다.
- "○○신공", "○○심법", "○○초식" 같은 형태는 특별한 이유가 없는 한 피한다.
- 경(經), 록(錄), 서(書), 전(典), 요결(要訣), 비록(秘錄),
  진해(眞解), 대전(大全) 등 서책 제목에 어울리는 표현을 우선 고려한다.
- 단, 위 표현을 기계적으로 반복해서 사용하지 말고
  입력의 의미와 분위기에 맞게 자연스럽게 선택한다.
- 입력에 존재하지 않는 사전적 의미, 어원, 역사적 배경을 사실처럼 만들어내지 않는다.
- 의미가 없는 표현을 의미가 있는 단어인 것처럼 설명하지 않는다.
- 형태나 어감을 활용한 경우에는 reason에서
  그것이 창의적인 재해석임을 명확하게 설명한다.

입력의 의미를 파악할 수 있거나,
입력 자체에 사람이 의도적으로 만든 표현이라고 볼 만한
명확한 패턴이나 특징이 있는 경우에만 작명을 진행한다.

단순한 키보드 난타, 무작위 문자 배열, 오타로 보이는 문자열은
문자 구성이나 발음을 억지로 작명 소재로 사용하지 않는다.

특히 다음과 같은 경우에는 유효하지 않은 입력으로 판단한다:
- 서로 연관성 없는 영문자가 무작위로 이어진 문자열
- 한글 자판을 무작위로 누른 것으로 보이는 문자열
- 의미나 반복 규칙 없이 문자와 기호가 뒤섞인 문자열
- 명확한 단어, 의성어, 반복, 리듬 또는 의도된 패턴을 찾기 어려운 문자열

반대로 사전적인 의미가 없더라도
반복, 의성어·의태어 같은 어감, 일정한 리듬,
명확한 문자 패턴 등 사람이 의도적으로 만든 표현이라고
합리적으로 볼 수 있다면 작명 소재로 사용할 수 있다.

작명 가능한 경우:
- valid_input은 true
- error_code는 null
- titles에는 정확히 3개의 후보를 넣는다.

유효하지 않은 경우:
- valid_input은 false
- error_code는 "INVALID_INPUT"
- titles는 빈 배열

입력 종류가 "책의 내용 설명"이라면:
- 설명에서 실제 주제나 내용을 파악할 수 있어야 한다.
- 내용 설명에서는 의미 없는 표현을 억지로 재해석하지 않는다.
- 작명에 사용할 만한 주제를 파악하기 어렵다면 유효하지 않은 입력으로 판단한다.

정말로 의미도 파악할 수 없고,
입력 자체에서도 작명에 사용할 특징을 찾기 어려운 경우에만:
- valid_input은 false
- error_code는 "INVALID_INPUT"
- titles는 빈 배열

작명에 성공하는 경우:
- valid_input은 true
- error_code는 null
- titles에는 정확히 3개의 후보를 넣는다.

각 후보에는 다음 내용을 포함한다.

- title: 무협 세계관의 비급서 또는 고서처럼 느껴지는 책 제목
- hanja: 자연스러운 한자 표기
- meaning: 새로 만든 비급서 제목의 뜻
- reason: 입력의 실제 의미를 활용한 경우에는 그 의미가 새 제목에 어떻게 반영되었는지 설명한다.
  입력의 형태나 어감 등의 특징을 활용한 경우에는 어떤 특징을 어떻게 창의적으로 재해석했는지 설명한다.

reason은 반드시 존댓말로 작성한다.
"""
        response = client.responses.parse(
            model="gpt-5.6-luna",
            input=prompt,
            text_format=TitleGenerateResponse,
        )

        result = response.output_parsed

        if result is None:
            raise ValueError("Structured output is empty")

        return result

    except Exception as error:
        print(error)

        raise HTTPException(
            status_code=500,
            detail="Failed to generate titles",
        )
