from flask import (
    Flask,
    render_template,
    session,
    render_template_string,
    request,
    redirect,
    url_for,
)
from flask_mail import Mail, Message
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import datetime
import random
import os

from dotenv import load_dotenv
from werkzeug.utils import secure_filename

# ---------------- INITIAL SETUP ----------------
load_dotenv()
app = Flask(__name__)

# Folder for uploaded files
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# ---------------- EMAIL CONFIGURATION ----------------
app.config["MAIL_SERVER"] = "smtp.gmail.com"
app.config["MAIL_PORT"] = 587
app.config["MAIL_USE_TLS"] = True
app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")  # Your email
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")  # Your app password
mail = Mail(app)

# ---------------- GOOGLE SHEETS CONFIG ----------------
scope = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/drive",
]

sheet = None
client = None
if os.path.exists("credentials.json"):
    try:
        creds = ServiceAccountCredentials.from_json_keyfile_name(
            "credentials.json", scope)
        client = gspread.authorize(creds)
        sheet = client.open("Client_Project_Submissions").sheet1
    except Exception as e:
        print(f"Warning: Could not connect to Google Sheets: {e}")


# ---------------- HELPERS ----------------
def generate_project_id():
    """Generate unique project ID."""
    year = datetime.datetime.now().year
    rand = random.randint(1000, 9999)
    return f"PRJ-{year}-{rand}"


def save_uploaded_file(file, project_id):
    """Save uploaded file with a unique name."""
    if not file:
        return None
    filename = secure_filename(file.filename)
    if filename == "":
        return None
    new_filename = f"{project_id}_{filename}"
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], new_filename)
    file.save(filepath)
    return filepath


def send_client_email(email, name, project_id, title, service, date_submitted):
    """Send confirmation email to client."""
    if not app.config.get("MAIL_USERNAME"):
        print(f"Email sending disabled. Would send to {email}")
        return
    try:
        msg = Message(
            subject=f"Project Received — {project_id}",
            sender=app.config["MAIL_USERNAME"],
            recipients=[email],
        )
        msg.body = f"""
    Dear {name},

    Thank you for reaching out to Fuse-IN. Your project request has been received successfully.

    Project ID: {project_id}
    Project Title: {title}
    Service Type: {service}
    Submitted On: {date_submitted}

    I will review your details and contact you within 24–48 hours.

    Kind regards,
    Boniface Kalong
    Freelance Research Analyst | AI & Data Science Consultant
    """
        mail.send(msg)
    except Exception as e:
        print(f"Error sending client email: {e}")


def send_admin_email(admin_email, data, filepath=None):
    """Send notification email to admin."""
    if not app.config.get("MAIL_USERNAME") or not admin_email:
        print(f"Email sending disabled. Would send to {admin_email}")
        return
    try:
        msg = Message(
            subject=f"New Project Submission — {data['project_id']}",
            sender=app.config["MAIL_USERNAME"],
            recipients=[admin_email],
        )

        file_notice = (f"Attached File: {os.path.basename(filepath)}"
                       if filepath else "No file uploaded.")

        msg.body = f"""
    New project submission received.

    Project ID: {data["project_id"]}
    Name: {data["name"]}
    Email: {data["email"]}
    Title: {data["title"]}
    Service: {data["service"]}
    Description: {data["description"]}
    Tools: {data["tools"]}
    Deadline: {data["deadline"]}
    Budget: {data["budget"]}
    Submitted: {data["date_submitted"]}
    {file_notice}
    """

        # Attach file if exists
        if filepath and os.path.exists(filepath):
            with app.open_resource(filepath) as f:
                msg.attach(os.path.basename(filepath),
                           "application/octet-stream", f.read())

        mail.send(msg)
    except Exception as e:
        print(f"Error sending admin email: {e}")


# ---------------- ROUTES ----------------
@app.route("/")
def home():
    return redirect(url_for("form_page"))


@app.route("/start-project")
def form_page():
    return render_template("start-project.html")


@app.route("/submit", methods=["POST"])
def submit():
    # Extract form data
    name = request.form.get("name")
    email = request.form.get("email")
    title = request.form.get("title")
    service = request.form.get("service")
    description = request.form.get("description")
    tools = request.form.get("tools")
    deadline = request.form.get("deadline")
    budget = request.form.get("budget")
    uploaded_file = request.files.get("project_file")

    # Generate Project ID and timestamp
    project_id = generate_project_id()
    date_submitted = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Save uploaded file
    filepath = save_uploaded_file(uploaded_file, project_id)

    # Save data to Google Sheet
    if sheet:
        sheet.append_row([
            date_submitted,
            project_id,
            name,
            email,
            title,
            service,
            description,
            tools,
            deadline,
            budget,
            filepath or "No file",
        ])

    # Send emails
    send_client_email(email, name, project_id, title, service, date_submitted)
    send_admin_email(
        os.getenv("ADMIN_EMAIL"),
        {
            "project_id": project_id,
            "name": name,
            "email": email,
            "title": title,
            "service": service,
            "description": description,
            "tools": tools,
            "deadline": deadline,
            "budget": budget,
            "date_submitted": date_submitted,
        },
        filepath,
    )

    # Render confirmation page
    return f"""
    <html>
    <head>
        <title>Submission Received | Fuse-IN</title>
        <style>
            body {{
                background: linear-gradient(135deg, #0f172a, #1e293b);
                color: white;
                font-family: 'Inter', sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                text-align: center;
            }}
            .card {{
                background: rgba(255, 255, 255, 0.05);
                padding: 2rem 3rem;
                border-radius: 1rem;
                border: 1px solid rgba(255, 255, 255, 0.1);
                max-width: 600px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }}
            h1 {{
                color: #60a5fa;
                margin-bottom: 1rem;
            }}
            p {{
                color: rgba(255, 255, 255, 0.8);
                margin-bottom: 2rem;
                line-height: 1.6;
            }}
            a {{
                background: linear-gradient(135deg, #2563eb, #3b82f6);
                color: white;
                padding: 0.75rem 1.5rem;
                border-radius: 0.5rem;
                text-decoration: none;
                font-weight: 600;
                transition: all 0.3s ease;
            }}
            a:hover {{
                background: #60a5fa;
                transform: translateY(-2px);
            }}
        </style>
    </head>
    <body>
        <div class="card">
            <h1>✅ Project Submitted Successfully</h1>
            <p>Thank you, <strong>{name}</strong>!<br>
            Your project (<strong>{project_id}</strong>) has been received.<br>
            A confirmation email has been sent to <strong>Bonniface</strong>.</p>
            <a href="/">← Back to Home</a>
        </div>
    </body>
    </html>
    """


# ---------------- ADMIN SECTION ----------------
app.secret_key = os.getenv("APP_SECRET_KEY", "fusein_secret")


@app.route("/admin", methods=["GET", "POST"])
def admin_login():
    """Login page for admin access."""
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        if username == os.getenv("ADMIN_USER") and password == os.getenv(
                "ADMIN_PASS"):
            session["admin_logged_in"] = True
            return redirect(url_for("dashboard"))
        else:
            return render_template_string("""
            <html><body style='background:#0f172a;color:white;text-align:center;padding-top:20%;font-family:Inter;'>
            <h3>Invalid credentials.</h3><a href='/admin' style='color:#60a5fa;'>Try again</a></body></html>
            """)

    if "admin_logged_in" in session:
        return redirect(url_for("dashboard"))

    return render_template_string("""
    <html><body style='background:#0f172a;color:white;text-align:center;padding-top:10%;font-family:Inter;'>
    <h2>Fuse-IN Admin Login</h2>
    <form method='POST' style='margin-top:2rem;'>
        <input name='username' placeholder='Username' required style='padding:0.75rem;width:250px;border-radius:5px;'><br><br>
        <input name='password' type='password' placeholder='Password' required style='padding:0.75rem;width:250px;border-radius:5px;'><br><br>
        <button type='submit' style='background:#2563eb;color:white;padding:0.75rem 1.5rem;border:none;border-radius:5px;'>Login</button>
    </form>
    </body></html>
    """)


@app.route("/dashboard")
def dashboard():
    """Admin dashboard view."""
    if "admin_logged_in" not in session:
        return redirect(url_for("admin_login"))

    data = []
    if sheet:
        data = sheet.get_all_values()
        data = data[1:] if len(data) > 1 else []  # skip headers

    return render_template("admin.html", data=data)


@app.route("/logout", methods=["POST"])
def logout():
    """Logout admin."""
    session.pop("admin_logged_in", None)
    return redirect(url_for("admin_login"))


# ---------------- MAIN ----------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
