from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    original_title: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    source_description: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )

    display_title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    title_mode: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    original_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    file_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    file_hash: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        index=True,
    )

    total_pages: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    current_page: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )

    max_read_page: Mapped[int] = mapped_column(
        Integer,
        default=1,
        server_default="1",
        nullable=False,
    )

    progress_page: Mapped[int] = mapped_column(
        Integer,
        default=1,
        server_default="1",
        nullable=False,
    )

    cover_style: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    cover_color: Mapped[str | None] = mapped_column(
        String(7),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        onupdate=datetime.now,
        nullable=False,
    )


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(
        String(100),
        nullable=False,
        default="무명",
    )

    sect = Column(
        String(100),
        nullable=False,
        default="무소속",
    )

    position = Column(
        String(100),
        nullable=False,
        default="무직책",
    )


class ProfileTitle(Base):
    __tablename__ = "profile_titles"

    __table_args__ = (
        UniqueConstraint(
            "profile_id",
            "title_key",
            name="uq_profile_title",
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    profile_id = Column(
        Integer,
        ForeignKey("profiles.id"),
        nullable=False,
        index=True,
    )

    title_key = Column(
        String(100),
        nullable=False,
    )

    acquired_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    is_seen = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    is_equipped = Column(
        Boolean,
        nullable=False,
        default=False,
    )


class ProfileRealmEvent(Base):
    __tablename__ = "profile_realm_events"

    __table_args__ = (
        UniqueConstraint(
            "profile_id",
            "realm_key",
            name="uq_profile_realm_event",
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    profile_id = Column(
        Integer,
        ForeignKey("profiles.id"),
        nullable=False,
        index=True,
    )

    realm_key = Column(
        String(100),
        nullable=False,
    )

    acquired_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    is_seen = Column(
        Boolean,
        nullable=False,
        default=False,
    )


class BookCompletionEvent(Base):
    __tablename__ = "book_completion_events"

    __table_args__ = (
        UniqueConstraint(
            "book_id",
            name="uq_book_completion_event_book",
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    profile_id = Column(
        Integer,
        ForeignKey("profiles.id"),
        nullable=False,
        index=True,
    )

    book_id = Column(
        Integer,
        ForeignKey("books.id"),
        nullable=False,
        index=True,
    )

    acquired_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    is_seen = Column(
        Boolean,
        nullable=False,
        default=False,
    )
