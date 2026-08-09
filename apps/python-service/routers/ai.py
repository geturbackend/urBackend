import asyncio
import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Union
from langchain_core.prompts import ChatPromptTemplate
from config import settings
from dependencies import verify_signature
from services.byok import resolve_ai_client

router = APIRouter(prefix="/ai", tags=["ai"], dependencies=[Depends(verify_signature)])
logger = logging.getLogger("routers.ai")

class FilterItem(BaseModel):
    field: str = Field(description="The exact field name from the schema")
    operator: str = Field(description="One of: '=', '_gt', '_lt', '_gte', '_lte', '_ne', '_regex'")
    value: Union[str, int, float, bool] = Field(description="The value to filter by")

class QueryResult(BaseModel):
    filters: List[FilterItem] = Field(default_factory=list, description="List of MongoDB filters to apply to the frontend")
    sort: str = Field(default="-createdAt", description="MongoDB sort string, e.g. '-createdAt' or 'name'. Default to '-createdAt'")

class EncryptedKeyPayload(BaseModel):
    iv: str
    encryptedData: str
    authTag: str

class EncryptedByok(BaseModel):
    groqKey: EncryptedKeyPayload | None = None

class QueryBuilderRequest(BaseModel):
    prompt: str
    schema_fields: List[dict]
    developer_id: str
    plan: str = "free"
    encrypted_byok: EncryptedByok | None = None

@router.post("/query-builder", response_model=QueryResult)
async def query_builder(request: QueryBuilderRequest):
    logger.info(
        "📥 Received /ai/query-builder request | developer_id=%s, plan=%s, schema_fields=%d, prompt=%r",
        request.developer_id,
        request.plan,
        len(request.schema_fields),
        request.prompt[:120] if len(request.prompt) > 120 else request.prompt,
    )
    try:
        # Resolve the AI client (BYOK → Pro → Free with limits)
        llm = await resolve_ai_client(
            developer_id=request.developer_id,
            plan=request.plan,
            encrypted_byok=request.encrypted_byok.model_dump() if request.encrypted_byok else None,
        )

        # Enforce structured output based on our Pydantic schema
        structured_llm = llm.with_structured_output(QueryResult)

        # Build the system prompt
        system_prompt = """You are a highly intelligent database query builder for a MongoDB-based BaaS called urBackend.
Your job is to take the user's natural language request and convert it into a set of structured filters and a sort string.
You will be provided with the exact schema of the collection. You MUST ONLY use the fields defined in the schema.
Do NOT hallucinate fields that do not exist.
If the user's prompt is vague, use your best judgement based on the available schema fields.

CRITICAL INSTRUCTION:
Your `filters` output MUST be a list (array) of objects matching the FilterItem schema exactly (each having `field`, `operator`, and `value`).
DO NOT output a raw MongoDB filter dict like {{"price": {{"$gt": 1000}} }}. 
Correct format: [{{ "field": "price", "operator": "_gt", "value": 1000 }}].

Schema Fields: {schema}"""

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{user_prompt}")
        ])

        # Create the LangChain chain
        chain = prompt | structured_llm

        logger.info("🤖 Invoking LangChain LLM chain (15s timeout) for developer_id=%s...", request.developer_id)

        # Invoke the chain with a timeout to prevent hanging requests
        result = await asyncio.wait_for(
            chain.ainvoke({
                "schema": str(request.schema_fields),
                "user_prompt": request.prompt
            }),
            timeout=15.0
        )

        logger.info(
            "✅ AI Query Builder success for developer_id=%s | %d filter(s) generated, sort=%r",
            request.developer_id,
            len(result.filters),
            result.sort,
        )
        return result

    except HTTPException as e:
        logger.warning("⚠️ AI Query Builder rejected with HTTP %d for developer_id=%s: %s", e.status_code, request.developer_id, e.detail)
        raise  # Re-raise BYOK/rate-limit errors as-is
    except asyncio.TimeoutError as e:
        logger.error("⏱️ AI Query Builder request timed out after 15s for developer_id=%s", request.developer_id, exc_info=True)
        raise HTTPException(status_code=504, detail="AI request timed out") from e
    except Exception as e:
        logger.error("❌ AI Query Builder unhandled failure for developer_id=%s: %s", request.developer_id, e, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error") from e

