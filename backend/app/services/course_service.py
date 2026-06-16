import math
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException

from app.models.models import Course, Category, User, Enrollment, Review, CourseStatus
from app.schemas.schemas import CourseCreate, CourseUpdate, SearchFilters, PaginatedResponse


class CourseService:

    @staticmethod
    async def get_all(filters: SearchFilters, db: AsyncSession) -> PaginatedResponse:
        query = (
            select(Course)
            .options(selectinload(Course.category), selectinload(Course.instructor))
            .where(Course.status == CourseStatus.published)
        )

        # Advanced search filters (covers 5+ lists requirement)
        if filters.q:
            search = f"%{filters.q}%"
            query = query.where(
                or_(
                    Course.title.ilike(search),
                    Course.description.ilike(search),
                    Course.short_description.ilike(search),
                )
            )
        if filters.category_id:
            query = query.where(Course.category_id == filters.category_id)
        if filters.level:
            query = query.where(Course.level == filters.level)
        if filters.min_price is not None:
            query = query.where(Course.price >= filters.min_price)
        if filters.max_price is not None:
            query = query.where(Course.price <= filters.max_price)
        if filters.language:
            query = query.where(Course.language == filters.language)
        if filters.min_rating is not None:
            query = query.where(Course.avg_rating >= filters.min_rating)

        # Sorting
        sort_col = getattr(Course, filters.sort_by, Course.created_at)
        query = query.order_by(sort_col.desc() if filters.sort_order == "desc" else sort_col.asc())

        # Count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # Paginate
        offset = (filters.page - 1) * filters.page_size
        query = query.offset(offset).limit(filters.page_size)
        result = await db.execute(query)
        courses = result.scalars().all()

        return PaginatedResponse(
            items=courses,
            total=total,
            page=filters.page,
            page_size=filters.page_size,
            total_pages=math.ceil(total / filters.page_size) if total else 1,
        )

    @staticmethod
    async def get_by_id(course_id: int, db: AsyncSession) -> Course:
        result = await db.execute(
            select(Course)
            .options(
                selectinload(Course.category),
                selectinload(Course.instructor),
                selectinload(Course.modules),
            )
            .where(Course.id == course_id)
        )
        course = result.scalar_one_or_none()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        return course

    @staticmethod
    async def create(data: CourseCreate, instructor_id: int, db: AsyncSession) -> Course:
        # Verify category exists
        cat = await db.get(Category, data.category_id)
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")

        course = Course(**data.model_dump(), instructor_id=instructor_id, created_by=instructor_id)
        db.add(course)
        await db.commit()
        await db.refresh(course)
        return course

    @staticmethod
    async def update(course_id: int, data: CourseUpdate, user_id: int, db: AsyncSession) -> Course:
        course = await db.get(Course, course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        if course.instructor_id != user_id:
            raise HTTPException(status_code=403, detail="Not your course")

        for field, value in data.model_dump(exclude_none=True).items():
            setattr(course, field, value)
        course.updated_by = user_id
        await db.commit()
        await db.refresh(course)
        return course

    @staticmethod
    async def delete(course_id: int, user_id: int, db: AsyncSession):
        course = await db.get(Course, course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        await db.delete(course)
        await db.commit()

    @staticmethod
    async def get_popular(limit: int, db: AsyncSession) -> list[Course]:
        result = await db.execute(
            select(Course)
            .options(selectinload(Course.category), selectinload(Course.instructor))
            .where(Course.status == CourseStatus.published)
            .order_by(Course.num_subscribers.desc())
            .limit(limit)
        )
        return result.scalars().all()
