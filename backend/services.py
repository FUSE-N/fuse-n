import os
import json
import datetime
from flask_mail import Message
from supabase import create_client, Client

class SupabaseDataManager:
    def __init__(self, collection_name):
        self.url = os.getenv("SUPABASE_URL")
        # Prefer Service Role Key for backend operations
        self.key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
        self.table_name = collection_name.lower().replace(" ", "_")
        
        if not self.url or not self.key:
            self.supabase = None
            print(f"[Warn] Supabase credentials missing for {collection_name}")
        else:
            try:
                self.supabase: Client = create_client(self.url, self.key)
            except Exception as e:
                self.supabase = None
                print(f"[Error] Failed to initialize Supabase client: {e}")

    def append_row(self, data):
        if not self.supabase:
            print("[Error] Supabase client not initialized")
            return
        
        # Map list to dictionary
        if self.table_name == "client_project_submissions":
            row_data = {
                "date_submitted": data[0],
                "project_id": data[1],
                "name": data[2],
                "email": data[3],
                "title": data[4],
                "service": data[5],
                "description": data[6],
                "tools": data[7],
                "deadline": data[8],
                "budget": data[9],
                "file_path": data[10]
            }
        elif self.table_name == "community_posts":
            row_data = {
                "date_posted": data[0],
                "name": data[1],
                "content": data[2]
            }
        elif self.table_name == "activity_log":
            row_data = {
                "timestamp": data[0],
                "activity_type": data[1],
                "details": data[2]
            }
        else:
            row_data = {"raw_data": data}

        try:
            self.supabase.table(self.table_name).insert(row_data).execute()
        except Exception as e:
            print(f"[Error] Failed to save to Supabase: {e}")

    def get_all_values(self):
        if not self.supabase:
            return []
        try:
            # Note: We assume 'id' or 'timestamp' exists for ordering
            order_col = "timestamp" if self.table_name == "activity_log" else "id"
            # Attempt to select all and order
            try:
                response = self.supabase.table(self.table_name).select("*").order(order_col, descending=True).execute()
            except:
                response = self.supabase.table(self.table_name).select("*").execute()
            
            data = response.data
            all_rows = []
            for row in data:
                if self.table_name == "client_project_submissions":
                    all_rows.append([
                        row.get("date_submitted"),
                        row.get("project_id"),
                        row.get("name"),
                        row.get("email"),
                        row.get("title"),
                        row.get("service"),
                        row.get("description"),
                        row.get("tools"),
                        row.get("deadline"),
                        row.get("budget"),
                        row.get("file_path")
                    ])
                elif self.table_name == "community_posts":
                    all_rows.append([
                        row.get("date_posted"),
                        row.get("name"),
                        row.get("content")
                    ])
                elif self.table_name == "activity_log":
                    all_rows.append([
                        row.get("timestamp"),
                        row.get("activity_type"),
                        row.get("details")
                    ])
                else:
                    # Fallback for generic tables
                    all_rows.append(row.get("raw_data", []))
            return all_rows
        except Exception as e:
            print(f"[Error] Failed to fetch from Supabase: {e}")
            return []

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

    def get_all_values(self):
        """Return all data as a list of lists."""
        try:
            with open(self.filename, 'r') as f:
                data = json.load(f)
                return data[::-1] # Newest first locally too
        except Exception:
            return []

class ConsoleEmailService:
    def send_email(self, subject, recipients, body, attachment_path=None, app_instance=None):
        print("\n" + "="*30)
        print(f" [DEV] MOCK EMAIL SENT")
        print(f" To: {recipients}")
        print(f" Subject: {subject}")
        print("-" * 10)
        print(body)
        print("="*30 + "\n")

class FlaskMailService:
    def __init__(self, mail_instance, sender):
        self.mail = mail_instance
        self.sender = sender

    def send_email(self, subject, recipients, body, attachment_path=None, attachment_name=None):
        msg = Message(subject=subject, sender=self.sender, recipients=recipients)
        msg.body = body
        
        if attachment_path and os.path.exists(attachment_path):
            with open(attachment_path, 'rb') as f:
                 msg.attach(attachment_name or os.path.basename(attachment_path), 
                            "application/octet-stream", f.read())
        
        try:
            self.mail.send(msg)
        except Exception as e:
            print(f"Error sending email: {e}")

# Factory / Setup
def get_data_manager(collection_name):
    # Prefer Supabase
    if os.getenv("SUPABASE_URL") and (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")):
        return SupabaseDataManager(collection_name)
    # Fallback to Local JSON
    return LocalDataManager(collection_name)

def get_email_service(app, mail):
    if app.config.get("MAIL_USERNAME") and app.config.get("MAIL_PASSWORD"):
        return FlaskMailService(mail, app.config["MAIL_USERNAME"])
    return ConsoleEmailService()
