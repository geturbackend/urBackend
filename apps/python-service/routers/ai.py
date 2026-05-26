import asyncio
import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Union
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from config import settings
from dependencies import verify_signature

router = APIRouter(prefix="/ai", tags=["ai"], dependencies=[Depends(verify_signature)])
logger = logging.getLogger(__name__)

class FilterItem(BaseModel):
    field: str = Field(description="The exact field name from the schema")
    operator: str = Field(description="One of: '=', '_gt', '_lt', '_gte', '_lte', '_ne', '_regex'")
    value: Union[str, int, float, bool] = Field(description="The value to filter by")

class QueryResult(BaseModel):
    filters: List[FilterItem] = Field(default_factory=list, description="List of MongoDB filters to apply to the frontend")
    sort: str = Field(default="-createdAt", description="MongoDB sort string, e.g. '-createdAt' or 'name'. Default to '-createdAt'")

class QueryBuilderRequest(BaseModel):
    prompt: str
    schema_fields: List[dict]

@router.post("/query-builder", response_model=QueryResult)
async def query_builder(request: QueryBuilderRequest):
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Groq API key not configured")
        
    try:
        # Initialize Groq LLM
        llm = ChatGroq(api_key=settings.GROQ_API_KEY, model_name="llama-3.1-8b-instant", temperature=0)
        
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
DO NOT output a raw MongoDB filter dict like `{{"price": {{"$gt": 1000}} }}`. 
Correct format: `[{{ "field": "price", "operator": "_gt", "value": 1000 }}]`.

Schema Fields: {schema}"""

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{user_prompt}")
        ])
        
        # Create the LangChain chain
        chain = prompt | structured_llm
        
        # Invoke the chain with a timeout to prevent hanging requests
        result = await asyncio.wait_for(
            chain.ainvoke({
                "schema": str(request.schema_fields),
                "user_prompt": request.prompt
            }),
            timeout=15.0
        )
        
        return result
        
    except asyncio.TimeoutError as e:
        logger.error("AI Query Builder timeout", exc_info=True)
        raise HTTPException(status_code=504, detail="AI request timed out") from e
    except Exception as e:
        logger.error("AI Query Builder failed", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error") from e
