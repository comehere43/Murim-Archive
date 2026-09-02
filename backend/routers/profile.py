from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import (
    Book,
    BookCompletionEvent,
    Profile,
    ProfileRealmEvent,
    ProfileTitle,
)
from realm_definitions import REALM_DEFINITIONS
from schemas.profile import (
    EquipTitleResponse,
    ProfileResponse,
    ProfileTitleResponse,
    ProfileRealmEventResponse,
    ProfileRealmResponse,
    ProfileUpdate,
    BookCompletionEventResponse,
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
        db.query(Book).filter(Book.progress_page >= Book.total_pages).count()
    )

    total_read_pages = sum(book.progress_page for book in db.query(Book).all())

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


def check_and_award_realm_events(
    db: Session,
    profile: Profile,
):
    total_read_pages = sum(book.progress_page for book in db.query(Book).all())

    existing_realm_keys = {
        event.realm_key
        for event in (
            db.query(ProfileRealmEvent)
            .filter(ProfileRealmEvent.profile_id == profile.id)
            .all()
        )
    }

    for realm in REALM_DEFINITIONS:
        if realm["key"] == "third_rate":
            continue

        if total_read_pages < realm["min_pages"]:
            continue

        if realm["key"] in existing_realm_keys:
            continue

        new_event = ProfileRealmEvent(
            profile_id=profile.id,
            realm_key=realm["key"],
            is_seen=False,
        )

        db.add(new_event)

    try:
        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to award realm events",
        )


def calculate_realm_info(db: Session):
    total_read_pages = sum(book.progress_page for book in db.query(Book).all())

    current_index = 0

    for index, realm in enumerate(REALM_DEFINITIONS):
        if total_read_pages >= realm["min_pages"]:
            current_index = index
        else:
            break

    current_realm = REALM_DEFINITIONS[current_index]

    next_realm = (
        REALM_DEFINITIONS[current_index + 1]
        if current_index + 1 < len(REALM_DEFINITIONS)
        else None
    )

    if next_realm is None:
        progress = 100

    else:
        pages_in_current_realm = total_read_pages - current_realm["min_pages"]

        pages_needed_for_next_realm = (
            next_realm["min_pages"] - current_realm["min_pages"]
        )

        progress = int(pages_in_current_realm / pages_needed_for_next_realm * 100)

        progress = max(0, min(100, progress))

    return {
        "realm_key": current_realm["key"],
        "realm": current_realm["name"],
        "next_realm_key": (next_realm["key"] if next_realm else None),
        "next_realm": (next_realm["name"] if next_realm else None),
        "progress": progress,
        "total_read_pages": total_read_pages,
    }


def serialize_realm_event(event: ProfileRealmEvent):
    realm_name = next(
        (
            realm["name"]
            for realm in REALM_DEFINITIONS
            if realm["key"] == event.realm_key
        ),
        event.realm_key,
    )

    return {
        "id": event.id,
        "realm_key": event.realm_key,
        "realm_name": realm_name,
        "acquired_at": event.acquired_at,
        "is_seen": event.is_seen,
    }


def check_and_award_book_completion_events(
    db: Session,
    profile: Profile,
):
    completed_books = (
        db.query(Book).filter(Book.progress_page >= Book.total_pages).all()
    )

    existing_book_ids = {
        event.book_id
        for event in (
            db.query(BookCompletionEvent)
            .filter(BookCompletionEvent.profile_id == profile.id)
            .all()
        )
    }

    for book in completed_books:
        if book.id in existing_book_ids:
            continue

        new_event = BookCompletionEvent(
            profile_id=profile.id,
            book_id=book.id,
            is_seen=False,
        )

        db.add(new_event)

    try:
        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to award book completion events",
        )


def serialize_book_completion_event(
    db: Session,
    event: BookCompletionEvent,
):
    book = db.query(Book).filter(Book.id == event.book_id).first()

    return {
        "id": event.id,
        "book_id": event.book_id,
        "book_title": (book.display_title if book is not None else "알 수 없는 비급"),
        "acquired_at": event.acquired_at,
        "is_seen": event.is_seen,
    }


@router.get(
    "",
    response_model=ProfileResponse,
)
def get_profile(
    db: Session = Depends(get_db),
):
    return get_or_create_profile(db)


@router.get(
    "/realm",
    response_model=ProfileRealmResponse,
)
def get_profile_realm(
    db: Session = Depends(get_db),
):
    return calculate_realm_info(db)


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


@router.get(
    "/realms/unseen",
    response_model=list[ProfileRealmEventResponse],
)
def get_unseen_realm_events(
    db: Session = Depends(get_db),
):
    profile = get_or_create_profile(db)

    check_and_award_realm_events(db, profile)

    events = (
        db.query(ProfileRealmEvent)
        .filter(
            ProfileRealmEvent.profile_id == profile.id,
            ProfileRealmEvent.is_seen.is_(False),
        )
        .order_by(ProfileRealmEvent.acquired_at.asc())
        .all()
    )

    return [serialize_realm_event(event) for event in events]


@router.patch(
    "/realms/{realm_key}/seen",
    response_model=ProfileRealmEventResponse,
)
def mark_realm_event_as_seen(
    realm_key: str,
    db: Session = Depends(get_db),
):
    profile = get_or_create_profile(db)

    event = (
        db.query(ProfileRealmEvent)
        .filter(
            ProfileRealmEvent.profile_id == profile.id,
            ProfileRealmEvent.realm_key == realm_key,
        )
        .first()
    )

    if event is None:
        raise HTTPException(
            status_code=404,
            detail="Realm event not found",
        )

    event.is_seen = True

    try:
        db.commit()
        db.refresh(event)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to mark realm event as seen",
        )

    return serialize_realm_event(event)


@router.get(
    "/completions/unseen",
    response_model=list[BookCompletionEventResponse],
)
def get_unseen_book_completion_events(
    db: Session = Depends(get_db),
):
    profile = get_or_create_profile(db)

    check_and_award_book_completion_events(db, profile)

    events = (
        db.query(BookCompletionEvent)
        .filter(
            BookCompletionEvent.profile_id == profile.id,
            BookCompletionEvent.is_seen.is_(False),
        )
        .order_by(BookCompletionEvent.acquired_at.asc())
        .all()
    )

    return [serialize_book_completion_event(db, event) for event in events]


@router.patch(
    "/completions/{book_id}/seen",
    response_model=BookCompletionEventResponse,
)
def mark_book_completion_event_as_seen(
    book_id: int,
    db: Session = Depends(get_db),
):
    profile = get_or_create_profile(db)

    event = (
        db.query(BookCompletionEvent)
        .filter(
            BookCompletionEvent.profile_id == profile.id,
            BookCompletionEvent.book_id == book_id,
        )
        .first()
    )

    if event is None:
        raise HTTPException(
            status_code=404,
            detail="Book completion event not found",
        )

    event.is_seen = True

    try:
        db.commit()
        db.refresh(event)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to mark book completion event as seen",
        )

    return serialize_book_completion_event(db, event)
