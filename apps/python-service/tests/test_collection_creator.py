import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from main import app
from routers.ai import CollectionCreatorResponse

client = TestClient(app)

from dependencies import verify_signature

app.dependency_overrides[verify_signature] = lambda: True

@pytest.mark.asyncio
async def test_collection_creator_success():
    payload = {
        "messages": [{"role": "user", "content": "Make an ecommerce app"}],
        "developer_id": "dev123",
        "plan": "free",
        "encrypted_byok": None
    }
    
    mock_schema_response = CollectionCreatorResponse(
        type="schema",
        message="Here is your schema",
        schema_=[
            {
                "collection": "products",
                "fields": [
                    {"name": "title", "type": "String", "required": True}
                ]
            }
        ]
    )

    with patch("routers.ai.resolve_ai_client") as mock_resolve:
        from unittest.mock import MagicMock
        mock_llm = MagicMock()
        mock_structured = AsyncMock()
        mock_structured.ainvoke = AsyncMock(return_value=mock_schema_response)
        
        # mock with_structured_output to return our mock_structured
        mock_llm.with_structured_output.return_value = mock_structured
        mock_resolve.return_value = mock_llm

        response = client.post(
            "/ai/collection-creator",
            json=payload,
            headers={
                "X-Internal-Signature": "fake_sig",
                "X-Timestamp": "1234567890",
                "X-Trace-Id": "test-trace-id"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "schema"
        assert len(data["schema"]) == 1
        assert data["schema"][0]["collection"] == "products"

@pytest.mark.asyncio
async def test_collection_creator_timeout():
    payload = {
        "messages": [{"role": "user", "content": "timeout test"}],
        "developer_id": "dev123"
    }

    with patch("routers.ai.resolve_ai_client") as mock_resolve:
        from unittest.mock import MagicMock
        mock_llm = MagicMock()
        mock_structured = AsyncMock()
        
        import asyncio
        async def delayed_invoke(*args, **kwargs):
            await asyncio.sleep(0.2)
            return None
            
        mock_structured.ainvoke = delayed_invoke
        mock_llm.with_structured_output.return_value = mock_structured
        mock_resolve.return_value = mock_llm

        with patch("asyncio.wait_for", side_effect=asyncio.TimeoutError()):
            response = client.post(
                "/ai/collection-creator",
                json=payload,
                headers={"X-Internal-Signature": "fake"}
            )
            
            assert response.status_code == 504
