import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import UploadedFile, User
from app.db.session import get_db
from app.dependencies import get_current_user
from app.schemas.file import FileUploadResponse
from app.services.file_handler_service import file_handler_service
from app.services.supabase_service import supabase_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload and process a file (PDF, DOCX, TXT)"""
    try:
        # Read file content
        content = await file.read()

        if not content:
            raise ValueError("File is empty")

        # Extract text from file
        file_info = await file_handler_service.extract_text_from_file(content, file.filename)
        storage_path = f"{current_user.id}/{file_info['file_id']}{file_info['extension']}"
        storage_url = await supabase_service.upload_file(
            storage_path,
            content,
            file_info["content_type"],
        )

        # Save file metadata to database
        uploaded_file = UploadedFile(
            user_id=current_user.id,
            file_name=file.filename,
            file_type=file_info["extension"],
            file_url=storage_url or f"/api/v1/files/{file_info['file_id']}",
        )

        db.add(uploaded_file)
        await db.commit()
        await db.refresh(uploaded_file)

        logger.info(f"File uploaded: {file.filename} by user {current_user.email}")

        return {
            "id": str(uploaded_file.id),
            "file_name": uploaded_file.file_name,
            "file_type": uploaded_file.file_type,
            "file_url": uploaded_file.file_url,
            "uploaded_at": uploaded_file.uploaded_at.isoformat(),
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="File upload failed")


@router.get("/files")
async def get_user_files(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get user's uploaded files"""
    try:
        result = await db.execute(
            select(UploadedFile)
            .where(UploadedFile.user_id == current_user.id)
            .order_by(UploadedFile.uploaded_at.desc())
        )
        files = result.scalars().all()

        return {
            "files": [
                {
                    "id": str(f.id),
                    "file_name": f.file_name,
                    "file_type": f.file_type,
                    "file_url": f.file_url,
                    "uploaded_at": f.uploaded_at.isoformat(),
                }
                for f in files
            ]
        }

    except Exception as e:
        logger.error(f"Error fetching files: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch files")
