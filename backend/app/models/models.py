"""
SQLAlchemy models — 10 mandatory + 14 domain tables = 24 total.
Domain: E-Learning / Course Platform (seeded from Udemy Kaggle dataset)
"""
from datetime import datetime
from typing import Optional
import enum

from sqlalchemy import (
    Boolean, DateTime, Enum, Float, ForeignKey, Index, Integer,
    String, Text, BigInteger, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


# ── MANDATORY 1: Users ─────────────────────────────────────────
class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    updated_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user_roles: Mapped[list["UserRole"]] = relationship("UserRole", back_populates="user", foreign_keys="UserRole.user_id")
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship("RefreshToken", back_populates="user")
    audit_logs: Mapped[list["AuditLog"]] = relationship("AuditLog", back_populates="user")
    notifications: Mapped[list["Notification"]] = relationship("Notification", back_populates="user")
    enrollments: Mapped[list["Enrollment"]] = relationship("Enrollment", back_populates="student", foreign_keys="Enrollment.student_id")
    instructor_courses: Mapped[list["Course"]] = relationship("Course", back_populates="instructor", foreign_keys="Course.instructor_id")
    payments: Mapped[list["Payment"]] = relationship("Payment", back_populates="user")
    files: Mapped[list["File"]] = relationship("File", back_populates="uploader", foreign_keys="File.uploaded_by")
    reviews: Mapped[list["Review"]] = relationship("Review", back_populates="student")
    messages_sent: Mapped[list["ChatMessage"]] = relationship("ChatMessage", back_populates="sender")
    lesson_progress: Mapped[list["LessonProgress"]] = relationship("LessonProgress", back_populates="student")

    __table_args__ = (Index("ix_users_email_active", "email", "is_active"),)


# ── MANDATORY 2: Roles ─────────────────────────────────────────
class Role(Base):
    __tablename__ = "roles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user_roles: Mapped[list["UserRole"]] = relationship("UserRole", back_populates="role")
    role_permissions: Mapped[list["RolePermission"]] = relationship("RolePermission", back_populates="role")


# ── MANDATORY 3: UserRoles ─────────────────────────────────────
class UserRole(Base):
    __tablename__ = "user_roles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    role_id: Mapped[int] = mapped_column(Integer, ForeignKey("roles.id"), nullable=False)
    assigned_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="user_roles", foreign_keys=[user_id])
    role: Mapped["Role"] = relationship("Role", back_populates="user_roles")

    __table_args__ = (Index("ix_user_roles_unique", "user_id", "role_id", unique=True),)


# ── MANDATORY 4: Permissions ───────────────────────────────────
class Permission(Base):
    __tablename__ = "permissions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255))

    role_permissions: Mapped[list["RolePermission"]] = relationship("RolePermission", back_populates="permission")


# ── MANDATORY 5: RolePermissions ───────────────────────────────
class RolePermission(Base):
    __tablename__ = "role_permissions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    role_id: Mapped[int] = mapped_column(Integer, ForeignKey("roles.id"), nullable=False)
    permission_id: Mapped[int] = mapped_column(Integer, ForeignKey("permissions.id"), nullable=False)

    role: Mapped["Role"] = relationship("Role", back_populates="role_permissions")
    permission: Mapped["Permission"] = relationship("Permission", back_populates="role_permissions")


# ── MANDATORY 6: RefreshTokens ─────────────────────────────────
class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens")


# ── MANDATORY 7: AuditLogs ─────────────────────────────────────
class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    old_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    new_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped[Optional["User"]] = relationship("User", back_populates="audit_logs")
    __table_args__ = (Index("ix_audit_logs_entity", "entity", "entity_id"),)


# ── MANDATORY 8: Notifications ─────────────────────────────────
class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="notifications")


# ── MANDATORY 9: Settings ──────────────────────────────────────
class Setting(Base):
    __tablename__ = "settings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255))
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


# ── MANDATORY 10: Files ────────────────────────────────────────
class File(Base):
    __tablename__ = "files"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    entity: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    mime_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    uploaded_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    uploader: Mapped["User"] = relationship("User", back_populates="files", foreign_keys=[uploaded_by])


# ── DOMAIN 1: Categories ───────────────────────────────────────
class Category(Base):
    __tablename__ = "categories"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    icon: Mapped[Optional[str]] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    updated_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    courses: Mapped[list["Course"]] = relationship("Course", back_populates="category")


# ── DOMAIN 2: Courses ──────────────────────────────────────────
class CourseLevel(str, enum.Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"
    all_levels = "all_levels"


class CourseStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    archived = "archived"


class Course(Base):
    __tablename__ = "courses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(300), unique=True, nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    short_description: Mapped[Optional[str]] = mapped_column(String(500))
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(500))
    price: Mapped[float] = mapped_column(Float, default=0.0)
    level: Mapped[CourseLevel] = mapped_column(Enum(CourseLevel), default=CourseLevel.beginner)
    status: Mapped[CourseStatus] = mapped_column(Enum(CourseStatus), default=CourseStatus.draft)
    duration_hours: Mapped[Optional[float]] = mapped_column(Float)
    language: Mapped[str] = mapped_column(String(10), default="en")
    num_subscribers: Mapped[int] = mapped_column(Integer, default=0)
    avg_rating: Mapped[float] = mapped_column(Float, default=0.0)
    num_reviews: Mapped[int] = mapped_column(Integer, default=0)
    category_id: Mapped[int] = mapped_column(Integer, ForeignKey("categories.id"), nullable=False)
    instructor_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    created_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    updated_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    category: Mapped["Category"] = relationship("Category", back_populates="courses")
    instructor: Mapped["User"] = relationship("User", back_populates="instructor_courses", foreign_keys=[instructor_id])
    modules: Mapped[list["Module"]] = relationship("Module", back_populates="course", cascade="all, delete-orphan")
    enrollments: Mapped[list["Enrollment"]] = relationship("Enrollment", back_populates="course")
    reviews: Mapped[list["Review"]] = relationship("Review", back_populates="course")
    tags: Mapped[list["CourseTag"]] = relationship("CourseTag", back_populates="course")

    __table_args__ = (Index("ix_courses_status_category", "status", "category_id"),)


# ── DOMAIN 3: Tags ─────────────────────────────────────────────
class Tag(Base):
    __tablename__ = "tags"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    course_tags: Mapped[list["CourseTag"]] = relationship("CourseTag", back_populates="tag")


# ── DOMAIN 4: CourseTags ───────────────────────────────────────
class CourseTag(Base):
    __tablename__ = "course_tags"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("courses.id"), nullable=False)
    tag_id: Mapped[int] = mapped_column(Integer, ForeignKey("tags.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    course: Mapped["Course"] = relationship("Course", back_populates="tags")
    tag: Mapped["Tag"] = relationship("Tag", back_populates="course_tags")

    __table_args__ = (Index("ix_course_tags_unique", "course_id", "tag_id", unique=True),)


# ── DOMAIN 5: Modules ──────────────────────────────────────────
class Module(Base):
    __tablename__ = "modules"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("courses.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    created_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    updated_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    course: Mapped["Course"] = relationship("Course", back_populates="modules")
    lessons: Mapped[list["Lesson"]] = relationship("Lesson", back_populates="module", cascade="all, delete-orphan")


# ── DOMAIN 6: Lessons ──────────────────────────────────────────
class LessonType(str, enum.Enum):
    video = "video"
    article = "article"
    quiz = "quiz"
    assignment = "assignment"


class Lesson(Base):
    __tablename__ = "lessons"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    module_id: Mapped[int] = mapped_column(Integer, ForeignKey("modules.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[Optional[str]] = mapped_column(Text)
    video_url: Mapped[Optional[str]] = mapped_column(String(500))
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer)
    type: Mapped[LessonType] = mapped_column(Enum(LessonType), default=LessonType.video)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    is_free_preview: Mapped[bool] = mapped_column(Boolean, default=False)
    created_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    updated_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    module: Mapped["Module"] = relationship("Module", back_populates="lessons")
    progress_records: Mapped[list["LessonProgress"]] = relationship("LessonProgress", back_populates="lesson")


# ── DOMAIN 7: Enrollments ──────────────────────────────────────
class EnrollmentStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    cancelled = "cancelled"


class Enrollment(Base):
    __tablename__ = "enrollments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("courses.id"), nullable=False)
    status: Mapped[EnrollmentStatus] = mapped_column(Enum(EnrollmentStatus), default=EnrollmentStatus.active)
    progress_percent: Mapped[float] = mapped_column(Float, default=0.0)
    enrolled_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    updated_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    student: Mapped["User"] = relationship("User", back_populates="enrollments", foreign_keys=[student_id])
    course: Mapped["Course"] = relationship("Course", back_populates="enrollments")

    __table_args__ = (Index("ix_enrollments_unique", "student_id", "course_id", unique=True),)


# ── DOMAIN 8: LessonProgress ───────────────────────────────────
class LessonProgress(Base):
    __tablename__ = "lesson_progress"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id: Mapped[int] = mapped_column(Integer, ForeignKey("lessons.id"), nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    watch_time_seconds: Mapped[int] = mapped_column(Integer, default=0)
    created_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    updated_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    student: Mapped["User"] = relationship("User", back_populates="lesson_progress")
    lesson: Mapped["Lesson"] = relationship("Lesson", back_populates="progress_records")

    __table_args__ = (Index("ix_lesson_progress_unique", "student_id", "lesson_id", unique=True),)


# ── DOMAIN 9: Reviews ──────────────────────────────────────────
class Review(Base):
    __tablename__ = "reviews"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("courses.id"), nullable=False)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[Optional[str]] = mapped_column(Text)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    updated_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    course: Mapped["Course"] = relationship("Course", back_populates="reviews")
    student: Mapped["User"] = relationship("User", back_populates="reviews")


# ── DOMAIN 10: Payments ────────────────────────────────────────
class PaymentStatus(str, enum.Enum):
    pending = "pending"
    succeeded = "succeeded"
    failed = "failed"
    refunded = "refunded"


class Payment(Base):
    __tablename__ = "payments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("courses.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), default=PaymentStatus.pending)
    stripe_payment_intent_id: Mapped[Optional[str]] = mapped_column(String(255))
    created_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    updated_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="payments")


# ── DOMAIN 11: ChatRooms ───────────────────────────────────────
class ChatRoom(Base):
    __tablename__ = "chat_rooms"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("courses.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    updated_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    messages: Mapped[list["ChatMessage"]] = relationship("ChatMessage", back_populates="room")


# ── DOMAIN 12: ChatMessages ────────────────────────────────────
class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    room_id: Mapped[int] = mapped_column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    sender_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    updated_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    room: Mapped["ChatRoom"] = relationship("ChatRoom", back_populates="messages")
    sender: Mapped["User"] = relationship("User", back_populates="messages_sent")

    __table_args__ = (Index("ix_chat_messages_room", "room_id", "created_at"),)


# ── DOMAIN 13: Coupons ─────────────────────────────────────────
class Coupon(Base):
    __tablename__ = "coupons"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    discount_percent: Mapped[float] = mapped_column(Float, nullable=False)
    max_uses: Mapped[int] = mapped_column(Integer, default=100)
    used_count: Mapped[int] = mapped_column(Integer, default=0)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    updated_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


# ── DOMAIN 14: Certificates ────────────────────────────────────
class Certificate(Base):
    __tablename__ = "certificates"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("courses.id"), nullable=False)
    certificate_url: Mapped[Optional[str]] = mapped_column(String(500))
    issued_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    created_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    updated_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (Index("ix_certificates_unique", "user_id", "course_id", unique=True),)
