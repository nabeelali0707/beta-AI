import logging
import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Analysis, User
from app.db.session import get_db
from app.dependencies import get_current_user
from app.schemas.analysis import (
    AIAnalysisRequest,
    AIAnalysisResponse,
    FullReportRequest,
    FullReportResponse,
    PlagiarismRequest,
    PlagiarismResponse,
    SummaryRequest,
    SummaryResponse,
)
from app.services.ai_detection_service import ai_detection_service
from app.services.analytics_service import analytics_service
from app.services.plagiarism_service import plagiarism_service
from app.services.summarization_service import summarization_service
from app.services.supabase_service import supabase_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/ai-detect", response_model=AIAnalysisResponse)
async def detect_ai_content(
    request: AIAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Detect AI-generated content"""
    try:
        result = await ai_detection_service.detect_ai_content(request.text)

        # Save to history
        analysis = Analysis(
            user_id=current_user.id,
            title=request.title,
            ai_score=result["ai_score"],
            metadata=json.dumps(result),
        )
        db.add(analysis)
        await db.commit()

        return {
            "ai_score": result["ai_score"],
            "confidence_score": result["confidence_score"],
            "sentence_analysis": result["sentence_analysis"],
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error in AI detection: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Analysis failed")


@router.post("/plagiarism", response_model=PlagiarismResponse)
async def detect_plagiarism(
    request: PlagiarismRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Detect plagiarism"""
    try:
        result = await plagiarism_service.detect_plagiarism(request.text)

        # Save to history
        analysis = Analysis(
            user_id=current_user.id,
            title=request.title,
            plagiarism_score=result["plagiarism_score"],
            metadata=json.dumps(result),
        )
        db.add(analysis)
        await db.commit()

        return {
            "plagiarism_score": result["plagiarism_score"],
            "matched_sections": result["matched_sections"],
            "matches_found": result["matches_found"],
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error in plagiarism detection: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Analysis failed")


@router.post("/summarize", response_model=SummaryResponse)
async def summarize_text(
    request: SummaryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate text summary"""
    try:
        result = await summarization_service.summarize(request.text, request.summary_type.value)

        # Save to history
        analysis = Analysis(
            user_id=current_user.id,
            title=request.title,
            summary=result["summary"],
            metadata=json.dumps(result),
        )
        db.add(analysis)
        await db.commit()

        return {
            "summary": result["summary"],
            "summary_type": request.summary_type,
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error in summarization: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Summarization failed")


@router.post("/full-report", response_model=FullReportResponse)
async def generate_full_report(
    request: FullReportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate comprehensive analysis report"""
    try:
        # Run all analyses in parallel
        ai_result = await ai_detection_service.detect_ai_content(request.text)
        plagiarism_result = await plagiarism_service.detect_plagiarism(request.text)
        summary_result = await summarization_service.summarize(request.text, "short")
        analytics_result = analytics_service.calculate_analytics(request.text)

        # Save to history
        analysis = Analysis(
            user_id=current_user.id,
            title=request.title,
            ai_score=ai_result["ai_score"],
            plagiarism_score=plagiarism_result["plagiarism_score"],
            summary=summary_result["summary"],
            metadata=json.dumps(
                {
                    "ai": ai_result,
                    "plagiarism": plagiarism_result,
                    "summary": summary_result,
                    "analytics": analytics_result,
                }
            ),
        )
        db.add(analysis)
        await db.commit()

        return {
            "ai_score": ai_result["ai_score"],
            "plagiarism_score": plagiarism_result["plagiarism_score"],
            "summary": summary_result["summary"],
            "analytics": analytics_result,
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating full report: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Report generation failed")
