import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.llm.embedder import embed_query

LOGIN = "Login button does nothing on the checkout page"
SIGNIN = "Sign in is broken when paying on the cart screen"
KAFKA = "Kafka consumer fails to connect to the broker"


def cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    return dot / (norm_a * norm_b)


def main() -> None:
    vectors = {
        LOGIN: embed_query(LOGIN),
        SIGNIN: embed_query(SIGNIN),
        KAFKA: embed_query(KAFKA),
    }

    print(f"Dimensions: {len(vectors[LOGIN])}")
    print(f"Model: nomic-embed-text via Ollama\n")

    print(f"related   (cosine {cosine(vectors[LOGIN], vectors[SIGNIN]):.3f})  {SIGNIN}")
    print(f"unrelated (cosine {cosine(vectors[LOGIN], vectors[KAFKA]):.3f})  {KAFKA}")


if __name__ == "__main__":
    main()
