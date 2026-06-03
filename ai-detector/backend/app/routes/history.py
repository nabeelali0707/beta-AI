import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Analysis, User
from app.db.session import get_db
from app.dependencies import get_current_user
from app.schemas.history import HistoryItem, HistoryList

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("", response_model=HistoryList)
async def get_history(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get user's analysis history"""
    try:
        result = await db.execute(
            select(Analysis)
            .where(Analysis.user_id == current_user.id)
            .order_by(Analysis.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        analyses = result.scalars().all()

        return {
            "history": [
                {
                    "id": str(a.id),
                    "title": a.title,
                    "ai_score": a.ai_score,
                    "plagiarism_score": a.plagiarism_score,
                    "summary": a.summary,
                    "metadata": a.metadata_json,
                    "created_at": a.created_at.isoformat(),
                }
                for a in analyses
            ]
        }

    except Exception as e:
        logger.error(f"Error fetching history: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch history")


@router.get("/{history_id}", response_model=HistoryItem)
async def get_history_item(
    history_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get specific analysis"""
    try:
        result = await db.execute(
            select(Analysis).where(
                (Analysis.id == history_id) & (Analysis.user_id == current_user.id)
            )
        )
        analysis = result.scalars().first()

        if not analysis:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")

        return {
            "id": str(analysis.id),
            "title": analysis.title,
            "ai_score": analysis.ai_score,
            "plagiarism_score": analysis.plagiarism_score,
            "summary": analysis.summary,
            "metadata": analysis.metadata_json,
            "created_at": analysis.created_at.isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching analysis: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch analysis")


@router.delete("/{history_id}")
async def delete_history_item(
    history_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete analysis"""
    try:
        result = await db.execute(
            select(Analysis).where(
                (Analysis.id == history_id) & (Analysis.user_id == current_user.id)
            )
        )
        analysis = result.scalars().first()

        if not analysis:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")

        await db.delete(analysis)
        await db.commit()

        logger.info(f"Analysis deleted: {history_id}")

        return {"message": "Analysis deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting analysis: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete analysis")
