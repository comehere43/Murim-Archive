import hashlib

from pathlib import Path
from uuid import uuid4

import fitz
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
    contents = await file.read()

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

    pdf = fitz.open(stream=contents, filetype="pdf")
    total_pages = pdf.page_count
    pdf.close()

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
