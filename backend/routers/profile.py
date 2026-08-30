from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Profile
from schemas.profile import ProfileResponse, ProfileUpdate

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
