import os
from dotenv import load_dotenv
from backend import create_app

load_dotenv()

app = create_app()

if __name__ == '__main__':
    PORT = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=PORT, debug=True)