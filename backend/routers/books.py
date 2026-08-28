import hashlib
import re

from importlib.resources import contents
from pathlib import Path
from uuid import uuid4

import pymupdf
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from database import get_db
from models import Book
from schemas.books import PositionUpdate, ProgressUpdate, BookUpdate

router = APIRouter(
    prefix="/books",
    tags=["books"],
)


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
MAX_FILE_SIZE = 100 * 1024 * 1024
HEX_COLOR_PATTERN = re.compile(r"^#[0-9A-Fa-f]{6}$")


@router.post("")
async def create_book(
    file: UploadFile = File(...),
    display_title: str = Form(...),
    original_title: str | None = Form(None),
    source_description: str | None = Form(None),
    title_mode: str = Form(...),
    cover_style: str | None = Form(None),
    cover_color: str | None = Form(None),
    db: Session = Depends(get_db),
    force_duplicate: bool = Form(False),
):

    if title_mode not in {"manual", "ai"}:
        raise HTTPException(
            status_code=400,
            detail="Invalid title mode",
        )

    display_title = display_title.strip()

    if not display_title:
        raise HTTPException(
            status_code=400,
            detail="Display title is required",
        )

    if len(display_title) > 255:
        raise HTTPException(
            status_code=400,
            detail="Display title is too long",
        )

    if original_title is not None:
        original_title = original_title.strip() or None

        if original_title is not None and len(original_title) > 255:
            raise HTTPException(
                status_code=400,
                detail="Original title is too long",
            )

    if source_description is not None:
        source_description = source_description.strip() or None

        if source_description is not None and len(source_description) > 1000:
            raise HTTPException(
                status_code=400,
                detail="Source description is too long",
            )

    if cover_color is not None:
        if not HEX_COLOR_PATTERN.fullmatch(cover_color):
            raise HTTPException(
                status_code=400,
                detail="Invalid cover color",
            )

    contents = await file.read()

    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed",
        )

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="PDF file is too large",
        )

    if len(contents) == 0:
        raise HTTPException(
            status_code=400,
            detail="PDF file is empty",
        )

    file_hash = hashlib.sha256(contents).hexdigest()

    existing_book = db.query(Book).filter(Book.file_hash == file_hash).first()

    if existing_book is not None and not force_duplicate:
        raise HTTPException(
            status_code=409,
            detail={
                "message": "Duplicate PDF",
                "existing_book": {
                    "id": existing_book.id,
                    "display_title": existing_book.display_title,
                    "original_title": existing_book.original_title,
                },
            },
        )

    try:
        pdf = pymupdf.open(
            stream=contents,
            filetype="pdf",
        )

        total_pages = pdf.page_count
        pdf.close()

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid PDF file",
        )

    if total_pages < 1:
        raise HTTPException(
            status_code=400,
            detail="PDF contains no pages",
        )

    file_extension = Path(file.filename or "").suffix or ".pdf"
    stored_filename = f"{uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / stored_filename

    file_path.write_bytes(contents)

    book = Book(
        original_title=original_title,
        source_description=source_description,
        display_title=display_title,
        title_mode=title_mode,
        original_filename=file.filename or stored_filename,
        file_path=str(file_path),
        file_hash=file_hash,
        total_pages=total_pages,
        current_page=1,
        max_read_page=1,
        cover_style=cover_style,
        cover_color=cover_color,
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
        "source_description": book.source_description,
        "total_pages": book.total_pages,
        "current_page": book.current_page,
        "max_read_page": book.max_read_page,
        "cover_style": book.cover_style,
        "cover_color": book.cover_color,
    }


@router.get("")
def get_books(
    db: Session = Depends(get_db),
):
    books = db.query(Book).order_by(Book.created_at.desc()).all()

    return [
        {
            "id": book.id,
            "display_title": book.display_title,
            "original_title": book.original_title,
            "original_filename": book.original_filename,
            "file_path": book.file_path,
            "title_mode": book.title_mode,
            "source_description": book.source_description,
            "total_pages": book.total_pages,
            "current_page": book.current_page,
            "max_read_page": book.max_read_page,
            "cover_style": book.cover_style,
            "cover_color": book.cover_color,
        }
        for book in books
    ]


@router.get("/{book_id}")
def get_book(
    book_id: int,
    db: Session = Depends(get_db),
):
    book = db.query(Book).filter(Book.id == book_id).first()

    if book is None:
        raise HTTPException(
            status_code=404,
            detail="Book not found",
        )

    return {
        "id": book.id,
        "display_title": book.display_title,
        "original_title": book.original_title,
        "source_description": book.source_description,
        "original_filename": book.original_filename,
        "file_path": book.file_path,
        "title_mode": book.title_mode,
        "total_pages": book.total_pages,
        "current_page": book.current_page,
        "max_read_page": book.max_read_page,
        "cover_style": book.cover_style,
        "cover_color": book.cover_color,
    }


@router.patch("/{book_id}/progress")
def update_book_progress(
    book_id: int,
    progress: ProgressUpdate,
    db: Session = Depends(get_db),
):
    book = db.query(Book).filter(Book.id == book_id).first()

    if book is None:
        raise HTTPException(
            status_code=404,
            detail="Book not found",
        )

    if progress.current_page < 1:
        raise HTTPException(
            status_code=400,
            detail="Invalid page number",
        )

    if progress.current_page > book.total_pages:
        raise HTTPException(
            status_code=400,
            detail="Page exceeds total pages",
        )

    if progress.current_page > book.max_read_page:
        book.max_read_page = progress.current_page

    db.commit()
    db.refresh(book)

    return {
        "id": book.id,
        "max_read_page": book.max_read_page,
    }


@router.patch("/{book_id}/position")
def update_book_position(
    book_id: int,
    position: PositionUpdate,
    db: Session = Depends(get_db),
):
    book = db.query(Book).filter(Book.id == book_id).first()

    if book is None:
        raise HTTPException(
            status_code=404,
            detail="Book not found",
        )

    if position.current_page < 1:
        raise HTTPException(
            status_code=400,
            detail="Invalid page number",
        )

    if position.current_page > book.total_pages:
        raise HTTPException(
            status_code=400,
            detail="Page exceeds total pages",
        )

    book.current_page = position.current_page

    db.commit()
    db.refresh(book)

    return {
        "id": book.id,
        "current_page": book.current_page,
    }


@router.patch("/{book_id}")
def update_book(
    book_id: int,
    update: BookUpdate,
    db: Session = Depends(get_db),
):
    book = db.query(Book).filter(Book.id == book_id).first()

    if book is None:
        raise HTTPException(
            status_code=404,
            detail="Book not found",
        )

    book.display_title = update.display_title
    book.original_title = update.original_title
    book.source_description = update.source_description
    book.cover_style = update.cover_style
    book.cover_color = update.cover_color

    db.commit()
    db.refresh(book)

    return {
        "id": book.id,
        "display_title": book.display_title,
        "original_title": book.original_title,
        "source_description": book.source_description,
        "original_filename": book.original_filename,
        "title_mode": book.title_mode,
        "total_pages": book.total_pages,
        "current_page": book.current_page,
        "max_read_page": book.max_read_page,
        "cover_style": book.cover_style,
        "cover_color": book.cover_color,
    }


@router.delete("/{book_id}")
def delete_book(
    book_id: int,
    db: Session = Depends(get_db),
):
    book = db.query(Book).filter(Book.id == book_id).first()

    if book is None:
        raise HTTPException(
            status_code=404,
            detail="Book not found",
        )

    file_path = Path(book.file_path)

    db.delete(book)
    db.commit()

    if file_path.exists():
        file_path.unlink()

    return {
        "message": "Book deleted successfully",
        "id": book_id,
    }
