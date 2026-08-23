from pathlib import Path
from uuid import uuid4

import fitz
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from database import get_db
from models import Book
from schemas.books import PositionUpdate, ProgressUpdate


router = APIRouter(
    prefix="/books",
    tags=["books"],
)


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("")
async def create_book(
    file: UploadFile = File(...),
    display_title: str = Form(...),
    original_title: str | None = Form(None),
    title_mode: str = Form(...),
    cover_style: str | None = Form(None),
    db: Session = Depends(get_db),
):
    contents = await file.read()

    pdf = fitz.open(stream=contents, filetype="pdf")
    total_pages = pdf.page_count
    pdf.close()

    file_extension = Path(file.filename or "").suffix or ".pdf"
    stored_filename = f"{uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / stored_filename

    file_path.write_bytes(contents)

    book = Book(
        original_title=original_title,
        display_title=display_title,
        title_mode=title_mode,
        original_filename=file.filename or stored_filename,
        file_path=str(file_path),
        total_pages=total_pages,
        current_page=1,
        max_read_page=1,
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
        "max_read_page": book.max_read_page,
        "cover_style": book.cover_style,
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
            "total_pages": book.total_pages,
            "current_page": book.current_page,
            "max_read_page": book.max_read_page,
            "cover_style": book.cover_style,
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
        "original_filename": book.original_filename,
        "file_path": book.file_path,
        "title_mode": book.title_mode,
        "total_pages": book.total_pages,
        "current_page": book.current_page,
        "max_read_page": book.max_read_page,
        "cover_style": book.cover_style,
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