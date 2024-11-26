import os
import json
from PyPDF2 import PdfReader
from docx import Document
from typing import List
from langchain.text_splitter import RecursiveCharacterTextSplitter

class FileProcessor:
    def __init__(self, file_path: str, file_name: str, assistant_id: str, content_type: str):
        self.file_path = file_path
        self.file_name = file_name
        self.assistant_id = assistant_id
        self.content_type = content_type

    def parse_file(self) -> str:
        """Parses the content of a file based on its type (PDF or DOCX)."""
        text = ""
        if self.content_type == "application/pdf":
            with open(self.file_path, "rb") as f:
                reader = PdfReader(f)
                for page in reader.pages:
                    text += page.extract_text()
        elif self.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            doc = Document(self.file_path)
            text = "\n".join(paragraph.text for paragraph in doc.paragraphs)
        return text

    def chunk_text(self, text: str, chunk_size: int = 300) -> List[str]:
        """Splits the parsed text into chunks of specified word count."""
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=50,
            separators=["\n\n", "\n", ".", " "]
        )
        return splitter.split_text(text)
        

    def create_json_data(self, chunks: List[str]) -> dict:
        """Creates a JSON structure for the document with filename, assistant ID, and chunks."""
        return {
            "FileName": self.file_name,
            "AssistantID": self.assistant_id,
            "Content": [
                {"chunk_id": i + 1, "text": chunk} for i, chunk in enumerate(chunks)
            ]
        }