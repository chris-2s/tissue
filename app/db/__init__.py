from pathlib import Path
from sqlalchemy import create_engine, QueuePool
from sqlalchemy.orm import sessionmaker

from app.db.models import Base, User
from app.middleware.requestvars import g
from app.utils.security import get_password_hash

db_path = Path(f'{Path(__file__).cwd()}/config')
if not db_path.exists():
    db_path.mkdir()

engine = create_engine(f'sqlite:///{db_path}/app.db',
                       pool_pre_ping=True,
                       echo=False,
                       poolclass=QueuePool,
                       pool_size=1024,
                       pool_recycle=3600,
                       pool_timeout=180,
                       max_overflow=10,
                       connect_args={"timeout": 60},
                       )

SessionFactory = sessionmaker(bind=engine, autocommit=False)


# Dependency
def get_db():
    db = SessionFactory()
    g().db = db
    try:
        yield db
    finally:
        delattr(g(), 'db')
        db.close()


def init() -> None:
    with SessionFactory() as db:
        user = db.query(User).filter_by(username='admin').one_or_none()
        if not user:
            user = User()
            user.username = 'admin'
            user.password = get_password_hash("password")
            user.name = "管理员"
            user.is_admin = True
            db.add(user)
            db.commit()
