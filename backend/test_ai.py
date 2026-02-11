import asyncio
from ai_service import AIService

async def main():
    svc = AIService()
    req = "проверь заголовок, есть ли дата и телефон"
    checks = await svc.generate_checks(req)
    print("Generated checks:", checks)
    doc = "Документ пример\n\nВведение\nЭто пример текста. Телефон: +7 (123) 456-78-90\n\nЗаключение.\n"
    val = await svc.validate_document(doc, checks["checks"])
    print("Validation:", val)

if __name__ == "__main__":
    asyncio.run(main())
