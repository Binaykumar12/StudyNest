import enum


class CDCDocumentType(str, enum.Enum):
    CURRICULUM = "curriculum"
    TEXTBOOK = "textbook"
    TEACHER_GUIDE = "teacher_guide"
    SPEC_GRID = "spec_grid"


class CDCDocumentStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"


class GeneratedContentType(str, enum.Enum):
    NOTES = "notes"
    QUIZ = "quiz"
    TEST = "test"
    PAPER = "paper"
    PPT = "ppt"


class UserRole(str, enum.Enum):
    STUDENT = "student"
    ADMIN = "admin"
