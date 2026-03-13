import os
from dotenv import load_dotenv
from backend import create_app
import secrets

load_dotenv()

app = create_app()

admin_token = secrets.token_urlsafe(16)
app.config['ADMIN_LOGIN_TOKEN'] = admin_token

base_url = os.getenv('BASE_URL', 'http://127.0.0.1')
print(f"Admin Login Link: {base_url}/login?token={admin_token}")
print(f"Student Login Link: {base_url}/login")

if __name__ == '__main__':
    PORT = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=PORT, debug=False)