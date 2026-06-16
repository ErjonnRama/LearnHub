from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional
import json
from datetime import datetime

from app.db.database import get_db
from app.models.models import (
    User, Course, Category, Enrollment, Review, Notification,
    Payment, ChatRoom, ChatMessage, AuditLog, Setting,
    EnrollmentStatus, PaymentStatus, CourseStatus
)
from app.schemas.schemas import (
    UserCreate, UserUpdate, UserOut, LoginRequest, TokenResponse, RefreshRequest,
    CourseCreate, CourseUpdate, CourseOut, CourseDetail,
    CategoryCreate, CategoryOut,
    EnrollmentOut, ReviewCreate, ReviewOut,
    NotificationOut, PaymentCreate, PaymentOut,
    ChatMessageOut, SearchFilters, PaginatedResponse,
    ReportRequest, AuditLogOut,
)
from app.services.auth_service import AuthService
from app.services.course_service import CourseService
from app.services.export_service import ExportService
from app.core.dependencies import get_current_user, require_role
from app.core.websocket_manager import manager

router = APIRouter()


# ══════════════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════════════
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])

@auth_router.post("/register", response_model=UserOut, status_code=201)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    return await AuthService.register(data, db)

@auth_router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await AuthService.login(data, db)

@auth_router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    return await AuthService.refresh(data.refresh_token, db)

@auth_router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user

@auth_router.put("/me", response_model=UserOut)
async def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return current_user


# ══════════════════════════════════════════════════════════════
# COURSES
# ══════════════════════════════════════════════════════════════
course_router = APIRouter(prefix="/courses", tags=["Courses"])

@course_router.get("", response_model=PaginatedResponse)
async def list_courses(
    q: Optional[str] = None,
    category_id: Optional[int] = None,
    level: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    language: Optional[str] = None,
    min_rating: Optional[float] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db),
):
    filters = SearchFilters(
        q=q, category_id=category_id, level=level,
        min_price=min_price, max_price=max_price,
        language=language, min_rating=min_rating,
        sort_by=sort_by, sort_order=sort_order,
        page=page, page_size=page_size,
    )
    result = await CourseService.get_all(filters, db)
    return {
        "items": [CourseOut.model_validate(c) for c in result.items],
        "total": result.total,
        "page": result.page,
        "page_size": result.page_size,
        "total_pages": result.total_pages,
    }

@course_router.get("/popular")
async def popular_courses(limit: int = 10, db: AsyncSession = Depends(get_db)):
    courses = await CourseService.get_popular(limit, db)
    return [CourseOut.model_validate(c) for c in courses]

@course_router.get("/{course_id}", response_model=CourseDetail)
async def get_course(course_id: int, db: AsyncSession = Depends(get_db)):
    return await CourseService.get_by_id(course_id, db)

@course_router.post("", response_model=CourseOut, status_code=201)
async def create_course(
    data: CourseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await CourseService.create(data, current_user.id, db)

@course_router.put("/{course_id}", response_model=CourseOut)
async def update_course(
    course_id: int,
    data: CourseUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await CourseService.update(course_id, data, current_user.id, db)

@course_router.delete("/{course_id}", status_code=204)
async def delete_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await CourseService.delete(course_id, current_user.id, db)


# ══════════════════════════════════════════════════════════════
# CATEGORIES
# ══════════════════════════════════════════════════════════════
category_router = APIRouter(prefix="/categories", tags=["Categories"])

# Public CMS content — no auth, used by the homepage (CMS feature)
settings_router = APIRouter(prefix="/settings", tags=["CMS"])

@settings_router.get("/public")
async def public_settings(db: AsyncSession = Depends(get_db)):
    """Public site content managed by the CMS admin panel (hero text, tagline, etc.)."""
    result = await db.execute(select(Setting))
    return {s.key: s.value for s in result.scalars().all()}

@category_router.get("", response_model=list[CategoryOut])
async def list_categories(q: str | None = None, db: AsyncSession = Depends(get_db)):
    """List categories. Advanced search: name/description text search."""
    stmt = select(Category).where(Category.is_active == True)
    if q:
        like = f"%{q}%"
        stmt = stmt.where((Category.name.ilike(like)) | (Category.description.ilike(like)))
    result = await db.execute(stmt.order_by(Category.name))
    return result.scalars().all()

@category_router.post("", response_model=CategoryOut, status_code=201)
async def create_category(
    data: CategoryCreate,
    _: User = Depends(require_role("Admin")),
    db: AsyncSession = Depends(get_db),
):
    cat = Category(**data.model_dump())
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat


# ══════════════════════════════════════════════════════════════
# ENROLLMENTS
# ══════════════════════════════════════════════════════════════
enrollment_router = APIRouter(prefix="/enrollments", tags=["Enrollments"])

@enrollment_router.post("/{course_id}", response_model=EnrollmentOut, status_code=201)
async def enroll(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(Enrollment).where(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == course_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already enrolled")

    enrollment = Enrollment(student_id=current_user.id, course_id=course_id)
    db.add(enrollment)

    # Notify via WebSocket
    await manager.send_notification(current_user.id, {
        "type": "enrollment",
        "message": f"You enrolled in course #{course_id}",
        "timestamp": datetime.now().isoformat(),
    })

    await db.commit()
    await db.refresh(enrollment)
    return enrollment

@enrollment_router.get("/my", response_model=list[EnrollmentOut])
async def my_enrollments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Enrollment)
        .options(selectinload(Enrollment.course).selectinload(Course.category))
        .where(Enrollment.student_id == current_user.id)
        .order_by(Enrollment.enrolled_at.desc())
    )
    return result.scalars().all()


# ══════════════════════════════════════════════════════════════
# REVIEWS
# ══════════════════════════════════════════════════════════════
review_router = APIRouter(prefix="/reviews", tags=["Reviews"])

@review_router.post("/{course_id}", response_model=ReviewOut, status_code=201)
async def add_review(
    course_id: int,
    data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    review = Review(
        course_id=course_id, student_id=current_user.id,
        is_approved=True,  # auto-approve; admin can moderate later
        **data.model_dump(),
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review

@review_router.get("/{course_id}", response_model=list[ReviewOut])
async def get_reviews(
    course_id: int,
    q: str | None = None,
    min_rating: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    """List reviews for a course. Advanced search: filter by comment text and min rating."""
    stmt = (
        select(Review)
        .options(selectinload(Review.student))
        .where(Review.course_id == course_id, Review.is_approved == True)
    )
    if q:
        stmt = stmt.where(Review.comment.ilike(f"%{q}%"))
    if min_rating:
        stmt = stmt.where(Review.rating >= min_rating)
    result = await db.execute(stmt.order_by(Review.created_at.desc()))
    return result.scalars().all()


# ══════════════════════════════════════════════════════════════
# NOTIFICATIONS
# ══════════════════════════════════════════════════════════════
notif_router = APIRouter(prefix="/notifications", tags=["Notifications"])

@notif_router.get("", response_model=list[NotificationOut])
async def my_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()

@notif_router.put("/{notif_id}/read", status_code=204)
async def mark_read(
    notif_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    notif = await db.get(Notification, notif_id)
    if notif and notif.user_id == current_user.id:
        notif.is_read = True
        await db.commit()


# ══════════════════════════════════════════════════════════════
# EXPORT / IMPORT (Additional Feature)
# ══════════════════════════════════════════════════════════════
export_router = APIRouter(prefix="/export", tags=["Export & Import"])

@export_router.get("/{list_name}")
async def export_list(
    list_name: str,
    format: str = Query(default="csv", enum=["csv", "excel", "json"]),
    _: User = Depends(require_role("Admin", "Manager")),
    db: AsyncSession = Depends(get_db),
):
    return await ExportService.export_data(list_name, format, db)

@export_router.post("/import/courses")
async def import_courses(
    file: UploadFile = File(...),
    _: User = Depends(require_role("Admin")),
    db: AsyncSession = Depends(get_db),
):
    content = await file.read()
    result = await ExportService.import_courses_csv(content, db)
    return result


# ══════════════════════════════════════════════════════════════
# ADMIN
# ══════════════════════════════════════════════════════════════
admin_router = APIRouter(prefix="/admin", tags=["Admin"])

@admin_router.get("/stats")
async def dashboard_stats(
    _: User = Depends(require_role("Admin")),
    db: AsyncSession = Depends(get_db),
):
    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    total_courses = (await db.execute(select(func.count(Course.id)))).scalar()
    total_enrollments = (await db.execute(select(func.count(Enrollment.id)))).scalar()
    total_revenue = (await db.execute(
        select(func.sum(Payment.amount)).where(Payment.status == PaymentStatus.succeeded)
    )).scalar() or 0

    return {
        "total_users": total_users,
        "total_courses": total_courses,
        "total_enrollments": total_enrollments,
        "total_revenue": total_revenue,
        "online_users": len(manager.get_online_users()),
    }

@admin_router.get("/users", response_model=list[UserOut])
async def list_users(
    page: int = 1,
    page_size: int = 20,
    q: str | None = None,
    is_active: bool | None = None,
    _: User = Depends(require_role("Admin")),
    db: AsyncSession = Depends(get_db),
):
    """List users. Advanced search: name/email text search + active filter."""
    stmt = select(User)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            (User.first_name.ilike(like)) | (User.last_name.ilike(like)) | (User.email.ilike(like))
        )
    if is_active is not None:
        stmt = stmt.where(User.is_active == is_active)
    offset = (page - 1) * page_size
    result = await db.execute(stmt.order_by(User.id).offset(offset).limit(page_size))
    return result.scalars().all()

@admin_router.get("/audit-logs", response_model=list[AuditLogOut])
async def audit_logs(
    q: str | None = None,
    entity: str | None = None,
    _: User = Depends(require_role("Admin")),
    db: AsyncSession = Depends(get_db),
):
    """List audit logs. Advanced search: action text + entity filter."""
    stmt = select(AuditLog)
    if q:
        stmt = stmt.where(AuditLog.action.ilike(f"%{q}%"))
    if entity:
        stmt = stmt.where(AuditLog.entity == entity)
    result = await db.execute(stmt.order_by(AuditLog.created_at.desc()).limit(100))
    return result.scalars().all()

@admin_router.get("/settings")
async def get_settings(_: User = Depends(require_role("Admin")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Setting))
    return {s.key: s.value for s in result.scalars().all()}

@admin_router.put("/settings/{key}")
async def update_setting(
    key: str,
    payload: dict,
    _: User = Depends(require_role("Admin")),
    db: AsyncSession = Depends(get_db),
):
    value = payload.get("value", "")
    result = await db.execute(select(Setting).where(Setting.key == key))
    setting = result.scalar_one_or_none()
    if setting:
        setting.value = value
    else:
        db.add(Setting(key=key, value=value, description=f"CMS: {key}"))
    await db.commit()
    return {"key": key, "value": value}


# ══════════════════════════════════════════════════════════════
# WEBSOCKET - Chat (Real-Time)
# ══════════════════════════════════════════════════════════════
ws_router = APIRouter(prefix="/ws", tags=["WebSocket"])

@ws_router.websocket("/chat/{room_id}")
async def websocket_chat(websocket: WebSocket, room_id: int, user_id: int = 0):
    await manager.connect_chat(websocket, room_id, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            payload = {
                "type": "chat",
                "room_id": room_id,
                "sender_id": user_id,
                "content": msg.get("content", ""),
                "timestamp": datetime.now().isoformat(),
            }
            await manager.broadcast_to_room(room_id, payload)
    except WebSocketDisconnect:
        manager.disconnect_chat(websocket, room_id)
        await manager.broadcast_to_room(room_id, {
            "type": "system",
            "message": f"User {user_id} left the room",
            "timestamp": datetime.now().isoformat(),
        })


@ws_router.websocket("/notifications/{user_id}")
async def websocket_notifications(websocket: WebSocket, user_id: int):
    await manager.connect_notifications(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()  # keep alive
    except WebSocketDisconnect:
        manager.disconnect_notifications(user_id)


# ══════════════════════════════════════════════════════════════
# PAYMENTS (Stripe - Additional Feature)
# ══════════════════════════════════════════════════════════════
payment_router = APIRouter(prefix="/payments", tags=["Payments"])

@payment_router.post("/checkout", response_model=PaymentOut)
async def checkout(
    data: PaymentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    course = await db.get(Course, data.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    payment = Payment(
        user_id=current_user.id,
        course_id=data.course_id,
        amount=course.price,
        status=PaymentStatus.pending,
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)

    # In production: call Stripe here and update payment with intent ID
    payment.status = PaymentStatus.succeeded
    await db.commit()
    await db.refresh(payment)

    # Auto-enroll after payment
    existing = await db.execute(
        select(Enrollment).where(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == data.course_id,
        )
    )
    if not existing.scalar_one_or_none():
        db.add(Enrollment(student_id=current_user.id, course_id=data.course_id))
        await db.commit()

    return payment


# ══════════════════════════════════════════════════════════════
# COLLECT ALL ROUTERS
# ══════════════════════════════════════════════════════════════
def include_all_routers(app):
    prefix = "/api/v1"
    app.include_router(auth_router, prefix=prefix)
    app.include_router(course_router, prefix=prefix)
    app.include_router(category_router, prefix=prefix)
    app.include_router(settings_router, prefix=prefix)
    app.include_router(enrollment_router, prefix=prefix)
    app.include_router(review_router, prefix=prefix)
    app.include_router(notif_router, prefix=prefix)
    app.include_router(export_router, prefix=prefix)
    app.include_router(admin_router, prefix=prefix)
    app.include_router(payment_router, prefix=prefix)
    app.include_router(ws_router)
