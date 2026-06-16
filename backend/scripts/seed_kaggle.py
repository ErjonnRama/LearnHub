"""
Seed script — populates PostgreSQL.
Default: 30+ rich sample courses across 8 categories.
Optional: place Udemy Kaggle CSV at backend/scripts/udemy_courses.csv to import 5,000 real courses.

Usage:
  python -m scripts.seed_kaggle
"""
import asyncio
import re
import sys
import os
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.database import Base
from app.models.models import (
    User, Role, UserRole, Permission, RolePermission,
    Category, Course, CourseLevel, CourseStatus, Setting, Review,
)

engine = create_async_engine(settings.DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

CSV_PATH = os.path.join(os.path.dirname(__file__), "udemy_courses.csv")


def slugify(text: str, max_len: int = 290) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:max_len]


# ── Roles & Permissions ──────────────────────────────────────
async def seed_roles_and_permissions(db: AsyncSession):
    print("→ Seeding roles & permissions...")
    roles_data = [
        ("Admin", "Full system access"),
        ("Manager", "Manage courses and users"),
        ("Instructor", "Create and manage own courses"),
        ("User", "Student / learner"),
    ]
    roles = {}
    for name, desc in roles_data:
        r = await db.execute(select(Role).where(Role.name == name))
        role = r.scalar_one_or_none()
        if not role:
            role = Role(name=name, description=desc)
            db.add(role)
            await db.flush()
        roles[name] = role

    perms_data = [
        "course:create", "course:edit", "course:delete", "course:view",
        "user:manage", "admin:dashboard", "export:data", "report:view",
    ]
    perms = {}
    for p in perms_data:
        res = await db.execute(select(Permission).where(Permission.name == p))
        perm = res.scalar_one_or_none()
        if not perm:
            perm = Permission(name=p, description=p.replace(":", " "))
            db.add(perm)
            await db.flush()
        perms[p] = perm

    for perm in perms.values():
        exists = await db.execute(
            select(RolePermission).where(
                RolePermission.role_id == roles["Admin"].id,
                RolePermission.permission_id == perm.id,
            )
        )
        if not exists.scalar_one_or_none():
            db.add(RolePermission(role_id=roles["Admin"].id, permission_id=perm.id))

    await db.commit()
    print("  ✓ Roles and permissions seeded")
    return roles


# ── Users ─────────────────────────────────────────────────────
async def seed_users(db: AsyncSession, roles: dict):
    print("→ Seeding users...")
    users_to_create = [
        ("admin@learnhub.com", "Admin", "LearnHub", "Admin1234!", "Admin", "Platform administrator"),
        ("system@learnhub.com", "System", "Instructor", "System1234!", "Instructor", "Auto-imported courses"),
        ("sarah@learnhub.com", "Sarah", "Chen", "Sarah1234!", "Instructor", "Senior software engineer, 10+ years in web dev"),
        ("marcus@learnhub.com", "Marcus", "Johnson", "Marcus1234!", "Instructor", "Data scientist & ML practitioner"),
        ("elena@learnhub.com", "Elena", "Rodriguez", "Elena1234!", "Instructor", "Award-winning UX designer"),
        ("david@learnhub.com", "David", "Kim", "David1234!", "Instructor", "Business strategist & former CFO"),
        ("priya@learnhub.com", "Priya", "Patel", "Priya1234!", "Instructor", "Digital marketing consultant"),
    ]
    created = {}
    for email, fn, ln, pw, role_name, bio in users_to_create:
        res = await db.execute(select(User).where(User.email == email))
        u = res.scalar_one_or_none()
        if not u:
            u = User(
                email=email, first_name=fn, last_name=ln,
                password_hash=get_password_hash(pw),
                is_active=True, bio=bio,
            )
            db.add(u)
            await db.flush()
            db.add(UserRole(user_id=u.id, role_id=roles[role_name].id))
        created[email] = u

    await db.commit()
    print(f"  ✓ {len(users_to_create)} users seeded")
    return created


# ── Settings ─────────────────────────────────────────────────
async def seed_settings(db: AsyncSession):
    defaults = {
        "site_name": "LearnHub",
        "site_tagline": "Learn anything. Anytime.",
        "hero_title": "Where Curiosity Becomes Career",
        "hero_subtitle": "Real courses, real outcomes. Join 1M+ learners building skills that matter.",
        "contact_email": "hello@learnhub.com",
        "courses_per_page": "20",
        "allow_free_enrollment": "true",
    }
    for key, value in defaults.items():
        res = await db.execute(select(Setting).where(Setting.key == key))
        if not res.scalar_one_or_none():
            db.add(Setting(key=key, value=value, description=f"CMS: {key}"))
    await db.commit()
    print("  ✓ CMS settings seeded")


# ── Categories & Courses ─────────────────────────────────────
CATEGORIES = [
    ("Web Development", "web-development", "💻", "Build websites & web apps"),
    ("Data Science", "data-science", "📊", "Analytics, ML & AI"),
    ("Mobile Development", "mobile-development", "📱", "iOS & Android apps"),
    ("Design", "design", "🎨", "UI/UX, graphic & product design"),
    ("Business", "business", "💼", "Strategy, finance & entrepreneurship"),
    ("Marketing", "marketing", "📣", "Digital marketing & growth"),
    ("Photography", "photography", "📷", "Photo & video creation"),
    ("Personal Development", "personal-development", "🌱", "Productivity & wellbeing"),
]

# (title, category, level, price, language, subs, rating, reviews, duration_hours, headline, instructor_email)
SAMPLE_COURSES = [
    # Web Development
    ("Complete React Developer Course 2026", "Web Development", "intermediate", 24.99, "en", 142_000, 4.7, 38_200, 42.5,
     "Master React, hooks, Redux, Next.js, TypeScript and build 10 production apps.", "sarah@learnhub.com"),
    ("The Modern Full-Stack Bootcamp", "Web Development", "beginner", 19.99, "en", 650_000, 4.8, 220_000, 65.0,
     "HTML, CSS, JavaScript, Node, Express, MongoDB. Zero to deployed in 8 weeks.", "sarah@learnhub.com"),
    ("FastAPI from Zero to Production", "Web Development", "advanced", 29.99, "en", 28_000, 4.9, 7_800, 18.0,
     "Async Python APIs with auth, websockets, testing, and Docker deployment.", "sarah@learnhub.com"),
    ("Vue 3 Composition API Masterclass", "Web Development", "intermediate", 22.99, "en", 48_000, 4.6, 12_500, 24.0,
     "Build reactive Vue apps with the Composition API, Pinia, and Nuxt 3.", "sarah@learnhub.com"),
    ("Tailwind CSS — Design Like a Pro", "Web Development", "beginner", 14.99, "en", 92_000, 4.7, 21_000, 12.5,
     "Master utility-first CSS and build stunning UIs faster than ever.", "elena@learnhub.com"),

    # Data Science
    ("Machine Learning A-Z: Hands-On Python & R", "Data Science", "intermediate", 29.99, "en", 880_000, 4.6, 180_000, 44.0,
     "Learn ML algorithms with intuition and code. NumPy, pandas, scikit-learn.", "marcus@learnhub.com"),
    ("Deep Learning with TensorFlow 2", "Data Science", "advanced", 34.99, "en", 195_000, 4.5, 58_000, 38.0,
     "CNNs, RNNs, Transformers, GANs. Build neural networks from scratch.", "marcus@learnhub.com"),
    ("Python for Data Analysis & Visualization", "Data Science", "beginner", 19.99, "en", 320_000, 4.7, 95_000, 28.5,
     "pandas, NumPy, matplotlib, seaborn. Turn raw data into insights.", "marcus@learnhub.com"),
    ("SQL for Data Scientists — From Basics to Advanced", "Data Science", "all_levels", 17.99, "en", 410_000, 4.8, 138_000, 22.0,
     "Window functions, CTEs, optimization. Pass any SQL interview.", "marcus@learnhub.com"),
    ("Statistics & Probability for Machine Learning", "Data Science", "intermediate", 24.99, "en", 67_000, 4.7, 18_500, 30.0,
     "The math behind ML, explained intuitively. Bayes, distributions, hypothesis testing.", "marcus@learnhub.com"),

    # Mobile
    ("iOS Development with Swift & SwiftUI", "Mobile Development", "beginner", 24.99, "en", 145_000, 4.7, 42_000, 48.0,
     "Build 15 real iOS apps. From buttons to App Store launch.", "sarah@learnhub.com"),
    ("Flutter & Dart: Complete Mobile Apps", "Mobile Development", "intermediate", 22.99, "en", 178_000, 4.6, 52_000, 35.5,
     "One codebase, iOS + Android. State management, Firebase, animations.", "sarah@learnhub.com"),
    ("React Native — Build Real Apps", "Mobile Development", "intermediate", 19.99, "en", 95_000, 4.5, 26_000, 32.0,
     "Native mobile apps with the React skills you already have.", "sarah@learnhub.com"),

    # Design
    ("UI/UX Design Bootcamp with Figma", "Design", "beginner", 18.99, "en", 220_000, 4.8, 73_000, 26.0,
     "From wireframes to design systems. Master Figma like a senior designer.", "elena@learnhub.com"),
    ("Design Systems & Component Libraries", "Design", "advanced", 27.99, "en", 38_000, 4.9, 9_200, 18.0,
     "Build scalable design systems used by Fortune 500 companies.", "elena@learnhub.com"),
    ("Logo Design & Brand Identity", "Design", "beginner", 14.99, "en", 88_000, 4.5, 24_000, 14.5,
     "Create logos clients love. Process, tools, and pricing your work.", "elena@learnhub.com"),
    ("Adobe Illustrator from Scratch", "Design", "all_levels", 16.99, "en", 165_000, 4.6, 48_000, 22.5,
     "Vector graphics, typography, icons, illustrations. Build a real portfolio.", "elena@learnhub.com"),

    # Business
    ("Financial Modeling for Startups", "Business", "intermediate", 29.99, "en", 72_000, 4.7, 18_000, 16.0,
     "Build investor-ready 3-statement models, valuations, and unit economics.", "david@learnhub.com"),
    ("Excel for Business Analysts", "Business", "all_levels", 17.99, "en", 320_000, 4.6, 95_000, 24.0,
     "Pivot tables, Power Query, dashboards, VBA. Real business cases.", "david@learnhub.com"),
    ("Product Management Foundations", "Business", "beginner", 22.99, "en", 110_000, 4.7, 32_000, 18.5,
     "Roadmaps, OKRs, user research, stakeholder management. Land a PM role.", "david@learnhub.com"),
    ("Negotiation Mastery for Professionals", "Business", "all_levels", 19.99, "en", 64_000, 4.6, 18_000, 8.5,
     "Frameworks used by FBI negotiators, M&A advisors, and CEOs.", "david@learnhub.com"),

    # Marketing
    ("Digital Marketing Masterclass 2026", "Marketing", "all_levels", 19.99, "en", 285_000, 4.5, 89_000, 38.0,
     "SEO, Google Ads, Facebook Ads, email, content. The full stack.", "priya@learnhub.com"),
    ("SEO 2026: Rank #1 on Google", "Marketing", "intermediate", 22.99, "en", 145_000, 4.7, 42_000, 22.0,
     "Technical SEO, content strategy, link building. Proven case studies.", "priya@learnhub.com"),
    ("Copywriting Secrets — Words That Sell", "Marketing", "beginner", 16.99, "en", 78_000, 4.8, 22_500, 11.0,
     "Headlines, hooks, persuasion frameworks. Write copy that converts.", "priya@learnhub.com"),
    ("TikTok & Instagram Growth Hacking", "Marketing", "beginner", 14.99, "en", 195_000, 4.4, 58_000, 9.5,
     "Algorithm secrets, viral hooks, content systems. Grow to 100K+ followers.", "priya@learnhub.com"),

    # Photography
    ("Photography Masterclass: A Complete Guide", "Photography", "beginner", 17.99, "en", 425_000, 4.7, 128_000, 22.5,
     "From DSLR basics to professional portraits. Composition, light, editing.", "elena@learnhub.com"),
    ("Lightroom & Photoshop for Photographers", "Photography", "intermediate", 19.99, "en", 168_000, 4.6, 52_000, 18.0,
     "Master the photo editing pipeline used by pros worldwide.", "elena@learnhub.com"),
    ("iPhone Photography & Mobile Editing", "Photography", "beginner", 12.99, "en", 95_000, 4.5, 28_000, 6.0,
     "Pro-level photos with just your phone. Composition, light, apps.", "elena@learnhub.com"),

    # Personal Development
    ("Productivity Masterclass — Get Things Done", "Personal Development", "all_levels", 14.99, "en", 245_000, 4.6, 72_000, 7.5,
     "Time blocking, deep work, habit stacking. Reclaim 10+ hours per week.", "david@learnhub.com"),
    ("Public Speaking — Confidence on Stage", "Personal Development", "beginner", 16.99, "en", 138_000, 4.7, 41_000, 10.5,
     "Overcome anxiety, structure great talks, and deliver with impact.", "david@learnhub.com"),
    ("Mindfulness & Stress Reduction", "Personal Development", "all_levels", 0.0, "en", 320_000, 4.8, 95_000, 8.0,
     "Science-backed meditation practices for focus, calm, and resilience.", "david@learnhub.com"),
    ("Learn How to Learn — Memory & Focus", "Personal Development", "all_levels", 0.0, "en", 425_000, 4.7, 128_000, 6.5,
     "Spaced repetition, active recall, chunking. Learn anything 3x faster.", "marcus@learnhub.com"),
]


async def seed_categories_and_courses(db: AsyncSession, users: dict):
    print("→ Seeding categories...")
    cat_map = {}
    for name, slug, icon, desc in CATEGORIES:
        res = await db.execute(select(Category).where(Category.name == name))
        cat = res.scalar_one_or_none()
        if not cat:
            cat = Category(name=name, slug=slug, icon=icon, description=desc)
            db.add(cat)
            await db.flush()
        cat_map[name] = cat.id
    await db.commit()
    print(f"  ✓ {len(CATEGORIES)} categories seeded")

    print("→ Seeding courses...")
    created_courses = []
    for (title, cat_name, level, price, lang, subs, rating, reviews, dur, headline, instructor_email) in SAMPLE_COURSES:
        slug = slugify(title)
        res = await db.execute(select(Course).where(Course.slug == slug))
        if res.scalar_one_or_none():
            continue

        instructor = users.get(instructor_email, users["system@learnhub.com"])
        level_enum = {
            "beginner": CourseLevel.beginner,
            "intermediate": CourseLevel.intermediate,
            "advanced": CourseLevel.advanced,
            "all_levels": CourseLevel.all_levels,
        }[level]

        long_description = f"""{headline}

What you'll learn:
• Master the core concepts from first principles
• Build real-world projects you can showcase in your portfolio
• Industry best practices and modern tooling
• Hands-on exercises with downloadable resources
• Career guidance and interview preparation

This course is designed for {level.replace('_', ' ')} learners who want to make real progress. Every lesson is concise, practical, and packed with examples you can apply immediately. By the end, you'll have the skills, confidence, and portfolio to take the next step in your career."""

        course = Course(
            title=title, slug=slug,
            description=long_description,
            short_description=headline,
            price=price, level=level_enum, status=CourseStatus.published,
            language=lang, num_subscribers=subs,
            avg_rating=rating, num_reviews=reviews,
            duration_hours=dur,
            category_id=cat_map[cat_name],
            instructor_id=instructor.id, created_by=instructor.id,
        )
        db.add(course)
        created_courses.append(course)

    await db.commit()
    print(f"  ✓ {len(created_courses)} courses seeded")
    return created_courses


# ── Reviews ──────────────────────────────────────────────────
REVIEW_SAMPLES = [
    (5, "Exactly what I needed to level up. Clear explanations and great pacing."),
    (5, "The projects alone are worth the price. Landed a job two months after finishing."),
    (4, "Really solid content. A few sections could be updated, but overall excellent."),
    (5, "Best instructor I've had online. Complex topics finally make sense."),
    (4, "Great course! The exercises are challenging in the best way."),
    (5, "I went from zero knowledge to building my own projects. Highly recommend."),
]

async def seed_reviews(db: AsyncSession, users: dict):
    print("→ Seeding sample reviews...")
    result = await db.execute(select(Course).order_by(Course.num_subscribers.desc()).limit(12))
    courses = result.scalars().all()
    reviewers = [u for e, u in users.items() if e != "system@learnhub.com"]
    count = 0
    for ci, course in enumerate(courses):
        existing = await db.execute(select(Review).where(Review.course_id == course.id).limit(1))
        if existing.scalar_one_or_none():
            continue
        for ri in range(3):
            rating, comment = REVIEW_SAMPLES[(ci + ri) % len(REVIEW_SAMPLES)]
            reviewer = reviewers[(ci + ri) % len(reviewers)]
            db.add(Review(
                course_id=course.id, student_id=reviewer.id,
                rating=rating, comment=comment, is_approved=True,
            ))
            count += 1
    await db.commit()
    print(f"  ✓ {count} reviews seeded")


# ── Kaggle Import (Optional) ─────────────────────────────────
async def seed_from_kaggle(db: AsyncSession, system_user: User):
    if not os.path.exists(CSV_PATH):
        print(f"\n💡 Tip: download the Kaggle CSV for 5,000+ real courses")
        print(f"   https://www.kaggle.com/datasets/yusufdelikkaya/udemy-online-education-courses")
        print(f"   Save as: backend/scripts/udemy_courses.csv\n")
        return

    import pandas as pd
    print(f"→ Loading Kaggle CSV from {CSV_PATH}...")
    df = pd.read_csv(CSV_PATH, low_memory=False)
    print(f"  CSV loaded: {len(df)} rows")

    col_map = {
        "course_title": ["course_title", "title", "Title"],
        "subject": ["subject", "category", "Category", "primary_category"],
        "level": ["level", "Level", "course_level"],
        "price": ["price", "Price"],
        "num_subscribers": ["num_subscribers", "subscribers", "num_students"],
        "avg_rating": ["avg_rating", "rating", "Rating", "avg_rating_recent"],
        "num_reviews": ["num_reviews", "reviews"],
        "content_length_min": ["content_length_min", "content_duration", "duration"],
        "headline": ["headline", "short_description", "description"],
        "language": ["language", "Language"],
    }

    def get_col(df, variants):
        for v in variants:
            if v in df.columns:
                return v
        return None

    title_col = get_col(df, col_map["course_title"])
    if not title_col:
        print("  ✗ Could not find title column. Check CSV structure.")
        return

    cat_col = get_col(df, col_map["subject"])
    level_col = get_col(df, col_map["level"])
    price_col = get_col(df, col_map["price"])
    subs_col = get_col(df, col_map["num_subscribers"])
    rating_col = get_col(df, col_map["avg_rating"])
    reviews_col = get_col(df, col_map["num_reviews"])
    dur_col = get_col(df, col_map["content_length_min"])
    desc_col = get_col(df, col_map["headline"])
    lang_col = get_col(df, col_map["language"])

    cat_cache = {}
    imported = 0
    skipped = 0
    total = min(len(df), 5000)
    print(f"  → Importing up to {total} courses...")

    for idx, row in df.head(total).iterrows():
        try:
            title = str(row[title_col]).strip() if title_col else ""
            if not title or title == "nan" or len(title) < 3:
                skipped += 1
                continue

            slug = slugify(title)
            res = await db.execute(select(Course).where(Course.slug == slug))
            if res.scalar_one_or_none():
                skipped += 1
                continue

            cat_name = str(row[cat_col]).strip() if cat_col and str(row[cat_col]) != "nan" else "General"
            if cat_name not in cat_cache:
                res = await db.execute(select(Category).where(Category.name == cat_name))
                cat = res.scalar_one_or_none()
                if not cat:
                    cat = Category(name=cat_name, slug=slugify(cat_name), icon="📚")
                    db.add(cat)
                    await db.flush()
                cat_cache[cat_name] = cat.id
            category_id = cat_cache[cat_name]

            raw_level = str(row[level_col]).lower() if level_col and str(row[level_col]) != "nan" else ""
            if "beginner" in raw_level:
                level = CourseLevel.beginner
            elif "intermediate" in raw_level:
                level = CourseLevel.intermediate
            elif "expert" in raw_level or "advanced" in raw_level:
                level = CourseLevel.advanced
            else:
                level = CourseLevel.all_levels

            price = float(row[price_col]) if price_col and str(row[price_col]) not in ("nan", "") else 0.0
            num_subs = int(float(row[subs_col])) if subs_col and str(row[subs_col]) not in ("nan", "") else 0
            avg_rating = float(row[rating_col]) if rating_col and str(row[rating_col]) not in ("nan", "") else 0.0
            num_reviews = int(float(row[reviews_col])) if reviews_col and str(row[reviews_col]) not in ("nan", "") else 0
            duration = float(row[dur_col]) / 60 if dur_col and str(row[dur_col]) not in ("nan", "") else None
            description = str(row[desc_col]).strip()[:2000] if desc_col and str(row[desc_col]) != "nan" else title
            language = str(row[lang_col])[:5] if lang_col and str(row[lang_col]) != "nan" else "en"

            course = Course(
                title=title[:255], slug=slug,
                description=description, short_description=description[:200],
                price=max(0.0, price), level=level, status=CourseStatus.published,
                duration_hours=duration,
                num_subscribers=max(0, num_subs),
                avg_rating=min(5.0, max(0.0, avg_rating)),
                num_reviews=max(0, num_reviews),
                language=language, category_id=category_id,
                instructor_id=system_user.id, created_by=system_user.id,
            )
            db.add(course)
            imported += 1

            if imported % 250 == 0:
                await db.flush()
                print(f"    {imported} courses processed...")
        except Exception:
            skipped += 1
            continue

    await db.commit()
    print(f"  ✓ Kaggle import complete: {imported} imported, {skipped} skipped")


# ── Main ─────────────────────────────────────────────────────
async def main():
    print("\n🌱  LearnHub Database Seed Script")
    print("=" * 50)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✓ Tables created")

    async with SessionLocal() as db:
        roles = await seed_roles_and_permissions(db)
        users = await seed_users(db, roles)
        await seed_settings(db)
        await seed_categories_and_courses(db, users)
        await seed_reviews(db, users)
        await seed_from_kaggle(db, users["system@learnhub.com"])

    print("\n" + "=" * 50)
    print("✅ Seeding complete!\n")
    print("🔐 Login credentials:")
    print("   Admin:      admin@learnhub.com    / Admin1234!")
    print("   Instructor: sarah@learnhub.com    / Sarah1234!")
    print("   Student:    Just register a new account!\n")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
