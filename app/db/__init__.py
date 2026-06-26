import secrets
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from app.db.models import Base, User
from app.middleware.requestvars import g
from app.utils.logger import logger
from app.utils.security import get_password_hash

db_path = Path(f'{Path(__file__).cwd()}/config')
if not db_path.exists():
    db_path.mkdir()

engine = create_engine(f'sqlite:///{db_path}/app.db',
                       pool_pre_ping=True,
                       echo=False,
                       poolclass=NullPool,
                       connect_args={"timeout": 60, "check_same_thread": False},
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
            initial_password = secrets.token_urlsafe(12)
            user = User()
            user.username = 'admin'
            user.password = get_password_hash(initial_password)
            user.name = "管理员"
            user.is_admin = True
            db.add(user)
            db.commit()
            logger.warning("检测到系统首次初始化，已创建管理员账号 admin，初始密码为【%s】。请登录后立即修改密码。", initial_password)
