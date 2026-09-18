from pymongo import MongoClient

from config import settings


client = MongoClient(settings.mongo_uri, serverSelectionTimeoutMS=3000)
database = client[settings.mongo_db]
users_collection = database["users"]
institutions_collection = database["institutions"]
patient_files_collection = database["patient_files"]


def ensure_indexes() -> None:
    users_collection.create_index("email", unique=True)
    users_collection.create_index([("institution_id", 1), ("role", 1), ("status", 1)])
    institutions_collection.create_index("name", unique=True)
    patient_files_collection.create_index([("institution_id", 1), ("created_at", -1)])
    patient_files_collection.create_index("created_by")