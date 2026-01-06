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
import datetime
import random
import os

from dotenv import load_dotenv
from werkzeug.utils import secure_filename
from services import get_data_manager, get_email_service
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

# ---------------- SERVICES SETUP ----------------
data_manager = get_data_manager("Client_Project_Submissions")
community_manager = get_data_manager("Community_Posts")
activity_manager = get_data_manager("Activity_Log")
email_service = get_email_service(app, mail)


@app.context_processor
def inject_supabase():
    return dict(
        SUPABASE_URL=os.getenv("SUPABASE_URL"),
        SUPABASE_ANON_KEY=os.getenv("SUPABASE_ANON_KEY"),
    )


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
    subject = f"Project Received — {project_id}"
    body = f"""
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
    
    email_service.send_email(subject, [email], body)


def send_admin_email(admin_email, data, filepath=None):
    """Send notification email to admin."""
    # Logic is now handled inside email_service, including checking for valid sender/recipients
    if not admin_email:
         print("No admin email configured.")
         return

    file_notice = (
        f"Attached File: {os.path.basename(filepath)}"
        if filepath
        else "No file uploaded."
    )

    msg_body = f"""
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


    email_service.send_email(
        subject=f"New project submission received — {data['project_id']}",
        recipients=[admin_email],
        body=msg_body,
        attachment_path=filepath,
        app_instance=app
    )


# ---------------- ROUTES ----------------
@app.route("/")
def home():
    return render_template("index.html")


@app.route("/login")
def login():
    return render_template("login.html")


@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")


@app.route("/oauth/consent")
def oauth_consent():
    """OAuth consent page route."""
    return render_template("oauth_consent.html")


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

    # Save data
    data_manager.append_row([
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
    
    # Log Activity
    activity_manager.append_row([date_submitted, "New Project Submission", f"Project ID: {project_id} by {name}"])

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
            <br><br>
            <a href="/community" style="background:#10b981;">Visit Community Hub</a>
        </div>
    </body>
    </html>
    """

# ---------------- COMMUNITY SECTION ----------------
@app.route("/community")
def community():
    """Community page to display posts."""
    posts = community_manager.get_all_values()
    # If GSheets returns list of lists, we might need to map them to dicts if we want cleaner template usage.
    # For now assume list: [Date, Name, Content]
    return render_template("community.html", posts=posts)

@app.route("/community/post", methods=["POST"])
def community_post():
    """Handle new community post."""
    name = request.form.get("name", "Anonymous")
    content = request.form.get("content")
    
    if not content:
        return redirect(url_for("community"))

    date_posted = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Structure: [Date, Name, Content]
    community_manager.append_row([date_posted, name, content])
    
    # Log Activity
    activity_manager.append_row([date_posted, "New Community Post", f"By {name}"])
    
    return redirect(url_for("community"))


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
    # Get all values from data manager
    data = data_manager.get_all_values()
    if data and len(data) > 1:
         data = data[1:] # skip header if it exists
    
    # Analytics
    total_projects = len(data)
    recent_activities = activity_manager.get_all_values()
    
    # Filter "New Project Submission" and "New Community Post" counts if wanted, or just total logs
    
    if recent_activities:
        recent_activities.reverse() # Show newest first
        recent_activities = recent_activities[:10] # Limit to 10
    
    community_posts = community_manager.get_all_values()
    
    stats = {
        "total_projects": total_projects,
        "community_posts": len(community_posts),
        "recent_activity_count": len(recent_activities) if recent_activities else 0
    }

    return render_template("admin.html", data=data, stats=stats, activities=recent_activities)


@app.route("/logout", methods=["POST"])
def logout():
    """Logout admin."""
    session.pop("admin_logged_in", None)
    return redirect(url_for("admin_login"))


# ---------------- MAIN ----------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
