from motor.motor_asyncio import AsyncIOMotorClient
import redis.asyncio as aioredis
from app.core.config import settings

# MongoDB
_mongo_client: AsyncIOMotorClient = None


async def get_mongo_client() -> AsyncIOMotorClient:
    global _mongo_client
    if _mongo_client is None:
        _mongo_client = AsyncIOMotorClient(settings.MONGODB_URL)
    return _mongo_client


async def get_mongo_db():
    client = await get_mongo_client()
    return client[settings.MONGODB_DB]


# Redis
_redis_client = None


async def get_redis():
    global _redis_client
    if _redis_client is None:
        _redis_client = await aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis_client


async def close_connections():
    global _mongo_client, _redis_client
    if _mongo_client:
        _mongo_client.close()
    if _redis_client:
        await _redis_client.close()
