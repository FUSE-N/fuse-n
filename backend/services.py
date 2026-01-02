import os
import json
import datetime
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from flask_mail import Message
import firebase_admin
from firebase_admin import credentials, firestore

# Abstract Interfaces (Implicit)

class LocalDataManager:
    def __init__(self, collection_name="data"):
        self.filename = f"local_{collection_name}.json"
        if not os.path.exists(self.filename):
            with open(self.filename, 'w') as f:
                json.dump([], f)

    def append_row(self, data):
        """Append a row of data (list) to the local JSON file."""
        try:
            with open(self.filename, 'r') as f:
                db_data = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            db_data = []

        db_data.append(data)
        
        with open(self.filename, 'w') as f:
            json.dump(db_data, f, indent=4)
        print(f"[DEV] Data saved to {self.filename}: {data}")

    def get_all_values(self):
        """Return all data as a list of lists."""
        try:
            with open(self.filename, 'r') as f:
                return json.load(f)
        except Exception:
            return []

class GSheetsDataManager:
    def __init__(self, credentials_file, scope, sheet_name):
        self.creds = ServiceAccountCredentials.from_json_keyfile_name(credentials_file, scope)
        self.client = gspread.authorize(self.creds)
        try:
            self.sheet = self.client.open(sheet_name).sheet1
        except gspread.exceptions.SpreadsheetNotFound:
            # Fallback or create? For now just print warning and fail gracefully similar to init
            print(f"Warning: Sheet '{sheet_name}' not found.")
            self.sheet = None

    def append_row(self, data):
        if self.sheet:
            self.sheet.append_row(data)
        else:
            print(f"[Warn] No sheet found for append_row")

    def get_all_values(self):
        if self.sheet:
            return self.sheet.get_all_values()
        return []

class FirebaseDataManager:
    def __init__(self, key_path, collection_name):
        if not firebase_admin._apps:
            cred = credentials.Certificate(key_path)
            firebase_admin.initialize_app(cred)
        self.db = firestore.client()
        self.collection_name = collection_name
        print(f"[INFO] Initialized Firebase for {collection_name}")

    def append_row(self, data):
        # Data is a list. We need to convert to dict for Firestore or simple document.
        # For simplicity similar to sheets, let's create a doc with timestamp.
        # But wait, the app passes a list. We should key it properly or just store as 'data': list
        # detailed mapping would be better but let's stick to list storage for compatibility or minimal refactor.
        # Actually, let's map it if we can, or just store the raw list.
        # Storing as list:
        doc_data = {
            "created_at": datetime.datetime.now(),
            "raw_data": data
            # If we knew the schema here we could map it, e.g. name=data[2]
            # But the DataManager interface is generic 'append_row'.
            # Let's trust usage of 'raw_data' or try to map if list length matches known schemas.
            # A generic `raw_data` field is safest for a "list append" abstraction.
            # HOWEVER, existing templates (admin.html, community.html) expect a LIST (row[0], row[1]...)
            # So when we read back, we must return a LIST.
        }
        self.db.collection(self.collection_name).add(doc_data)

    def get_all_values(self):
        docs = self.db.collection(self.collection_name).stream()
        all_rows = []
        for doc in docs:
            d = doc.to_dict()
            if "raw_data" in d:
                all_rows.append(d["raw_data"])
        return all_rows

class ConsoleEmailService:
    def send_email(self, subject, recipients, body, attachment_path=None, app_instance=None):
        print("\n" + "="*30)
        print(f" [DEV] MOCK EMAIL SENT")
        print(f" To: {recipients}")
        print(f" Subject: {subject}")
        print(f" Attch: {attachment_path}")
        print("-" * 10)
        print(body)
        print("="*30 + "\n")

class FlaskMailService:
    def __init__(self, mail_instance, sender):
        self.mail = mail_instance
        self.sender = sender

    def send_email(self, subject, recipients, body, attachment_path=None, attachment_name=None, app_instance=None):
        # app_instance needed for open_resource context if not in request context
        msg = Message(subject=subject, sender=self.sender, recipients=recipients)
        msg.body = body
        
        if attachment_path and os.path.exists(attachment_path):
            with open(attachment_path, 'rb') as f:
                 msg.attach(attachment_name or os.path.basename(attachment_path), 
                            "application/octet-stream", f.read())
        
        try:
            self.mail.send(msg)
        except Exception as e:
            print(f"Error sending email via Flask-Mail: {e}")

# Factory / Setup
def get_data_manager(collection_name):
    # Check for Firebase Key
    if os.path.exists("firebase_key.json"):
        try:
            return FirebaseDataManager("firebase_key.json", collection_name)
        except Exception as e:
            print(f"Failed to init Firebase: {e}")

    # Check for GSheets credentials (Legacy/Alternative)
    if os.path.exists("credentials.json"):
        try:
            scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
            return GSheetsDataManager("credentials.json", scope, collection_name)
        except Exception as e:
            print(f"Failed to init GSheets for {collection_name}: {e}. Falling back to Local.")
    return LocalDataManager(collection_name)

def get_email_service(app, mail):
    if app.config.get("MAIL_USERNAME") and app.config.get("MAIL_PASSWORD"):
        return FlaskMailService(mail, app.config["MAIL_USERNAME"])
    return ConsoleEmailService()
