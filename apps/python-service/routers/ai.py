import asyncio
import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import List, Union, Literal
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
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

class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class CollectionField(BaseModel):
    name: str
    type: str
    required: bool = False
    ref: str | None = None
    unique: bool = False
    default: Union[str, int, float, bool, None] = None
    items: dict | None = None
    fields: list["CollectionField"] | None = None

    @model_validator(mode='after')
    def validate_field(self):
        if self.type == "Object":
            if self.fields is None or len(self.fields) == 0:
                raise ValueError("fields must be present and non-empty for Object type")
        
        if self.default is not None:
            if self.required:
                raise ValueError("default is not allowed on required fields")
            if self.type not in ["String", "Number", "Boolean"]:
                raise ValueError(f"default is not allowed on {self.type} fields")
                
            if self.type == "Boolean" and not isinstance(self.default, bool):
                raise ValueError("default must be boolean for Boolean fields")
            elif self.type == "Number" and not (isinstance(self.default, (int, float)) and not isinstance(self.default, bool)):
                raise ValueError("default must be numeric for Number fields")
            elif self.type == "String" and not isinstance(self.default, str):
                raise ValueError("default must be string for String fields")
                
        return self

class CollectionSchema(BaseModel):
    collection: str
    fields: list[CollectionField]

class CollectionCreatorRequest(BaseModel):
    messages: list[Message]
    developer_id: str
    plan: str = "free"
    encrypted_byok: EncryptedByok | None = None
    model: str = "llama-3.3-70b-versatile"

class CollectionCreatorResponse(BaseModel):
    type: Literal["clarify", "schema", "complete"]
    message: str
    schema_: list[CollectionSchema] | None = Field(default=None, alias="schema", description="MUST be null if type is 'clarify' or 'complete'")
    
    model_config = ConfigDict(populate_by_name=True)

    @model_validator(mode='after')
    def check_schema_presence(self):
        if self.type == "schema" and not self.schema_:
            raise ValueError("schema_ must not be empty when type is 'schema'")
        return self

@router.post("/query-builder", response_model=QueryResult)
async def query_builder(request: QueryBuilderRequest, req: Request):
    trace_id = req.headers.get("x-trace-id", "unknown")
    logger.info(
        "[Trace: %s] 📥 Received /ai/query-builder request | developer_id=%s, plan=%s, schema_fields=%d, prompt=%r",
        trace_id,
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

        logger.info("[Trace: %s] 🤖 Invoking LangChain LLM chain (15s timeout) for developer_id=%s...", trace_id, request.developer_id)

        # Invoke the chain with a timeout to prevent hanging requests
        result = await asyncio.wait_for(
            chain.ainvoke({
                "schema": str(request.schema_fields),
                "user_prompt": request.prompt
            }),
            timeout=15.0
        )

        logger.info(
            "[Trace: %s] ✅ AI Query Builder success for developer_id=%s | %d filter(s) generated, sort=%r",
            trace_id,
            request.developer_id,
            len(result.filters),
            result.sort,
        )
        return result

    except HTTPException as e:
        logger.warning("[Trace: %s] ⚠️ AI Query Builder rejected with HTTP %d for developer_id=%s: %s", trace_id, e.status_code, request.developer_id, e.detail)
        raise  # Re-raise BYOK/rate-limit errors as-is
    except asyncio.TimeoutError as e:
        logger.error("[Trace: %s] ⏱️ AI Query Builder request timed out after 15s for developer_id=%s", trace_id, request.developer_id, exc_info=True)
        raise HTTPException(status_code=504, detail="AI request timed out") from e
    except Exception as e:
        error_name = e.__class__.__name__
        logger.error("[Trace: %s] ❌ AI Query Builder unhandled failure for developer_id=%s: %s", trace_id, request.developer_id, e, exc_info=True)
        if "Tool use is not supported" in str(e) or "tools" in str(e).lower():
            raise HTTPException(status_code=400, detail="This model doesn't support complex structured outputs. Please switch to llama-3.3-70b-versatile.") from e
        if "BadRequest" in error_name or "Validation" in error_name:
            raise HTTPException(status_code=400, detail="The AI generated an invalid query format. Please rephrase or simplify your prompt.") from e
        raise HTTPException(status_code=500, detail="Internal server error") from e

@router.post("/collection-creator", response_model=CollectionCreatorResponse)
async def collection_creator(request: CollectionCreatorRequest, req: Request):
    trace_id = req.headers.get("x-trace-id", "unknown")
    logger.info(
        "[Trace: %s] 📥 Received /ai/collection-creator request | developer_id=%s, plan=%s, msgs=%d",
        trace_id,
        request.developer_id,
        request.plan,
        len(request.messages),
    )
    try:
        # Resolve AI client
        llm = await resolve_ai_client(
            developer_id=request.developer_id,
            plan=request.plan,
            encrypted_byok=request.encrypted_byok.model_dump() if request.encrypted_byok else None,
            feature="collection-creator",
            increment=(len(request.messages) == 1),
            model=request.model,
        )

        structured_llm = llm.with_structured_output(CollectionCreatorResponse)

        system_prompt = """You are a MongoDB schema designer for urBackend, a Backend-as-a-Service platform.

Rules:
1. If the description is vague, ask 2-3 specific clarifying questions and set type: "clarify". You MUST set "schema": null. NEVER ask more than 3 at once.
2. Once you have enough context, propose a schema and set type: "schema".
3. Only use these field types: String, Number, Boolean, Date, Ref, Array, Object. For Ref, ALWAYS set 'ref' to the referenced collection name e.g. 'users'. For Array, set 'items' to describe item type e.g. {"type": "String"}. For Object, set 'fields' as a list of sub-fields. Do NOT use Object as a lazy catch-all — prefer specific flat fields when possible.
4. If a field is NOT required, you may suggest a default value using the 'default' key (value type must exactly match the field type). Do not provide defaults for required fields or complex types.
5. ALWAYS include "createdAt" (type: Date, required: true) in EVERY collection.
6. Suggest Ref to "users" where ownership applies (ownerId, authorId, userId, etc.) with 'ref': 'users'.
6. NEVER generate a collection named "users" — it is reserved for auth.
7. When the developer confirms satisfaction ("looks good", "yes", "create it", "perfect") -> set type: "complete", set "schema": null, and in your message, clearly tell the developer that their schema is finalized and guide them to click the "Insert All" button in the Schema Preview panel on the right to create the collections in their database. NEVER claim that you have already created the collections yourself.
8. The "schema" field MUST ALWAYS BE AN ARRAY (LIST) OF OBJECTS. Even if you are proposing a single collection, you must wrap it in an array like: `"schema": [ { "collection": "...", "fields": [...] } ]`. If `type` is "clarify" or "complete", you MUST set `"schema": null`.
9. Respond ONLY in the defined JSON structure. No prose outside the message field."""

        # Convert our Message models to a format LangChain likes
        lc_messages = [SystemMessage(content=system_prompt)]
        for msg in request.messages:
            if msg.role == "user":
                lc_messages.append(HumanMessage(content=msg.content))
            else:
                lc_messages.append(AIMessage(content=msg.content))

        logger.info("[Trace: %s] 🤖 Invoking LangChain LLM (30s timeout) for developer_id=%s...", trace_id, request.developer_id)

        result = await asyncio.wait_for(
            structured_llm.ainvoke(lc_messages),
            timeout=30.0
        )

        logger.info(
            "[Trace: %s] ✅ AI Collection Creator success for developer_id=%s | type=%r, schema collections=%d",
            trace_id,
            request.developer_id,
            result.type,
            len(result.schema_) if result.schema_ else 0,
        )
        return result

    except HTTPException as e:
        logger.warning("[Trace: %s] ⚠️ AI Collection Creator rejected with HTTP %d for developer_id=%s: %s", trace_id, e.status_code, request.developer_id, e.detail)
        raise
    except asyncio.TimeoutError as e:
        logger.error("[Trace: %s] ⏱️ AI Collection Creator request timed out after 30s for developer_id=%s", trace_id, request.developer_id, exc_info=True)
        raise HTTPException(status_code=504, detail="AI request timed out") from e
    except Exception as e:
        error_name = e.__class__.__name__
        logger.error("[Trace: %s] ❌ AI Collection Creator unhandled failure for developer_id=%s: %s", trace_id, request.developer_id, e, exc_info=True)
        if "Tool use is not supported" in str(e) or "tools" in str(e).lower():
            raise HTTPException(status_code=400, detail="This model doesn't support complex structured outputs. Please switch to llama-3.3-70b-versatile.") from e
        if "BadRequest" in error_name or "Validation" in error_name:
            raise HTTPException(status_code=400, detail="The AI generated an invalid response format. Please rephrase or simplify your prompt.") from e
        raise HTTPException(status_code=500, detail="Internal server error") from e

