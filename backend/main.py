from pathlib import Path
from uuid import uuid4

import fitz
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from database import SessionLocal
from models import Book

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@app.get("/")
def read_root():
    return {"message": "Murim Archive backend is running"}


@app.post("/books")
async def create_book(
    file: UploadFile = File(...),
    display_title: str = Form(...),
    original_title: str | None = Form(None),
    title_mode: str = Form(...),
    cover_style: str | None = Form(None),
):
    contents = await file.read()

    pdf = fitz.open(stream=contents, filetype="pdf")
    total_pages = pdf.page_count
    pdf.close()

    file_extension = Path(file.filename or "").suffix or ".pdf"
    stored_filename = f"{uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / stored_filename

    file_path.write_bytes(contents)

    db = SessionLocal()

    try:
        book = Book(
            original_title=original_title,
            display_title=display_title,
            title_mode=title_mode,
            original_filename=file.filename or stored_filename,
            file_path=str(file_path),
            total_pages=total_pages,
            current_page=1,
            cover_style=cover_style,
        )

        db.add(book)
        db.commit()
        db.refresh(book)

        return {
            "id": book.id,
            "display_title": book.display_title,
            "original_title": book.original_title,
            "original_filename": book.original_filename,
            "title_mode": book.title_mode,
            "total_pages": book.total_pages,
            "current_page": book.current_page,
            "cover_style": book.cover_style,
        }

    finally:
        db.close()