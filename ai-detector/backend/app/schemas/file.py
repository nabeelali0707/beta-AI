from pydantic import BaseModel, ConfigDict


class FileUploadResponse(BaseModel):
    id: str
    file_name: str
    file_type: str
    file_url: str
    uploaded_at: str
    extracted_text: str

    model_config = ConfigDict(from_attributes=True)
