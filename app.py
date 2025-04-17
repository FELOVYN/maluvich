import os
import base64
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView

app = Flask(__name__)

# Настройки
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///images.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'secret'  # для Flask-Admin

db = SQLAlchemy(app)

# Папка для хранения изображений
UPLOAD_FOLDER = 'static/images'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Модель базы данных
class Image(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(120), nullable=False)
    nickname = db.Column(db.String(80), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.Boolean, default=False)

# Админка
admin = Admin(app, name='Галерея', template_mode='bootstrap3')
admin.add_view(ModelView(Image, db.session))

# Главная страница с холстом
@app.route('/draw')
def draw():
    return render_template('draw.html')

# Страница галереи
@app.route("/gallery")
def gallery():
    # images = Image.query.order_by(Image.created_at.desc()).all()
    images = Image.query.filter_by(status=True).order_by(Image.created_at.desc()).all()
    return render_template("gallery.html", images=images)

# Страница галереи
@app.route("/gallery_admin")
def gallery():
    images = Image.query.order_by(Image.created_at.desc()).all()
    # images = Image.query.filter_by(status=True).order_by(Image.created_at.desc()).all()
    return render_template("gallery.html", images=images)

# Сохранение изображения
@app.route("/save", methods=["POST"])
def save():
    data = request.get_json()
    image_data = data['image']
    nickname = data['nickname']

    # Убираем префикс data:image
    image_data = image_data.replace('data:image/png;base64,', '')
    image_bytes = base64.b64decode(image_data)

    # Уникальное имя файла
    filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
    filepath = os.path.join(UPLOAD_FOLDER, filename)

    # Сохраняем изображение
    with open(filepath, 'wb') as f:
        f.write(image_bytes)

    # Сохраняем в базу данных
    new_image = Image(filename=f"/static/images/{filename}", nickname=nickname, status = False)
    db.session.add(new_image)
    db.session.commit()

    return jsonify({"status": "saved"})

# Создание таблиц (если не существует)
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)
