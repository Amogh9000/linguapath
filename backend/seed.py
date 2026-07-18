"""
Seed script — populates the database with courses, exercises, demo users, and achievements.
Run automatically on startup if the DB is empty (see main.py lifespan).
"""

from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select

from app.core.database import async_session_factory
from app.core.security import hash_password
from app.models import (
    Achievement, Course, Exercise, Lesson, LessonSession, Skill, Unit,
    User, UserAchievement, UserOnboarding, UserSkillProgress, UserStats,
)

# ---------------------------------------------------------------------------
# Exercise data per course
# ---------------------------------------------------------------------------

SPANISH_EXERCISES = {
    "Greetings": [
        {"type": "multiple_choice", "prompt": "What does 'Hola' mean?", "options": ["Hello", "Goodbye", "Thanks", "Please"], "correct_answer": "Hello", "audio_text": "Hola"},
        {"type": "translate", "prompt": "Translate: 'Good morning'", "options": None, "correct_answer": "Buenos días", "audio_text": "Buenos días"},
        {"type": "match_pairs", "prompt": "Match the pairs", "options": [{"left": "Hello", "right": "Hola", "right_pronunciation": "oh-lah"}, {"left": "Goodbye", "right": "Adiós", "right_pronunciation": "ah-dee-ohs"}, {"left": "Please", "right": "Por favor", "right_pronunciation": "por fah-vor"}], "correct_answer": [{"left": "Hello", "right": "Hola"}, {"left": "Goodbye", "right": "Adiós"}, {"left": "Please", "right": "Por favor"}], "audio_text": "Hola, Adiós, Por favor"},
        {"type": "fill_blank", "prompt": "Buenos _____ (Good morning)", "options": ["días", "noches", "tardes", "años"], "correct_answer": "días", "audio_text": "Buenos días"},
        {"type": "type_answer", "prompt": "Type 'Thank you' in Spanish", "options": None, "correct_answer": "Gracias", "audio_text": "Gracias"},
    ],
    "Basics": [
        {"type": "multiple_choice", "prompt": "What does 'Gato' mean?", "options": ["Dog", "Cat", "Bird", "Fish"], "correct_answer": "Cat", "audio_text": "Gato"},
        {"type": "translate", "prompt": "Translate: 'The boy'", "options": None, "correct_answer": "El niño", "audio_text": "El niño"},
        {"type": "match_pairs", "prompt": "Match the pairs", "options": [{"left": "Water", "right": "Agua", "right_pronunciation": "ah-gwah"}, {"left": "Bread", "right": "Pan", "right_pronunciation": "pahn"}, {"left": "Milk", "right": "Leche", "right_pronunciation": "leh-cheh"}], "correct_answer": [{"left": "Water", "right": "Agua"}, {"left": "Bread", "right": "Pan"}, {"left": "Milk", "right": "Leche"}], "audio_text": "Agua, Pan, Leche"},
        {"type": "fill_blank", "prompt": "Yo _____ agua (I drink water)", "options": ["bebo", "como", "leo", "escribo"], "correct_answer": "bebo", "audio_text": "Yo bebo agua"},
        {"type": "type_answer", "prompt": "Type 'I am a boy' in Spanish", "options": None, "correct_answer": "Yo soy un niño", "audio_text": "Yo soy un niño"},
        {"type": "multiple_choice", "prompt": "What does 'Mujer' mean?", "options": ["Man", "Woman", "Girl", "Boy"], "correct_answer": "Woman", "audio_text": "Mujer"},
    ],
    "Family": [
        {"type": "multiple_choice", "prompt": "What does 'Madre' mean?", "options": ["Father", "Mother", "Sister", "Brother"], "correct_answer": "Mother", "audio_text": "Madre"},
        {"type": "translate", "prompt": "Translate: 'My father'", "options": None, "correct_answer": "Mi padre", "audio_text": "Mi padre"},
        {"type": "match_pairs", "prompt": "Match the pairs", "options": [{"left": "Sister", "right": "Hermana", "right_pronunciation": "air-mah-nah"}, {"left": "Brother", "right": "Hermano", "right_pronunciation": "air-mah-no"}, {"left": "Family", "right": "Familia", "right_pronunciation": "fah-mee-lee-ah"}], "correct_answer": [{"left": "Sister", "right": "Hermana"}, {"left": "Brother", "right": "Hermano"}, {"left": "Family", "right": "Familia"}], "audio_text": "Hermana, Hermano, Familia"},
        {"type": "fill_blank", "prompt": "Mi _____ es alta (My sister is tall)", "options": ["hermana", "hermano", "padre", "madre"], "correct_answer": "hermana", "audio_text": "Mi hermana es alta"},
        {"type": "type_answer", "prompt": "Type 'My family' in Spanish", "options": None, "correct_answer": "Mi familia", "audio_text": "Mi familia"},
    ],
    "Food": [
        {"type": "multiple_choice", "prompt": "What does 'Manzana' mean?", "options": ["Orange", "Apple", "Banana", "Grape"], "correct_answer": "Apple", "audio_text": "Manzana"},
        {"type": "translate", "prompt": "Translate: 'I eat rice'", "options": None, "correct_answer": "Yo como arroz", "audio_text": "Yo como arroz"},
        {"type": "match_pairs", "prompt": "Match the pairs", "options": [{"left": "Chicken", "right": "Pollo", "right_pronunciation": "poy-yo"}, {"left": "Fish", "right": "Pescado", "right_pronunciation": "pes-kah-doh"}, {"left": "Rice", "right": "Arroz", "right_pronunciation": "ah-rohs"}], "correct_answer": [{"left": "Chicken", "right": "Pollo"}, {"left": "Fish", "right": "Pescado"}, {"left": "Rice", "right": "Arroz"}], "audio_text": "Pollo, Pescado, Arroz"},
        {"type": "fill_blank", "prompt": "Me gusta el _____ (I like chicken)", "options": ["pollo", "agua", "pan", "arroz"], "correct_answer": "pollo", "audio_text": "Me gusta el pollo"},
        {"type": "type_answer", "prompt": "Type 'The apple' in Spanish", "options": None, "correct_answer": "La manzana", "audio_text": "La manzana"},
    ],
}

FRENCH_EXERCISES = {
    "Salutations": [
        {"type": "multiple_choice", "prompt": "What does 'Bonjour' mean?", "options": ["Goodbye", "Hello", "Thanks", "Please"], "correct_answer": "Hello", "audio_text": "Bonjour"},
        {"type": "translate", "prompt": "Translate: 'Good evening'", "options": None, "correct_answer": "Bonsoir", "audio_text": "Bonsoir"},
        {"type": "match_pairs", "prompt": "Match the pairs", "options": [{"left": "Hello", "right": "Bonjour", "right_pronunciation": "bon-zhoor"}, {"left": "Goodbye", "right": "Au revoir", "right_pronunciation": "oh ruh-vwar"}, {"left": "Thank you", "right": "Merci", "right_pronunciation": "mair-see"}], "correct_answer": [{"left": "Hello", "right": "Bonjour"}, {"left": "Goodbye", "right": "Au revoir"}, {"left": "Thank you", "right": "Merci"}], "audio_text": "Bonjour, Au revoir, Merci"},
        {"type": "fill_blank", "prompt": "_____ madame (Hello madam)", "options": ["Bonjour", "Merci", "Oui", "Non"], "correct_answer": "Bonjour", "audio_text": "Bonjour madame"},
        {"type": "type_answer", "prompt": "Type 'Please' in French", "options": None, "correct_answer": "S'il vous plaît", "audio_text": "S'il vous plaît"},
    ],
    "Les Bases": [
        {"type": "multiple_choice", "prompt": "What does 'Chat' mean in French?", "options": ["Dog", "Cat", "Hat", "Rat"], "correct_answer": "Cat", "audio_text": "Chat"},
        {"type": "translate", "prompt": "Translate: 'The girl'", "options": None, "correct_answer": "La fille", "audio_text": "La fille"},
        {"type": "match_pairs", "prompt": "Match the pairs", "options": [{"left": "Man", "right": "Homme", "right_pronunciation": "om"}, {"left": "Woman", "right": "Femme", "right_pronunciation": "fam"}, {"left": "Child", "right": "Enfant", "right_pronunciation": "on-fon"}], "correct_answer": [{"left": "Man", "right": "Homme"}, {"left": "Woman", "right": "Femme"}, {"left": "Child", "right": "Enfant"}], "audio_text": "Homme, Femme, Enfant"},
        {"type": "fill_blank", "prompt": "Je _____ un garçon (I am a boy)", "options": ["suis", "ai", "fais", "vais"], "correct_answer": "suis", "audio_text": "Je suis un garçon"},
        {"type": "type_answer", "prompt": "Type 'I am a woman' in French", "options": None, "correct_answer": "Je suis une femme", "audio_text": "Je suis une femme"},
        {"type": "multiple_choice", "prompt": "What does 'Eau' mean?", "options": ["Fire", "Earth", "Water", "Air"], "correct_answer": "Water", "audio_text": "Eau"},
    ],
    "La Famille": [
        {"type": "multiple_choice", "prompt": "What does 'Mère' mean?", "options": ["Father", "Mother", "Sister", "Aunt"], "correct_answer": "Mother", "audio_text": "Mère"},
        {"type": "translate", "prompt": "Translate: 'My brother'", "options": None, "correct_answer": "Mon frère", "audio_text": "Mon frère"},
        {"type": "match_pairs", "prompt": "Match the pairs", "options": [{"left": "Father", "right": "Père", "right_pronunciation": "pair"}, {"left": "Mother", "right": "Mère", "right_pronunciation": "mair"}, {"left": "Son", "right": "Fils", "right_pronunciation": "feess"}], "correct_answer": [{"left": "Father", "right": "Père"}, {"left": "Mother", "right": "Mère"}, {"left": "Son", "right": "Fils"}], "audio_text": "Père, Mère, Fils"},
        {"type": "fill_blank", "prompt": "Ma _____ est gentille (My sister is kind)", "options": ["sœur", "frère", "mère", "père"], "correct_answer": "sœur", "audio_text": "Ma sœur est gentille"},
        {"type": "type_answer", "prompt": "Type 'The family' in French", "options": None, "correct_answer": "La famille", "audio_text": "La famille"},
    ],
    "La Nourriture": [
        {"type": "multiple_choice", "prompt": "What does 'Pomme' mean?", "options": ["Pear", "Apple", "Peach", "Plum"], "correct_answer": "Apple", "audio_text": "Pomme"},
        {"type": "translate", "prompt": "Translate: 'I eat bread'", "options": None, "correct_answer": "Je mange du pain", "audio_text": "Je mange du pain"},
        {"type": "match_pairs", "prompt": "Match the pairs", "options": [{"left": "Cheese", "right": "Fromage", "right_pronunciation": "froh-mazh"}, {"left": "Bread", "right": "Pain", "right_pronunciation": "pan"}, {"left": "Wine", "right": "Vin", "right_pronunciation": "van"}], "correct_answer": [{"left": "Cheese", "right": "Fromage"}, {"left": "Bread", "right": "Pain"}, {"left": "Wine", "right": "Vin"}], "audio_text": "Fromage, Pain, Vin"},
        {"type": "fill_blank", "prompt": "J'aime le _____ (I like cheese)", "options": ["fromage", "pain", "vin", "lait"], "correct_answer": "fromage", "audio_text": "J'aime le fromage"},
        {"type": "type_answer", "prompt": "Type 'The apple' in French", "options": None, "correct_answer": "La pomme", "audio_text": "La pomme"},
    ],
}

JAPANESE_EXERCISES = {
    "Greetings": [
        {"type": "multiple_choice", "prompt": "What does 'こんにちは' (Konnichiwa) mean?", "options": ["Goodbye", "Hello", "Thank you", "Sorry"], "correct_answer": "Hello", "audio_text": "こんにちは"},
        {"type": "translate", "prompt": "Translate: 'Good morning'", "options": None, "correct_answer": "Ohayou gozaimasu", "audio_text": "おはようございます"},
        {"type": "match_pairs", "prompt": "Match the pairs", "options": [{"left": "Hello", "right": "こんにちは", "right_pronunciation": "Konnichiwa"}, {"left": "Thank you", "right": "ありがとう", "right_pronunciation": "Arigatou"}, {"left": "Goodbye", "right": "さようなら", "right_pronunciation": "Sayounara"}], "correct_answer": [{"left": "Hello", "right": "こんにちは"}, {"left": "Thank you", "right": "ありがとう"}, {"left": "Goodbye", "right": "さようなら"}], "audio_text": "こんにちは, ありがとう, さようなら"},
        {"type": "fill_blank", "prompt": "おはよう_____ (Good morning - polite)", "options": ["ございます", "です", "ます", "した"], "correct_answer": "ございます", "audio_text": "おはようございます"},
        {"type": "type_answer", "prompt": "Type 'Thank you' in romaji", "options": None, "correct_answer": "Arigatou", "audio_text": "ありがとう"},
        {"type": "multiple_choice", "prompt": "What does 'さようなら' mean?", "options": ["Hello", "Sorry", "Goodbye", "Thanks"], "correct_answer": "Goodbye", "audio_text": "さようなら"},
    ],
    "Basics": [
        {"type": "multiple_choice", "prompt": "What does 'ねこ' (Neko) mean?", "options": ["Dog", "Cat", "Bird", "Fish"], "correct_answer": "Cat", "audio_text": "ねこ"},
        {"type": "translate", "prompt": "Translate: 'I am a student'", "options": None, "correct_answer": "Watashi wa gakusei desu", "audio_text": "わたしはがくせいです"},
        {"type": "match_pairs", "prompt": "Match the pairs", "options": [{"left": "Water", "right": "みず", "right_pronunciation": "Mizu"}, {"left": "Dog", "right": "いぬ", "right_pronunciation": "Inu"}, {"left": "Cat", "right": "ねこ", "right_pronunciation": "Neko"}], "correct_answer": [{"left": "Water", "right": "みず"}, {"left": "Dog", "right": "いぬ"}, {"left": "Cat", "right": "ねこ"}], "audio_text": "みず, いぬ, ねこ"},
        {"type": "fill_blank", "prompt": "わたし___がくせいです (I am a student)", "options": ["は", "が", "を", "に"], "correct_answer": "は", "audio_text": "わたしはがくせいです"},
        {"type": "type_answer", "prompt": "Type 'Yes' in romaji", "options": None, "correct_answer": "Hai", "audio_text": "はい"},
    ],
    "Numbers": [
        {"type": "multiple_choice", "prompt": "What is 'いち' (Ichi)?", "options": ["One", "Two", "Three", "Four"], "correct_answer": "One", "audio_text": "いち"},
        {"type": "translate", "prompt": "Translate the number: 'Five'", "options": None, "correct_answer": "Go", "audio_text": "ご"},
        {"type": "match_pairs", "prompt": "Match the numbers", "options": [{"left": "1", "right": "いち", "right_pronunciation": "Ichi"}, {"left": "2", "right": "に", "right_pronunciation": "Ni"}, {"left": "3", "right": "さん", "right_pronunciation": "San"}], "correct_answer": [{"left": "1", "right": "いち"}, {"left": "2", "right": "に"}, {"left": "3", "right": "さん"}], "audio_text": "いち, に, さん"},
        {"type": "fill_blank", "prompt": "いち, に, _____, し (1, 2, ___, 4)", "options": ["さん", "ご", "ろく", "なな"], "correct_answer": "さん", "audio_text": "さん"},
        {"type": "type_answer", "prompt": "Type 'Ten' in romaji", "options": None, "correct_answer": "Juu", "audio_text": "じゅう"},
    ],
    "Food": [
        {"type": "multiple_choice", "prompt": "What does 'すし' (Sushi) mean?", "options": ["Ramen", "Sushi", "Tempura", "Udon"], "correct_answer": "Sushi", "audio_text": "すし"},
        {"type": "translate", "prompt": "Translate: 'I eat rice'", "options": None, "correct_answer": "Gohan wo tabemasu", "audio_text": "ごはんをたべます"},
        {"type": "match_pairs", "prompt": "Match the pairs", "options": [{"left": "Rice", "right": "ごはん", "right_pronunciation": "Gohan"}, {"left": "Tea", "right": "おちゃ", "right_pronunciation": "Ocha"}, {"left": "Fish", "right": "さかな", "right_pronunciation": "Sakana"}], "correct_answer": [{"left": "Rice", "right": "ごはん"}, {"left": "Tea", "right": "おちゃ"}, {"left": "Fish", "right": "さかな"}], "audio_text": "ごはん, おちゃ, さかな"},
        {"type": "fill_blank", "prompt": "___をたべます (I eat sushi)", "options": ["すし", "ごはん", "おちゃ", "みず"], "correct_answer": "すし", "audio_text": "すしをたべます"},
        {"type": "type_answer", "prompt": "Type 'Delicious' in romaji", "options": None, "correct_answer": "Oishii", "audio_text": "おいしい"},
    ],
}

COURSE_DEFINITIONS = [
    {
        "name": "Spanish", "code": "es",
        "units": [
            {"title": "Unit 1: First Steps", "desc": "Learn basic greetings and introductions",
             "skills": [("Greetings", "wave"), ("Basics", "book")]},
            {"title": "Unit 2: Daily Life", "desc": "Talk about family and food",
             "skills": [("Family", "people"), ("Food", "utensils")]},
            {"title": "Unit 3: Travel", "desc": "Navigate the city and transport",
             "skills": [("Directions", "map"), ("Transport", "flight")]},
            {"title": "Unit 4: Work & Study", "desc": "Talk about your career and education",
             "skills": [("Work", "work"), ("School", "school")]},
        ],
        "exercises": SPANISH_EXERCISES,
    },
    {
        "name": "French", "code": "fr",
        "units": [
            {"title": "Unité 1: Premiers Pas", "desc": "Basic greetings and introductions in French",
             "skills": [("Salutations", "wave"), ("Les Bases", "book")]},
            {"title": "Unité 2: Vie Quotidienne", "desc": "Family and food vocabulary",
             "skills": [("La Famille", "people"), ("La Nourriture", "utensils")]},
            {"title": "Unité 3: En Voyage", "desc": "Explore Paris and beyond",
             "skills": [("Voyage", "flight"), ("Directions", "map")]},
            {"title": "Unité 4: Travail", "desc": "Careers and school life",
             "skills": [("Travail", "work"), ("École", "school")]},
        ],
        "exercises": FRENCH_EXERCISES,
    },
    {
        "name": "Japanese", "code": "ja",
        "units": [
            {"title": "Unit 1: はじめまして", "desc": "Learn basic Japanese greetings with kana",
             "skills": [("Greetings", "torii"), ("Basics", "book")]},
            {"title": "Unit 2: にほんのせいかつ", "desc": "Numbers and food in Japanese",
             "skills": [("Numbers", "calculator"), ("Food", "bento")]},
            {"title": "Unit 3: ひらがなとカタカナ", "desc": "Mastering the writing systems",
             "skills": [("Hiragana", "translate"), ("Katakana", "language")]},
            {"title": "Unit 4: おでかけ", "desc": "Going out and exploring",
             "skills": [("Travel", "flight"), ("Directions", "map")]},
        ],
        "exercises": JAPANESE_EXERCISES,
    },
]

ACHIEVEMENTS = [
    {"code": "sharpshooter", "title": "Sharpshooter", "description": "Complete a lesson with zero mistakes", "icon_key": "target"},
    {"code": "scholar", "title": "Scholar", "description": "Earn 1000 XP total", "icon_key": "graduation_cap"},
    {"code": "week_warrior", "title": "Week Warrior", "description": "Maintain a 7-day streak", "icon_key": "fire"},
    {"code": "century_club", "title": "Century Club", "description": "Earn 100 XP in a single day", "icon_key": "star"},
]

FAKE_USERS = [
    {"username": "maria_learns", "email": "maria@example.com", "xp": 5200},
    {"username": "alex_polyglot", "email": "alex@example.com", "xp": 3800},
    {"username": "sakura_chan", "email": "sakura@example.com", "xp": 6100},
    {"username": "pierre_fr", "email": "pierre@example.com", "xp": 2900},
    {"username": "luna_star", "email": "luna@example.com", "xp": 4100},
]


async def seed_if_empty():
    """Seed the database only if no courses exist yet."""
    async with async_session_factory() as db:
        result = await db.execute(select(Course).limit(1))
        if result.scalars().first() is not None:
            return  # Already seeded

        print("🌱 Seeding database...")

        # --- Courses, Units, Skills, Lessons, Exercises ---
        for cdef in COURSE_DEFINITIONS:
            course = Course(name=cdef["name"], language_code=cdef["code"])
            db.add(course)
            await db.flush()

            for u_idx, udef in enumerate(cdef["units"]):
                unit = Unit(course_id=course.id, order_index=u_idx, title=udef["title"], description=udef["desc"])
                db.add(unit)
                await db.flush()

                for s_idx, (skill_title, icon) in enumerate(udef["skills"]):
                    skill = Skill(unit_id=unit.id, order_index=s_idx, title=skill_title, icon_key=icon)
                    db.add(skill)
                    await db.flush()

                    lesson = Lesson(skill_id=skill.id, order_index=0)
                    db.add(lesson)
                    await db.flush()

                    exercises = cdef["exercises"].get(skill_title, [])
                    for e_idx, edef in enumerate(exercises):
                        ex = Exercise(
                            lesson_id=lesson.id, order_index=e_idx,
                            type=edef["type"], prompt=edef["prompt"],
                            options=edef.get("options"), correct_answer=edef["correct_answer"],
                            audio_text=edef.get("audio_text"),
                        )
                        db.add(ex)

        await db.flush()

        # --- Achievements ---
        ach_map = {}
        for adef in ACHIEVEMENTS:
            ach = Achievement(**adef)
            db.add(ach)
            await db.flush()
            ach_map[ach.code] = ach.id

        # --- Demo user ---
        demo_user = User(
            username="demo", email="demo@linguapath.com",
            password_hash=hash_password("demo1234"), auth_provider="local",
            avatar_config={"outfit": "explorer", "accessory": "headband", "color": "blue"},
        )
        db.add(demo_user)
        await db.flush()

        demo_stats = UserStats(
            user_id=demo_user.id, xp_total=4520, streak_count=12,
            last_activity_date=date.today(), hearts_current=5, hearts_max=5,
            gems=750, daily_goal_xp=50, daily_xp_today=80, daily_xp_date=date.today(),
        )
        db.add(demo_stats)

        demo_onboarding = UserOnboarding(
            user_id=demo_user.id, chosen_language="japanese",
            proficiency_level="some_words", daily_commitment_minutes=10,
        )
        db.add(demo_onboarding)
        await db.flush()

        # Give demo user progress on Japanese course skills
        ja_result = await db.execute(select(Course).where(Course.language_code == "ja"))
        ja_course = ja_result.scalar_one()
        ja_units = await db.execute(
            select(Unit).where(Unit.course_id == ja_course.id).order_by(Unit.order_index)
        )
        ja_units_list = ja_units.scalars().all()

        skill_order = 0
        for unit in ja_units_list:
            skills_result = await db.execute(
                select(Skill).where(Skill.unit_id == unit.id).order_by(Skill.order_index)
            )
            for skill in skills_result.scalars().all():
                if skill_order < 2:  # First 2 skills completed
                    db.add(UserSkillProgress(
                        user_id=demo_user.id, skill_id=skill.id,
                        status="completed", crowns=min(3, skill_order + 1), times_completed=skill_order + 1,
                    ))
                elif skill_order == 2:
                    db.add(UserSkillProgress(
                        user_id=demo_user.id, skill_id=skill.id, status="available",
                    ))
                skill_order += 1

        # Demo achievements
        now = datetime.now(timezone.utc)
        db.add(UserAchievement(user_id=demo_user.id, achievement_id=ach_map["sharpshooter"], earned_at=now - timedelta(days=5), progress_current=1, progress_target=1))
        db.add(UserAchievement(user_id=demo_user.id, achievement_id=ach_map["week_warrior"], earned_at=now - timedelta(days=2), progress_current=7, progress_target=7))

        # --- Fake leaderboard users ---
        for fuser in FAKE_USERS:
            u = User(username=fuser["username"], email=fuser["email"], password_hash=hash_password("fake1234"), auth_provider="local")
            db.add(u)
            await db.flush()
            db.add(UserStats(user_id=u.id, xp_total=fuser["xp"], streak_count=3, gems=500))

        await db.commit()
        print("✅ Database seeded successfully!")
