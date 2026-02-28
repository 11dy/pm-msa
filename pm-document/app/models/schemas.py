from pydantic import BaseModel


class DocumentRegisterRequest(BaseModel):
    userId: int
    projectId: int | None = None
    filename: str
    originalFilename: str
    fileType: str
    fileSize: int
    storagePath: str


class DocumentResponse(BaseModel):
    id: int
    userId: int
    projectId: int | None = None
    filename: str
    originalFilename: str
    fileType: str
    fileSize: int
    storagePath: str
    status: str
    chunkCount: int | None = None
    errorMessage: str | None = None
    createdAt: str | None = None
    updatedAt: str | None = None


class Chunk(BaseModel):
    index: int
    content: str
