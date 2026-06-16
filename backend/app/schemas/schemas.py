from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, field_validator
from app.models.models import CourseLevel, CourseStatus, EnrollmentStatus, PaymentStatus, LessonType


# ── Auth / Users ───────────────────────────────────────────────
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str


class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class UserOut(UserBase):
    id: int
    is_active: bool
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserWithRoles(UserOut):
    roles: List[str] = []


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


# ── Categories ─────────────────────────────────────────────────
class CategoryCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None


class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


# ── Courses ────────────────────────────────────────────────────
class CourseCreate(BaseModel):
    title: str
    slug: str
    description: str
    short_description: Optional[str] = None
    price: float = 0.0
    level: CourseLevel = CourseLevel.beginner
    status: CourseStatus = CourseStatus.draft
    duration_hours: Optional[float] = None
    language: str = "en"
    category_id: int
    thumbnail_url: Optional[str] = None


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: Optional[float] = None
    level: Optional[CourseLevel] = None
    status: Optional[CourseStatus] = None
    duration_hours: Optional[float] = None
    thumbnail_url: Optional[str] = None


class CourseOut(BaseModel):
    id: int
    title: str
    slug: str
    description: str
    short_description: Optional[str] = None
    price: float
    level: CourseLevel
    status: CourseStatus
    duration_hours: Optional[float] = None
    language: str
    num_subscribers: int
    avg_rating: float
    num_reviews: int
    thumbnail_url: Optional[str] = None
    category_id: int
    instructor_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class CourseDetail(CourseOut):
    category: Optional[CategoryOut] = None
    instructor: Optional[UserOut] = None


# ── Modules & Lessons ──────────────────────────────────────────
class ModuleCreate(BaseModel):
    title: str
    description: Optional[str] = None
    order_index: int = 0


class ModuleOut(BaseModel):
    id: int
    course_id: int
    title: str
    description: Optional[str] = None
    order_index: int

    model_config = {"from_attributes": True}


class LessonCreate(BaseModel):
    title: str
    content: Optional[str] = None
    video_url: Optional[str] = None
    duration_minutes: Optional[int] = None
    type: LessonType = LessonType.video
    order_index: int = 0
    is_free_preview: bool = False


class LessonOut(BaseModel):
    id: int
    module_id: int
    title: str
    type: LessonType
    duration_minutes: Optional[int] = None
    is_free_preview: bool
    order_index: int

    model_config = {"from_attributes": True}


# ── Enrollments ────────────────────────────────────────────────
class EnrollmentOut(BaseModel):
    id: int
    student_id: int
    course_id: int
    status: EnrollmentStatus
    progress_percent: float
    enrolled_at: datetime
    completed_at: Optional[datetime] = None
    course: Optional[CourseOut] = None

    model_config = {"from_attributes": True}


# ── Reviews ────────────────────────────────────────────────────
class ReviewCreate(BaseModel):
    rating: int
    comment: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v: int) -> int:
        if not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5")
        return v


class ReviewOut(BaseModel):
    id: int
    course_id: int
    student_id: int
    rating: int
    comment: Optional[str] = None
    is_approved: bool
    created_at: datetime
    student: Optional[UserOut] = None

    model_config = {"from_attributes": True}


# ── Notifications ──────────────────────────────────────────────
class NotificationOut(BaseModel):
    id: int
    type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Payments ───────────────────────────────────────────────────
class PaymentCreate(BaseModel):
    course_id: int


class PaymentOut(BaseModel):
    id: int
    user_id: int
    course_id: int
    amount: float
    currency: str
    status: PaymentStatus
    stripe_payment_intent_id: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Chat ───────────────────────────────────────────────────────
class ChatMessageOut(BaseModel):
    id: int
    room_id: int
    sender_id: int
    content: str
    created_at: datetime
    sender: Optional[UserOut] = None

    model_config = {"from_attributes": True}


# ── Search ─────────────────────────────────────────────────────
class SearchFilters(BaseModel):
    q: Optional[str] = None
    category_id: Optional[int] = None
    level: Optional[CourseLevel] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    language: Optional[str] = None
    min_rating: Optional[float] = None
    sort_by: str = "created_at"
    sort_order: str = "desc"
    page: int = 1
    page_size: int = 20


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int


# ── Reports ────────────────────────────────────────────────────
class ReportRequest(BaseModel):
    report_type: str  # enrollment, revenue, courses, reviews, users
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    format: str = "json"  # json, csv, excel


# ── Audit ──────────────────────────────────────────────────────
class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    entity: str
    entity_id: Optional[int] = None
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
