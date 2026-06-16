# LearnHub — Update Instructions

Three things changed in this update:
1. **Auth fixed** — login, register, and logout now work (was a `bcrypt` library conflict)
2. **30+ realistic courses** ready to display
3. **Complete UI/UX redesign** — editorial typography, refined color palette, smooth animations

## What to do

You already have the site running. Replace your files with this new zip, then:

### 1. Extract & replace

Unzip `learnhub.zip`, then copy the new `project/` folder over your existing one (overwrite everything).

### 2. Backend — reinstall and reseed

In your **backend terminal** (the one running uvicorn), press `Ctrl+C` to stop it, then run:

```bash
pip install -r requirements.txt
```

Now you need to clear the broken password hashes from your database. In **pgAdmin**:

- Right-click the `learnhub` database → **Query Tool**
- Paste this and press F5:

```sql
DROP TABLE IF EXISTS audit_logs, role_permissions, user_roles, payments, reviews, enrollments, lessons, modules, courses, categories, settings, permissions, roles, users CASCADE;
```

Back in the terminal:

```bash
python -m scripts.seed_kaggle
uvicorn main:app --reload --port 8000
```

You should see `✓ 32 courses seeded`.

### 3. Frontend — restart

In your **frontend terminal**, press `Ctrl+C` to stop Vite, then:

```bash
npm run dev
```

### 4. Open the app

Go to **http://localhost:5173**

## Login credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@learnhub.com` | `Admin1234!` |
| Instructor | `sarah@learnhub.com` | `Sarah1234!` |
| Instructor | `marcus@learnhub.com` | `Marcus1234!` |

Or click **"Use demo admin credentials"** on the login page to autofill.

## Want even more courses?

Download the Kaggle Udemy dataset from:
https://www.kaggle.com/datasets/yusufdelikkaya/udemy-online-education-courses

Save the CSV as `backend/scripts/udemy_courses.csv` and re-run the seed script. You'll get 5,000+ real courses.
