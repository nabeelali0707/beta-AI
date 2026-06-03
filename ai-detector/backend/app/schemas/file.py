from pydantic import BaseModel


class FileUploadResponse(BaseModel):
    id: str
    file_name: str
    file_type: str
    file_url: str
    uploaded_at: str

    class Config:
        orm_mode = True
