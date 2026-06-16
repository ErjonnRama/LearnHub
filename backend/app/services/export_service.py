import io
import json
from datetime import datetime
from typing import Any

import pandas as pd
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.models.models import Course, Enrollment, User, Review, Payment, Category, AuditLog


class ExportService:
    """Data Exporting and Importing for 5+ lists (Additional Feature)"""

    SUPPORTED_LISTS = ["courses", "enrollments", "users", "reviews", "payments", "categories", "audit_logs"]

    @staticmethod
    async def export_data(list_name: str, format: str, db: AsyncSession) -> StreamingResponse:
        if list_name not in ExportService.SUPPORTED_LISTS:
            raise HTTPException(status_code=400, detail=f"Unsupported list. Choose from: {ExportService.SUPPORTED_LISTS}")

        rows = await ExportService._fetch_rows(list_name, db)
        df = pd.DataFrame(rows)

        filename = f"{list_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        if format == "csv":
            output = io.StringIO()
            df.to_csv(output, index=False)
            output.seek(0)
            return StreamingResponse(
                iter([output.getvalue()]),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename={filename}.csv"},
            )
        elif format == "excel":
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, sheet_name=list_name)
            output.seek(0)
            return StreamingResponse(
                iter([output.getvalue()]),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename={filename}.xlsx"},
            )
        elif format == "json":
            return StreamingResponse(
                iter([df.to_json(orient="records", date_format="iso")]),
                media_type="application/json",
                headers={"Content-Disposition": f"attachment; filename={filename}.json"},
            )
        else:
            raise HTTPException(status_code=400, detail="Format must be csv, excel, or json")

    @staticmethod
    async def _fetch_rows(list_name: str, db: AsyncSession) -> list[dict]:
        if list_name == "courses":
            result = await db.execute(
                select(
                    Course.id, Course.title, Course.level, Course.price,
                    Course.num_subscribers, Course.avg_rating, Course.num_reviews,
                    Course.language, Course.status, Course.created_at,
                    Category.name.label("category"),
                )
                .join(Category, Course.category_id == Category.id)
                .order_by(Course.id)
            )
            return [dict(r._mapping) for r in result.fetchall()]

        elif list_name == "enrollments":
            result = await db.execute(
                select(
                    Enrollment.id, Enrollment.student_id, Enrollment.course_id,
                    Enrollment.status, Enrollment.progress_percent,
                    Enrollment.enrolled_at, Enrollment.completed_at,
                )
            )
            return [dict(r._mapping) for r in result.fetchall()]

        elif list_name == "users":
            result = await db.execute(
                select(
                    User.id, User.first_name, User.last_name, User.email,
                    User.is_active, User.created_at,
                )
            )
            return [dict(r._mapping) for r in result.fetchall()]

        elif list_name == "reviews":
            result = await db.execute(
                select(
                    Review.id, Review.course_id, Review.student_id,
                    Review.rating, Review.comment, Review.is_approved, Review.created_at,
                )
            )
            return [dict(r._mapping) for r in result.fetchall()]

        elif list_name == "payments":
            result = await db.execute(
                select(
                    Payment.id, Payment.user_id, Payment.course_id,
                    Payment.amount, Payment.currency, Payment.status, Payment.created_at,
                )
            )
            return [dict(r._mapping) for r in result.fetchall()]

        elif list_name == "categories":
            result = await db.execute(
                select(Category.id, Category.name, Category.slug, Category.is_active)
            )
            return [dict(r._mapping) for r in result.fetchall()]

        elif list_name == "audit_logs":
            result = await db.execute(
                select(
                    AuditLog.id, AuditLog.user_id, AuditLog.action,
                    AuditLog.entity, AuditLog.entity_id, AuditLog.ip_address, AuditLog.created_at,
                ).order_by(AuditLog.created_at.desc()).limit(5000)
            )
            return [dict(r._mapping) for r in result.fetchall()]

        return []

    @staticmethod
    async def import_courses_csv(file_content: bytes, db: AsyncSession) -> dict:
        """Import courses from CSV (Kaggle dataset format)"""
        try:
            df = pd.read_csv(io.BytesIO(file_content))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid CSV: {e}")

        imported = 0
        skipped = 0
        for _, row in df.iterrows():
            try:
                title = str(row.get("course_title", row.get("title", "")))
                if not title or len(title) < 3:
                    skipped += 1
                    continue

                # Check duplicate slug
                import re
                slug = re.sub(r"[^a-z0-9]+", "-", title.lower())[:290]
                existing = await db.execute(select(Course).where(Course.slug == slug))
                if existing.scalar_one_or_none():
                    skipped += 1
                    continue

                # Get or create category
                cat_name = str(row.get("subject", row.get("category", "General")))
                cat_result = await db.execute(select(Category).where(Category.name == cat_name))
                category = cat_result.scalar_one_or_none()
                if not category:
                    cat_slug = re.sub(r"[^a-z0-9]+", "-", cat_name.lower())
                    category = Category(name=cat_name, slug=cat_slug)
                    db.add(category)
                    await db.flush()

                price = float(row.get("price", 0) or 0)
                level_raw = str(row.get("level", "all_levels")).lower().replace(" ", "_")
                from app.models.models import CourseLevel
                level = CourseLevel.all_levels if "all" in level_raw else (
                    CourseLevel.beginner if "beginner" in level_raw else (
                        CourseLevel.intermediate if "intermediate" in level_raw else CourseLevel.advanced
                    )
                )

                course = Course(
                    title=title[:255],
                    slug=slug,
                    description=str(row.get("headline", title))[:2000],
                    price=price,
                    level=level,
                    status=CourseStatus.published,
                    duration_hours=float(row.get("content_length_min", 0) or 0) / 60,
                    num_subscribers=int(row.get("num_subscribers", 0) or 0),
                    avg_rating=float(row.get("avg_rating", 0) or 0),
                    num_reviews=int(row.get("num_reviews", 0) or 0),
                    language=str(row.get("language", "en"))[:10],
                    category_id=category.id,
                    instructor_id=1,  # system instructor
                )
                db.add(course)
                imported += 1

                if imported % 500 == 0:
                    await db.flush()

            except Exception:
                skipped += 1
                continue

        await db.commit()
        return {"imported": imported, "skipped": skipped}
