import os
import json
import uuid
import hashlib
from datetime import datetime
from werkzeug.utils import secure_filename
from werkzeug.exceptions import RequestEntityTooLarge
from flask import Flask, request, jsonify, render_template, send_file, abort, url_for
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
import pytz
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)


class Base(DeclarativeBase):
    pass


db = SQLAlchemy(model_class=Base)

# create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max file size

# configure the database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
# initialize the app with the extension
db.init_app(app)

# Custom Jinja2 filters
@app.template_filter('filesizeformat')
def filesizeformat_filter(num_bytes):
    """Format file size in bytes to human readable format"""
    if num_bytes == 0:
        return "0 Bytes"
    
    for unit in ['Bytes', 'KB', 'MB', 'GB', 'TB']:
        if num_bytes < 1024.0:
            return f"{num_bytes:.1f} {unit}"
        num_bytes /= 1024.0
    return f"{num_bytes:.1f} PB"

@app.template_filter('formatdate')
def formatdate_filter(date_string):
    """Format ISO date string to readable format in Asia/Kuala_Lumpur timezone"""
    try:
        # Parse the date string
        if isinstance(date_string, str):
            date_obj = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        else:
            date_obj = date_string
        
        # Set up timezones
        utc_tz = pytz.timezone('UTC')
        kl_tz = pytz.timezone('Asia/Kuala_Lumpur')
        
        # Make datetime timezone-aware if it's naive
        if date_obj.tzinfo is None:
            date_obj = utc_tz.localize(date_obj)
        
        # Convert to Kuala Lumpur timezone
        kl_time = date_obj.astimezone(kl_tz)
        return kl_time.strftime('%Y-%m-%d %H:%M:%S')
    except Exception as e:
        app.logger.error(f"Date formatting error: {str(e)}")
        return str(date_string) if date_string else ""

# Create necessary directories
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Import models after db is configured
with app.app_context():
    from models import FileMetadata  # noqa: F401
    db.create_all()
    

ALLOWED_EXTENSIONS = {
    'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 
    'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', '7z', 'mp3', 
    'mp4', 'avi', 'mkv', 'mov', 'csv', 'json', 'xml', 'py', 
    'js', 'html', 'css', 'md'
}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_all_files():
    """Get all file metadata from database"""
    from models import FileMetadata
    return FileMetadata.query.all()

def get_file_by_id(file_id):
    """Get file metadata by ID from database"""
    from models import FileMetadata
    return FileMetadata.query.filter_by(id=file_id).first()

def get_file_by_share_token(share_token):
    """Get file metadata by share token from database"""
    from models import FileMetadata
    return FileMetadata.query.filter_by(share_token=share_token).first()

def get_file_by_hash(file_hash):
    """Get file metadata by hash from database"""
    from models import FileMetadata
    return FileMetadata.query.filter_by(hash=file_hash).first()

def generate_share_token():
    """Generate a unique share token"""
    return str(uuid.uuid4())

def get_file_hash(filepath):
    """Generate SHA256 hash of file for deduplication"""
    hash_sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_sha256.update(chunk)
    return hash_sha256.hexdigest()

@app.route('/')
def index():
    """Main file manager interface"""
    files = get_all_files()
    files_list = []
    
    for file_obj in files:
        # Check if file still exists
        if os.path.exists(file_obj.path):
            files_list.append({
                'id': file_obj.id,
                'name': file_obj.display_name,
                'original_name': file_obj.original_name,
                'description': file_obj.description,
                'size': file_obj.size,
                'upload_date': file_obj.upload_date.isoformat() if file_obj.upload_date else '',
                'share_token': file_obj.share_token,
                'download_count': file_obj.download_count
            })
    
    # Sort by upload date (newest first)
    files_list.sort(key=lambda x: x['upload_date'], reverse=True)
    
    return render_template('index.html', files=files_list)

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload"""
    from models import FileMetadata
    
    try:
        if 'files' not in request.files:
            return jsonify({'success': False, 'error': 'No files provided'}), 400
        
        files = request.files.getlist('files')
        uploaded_files = []
        
        for file in files:
            if not file or file.filename == '':
                continue
                
            if not allowed_file(file.filename):
                return jsonify({
                    'success': False, 
                    'error': f'File type not allowed for {file.filename}. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'
                }), 400
            
            # Get custom name and description from form data
            custom_name = request.form.get('file_name', '').strip()
            description = request.form.get('file_description', '').strip()
            
            # Generate unique filename
            original_filename = secure_filename(file.filename or '')
            display_name = custom_name if custom_name else original_filename
            file_id = str(uuid.uuid4())
            filename = f"{file_id}_{original_filename}"
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            
            # Save file
            file.save(filepath)
            
            # Get file information
            file_size = os.path.getsize(filepath)
            file_hash = get_file_hash(filepath)
            share_token = generate_share_token()
            
            # Check for duplicates
            existing_file = get_file_by_hash(file_hash)
            if existing_file and os.path.exists(existing_file.path):
                # Remove the newly uploaded duplicate
                os.remove(filepath)
                uploaded_files.append({
                    'id': existing_file.id,
                    'name': existing_file.original_name,
                    'size': existing_file.size,
                    'share_token': existing_file.share_token,
                    'message': f'Duplicate of existing file: {existing_file.original_name}'
                })
            else:
                # Create new file metadata
                file_metadata = FileMetadata(
                    id=file_id,
                    original_name=original_filename,
                    display_name=display_name,
                    description=description,
                    filename=filename,
                    path=filepath,
                    size=file_size,
                    hash=file_hash,
                    upload_date=datetime.utcnow(),
                    share_token=share_token,
                    download_count=0
                )
                
                db.session.add(file_metadata)
                
                uploaded_files.append({
                    'id': file_id,
                    'name': original_filename,
                    'size': file_size,
                    'share_token': share_token
                })
        
        # Commit all changes to database
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'files': uploaded_files,
            'message': f'Successfully uploaded {len(uploaded_files)} file(s)'
        })
        
    except RequestEntityTooLarge:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'File too large. Maximum size is 500MB'}), 413
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Upload error: {str(e)}")
        return jsonify({'success': False, 'error': 'Upload failed. Please try again.'}), 500

@app.route('/download/<file_id>')
def download_file(file_id):
    """Download file by ID"""
    file_obj = get_file_by_id(file_id)
    
    if not file_obj:
        abort(404)
    
    if not os.path.exists(file_obj.path):
        abort(404)
    
    # Increment download counter
    file_obj.download_count += 1
    db.session.commit()
    
    return send_file(
        file_obj.path,
        as_attachment=True,
        download_name=file_obj.original_name
    )

@app.route('/share/<share_token>')
def shared_file(share_token):
    """View shared file"""
    file_obj = get_file_by_share_token(share_token)
    
    if not file_obj or not os.path.exists(file_obj.path):
        abort(404)
    
    return render_template('shared.html', file_info={
        'id': file_obj.id,
        'name': file_obj.original_name,
        'size': file_obj.size,
        'upload_date': file_obj.upload_date.isoformat() if file_obj.upload_date else '',
        'download_count': file_obj.download_count
    })

@app.route('/delete/<file_id>', methods=['DELETE'])
def delete_file(file_id):
    """Delete a file"""
    try:
        file_obj = get_file_by_id(file_id)
        
        if not file_obj:
            return jsonify({'success': False, 'error': 'File not found'}), 404
        
        # Remove file from filesystem
        if os.path.exists(file_obj.path):
            os.remove(file_obj.path)
        
        # Remove from database
        db.session.delete(file_obj)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'File deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Delete error: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to delete file'}), 500

@app.route('/files')
def list_files():
    """API endpoint to list files"""
    files = get_all_files()
    files_list = []
    
    for file_obj in files:
        if os.path.exists(file_obj.path):
            files_list.append({
                'id': file_obj.id,
                'name': file_obj.display_name,
                'original_name': file_obj.original_name,
                'description': file_obj.description,
                'size': file_obj.size,
                'upload_date': file_obj.upload_date.isoformat() if file_obj.upload_date else '',
                'share_token': file_obj.share_token,
                'download_count': file_obj.download_count
            })
    
    files_list.sort(key=lambda x: x['upload_date'], reverse=True)
    return jsonify({'files': files_list})

@app.route('/edit-file/<file_id>', methods=['POST'])
def edit_file(file_id):
    """Edit file name and description"""
    try:
        data = request.get_json()
        new_name = data.get('name', '').strip()
        new_description = data.get('description', '').strip()
        
        if not new_name:
            return jsonify({'success': False, 'error': 'File name is required'}), 400
        
        file_obj = get_file_by_id(file_id)
        
        if not file_obj:
            return jsonify({'success': False, 'error': 'File not found'}), 404
        
        # Update file metadata
        file_obj.display_name = new_name
        file_obj.description = new_description
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'File updated successfully'})
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Edit file error: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to update file'}), 500

@app.errorhandler(413)
def too_large(e):
    return jsonify({'success': False, 'error': 'File too large. Maximum size is 500MB'}), 413

@app.errorhandler(404)
def not_found(e):
    return render_template('index.html', error='File not found'), 404

def migrate_json_to_database():
    """Migrate existing JSON metadata to PostgreSQL database"""
    from models import FileMetadata
    
    with app.app_context():
        metadata_file = os.path.join('metadata', 'files.json')
        if os.path.exists(metadata_file):
            try:
                with open(metadata_file, 'r') as f:
                    json_data = json.load(f)
                
                migrated_count = 0
                skipped_count = 0
                
                for file_id, file_info in json_data.items():
                    file_path = file_info.get('path', '')
                    # Verify file still exists in uploads
                    if os.path.exists(file_path):
                        # Check for existing record by ID first (idempotent)
                        existing_record = FileMetadata.query.filter_by(id=file_id).first()
                        if existing_record:
                            skipped_count += 1
                            app.logger.info(f'Skipping existing record: {file_info.get("original_name", "unknown")}')
                            continue
                        
                        # Get or compute file hash
                        file_hash = file_info.get('hash', '')
                        if not file_hash:  # Compute hash if missing
                            try:
                                file_hash = get_file_hash(file_path)
                                app.logger.info(f'Computed missing hash for {file_info.get("original_name", "unknown")}')
                            except Exception as e:
                                app.logger.error(f'Failed to compute hash for {file_path}: {str(e)}')
                                continue
                        
                        # Check for hash conflicts with different files
                        existing_file = FileMetadata.query.filter_by(hash=file_hash).first()
                        if existing_file:
                            skipped_count += 1
                            app.logger.info(f'Skipping duplicate by hash: {file_info.get("original_name", "unknown")} (duplicate of {existing_file.original_name})')
                            continue
                        
                        # Parse upload_date string to datetime
                        upload_date = None
                        if file_info.get('upload_date'):
                            try:
                                upload_date = datetime.fromisoformat(file_info['upload_date'].replace('Z', '+00:00'))
                            except:
                                upload_date = datetime.utcnow()
                        
                        # Create database record
                        file_metadata = FileMetadata(
                            id=file_id,
                            original_name=file_info.get('original_name', ''),
                            filename=file_info.get('filename', ''),
                            path=file_path,
                            size=file_info.get('size', 0),
                            hash=file_hash,
                            upload_date=upload_date or datetime.utcnow(),
                            share_token=file_info.get('share_token', generate_share_token()),
                            download_count=file_info.get('download_count', 0)
                        )
                        
                        db.session.add(file_metadata)
                        migrated_count += 1
                    else:
                        skipped_count += 1
                        app.logger.info(f'Skipping missing file: {file_path}')
                
                db.session.commit()
                app.logger.info(f'Migration complete: {migrated_count} files migrated, {skipped_count} skipped')
                    
            except Exception as e:
                db.session.rollback()
                app.logger.error(f'Migration error: {str(e)}')

# Run migration on startup
migrate_json_to_database()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
