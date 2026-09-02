import hashlib
import re


from pathlib import Path
from uuid import uuid4

import pymupdf
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from database import get_db
from config import UPLOAD_DIR
from models import Book
from schemas.books import (
    PositionUpdate,
    ProgressPageUpdate,
    BookUpdate,
    BookResponse,
    ProgressPageResponse,
    PositionResponse,
    DeleteBookResponse,
)

router = APIRouter(
    prefix="/books",
    tags=["books"],
)


MAX_FILE_SIZE = 100 * 1024 * 1024
HEX_COLOR_PATTERN = re.compile(r"^#[0-9A-Fa-f]{6}$")


@router.post(
    "",
    response_model=BookResponse,
)
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

    contents = await file.read(MAX_FILE_SIZE + 1)

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
        with pymupdf.open(
            stream=contents,
            filetype="pdf",
        ) as pdf:
            total_pages = pdf.page_count

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

    stored_filename = f"{uuid4()}.pdf"

    storage_path = UPLOAD_DIR / stored_filename
    file_path = f"uploads/{stored_filename}"

    book = Book(
        original_title=original_title,
        source_description=source_description,
        display_title=display_title,
        title_mode=title_mode,
        original_filename=file.filename or stored_filename,
        file_path=file_path,
        file_hash=file_hash,
        total_pages=total_pages,
        current_page=1,
        max_read_page=1,
        progress_page=1,
        cover_style=cover_style,
        cover_color=cover_color,
    )

    try:
        storage_path.write_bytes(contents)

        db.add(book)
        db.commit()
        db.refresh(book)

    except Exception:
        db.rollback()

        if storage_path.exists():
            storage_path.unlink()

        raise HTTPException(
            status_code=500,
            detail="Failed to save book",
        )

    return book


@router.get(
    "",
    response_model=list[BookResponse],
)
def get_books(
    db: Session = Depends(get_db),
):
    books = db.query(Book).order_by(Book.created_at.desc()).all()

    return books


@router.get(
    "/{book_id}",
    response_model=BookResponse,
)
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

    return book


@router.patch(
    "/{book_id}/progress",
    response_model=ProgressPageResponse,
)
def update_book_progress(
    book_id: int,
    progress: ProgressPageUpdate,
    db: Session = Depends(get_db),
):
    book = db.query(Book).filter(Book.id == book_id).first()

    if book is None:
        raise HTTPException(
            status_code=404,
            detail="Book not found",
        )

    if progress.progress_page < 1:
        raise HTTPException(
            status_code=400,
            detail="Invalid page number",
        )

    if progress.progress_page > book.total_pages:
        raise HTTPException(
            status_code=400,
            detail="Page exceeds total pages",
        )

    book.progress_page = progress.progress_page

    # 기존 max_read_page는 당분간 호환용으로 유지
    if progress.progress_page > book.max_read_page:
        book.max_read_page = progress.progress_page

    try:
        db.commit()
        db.refresh(book)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to save reading progress",
        )

    return {
        "id": book.id,
        "progress_page": book.progress_page,
    }


@router.patch(
    "/{book_id}/position",
    response_model=PositionResponse,
)
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

    try:
        db.commit()
        db.refresh(book)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to save reading position",
        )

    return {
        "id": book.id,
        "current_page": book.current_page,
    }


@router.patch(
    "/{book_id}",
    response_model=BookResponse,
)
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

    try:
        db.commit()
        db.refresh(book)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to update book",
        )

    return book


@router.delete(
    "/{book_id}",
    response_model=DeleteBookResponse,
)
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

    file_path = UPLOAD_DIR / Path(book.file_path).name

    try:
        if file_path.exists():
            file_path.unlink()

        db.delete(book)
        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to delete book",
        )

    return {
        "message": "Book deleted successfully",
        "id": book_id,
    }
