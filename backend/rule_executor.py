import re
from typing import Callable, Tuple, Dict, Any, List
import hashlib

try:
    import PyPDF2
    HAS_PYPDF2 = True
except Exception:
    HAS_PYPDF2 = False

CHUNK_SIZE = 8000


class RuleExecutor:
    def __init__(self, text: str):
        self.text = text or ""
        self.text_lower = self.text.lower()
        self.lines = self.text.splitlines()
        self.non_empty_lines = [ln.strip() for ln in self.lines if ln.strip()]
        self.chunks = self._split_into_chunks(self.text)

        self.rules: Dict[
            str,
            Callable[[str, Dict[str, Any]], Tuple[bool, str]]
        ] = {
            "CHECK_TITLE": self._rule_check_title,
            "CHECK_DATE": self._rule_check_date,
            "CHECK_SIGNATURE": self._rule_check_signature,
            "CHECK_EMAIL": self._rule_check_email,
            "CHECK_PHONE": self._rule_check_phone,
            "CHECK_LINKS": self._rule_check_links,
            "CHECK_INTRO": self._rule_check_intro,
            "CHECK_CONCLUSION": self._rule_check_conclusion,
            "CHECK_SECTIONS": self._rule_check_sections,
            "CHECK_DUPLICATES": self._rule_check_duplicates,
            "CHECK_MIN_LENGTH": self._rule_check_min_length,
            "CHECK_STRUCTURE_BASIC": self._rule_check_structure_basic,
            "CHECK_FORMATTING": self._rule_check_formatting,
            "CHECK_LISTS": self._rule_check_lists,
            "CHECK_ABSTRACT": self._rule_check_abstract,
            "CHECK_AUTHOR": self._rule_check_author,
            "CHECK_NUMBERING_CONTINUITY": self._rule_check_numbering_continuity,
            "CHECK_DOCUMENT_TYPE_KEYWORDS": self._rule_check_document_type_keywords,
            "CHECK_STYLE_CAPS": self._rule_check_style_caps,
            "CHECK_TABLES": self._rule_check_tables,
            "CHECK_IMAGES": self._rule_check_images,
            "CHECK_REFERENCES_SECTION": self._rule_check_references_section,
            "CHECK_PAGE_NUMBERS": self._rule_check_page_numbers,
            "CHECK_REQUIRED_SECTIONS": self._rule_check_required_sections,
        }

    def _split_into_chunks(self, text: str) -> List[str]:
        return [text[i:i + CHUNK_SIZE] for i in range(0, len(text), CHUNK_SIZE)]

    def _run_single_chunk(
        self, rule_fn: Callable[[str, Dict[str, Any]], Tuple[bool, str]],
        chunk: str,
        params: Dict[str, Any]
    ) -> Tuple[bool, str]:
        try:
            return rule_fn(chunk, params)
        except Exception as e:
            return False, f"Ошибка выполнения: {e}"

    def run_rule(self, rule_id: str, params: Dict[str, Any]) -> Tuple[bool, str]:
        if rule_id not in self.rules:
            return False, f"Правило '{rule_id}' не найдено"

        rule_fn = self.rules[rule_id]
        results = [self._run_single_chunk(rule_fn, ch, params) for ch in self.chunks]

        if any(r[0] for r in results):
            return True, next(r[1] for r in results if r[0])
        return False, results[0][1]
    
    def _rule_check_title(self, chunk, params):
        sample = self.non_empty_lines[:6]
        for ln in sample:
            ln = ln.strip()
            if 6 <= len(ln) <= 200 and not ln.endswith('.') and not ln.isdigit():
                return True, "Заголовок найден"
        return False, "Заголовок не найден"

    def _rule_check_date(self, chunk, params):
        patterns = [
            r'\b\d{1,2}\.\d{1,2}\.\d{2,4}\b',
            r'\b\d{1,2}/\d{1,2}/\d{2,4}\b',
            r'\b\d{4}-\d{2}-\d{2}\b',
            r'\b\d{1,2}-\d{1,2}-\d{2,4}\b'
        ]
        for p in patterns:
            if re.search(p, chunk):
                return True, "Дата найдена"
        return False, "Дата не найдена"

    def _rule_check_signature(self, chunk, params):
        for word in ['подпись', 'утверждено', 'согласовано', 'директор']:
            if word in chunk.lower():
                return True, "Подпись найдена"
        return False, "Подпись не найдена"

    def _rule_check_email(self, chunk, params):
        found = re.findall(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', chunk)
        return (True, f"Email: {found[0]}") if found else (False, "Email не найден")

    def _rule_check_phone(self, chunk, params):
        if re.search(r'\+?\d[\d()\s-]{7,}', chunk):
            return True, "Телефон найден"
        return False, "Телефон не найден"

    def _rule_check_links(self, chunk, params):
        if re.search(r'http[s]?://', chunk):
            return True, "Ссылки найдены"
        return False, "Ссылки не найдены"

    def _rule_check_intro(self, chunk, params):
        for ind in ['введение', 'в данном документе', 'цель документа']:
            if ind in chunk.lower():
                return True, "Введение найдено"
        return False, "Введение не найдено"

    def _rule_check_conclusion(self, chunk, params):
        for ind in ['заключение', 'выводы', 'итоги']:
            if ind in chunk.lower():
                return True, "Заключение найдено"
        return False, "Заключение не найдено"

    def _rule_check_sections(self, chunk, params):
        if re.search(r'^\s*\d+\.', chunk, flags=re.MULTILINE):
            return True, "Секции найдены"
        return False, "Секции не найдены"

    def _rule_check_duplicates(self, chunk, params):
        paragraphs = [p.strip() for p in re.split(r'\n{2,}', chunk) if p.strip()]
        seen = set()
        for p in paragraphs:
            h = hashlib.md5(p.encode()).hexdigest()
            if h in seen:
                return False, "Дубликаты есть"
            seen.add(h)
        return True, "Дубликатов нет"

    def _rule_check_min_length(self, chunk, params):
        min_len = int(params.get("min_chars", 300))
        return (True, "Длина OK") if len(chunk.strip()) >= min_len \
            else (False, f"Слишком коротко (<{min_len})")

    def _rule_check_structure_basic(self, chunk, params):
        paragraphs = [p for p in re.split(r'\n{2,}', chunk) if p.strip()]
        if len(paragraphs) >= 3:
            return True, "Базовая структура есть"
        return False, "Структура слабая: мало абзацев"

    def _rule_check_formatting(self, chunk, params):
        if re.search(r' {2,}', chunk):
            return False, "Лишние пробелы"
        return True, "Форматирование OK"

    def _rule_check_lists(self, chunk, params):
        if re.search(r'^\s*[-*•]\s+', chunk, flags=re.MULTILINE):
            return True, "Списки есть"
        return False, "Списков нет"

    def _rule_check_abstract(self, chunk, params):
        for ln in self.non_empty_lines[:15]:
            if "аннотац" in ln.lower() or "резюме" in ln.lower():
                return True, "Аннотация найдена"
        return False, "Аннотация отсутствует"

    def _rule_check_author(self, chunk, params):
        if "автор" in self.text_lower:
            return True, "Автор найден"
        return False, "Автор отсутствует"

    def _rule_check_numbering_continuity(self, chunk, params):
        numbers = re.findall(r'^(\d+)\.', self.text, flags=re.MULTILINE)
        if len(numbers) <= 1:
            return True, "Недостаточно для проверки"
        expected = 1
        for num in map(int, numbers):
            if num != expected:
                return False, f"Ошибка нумерации: {expected}->{num}"
            expected += 1
        return True, "Нумерация OK"

    def _rule_check_document_type_keywords(self, chunk, params):
        doc_type = params.get("type", "").lower()
        patterns = {"тз": ["техническое задание"], "пз": ["пояснительная записка"], "отчет": ["отчет"]}
        if doc_type in patterns:
            if any(p in chunk.lower() for p in patterns[doc_type]):
                return True, "Тип документа подтвержден"
            return False, "Тип документа не совпадает"
        return True, "Тип не задан"

    def _rule_check_style_caps(self, chunk, params):
        for ln in chunk.splitlines():
            if ln.isupper() and len(ln) > 20:
                return False, "Капслок"
        return True, "Капслока нет"

    def _rule_check_tables(self, chunk, params):
        return (True, "Таблицы есть") if "таблица" in chunk.lower() else (False, "Таблиц нет")

    def _rule_check_images(self, chunk, params):
        return (True, "Рисунки есть") if any(k in chunk.lower() for k in ["рисунок", "figure"]) else (
            False, "Рисунков нет"
        )

    def _rule_check_references_section(self, chunk, params):
        for word in ["список литературы", "источники", "библиограф"]:
            if word in chunk.lower():
                return True, "Источники есть"
        return False, "Источников нет"

    def _rule_check_page_numbers(self, chunk, params):
        if re.findall(r'\b\d{1,3}\b', chunk):
            return True, "Номера страниц найдены"
        return False, "Номеров страниц нет"

    def _rule_check_required_sections(self, chunk, params):
        required = params.get("required", ["введение", "заключение"])
        missing = [s for s in required if s not in chunk.lower()]
        if missing:
            return False, f"Нет разделов: {', '.join(missing)}"
        return True, "Все обязательные разделы есть"

    @staticmethod
    def extract_text_from_pdf(path: str) -> str:
        if not HAS_PYPDF2:
            raise RuntimeError("PyPDF2 not available")
        res = []
        with open(path, "rb") as f:
            r = PyPDF2.PdfReader(f)
            for p in r.pages:
                res.append(p.extract_text() or "")
        return "\n".join(res)
