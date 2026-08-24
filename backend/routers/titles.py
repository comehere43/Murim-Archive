import json
import os

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from openai import OpenAI

from schemas.titles import TitleGenerateRequest

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
        response = client.responses.create(
            model="gpt-5.6-luna",
            input=f"""
너는 무협 세계관의 서고지기다.

사용자가 제공한 원전 제목을 바탕으로
무협 비급처럼 느껴지는 새로운 책 제목을 3개 만들어라.
이름을 추천한 이유는 존댓말로 답해라.

원전 제목:
{request.original_title}

반드시 아래 JSON 형식으로만 답하라.

[
  {{
    "title": "비급명",
    "hanja": "한자 표기",
    "meaning": "제목의 뜻",
    "reason": "이 이름을 추천한 이유"
  }},
  {{
    "title": "비급명",
    "hanja": "한자 표기",
    "meaning": "제목의 뜻",
    "reason": "이 이름을 추천한 이유"
  }},
  {{
    "title": "비급명",
    "hanja": "한자 표기",
    "meaning": "제목의 뜻",
    "reason": "이 이름을 추천한 이유"
  }}
]
""",
        )

        titles = json.loads(response.output_text)

        return {
            "titles": titles,
        }

    except Exception as error:
        print(error)

        raise HTTPException(
            status_code=500,
            detail="Failed to generate titles",
        )
