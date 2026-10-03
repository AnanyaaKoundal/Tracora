"""Direct Mongo access for offline indexing scripts only.

The running ai-service never imports this: it reads tenant data from Express. The
reindex and connectivity scripts are operators' tools and keep their own connection so
the service itself has no database credentials to leak.
"""

from pymongo import MongoClient
from pymongo.database import Database

from app.config import settings

_client: MongoClient | None = None


def get_client() -> MongoClient:
    global _client
    if _client is None:
        if not settings.mongo_uri:
            raise RuntimeError("MONGO_URI must be set to run the indexing scripts")
        _client = MongoClient(
            settings.mongo_uri,
            serverSelectionTimeoutMS=5000,
        )
    return _client


def get_db() -> Database:
    client = get_client()
    if settings.mongo_db:
        return client[settings.mongo_db]
    return client.get_default_database()


def ping() -> bool:
    get_client().admin.command("ping")
    return True


def list_collections() -> list[str]:
    return sorted(get_db().list_collection_names())


def count_documents(collection: str, query: dict | None = None) -> int:
    return get_db()[collection].count_documents(query or {})


def find_bugs(company_id: str | None = None, limit: int = 5) -> list[dict]:
    query = {"company_id": company_id} if company_id else {}
    cursor = get_db()["bugs"].find(query, {"_id": 0}).limit(limit)
    return list(cursor)


def all_bugs() -> list[dict]:
    return list(get_db()["bugs"].find({}, {"_id": 0}))


def all_projects(company_id: str | None = None) -> list[dict]:
    query = {"company_id": company_id} if company_id else {}
    return list(get_db()["projects"].find(query, {"_id": 0}))


def find_bug(bug_id: str, company_id: str | None = None) -> dict | None:
    query: dict = {"bug_id": bug_id}
    if company_id:
        query["company_id"] = company_id
    return get_db()["bugs"].find_one(query, {"_id": 0})


def find_project(project_id: str, company_id: str | None = None) -> dict | None:
    query: dict = {"project_id": project_id}
    if company_id:
        query["company_id"] = company_id
    return get_db()["projects"].find_one(query, {"_id": 0})
