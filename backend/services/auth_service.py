from uuid import UUID

from sqlalchemy.orm import Session

from core.security import hash_password, verify_password
from models.enums import UserRole
from models.user import User


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).one_or_none()


def register_user(db: Session, email: str, password: str) -> User:
    normalized_email = email.strip().lower()
    existing = get_user_by_email(db, normalized_email)
    if existing:
        raise ValueError("Email already registered")

    user = User(
        email=normalized_email,
        password_hash=hash_password(password),
        role=UserRole.STUDENT,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    normalized_email = email.strip().lower()
    user = get_user_by_email(db, normalized_email)
    if not user or not verify_password(password, user.password_hash):
        return None
    return user


def get_user_by_id(db: Session, user_id: UUID) -> User | None:
    return db.query(User).filter(User.id == user_id).one_or_none()
