from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Book, Profile, ProfileTitle
from schemas.profile import (
    EquipTitleResponse,
    ProfileResponse,
    ProfileTitleResponse,
    ProfileUpdate,
)

router = APIRouter(
    prefix="/profile",
    tags=["profile"],
)


def get_or_create_profile(db: Session) -> Profile:
    profile = db.query(Profile).first()

    if profile is not None:
        return profile

    profile = Profile(
        name="무명",
        sect="무소속",
        position="무직책",
    )

    try:
        db.add(profile)
        db.commit()
        db.refresh(profile)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to create profile",
        )

    return profile


def check_and_award_titles(
    db: Session,
    profile: Profile,
):
    total_books = db.query(Book).count()

    completed_books = (
        db.query(Book).filter(Book.max_read_page >= Book.total_pages).count()
    )

    total_read_pages = sum(book.max_read_page for book in db.query(Book).all())

    title_conditions = [
        {
            "key": "book_collector",
            "condition": total_books >= 5,
        },
        {
            "key": "book_sage",
            "condition": total_read_pages >= 10000,
        },
        {
            "key": "reading_master",
            "condition": completed_books >= 10,
        },
        {
            "key": "ten_thousand_library",
            "condition": total_books >= 30,
        },
        {
            "key": "murim_leader",
            "condition": (
                total_books >= 50
                and completed_books >= 20
                and total_read_pages >= 20000
            ),
        },
    ]

    for title_data in title_conditions:
        if not title_data["condition"]:
            continue

        existing_title = (
            db.query(ProfileTitle)
            .filter(
                ProfileTitle.profile_id == profile.id,
                ProfileTitle.title_key == title_data["key"],
            )
            .first()
        )

        if existing_title is not None:
            continue

        new_title = ProfileTitle(
            profile_id=profile.id,
            title_key=title_data["key"],
            is_seen=False,
            is_equipped=False,
        )

        db.add(new_title)

    try:
        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to award titles",
        )


@router.get(
    "",
    response_model=ProfileResponse,
)
def get_profile(
    db: Session = Depends(get_db),
):
    return get_or_create_profile(db)


@router.patch(
    "",
    response_model=ProfileResponse,
)
def update_profile(
    update: ProfileUpdate,
    db: Session = Depends(get_db),
):
    profile = get_or_create_profile(db)

    profile.name = update.name.strip()
    profile.sect = update.sect.strip()
    profile.position = update.position.strip()

    if not profile.name:
        raise HTTPException(
            status_code=400,
            detail="Name is required",
        )

    if not profile.sect:
        raise HTTPException(
            status_code=400,
            detail="Sect is required",
        )

    try:
        db.commit()
        db.refresh(profile)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to update profile",
        )

    return profile


@router.get(
    "/titles",
    response_model=list[ProfileTitleResponse],
)
def get_profile_titles(
    db: Session = Depends(get_db),
):
    profile = get_or_create_profile(db)

    check_and_award_titles(db, profile)

    titles = (
        db.query(ProfileTitle)
        .filter(ProfileTitle.profile_id == profile.id)
        .order_by(ProfileTitle.acquired_at.desc())
        .all()
    )

    return titles


@router.get(
    "/titles/unseen",
    response_model=list[ProfileTitleResponse],
)
def get_unseen_profile_titles(
    db: Session = Depends(get_db),
):
    profile = get_or_create_profile(db)

    check_and_award_titles(db, profile)

    titles = (
        db.query(ProfileTitle)
        .filter(
            ProfileTitle.profile_id == profile.id,
            ProfileTitle.is_seen.is_(False),
        )
        .order_by(ProfileTitle.acquired_at.asc())
        .all()
    )

    return titles


@router.patch(
    "/titles/{title_key}/seen",
    response_model=ProfileTitleResponse,
)
def mark_profile_title_as_seen(
    title_key: str,
    db: Session = Depends(get_db),
):
    profile = get_or_create_profile(db)

    title = (
        db.query(ProfileTitle)
        .filter(
            ProfileTitle.profile_id == profile.id,
            ProfileTitle.title_key == title_key,
        )
        .first()
    )

    if title is None:
        raise HTTPException(
            status_code=404,
            detail="Title not owned",
        )

    title.is_seen = True

    try:
        db.commit()
        db.refresh(title)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to mark title as seen",
        )

    return title


@router.patch(
    "/titles/{title_key}/equip",
    response_model=EquipTitleResponse,
)
def equip_profile_title(
    title_key: str,
    db: Session = Depends(get_db),
):
    profile = get_or_create_profile(db)

    titles = db.query(ProfileTitle).filter(ProfileTitle.profile_id == profile.id).all()

    selected_title = None

    for title in titles:
        if title.title_key == title_key:
            selected_title = title

    if selected_title is None:
        raise HTTPException(
            status_code=404,
            detail="Title not owned",
        )

    for title in titles:
        title.is_equipped = title.id == selected_title.id

    try:
        db.commit()
        db.refresh(selected_title)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to equip title",
        )

    return {
        "title_key": selected_title.title_key,
        "is_equipped": selected_title.is_equipped,
    }
