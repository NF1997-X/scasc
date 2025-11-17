from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)


class FileMetadata(db.Model):
    __tablename__ = 'file_metadata'
    
    id = db.Column(db.String(36), primary_key=True)  # UUID as string
    original_name = db.Column(db.String(255), nullable=False)
    display_name = db.Column(db.String(255), nullable=False)  # Editable display name
    description = db.Column(db.Text, nullable=True)  # Optional description
    filename = db.Column(db.String(255), nullable=False)
    path = db.Column(db.String(500), nullable=False)
    size = db.Column(db.BigInteger, nullable=False)
    hash = db.Column(db.String(64), nullable=False)  # SHA256 hash
    upload_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    share_token = db.Column(db.String(36), nullable=False, unique=True)  # UUID as string
    download_count = db.Column(db.Integer, nullable=False, default=0)
    
    def __repr__(self):
        return f'<FileMetadata {self.original_name}>'
    
    def to_dict(self):
        """Convert model to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'original_name': self.original_name,
            'filename': self.filename,
            'path': self.path,
            'size': self.size,
            'hash': self.hash,
            'upload_date': self.upload_date.isoformat() if self.upload_date else None,
            'share_token': self.share_token,
            'download_count': self.download_count
        }
