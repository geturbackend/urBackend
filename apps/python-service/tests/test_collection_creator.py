import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from main import app
from routers.ai import CollectionCreatorResponse

client = TestClient(app)

from dependencies import verify_signature

@pytest.fixture(autouse=True)
def mock_verify_signature_override():
    original = app.dependency_overrides.get(verify_signature)
    app.dependency_overrides[verify_signature] = lambda: True
    yield
    if original is not None:
        app.dependency_overrides[verify_signature] = original
    else:
        app.dependency_overrides.pop(verify_signature, None)

@pytest.mark.asyncio
async def test_collection_creator_schema_validation_rejection():
    # If the LLM generates type="schema" but schema_ is null/missing, Pydantic should reject it
    # We simulate this by mocking the LLM to return a dict that fails our Pydantic model validation.
    payload = {
        "messages": [{"role": "user", "content": "Make an ecommerce app"}],
        "developer_id": "dev123",
        "plan": "free"
    }
    
    with patch("routers.ai.resolve_ai_client") as mock_resolve:
        from unittest.mock import MagicMock
        from pydantic import ValidationError
        mock_llm = MagicMock()
        mock_structured = AsyncMock()
        
        # When ainvoke is called, simulate a validation error thrown by Langchain/Pydantic
        mock_structured.ainvoke = AsyncMock(side_effect=ValidationError.from_exception_data(title="CollectionCreatorResponse", line_errors=[]))
        
        mock_llm.with_structured_output.return_value = mock_structured
        mock_resolve.return_value = mock_llm

        response = client.post(
            "/ai/collection-creator",
            json=payload,
            headers={"X-Internal-Signature": "fake_sig"}
        )
        
        # Pydantic validation errors from Langchain result in 400 Bad Request
        assert response.status_code == 400

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

def test_collection_field_object_validation():
    from routers.ai import CollectionField
    from pydantic import ValidationError

    # 1. Reject missing fields on Object
    with pytest.raises(ValidationError) as exc:
        CollectionField(name="profile", type="Object")
    assert "fields must be present and non-empty for Object type" in str(exc.value)

    # 2. Reject None fields on Object
    with pytest.raises(ValidationError) as exc:
        CollectionField(name="profile", type="Object", fields=None)
    assert "fields must be present and non-empty for Object type" in str(exc.value)

    # 3. Reject empty fields list on Object
    with pytest.raises(ValidationError) as exc:
        CollectionField(name="profile", type="Object", fields=[])
    assert "fields must be present and non-empty for Object type" in str(exc.value)

    # 4. Valid Object with non-empty fields
    valid_field = CollectionField(
        name="profile",
        type="Object",
        fields=[CollectionField(name="bio", type="String", required=True)]
    )
    assert valid_field.name == "profile"
    assert valid_field.type == "Object"
    assert len(valid_field.fields) == 1
    assert valid_field.fields[0].name == "bio"

    # 5. Non-Object fields do not require fields
    valid_string = CollectionField(name="title", type="String")
    assert valid_string.name == "title"
    assert valid_string.fields is None

