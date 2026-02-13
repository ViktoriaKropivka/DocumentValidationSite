# test_admin_api.py
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def print_response(response, description):
    """Красиво печатает ответ от сервера"""
    print(f"\n{'='*60}")
    print(f"🔍 {description}")
    print(f"{'='*60}")
    print(f"Статус: {response.status_code}")
    try:
        print(f"Ответ: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except:
        print(f"Ответ: {response.text}")
    print()

def main():
    print("🚀 НАЧИНАЕМ ПРОВЕРКУ АДМИН-ЭНДПОИНТОВ")
    
    # ШАГ 1: Логинимся админом
    print("📌 ШАГ 1: Вход в систему как администратор")
    login_data = {
        "email": "test@mail.com",  # Ваш email админа
        "password": "123456"          # Ваш пароль
    }
    
    response = requests.post(f"{BASE_URL}/login/", json=login_data)
    print_response(response, "Логин")
    
    if response.status_code != 200:
        print("❌ Не удалось войти. Проверьте email/пароль")
        return
    
    token = response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # ШАГ 2: Получаем список пользователей
    print("📌 ШАГ 2: Получение списка всех пользователей")
    response = requests.get(f"{BASE_URL}/admin/users", headers=headers)
    print_response(response, "Список пользователей")
    
    if response.status_code != 200:
        print("❌ Нет доступа к списку пользователей. Проверьте права админа")
        print("   Возможные причины:")
        print("   - Роль пользователя не 'admin'")
        print("   - Эндпоинт /admin/users не подключен в main.py")
        return
    
    users = response.json()
    
    # Находим ID второго пользователя (если есть)
    admin_id = None
    user_id = None
    
    for user in users:
        if user["email"] == "test@mail.com":
            admin_id = user["id"]
        else:
            user_id = user["id"]
    
    # ШАГ 3: Если есть второй пользователь - меняем ему роль
    if user_id:
        print(f"📌 ШАГ 3: Изменение роли пользователя ID={user_id}")
        role_data = {"role": "moderator"}
        response = requests.put(
            f"{BASE_URL}/admin/users/{user_id}/role",
            headers=headers,
            json=role_data
        )
        print_response(response, "Изменение роли")
        
        # Проверяем, изменилась ли роль
        response = requests.get(f"{BASE_URL}/admin/users", headers=headers)
        users = response.json()
        for user in users:
            if user["id"] == user_id:
                print(f"✅ Новая роль пользователя {user['email']}: {user['role']}")
    else:
        print("⚠️ Нет второго пользователя. Зарегистрируйте ещё одного через сайт.")
    
    # ШАГ 4: Проверяем доступ к истории (разные права)
    print("\n📌 ШАГ 4: Проверка доступа к истории")
    
    # Как админ
    response = requests.get(f"{BASE_URL}/validation-history", headers=headers)
    print(f"Админ: {response.status_code}, количество записей: {len(response.json()) if response.status_code==200 else 'ошибка'}")
    
    # ШАГ 5: Если есть второй пользователь - пробуем его токен
    if user_id:
        print("\n📌 ШАГ 5: Проверка обычного пользователя")
        # Логинимся как обычный пользователь
        user_login = {
            "email": "user2@mail.com",  # Замените на email вашего второго пользователя
            "password": "123456"           # Замените на пароль
        }
        response = requests.post(f"{BASE_URL}/login/", json=user_login)
        if response.status_code == 200:
            user_token = response.json().get("access_token")
            user_headers = {"Authorization": f"Bearer {user_token}"}
            
            # Пробуем получить историю
            response = requests.get(f"{BASE_URL}/validation-history", headers=user_headers)
            print(f"Обычный пользователь (своя история): {response.status_code}")
            
            # Пробуем получить список пользователей (должен быть 403)
            response = requests.get(f"{BASE_URL}/admin/users", headers=user_headers)
            print(f"Обычный пользователь (попытка админки): {response.status_code} - ожидается 403")
    
    print("\n🎉 ПРОВЕРКА ЗАВЕРШЕНА!")

if __name__ == "__main__":
    main()