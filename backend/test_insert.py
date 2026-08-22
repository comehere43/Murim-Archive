from database import SessionLocal
from models import Book

db = SessionLocal()

try:
    book = Book(
        original_title="Web Programming",
        display_title="전서천서록",
        title_mode="manual",
        original_filename="web_programming.pdf",
        file_path="uploads/web_programming.pdf",
        total_pages=426,
        current_page=1,
        cover_style="navy",
    )

    db.add(book)
    db.commit()
    db.refresh(book)

    print(f"Book created: id={book.id}, title={book.display_title}")

finally:
    db.close()