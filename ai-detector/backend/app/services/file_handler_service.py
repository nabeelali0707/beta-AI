import io
import logging
import mimetypes
import uuid
from typing import Dict, Tuple

logger = logging.getLogger(__name__)


class FileHandlerService:
    ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

    async def extract_text_from_file(self, file_content: bytes, filename: str) -> Dict:
        """Extract text from PDF, DOCX, or TXT files"""
        if len(file_content) > self.MAX_FILE_SIZE:
            raise ValueError(f"File size exceeds maximum allowed size of {self.MAX_FILE_SIZE / 1024 / 1024}MB")

        ext = self._get_file_extension(filename)
        if ext not in self.ALLOWED_EXTENSIONS:
            raise ValueError(f"Unsupported file type. Allowed: {', '.join(self.ALLOWED_EXTENSIONS)}")

        try:
            if ext == ".pdf":
                text = self._extract_from_pdf(file_content)
            elif ext == ".docx":
                text = self._extract_from_docx(file_content)
            else:  # .txt
                text = self._extract_from_txt(file_content)

            if not text or len(text.strip()) == 0:
                raise ValueError("No readable text found in the file")

            file_id = str(uuid.uuid4())
            content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"

            return {
                "file_id": file_id,
                "filename": filename,
                "extension": ext,
                "content_type": content_type,
                "size": len(file_content),
                "text": text.strip(),
                "text_length": len(text.strip()),
            }

        except Exception as e:
            logger.error(f"Error extracting text from file {filename}: {e}")
            raise ValueError(f"Failed to process file: {str(e)}")

    def _get_file_extension(self, filename: str) -> str:
        """Get file extension"""
        import os

        _, ext = os.path.splitext(filename.lower())
        return ext

    def _extract_from_pdf(self, file_content: bytes) -> str:
        """Extract text from PDF"""
        try:
            import PyPDF2

            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            logger.error(f"Error extracting PDF: {e}")
            raise ValueError(f"Failed to read PDF: {str(e)}")

    def _extract_from_docx(self, file_content: bytes) -> str:
        """Extract text from DOCX"""
        try:
            from docx import Document

            doc = Document(io.BytesIO(file_content))
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        except Exception as e:
            logger.error(f"Error extracting DOCX: {e}")
            raise ValueError(f"Failed to read DOCX: {str(e)}")

    def _extract_from_txt(self, file_content: bytes) -> str:
        """Extract text from TXT"""
        try:
            return file_content.decode("utf-8", errors="ignore")
        except Exception as e:
            logger.error(f"Error extracting TXT: {e}")
            raise ValueError(f"Failed to read TXT: {str(e)}")


file_handler_service = FileHandlerService()
