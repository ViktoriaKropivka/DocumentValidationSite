from typing import Union
from io import BytesIO
try:
    import PyPDF2
except Exception:
    PyPDF2 = None

def extract_pdf_text(path_or_bytes: Union[str, bytes]) -> str:
    if PyPDF2 is None:
        raise RuntimeError("PyPDF2 not installed")

    text_parts = []

    try:
        if isinstance(path_or_bytes, bytes):
            reader = PyPDF2.PdfReader(BytesIO(path_or_bytes))
            for p in reader.pages:
                text_parts.append(p.extract_text() or "")
        else:
            with open(path_or_bytes, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for p in reader.pages:
                    text_parts.append(p.extract_text() or "")
    except Exception:
        return ""

    return "\n".join(text_parts)
