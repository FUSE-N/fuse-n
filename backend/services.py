import os
import json
import datetime
from flask_mail import Message
from supabase import create_client, Client
import stripe
import paystack

class SupabaseDataManager:
    def __init__(self, collection_name):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
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
        
        try:
            self.supabase.table(self.table_name).insert(data).execute()
        except Exception as e:
            print(f"[Error] Failed to save to Supabase: {e}")

    def get_all_values(self):
        if not self.supabase:
            return []
        try:
            response = self.supabase.table(self.table_name).select("*").execute()
            return response.data
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
        try:
            with open(self.filename, 'r') as f:
                db_data = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            db_data = []

        db_data.append(data)
        
        with open(self.filename, 'w') as f:
            json.dump(db_data, f, indent=4)

    def get_all_values(self):
        try:
            with open(self.filename, 'r') as f:
                data = json.load(f)
                return data[::-1]
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

class StripeService:
    def __init__(self):
        self.secret_key = os.getenv("STRIPE_SECRET_KEY")
        stripe.api_key = self.secret_key

    def create_checkout_session(self, price, product_name, success_url, cancel_url):
        if not self.secret_key:
            raise Exception("Stripe secret key not configured")
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': product_name,
                        },
                        'unit_amount': price,
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=success_url,
                cancel_url=cancel_url,
            )
            return session
        except Exception as e:
            print(f"Error creating Stripe session: {e}")
            return None

class PaystackService:
    def __init__(self):
        self.secret_key = os.getenv("PAYSTACK_SECRET_KEY")
        paystack.api_key = self.secret_key

    def verify_payment(self, reference):
        if not self.secret_key:
            raise Exception("Paystack secret key not configured")
        try:
            return paystack.Transaction.verify(reference)
        except Exception as e:
            print(f"Error verifying Paystack payment: {e}")
            return None

def get_data_manager(collection_name):
    if os.getenv("SUPABASE_URL") and (os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")):
        return SupabaseDataManager(collection_name)
    return LocalDataManager(collection_name)

def get_email_service(app, mail):
    if app.config.get("MAIL_USERNAME") and app.config.get("MAIL_PASSWORD"):
        return FlaskMailService(mail, app.config["MAIL_USERNAME"])
    return ConsoleEmailService()

def get_payment_service(gateway):
    if gateway == 'stripe':
        return StripeService()
    elif gateway == 'paystack':
        return PaystackService()
    else:
        raise ValueError(f"Unsupported payment gateway: {gateway}")
