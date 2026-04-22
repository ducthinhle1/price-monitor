import os
from datetime import datetime

from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import DeclarativeBase, relationship, Session

engine = create_engine("sqlite:///prices.db", connect_args={"check_same_thread": False})


class Base(DeclarativeBase):
    pass


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    url = Column(String, nullable=False, unique=True)
    store = Column(String, nullable=False)
    target_price = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    checks = relationship("PriceCheck", back_populates="product", cascade="all, delete-orphan")


class PriceCheck(Base):
    __tablename__ = "price_checks"
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    price = Column(Float, nullable=False)
    checked_at = Column(DateTime, default=datetime.utcnow)
    product = relationship("Product", back_populates="checks")


class Setting(Base):
    __tablename__ = "settings"
    key = Column(String, primary_key=True)
    value = Column(String, default="")


def init_db():
    Base.metadata.create_all(engine)
    defaults = {
        "discord_webhook": os.getenv("DISCORD_WEBHOOK", ""),
        "sender_email":    os.getenv("SENDER_EMAIL", ""),
        "gmail_password":  os.getenv("GMAIL_PASSWORD", ""),
        "receiver_email":  os.getenv("RECEIVER_EMAIL", ""),
        "check_hour":      os.getenv("CHECK_HOUR", "9"),
    }
    with Session(engine) as session:
        for key, value in defaults.items():
            if not session.get(Setting, key):
                session.add(Setting(key=key, value=value))
        session.commit()


def get_setting(session: Session, key: str, default: str = "") -> str:
    s = session.get(Setting, key)
    return s.value if s else default
