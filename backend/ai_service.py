import requests
import logging
import re
from typing import Dict, Any, List, Optional
from datetime import datetime

from rule_executor import RuleExecutor
from database.models import DocumentValidation

logger = logging.getLogger(__name__)

OLLAMA_URL = "http://localhost:11434/api/generate"
RECOMMENDED_MODEL = "qwen2.5:3b-instruct"

AVAILABLE_RULES = {
    "CHECK_TITLE": "Проверка наличия заголовка",
    "CHECK_DATE": "Проверка наличия даты",
    "CHECK_SIGNATURE": "Проверка наличия подписи/ответственного",
    "CHECK_EMAIL": "Проверка email",
    "CHECK_PHONE": "Проверка формата телефона",
    "CHECK_LINKS": "Проверка наличия ссылок/цитат",
    "CHECK_INTRO": "Проверка наличия введения",
    "CHECK_CONCLUSION": "Проверка наличия заключения",
    "CHECK_SECTIONS": "Проверка наличия разделов/глав",
    "CHECK_DUPLICATES": "Поиск дубликатов абзацев",
    "CHECK_MIN_LENGTH": "Проверка минимального объёма",
    "CHECK_STRUCTURE_BASIC": "Базовая проверка структуры",
    "CHECK_FORMATTING": "Проверка форматирования (отступы/лишние пробелы)",
    "CHECK_LISTS": "Проверка наличия списков"
}

KEYWORD_MAP = {
    "заголов": "CHECK_TITLE",
    "title": "CHECK_TITLE",
    "дата": "CHECK_DATE",
    "подпис": "CHECK_SIGNATURE",
    "signature": "CHECK_SIGNATURE",
    "email": "CHECK_EMAIL",
    "почт": "CHECK_EMAIL",
    "тел": "CHECK_PHONE",
    "phone": "CHECK_PHONE",
    "ссылка": "CHECK_LINKS",
    "http": "CHECK_LINKS",
    "введение": "CHECK_INTRO",
    "вступлен": "CHECK_INTRO",
    "заключен": "CHECK_CONCLUSION",
    "вывод": "CHECK_CONCLUSION",
    "раздел": "CHECK_SECTIONS",
    "глава": "CHECK_SECTIONS",
    "дублик": "CHECK_DUPLICATES",
    "копия": "CHECK_DUPLICATES",
    "объём": "CHECK_MIN_LENGTH",
    "длин": "CHECK_MIN_LENGTH",
    "структур": "CHECK_STRUCTURE_BASIC",
    "формат": "CHECK_FORMATTING",
    "список": "CHECK_LISTS",
    "нумер": "CHECK_LISTS"
}


class AIService:
    def __init__(self, preferred_model: Optional[str] = None):
        self.model = preferred_model or RECOMMENDED_MODEL
        self.ollama_url = OLLAMA_URL
        self.timeout = 25
        self._cache: Dict[str, Any] = {}
        logger.info(f"AIService initialized with model: {self.model}")

    async def generate_checks(self, user_request: str) -> Dict[str, Any]:
        """
        Возвращает структуру:
        {
          "original_request": str,
          "checks": [ {id, description, check_type, parameters, priority, category}, ... ],
          "total_checks": int,
          "model_used": str
        }
        """
        key = user_request.strip().lower()
        if key in self._cache:
            logger.debug("Using cached checks")
            return self._cache[key]

        rule_ids = self._classify_request_with_model(user_request)

        if not rule_ids:
            rule_ids = self._fallback_keyword_match(user_request)

        checks = []
        for i, rid in enumerate(rule_ids, start=1):
            checks.append({
                "id": i,
                "description": AVAILABLE_RULES.get(rid, rid),
                "check_type": rid,
                "parameters": {},
                "priority": "medium",
                "category": self._map_category(rid)
            })

        result = {
            "original_request": user_request,
            "checks": checks,
            "total_checks": len(checks),
            "model_used": self.model
        }

        self._cache[key] = result
        return result

    async def validate_document(
        self,
        document_text: str,
        checks: Optional[List[Dict[str, Any]]] = None,
        user_id: Optional[int] = None,
        db=None,
    ) -> Dict[str, Any]:

        start = datetime.now()
        executor = RuleExecutor(document_text)
        results: List[Dict[str, Any]] = []

        checks_list: List[Dict[str, Any]] = list(checks or [])
        checks_list = [c for c in checks_list if c is not None]

        for check in checks_list:
            rid = check.get("check_type") or check.get("id")
            if not rid:
                continue

            params = check.get("parameters") or {}

            try:
                passed, message = executor.run_rule(str(rid), params)
            except Exception as e:
                passed, message = False, f"Ошибка выполнения правила: {e}"

            results.append({
                "check_id": check.get("id", 0),
                "check": check.get("description", ""),
                "check_type": str(rid),
                "passed": passed,
                "message": message,
                "parameters": params
            })

        failed = [r for r in results if not r["passed"]]
        ai_advice = self._generate_simple_advice(failed)
        summary = self._generate_summary(results, start)

        response = {
            "results": results,
            "ai_advice": ai_advice,
            "summary": summary
        }

        if user_id is not None and db is not None:
            try:
                validation_entry = DocumentValidation(
                    user_id=user_id,
                    document_name="Validated Document",
                    original_text=document_text,
                    validation_results=response
                )
                db.add(validation_entry)
                db.commit()
                db.refresh(validation_entry)
            except Exception:
                db.rollback()

        return response


    def _classify_request_with_model(self, user_request: str) -> List[str]:
        """
        Отправляет краткий prompt в модель, ожидает список идентификаторов правил.
        Возвращаем список rule_ids или пустой список при неудаче.
        """
        prompt = self._build_selector_prompt(user_request)
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_predict": 80,
                "temperature": 0.0
            }
        }

        try:
            resp = requests.post(self.ollama_url, json=payload, timeout=self.timeout)
            if resp.status_code == 200:
                parsed = resp.json()
                text = parsed.get("response", "").strip()
                logger.debug(f"LLM selector raw response: {text!r}")
                ids = self._parse_selector_response(text)
                ids = [i for i in ids if i in AVAILABLE_RULES]
                return ids[:6]
            else:
                logger.warning(f"Ollama returned {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.exception(f"Model classification failed: {e}")

        return []

    def _build_selector_prompt(self, user_request: str) -> str:
        rule_list = "\n".join([f"{k} - {v}" for k, v in AVAILABLE_RULES.items()])
        return (
            "You are a rule selector. User asks to check a document in Russian or English.\n"
            "Choose from the EXACT rule identifiers below (one per line). Do NOT invent new rules.\n\n"
            "Available rules:\n"
            f"{rule_list}\n\n"
            f"User request (do not translate): \"{user_request}\"\n\n"
            "Return only rule identifiers, one per line, in UPPERCASE. Example:\n"
            "CHECK_TITLE\nCHECK_DATE\n"
        )

    def _parse_selector_response(self, text: str) -> List[str]:
        text = text.strip()
        ids = []
        if text.startswith("[") and text.endswith("]"):
            try:
                import json
                arr = json.loads(text)
                for it in arr:
                    if isinstance(it, str):
                        ids.append(it.strip().upper())
                return ids
            except Exception:
                pass

        for line in text.splitlines():
            line = re.sub(r'[^A-Za-z0-9_]', '', line).upper().strip()
            if line:
                ids.append(line)
        return ids

    def _fallback_keyword_match(self, user_request: str) -> List[str]:
        req = user_request.lower()
        found = []
        for kw, rid in KEYWORD_MAP.items():
            if kw in req and rid not in found:
                found.append(rid)
        if not found:
            found = ["CHECK_STRUCTURE_BASIC", "CHECK_MIN_LENGTH"]
        return found[:6]

    def _map_category(self, rule_id: str) -> str:
        if rule_id in ("CHECK_TITLE", "CHECK_SECTIONS", "CHECK_STRUCTURE_BASIC", "CHECK_LISTS"):
            return "structure"
        if rule_id in ("CHECK_DATE", "CHECK_MIN_LENGTH", "CHECK_DUPLICATES"):
            return "content"
        if rule_id in ("CHECK_FORMATTING",):
            return "format"
        if rule_id in ("CHECK_EMAIL", "CHECK_PHONE", "CHECK_LINKS", "CHECK_SIGNATURE"):
            return "metadata"
        return "content"

    def _generate_simple_advice(self, failed_checks: List[Dict]) -> List[str]:
        adv = []
        for f in failed_checks:
            t = f.get("check_type", "")
            if t == "CHECK_TITLE":
                adv.append("Добавьте ясный заголовок в начале документа.")
            elif t == "CHECK_DATE":
                adv.append("Укажите дату создания документа (формат ДД.MM.ГГГГ или ГГГГ-MM-ДД).")
            elif t == "CHECK_SIGNATURE":
                adv.append("Добавьте подпись или указание ответственного лица.")
            elif t == "CHECK_PHONE":
                adv.append("Проверьте формат телефона: +7 (XXX) XXX-XX-XX или 8 (XXX) XXX-XX-XX.")
            elif t == "CHECK_EMAIL":
                adv.append("Проверьте корректность email-адресов в документе.")
            elif t == "CHECK_LINKS":
                adv.append("Добавьте источники/ссылки или проверьте их формат.")
            elif t == "CHECK_DUPLICATES":
                adv.append("Удалите повторяющиеся абзацы.")
            elif t == "CHECK_MIN_LENGTH":
                adv.append("Документ слишком короткий — добавьте содержательного текста.")
            elif t == "CHECK_FORMATTING":
                adv.append("Приведите форматирование документа к единому стилю.")
            else:
                adv.append(f"Проверьте правило: {f.get('check','')}")
            
        return list(dict.fromkeys(adv))

    def _generate_summary(self, results: List[Dict], start_time: datetime) -> Dict[str, Any]:
        total = len(results)
        passed = sum(1 for r in results if r["passed"])
        failed = total - passed
        return {
            "total_checks": total,
            "passed": passed,
            "failed": failed,
            "success_rate": round(passed / total * 100, 1) if total else 0,
            "processing_time_ms": int((datetime.now() - start_time).total_seconds() * 1000)
        }

    def clear_cache(self):
        self._cache.clear()

    def get_available_rules(self) -> Dict[str, str]:
        return AVAILABLE_RULES.copy()
    
    def default_checks(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": idx,
                "description": desc,
                "check_type": rule,
                "parameters": {}
            }
            for idx, (rule, desc) in enumerate([
                ("CHECK_TITLE", "Проверка наличия заголовка"),
                ("CHECK_DATE", "Проверка даты"),
                ("CHECK_SIGNATURE", "Поиск подписи/ответственного"),
                ("CHECK_EMAIL", "Поиск email"),
                ("CHECK_PHONE", "Поиск телефона"),
                ("CHECK_LINKS", "Поиск ссылок и цитирования"),
                ("CHECK_INTRO", "Поиск введения"),
                ("CHECK_CONCLUSION", "Поиск заключения"),
                ("CHECK_SECTIONS", "Поиск разделов документа"),
                ("CHECK_DUPLICATES", "Поиск дублирующихся абзацев"),
                ("CHECK_MIN_LENGTH", "Минимальный размер документа"),
                ("CHECK_STRUCTURE_BASIC", "Базовая структура документа"),
                ("CHECK_FORMATTING", "Проверка форматирования"),
                ("CHECK_LISTS", "Поиск списков в документе")
            ])
        ]

